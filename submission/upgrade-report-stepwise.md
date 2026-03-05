# IGR Stepwise Upgrade Report (Quality Pass)

## Scope
This report summarizes the staged quality upgrades applied to align implementation semantics with whitepaper v2 and improve judge-facing reproducibility.

## Step 1 — Whitepaper/Core Semantics Alignment
- Normalized persistent invalid schema and timeout/transport failures into equivalent persistent-failure fallback handling.
- Persistent failure now maps to synthetic `NO` for branch purposes while preserving failure reason via `safety_flags`.
- Preserved dual-failure forced split semantics.
- Added rerun execution mode control:
  - `simulation_fast` (default)
  - `realtime` (actual wait)

## Step 2 — Test Coverage Hardening
Added tests for:
- One persistent failure + other NO -> `FINAL_MATCH` with NO settlement
- Timeout/transport failure equivalence path -> persistent failure fallback + dual-failure split
- Rerun execution mode behavior (`simulation_fast` vs `realtime` latency behavior)
- CRE/core branch conformance for `split_immediate`

## Step 3 — CRE/On-chain Path Hardening
- CRE workflow now uses shared core-compatible resolver helper (`src/protocol/creCompat.js`) to reduce logic drift.
- Forwarder path made strict by default:
  - `onReport` failure now throws unless `ALLOW_DEBUG_RECORD_FALLBACK=1` is explicitly set.

## Step 4 — Submission Docs Sync
Updated:
- `submission/hackathon-spec.md`
- `submission/claim-evidence-map.md`

## Validation
- Command: `npm run test:core`
- Result: pass (29/29)
