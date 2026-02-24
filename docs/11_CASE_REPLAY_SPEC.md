# 11. Case Replay Spec (Polymarket)

> 목적: 논쟁성 있는 실제 시장을 재현(replay)하여 PoRE의 안전한 의사결정 능력을 증명

---

## 1) 왜 Replay가 중요한가

해커톤 심사에서 단순 데모보다, 실제 난이도 높은 사례 재현이
- 실전성(Practical relevance)
- 리스크 대응능력
- 설명 가능성
을 크게 강화합니다.

---

## 2) 데이터/거버넌스 사실관계 (공식 문서 기준)

Polymarket 공식 문서 요약:
- 시장 해석은 제목보다 **rules text**가 우선
- 결과 제안은 UMA Optimistic Oracle 기반
- 일반적으로 제안/분쟁에 bond(통상 $750) 필요
- 챌린지 기간 2시간
- 분쟁 시 debate/vote 프로세스로 확장 가능

참고:
- https://docs.polymarket.com/concepts/resolution
- https://help.polymarket.com/en/articles/13364518-how-are-prediction-markets-resolved
- https://help.polymarket.com/en/articles/13364551-how-are-markets-disputed

---

## 3) Replay 대상 선정 기준

아래 기준 5개 중 3개 이상 충족 시 채택:

1. 거래량/관심도가 높았던 시장
2. rule 해석 여지가 있었던 시장
3. 소스 간 시차/불일치가 존재한 시장
4. 커뮤니티에서 분쟁이 공개 논의된 시장
5. 결과 판정 시점 경계(Too Early 가능성)가 존재

---

## 4) Replay 입력 스키마

```json
{
  "case_id": "string",
  "market_url": "string",
  "question": "string",
  "rules_text": "string",
  "resolution_source": ["string"],
  "checkpoints": [
    {
      "label": "T-24h",
      "timestamp": "ISO-8601",
      "evidence_files": ["path"]
    }
  ]
}
```

---

## 5) Replay 출력 스키마

```json
{
  "case_id": "string",
  "checkpoint": "T-24h",
  "ai_decision": "YES|NO|UNKNOWN",
  "policy_state": "AUTO_RESOLVE_RECOMMENDED|HOLD_FOR_REVIEW|REJECTED_INSUFFICIENT_EVIDENCE",
  "reason_codes": ["string"],
  "summary": "string"
}
```

---

## 6) Case Set 구성 가이드

## Case A (Control)
- 논쟁 적은 명확 시장
- 기대: AUTO_RESOLVE

## Case B (Conflict)
- 출처 불일치/시차 존재
- 기대: HOLD_FOR_REVIEW

## Case C (Boundary)
- 종료 직전/직후 경계
- 기대: Too Early 방지 로직 작동

---

## 7) 논쟁 사례 후보 운용 원칙

주의: 외부 기사 기반 “논쟁 사례 후보”는 사실관계 오염 가능성이 있으므로,
아래 순서로만 사용합니다.

1. Polymarket 시장 페이지 원문 규칙 확인
2. 공식 resolution/dispute 문서와 일치성 점검
3. 필요 시 보조 기사(Forbes/Cointelegraph 등)는 참고로만 사용
4. 확정 사실/해석 의견을 분리 표기

---

## 8) Demo 사용 문구 가이드

- 권장: “This replay demonstrates why automated systems should hold when evidence is conflicted.”
- 금지: “Official resolution was wrong.”

프로젝트 목적은 공식 결과 반박이 아니라,
**안전한 자동화 의사결정 파이프라인 제시**입니다.
