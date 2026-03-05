# IGR Whitepaper Alignment Tracking

## Phase 0 — Baseline & Safety
- [x] Create implementation tracking checklist (`TRACKING.md`)
- [x] Split tests into core/integration scripts
- [x] Add stable local verification command docs

## Phase 1 — P0 Gaps
- [x] CRE workflow: log-trigger + EVM Read/HTTP/EVM Write path scaffolded (sim fallback kept)
- [x] Governance lock config -> evaluate pipeline wiring (env-enabled, fallback local policy)
- [x] Branch/state naming consistency across code/tests (docs pass pending)
- [ ] Sepolia deployment evidence (`simulation/output/onchain/deploy.md`) — blocked by missing `SEPOLIA_RPC_URL`/`PRIVATE_KEY` credentials

## Phase 2 — P1 Hardening
- [x] Forwarder authorization path tests (static guard verification + core test)
- [x] Rule/Schema lock adversarial tests
- [x] Oracle lock enforcement hardening + tests (feed auto-include + chainlink source auto-classification + mandatory guard)
- [x] Cross-vendor policy guard + tests (same-vendor model pair rejected)

## Phase 3 — P2 Reliability
- [ ] LLM mode reproducible run artifacts (bundle script ready) — blocked by missing LLM API credentials
- [x] CI split (core workflow added; integration kept separate)
- [x] Whitepaper metrics auto-report script
