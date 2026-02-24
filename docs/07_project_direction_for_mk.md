# 07. Project Direction for MK (Updated)

## 목표

우선순위 3개를 **한 프로젝트에서 동시에 충족**합니다.

1. Prediction Markets (Primary)
2. CRE & AI (Secondary)
3. Risk & Compliance (Secondary)

---

## 프로젝트명 (권장)

**PoRE (Proof-of-Resolution Engine)**

### 핵심 가치
- 예측시장 결과 판정 자동화의 속도는 유지하고,
- 잘못된 자동 판정 리스크는 정책 엔진으로 억제합니다.

---

## 제품 한 줄

"PoRE is a CRE-native, AI-assisted, policy-gated engine that recommends safe market resolution only when evidence quality and consistency thresholds are satisfied."

---

## 핵심 모듈

1. Evidence Ingestion
2. Evidence Graph
3. AI Proposer / AI Challenger
4. Policy Engine (rules as code)
5. CRE Orchestration
6. Audit Report

---

## 판정 상태

- `AUTO_RESOLVE_RECOMMENDED`
- `HOLD_FOR_REVIEW`
- `REJECTED_INSUFFICIENT_EVIDENCE`

---

## 데모 강조점

- 정상 케이스: 자동 판정 권고
- 논쟁 케이스: 자동 보류 + 이유 출력
- 정책 변경: 결과가 달라지는 장면 시연

---

## 심사 대응 포지션

- Technical execution: 재현 가능한 파이프라인
- Blockchain application: CRE 기반 실행흐름
- Effective use of CRE: 오케스트레이션 중심
- Originality: AI 자동화 + 안전장치 결합
