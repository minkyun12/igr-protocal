# IGR Interfaces

This document defines the stable boundaries between contracts, workflow runtime, frontend, and replay artifacts.

## 1) On-chain Interface (Solidity)

## 1.1 IgrRegistry
- File: `contracts/IgrRegistry.sol`
- Primary write path: `onReport(bytes metadata, bytes report)`
- Forwarder fallback path: `record(...)` (scaffold/runtime compatibility)

### Settlement outputs (canonical)
- `branch_code`: `FINAL_MATCH | FINAL_MISMATCH`
- `reason_code`: `MATCH_INITIAL | SPLIT_IMMEDIATE | RERUN_MATCH | RERUN_SPLIT | DUAL_FAILURE_INITIAL | DUAL_FAILURE_RERUN`
- `final_settlement`: `YES | NO | SPLIT_50_50`

## 1.2 GovernanceRegistry
- File: `contracts/GovernanceRegistry.sol`
- Lockpoint rule: config becomes immutable per market at `lockForMarket()`
- Locked policy fields include:
  - `mismatchPolicy`: `split_immediate | rerun_once_then_split`
  - `rerunDelayHours`: integer hours

## 2) Runtime Policy Interface

- File: `configs/policy.json`
- Runtime loader: `src/workflow/governanceConfig.js`
- Merge order:
  1. base config (`configs/policy.json`)
  2. locked governance config (if present)
- Runtime behavior:
  - enforce cross-vendor mode
  - enforce locked mismatch policy and rerun delay

## 3) Workflow Interface (CRE + CLI)

- CRE entry: `cre/igr-settlement/main.ts`
- Local evaluation entry: `src/workflow/evaluateEvent.js`
- Replay entry: `src/cli/replay.js`
- Replay package entry: `src/cli/replay-package.js`

### Required replay artifacts
- `*.report.json`
- `*.manifest.json`
- replay package summary JSON/MD

## 4) Frontend Interface

- UI server: `src/cli/serve-frontend.js`
- Frontend architecture: `frontend/ARCHITECTURE.md`

### API endpoints used by frontend
Read:
- `GET /api/markets`
- `GET /api/markets/:id`
- `GET /api/metrics`
- `GET /api/governance/proposals`

Write:
- `POST /api/disputes`
- `POST /api/proposals`
- `POST /api/escalations`
- `POST /api/evidence`
- `POST /api/governance/vote`
- `POST /api/governance/lock`

## 5) Verification Entry Points

- Full validation: `npm run verify`
- Test suite: `npm run test:all`
- Contract compile check: `npm run check:contracts`
- Forwarder guard verification: `npm run verify:forwarder`
