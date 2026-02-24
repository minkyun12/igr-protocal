import { deviationBps, median } from "../utils/math.js";

function minutesBetween(laterIso, earlierIso) {
  const later = new Date(laterIso).getTime();
  const earlier = new Date(earlierIso).getTime();
  if (!Number.isFinite(later) || !Number.isFinite(earlier)) return null;
  return (later - earlier) / (1000 * 60);
}

export function computeEvidenceStats(evidenceRecords = [], { evaluationTime } = {}) {
  const numericValues = evidenceRecords
    .map((e) => Number(e.normalized_value))
    .filter((n) => Number.isFinite(n));

  const uniqueSources = new Set(evidenceRecords.map((e) => e.source_id));
  const sourceTypes = new Set(evidenceRecords.map((e) => e.source_type).filter(Boolean));

  const ages = evaluationTime
    ? evidenceRecords
        .map((e) => minutesBetween(evaluationTime, e.timestamp))
        .filter((n) => Number.isFinite(n) && n >= 0)
    : [];

  return {
    sourceCount: uniqueSources.size,
    sourceTypeCount: sourceTypes.size,
    sampleCount: numericValues.length,
    medianValue: numericValues.length ? median(numericValues) : null,
    deviationBps: numericValues.length ? deviationBps(numericValues) : Infinity,
    evidenceFreshnessMinutes: {
      min: ages.length ? Number(Math.min(...ages).toFixed(3)) : null,
      max: ages.length ? Number(Math.max(...ages).toFixed(3)) : null
    }
  };
}
