export function renderTimeline(el, c) {
  const items = [...(c?.evidence || [])]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((e) => `
      <div class="timeline-item">
        <time>${new Date(e.timestamp).toISOString()}</time>
        <div class="src">${e.source_id} <span class="meta">(${e.source_type})</span></div>
        <div class="meta">signal=${Number.isFinite(Number(e.normalized_value)) ? Number(e.normalized_value).toFixed(2) : '-'} · quality=${Number.isFinite(Number(e.quality_score)) ? Number(e.quality_score).toFixed(2) : '-'}</div>
      </div>
    `).join('');

  el.timeline.innerHTML = items || '<div class="muted">No evidence timeline.</div>';
}

export function renderSignalChart(el, c) {
  const vals = (c?.evidence || []).map((e) => Number(e.normalized_value)).filter((v) => Number.isFinite(v));
  if (!vals.length) {
    el.signalChart.innerHTML = '';
    el.depthChart.innerHTML = '';
    return;
  }

  const w = 600;
  const step = vals.length > 1 ? (w - 40) / (vals.length - 1) : 0;
  const points = vals.map((v, i) => {
    const x = 20 + i * step;
    const y = 130 - Math.max(0, Math.min(1, v)) * 100;
    return `${x},${y}`;
  }).join(' ');

  const last = vals[vals.length - 1];
  el.signalChart.innerHTML = `
    <line x1="20" y1="130" x2="580" y2="130" stroke="#30435f" stroke-width="1"/>
    <line x1="20" y1="30" x2="580" y2="30" stroke="#22324a" stroke-width="1"/>
    <polyline points="${points}" fill="none" stroke="#6cc6ff" stroke-width="3"/>
    <text x="530" y="24" fill="#9fbde2" font-size="11" font-family="IBM Plex Mono">last=${last.toFixed(2)}</text>
  `;

  const depth = vals.map((v, i) => ({
    x: 20 + i * step,
    bid: Math.max(0, 1 - v),
    ask: Math.max(0, v)
  }));
  const bidPath = depth.map((d) => `${d.x},${130 - d.bid * 85}`).join(' ');
  const askPath = depth.map((d) => `${d.x},${130 - d.ask * 85}`).join(' ');
  el.depthChart.innerHTML = `
    <line x1="20" y1="130" x2="580" y2="130" stroke="#30435f" stroke-width="1"/>
    <polyline points="${bidPath}" fill="none" stroke="#71e2a1" stroke-width="3"/>
    <polyline points="${askPath}" fill="none" stroke="#ffbe7d" stroke-width="3"/>
    <text x="24" y="22" fill="#8bd9b0" font-size="11" font-family="IBM Plex Mono">bid-depth</text>
    <text x="98" y="22" fill="#ffc996" font-size="11" font-family="IBM Plex Mono">ask-depth</text>
  `;
}

export function renderStateFlow(el, c, { isMismatch }) {
  const flow = isMismatch(c)
    ? ['OPEN', 'CHALLENGED', 'FINAL']
    : ['OPEN', 'FINAL'];
  el.stateFlow.innerHTML = flow.map((n, i) => `
    <span class="node active">${n}</span>${i < flow.length - 1 ? '<span class="arrow">→</span>' : ''}
  `).join('');
}
