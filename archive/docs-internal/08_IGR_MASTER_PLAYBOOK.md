# 08. IGR Master Playbook (LLM Execution Blueprint)

> 목적: 이 문서 하나만 읽어도 다른 LLM/개발자가 프로젝트를 동일하게 수행할 수 있도록 작성한 **실행 계약서**입니다.

---

## 0) Project Identity

- Project Codename: **IGR** (Input-Governed Resolution)
- Tagline: **Safe, verifiable, policy-gated prediction market resolution**
- Primary Track: **Prediction Markets**
- Secondary Differentiators: **CRE & AI**, **Risk & Compliance**

### 핵심 문제
예측시장 결과 판정은 실제로 다음 리스크를 가집니다.
- 소스 충돌(데이터 불일치)
- 시간 경계(Too Early)
- 모호한 규칙 해석
- AI 오판/환각

IGR는 이를 해결하기 위해
1) 다중 증거 수집,
2) AI 제안+반박,
3) 정책 기반 통과/보류,
4) CRE 오케스트레이션,
5) 감사로그
를 하나의 실행 파이프라인으로 통합합니다.

---

## 1) Success Criteria (Definition of Done)

## 1.1 필수 완료 조건 (Must)
1. CRE 워크플로우가 end-to-end 1회 이상 성공 실행된다.
2. 입력 이벤트에 대해 최종 상태가 아래 3개 중 하나로 결정된다.
   - `AUTO_RESOLVE_RECOMMENDED`
   - `HOLD_FOR_REVIEW`
   - `REJECTED_INSUFFICIENT_EVIDENCE`
3. 결과에 대한 근거(소스/점수/정책 판정 이유)가 JSON 로그로 남는다.
4. 3~5분 데모 영상에서 정상 케이스 + 보류 케이스를 재현한다.
5. README에 재현 방법이 문서화된다.

## 1.2 수상형 강화 조건 (Should)
1. AI proposer + AI challenger 2단계 판정이 구현된다.
2. 정책 파일(Policy-as-Code)만 바꿔 판정 결과가 변한다.
3. 논쟁 사례 replay에서 보수적 HOLD 동작이 명확히 보인다.

## 1.3 비목표 (Non-goals)
- 실제 프로덕션 자동 정산 배포
- 다수 체인/다수 시장 완전 지원
- 완전 자동 무인 판정(사람 검토 경로 제거)

---

## 2) Track Mapping Strategy

### Prediction Markets (Primary)
- 시장 결과 판정 파이프라인 자체가 제품의 중심
- 이벤트 규칙/소스 기반 판정 추천

### CRE & AI (Secondary)
- AI가 근거 제안을 생성
- CRE가 데이터 수집→AI→정책평가→결과출력까지 오케스트레이션

### Risk & Compliance (Secondary)
- 최소 출처 수, 편차 임계치, 시간 경계 등 정책으로 안전장치 구현
- 조건 미달 시 자동 HOLD

---

## 3) Hard Constraints

1. **CRE 의미적 사용 필수**
2. 제출물 필수 4종
   - Public repo
   - Demo video (3~5 min)
   - 1-page explanation
   - README
3. 기존 코드 재사용 시 해커톤 기간 내 신규 기여분 구분 가능해야 함
4. 프론트엔드/외부 배포는 필수 아님

---

## 4) System Architecture

## 4.1 Logical Pipeline
`Event Input -> Evidence Ingestion -> Evidence Graph -> AI Deliberation -> Policy Engine -> CRE Decision -> Audit Report`

## 4.2 Components

### A. Event Intake
- 입력: market_id, question, rule_text, end_time, resolution_source
- 출력: EventSpec

### B. Evidence Ingestion
- 시장 데이터, 가격 데이터, 보조 텍스트 근거 수집
- 모든 항목에 `source_id`, `timestamp`, `raw_value`, `normalized_value` 저장

### C. Evidence Graph
- 노드: claim/observation/source
- 엣지: supports/conflicts/derived_from
- 산출: coverage_score, conflict_score

### D. AI Deliberation
- Proposer: YES/NO + rationale + confidence
- Challenger: proposer 반박 + risk flags + adjusted confidence

### E. Policy Engine (Policy-as-Code)
- 정책 파일 기반 룰 평가
- 통과/보류/거절 결정

### F. CRE Orchestrator
- 워크플로우 단계 실행/재시도/종료 상태 관리

### G. Audit Reporter
- 입력/출력/중간판정/정책 위반 항목 로그화
- 제출용 리포트 JSON + human summary 생성

---

## 5) Canonical Decision States

1. `AUTO_RESOLVE_RECOMMENDED`
   - 모든 필수 정책 통과
2. `HOLD_FOR_REVIEW`
   - 일부 핵심 정책 실패(근거충돌/신뢰도 미달/경계시점)
3. `REJECTED_INSUFFICIENT_EVIDENCE`
   - 최소 데이터 충족 불가

---

## 6) Policy Baseline (v1)

```yaml
policy_version: v1
min_sources: 3
max_cross_source_deviation_bps: 30
min_ai_confidence: 0.75
max_conflict_score: 0.25
allow_too_early: false
require_rule_text_match: true
```

### Rule Evaluation Order
1. Temporal validity (too early 여부)
2. Data sufficiency (최소 출처)
3. Cross-source consistency
4. AI confidence/conflict
5. Rule-text consistency

---

## 7) Demo Narrative (4-min target)

1. Problem framing (20s)
2. Pipeline architecture (30s)
3. Case A 정상 케이스 (70s) → AUTO_RESOLVE
4. Case B 논쟁 케이스 (70s) → HOLD
5. Policy threshold 변경 재평가 (40s)
6. Track mapping + why CRE (30s)

---

## 8) Controversial Case Replay Principles

1. **Resolved markets only**
2. 결과를 뒤집는 목적이 아니라 “자동화 안전성” 검증 목적
3. 시점 스냅샷(T-24h, T-1h, T+1h) 재현
4. 소스/정책/판정근거를 모두 기록

---

## 9) Repository Deliverables (Required Files)

- `/docs/TECH_SPEC.md` 또는 동급 문서
- `/docs/POLICY.md`
- `/docs/CASE_REPLAY.md`
- `/simulation/output/reports/*.json`
- `/artifacts/demo-script.md`
- `/README.md`

---

## 10) 6-Day Execution Plan

### Day 1
- 아키텍처 고정, 스키마 정의, 정책 baseline 작성

### Day 2
- ingestion + normalization + graph 초안

### Day 3
- proposer/challenger + score 합성

### Day 4
- policy engine + state machine + CRE wiring

### Day 5
- case replay + 리포트 생성 + README 정리

### Day 6
- 데모 촬영 + 제출 패키징 + 예비 제출

---

## 11) Risk Register

1. CRE 통합 지연
   - 완화: CLI 시뮬레이션 우선
2. 데이터 소스 불안정
   - 완화: replay snapshot 캐시
3. AI 출력 불안정
   - 완화: deterministic prompt + schema validation
4. 데모 실패
   - 완화: prerecorded fallback + canned artifacts

---

## 12) Final QA Gate

제출 전 아래 7개를 모두 만족해야 함.

- [ ] CRE 실행 로그 존재
- [ ] 상태머신 3상태 동작 검증
- [ ] 정상/논쟁 케이스 모두 재현
- [ ] 정책 변경에 따른 결과 변화 시연
- [ ] README 재현성 확보
- [ ] 데모 5분 이내
- [ ] 제출 링크/자산 무결성 확인
