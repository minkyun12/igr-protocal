import { BRANCH_STATES, REASON_CODES, FINAL_SETTLEMENTS } from "../utils/states.js";

/**
 * Whitepaper §8 Settlement Semantics — deterministic branch executor.
 *
 * Handles:
 *  - Match (§8.1)
 *  - Mismatch (§8.2) with split_immediate or rerun_once_then_split
 *  - Dual failure → forced split_immediate regardless of policy (§7.1)
 */

function isDualFailure(outputs) {
  return outputs.every(
    (o) => o.safety_flags && o.safety_flags.includes("SCHEMA_PERSISTENT_FAILURE")
  );
}

function isValid(output) {
  return (
    output &&
    ["YES", "NO"].includes(output.verdict) &&
    !(output.safety_flags && output.safety_flags.includes("SCHEMA_PERSISTENT_FAILURE"))
  );
}

export function settleDeterministically({ firstRun, rerun }) {
  const [a, b] = firstRun.outputs;

  // §7.1: Both models fail on initial → forced split_immediate
  if (isDualFailure([a, b])) {
    return {
      branch_code: BRANCH_STATES.FINAL_MISMATCH,
      reason_code: REASON_CODES.DUAL_FAILURE_INITIAL,
      final_settlement: FINAL_SETTLEMENTS.SPLIT_50_50,
      rerun_used: false,
    };
  }

  // §8.1: Match branch
  if (isValid(a) && isValid(b) && a.verdict === b.verdict) {
    return {
      branch_code: BRANCH_STATES.FINAL_MATCH,
      reason_code: REASON_CODES.MATCH_INITIAL,
      final_settlement: a.verdict === "YES" ? FINAL_SETTLEMENTS.YES : FINAL_SETTLEMENTS.NO,
      rerun_used: false,
    };
  }

  // §8.2: Mismatch branch
  if (firstRun.policy === "split_immediate") {
    return {
      branch_code: BRANCH_STATES.FINAL_MISMATCH,
      reason_code: REASON_CODES.SPLIT_IMMEDIATE,
      final_settlement: FINAL_SETTLEMENTS.SPLIT_50_50,
      rerun_used: false,
    };
  }

  // §8.2: rerun_once_then_split — single delayed rerun
  const [a2, b2] = rerun.outputs;

  // §7.1: Both models fail on rerun → forced split
  if (isDualFailure([a2, b2])) {
    return {
      branch_code: BRANCH_STATES.FINAL_MISMATCH,
      reason_code: REASON_CODES.DUAL_FAILURE_RERUN,
      final_settlement: FINAL_SETTLEMENTS.SPLIT_50_50,
      rerun_used: true,
    };
  }

  // Rerun match
  if (isValid(a2) && isValid(b2) && a2.verdict === b2.verdict) {
    return {
      branch_code: BRANCH_STATES.FINAL_MATCH,
      reason_code: REASON_CODES.RERUN_MATCH,
      final_settlement: a2.verdict === "YES" ? FINAL_SETTLEMENTS.YES : FINAL_SETTLEMENTS.NO,
      rerun_used: true,
    };
  }

  // Persistent disagreement → split
  return {
    branch_code: BRANCH_STATES.FINAL_MISMATCH,
    reason_code: REASON_CODES.RERUN_SPLIT,
    final_settlement: FINAL_SETTLEMENTS.SPLIT_50_50,
    rerun_used: true,
  };
}
