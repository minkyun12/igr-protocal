export function setupDisputeModal({ el, postJSON, showToast, getActive }) {
  const open = () => { el.disputeModal.classList.remove('hidden'); el.disputeModal.querySelector('.modal-card')?.focus(); };
  const close = () => {
    el.disputeModal.classList.add('hidden');
    el.disputeText.value = '';
  };

  const closeProposal = () => el.proposalModal.classList.add('hidden');

  el.openDispute?.addEventListener('click', open);
  el.closeDispute?.addEventListener('click', close);
  el.submitDispute?.addEventListener('click', async () => {
    const note = el.disputeText.value.trim();
    if (!note) return;
    const active = getActive();
    try {
      await postJSON('/api/disputes', { case_id: active?.case_id, market_id: active?.market?.market_id, note });
      showToast('Dispute submitted', 'warn');
      close();
    } catch {
      showToast('Dispute submit failed', 'error');
    }
  });
  el.disputeModal?.addEventListener('click', (ev) => {
    if (ev.target === el.disputeModal) close();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (!el.disputeModal?.classList.contains('hidden')) close();
      if (!el.proposalModal?.classList.contains('hidden')) closeProposal();
    }
  });

  const focusables = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function trapFocus(modal) {
    const nodes = [...modal.querySelectorAll(focusables)].filter((n) => !n.disabled);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  trapFocus(el.disputeModal);
  trapFocus(el.proposalModal);

  el.closeProposal?.addEventListener('click', closeProposal);
  el.proposalModal?.addEventListener('click', (ev) => {
    if (ev.target === el.proposalModal) closeProposal();
  });
}
