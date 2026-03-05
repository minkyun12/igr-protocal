export function setupTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.tab-panel')];

  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      tabs.forEach((x) => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
      panels.forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      t.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${t.dataset.tab}`)?.classList.add('active');
    });
  });
}
