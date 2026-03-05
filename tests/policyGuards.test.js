import test from "node:test";
import assert from "node:assert/strict";
import { validateCanonicalGuards } from "../src/protocol/guards.js";
import { compileCanonicalPackage } from "../src/protocol/compilePackage.js";

test("policy guard: rejects same-vendor model pair when cross-vendor required", () => {
  const canonical = {
    models: ["openai/gpt-4o", "openai/gpt-4.1"],
    oracle_mandatory_sources: [{ id: "o1" }],
  };

  assert.throws(
    () => validateCanonicalGuards({ canonical, policy: { require_cross_vendor: true } }),
    /POLICY_VIOLATION_CROSS_VENDOR/
  );
});

test("policy guard: rejects missing oracle mandatory source when required", () => {
  const canonical = {
    models: ["openai/gpt-4o", "anthropic/claude-sonnet"],
    oracle_mandatory_sources: [],
  };

  assert.throws(
    () => validateCanonicalGuards({ canonical, policy: { require_oracle_mandatory: true } }),
    /POLICY_VIOLATION_ORACLE_LOCK/
  );
});

test("compile canonical: chainlink price source is auto-classified as oracle mandatory", () => {
  const eventSpec = { market_id: "m1", question: "Q", rule_text: "R", evaluation_time: "2026-01-01T00:00:00Z" };
  const evidenceRecords = [
    { evidence_id: "p1", source_id: "chainlink", source_type: "price", timestamp: "2026-01-01T00:00:00Z", normalized_value: 1 },
    { evidence_id: "p2", source_id: "binance", source_type: "price", timestamp: "2026-01-01T00:00:00Z", normalized_value: 1 },
  ];
  const policy = { models: ["adjudicatorA", "adjudicatorB"], mismatch_policy: "split_immediate" };

  const { canonical } = compileCanonicalPackage({ eventSpec, evidenceRecords, policy });
  assert.ok(canonical.oracle_mandatory_sources.some((s) => s.source_id === "chainlink"));
});
