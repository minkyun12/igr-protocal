# IGR Submission Final Execution Checklist

Last updated: 2026-03-08 (KST)

## A. Already completed
- [x] Active replay cases reduced to 2-case, single-checkpoint (`T0`) format
- [x] Legacy cases moved to `simulation/_legacy_snapshots/case-reset-20260308-202309/`
- [x] Core hardening patches applied:
  - [x] `STRICT_GOVERNANCE_LOCK`
  - [x] deterministic governance optional source normalization
  - [x] `REQUIRE_AUTHORIZED_FORWARDER`
- [x] Test + contract checks passing (`npm run test:all`, `npm run check:contracts`)
- [x] Sepolia deploy evidence generated (`simulation/output/onchain/deploy*.{json,md}`)
- [x] On-chain `onReport` write path tx evidence captured
- [x] CRE simulate success for:
  - [x] `simulation-settings`
  - [x] `staging-settings` (with tx hash + event index)
- [x] Governance E2E mock-flow bundles generated

## B. Final manual actions (before submit)

### 1) Document consistency pass
- [ ] Ensure all submission docs reference active 2-case setup
- [ ] Ensure old `case-a/b/c` references are marked as legacy-only where needed
- [ ] Ensure CRE command examples include `-T` targets

### 2) Optional deploy step (only if time permits)
- [ ] `cre account access` approved by org
- [ ] `cre workflow deploy ./igr-settlement -T staging-settings`
- [ ] `cre workflow activate <WORKFLOW_ID> -T staging-settings`

### 3) Submission packaging
- [ ] Public repo push
- [ ] Final demo/video consistency check
- [ ] Final form submission

## C. Judge-facing evidence bundle (must include)
- [ ] `simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et/*`
- [ ] `simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july/*`
- [ ] `simulation/output/e2e-bundle/governance-e2e-bitcoin.json`
- [ ] `simulation/output/e2e-bundle/governance-e2e-zelenskyy.json`
- [ ] `simulation/output/onchain/deploy-output.json`
- [ ] `simulation/output/onchain/deploy.md`

## D. Final gate
- [ ] `npm run verify` passes on final commit
- [ ] `.env` and secret material excluded from commit
- [ ] Whitepaper PDF is in sync with markdown
- [ ] All submission links open and render correctly
