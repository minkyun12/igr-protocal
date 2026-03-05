import { settleDeterministically } from "./settle.js";

export function resolveFromVerdicts({ verdictA, verdictB, policy = "split_immediate" }) {
  const normalize = (v) => ({
    verdict: v === "YES" ? "YES" : "NO",
    confidence: 1,
    rule_match: true,
    evidence_refs: [],
    rationale_short: "cre-compat",
    safety_flags: [],
  });

  return settleDeterministically({
    firstRun: {
      policy,
      outputs: [normalize(verdictA), normalize(verdictB)],
    },
    rerun: {
      outputs: [normalize(verdictA), normalize(verdictB)],
    },
  });
}
