# IGR Submission Final Execution Checklist

Last updated: 2026-03-02 (KST)

## A. Already prepared (assistant-complete)
- [x] Project rename unified to `igr-protocol`
- [x] Legacy naming removed (`PoRE`, `PoreRegistry`, `vote-the-inputs`)
- [x] Whitepaper v2 micro-polish applied:
  - [x] Section 11.4 `(2/3)` → `(2 of 3 checkpoints)`
  - [x] Appendix D `Determinism` → `Settlement determinism`
  - [x] Extra blank lines after §18/§19 removed
- [x] Submission docs present (`one-pager`, `hackathon-spec`, `README`)
- [x] Tests passing (`npm test`)

## B. Manual-required (user action needed)

### 1) CRE authentication and simulation
- [x] `~/.cre/bin/cre login`
- [x] `~/.cre/bin/cre whoami`
- [x] `cd /Users/macmini/workspace/igr-protocol/cre && bash run-sim.sh`
- [x] Confirm `simulation/output/cre-sim/simulate.log` contains successful simulate completion (exit 0)

Status note:
- CRE local simulation now succeeds and logs `WorkflowExecutionFinished - Status: SUCCESS`.
- Current `cre/igr-settlement/main.ts` is a simulation-safe cron smoke path for runtime stability.

### 2) Sepolia deployment proof
- [ ] Deploy `IgrRegistry.sol` (script ready: `scripts/deploy-sepolia.mjs`)
- [ ] Deploy `GovernanceRegistry.sol`
- [ ] Capture contract addresses + tx hashes
- [ ] Record measured gas (not estimate only)

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

## D. Final gate
- [ ] `npm test` passes on final commit
- [ ] No legacy keyword remains (PoRE/vote-the-inputs/PoreRegistry)
- [ ] Whitepaper PDF regenerated if markdown changed
- [ ] All submission links open correctly
