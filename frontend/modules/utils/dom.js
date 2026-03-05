let toastTimer = null;

export function showToast(toastEl, message, level = "success") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `toast show ${level}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.className = "toast";
  }, 2100);
}
