# Submission Asset Index (v2 Synced)

## Required files status

- ✅ `whitepaper/v2/input-governed-resolution.md`
- ✅ `whitepaper/v2/input-governed-resolution.pdf`
- ✅ `submission/hackathon-spec.md` (v2 기준 심사 매핑/데모 플로우)
- ✅ `submission/one-pager.md` (v2 핵심 논지 요약)
- ✅ `submission/demo-script.md`
- ✅ `submission/demo-video.mp4` (최종본, Korean narration + burned captions)
- ✅ `submission/demo-audio.m4a` (최종 나레이션 오디오)
- ✅ `submission/demo-captions.srt` (영상 자막)
- ✅ `submission/demo-shotlist.md` (타임라인별 화면 구성)

## Repro commands for judges

```bash
cd /Users/macmini/workspace/igr-protocol
npm test
npm run replay -- --case=simulation/input/replay/case-a --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-b --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay:package -- --reports=simulation/output/reports --out=simulation/output/replay-package
```

## CRE validation commands (post-login)

```bash
cd /Users/macmini/workspace/igr-protocol/cre
~/.cre/bin/cre login
~/.cre/bin/cre whoami
bash run-sim.sh
```

Latest status:
- ✅ local simulation success confirmed (`simulation/output/cre-sim/simulate.log`)
- log contains `WorkflowExecutionFinished - Status: SUCCESS`
- current CRE workflow entrypoint is configured as a simulation-safe cron smoke path for local runtime stability

## Key artifacts to include in public submission

- `simulation/output/reports/*.report.json`
- `simulation/output/reports/*.manifest.json`
- `simulation/output/replay-package/replay-package.summary.json`
- `simulation/output/replay-package/replay-package.summary.md`
- `simulation/output/cre-sim/*` (if simulation logs are captured)

## Demo objective

Show deterministic terminal settlement with explicit governance boundaries:
- Match branch -> `YES` or `NO`
- Mismatch branch -> `SPLIT_50_50` (immediate or rerun-once policy)
- On-chain commitment path -> `KeystoneForwarder -> IgrRegistry.onReport(metadata, report)`

## Media notes

- `submission/demo-video.mp4`: 3분 45초, 내레이션 포함, 자막 burn-in 완료
- `submission/demo-audio.m4a`: 영상과 동일한 한국어 나레이션 트랙
- 데모 내용은 `simulation/output/reports/*` 및 `simulation/output/replay-package/*`의 실제 값만 인용
