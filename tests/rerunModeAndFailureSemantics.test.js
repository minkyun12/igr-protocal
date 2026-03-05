import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const modulePath = path.resolve("src/workflow/evaluateEvent.js");

async function loadEvaluateEventFresh() {
  return import(`${modulePath}?t=${Date.now()}-${Math.random()}`);
}

function mismatchNumericEvidence() {
  return [
    { evidence_id: "e1", source_id: "chainlink", source_type: "price", timestamp: "2026-01-01T01:00:00Z", normalized_value: 101 },
    { evidence_id: "e2", source_id: "binance", source_type: "price", timestamp: "2026-01-01T01:00:00Z", normalized_value: 101 },
    { evidence_id: "e3", source_id: "coinbase", source_type: "price", timestamp: "2026-01-01T01:00:00Z", normalized_value: 95 },
  ];
}

function baseEventSpec() {
  return {
    event_id: "rerun-mode-test",
    market_id: "1",
    question: "Will value be >= 100?",
    rule_text: "Resolves YES if value >= 100",
    market_end_time: "2026-01-01T00:00:00Z",
    evaluation_time: "2026-01-01T01:00:00Z",
    numeric_rule: { operator: ">=", threshold: 100 },
  };
}

test("rerun execution mode: simulation_fast does not wait realtime", async () => {
  process.env.MODEL_MODE = "sim";
  process.env.RERUN_EXECUTION_MODE = "simulation_fast";
  const { evaluateEvent } = await loadEvaluateEventFresh();

  const started = Date.now();
  const report = await evaluateEvent({
    eventSpec: baseEventSpec(),
    evidenceRecords: mismatchNumericEvidence(),
    policy: {
      models: ["adjudicatorA", "adjudicatorB"],
      mismatch_policy: "rerun_once_then_split",
      rerun_delay_hours: 0.00006,
      rerun_execution_mode: "simulation_fast",
      require_cross_vendor: false,
      require_oracle_mandatory: false,
    },
  });
  const elapsed = Date.now() - started;

  assert.equal(report.policy_evaluation.rerun_execution_mode, "simulation_fast");
  assert.ok(elapsed < 120, `expected fast mode <120ms, got ${elapsed}ms`);
});

test("rerun execution mode: realtime waits configured delay", async () => {
  process.env.MODEL_MODE = "sim";
  process.env.RERUN_EXECUTION_MODE = "realtime";
  const { evaluateEvent } = await loadEvaluateEventFresh();

  const started = Date.now();
  const report = await evaluateEvent({
    eventSpec: baseEventSpec(),
    evidenceRecords: mismatchNumericEvidence(),
    policy: {
      models: ["adjudicatorA", "adjudicatorB"],
      mismatch_policy: "rerun_once_then_split",
      rerun_delay_hours: 0.00006,
      rerun_execution_mode: "realtime",
      require_cross_vendor: false,
      require_oracle_mandatory: false,
    },
  });
  const elapsed = Date.now() - started;

  assert.equal(report.policy_evaluation.rerun_execution_mode, "realtime");
  assert.ok(elapsed >= 180, `expected realtime wait >=180ms, got ${elapsed}ms`);
});

test("timeout/transport failure is normalized to persistent failure fallback", async () => {
  process.env.MODEL_MODE = "llm";
  process.env.MODEL_A_ENDPOINT = "http://127.0.0.1:1/unreachable";
  process.env.MODEL_B_ENDPOINT = "http://127.0.0.1:1/unreachable";
  process.env.MODEL_A_API_KEY = "x";
  process.env.MODEL_B_API_KEY = "x";
  process.env.MODEL_TIMEOUT_MS = "50";

  const { evaluateEvent } = await loadEvaluateEventFresh();

  const report = await evaluateEvent({
    eventSpec: baseEventSpec(),
    evidenceRecords: mismatchNumericEvidence(),
    policy: {
      models: ["adjudicatorA", "adjudicatorB"],
      mismatch_policy: "split_immediate",
      require_cross_vendor: false,
      require_oracle_mandatory: false,
    },
  });

  const outA = report.model_outputs.first_run.adjudicatorA;
  const outB = report.model_outputs.first_run.adjudicatorB;

  assert.ok(outA.safety_flags.includes("SCHEMA_PERSISTENT_FAILURE"));
  assert.ok(outB.safety_flags.includes("SCHEMA_PERSISTENT_FAILURE"));
  assert.equal(report.settlement.reason_code, "DUAL_FAILURE_INITIAL");
  assert.equal(report.settlement.final_settlement, "SPLIT_50_50");
});
