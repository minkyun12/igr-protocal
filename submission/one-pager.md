# IGR | Input-Governed Resolution

**Token-Governed AI Input Configuration for Deterministic Automatic Resolution**

## One-Pager (Submission v2 Sync)

## Problem

Binary market settlement is fragile when governance votes directly on the final outcome bit (`YES/NO`).
Under concentrated token power, evidence can be bypassed at the last step.

## Core Thesis

Shift governance from **outcome voting** to **input configuration voting**.

Governance can modify only three surfaces:
1. model pair (exactly 2 adjudicators)
2. optional evidence sources
3. advisory prompts

Protocol locks remain non-governable:
- Rule Lock (canonical rule-text priority)
- Oracle Lock (mandatory Chainlink evidence inclusion)
- Schema Lock (strict JSON output contract)
- Domain Lock (`YES/NO` only)
- Policy Lock (deterministic branch semantics)

## Deterministic Settlement

- `YES/YES` or `NO/NO` -> finalize matched outcome
- `YES/NO` ->
  - `split_immediate` (instant 50/50), or
  - `rerun_once_then_split` (single delayed rerun, then 50/50 if mismatch persists)

Terminal guarantee: bounded execution path with **8 calls max total (4 settlement-relevant)**.
No discretionary human arbitration is required.

## Why It Matters

- **Liveness:** no dead-end settlement state
- **Auditability:** package/output/decision hashes are replayable
- **Governance hardening:** token power cannot directly override final verdict bits
- **Operational clarity:** two-model baseline with explicit mismatch handling

## Implementation Snapshot

- Canonical input package compiler
- Dual-model strict JSON adjudication contract
- Deterministic branch executor + mismatch policies
- CRE orchestration path (Log Trigger -> EVM Read -> HTTP x2 -> EVM Write)
- On-chain commitment via `KeystoneForwarder -> IgrRegistry.onReport(metadata, report)`
- Governance contract (`GovernanceRegistry`) with MVP unit-weight voting and ERC-20Votes migration plan

## Judge-Facing Mapping

- **Technical execution:** deterministic machine-checkable workflow + bounded termination
- **Blockchain fit:** on-chain settlement commitments + governance lock events
- **CRE fit:** capability-based workflow and forwarder-mediated delivery path
- **Originality:** governance target shift (outcome -> inputs)

## Repro (minimal)

```bash
cd /Users/macmini/workspace/igr-protocol
npm test
npm run replay -- --case=simulation/input/replay/case-a --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-b --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay:package -- --reports=simulation/output/reports --out=simulation/output/replay-package
```

## Docs Map

- Whitepaper v2 (concept/spec): `whitepaper/v2/input-governed-resolution.md`
- Submission spec (judge/demo): `submission/hackathon-spec.md`
- One-pager (this file): `submission/one-pager.md`
