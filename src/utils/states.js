export const BRANCH_STATES = {
  // Whitepaper §8 branch codes
  FINAL_MATCH: "FINAL_MATCH",
  FINAL_MISMATCH: "FINAL_MISMATCH",
  // Sub-codes for audit trail (compatible with §10.2 reasonCodes)
  FINAL_MISMATCH_SPLIT: "FINAL_MISMATCH",       // split_immediate policy
  FINAL_MISMATCH_DUAL_FAILURE: "FINAL_MISMATCH", // both models failed
  FINAL_RERUN_MATCH: "FINAL_MATCH",              // recovered via rerun
  FINAL_RERUN_SPLIT: "FINAL_MISMATCH",           // persistent disagreement
  FINAL_RERUN_DUAL_FAILURE: "FINAL_MISMATCH",    // both models failed on rerun
};

export const REASON_CODES = {
  MATCH_INITIAL: "MATCH_INITIAL",
  SPLIT_IMMEDIATE: "SPLIT_IMMEDIATE",
  DUAL_FAILURE_INITIAL: "DUAL_FAILURE_INITIAL",
  RERUN_MATCH: "RERUN_MATCH",
  RERUN_SPLIT: "RERUN_SPLIT",
  DUAL_FAILURE_RERUN: "DUAL_FAILURE_RERUN",
};

export const FINAL_SETTLEMENTS = {
  YES: "YES",
  NO: "NO",
  SPLIT_50_50: "SPLIT_50_50"
};
