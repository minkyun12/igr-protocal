# CRE Deploy Checklist (Sepolia)

## Current status
- `smoke` simulate: ✅ passed
- `igr-settlement` simulate (`simulation-settings`): ✅ passed
- `igr-settlement` simulate (`staging-settings` + EVM trigger tx/log): ✅ passed

## 1) PATH
```bash
echo 'export PATH="$HOME/.cre/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
cre version
```

## 2) Required env
- `SEPOLIA_RPC_URL`
- `PRIVATE_KEY` (or `CRE_ETH_PRIVATE_KEY`)
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
- `MARKET_CONTRACT_ADDRESS`
- `GOVERNANCE_REGISTRY_ADDRESS`
- `IGR_REGISTRY_ADDRESS`
- `FORWARDER_ADDRESS`
- `CHAINLINK_PRICE_FEED_ADDRESS`

## 3) Simulate (quick)
```bash
cd /Users/macmini/workspace/igr-protocol/cre
set -a && source ../.env && set +a

MODEL_A_API_KEY="$OPENAI_API_KEY" \
MODEL_B_API_KEY="$ANTHROPIC_API_KEY" \
CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" \
cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0
```

## 4) Simulate (staging with real EVM log trigger)
```bash
cd /Users/macmini/workspace/igr-protocol/cre
set -a && source ../.env && set +a

MODEL_A_API_KEY="$OPENAI_API_KEY" \
MODEL_B_API_KEY="$ANTHROPIC_API_KEY" \
CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" \
cre workflow simulate ./igr-settlement \
  -T staging-settings \
  --non-interactive \
  --trigger-index 0 \
  --evm-tx-hash <TX_HASH> \
  --evm-event-index <LOG_INDEX>
```

## 5) Deploy / activate
```bash
cre account access
cre workflow deploy ./igr-settlement -T staging-settings
cre workflow activate <WORKFLOW_ID> -T staging-settings
```

## 6) Security before publish
- Do **not** commit `.env`
- Rotate exposed test keys if reused
- Keep only `.env.example` in repo
