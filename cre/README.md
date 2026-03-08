# CRE Workflow Scaffold (IGR)

This directory contains the Chainlink Runtime Environment (CRE) scaffold for the IGR settlement workflow.

## Structure

- `project.yaml`
- `secrets.yaml`
- `../.env.example` (repository root)
- `igr-settlement/`
  - `workflow.yaml`
  - `config.staging.json`
  - `package.json`
  - `tsconfig.json`
  - `main.ts`

## Prerequisites

Install CRE CLI first:

```bash
curl -sSL https://cre.chain.link/install.sh | sh
cre version
```

## Local simulation (after CRE CLI install)

```bash
cd cre
# simulation-safe target
cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0

# staging trigger target (requires tx hash + log index)
cre workflow simulate ./igr-settlement -T staging-settings --non-interactive --trigger-index 0 --evm-tx-hash <TX_HASH> --evm-event-index <LOG_INDEX>
```

## Notes

- `main.ts` is wired to the IGR pipeline modules from `src/`.
- Replace placeholder contract addresses and endpoint secrets before simulation.
- For real execution, configure `FORWARDER_ADDRESS`, `IGR_REGISTRY_ADDRESS`, and RPC/auth secrets.
