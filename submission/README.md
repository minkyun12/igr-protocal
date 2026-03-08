# Submission Asset Index (Current)

## Required files status

- ✅ `whitepaper/input-governed-resolution.md`
- ✅ `whitepaper/input-governed-resolution.pdf`
- ✅ `submission/hackathon-spec.md`
- ✅ `submission/one-pager.md`
- ✅ `submission/claim-evidence-map.md`
- ✅ `submission/final-review-onepager.md`

## Repro commands for judges (active cases)

```bash
cd /Users/macmini/workspace/igr-protocol
npm run test:all

npm run replay -- --case=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et \
  --policy=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et/policy.assumption.json \
  --out=simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et \
  --checkpoint=T0

npm run replay -- --case=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july \
  --policy=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july/policy.assumption.json \
  --out=simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july \
  --checkpoint=T0
```

## CRE validation commands

```bash
cd /Users/macmini/workspace/igr-protocol/cre
~/.cre/bin/cre version
set -a && source ../.env && set +a

# simulation-safe
MODEL_A_API_KEY="${OPENAI_API_KEY:-dummy}" \
MODEL_B_API_KEY="${ANTHROPIC_API_KEY:-dummy}" \
CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" \
~/.cre/bin/cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0

# staging trigger path (requires tx hash/log index)
MODEL_A_API_KEY="${OPENAI_API_KEY:-dummy}" \
MODEL_B_API_KEY="${ANTHROPIC_API_KEY:-dummy}" \
CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" \
~/.cre/bin/cre workflow simulate ./igr-settlement -T staging-settings --non-interactive --trigger-index 0 --evm-tx-hash <TX_HASH> --evm-event-index <LOG_INDEX>
```

## On-chain deployment evidence (Sepolia)

- `simulation/output/onchain/deploy-output.json`
- `simulation/output/onchain/deploy.md`

Current deployment addresses:
- `IgrRegistry`: `0xbBD69207E16b97967f5FfCE80eBFba7B5e89e083`
- `GovernanceRegistry`: `0xFc86A4a14B2b86319E9c6893e8DD31084BD7CEF9`

## Important note

Judge-facing scenario set is 2-case single-checkpoint (`T0`) only.
