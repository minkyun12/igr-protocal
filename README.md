# IGR | Input-Governed Resolution

**Token-Governed AI Input Configuration for Deterministic Automatic Resolution**

Deterministic automatic settlement protocol for binary prediction markets.
Token governance configures **inputs** (model pair, optional sources, advisory prompts) and pre-lock settlement profile (`mismatchPolicy`, `rerunDelayHours`). Once `lockForMarket()` executes, the full config is immutable for that market, and protocol locks keep settlement finite and auditable.

**Start Here**
1. Whitepaper (protocol concept/spec): [`whitepaper/input-governed-resolution.md`](whitepaper/input-governed-resolution.md)
2. Interface boundaries (contracts/runtime/frontend): [`INTERFACES.md`](INTERFACES.md)
3. Hackathon submission spec: [`submission/hackathon-spec.md`](submission/hackathon-spec.md)
4. One-pager: [`submission/one-pager.md`](submission/one-pager.md)
5. Evidence snapshot (judge-friendly): [`submission/evidence-snapshot/README.md`](submission/evidence-snapshot/README.md)

**Additional submission docs**
- Claim-evidence map: [`submission/claim-evidence-map.md`](submission/claim-evidence-map.md)
- Final review one-pager: [`submission/final-review-onepager.md`](submission/final-review-onepager.md)

---

## Protocol (Implemented)

- Two-model adjudication (`adjudicatorA`, `adjudicatorB`)
- Strict JSON output contract + deterministic one-time retry

**State vs Reason convention (important):**
- `settlement.branch_code` is the **terminal state** (`FINAL_MATCH` or `FINAL_MISMATCH`).
- `settlement.reason_code` is the **branch reason** (`MATCH_INITIAL`, `SPLIT_IMMEDIATE`, `RERUN_MATCH`, `RERUN_SPLIT`, `DUAL_FAILURE_INITIAL`, `DUAL_FAILURE_RERUN`).
- `final_settlement` is the **payout outcome** (`YES`, `NO`, `SPLIT_50_50`).
- Settlement terminal states:
  - `FINAL_MATCH`
  - `FINAL_MISMATCH`
- Branch reason codes (audit-level):
  - `MATCH_INITIAL`
  - `SPLIT_IMMEDIATE`
  - `RERUN_MATCH`
  - `RERUN_SPLIT`
  - `DUAL_FAILURE_INITIAL`
  - `DUAL_FAILURE_RERUN`
- Final outcomes are terminal only: `YES | NO | SPLIT_50_50`
- Hash-based audit trail:
  - `package_hash`, `policy_hash`, `model_pair_hash`, `model_output_hashes`, `decision_hash`
- Evidence format supports numeric/text/multimodal metadata (`uri`, `mime_type`, `extracted_text`, `content_summary`, `signal_score`, `verdict_hint`)

---

## Quickstart

```bash
npm install
npm run verify
# optional: npm run test:integration
```

Replay active real-world cases:

```bash
npm run replay -- --case=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et --policy=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et/policy.assumption.json --out=simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et --checkpoint=T0
npm run replay -- --case=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july --policy=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july/policy.assumption.json --out=simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july --checkpoint=T0
```

Run live evaluation:

```bash
npm run live
```

Verification helpers:

```bash
npm run verify:forwarder    # static guard verification for forwarder authorization
npm run metrics             # aggregate replay metrics from simulation/output/reports
npm run artifacts:llm       # build CRE-style artifact bundle (requires MODEL_MODE=llm + API keys)
```

---

## CRE Workflow (Scaffold)

A CRE scaffold has been added under `cre/`:

- `cre/project.yaml`
- `cre/secrets.yaml`
- `cre/igr-settlement/main.ts`
- `cre/igr-settlement/workflow.yaml`

Run after installing CRE CLI:

```bash
cd cre
# simulation-safe target
cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0

# staging log-trigger target (requires real tx hash + log index)
cre workflow simulate ./igr-settlement -T staging-settings --non-interactive --trigger-index 0 --evm-tx-hash <TX_HASH> --evm-event-index <LOG_INDEX>
```

Note:
- `cre/secrets.yaml` maps environment variable names only.
- No secret values are committed in this repository.

## Frontend Demo (Professional Case Console)

Historical-case dashboard (Polymarket-style analyst UI):

```bash
npm run ui
# open http://localhost:4173
```

Included UI demo cases (frontend fixture):
- `case-ukraine-deal`
- `case-zelenskyy-suit`

Active replay cases (simulation input):
- `case-bitcoin-up-or-down-march-8-5am-et`
- `case-will-zelenskyy-wear-a-suit-before-july`

Frontend files:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`
- `frontend/cases.json`
- `frontend/ARCHITECTURE.md` (full frontend architecture and API mapping)

---

## Repository Layout

- `contracts/*` — on-chain registries and lock rules
- `cre/*` — CRE workflow scaffold/runtime entry
- `src/protocol/*` — canonical package compiler, model adapters, deterministic settlement
- `src/workflow/*` — execution pipeline and on-chain/runtime adapters
- `frontend/*` — case-driven demo UI
- `configs/policy.json` — baseline mismatch/rerun policy
- `simulation/input/replay/*` — replay fixtures
- `simulation/output/*` — active generated outputs (`.gitkeep` retained)
- `submission/*` — submission-facing assets
- `archive/*` — legacy/non-essential artifacts

---

## Note on Legacy Engine

Previous HOLD/REJECT-oriented logic is deprecated for the current protocol direction.
Current implementation prioritizes deterministic terminal settlement aligned with the whitepaper.
