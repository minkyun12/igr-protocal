import test from "node:test";
import assert from "node:assert/strict";
import { settleDeterministically } from "../src/protocol/settle.js";
import { resolveFromVerdicts } from "../src/protocol/creCompat.js";

function mk(verdict) {
  return {
    verdict,
    confidence: 0.8,
    rule_match: true,
    evidence_refs: [],
    rationale_short: "x",
    safety_flags: [],
  };
}

test("CRE compat resolver conforms to core settle semantics for split_immediate", () => {
  const scenarios = [
    ["YES", "YES"],
    ["NO", "NO"],
    ["YES", "NO"],
  ];

  for (const [a, b] of scenarios) {
    const core = settleDeterministically({
      firstRun: { policy: "split_immediate", outputs: [mk(a), mk(b)] },
      rerun: { outputs: [mk(a), mk(b)] },
    });

    const cre = resolveFromVerdicts({ verdictA: a, verdictB: b, policy: "split_immediate" });

    assert.equal(cre.branch_code, core.branch_code);
    assert.equal(cre.final_settlement, core.final_settlement);
  }
});
