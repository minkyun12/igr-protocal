# IGR Submission Final Execution Checklist

Last updated: 2026-03-04 (KST)

## A. Already prepared (assistant-complete)
- [x] Project rename unified to `igr-protocol`
- [x] Legacy naming removed (`PoRE`, `PoreRegistry`, `vote-the-inputs`)
- [x] Whitepaper v2 micro-polish applied:
  - [x] Section 11.4 `(2/3)` → `(2 of 3 checkpoints)`
  - [x] Appendix D `Determinism` → `Settlement determinism`
  - [x] Extra blank lines after §18/§19 removed
- [x] Submission docs present (`one-pager`, `hackathon-spec`, `README`)
- [x] Core tests passing (`npm run test:core`)
- [x] Integration smoke test added (`tests/integration/smoke.test.js`)
- [x] Governance optional sources wired into canonical package build path
- [x] Governance lock schema extended: `mismatchPolicy` + `rerunDelayHours` now lock per market and propagate into runtime policy
- [x] CRE `onReport(bytes,bytes)` payload upgraded to ABI-encoded report (ethers AbiCoder)
- [x] CRE workflow keeps `record(...)` fallback for scaffold/runtime compatibility
- [x] `STRICT_FORWARDER_MODE=1` support added (disables fallback on `onReport` failure)
- [x] `onReport` ABI payload round-trip tests added (`tests/creReportEncoding.test.js`)
- [x] Repro bundle exporter added (`npm run artifacts:repro`) for Section 19 artifact set
- [x] Frontend modular refactor completed (`frontend/modules/**` introduced, `app.js` 599→105 LOC)
- [x] Frontend architecture doc synced to current module topology (`frontend/ARCHITECTURE.md`)

## B. Manual-required (user action needed)

### 1) CRE authentication and simulation
- [x] `~/.cre/bin/cre login`
- [x] `~/.cre/bin/cre whoami`
- [x] `cd /Users/macmini/workspace/igr-protocol/cre && bash run-sim.sh`
- [x] Confirm `simulation/output/cre-sim/simulate.log` contains successful simulate completion (exit 0)

Status note:
- CRE local simulation now succeeds and logs `WorkflowExecutionFinished - Status: SUCCESS`.
- `cre/igr-settlement/main.ts` now attempts production path first (`onReport(bytes,bytes)` with ABI-encoded report payload), then falls back to `record(...)` for simulation/runtime compatibility.
- Simulation-safe cron trigger path is still available when `simulationSafe` is enabled.

### 2) Sepolia deployment proof
- [ ] Deploy `IgrRegistry.sol` (script ready: `scripts/deploy-sepolia.mjs`)
- [ ] Deploy `GovernanceRegistry.sol`
- [ ] Capture contract addresses + tx hashes
- [ ] Record measured gas (not estimate only)
- [x] Deployment evidence auto-writer added: `simulation/output/onchain/deploy-output.json` + `simulation/output/onchain/deploy.md`

Current blocker:
- missing `SEPOLIA_RPC_URL` + `PRIVATE_KEY` env vars on this runtime

### 3) Final submission
- [ ] Push latest repo to public GitHub
- [ ] Update demo video with CRE simulation scene (if changed)
- [ ] Submit Airtable form before deadline

## C. Evidence bundle to attach after manual steps
Create/update these files after CRE + Sepolia:
- `simulation/output/cre-sim/simulate.log`
- `simulation/output/cre-sim/input-package.json`
- `simulation/output/cre-sim/model-output-a.json`
- `simulation/output/cre-sim/model-output-b.json`
- `simulation/output/cre-sim/decision.json`
- `simulation/output/cre-sim/hashes.txt`
- `simulation/output/onchain/deploy.md`

Automation notes:
- Repro bundle generation: `npm run artifacts:repro -- simulation/output/cre-sim simulation/input/replay/case-a checkpoint-T+1h.json`
- Optional real CRE log copy: add 4th arg as source simulate.log path
- Deploy evidence generation happens automatically when `node scripts/deploy-sepolia.mjs` succeeds

## D. Final gate
- [ ] `npm test` passes on final commit
- [ ] No legacy keyword remains (PoRE/vote-the-inputs/PoreRegistry)
- [ ] Whitepaper PDF regenerated if markdown changed
- [ ] All submission links open correctly
