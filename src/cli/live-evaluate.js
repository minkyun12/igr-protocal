#!/usr/bin/env node
import { collectLiveEvidence } from "../evidence/liveCollector.js";
import { evaluateEvent } from "../workflow/evaluateEvent.js";
import { readJson } from "../utils/io.js";
import path from "node:path";

const root = process.cwd();
const policyPath = path.join(root, "configs/policy.v1.json");

/**
 * Scenario selector.
 *   --scenario=edge      (default) threshold = median price → sources disagree at the margin
 *   --scenario=comfort   threshold = price × 0.99 → likely YES but policy gates still run
 *   --scenario=stress    threshold = price × 1.01 → likely NO, tests rejection path
 *   --scenario=custom --threshold=<number>  user-specified threshold
 */
function parseArgs() {
  const raw = Object.fromEntries(
    process.argv.slice(2).map(v => {
      const [k, ...rest] = v.replace(/^--/, "").split("=");
      return [k, rest.join("=") || true];
    })
  );
  return {
    scenario: raw.scenario || "edge",
    customThreshold: raw.threshold ? Number(raw.threshold) : null,
    creMode: raw.cre || process.env.CRE_MODE || "sim"
  };
}

function buildScenario(scenario, medianPrice, customThreshold) {
  const scenarios = {
    edge: {
      // Threshold = floor of median → 소스 간 $50~200 차이가 결과를 갈름
      threshold: Math.floor(medianPrice),
      question: `Will BTC settle ≥ $${Math.floor(medianPrice).toLocaleString()} at resolution?`,
      description: "Edge case — threshold at current price, sources may disagree"
    },
    comfort: {
      // 1% 아래 → YES가 유력하지만 policy gate 작동 시연
      threshold: Math.floor(medianPrice * 0.99),
      question: `Will BTC settle ≥ $${Math.floor(medianPrice * 0.99).toLocaleString()} at resolution?`,
      description: "Comfort zone — likely YES, demonstrates auto-resolve path"
    },
    stress: {
      // 1% 위 → NO가 유력, rejection/hold 경로 시연
      threshold: Math.ceil(medianPrice * 1.01),
      question: `Will BTC settle ≥ $${Math.ceil(medianPrice * 1.01).toLocaleString()} at resolution?`,
      description: "Stress test — likely NO, demonstrates hold/reject path"
    },
    custom: {
      threshold: customThreshold || 100000,
      question: `Will BTC settle ≥ $${(customThreshold || 100000).toLocaleString()} at resolution?`,
      description: `Custom threshold: $${(customThreshold || 100000).toLocaleString()}`
    }
  };
  return scenarios[scenario] || scenarios.edge;
}

