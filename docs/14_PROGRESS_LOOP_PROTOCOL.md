# 14. Progress Loop Protocol

> 사용자 요청 루프: 계획 -> 수행 -> 1등 가능성 점수화 -> 5분 휴식 -> 보고 -> 보완

## Loop Template

### Step 1) Plan
- 이번 1사이클 목표 1~2개만 선택
- 완료 기준 정의

### Step 2) Execute
- 구현/테스트/리플레이 실행
- 산출물 저장(`artifacts/reports`)

### Step 3) Self-score (0~100)
- Technical completeness (40)
- Track fit (30)
- Demo clarity (20)
- Reproducibility (10)

### Step 4) Rest 5 min
- 무리한 범위확장 금지
- 실패 원인 짧게 정리

### Step 5) Report
- 이번 사이클 완료사항
- 현재 리스크
- 다음 5분 계획

### Step 6) Iterate
- 부족 점수 영역만 집중 보완

---

## Score Bands

- 85~100: 수상권 경쟁 가능
- 70~84: 중상위권
- 50~69: 완주권
- <50: 구조 재설계 필요

---

## Reporting Format (Korean)

```md
[Cycle N]
- 완료:
- 실패/리스크:
- 현재 점수: XX/100
- 1등 가능성: High/Medium/Low
- 다음 5분 목표:
```
