export function setupDemo({ el, getFiltered, getActiveCaseId, setActiveCaseId, renderTable, renderDetail }) {
  let demoOn = false;
  let demoTimer = null;

  el.demoToggle?.addEventListener('click', () => {
    demoOn = !demoOn;
    el.demoToggle.textContent = demoOn ? '■ Stop Demo' : '▶ Demo';
    if (!demoOn) {
      clearInterval(demoTimer);
      return;
    }

    const current = getFiltered();
    let idx = Math.max(0, current.findIndex((c) => c.case_id === getActiveCaseId()));
    clearInterval(demoTimer);
    demoTimer = setInterval(() => {
      const filtered = getFiltered();
      if (!filtered.length) return;
      idx = (idx + 1) % filtered.length;
      setActiveCaseId(filtered[idx].case_id);
      renderTable();
      renderDetail(filtered[idx]);
    }, 4500);
  });
}
