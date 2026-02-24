import { computeEvidenceStats } from "../evidence/stats.js";

function applyOperator(value, operator, threshold) {
  if (!Number.isFinite(value)) return "UNKNOWN";
  switch (operator) {
    case ">=":
      return value >= threshold ? "YES" : "NO";
    case ">":
      return value > threshold ? "YES" : "NO";
    case "<=":
      return value <= threshold ? "YES" : "NO";
    case "<":
      return value < threshold ? "YES" : "NO";
    default:
      return "UNKNOWN";
  }
}

/**
 * For subjective (non-numeric) events, normalized_value represents
 * the source's confidence that the answer is YES (0.0 = definitely NO, 1.0 = definitely YES).
 *
 * Strategy:
 *   - Weight each source by quality_score (higher quality → more influence)
 *   - Compute weighted average of normalized_values
 *   - If weighted average > 0.5 → YES, else NO
 *   - Confidence = distance from 0.5 boundary, scaled by source agreement
 */
function subjectiveDecision(evidenceRecords) {
  const scored = evidenceRecords.filter(
    (e) => Number.isFinite(e.normalized_value) && Number.isFinite(e.quality_score) && e.quality_score > 0
  );

  if (scored.length === 0) return { decision: "UNKNOWN", confidence: 0, rationale: "No scored evidence" };

  const totalWeight = scored.reduce((sum, e) => sum + e.quality_score, 0);
  const weightedAvg = scored.reduce((sum, e) => sum + e.normalized_value * e.quality_score, 0) / totalWeight;

  // Agreement: how much do high-quality sources agree?
  // If official sources say NO (low value) but market says YES (high value) → low agreement
  const values = scored.map((e) => e.normalized_value);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const disagreement = Math.sqrt(variance); // 0 = perfect agreement, ~0.5 = max disagreement

  const decision = weightedAvg > 0.5 ? "YES" : "NO";
  const distanceFromBoundary = Math.abs(weightedAvg - 0.5) * 2; // 0..1
  const agreementBonus = Math.max(0, 0.3 - disagreement); // bonus for agreement
  const confidence = Math.max(0, Math.min(1, distanceFromBoundary * 0.7 + agreementBonus + scored.length * 0.03));

  // Build source breakdown for rationale
  const sourceBreakdown = scored
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, 5)
    .map((e) => `${e.source_id}=${e.normalized_value}(q=${e.quality_score})`)
    .join(", ");

  return {
    decision,
    confidence: Number(confidence.toFixed(4)),
    rationale: `Weighted avg=${weightedAvg.toFixed(3)}, disagreement=${disagreement.toFixed(3)}, sources=${scored.length}. Top: ${sourceBreakdown}`
  };
}

export function runProposer(eventSpec, evidenceRecords) {
  const stats = computeEvidenceStats(evidenceRecords);
  const rule = eventSpec.numeric_rule;

  let decision, confidence, rationale;

  if (rule) {
    // Numeric / price-based event
    decision = applyOperator(stats.medianValue, rule.operator, rule.threshold);
    const consistencyPenalty = Math.min(stats.deviationBps / 200, 0.6);
    const sourceBoost = Math.min(stats.sourceCount / 10, 0.25);
    const base = decision === "UNKNOWN" ? 0.4 : 0.75;
    confidence = Number(Math.max(0, Math.min(1, base + sourceBoost - consistencyPenalty)).toFixed(4));
    rationale = `Median=${stats.medianValue}, deviationBps=${stats.deviationBps.toFixed(2)}, sources=${stats.sourceCount}`;
  } else {
    // Subjective / binary event — use quality-weighted source analysis
    const sub = subjectiveDecision(evidenceRecords);
    decision = sub.decision;
    confidence = sub.confidence;
    rationale = sub.rationale;
  }

  return {
    decision,
    confidence,
    rationale,
    used_evidence_ids: evidenceRecords.map((e) => e.evidence_id)
  };
}
