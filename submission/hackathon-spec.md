# IGR | Input-Governed Resolution

**Hackathon Submission Spec (v2 Sync)**

**Token-Governed AI Input Configuration for Deterministic Automatic Resolution**

This document is submission-oriented. It aligns implementation scope, demo flow, and judge-facing claims with whitepaper v2.

## 1) Submission Scope

### Implemented in repository
- Input-governed settlement architecture (model pair / source set / advisory prompts)
- Deterministic dual-model settlement branching
- Mismatch policy profiles:
  - `split_immediate`
  - `rerun_once_then_split`
- Replayable artifacts with hash traceability
- On-chain recording path via `KeystoneForwarder -> IgrRegistry.onReport(metadata, report)`
- `GovernanceRegistry` reference implementation (unit-weight voting MVP)
- CRE workflow scaffold (`igr-settlement`) with Log Trigger -> EVM Read -> HTTP x2 -> EVM Write pipeline

### Intentionally out of scope for this submission
- Full tokenomics launch design
- 3-of-N committee expansion beyond two-model baseline
- Production-grade anti-sybil governance protection
- Decentralized model hosting

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
npm test
npm run replay -- --case=simulation/input/replay/case-a --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-b --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay:package -- --reports=simulation/output/reports --out=simulation/output/replay-package
```

For CRE-oriented validation (post-login):

```bash
cd cre
~/.cre/bin/cre whoami
~/.cre/bin/cre workflow validate igr-settlement
~/.cre/bin/cre workflow simulate igr-settlement --config igr-settlement/config.staging.json
```

Expected:
- tests pass
- replay reports generated
- replay package summary generated with hash trace
- CRE simulation emits decodable report payload (when environment is configured)

## 5) Submission Artifacts

- Whitepaper v2: `whitepaper/v2/input-governed-resolution.md`
- Whitepaper v2 PDF: `whitepaper/v2/input-governed-resolution.pdf`
- Hackathon spec (this file): `submission/hackathon-spec.md`
- One-pager: `submission/one-pager.md`
- Demo media: `submission/demo-video.mp4`
- Replay outputs: `simulation/output/reports/*`, `simulation/output/replay-package/*`

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
