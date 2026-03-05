export async function setupActionButtons({ el, postJSON, showToast, getActive, refreshGovernanceView }) {
  async function propose(side) {
    const active = getActive();
    try {
      await postJSON('/api/proposals', { case_id: active?.case_id, market_id: active?.market?.market_id, proposed: side });
      showToast(`Proposed ${side}`, 'success');
    } catch {
      showToast('Proposal failed', 'error');
    }
  }

  el.proposeYesBtn?.addEventListener('click', () => propose('YES'));
  el.proposeNoBtn?.addEventListener('click', () => propose('NO'));
  el.escalateBtn?.addEventListener('click', async () => {
    const active = getActive();
    try {
      await postJSON('/api/escalations', { case_id: active?.case_id, market_id: active?.market?.market_id });
      showToast('Escalation requested', 'warn');
    } catch {
      showToast('Escalation failed', 'error');
    }
  });

  el.addEvidenceBtn?.addEventListener('click', async () => {
    const active = getActive();
    const note = prompt('Evidence note (source/summary):');
    if (!note) return;
    try {
      await postJSON('/api/evidence', { case_id: active?.case_id, market_id: active?.market?.market_id, note });
      showToast('Evidence submitted', 'success');
    } catch {
      showToast('Evidence submit failed', 'error');
    }
  });

  async function vote(support) {
    const proposalId = prompt('Proposal ID (e.g., P-001 or PR-001):');
    if (!proposalId) return;
    try {
      await postJSON('/api/governance/vote', { proposalId, support, voter: 'demo-holder' });
      showToast(`Vote ${support ? 'YES' : 'NO'} submitted`, 'success');
      await refreshGovernanceView();
    } catch {
      showToast('Vote failed', 'error');
    }
  }

  el.voteYesBtn?.addEventListener('click', () => vote(true));
  el.voteNoBtn?.addEventListener('click', () => vote(false));

  el.lockConfigBtn?.addEventListener('click', async () => {
    const proposalId = prompt('Proposal ID to lock for current market:');
    const active = getActive();
    if (!proposalId || !active) return;
    try {
      await postJSON('/api/governance/lock', { proposalId, marketId: active.market.market_id });
      showToast('Config locked for market', 'warn');
      if (el.trustLock) {
        el.trustLock.textContent = 'LOCK: CONFIG LOCKED';
        el.trustLock.className = 'state-pill match';
      }
      await refreshGovernanceView();
    } catch {
      showToast('Lock failed', 'error');
    }
  });
}
