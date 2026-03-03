#!/usr/bin/env node
import { collectLiveEvidence } from "../evidence/liveCollector.js";
import { evaluateEvent } from "../workflow/evaluateEvent.js";
import { readJson } from "../utils/io.js";
import path from "node:path";

const policyPath = path.join(process.cwd(), "configs/policy.json");

const evidence = await collectLiveEvidence(`live-${Date.now()}`);
if (!evidence.length) {
  console.error("No evidence collected");
  process.exit(1);
}

const prices = evidence.map((e) => Number(e.normalized_value)).filter(Number.isFinite).sort((a, b) => a - b);
const median = prices[Math.floor(prices.length / 2)] || 0;
const threshold = Math.floor(median);

const eventSpec = {
  event_id: `live-${Date.now()}`,
  market_id: "pm-live-btc",
  question: `Will BTC be >= ${threshold}?`,
  rule_text: `Resolves YES if BTC is >= ${threshold} at evaluation.` ,
  market_end_time: new Date(Date.now() - 60000).toISOString(),
  evaluation_time: new Date().toISOString(),
  numeric_rule: { operator: ">=", threshold }
};

const policy = await readJson(policyPath);
const report = await evaluateEvent({ eventSpec, evidenceRecords: evidence, policy });

console.log(JSON.stringify({
  branch: report.settlement.branch_code,
  settlement: report.settlement.final_settlement,
  package_hash: report.audit.package_hash,
  model_pair_hash: report.audit.model_pair_hash
}, null, 2));
