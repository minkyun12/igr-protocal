import { DECISION_STATES } from "../utils/states.js";

function isTooEarly(eventSpec) {
  const end = new Date(eventSpec.market_end_time).getTime();
  const evalAt = new Date(eventSpec.evaluation_time).getTime();
  return Number.isFinite(end) && Number.isFinite(evalAt) && evalAt < end;
}

function hasRuleTextMatch(eventSpec) {
  if (!eventSpec.numeric_rule) return true;
  const { threshold, operator } = eventSpec.numeric_rule;
  const text = (eventSpec.rule_text || "").toLowerCase();
  const thresholdStr = String(threshold);
  return text.includes(thresholdStr) || text.includes(operator);
}

export function evaluatePolicy({ eventSpec, evidenceStats, proposer, challenger, policy }) {
  const rules = [];
  const reasonCodes = [];

  const tooEarly = isTooEarly(eventSpec);
  const ruleTooEarly = policy.allow_too_early ? true : !tooEarly;
  rules.push({ name: "allow_too_early", passed: ruleTooEarly, value: !tooEarly, threshold: !policy.allow_too_early });
  if (!ruleTooEarly) reasonCodes.push("TOO_EARLY");

  const minSourcesPass = evidenceStats.sourceCount >= policy.min_sources;
  rules.push({ name: "min_sources", passed: minSourcesPass, value: evidenceStats.sourceCount, threshold: policy.min_sources });
  if (!minSourcesPass) reasonCodes.push("INSUFFICIENT_SOURCES");

  const deviationPass = evidenceStats.deviationBps <= policy.max_cross_source_deviation_bps;
  rules.push({ name: "max_cross_source_deviation_bps", passed: deviationPass, value: Number(evidenceStats.deviationBps.toFixed(4)), threshold: policy.max_cross_source_deviation_bps });
  if (!deviationPass) reasonCodes.push("DEVIATION_TOO_HIGH");

  const confidencePass = challenger.adjusted_confidence >= policy.min_ai_confidence;
  rules.push({ name: "min_ai_confidence", passed: confidencePass, value: challenger.adjusted_confidence, threshold: policy.min_ai_confidence });
  if (!confidencePass) reasonCodes.push("LOW_CONFIDENCE");

  const conflictPass = challenger.conflict_score <= policy.max_conflict_score;
  rules.push({ name: "max_conflict_score", passed: conflictPass, value: challenger.conflict_score, threshold: policy.max_conflict_score });
  if (!conflictPass) reasonCodes.push("CONFLICT_SCORE_HIGH");

  const sourceTypeThreshold = Number.isFinite(policy.min_source_types) ? policy.min_source_types : 1;
  const sourceTypePass = evidenceStats.sourceTypeCount >= sourceTypeThreshold;
  rules.push({ name: "min_source_types", passed: sourceTypePass, value: evidenceStats.sourceTypeCount, threshold: sourceTypeThreshold });
  if (!sourceTypePass) reasonCodes.push("SOURCE_TYPE_DIVERSITY_LOW");

  const maxAge = Number.isFinite(policy.max_evidence_age_minutes) ? policy.max_evidence_age_minutes : null;
  const oldestEvidenceMinutes = evidenceStats.evidenceFreshnessMinutes?.max;
  const freshnessPass = maxAge === null || (Number.isFinite(oldestEvidenceMinutes) && oldestEvidenceMinutes <= maxAge);
  rules.push({ name: "max_evidence_age_minutes", passed: freshnessPass, value: oldestEvidenceMinutes, threshold: maxAge });
  if (!freshnessPass) reasonCodes.push("EVIDENCE_TOO_OLD");

  const ruleTextPass = policy.require_rule_text_match ? hasRuleTextMatch(eventSpec) : true;
  rules.push({ name: "require_rule_text_match", passed: ruleTextPass, value: ruleTextPass, threshold: policy.require_rule_text_match });
  if (!ruleTextPass) reasonCodes.push("RULE_TEXT_MISMATCH");

  let finalState = DECISION_STATES.AUTO_RESOLVE_RECOMMENDED;

  if (!minSourcesPass) {
    finalState = DECISION_STATES.REJECTED_INSUFFICIENT_EVIDENCE;
  }

  const hasHoldReasons = ["TOO_EARLY", "DEVIATION_TOO_HIGH", "LOW_CONFIDENCE", "CONFLICT_SCORE_HIGH", "RULE_TEXT_MISMATCH", "SOURCE_TYPE_DIVERSITY_LOW", "EVIDENCE_TOO_OLD"].some((code) => reasonCodes.includes(code));
  if (hasHoldReasons && finalState !== DECISION_STATES.REJECTED_INSUFFICIENT_EVIDENCE) {
    finalState = DECISION_STATES.HOLD_FOR_REVIEW;
  }

  if (!reasonCodes.length) {
    reasonCodes.push("ALL_POLICIES_PASSED");
  }

  return {
    event_id: eventSpec.event_id,
    rules,
    final_state: finalState,
    reason_codes: reasonCodes,
    decision: proposer.decision,
    adjusted_confidence: challenger.adjusted_confidence
  };
}
