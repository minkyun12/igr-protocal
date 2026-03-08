# IGR Verification Log (Pre-Submission)

Last updated: 2026-03-08 (KST)

## 1) Test Suite Verification

- Command: `npm run test:all`
- Result: **40/40 PASS**, fail 0
- Contract check: `npm run check:contracts` pass

Recent hardening coverage includes:
1. governance strict lock failure path (`STRICT_GOVERNANCE_LOCK`)
2. governance optional source deterministic hashing/timestamp null behavior
3. oracle lock / cross-vendor guard behavior
4. deterministic settlement branch termination

## 2) Active Replay Case Verification

### Case 1 — Bitcoin (Polymarket up/down)
- Case path: `simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et`
- Checkpoint mode: single-point `T0`
- Source profile: Binance 1H candle assumption
- Result: `FINAL_MATCH / YES`
- Report: `simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et/case-bitcoin-up-or-down-march-8-5am-et-T0.report.json`

### Case 2 — Zelenskyy suit before July
- Case path: `simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july`
- Checkpoint mode: single-point `T0`
- Evidence profile: NYPost/BBC/KyivPost links + 3 direct image URLs
- Result: `FINAL_MATCH / YES`
- Report: `simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july/case-will-zelenskyy-wear-a-suit-before-july-T0.report.json`

## 3) Governance Flow Evidence (Mock Vote E2E)

Generated bundles:
- `simulation/output/e2e-bundle/governance-e2e-bitcoin.json`
- `simulation/output/e2e-bundle/governance-e2e-zelenskyy.json`

Flow proven in artifact:
`propose -> vote -> execute -> lockForMarket -> evaluate`

## 4) Sepolia On-Chain Verification

### Contract deployment
- Command: `node scripts/deploy-sepolia.mjs`
- Network: Sepolia
- Deployer: `0xFD264411bFdab771c6AB656Cc4B89804555d891E`

`IgrRegistry`
- Address: `0xbBD69207E16b97967f5FfCE80eBFba7B5e89e083`
- Deploy tx: `0x18690c93f871a403b5cb6f7cf497671f9a3b88831bc6f1e0f423786c96189f1c`

`GovernanceRegistry`
- Address: `0xFc86A4a14B2b86319E9c6893e8DD31084BD7CEF9`
- Deploy tx: `0x7bedb193596bac30728ef6712dd7342330dd45ce6b1cef508d8c43c6f200c3cf`

### On-chain write path
`onReport` record tx examples:
- `0xa57006755e062b58900bd55059fc01c0fbebbcf0576db80522c2938e0e97e0d2`
- `0xd1a77ab16cc1f866e0234ce33ac5c40ee361b6d6f46887fddd7b8fcfcc304bec`

Deployment evidence files:
- `simulation/output/onchain/deploy-output.json`
- `simulation/output/onchain/deploy.md`

## 5) CRE Verification Status

- CLI: `~/.cre/bin/cre`, version `v1.3.0`
- `smoke` workflow simulate: pass
- `igr-settlement` simulate:
  - `simulation-settings`: pass
  - `staging-settings` with `--evm-tx-hash` and `--evm-event-index`: pass

## 6) Current Readiness Summary

- Protocol core: ✅
- Active case replay artifacts: ✅
- Governance E2E artifacts: ✅
- Sepolia deployment + on-chain write proof: ✅
- CRE simulation proof (safe + staging trigger): ✅
- CRE deploy/activate: ⏸ pending organization deployment access approval

Overall status: **Submission-ready with reproducible technical evidence; deployment activation is the only optional pending external step.**
