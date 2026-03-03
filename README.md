# IGR | Input-Governed Resolution

**Token-Governed AI Input Configuration for Deterministic Automatic Resolution**

Deterministic automatic settlement protocol for binary prediction markets.
Token governance configures **inputs** (model pair, optional sources, advisory prompts), while protocol locks keep settlement finite and auditable.

**Documents**
- Whitepaper (concept/spec): [`whitepaper/v2/input-governed-resolution.md`](whitepaper/v2/input-governed-resolution.md)
- Hackathon submission spec: [`submission/hackathon-spec.md`](submission/hackathon-spec.md)

---

## Protocol (Implemented)

- Two-model adjudication (`adjudicatorA`, `adjudicatorB`)
- Strict JSON output contract + deterministic one-time retry
- Settlement branches:
  - `FINAL_MATCH`
  - `FINAL_MISMATCH_SPLIT`
  - `FINAL_RERUN_MATCH`
  - `FINAL_RERUN_SPLIT`
- Final outcomes are terminal only: `YES | NO | SPLIT_50_50`
- Hash-based audit trail:
  - `package_hash`, `policy_hash`, `model_pair_hash`, `model_output_hashes`, `decision_hash`

---

## Quickstart

```bash
npm install
npm run test:core
# optional: npm run test:integration
```

Replay real-world cases:

```bash
npm run replay -- --case=simulation/input/replay/case-ukraine-deal --policy=configs/policy.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-zelenskyy-suit --policy=configs/policy.json --out=simulation/output/reports
npm run replay:package -- --reports=simulation/output/reports --out=simulation/output/replay-package
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
cre workflow simulate igr-settlement
```

## Frontend Demo (Professional Case Console)

Historical-case dashboard (Polymarket-style analyst UI):

```bash
npm run ui
# open http://localhost:4173
```

Included cases:
- `case-ukraine-deal`
- `case-zelenskyy-suit`

Frontend files:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`
- `frontend/cases.json`

---

## Repository Layout

- `src/protocol/*` — canonical package compiler, model adapters, deterministic settlement
- `src/workflow/evaluateEvent.js` — execution pipeline
- `configs/policy.json` — mismatch policy / rerun policy
- `simulation/input/replay/*` — historical replay fixtures
- `frontend/*` — case-driven demo UI
- `submission/*` — hackathon submission assets

---

## Note on Legacy Engine

Previous HOLD/REJECT-oriented logic is deprecated for the current protocol direction.
Current implementation prioritizes deterministic terminal settlement aligned with the whitepaper.
