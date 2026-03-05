# IGR Verification Log (Pre-Submission)

Last updated: 2026-03-05 (KST)

## 1) Test Suite Verification

### Core + Extended tests
- Command: `npm run test:all`
- Result: **35/35 PASS**, fail 0
- Coverage includes:
  - Deterministic settlement semantics
  - Oracle/Schema/Policy guard checks
  - Replay/package build flow
  - Integration smoke
  - Hardening tests (property/fuzz/adversarial)

### Added hardening coverage
- File: `tests/hardening.test.js`
- Verified:
  1. Package hash invariance under evidence reordering
  2. Governance optional source cannot impersonate oracle-mandatory type
  3. Fuzzed branch termination always ends in terminal state
  4. Deterministic decision hash on identical simulation inputs
  5. Injection-like long text evidence does not break terminal settlement

## 2) Live/Replay Pipeline Verification

### Replay execution
- Command: `npm run replay -- --case=simulation/input/replay/case-b --policy=configs/policy.json --out=/tmp/igr-audit-reports`
- Result: success (all checkpoints processed)

### Repro bundle
- Command: `npm run artifacts:repro -- /tmp/igr-audit-repro simulation/input/replay/case-a checkpoint-T+1h.json`
- Result: success, `decision_hash_verified=true`

### E2E bundle (local/offchain)
- Command: `npm run artifacts:e2e -- --out=/tmp/igr-audit-e2e --case=simulation/input/replay/case-a --checkpoint=checkpoint-T+1h.json`
- Result: success, `decision_hash_verified=true`

## 3) Sepolia On-Chain Verification

### Contract deployment
- Command: `node scripts/deploy-sepolia.mjs`
- Network: Sepolia
- Deployer: `0xFD264411bFdab771c6AB656Cc4B89804555d891E`

#### IgrRegistry
- Address: `0x96b229A6d5932C8e8d922E9D93A4CcCf556d7824`
- Deploy tx: `0x59efc4cae3da22fba30fe072c48ae784e2b78184035a9602f1e5bc3d2d24af68`
- Block: `10389230`

#### GovernanceRegistry
- Address: `0xC86586160b857C2EaD1c1c402dAea30558954c89`
- Deploy tx: `0x209c63d260583bf348392bd551b6ba7b95aa079bf7b1339398764d05587f4f26`
- Block: `10389231`

### onReport write path
- Command: `npm run artifacts:e2e -- --out=/tmp/igr-e2e-onchain --case=simulation/input/replay/case-a --checkpoint=checkpoint-T+1h.json --onchain=1`
- Result: `onchain=recorded`
- Tx: `0xc6ba8b363eb0ad892fc12c3af680e4ae1c3587e9407d6829d090b16124d01a06`
- Block: `10389233`
- Decision hash check: `decision_hash_verified=true`

## 4) LLM Endpoint Verification

### Initial status
- Prior key/model runs produced fallback with `TIMEOUT_OR_TRANSPORT_FAILURE` for one adjudicator.

### Final verified status
- Anthropic direct minimal check:
  - Model `claude-sonnet-4-20250514` returned HTTP 200.
- LLM bundle re-run:
  - Command: `npm run artifacts:llm -- /tmp/igr-llm-artifacts-once2 simulation/input/replay/case-a`
  - Result: both adjudicators returned normal structured outputs
  - `model-output-a.json`: verdict YES, no safety flags
  - `model-output-b.json`: verdict YES, no safety flags

## 5) Implemented Fixes During Verification

1. **Oracle lock live-path fix**
   - File: `src/protocol/compilePackage.js`
   - Change: classify chainlink evidence (`price|onchain_oracle|chainlink_data_feed` with chainlink source_id) as `chainlink_data_feed`.

2. **Integration fixture alignment**
   - File: `tests/integration/smoke.test.js`
   - Change: chainlink-like evidence source for oracle lock compliance.

3. **Optional-source lock hardening**
   - File: `src/protocol/compilePackage.js`
   - Change: governance optional sources forced to `governance_optional_source` type to prevent oracle-class spoofing.

## 6) Current Readiness Summary

- Protocol core: ✅
- Guard/lock semantics: ✅
- Test suite (strict): ✅ (35/35)
- Replay/repro artifacts: ✅
- Sepolia deploy + on-chain record: ✅
- Dual-vendor LLM runtime check: ✅

Overall status: **Submission-ready (technical verification complete).**
