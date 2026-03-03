# CRE Simulation Artifacts (Pending Login)

Current blocker: CRE CLI authentication required.

Observed error:
- `authentication required: you are not logged in, run cre login and try again`

## Run sequence (after login)

```bash
cd /Users/macmini/workspace/igr-protocol/cre
~/.cre/bin/cre login
~/.cre/bin/cre whoami
bash run-sim.sh
```

## Expected outputs in this directory

- `simulate.log` (full CLI output)
- `input-package.json` (canonical package snapshot)
- `model-output-a.json`
- `model-output-b.json`
- `decision.json`
- `hashes.txt` (`package_hash`, `decision_hash`, output hashes)

## Verification checklist

- Workflow simulate command exits 0
- Report payload decodable for `IgrRegistry.onReport(bytes,bytes)`
- `decision_hash` recompute matches `decision.json`
