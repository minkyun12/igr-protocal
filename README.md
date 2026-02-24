# PoRE — Proof-of-Resolution Engine

> **Safe, auditable resolution for prediction markets where sources conflict and interpretation is ambiguous.**

[![Tests](https://img.shields.io/badge/tests-9%2F9%20passing-brightgreen)](#tests)
[![Node](https://img.shields.io/badge/node-%3E%3D20-blue)](#quickstart)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#)

---

## The Problem

Prediction markets lose trust when resolution goes wrong. And it does — repeatedly:

| Incident | Volume | What happened |
|---|---|---|
| **Ukraine mineral deal** (Mar 2025) | $7M | UMA whale (5M tokens, 25% voting power) forced YES despite zero government confirmation |
| **Zelenskyy suit** (Jul 2025) | $237M | Photo evidence showed formal attire, but 2 whales controlling >50% votes resolved NO |
| **Fort Knox gold** (Mar 2025) | $3.5M | Dispute button disabled during challenge window, blocking user objections |

These aren't edge cases. They expose a structural flaw: **when resolution depends on subjective interpretation, concentrated voting power can override evidence.**

---

## The Solution

PoRE is a policy-gated resolution engine that **refuses to auto-resolve when evidence is ambiguous, conflicting, or manipulated.**

```
Evidence Collection → AI Deliberation → Policy Gates → Decision
        ↓                    ↓                ↓            ↓
  Multiple sources     Proposer/Challenger   8 safety     AUTO_RESOLVE
  with quality scores  with conflict score   rules        HOLD_FOR_REVIEW
                                                          REJECTED
```

### Core principle

> If high-quality official sources say NO but the market says YES, PoRE blocks auto-resolution and escalates to human review.

---

## How It Works: Real Case Replay

### Ukraine mineral deal → PoRE says HOLD

```
Sources:
  US State Dept (q=0.95):      "No agreement finalized"     → 0.25
  Ukraine MFA (q=0.95):        "Reports are inaccurate"     → 0.10
  Reuters (q=0.90):            "No signed document"         → 0.20
  AP (q=0.90):                 "No agreement to report"     → 0.15
  Polymarket price (q=0.20):   Resolved YES by whale vote   → 1.00

PoRE analysis:
  Weighted avg: 0.217 (official sources dominate)
  Decision: NO
  Reason codes: DEVIATION_TOO_HIGH, LOW_CONFIDENCE, CONFLICT_SCORE_HIGH
  Final state: HOLD_FOR_REVIEW ⚠️
```

**In reality, Polymarket auto-resolved YES → $7M user losses.**
**PoRE would have blocked this.**

### Zelenskyy suit → PoRE says HOLD

```
Sources:
  Reuters photo (q=0.95):      Formal attire confirmed      → 0.85
  Getty Images (q=0.95):       "Two-piece suit" per tailor   → 0.90
  BBC analysis (q=0.85):       "Blazer ≠ suit technically"  → 0.40
  Polymarket resolution (q=0.15): Resolved NO by whales     → 0.00

PoRE analysis:
  Weighted avg: 0.718 (photo evidence YES-leaning)
  Decision: YES
  Reason codes: DEVIATION_TOO_HIGH, LOW_CONFIDENCE, CONFLICT_SCORE_HIGH
  Final state: HOLD_FOR_REVIEW ⚠️
```

**Photo evidence and expert analysis conflicted on interpretation.**
**PoRE recognizes this as human-judgment territory, not auto-resolve territory.**

---

## Architecture

### 1. Evidence Layer
- Collects from multiple sources with quality scores
- Source types: `official`, `news`, `photo_evidence`, `market`, `onchain_oracle`, `cex_spot`, `aggregator`
- Computes: source count, type diversity, cross-source deviation, evidence freshness

### 2. AI Deliberation Layer
- **Proposer**: Quality-weighted decision + confidence
  - Numeric events: median vs threshold
  - Subjective events: weighted source analysis (high-quality sources dominate)
- **Challenger**: Conflict pressure + adjusted confidence

### 3. Policy-as-Code Layer
8 deterministic gates — any failure triggers HOLD:

| Rule | What it catches |
|---|---|
| `min_sources` | Too few data points |
| `min_source_types` | Monoculture evidence |
| `max_cross_source_deviation` | Sources disagree |
| `max_evidence_age` | Stale data |
| `min_ai_confidence` | Uncertain conclusion |
| `max_conflict_score` | AI proposer/challenger disagree |
| `too_early` | Market hasn't ended yet |
| `rule_text_match` | Rule criteria not met in evidence |

### 4. CRE Orchestration
- Chainlink CRE adapter (`sim` / `real` mode)
- On-chain recording via `PoreRegistry.sol`

### 5. Audit Trail
Every report includes integrity hashes: `policy_hash`, `event_hash`, `evidence_hash`, `decision_hash`

---

## Live Demo: Real Chainlink Data

```bash
# Reads BTC price from Chainlink mainnet + Binance + Coinbase + CoinGecko
npm run live

# Edge case: threshold at current price (sources may disagree)
npm run live -- --scenario=edge

# Custom threshold
npm run live -- --scenario=custom --threshold=65000
```

---

## Replay: Historical Cases

```bash
# Replay real controversy cases
npm run replay -- --case=data/replay/case-ukraine-deal --policy=configs/policy.v1.json --out=artifacts/reports
npm run replay -- --case=data/replay/case-zelenskyy-suit --policy=configs/policy.v1.json --out=artifacts/reports

# Build replay package with checksums
npm run replay:package -- --reports=artifacts/reports --out=artifacts/replay-package
```

### Available cases

| Case | Based on | Expected result |
|---|---|---|
| `case-ukraine-deal` | $7M UMA whale manipulation | All checkpoints → **HOLD** |
| `case-zelenskyy-suit` | $237M suit interpretation dispute | All checkpoints → **HOLD** |
| `case-a` | Clean numeric (BTC, sources agree) | T+1h → **AUTO_RESOLVE** |
| `case-b` | Numeric with source conflict | T+1h → **HOLD** |
| `case-c` | ETH tight margin ($5 spread) | T+1h → **AUTO_RESOLVE** |
| `case-d` | Multi-source with stale news | All → **HOLD** |

---

## Quickstart

```bash
# Requirements: Node 20+
npm install
npm test        # 9/9 passing
npm run live    # Live Chainlink evaluation
npm run score   # Self-assessment
```

---

## Repository Layout

```
contracts/           PoreRegistry.sol (on-chain resolution recording)
configs/             Policy config (adjustable thresholds)
src/ai/              Proposer + Challenger
src/evidence/        Stats, Chainlink feed reader, live collector
src/policy/          Policy-as-code evaluator (8 gates)
src/workflow/        Main pipeline, CRE adapter, on-chain recorder, replay
src/cli/             CLI tools (evaluate, replay, live, score)
data/replay/         Replay fixtures (6 cases including real controversies)
artifacts/           Generated reports, manifests, replay packages
submission/          One-pager, demo video, captions
tests/               Automated test suite
docs/                15 strategy/spec/handoff documents
```

---

## Protocol Vision: Decentralized Source Curation

PoRE's current implementation demonstrates the policy engine and AI deliberation layers. The protocol's next evolution introduces **Decentralized Source Curation** — a mechanism that fundamentally restructures how prediction markets are resolved.

### The core idea

Instead of token holders voting on **outcomes** (YES/NO), they vote on **which evidence sources are valid**. The AI policy engine then evaluates the curated evidence deterministically.

```
Current (UMA):     Token holders → vote YES/NO → outcome decided
                   (whale flips 1 bit → done)

Proposed (PoRE):   Token holders → vote on source validity → AI evaluates → policy gates
                   (whale must subvert entire evidence ecosystem → structurally harder)
```

### Why this matters

- **Attack dimensionality**: Manipulating a YES/NO vote is a 1-bit problem. Manipulating an evidence ecosystem is an N-dimensional constraint satisfaction problem.
- **Whitelisted sources**: Official government and on-chain oracle sources cannot be voted out. A whale cannot remove the US State Department's "No deal confirmed" statement.
- **Quality ceilings**: Even with unanimous community support, social media sources cap at quality 0.24. They can never outweigh official sources (q=0.95) in the weighted average.
- **Policy engine as final barrier**: Even if a biased evidence set passes community voting, the deterministic policy engine still checks deviation, conflict, and diversity — and triggers HOLD if thresholds are violated.

> **Full protocol design**: See [`whitepaper/PoRE_Whitepaper_v1.md`](whitepaper/PoRE_Whitepaper_v1.md) for game-theoretic analysis, attack cost comparisons, and Nash equilibrium proofs.

---

## Track Fit

| Track | How PoRE fits |
|---|---|
| **Prediction Markets** (primary) | Resolution safety layer — prevents whale manipulation and premature auto-resolve |
| **CRE & AI** | Proposer/challenger deliberation + CRE orchestration adapter |
| **Risk & Compliance** | Policy-gated approval with full audit trail |

---

## On-chain Components

- **Chainlink Price Feed**: Live BTC/USD from Ethereum mainnet (`0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`)
- **PoreRegistry.sol**: Records resolution decisions on-chain (Sepolia-ready)
- **CRE Adapter**: Orchestrates evidence collection + on-chain recording

---

## Submission Assets

- Demo video: `submission/demo-video.mp4`
- One-pager: `submission/one-pager.md`
- Demo script: `submission/demo-script.md`

---

## Links

- Hackathon: https://chain.link/hackathon
- Submission: https://airtable.com/appgJctAaKPFkMKrW/pagPPG1kBRC0C54w6/form
