# 12. Submission Package Guide

## 1) 제출 패키지 구성

필수 제출물 4종:
1. Public GitHub repository
2. Demo video (3~5 min)
3. 1-page technical explanation
4. Synth/Chainlink 등 요구 API/기술 사용 증거 (본 프로젝트는 CRE)

IGR 패키지 권장 구성:

```text
/
  README.md
  docs/
    architecture.md
    policy.md
    case-replay.md
  artifacts/
    reports/
      caseA.json
      caseB.json
    demo/
      storyboard.md
```

---

## 2) README 필수 문단

1. Problem
2. Why CRE
3. Architecture
4. Decision states
5. Replay cases
6. How to run
7. Demo link
8. Track mapping

---

## 3) 1-Page Technical Explanation 템플릿

### Title
IGR: Policy-Gated, AI-Assisted Resolution Engine for Prediction Markets

### Problem
Prediction market resolution can be ambiguous due to conflicting sources, timing edges, and rule interpretation.

### Solution
IGR combines evidence ingestion, dual-agent AI deliberation, policy-as-code risk checks, and CRE-based orchestration.

### Technical Core
- Evidence Graph
- Proposer/Challenger AI
- Policy Engine
- CRE Workflow
- Audit Reports

### Practical Value
Reduces unsafe auto-resolution by enforcing HOLD under conflict and insufficient evidence.

### Track Fit
- Primary: Prediction Markets
- Secondary: CRE & AI, Risk & Compliance

---

## 4) Demo 영상 템플릿 (4분)

- 0:00~0:20 문제 정의
- 0:20~0:50 아키텍처
- 0:50~2:00 Case A 정상
- 2:00~3:10 Case B 논쟁
- 3:10~3:40 정책 변경 시뮬레이션
- 3:40~4:00 트랙 매핑 + 마무리

---

## 5) 최종 점검표

- [ ] 영상 길이 5분 이하
- [ ] README 재현 가능
- [ ] CRE 사용이 중심 역할로 명확
- [ ] HOLD/RESOLVE 분기 시연 완료
- [ ] replay artifacts 첨부
- [ ] 제출 폼 링크/리포 링크 검증
