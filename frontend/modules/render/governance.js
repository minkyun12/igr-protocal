export async function renderGovHistory(el, c) {
  const hash = c?.audit?.policy_hash || '-';
  let rows = [
    { id: 'P-001', change: 'Model pair lock', status: 'EXECUTED', quorum: '12.4%', eta: '2026-03-08 14:00 UTC', hash },
    { id: 'P-002', change: 'Advisory prompts update', status: 'LOCKED', quorum: '15.1%', eta: '2026-03-09 02:00 UTC', hash },
    { id: 'P-003', change: 'Optional source set', status: 'EXECUTED', quorum: '11.8%', eta: '2026-03-09 12:30 UTC', hash }
  ];

  try {
    const r = await fetch('/api/governance/proposals', { cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data?.proposals) && data.proposals.length) {
        rows = data.proposals.map((p) => ({
          id: p.id,
          change: p.change,
          status: p.status,
          quorum: p.quorum,
          eta: p.eta,
          hash: p.configHash || hash,
        }));
      }
    }
  } catch {}

  el.govRows.innerHTML = rows.map((r, i) => `
    <tr data-proposal='${i}'>
      <td>${r.id}</td>
      <td>${r.change}</td>
      <td>${r.status}</td>
      <td>${r.quorum}</td>
      <td>${r.eta}</td>
      <td>${String(r.hash).slice(0, 10)}…</td>
    </tr>
  `).join('');

  [...el.govRows.querySelectorAll('tr')].forEach((tr) => {
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      const idx = Number(tr.dataset.proposal);
      const p = rows[idx];
      el.proposalDetail.textContent = JSON.stringify(p, null, 2);
      el.proposalModal.classList.remove('hidden');
      el.proposalModal.querySelector('.modal-card')?.focus();
    });
  });
}
