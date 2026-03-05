export function renderTable(el, filtered, activeCaseId, { stateClass, spreadOf, shortQ, onSelect }) {
  el.marketCount.textContent = String(filtered.length);
  el.marketRows.innerHTML = filtered.map((c) => {
    const cls = stateClass(c);
    const spread = (spreadOf(c) * 100).toFixed(1);
    const active = c.case_id === activeCaseId ? 'active' : '';
    return `
      <tr class="market-row ${active}" data-id="${c.case_id}">
        <td>
          <div><strong>${c.case_id}</strong></div>
          <div class="muted">${shortQ(c.market.question)}</div>
        </td>
        <td><span class="state-pill ${cls}">${c.settlement.branch_code}</span></td>
        <td>${c.settlement.final_settlement}</td>
        <td>${spread}%</td>
        <td>${c.evidence.length}</td>
      </tr>
    `;
  }).join('');

  [...el.marketRows.querySelectorAll('.market-row')].forEach((row) => {
    row.addEventListener('click', () => onSelect(row.dataset.id));
  });
}
