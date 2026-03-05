# Submission Asset Index (v2 Synced)

## Required files status

- ✅ `whitepaper/input-governed-resolution.md`
- ✅ `whitepaper/input-governed-resolution.pdf`
- ✅ `submission/hackathon-spec.md` (v2 judging criteria mapping and demo flow)
- ✅ `submission/one-pager.md` (v2 thesis summary)
- ✅ `archive/submission-media/demo-script.md`
- ✅ `archive/submission-media/demo-video.mp4` (final cut, Korean narration + burned captions)
- ✅ `archive/submission-media/demo-audio.m4a` (final narration track)
- ✅ `archive/submission-media/demo-captions.srt` (subtitle file)
- ✅ `archive/submission-media/demo-shotlist.md` (timeline shot composition)

## Repro commands for judges

```bash
cd /Users/macmini/workspace/igr-protocol
npm run test:core
npm run replay -- --case=simulation/input/replay/case-a --policy=configs/policy.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-b --policy=configs/policy.json --out=simulation/output/reports
npm run replay:package -- --reports=simulation/output/reports --out=simulation/output/replay-package
npm run artifacts:repro -- simulation/output/cre-sim simulation/input/replay/case-a checkpoint-T+1h.json
```

## CRE validation commands (post-login)

```bash
cd /Users/macmini/workspace/igr-protocol/cre
~/.cre/bin/cre login
~/.cre/bin/cre whoami
bash run-sim.sh
```

Latest status:
- ✅ local simulation success confirmed (`archive/simulation-output/cre-sim/simulate.log`)
- log contains `WorkflowExecutionFinished - Status: SUCCESS`
- CRE workflow now attempts `onReport(bytes,bytes)` first with ABI-encoded payload; fallback `record(...)` is retained for scaffold compatibility
- `STRICT_FORWARDER_MODE=1` disables fallback and enforces forwarder-only write behavior

## Key artifacts to include in public submission

- `archive/simulation-output/reports/**/*.report.json`
- `archive/simulation-output/reports/**/*.manifest.json`
- `archive/simulation-output/replay-package/**/replay-package.summary.json`
- `archive/simulation-output/replay-package/**/replay-package.summary.md`
- `archive/simulation-output/cre-sim/*` (reproducibility bundle: `simulate.log`, `input-package.json`, `model-output-a.json`, `model-output-b.json`, `decision.json`, `hashes.txt`)
- `archive/simulation-output/onchain/deploy-output.json`
- `archive/simulation-output/onchain/deploy.md`

## Demo objective

Show deterministic terminal settlement with explicit governance boundaries:
- Match branch -> `YES` or `NO`
- Mismatch branch -> `SPLIT_50_50` (immediate or rerun-once policy)
- On-chain commitment path -> `KeystoneForwarder -> IgrRegistry.onReport(metadata, report)`

## Media notes

- `archive/submission-media/demo-video.mp4`: 3m 45s, narration included, burned captions
- `archive/submission-media/demo-audio.m4a`: narration track used in the final video
- Demo claims only cite values from archived replay artifacts (`archive/simulation-output/reports/*`, `archive/simulation-output/replay-package/*`)
