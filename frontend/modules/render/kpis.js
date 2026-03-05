export async function renderGlobalKpis(el, items, { isMismatch, spreadOf }) {
  try {
    const r = await fetch('/api/metrics', { cache: 'no-store' });
    if (r.ok) {
      const m = await r.json();
      el.gActive.textContent = String(m.totalMarkets ?? items.length);
      el.gMatch.textContent = String(m.resolvedMatch ?? 0);
      el.gDispute.textContent = String(m.disputed ?? 0);
      el.gSpread.textContent = `${Number(m.avgConfidenceSpread ?? 0).toFixed(1)}%`;
      return;
    }
  } catch {}

  const total = items.length;
  const match = items.filter((c) => !isMismatch(c)).length;
  const dispute = total - match;
  const avgSpread = total
    ? (items.reduce((s, c) => s + spreadOf(c), 0) / total) * 100
    : 0;

  el.gActive.textContent = String(total);
  el.gMatch.textContent = String(match);
  el.gDispute.textContent = String(dispute);
  el.gSpread.textContent = `${avgSpread.toFixed(1)}%`;
}
