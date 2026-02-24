import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../src/utils/io.js";
import { replayCase } from "../src/workflow/replayCase.js";
import { evaluateEvent } from "../src/workflow/evaluateEvent.js";
import { buildReplayPackage } from "../src/workflow/buildReplayPackage.js";
import { fetchChainlinkPrice } from "../src/evidence/chainlinkFeed.js";
import { collectLiveEvidence } from "../src/evidence/liveCollector.js";
import { recordOnChain } from "../src/workflow/onchainRecorder.js";

const root = process.cwd();
const policyPath = path.join(root, "configs/policy.v1.json");

test("case-a should produce AUTO_RESOLVE on T+1h", async () => {
  const caseDir = path.join(root, "data/replay/case-a");
  const outDir = path.join(root, "artifacts/reports/test-a");
  const results = await replayCase({ caseDir, policyPath, outputDir: outDir, checkpoint: "T+1h" });
  assert.equal(results.length, 1);
  assert.equal(results[0].final_state, "AUTO_RESOLVE_RECOMMENDED");
});

test("case-b should produce HOLD on T+1h due conflict", async () => {
  const caseDir = path.join(root, "data/replay/case-b");
  const outDir = path.join(root, "artifacts/reports/test-b");
  const results = await replayCase({ caseDir, policyPath, outputDir: outDir, checkpoint: "T+1h" });
  assert.equal(results.length, 1);
  assert.equal(results[0].final_state, "HOLD_FOR_REVIEW");
});

test("insufficient sources should REJECT", async () => {
  const policy = await readJson(policyPath);
  const eventSpec = {
    event_id: "reject-case",
    market_id: "pm-reject",
    question: "Q",
    rule_text: "resolves yes if >= 100000",
    market_end_time: "2026-03-01T00:00:00Z",
    evaluation_time: "2026-03-01T01:00:00Z",
    numeric_rule: { operator: ">=", threshold: 100000 }
  };
  const evidenceRecords = [
    { evidence_id: "x1", event_id: "reject-case", source_id: "single", source_type: "price", timestamp: "2026-03-01T01:00:00Z", normalized_value: 100100 }
  ];

  const report = await evaluateEvent({ eventSpec, evidenceRecords, policy });
  assert.equal(report.policy_evaluation.final_state, "REJECTED_INSUFFICIENT_EVIDENCE");
});

test("stale evidence should HOLD when max age is exceeded", async () => {
  const policy = await readJson(policyPath);
  const eventSpec = {
    event_id: "stale-case",
    market_id: "pm-stale",
    question: "Q",
    rule_text: "resolves yes if >= 100000",
    market_end_time: "2026-03-01T00:00:00Z",
    evaluation_time: "2026-03-01T01:00:00Z",
    numeric_rule: { operator: ">=", threshold: 100000 }
  };
  const evidenceRecords = [
    { evidence_id: "s1", event_id: "stale-case", source_id: "binance", source_type: "price", timestamp: "2026-02-28T23:00:00Z", normalized_value: 100200 },
    { evidence_id: "s2", event_id: "stale-case", source_id: "coinbase", source_type: "price", timestamp: "2026-02-28T23:00:00Z", normalized_value: 100210 },
    { evidence_id: "s3", event_id: "stale-case", source_id: "chainlink", source_type: "price", timestamp: "2026-02-28T23:00:00Z", normalized_value: 100220 }
  ];

  const report = await evaluateEvent({ eventSpec, evidenceRecords, policy });
  assert.equal(report.policy_evaluation.final_state, "HOLD_FOR_REVIEW");
  assert.ok(report.policy_evaluation.reason_codes.includes("EVIDENCE_TOO_OLD"));
});

test("replay creates manifest and audit decision hash", async () => {
  const caseDir = path.join(root, "data/replay/case-a");
  const outDir = path.join(root, "artifacts/reports/test-manifest");
  const results = await replayCase({ caseDir, policyPath, outputDir: outDir, checkpoint: "T+1h" });
  assert.equal(results.length, 1);
  assert.ok(results[0].decision_hash);

  const manifest = await readJson(path.join(outDir, "case-a.manifest.json"));
  assert.equal(manifest.case_id, "case-a");
  assert.equal(manifest.checkpoint_count, 1);
  assert.ok(manifest.report_bundle_hash);
});

test("buildReplayPackage creates summary with package hash", async () => {
  const reportsDir = path.join(root, "artifacts/reports/test-package");
  await replayCase({ caseDir: path.join(root, "data/replay/case-a"), policyPath, outputDir: reportsDir });
  await replayCase({ caseDir: path.join(root, "data/replay/case-b"), policyPath, outputDir: reportsDir });

  const outDir = path.join(root, "artifacts/replay-package/test");
  const summary = await buildReplayPackage({ reportsDir, outputDir: outDir });

  assert.ok(summary.package_hash);
  assert.equal(summary.report_count, 6);
  assert.equal(summary.manifest_count, 2);
});

test("chainlinkFeed returns price or graceful error", async () => {
  const result = await fetchChainlinkPrice();
  // Either we got a price or a graceful error object
  assert.ok(result);
  assert.equal(result.source, "chainlink-mainnet");
  if (result.price != null) {
    assert.equal(typeof result.price, "number");
    assert.ok(result.price > 0);
    assert.ok(result.roundId);
  } else {
    // Network error — that's ok, just ensure graceful
    assert.ok(result.error);
  }
});

test("liveCollector returns EvidenceRecord-shaped objects", async () => {
  const records = await collectLiveEvidence("test-live");
  assert.ok(Array.isArray(records));
  // May be 0 if both sources fail (network), but shape should be correct if any
  for (const r of records) {
    assert.ok(r.evidence_id);
    assert.equal(r.event_id, "test-live");
    assert.ok(r.source_id);
    assert.ok(["onchain_oracle", "cex_spot", "aggregator", "price"].includes(r.source_type), `unexpected source_type: ${r.source_type}`);
    assert.ok(r.timestamp);
    assert.equal(typeof r.normalized_value, "number");
  }
});

test("onchainRecorder gracefully skips when no wallet configured", async () => {
  // Ensure env vars are NOT set
  const saved = { ...process.env };
  delete process.env.PRIVATE_KEY;
  delete process.env.REGISTRY_ADDRESS;
  delete process.env.RPC_URL;
  delete process.env.RECORDER_RPC_URL;

  const result = await recordOnChain({
    eventId: "test",
    decision: "YES",
    finalState: "AUTO_RESOLVE_RECOMMENDED",
    reasonCodes: ["OK"],
    decisionHash: "0x" + "ab".repeat(32)
  });

  assert.equal(result.status, "skipped");
  assert.ok(result.reason.includes("no wallet configured"));

  // Restore
  Object.assign(process.env, saved);
});
