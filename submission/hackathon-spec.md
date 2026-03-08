# IGR | Input-Governed Resolution

**Hackathon Submission Spec (v2 Sync)**

**Token-Governed AI Input Configuration for Deterministic Automatic Resolution**

This document is submission-oriented. It aligns implementation scope, demo flow, and judge-facing claims with whitepaper v2.

## 1) Submission Scope

### Implemented in repository
- Input-governed settlement architecture (model pair / source set / advisory prompts) + market-locked settlement profile (`mismatchPolicy`, `rerunDelayHours`)
- Deterministic dual-model settlement branching
- Mismatch policy profiles:
  - `split_immediate`
  - `rerun_once_then_split`
- Rerun execution mode profile:
  - `simulation_fast` (default, no realtime sleep)
  - `realtime` (actual delay wait before rerun)
- Replayable artifacts with hash traceability
- On-chain recording path via `KeystoneForwarder -> IgrRegistry.onReport(metadata, report)`
- `GovernanceRegistry` reference implementation (unit-weight voting MVP)
- CRE workflow scaffold (`igr-settlement`) with Log Trigger -> EVM Read -> HTTP x2 -> EVM Write pipeline
- Forwarder-first write path hardened (`onReport` required by default; debug `record` fallback opt-in via env)

### Intentionally out of scope for this submission
- Full tokenomics launch design
- 3-of-N committee expansion beyond two-model baseline
- Production-grade anti-sybil governance protection
- Decentralized model hosting
- Credential-dependent/organization-dependent operations:
  - CRE deploy/activate on hosted environment (organization deployment access required)
  - External LLM API reproducibility runs (`MODEL_A_API_KEY` / `MODEL_B_API_KEY` or provider keys)

Note: Sepolia deployment and on-chain write evidence are already captured in this repo under `simulation/output/onchain/*`.

## 2) Judge Criteria Mapping

| Criterion | Evidence in this project |
|---|---|
| Technical execution | Strict JSON output contract, deterministic branching, bounded finite termination (8 calls max total, 4 settlement-relevant) |
| Blockchain use | On-chain settlement commitments + governance lock lifecycle |
| CRE integration | Capability-based orchestration and forwarder-mediated write path |
| Originality | Governance target shift: output voting -> input governance |
| Risk/compliance fit | Hash-addressable package/output/decision artifacts, explicit threat model and limitations |

## 3) Demo Plan (3-5 minutes)

1. **Problem framing (30-45s)**  
   Explain outcome-vote concentration risk in subjective market resolution.

2. **Input governance surfaces (45-60s)**  
   Show the only governable fields: model pair, optional sources, advisory prompts.

3. **Deterministic run walkthrough (60-90s)**  
   - Case M (match): `YES/YES` -> finalize matched outcome
   - Case X (mismatch): `YES/NO` -> policy branch (`split_immediate` or rerun)

4. **Audit replay proof (45-60s)**  
   Present package hash, model output hashes, branch code, and decision hash reproducibility.

5. **On-chain commitment close (20-30s)**  
   Show forwarder path and `ResolutionRecorded` event.

## 4) Reproducibility Commands

```bash
cd /Users/macmini/workspace/igr-protocol
npm run test:all

npm run replay -- --case=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et \
  --policy=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et/policy.assumption.json \
  --out=simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et \
  --checkpoint=T0

npm run replay -- --case=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july \
  --policy=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july/policy.assumption.json \
  --out=simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july \
  --checkpoint=T0
```

For CRE-oriented validation:

```bash
cd cre
~/.cre/bin/cre version
set -a && source ../.env && set +a

# simulation-safe
MODEL_A_API_KEY="${OPENAI_API_KEY:-dummy}" \
MODEL_B_API_KEY="${ANTHROPIC_API_KEY:-dummy}" \
CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" \
~/.cre/bin/cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0

# staging trigger path
MODEL_A_API_KEY="${OPENAI_API_KEY:-dummy}" \
MODEL_B_API_KEY="${ANTHROPIC_API_KEY:-dummy}" \
CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" \
~/.cre/bin/cre workflow simulate ./igr-settlement -T staging-settings --non-interactive --trigger-index 0 --evm-tx-hash <TX_HASH> --evm-event-index <LOG_INDEX>
```

Expected:
- tests pass
- replay reports generated
- replay package summary generated with hash trace
- reproducibility bundle exported (`simulate.log`, `input-package.json`, `model-output-a.json`, `model-output-b.json`, `decision.json`, `hashes.txt`)
- CRE simulation emits decodable report payload (local simulation-safe path complete; org-bound validation requires credentials)

## 5) Submission Artifacts

- Whitepaper v2: `whitepaper/input-governed-resolution.md`
- Whitepaper v2 PDF: `whitepaper/input-governed-resolution.pdf`
- Hackathon spec (this file): `submission/hackathon-spec.md`
- One-pager: `submission/one-pager.md`
- Demo media: public video link submitted on Devpost form
- Replay outputs (active):
  - `simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et/*`
  - `simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july/*`
- Governance E2E bundles:
  - `simulation/output/e2e-bundle/governance-e2e-bitcoin.json`
  - `simulation/output/e2e-bundle/governance-e2e-zelenskyy.json`
- CRE simulation output directory: `simulation/output/cre-sim/*`
- Claim-evidence map: `submission/claim-evidence-map.md`
- Final review one-pager: `submission/final-review-onepager.md`
- Evidence snapshot (judge-friendly bundle): `submission/evidence-snapshot/*`
- Deployment evidence outputs: `simulation/output/onchain/deploy-output.json`, `simulation/output/onchain/deploy.md` (credential-dependent)

## 6) Key Differentiators

1. **Deterministic closure by construction** (no undefined terminal state)
2. **Governance boundary hardening** (input layer configurable, lock layer immutable)
3. **Machine-checkable audit path** (hash-addressable package/output/decision)
4. **Forwarder-verified on-chain commitment path** (CRE-compatible)
5. **Pragmatic migration path** (MVP unit-weight -> ERC-20Votes production model)

## 7) Risks and Honest Limitations

- Persistent disagreement increases 50/50 split frequency.
- Vendor model drift can reduce long-horizon reproducibility unless endpoint pinning is strict.
- API provider centralization remains a residual dependency in current architecture.
- Governance centralization risk is constrained by protocol locks but not mathematically eliminated.

These are explicit engineering trade-offs, not hidden assumptions.
