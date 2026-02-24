export function median(numbers) {
  if (!numbers.length) return NaN;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function deviationBps(numbers) {
  if (!numbers.length) return Infinity;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const m = median(numbers);
  if (!Number.isFinite(m) || m === 0) return Infinity;
  return ((max - min) / Math.abs(m)) * 10000;
}
