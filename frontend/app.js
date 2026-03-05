import { spreadOf, isMismatch, stateClass, shortQ } from './modules/utils/format.js';
import { showToast as showToastUI } from './modules/utils/dom.js';
import { updateTrustStrip } from './modules/render/trust.js';
import { renderGlobalKpis } from './modules/render/kpis.js';
import { renderTable as renderTableView } from './modules/render/table.js';
import { renderGovHistory } from './modules/render/governance.js';
import { renderTimeline, renderSignalChart, renderStateFlow } from './modules/render/charts.js';
import { renderDetailCore, cue } from './modules/render/detail.js';
import { loadCases, postJSON } from './modules/api.js';
import { setupTabs } from './modules/features/tabs.js';
import { setupDemo } from './modules/features/demo.js';
import { setupTheme } from './modules/features/theme.js';
import { setupDisputeModal } from './modules/features/modals.js';
import { setupActionButtons } from './modules/features/actions.js';
import { bindElements } from './modules/elements.js';
import { createState, activeCase, setCases } from './modules/state.js';

const boot = await loadCases();
const el = bindElements();
const state = createState(boot.cases);

const showToast = (m, level = 'success') => showToastUI(el.toast, m, level);
const getActive = () => activeCase(state);

function paintDataMode(mode) {
  if (!el.dataMode) return;
  el.dataMode.textContent = `DATA: ${mode}`;
  el.dataMode.classList.remove('match', 'mismatch');
  el.dataMode.classList.add(mode === 'LIVE' ? 'match' : 'mismatch');
}

async function refreshGovernanceView() {
  const c = getActive();
  if (c) await renderGovHistory(el, c);
}

function renderDetail(c) {
  if (!renderDetailCore(el, c, { stateClass, spreadOf })) return;
  renderGovHistory(el, c);
  renderTimeline(el, c);
  renderSignalChart(el, c);
  renderStateFlow(el, c, { isMismatch });
  el.presenterCue.textContent = cue(c, { isMismatch });
  updateTrustStrip(el, c);
}

function renderTable() {
  renderTableView(el, state.filtered, state.activeCaseId, {
    stateClass,
    spreadOf,
    shortQ,
    onSelect: (id) => {
      state.activeCaseId = id;
      renderTable();
      renderDetail(getActive());
    },
  });
}

async function applyFilter() {
  const q = el.searchInput.value.trim().toLowerCase();
  const stateFilter = el.statusFilter.value;

  state.filtered = state.allCases.filter((c) => {
    const inText = c.case_id.toLowerCase().includes(q)
      || c.market.market_id.toLowerCase().includes(q)
      || c.market.question.toLowerCase().includes(q);
    const inState = stateFilter === 'all' ? true : c.settlement.branch_code === stateFilter;
    return inText && inState;
  });

  if (!state.filtered.some((c) => c.case_id === state.activeCaseId)) {
    state.activeCaseId = state.filtered[0]?.case_id;
  }

  await renderGlobalKpis(el, state.filtered, { isMismatch, spreadOf });
  renderTable();
  renderDetail(getActive());
}

setupTheme(el);
paintDataMode(boot.mode);

el.searchInput.addEventListener('input', applyFilter);
el.statusFilter.addEventListener('change', applyFilter);
el.refreshBtn?.addEventListener('click', async () => {
  const fresh = await loadCases();
  setCases(state, fresh.cases);
  paintDataMode(fresh.mode);
  await applyFilter();
});

setupTabs();
setupDemo({
  el,
  getFiltered: () => state.filtered,
  getActiveCaseId: () => state.activeCaseId,
  setActiveCaseId: (id) => { state.activeCaseId = id; },
  renderTable,
  renderDetail,
});
setupDisputeModal({ el, postJSON, showToast, getActive });
setupActionButtons({ el, postJSON, showToast, getActive, refreshGovernanceView });

applyFilter();
