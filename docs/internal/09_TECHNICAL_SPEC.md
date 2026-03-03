# 09. Technical Spec (Implementation-Grade)

## 1) Data Contracts

## 1.1 EventSpec
```json
{
  "event_id": "string",
  "market_id": "string",
  "question": "string",
  "rule_text": "string",
  "resolution_source": ["string"],
  "market_end_time": "ISO-8601",
  "evaluation_time": "ISO-8601"
}
```

## 1.2 EvidenceRecord
```json
{
  "evidence_id": "string",
  "event_id": "string",
  "source_id": "string",
  "source_type": "market|price|news|official|onchain",
  "timestamp": "ISO-8601",
  "raw_value": "string|number|object",
  "normalized_value": "number|string|object",
  "unit": "string",
  "quality_score": 0.0
}
```

## 1.3 AIDeliberation
```json
{
  "event_id": "string",
  "proposer": {
    "decision": "YES|NO|UNKNOWN",
    "confidence": 0.0,
    "rationale": "string",
    "used_evidence_ids": ["string"]
  },
  "challenger": {
    "counterpoints": ["string"],
    "conflict_flags": ["string"],
    "adjusted_confidence": 0.0
  }
}
```

## 1.4 PolicyEvaluation
```json
{
  "event_id": "string",
  "rules": [
    {"name": "min_sources", "passed": true, "value": 4, "threshold": 3},
    {"name": "max_deviation_bps", "passed": false, "value": 45, "threshold": 30}
  ],
  "final_state": "AUTO_RESOLVE_RECOMMENDED|HOLD_FOR_REVIEW|REJECTED_INSUFFICIENT_EVIDENCE",
  "reason_codes": ["DEVIATION_TOO_HIGH"]
}
```

## 1.5 AuditReport
```json
{
  "run_id": "string",
  "event_id": "string",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "workflow_steps": [
    {"step": "ingestion", "status": "ok", "latency_ms": 1320},
    {"step": "ai_deliberation", "status": "ok", "latency_ms": 2890}
  ],
  "final_state": "HOLD_FOR_REVIEW",
  "human_summary": "string",
  "artifacts": {
    "event_spec": "path",
    "evidence": "path",
    "policy_eval": "path"
  }
}
```

---

## 2) Minimal API Surface

## 2.1 POST /v1/evaluate
- 입력: EventSpec
- 출력: PolicyEvaluation + run_id

## 2.2 GET /v1/runs/{run_id}
- 출력: AuditReport

## 2.3 POST /v1/replay
- 입력: event_id + replay_checkpoint
- 출력: PolicyEvaluation

## 2.4 POST /v1/policy/validate
- 입력: policy yaml/json
- 출력: schema validation 결과

---

## 3) Suggested File Layout

```text
project/
  src/
    workflows/
      evaluate_event.ts
      replay_case.ts
    modules/
      ingestion/
      evidence_graph/
      ai/
      policy/
      reporter/
    schemas/
      event.schema.json
      evidence.schema.json
      policy.schema.json
  configs/
    policy.v1.yaml
    policy.strict.yaml
  data/
    replay/
      case-001/
        T-24h.json
        T-1h.json
        T+1h.json
  artifacts/
    reports/
    logs/
  docs/
```

---

## 4) Prompt Contract for AI Modules

## Proposer Prompt Requirements
- 반드시 `decision`, `confidence`, `rationale`, `used_evidence_ids` 반환
- 근거 없는 단정 금지
- `UNKNOWN` 허용

## Challenger Prompt Requirements
- proposer 출력의 취약점만 분석
- 반박 근거를 evidence_id와 연결
- 감정/서사 배제, 검증형 문장 사용

---

## 5) Determinism Rules

- temperature 낮게 고정(예: 0~0.2)
- structured JSON output 강제
- parse 실패 시 1회 재시도 후 HOLD
- confidence 범위 [0,1] 벗어나면 무효

---

## 6) Acceptance Tests

1. 데이터 부족
- source=1개만 입력
- 기대: `REJECTED_INSUFFICIENT_EVIDENCE`

2. 출처 충돌
- 동일 지표 편차 > threshold
- 기대: `HOLD_FOR_REVIEW`

3. 정상 합의
- source>=3, 편차 낮음, confidence 높음
- 기대: `AUTO_RESOLVE_RECOMMENDED`

4. Too Early
- 이벤트 종료 이전 시점
- 기대: `HOLD_FOR_REVIEW` 또는 `REJECTED` (policy 설정 기준)
