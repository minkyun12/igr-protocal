#!/usr/bin/env node
import path from "node:path";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { evaluateEvent } from "../src/workflow/evaluateEvent.js";

class MockVotesToken {
  constructor(votesByAddress) {
    this.votesByAddress = { ...votesByAddress };
  }
  getPastVotes(address) {
    return Number(this.votesByAddress[address] || 0);
  }
  getPastTotalSupply() {
    return Object.values(this.votesByAddress).reduce((a, b) => a + Number(b), 0);
  }
}

class GovernanceRegistrySim {
  constructor(token) {
    this.token = token;
    this.votingPeriodMs = 48 * 60 * 60 * 1000;
    this.executionDelayMs = 24 * 60 * 60 * 1000;
    this.proposalThresholdBps = 100; // 1%
    this.quorumBps = 1000; // 10%
    this.nextProposalId = 1;
    this.proposals = new Map();
    this.lockedByMarket = new Map();
  }

  propose({ proposer, config, now }) {
    const total = this.token.getPastTotalSupply();
    const threshold = Math.floor((total * this.proposalThresholdBps) / 10000);
    if (this.token.getPastVotes(proposer) < threshold) {
      throw new Error("proposal threshold");
    }

    const id = this.nextProposalId++;
    this.proposals.set(id, {
      id,
      proposer,
      config,
      yesVotes: 0,
      noVotes: 0,
      startTime: now,
      endTime: now + this.votingPeriodMs,
      executableAt: null,
      executed: false,
      passed: false,
      voted: new Set(),
    });
    return id;
  }

  vote({ proposalId, voter, support, now }) {
    const p = this.proposals.get(proposalId);
    if (!p) throw new Error("proposal not found");
    if (now > p.endTime) throw new Error("voting ended");
    if (p.voted.has(voter)) throw new Error("already voted");
    p.voted.add(voter);

    const weight = this.token.getPastVotes(voter);
    if (support) p.yesVotes += weight;
    else p.noVotes += weight;
  }

  execute({ proposalId, now }) {
    const p = this.proposals.get(proposalId);
    if (!p) throw new Error("proposal not found");
    if (now <= p.endTime) throw new Error("voting active");
    if (p.executed) throw new Error("already executed");

    const total = this.token.getPastTotalSupply();
    const quorum = Math.floor((total * this.quorumBps) / 10000);
    const passed = p.yesVotes >= quorum && p.yesVotes > p.noVotes;

    p.executed = true;
    p.passed = passed;
    p.executableAt = now + this.executionDelayMs;
    return passed;
  }

  lockForMarket({ marketId, proposalId, now }) {
    const p = this.proposals.get(proposalId);
    if (!p?.executed) throw new Error("proposal not executed");
    if (!p.passed) throw new Error("proposal not passed");
    if (now < p.executableAt) throw new Error("execution delay active");
    this.lockedByMarket.set(String(marketId), p.config);
  }

  getLockedConfig(marketId) {
    const c = this.lockedByMarket.get(String(marketId));
    if (!c) throw new Error("config not locked");
    return c;
  }
}

function toRuntimePolicy(locked) {
  return {
    models: locked.modelPair,
    voted_prompts: locked.advisoryPrompts,
    optional_sources: locked.optionalSources,
    mismatch_policy: locked.mismatchPolicy,
    rerun_delay_hours: locked.rerunDelayHours,
    require_oracle_mandatory: false,
    require_cross_vendor: true,
    model_vendors: {
      adjudicatorA: "openai",
      adjudicatorB: "anthropic",
    },
  };
}

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((v) => {
      const [k, ...rest] = v.replace(/^--/, "").split("=");
      return [k, rest.join("=") || true];
    })
  );
  return {
    caseDir: path.resolve(String(args.case || "simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et")),
    outName: String(args.out || "governance-e2e-bitcoin.json"),
    configHash: String(args.configHash || "mock-config-hash-default"),
    marketId: Number(args.marketId || 1),
  };
}

async function main() {
  const opts = parseArgs();
  const caseDir = opts.caseDir;
  const eventSpec = JSON.parse(await readFile(path.join(caseDir, "event_spec.json"), "utf8"));
  const checkpoint = JSON.parse(await readFile(path.join(caseDir, "checkpoint-T0.json"), "utf8"));

  // 1) Mock token distribution
  const token = new MockVotesToken({
    "0xProposer": 1200,
    "0xVoterA": 4000,
    "0xVoterB": 3000,
    "0xVoterC": 1800,
  });

  // 2) Governance propose/vote/execute/lock
  const gov = new GovernanceRegistrySim(token);
  const t0 = Date.now();

  const proposalConfig = {
    modelPair: ["adjudicatorA", "adjudicatorB"],
    optionalSources: [],
    advisoryPrompts: [],
    mismatchPolicy: "split_immediate",
    rerunDelayHours: 0,
    configHash: opts.configHash,
    locked: true,
  };

  const proposalId = gov.propose({ proposer: "0xProposer", config: proposalConfig, now: t0 });
  gov.vote({ proposalId, voter: "0xVoterA", support: true, now: t0 + 1000 });
  gov.vote({ proposalId, voter: "0xVoterB", support: true, now: t0 + 2000 });
  gov.vote({ proposalId, voter: "0xVoterC", support: false, now: t0 + 3000 });

  const passed = gov.execute({ proposalId, now: t0 + 49 * 60 * 60 * 1000 });
  if (!passed) throw new Error("proposal unexpectedly failed");

  const marketId = opts.marketId;
  gov.lockForMarket({ proposalId, marketId, now: t0 + 74 * 60 * 60 * 1000 });
  const locked = gov.getLockedConfig(marketId);

  // 3) Evaluate with locked config
  const report = await evaluateEvent({
    eventSpec,
    evidenceRecords: checkpoint.evidence_records,
    policy: toRuntimePolicy(locked),
  });

  const outDir = path.resolve("simulation/output/e2e-bundle");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, opts.outName);

  const out = {
    summary: {
      flow: ["propose", "vote", "execute", "lockForMarket", "evaluate"],
      proposalId,
      marketId,
      yesVotes: gov.proposals.get(proposalId).yesVotes,
      noVotes: gov.proposals.get(proposalId).noVotes,
      final_state: report.policy_evaluation.final_state,
      final_settlement: report.policy_evaluation.final_settlement,
      reason_code: report.settlement.reason_code,
    },
    governance_locked_config: locked,
    evaluation_report_path: path.relative(path.resolve("."), outPath),
    report,
  };

  await writeFile(outPath, JSON.stringify(out, null, 2));

  console.log(JSON.stringify({ ok: true, outPath, summary: out.summary }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
