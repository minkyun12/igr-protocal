# Frontend Architecture — IGR Markets & Resolution Desk

현재 프론트엔드는 단일 파일에서 모듈형 구조로 리팩토링 완료되었습니다.

## 1) Scope

Frontend path:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js` (bootstrap/orchestration only)
- `frontend/modules/**` (feature/render/api/state 분리)

Local server + mock API path:
- `src/cli/serve-frontend.js`

Primary data source (fallback):
- `frontend/cases.json`

---

## 2) Runtime Model

Load order:
1. `GET /api/markets` (live-mode)
2. fallback `./cases.json` (mock-mode)

Header badge:
- `DATA: LIVE`
- `DATA: MOCK`

---

## 3) Module Topology

## 3.1 Entry Layer
- `app.js`
  - state 생성
  - element binding
  - filter/render orchestration
  - feature setup 호출

## 3.2 State + DOM Binding
- `modules/state.js`
  - `createState`, `activeCase`, `setCases`
- `modules/elements.js`
  - DOM element map binding

## 3.3 API Layer
- `modules/api.js`
  - `loadCases()`
  - `postJSON()`

## 3.4 Render Layer
- `modules/render/kpis.js`
- `modules/render/table.js`
- `modules/render/detail.js`
- `modules/render/governance.js`
- `modules/render/charts.js`
- `modules/render/trust.js`

## 3.5 Feature Layer
- `modules/features/tabs.js`
- `modules/features/demo.js`
- `modules/features/theme.js`
- `modules/features/modals.js`
- `modules/features/actions.js`

## 3.6 Utility Layer
- `modules/utils/format.js`
- `modules/utils/dom.js`

---

## 4) Render Flow

Core pipeline:
- `applyFilter()`
  -> `renderGlobalKpis()`
  -> `renderTable()`
  -> `renderDetail(activeCase)`

Detail composition:
- `renderDetailCore()`
- `renderGovHistory()`
- `renderTimeline()`
- `renderSignalChart()`
- `renderStateFlow()`
- `updateTrustStrip()`

---

## 5) View Composition

## 5.1 Trust Strip
- `#trustLock`
- `#trustOracle`
- `#trustRerunMode`
- `#trustFreshness`

## 5.2 Topbar
- `#dataMode`, `#refreshBtn`, `#demoToggle`

## 5.3 Global KPI Strip
- `#gActive`, `#gMatch`, `#gDispute`, `#gSpread`

## 5.4 Markets Panel
- search: `#searchInput`
- filter: `#statusFilter`
- table body: `#marketRows`

## 5.5 Detail Panel
- header: `#detailTitle`, `#detailSub`, `#stateChip`
- kpis: `#kpiSettlement`, `#kpiPolicy`, `#kpiSpread`
- charts: `#signalChart`, `#depthChart`
- tabs: adjudication/evidence/actions/audit

---

## 6) API Contract (local server)

Implemented in `src/cli/serve-frontend.js`.

Read:
- `GET /api/markets`
- `GET /api/markets/:id`
- `GET /api/metrics`
- `GET /api/governance/proposals`

Write (mock persistence in memory):
- `POST /api/disputes`
- `POST /api/proposals`
- `POST /api/escalations`
- `POST /api/evidence`
- `POST /api/governance/vote`
- `POST /api/governance/lock`

---

## 7) Styling System

`frontend/styles.css`
- dense market-console visual
- pills/chips/kpi/table/timeline/modal primitives
- responsive collapse at `max-width: 1100px`

---

## 8) Accessibility

- ARIA tab roles (`tablist`, `tab`, `tabpanel`)
- modal `role="dialog"`, `aria-modal="true"`
- ESC close + focus trap
- toast `aria-live="polite"`

---

## 9) Current Gaps

1. Backend persistence is process-memory mock (restart 시 초기화)
2. 차트는 synthetic render (실시간 피드 아님)
3. dispute state machine은 로컬 계산 기반
4. governance history는 mock+seeded 혼합

---

## 10) Recommended Next API Additions

- `GET /api/disputes/:marketId`
- `GET /api/markets/:id/history`
- `GET /api/governance/proposals/:id`
- `GET /api/governance/locks/:marketId`
