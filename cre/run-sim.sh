#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p ../simulation/output/cre-sim

TARGET="${CRE_TARGET:-staging-settings}"

# Provide safe placeholders for local simulation if not set
export MODEL_A_API_KEY="${MODEL_A_API_KEY:-sim-placeholder-model-a}"
export MODEL_B_API_KEY="${MODEL_B_API_KEY:-sim-placeholder-model-b}"
# Use obvious non-secret placeholder to avoid key-like literals in repo history
export CRE_ETH_PRIVATE_KEY="${CRE_ETH_PRIVATE_KEY:-DUMMY_CRE_PRIVATE_KEY_PLACEHOLDER}"

# Config placeholder bindings
export MARKET_CONTRACT_ADDRESS="${MARKET_CONTRACT_ADDRESS:-0x0000000000000000000000000000000000000001}"
export GOVERNANCE_REGISTRY_ADDRESS="${GOVERNANCE_REGISTRY_ADDRESS:-0x0000000000000000000000000000000000000002}"
export CHAINLINK_PRICE_FEED_ADDRESS="${CHAINLINK_PRICE_FEED_ADDRESS:-0x694AA1769357215DE4FAC081bf1f309aDC325306}"
export IGR_REGISTRY_ADDRESS="${IGR_REGISTRY_ADDRESS:-0x0000000000000000000000000000000000000003}"
export FORWARDER_ADDRESS="${FORWARDER_ADDRESS:-0x0000000000000000000000000000000000000004}"
export MODEL_A_ENDPOINT="${MODEL_A_ENDPOINT:-https://example.com/model-a}"
export MODEL_B_ENDPOINT="${MODEL_B_ENDPOINT:-https://example.com/model-b}"

{
  echo "[1/2] whoami"
  ~/.cre/bin/cre whoami
  echo "[2/2] simulate (target=$TARGET)"
  ~/.cre/bin/cre workflow simulate ./igr-settlement -T "$TARGET" --non-interactive --trigger-index 0 -v
} 2>&1 | tee ../simulation/output/cre-sim/simulate.log

echo "Done. Log written to simulation/output/cre-sim/simulate.log"
