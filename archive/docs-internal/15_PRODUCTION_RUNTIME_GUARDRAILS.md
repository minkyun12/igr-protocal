# IGR Production Runtime Guardrails

목적: 해커톤 데모 모드와 운영 모드를 명확히 분리해, 실행 환경 설정 실수로 보안 경계가 무너지지 않게 합니다.

## 1) 반드시 고정할 환경 변수 (운영)

- `MODEL_MODE=llm`
- `STRICT_FORWARDER_MODE=1` (또는 동등 설정)
- `ALLOW_DEBUG_RECORD_FALLBACK=0`
- `ENABLE_CHAINLINK_FETCH=1`

권장:
- `MODEL_TIMEOUT_MS`를 명시해 timeout 기준 일관화
- `RERUN_EXECUTION_MODE=realtime` (정책 지연을 실제 적용하려면)

## 2) 금지 설정 (운영)

- `ALLOW_DEBUG_RECORD_FALLBACK=1`
  - 이유: onReport 실패 시 debug path로 우회 가능
- 테스트/데모용 더미 RPC/키를 prod env에 혼합

## 3) Governance/Policy Lock 검증 체크리스트

배포 후 최소 1회 확인:
1. `GovernanceRegistry.getLockedConfig(marketId)`에서
   - `modelPair` (2개)
   - `mismatchPolicy`
   - `rerunDelayHours`
   - `configHash`
   값이 기대대로 lock 되었는지 확인
2. 워크플로우 런타임이 on-chain locked config를 우선 반영하는지 확인
3. `policy_source`가 `onchain-locked-config`로 기록되는지 확인

## 4) On-chain Recorder 경계

- `IgrRegistry.onReport(bytes,bytes)`는 `onlyAuthorized` 경계가 핵심입니다.
- `authorizedForwarder` 변경은 운영 Change Log에 남기고, 변경 tx hash를 증적 파일에 기록합니다.

## 5) 릴리즈 직전 최소 검증

```bash
npm run test:all
npm run check:contracts
```

두 명령이 모두 통과해야 릴리즈 태그를 생성합니다.
