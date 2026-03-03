# IGR Whitepaper Alignment Tracking

## Phase 0 — Baseline & Safety
- [x] Create implementation tracking checklist (`TRACKING.md`)
- [x] Split tests into core/integration scripts
- [x] Add stable local verification command docs

## Phase 1 — P0 Gaps
- [x] CRE workflow: log-trigger + EVM Read/HTTP/EVM Write path scaffolded (sim fallback kept)
- [x] Governance lock config -> evaluate pipeline wiring (env-enabled, fallback local policy)
- [x] Branch/state naming consistency across code/tests (docs pass pending)
- [ ] Sepolia deployment evidence (`simulation/output/onchain/deploy.md`)

## Phase 2 — P1 Hardening
- [ ] Forwarder authorization path tests
- [ ] Rule/Schema lock adversarial tests
- [ ] Oracle lock enforcement hardening + tests

## Phase 3 — P2 Reliability
- [ ] LLM mode reproducible run artifacts
- [ ] CI split (core vs integration)
- [ ] Whitepaper metrics auto-report script
