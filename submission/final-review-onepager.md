# IGR Hackathon Final Review (1-Page)

## Project
**IGR | Input-Governed Resolution**  
Token-governed AI input configuration for deterministic automatic resolution of binary prediction markets.

---

## 1) What is implemented now (judge-facing)

- Deterministic dual-model settlement engine
  - Terminal states: `FINAL_MATCH`, `FINAL_MISMATCH`
  - Final outcomes: `YES | NO | SPLIT_50_50`
- Strict schema lock + bounded retry (single retry per model)
- Input governance surfaces wired
  - model pair / optional sources / advisory prompts
- Hash-addressable audit trail
  - `package_hash`, `policy_hash`, `model_pair_hash`, `model_output_hashes`, `decision_hash`
- Forwarder-guarded on-chain recorder interface
  - `IgrRegistry.onReport(bytes,bytes)` + `onlyAuthorized`
- CRE workflow scaffold path
  - Trigger -> EVM Read -> HTTP x2 -> EVM Write
- Replay reproducibility + package export

- Frontend interaction hardening
  - Trust strip (lock/oracle/rerun/freshness)
  - Action endpoints wired (propose/dispute/escalate local API)
  - Accessibility pass (tab ARIA, modal dialog semantics, ESC close, focus trap, aria-live toast)

---

## 2) Verification status

### Passed locally (no secrets)
- `npm run test:core` → **19/19 pass**
- `npm run replay` (case-a, case-b) → reports generated
- `npm run replay:package` → replay package summary generated
- `npm run verify:forwarder` → forwarder guard verification OK
- `npm run metrics` → report aggregation generated

### Evidence locations
- Claim-evidence mapping: `submission/claim-evidence-map.md`
- Replay reports: `simulation/output/reports/*`
- Replay package: `simulation/output/replay-package/*`
- CRE sim artifacts: `simulation/output/cre-sim/*`
- Tracking board: `TRACKING.md`

---

## 3) Known credential-dependent gaps (explicit)

1. Sepolia deployment proof
   - Missing: `SEPOLIA_RPC_URL`, `PRIVATE_KEY`
   - Target evidence: `simulation/output/onchain/deploy.md`, `deploy-output.json`

2. On-chain settlement tx proof (`ResolutionRecorded`)
   - Requires deployed contracts + authorized writer

3. External LLM reproducibility artifacts
   - Missing model/provider API credentials

4. CRE org-bound validation/deployment
   - Requires CRE login-enabled account/session

---

## 4) Canonical references (anti-duplication)

- Scope and boundaries (canonical): `submission/hackathon-spec.md`
- Claim-evidence mapping (canonical): `submission/claim-evidence-map.md`
- This file is a status snapshot and should be interpreted alongside those two canonical docs.

## 5) Risk posture statement (for judges)

- This submission demonstrates **protocol mechanics and determinism** with reproducible local artifacts.
- Credential-dependent proofs are clearly separated and documented as deployment-stage evidence.
- No hidden assumptions: out-of-scope and blocked items are explicitly listed.

---

## 6) Suggested oral close (20 seconds)

“IGR is fully implemented as a deterministic settlement protocol where governance configures inputs, not outcomes. We provide replayable hash-linked evidence and a forwarder-compatible on-chain recording path. Secret-dependent deployment proofs are isolated and documented, while core protocol behavior is fully reproducible from this repo.”
