import test from "node:test";
import assert from "node:assert/strict";
import { evaluateEvent } from "../../src/workflow/evaluateEvent.js";

test("integration smoke: evaluateEvent returns terminal settlement", async () => {
  const eventSpec = {
    event_id: "smoke-int",
    market_id: "1",
    question: "Will value be >= 10?",
    rule_text: "Resolves YES if value >= 10",
    market_end_time: "2026-03-01T00:00:00Z",
    evaluation_time: "2026-03-01T01:00:00Z",
    numeric_rule: { operator: ">=", threshold: 10 },
  };

  const evidenceRecords = [
    {
      evidence_id: "e1",
      source_id: "chainlink-btc-usd",
      source_type: "price",
      timestamp: "2026-03-01T01:00:00Z",
      normalized_value: 11,
      quality_score: 0.9,
    },
  ];

  const policy = {
    models: ["adjudicatorA", "adjudicatorB"],
    voted_prompts: ["Return strict JSON only."],
    mismatch_policy: "split_immediate",
    rerun_delay_hours: 12,
  };

  const report = await evaluateEvent({ eventSpec, evidenceRecords, policy });
  assert.ok(["FINAL_MATCH", "FINAL_MISMATCH"].includes(report.settlement.branch_code));
  assert.ok(["YES", "NO", "SPLIT_50_50"].includes(report.settlement.final_settlement));
});
