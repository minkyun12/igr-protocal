export function runChallenger(proposerResult, evidenceStats, policy) {
  const conflictFlags = [];

  if (evidenceStats.sourceCount < policy.min_sources) {
    conflictFlags.push("INSUFFICIENT_SOURCES");
  }
  if (evidenceStats.deviationBps > policy.max_cross_source_deviation_bps) {
    conflictFlags.push("DEVIATION_TOO_HIGH");
  }
  if (proposerResult.decision === "UNKNOWN") {
    conflictFlags.push("UNKNOWN_DECISION");
  }

  const conflictScore = Math.min(1, conflictFlags.length * 0.18 + (evidenceStats.deviationBps > 0 ? Math.min(evidenceStats.deviationBps / 500, 0.4) : 0));
  const adjustedConfidence = Math.max(0, proposerResult.confidence - conflictScore * 0.6);

  return {
    counterpoints: conflictFlags.map((f) => `Flag: ${f}`),
    conflict_flags: conflictFlags,
    conflict_score: Number(conflictScore.toFixed(4)),
    adjusted_confidence: Number(adjustedConfidence.toFixed(4))
  };
}
