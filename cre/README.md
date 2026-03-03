# CRE Workflow Scaffold (IGR)

This directory contains the Chainlink Runtime Environment (CRE) scaffold for the IGR settlement workflow.

## Structure

- `project.yaml`
- `secrets.yaml`
- `.env.example`
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
cre workflow simulate igr-settlement
```

## Notes

- `main.ts` is wired to the IGR pipeline modules from `src/`.
- Replace placeholder contract addresses and endpoint secrets before simulation.
- For real execution, configure `FORWARDER_ADDRESS`, `IGR_REGISTRY_ADDRESS`, and RPC/auth secrets.
