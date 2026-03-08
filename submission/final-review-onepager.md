# IGR Hackathon Final Review (1-Page)

## Project
**IGR | Input-Governed Resolution**  
Token-governed AI input configuration for deterministic automatic resolution of binary prediction markets.

---

## 1) What is implemented now (judge-facing)

- Deterministic dual-model settlement engine
  - Terminal states: `FINAL_MATCH`, `FINAL_MISMATCH`
  - Final outcomes: `YES | NO | SPLIT_50_50`
- Strict schema lock + bounded retry
- Input-governance surfaces wired
  - model pair / optional sources / advisory prompts
- Hash-addressable audit trail
  - `package_hash`, `policy_hash`, `model_pair_hash`, `model_output_hashes`, `decision_hash`
- On-chain recorder path (`IgrRegistry.onReport`) with forwarder authorization checks
- CRE workflow scaffold path validated in simulation and staging-trigger mode

---

## 2) Verification status

### Passed locally
- `npm run test:all` → **40/40 pass**
- `npm run check:contracts` → pass

### Active replay cases
- `case-bitcoin-up-or-down-march-8-5am-et` (T0) → `FINAL_MATCH / YES`
- `case-will-zelenskyy-wear-a-suit-before-july` (T0) → `FINAL_MATCH / YES`

### Governance flow artifacts (mock vote E2E)
- `simulation/output/e2e-bundle/governance-e2e-bitcoin.json`
- `simulation/output/e2e-bundle/governance-e2e-zelenskyy.json`

### Sepolia evidence
- Contracts deployed (IgrRegistry + GovernanceRegistry)
- Deployment evidence:
  - `simulation/output/onchain/deploy-output.json`
  - `simulation/output/onchain/deploy.md`
- On-chain write tx evidence (`onReport`) captured

### CRE evidence
- CLI v1.3.0 confirmed
- `simulation-settings` simulate: success
- `staging-settings` simulate (with tx/log args): success

---

## 3) Known pending external step

- CRE **deploy/activate** requires organization deployment access approval.
- This is operational gating, not protocol implementation gap.

---

## 4) Canonical references

- Scope/boundaries: `submission/hackathon-spec.md`
- Claim-evidence mapping: `submission/claim-evidence-map.md`
- Detailed verification: `submission/verification-log.md`

---

## 5) Risk posture statement (for judges)

- Core protocol behavior is reproducible from this repo.
- Active evidence set is synchronized to the two current market cases.
- Optional CRE deployment activation is explicitly separated as an org-permission step.

---

## 6) Suggested oral close (20 seconds)

“IGR deterministically closes binary markets by governing inputs instead of outcomes. We provide replayable hash-linked artifacts, mock governance end-to-end flow, and Sepolia on-chain commitment evidence. CRE simulation is validated in both safe and staging-trigger paths, with only deployment access approval remaining as an external operational step.”
