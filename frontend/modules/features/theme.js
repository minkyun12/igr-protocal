export function applyTheme(el, theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('igr-theme', theme);
  if (el.themeToggle) el.themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');

  const label = document.getElementById('themeLabel');
  const thumb = document.getElementById('themeThumb');
  if (label) label.textContent = theme === 'light' ? 'Light' : 'Dark';
  if (thumb) thumb.textContent = theme === 'light' ? '☀' : '🌙';
}

export function setupTheme(el) {
  const stored = localStorage.getItem('igr-theme');
  const initial = stored === 'dark' || stored === 'light' ? stored : 'light';
  applyTheme(el, initial);

  el.themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(el, current === 'light' ? 'dark' : 'light');
  });
}
