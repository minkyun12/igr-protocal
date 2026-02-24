# Submission Asset Index

## Required files status

- ✅ `submission/one-pager.md`
- ✅ `submission/demo-script.md`
- ✅ `submission/demo-video.mp4` (최종본, Korean narration + burned captions)
- ✅ `submission/demo-audio.m4a` (최종 나레이션 오디오)
- ✅ `submission/demo-captions.srt` (영상 자막)
- ✅ `submission/demo-shotlist.md` (타임라인별 화면 구성)

## Repro commands for judges

```bash
cd /Users/macmini/workspace/chainlink-convergence-2026
npm test
npm run replay -- --case=data/replay/case-a --policy=configs/policy.v1.json --out=artifacts/reports
npm run replay -- --case=data/replay/case-b --policy=configs/policy.v1.json --out=artifacts/reports
npm run replay:package -- --reports=artifacts/reports --out=artifacts/replay-package
npm run score
```

## Key artifacts to include in public submission

- `artifacts/reports/*.report.json`
- `artifacts/reports/*.manifest.json`
- `artifacts/replay-package/replay-package.summary.json`
- `artifacts/replay-package/replay-package.summary.md`

## Demo objective

Show clear contrast:
- Case A auto-resolve recommendation when policy is satisfied
- Case B hold-for-review when evidence conflict is high

## Media notes

- `submission/demo-video.mp4`: 3분 45초, 내레이션 포함, 자막 burn-in 완료
- `submission/demo-audio.m4a`: 영상과 동일한 한국어 나레이션 트랙
- 데모 내용은 `artifacts/reports/*` 및 `artifacts/replay-package/*`의 실제 값만 인용
