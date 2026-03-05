# 10. LLM Handoff Runbook

> 목적: 다른 LLM이 투입되어도 프로젝트 맥락 손실 없이 즉시 실행 가능하도록 만든 운영 문서

---

## 1) Read Order (강제)

다른 LLM은 반드시 아래 순서로 읽고 시작합니다.

1. `README.md`
2. `docs/08_IGR_MASTER_PLAYBOOK.md`
3. `docs/09_TECHNICAL_SPEC.md`
4. `docs/11_CASE_REPLAY_SPEC.md`
5. `docs/12_SUBMISSION_PACKAGE_GUIDE.md`

---

## 2) Mission Lock

### 절대 목표
- IGR를 제출 가능한 해커톤 프로젝트로 완성
- Primary: Prediction Markets
- Secondary: CRE & AI, Risk & Compliance

### 절대 금지
- 범위 확장(멀티체인, 풀 프로덕션화)
- 데모에서 미구현 기능 과장
- 근거 없는 자동 판정 강행

---

## 3) Daily Operating Loop

매일 아래 순서로 작업합니다.

1. 현재 TODO 상태 점검
2. 오늘 목표 1~2개만 선정
3. 구현
4. 테스트
5. simulation/output/reports에 결과 저장
6. 변경 요약 작성

보고 템플릿:
```md
## Daily Update
- Done:
- In Progress:
- Blockers:
- Next:
```

---

## 4) Task Priority

P0 (필수)
- 상태머신 3상태 구현
- CRE orchestration 실행증빙
- 정상/논쟁 replay 2개 시연

P1 (강화)
- proposer/challenger 품질 개선
- policy tuning

P2 (옵션)
- UI polish
- extra cases

---

## 5) Output Contract

각 단계 완료 시 아래 산출물을 남깁니다.

- 코드: `src/...`
- 테스트: `tests/...`
- 실행 로그: `artifacts/logs/...`
- 판정 리포트: `simulation/output/reports/...`
- 문서 갱신: `docs/...`

---

## 6) Replay Execution Contract

각 케이스는 최소 3개 체크포인트로 재현합니다.
- T-24h
- T-1h
- T+1h

각 체크포인트마다 아래를 저장합니다.
- 입력 evidence snapshot
- AI deliberation output
- policy evaluation
- final state

---

## 7) Demo Safety Contract

데모는 아래 2개를 반드시 포함합니다.

1. 정상 케이스 AUTO_RESOLVE
2. 충돌 케이스 HOLD

데모 중 API/네트워크 실패 가능성을 대비해
- replay artifact 기반 fallback 시연을 준비합니다.

---

## 8) Handoff Template

```md
## Handoff
### Current State
### What Works
### What Is Broken
### Highest Priority Next Step
### Exact Commands to Reproduce
### Artifacts to Review
```

---

## 9) Quality Bar

프로젝트는 아래 기준을 통과해야 제출합니다.
- 재현 가능성: 새 환경에서도 동일 결과
- 설명 가능성: 왜 HOLD인지 명시 가능
- 심사 적합성: 3트랙 스토리가 자연스럽게 연결
