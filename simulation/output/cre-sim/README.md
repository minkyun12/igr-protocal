# CRE Simulation Artifacts (Current Status)

Status: **local simulation artifacts generated successfully**.

This directory contains a reproducibility bundle produced from the simulation-safe workflow path.

## Scope clarity

- ✅ Completed without extra secrets: local simulation bundle generation and hash verification artifacts
- ⛔ Requires credentials/secrets: CRE account login for org-bound validation/deployment, Sepolia on-chain write proof, external LLM API replay

## Artifact files in this directory

- `simulate.log` (CLI run output)
- `input-package.json` (canonical package snapshot)
- `model-output-a.json`
- `model-output-b.json`
- `decision.json`
- `hashes.txt` (`package_hash`, `decision_hash`, output hashes)
- `simulation-summary.md`

## Optional credential-dependent validation

```bash
cd /Users/macmini/workspace/igr-protocol/cre
~/.cre/bin/cre login
~/.cre/bin/cre whoami
~/.cre/bin/cre workflow validate igr-settlement
~/.cre/bin/cre workflow simulate igr-settlement --config igr-settlement/config.staging.json
```

Use these only when CRE credentials are available.
