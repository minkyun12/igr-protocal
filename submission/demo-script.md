# IGR Demo Script (Final, 3–5 min)

## [0:00–1:00] Introduction
Hi, this is **IGR: Input-Governed Resolution**.

Prediction markets are powerful, but settlement can still be fragile when outcomes depend on governance discretion.  
In systems that rely on token-holder outcome voting, there is a manipulation surface: coordinated influence over final YES/NO decisions can become economically attractive in edge cases.

IGR addresses this by shifting governance from **outcome voting** to **input governance**.  
Token holders vote on settlement inputs—model pair, source policy, and mismatch rules—and then those inputs are locked.  
After lock, settlement executes deterministically with auditable hashes and terminal states.

In this demo, I’ll use two Polymarket-style cases:
- Bitcoin up or down
- Zelenskyy suit before July (multimodal evidence)

The governance thesis and settlement invariants are documented in our whitepaper, and now I’ll show implementation evidence end to end.

---

## [1:00–1:15] Demo roadmap
In order, I will show:
1) full protocol tests,  
2) two active case replays,  
3) frontend inspection view,  
4) CRE workflow simulation,  
5) Sepolia on-chain evidence.

---

## [1:15–1:35] Step 1 — Tests
**Say**  
First, I run the full test suite for reproducibility and protocol correctness.

**Run**
```bash
cd /Users/macmini/workspace/igr-protocol
npm run test:all
```

---

## [1:35–2:10] Step 2 — Bitcoin replay
**Say**  
Now I replay the Bitcoin up-or-down case using a single checkpoint and deterministic branching.

**Run**
```bash
npm run replay -- \
  --case=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et \
  --policy=simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et/policy.assumption.json \
  --out=simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et \
  --checkpoint=T0
```

---

## [2:10–2:45] Step 3 — Zelenskyy replay
**Say**  
Next is the Zelenskyy suit case, where multimodal evidence links and images flow through the same deterministic settlement pipeline.

**Run**
```bash
npm run replay -- \
  --case=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july \
  --policy=simulation/input/replay/case-will-zelenskyy-wear-a-suit-before-july/policy.assumption.json \
  --out=simulation/output/reports/case-will-zelenskyy-wear-a-suit-before-july \
  --checkpoint=T0
```

---

## [2:45–3:10] Step 4 — Frontend inspection
**Say**  
This frontend is a lightweight inspection layer for active cases and settlement outputs.

**Run in separate terminal (or pre-run)**
```bash
npm run ui
```

**Show in browser**  
`http://localhost:4173`

---

## [3:10–3:40] Step 5 — CRE simulation
**Say**  
Now I run the Chainlink CRE workflow simulation directly through CLI.

**Run**
```bash
cd cre
~/.cre/bin/cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0
cd ..
```

---

## [3:40–4:05] Step 6 — Sepolia evidence
**Say**  
Finally, these files show Sepolia deployment and on-chain evidence records.

**Run**
```bash
cat simulation/output/onchain/deploy-output.json
cat simulation/output/onchain/deploy.md
```

---

## [4:05–4:25] Closing
IGR delivers deterministic, input-governed, and auditable prediction market settlement.  
This demo showed test validation, active market replay outputs, frontend inspection, CRE simulation, and on-chain evidence.

Thank you.