async function main() {
  const args = parseArgs();

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   PoRE — Live Chainlink Evaluation                      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // 1. Collect live evidence
  console.log("📡 Collecting live evidence from on-chain + off-chain sources...\n");
  const eventId = `live-${Date.now()}`;
  const evidence = await collectLiveEvidence(eventId);

  if (evidence.length === 0) {
    console.error("❌ No evidence sources available. Check network connectivity.");
    process.exit(1);
  }

  const prices = evidence.map(e => Number(e.normalized_value)).filter(n => Number.isFinite(n));
  const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const spread = maxPrice - minPrice;

  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│  📊 EVIDENCE COLLECTED                                  │");
  console.log("├─────────────────────────────────────────────────────────┤");
  for (const e of evidence) {
    const p = Number(e.normalized_value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const src = e.source_id.padEnd(20);
    const q = `q=${e.quality_score}`;
    const icon = e.source_type === "onchain_oracle" ? "⛓️ " : "🌐";
    console.log(`│  ${icon} ${src} $${p.padStart(12)}  (${q})       │`);
  }
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log(`│  Median: $${medianPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }).padStart(12)}   Spread: $${spread.toFixed(2).padStart(8)}  Sources: ${evidence.length}  │`);
  console.log("└─────────────────────────────────────────────────────────┘\n");

  // 2. Build scenario
  const sc = buildScenario(args.scenario, medianPrice, args.customThreshold);

  console.log(`🎯 Scenario: ${args.scenario.toUpperCase()}`);
  console.log(`   ${sc.description}`);
  console.log(`   Threshold: $${sc.threshold.toLocaleString()}\n`);

  const eventSpec = {
    event_id: eventId,
    market_id: `pm-btc-live-${args.scenario}`,
    question: sc.question,
    rule_text: `This market resolves YES if BTC/USD price is >= ${sc.threshold} at resolution time.`,
    resolution_source: evidence.map(e => e.source_id),
    market_end_time: new Date(Date.now() - 60000).toISOString(),   // 1분 전 종료 → too_early 아님
    evaluation_time: new Date().toISOString(),
    numeric_rule: { operator: ">=", threshold: sc.threshold }
  };

  // 3. Run full pipeline
  console.log("🧠 Running AI deliberation + policy evaluation...\n");
  const policy = await readJson(policyPath);
  const report = await evaluateEvent({ eventSpec, evidenceRecords: evidence, policy });

  // 4. Display
  const pe = report.policy_evaluation;
  const prop = report.ai_deliberation.proposer;
  const chal = report.ai_deliberation.challenger;

  const stateIcon = pe.final_state === "AUTO_RESOLVE_RECOMMENDED" ? "✅"
    : pe.final_state === "HOLD_FOR_REVIEW" ? "⚠️ "
    : "❌";

  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│  🏛️  EVALUATION RESULT                                  │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log(`│  ${stateIcon} Final State: ${pe.final_state.padEnd(40)}│`);
  console.log(`│     Decision:    ${pe.decision.padEnd(39)}│`);
  console.log(`│     Confidence:  ${String(pe.adjusted_confidence).padEnd(39)}│`);
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  📋 POLICY RULES                                        │");
  for (const r of pe.rules) {
    const icon = r.passed ? "✅" : "❌";
    const val = typeof r.value === "number" ? Number(r.value.toFixed(4)) : r.value;
    const line = `${r.name}: ${val} (threshold: ${r.threshold})`;
    console.log(`│    ${icon} ${line.padEnd(51)}│`);
  }
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log(`│  Reason Codes: ${(pe.reason_codes || []).join(", ").padEnd(40)}│`);
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  🤖 AI DELIBERATION                                     │");
  console.log(`│    Proposer:   ${prop.decision} (confidence: ${prop.confidence})`.padEnd(56) + "│");
  console.log(`│    Challenger: conflict=${chal.conflict_score}, adjusted=${chal.adjusted_confidence}`.padEnd(56) + "│");
  console.log(`│    Rationale:  ${prop.rationale.slice(0, 40)}`.padEnd(56) + "│");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│  🔒 AUDIT HASHES                                        │");
  console.log(`│    policy:   ${report.audit.policy_hash.slice(0, 24)}…`.padEnd(56) + "│");
  console.log(`│    event:    ${report.audit.event_hash.slice(0, 24)}…`.padEnd(56) + "│");
  console.log(`│    evidence: ${report.audit.evidence_hash.slice(0, 24)}…`.padEnd(56) + "│");
  console.log(`│    decision: ${report.audit.decision_hash.slice(0, 24)}…`.padEnd(56) + "│");
  console.log("├─────────────────────────────────────────────────────────┤");

  // 5. CRE / On-chain status
  const cre = report.cre;
  if (cre.mode === "real") {
    console.log(`│  ⛓️  CRE: REAL mode (workflow: ${cre.workflow_id || "n/a"})`.padEnd(56) + "│");
  } else {
    console.log("│  📋 CRE: sim mode (set CRE_MODE=real for on-chain)      │");
  }
  console.log("└─────────────────────────────────────────────────────────┘");
  console.log(`\n⏱  Latency: ${report.latency_ms}ms\n`);

  // 6. Comparison hint
  if (args.scenario === "edge") {
    console.log("💡 Try other scenarios:");
    console.log("   npm run live -- --scenario=comfort   (likely auto-resolve)");
    console.log("   npm run live -- --scenario=stress    (likely hold/reject)");
    console.log("   npm run live -- --scenario=custom --threshold=65000\n");
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
