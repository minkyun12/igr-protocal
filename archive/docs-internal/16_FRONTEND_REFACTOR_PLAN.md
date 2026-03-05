# Frontend Refactor Plan (Submission-Stable)

목표: `frontend/app.js` 단일 파일(약 600 LOC)을 기능별 모듈로 분리하여 유지보수성을 높이되, 제출 직전 안정성을 해치지 않는 **무중단 단계적 리팩토링**을 수행합니다.

## 0) 비목표 (이번 라운드에서 안 하는 것)
- 프레임워크 전환(React/Vue/Svelte)
- UI 디자인 대개편
- API 스펙 변경

## 1) 타겟 구조

```text
frontend/
  index.html
  styles.css
  app.js                  # 엔트리(조립만 담당)
  cases.json
  modules/
    state.js              # 전역 상태 + selectors
    api.js                # fetch/postJSON + endpoint wrappers
    elements.js           # DOM 참조 바인딩
    render/
      table.js            # market table
      detail.js           # detail panel
      kpis.js             # global kpis
      governance.js       # governance table/modal data
      charts.js           # signal/depth/state flow
      trust.js            # trust strip
    features/
      filters.js          # search/status filtering
      tabs.js             # tab behavior
      theme.js            # theme toggle/apply
      demo.js             # autoplay demo
      disputeModal.js     # dispute modal
      proposalModal.js    # proposal modal
      actions.js          # propose/vote/lock/evidence actions
    utils/
      format.js           # shortQ, spreadOf, date formatting
      dom.js              # toast, class helpers
```

## 2) 단계별 마이그레이션 (안전 순서)

### Phase 1 — Pure function 추출 (위험도 낮음)
추출 대상:
- `spreadOf`, `isMismatch`, `stateClass`, `shortQ`
- `showToast`
- `updateTrustStrip`

완료 기준:
- UI 동작 변경 없음
- `npm run ui` 수동 확인 통과

### Phase 2 — API 레이어 분리
추출 대상:
- `loadCases`, `postJSON`
- `/api/metrics`, `/api/governance/proposals` 호출 래퍼

완료 기준:
- app.js에서 직접 `fetch` 호출 제거
- API 실패 시 기존 toast 동작 동일

### Phase 3 — 렌더러 분리
추출 대상:
- `renderTable`
- `renderDetail`
- `renderGlobalKpis`
- `renderGovHistory`, `renderTimeline`, `renderSignalChart`

완료 기준:
- 렌더링 결과(텍스트/상태칩/테이블 row 수) 동일

### Phase 4 — 인터랙션/모달 분리
추출 대상:
- `setupTabs`, `setupDemo`, `setupDisputeModal`, `setupActionButtons`

완료 기준:
- 버튼 액션(제안/투표/락/에스컬레이션) 정상
- Escape/백드롭 닫기 동작 유지

### Phase 5 — 엔트리 경량화
`app.js`는 아래만 담당:
1) state init
2) module wiring
3) bootstrap (`applyFilter` 1회)

완료 기준:
- `app.js` 150 LOC 이하

## 3) 리그레션 체크리스트 (수동)

1. 화면 진입 시 market table 표시
2. 검색/상태 필터 동작
3. row 클릭 시 detail 전환
4. demo start/stop 동작
5. dispute modal submit 동작
6. governance vote/lock 버튼 동작
7. trust strip 표시 정상
8. refresh 시 data mode/live mock 표시 정상

## 4) 수용 기준 (Done)
- `frontend/app.js` <= 150 LOC
- `frontend/modules/*`로 기능 분리 완료
- 기능 동등성 체크리스트 8/8 통과
- README의 frontend 실행 안내 변경 불필요(명령 동일)

## 5) 롤백 전략
- 각 Phase는 작은 커밋으로 분리
- 문제 발생 시 직전 Phase 커밋만 revert
- 제출 직전에는 Phase 3 또는 4에서 멈춰도 무방 (안정성 우선)
