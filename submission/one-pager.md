# PoRE — Proof-of-Resolution Engine

## Problem

Prediction market resolution is broken when outcomes are subjective.

In March 2025, a single UMA whale holding 5M tokens (25% of voting power) forced a $7M Polymarket market to resolve YES — despite zero confirmation from US or Ukrainian governments. In July 2025, $237M in bets on whether Zelenskyy wore a suit were resolved NO, overriding photo evidence from Reuters, AP, and Getty — because 2 whale voters decided a blazer isn't a suit.

These aren't bugs. They're structural failures: **concentrated oracle voting power can override evidence.**

## Solution

PoRE is a policy-gated resolution engine that **refuses to auto-resolve when evidence is ambiguous, conflicting, or manipulated.**

Instead of letting a few token holders decide, PoRE:
1. **Collects evidence from multiple sources** with quality scores (official > news > market)
2. **Runs AI deliberation** — proposer makes a call, challenger pressure-tests it
3. **Applies 8 policy gates** — any failure = HOLD_FOR_REVIEW
4. **Produces an auditable report** with integrity hashes

## Key insight

> High-quality official sources (government statements, wire services) should outweigh low-quality market signals — especially when market signals may be manipulated.

## Results on real cases

| Case | What happened | Polymarket result | PoRE result |
|---|---|---|---|
| Ukraine mineral deal | No gov confirmation, whale voted YES | ❌ YES ($7M loss) | ✅ **HOLD** |
| Zelenskyy suit | Photo evidence, interpretation dispute | ❌ NO ($237M) | ✅ **HOLD** |

In both cases, PoRE would have **prevented the controversial resolution** and escalated to human review.

## Protocol vision: Decentralized Source Curation

Beyond the current engine, PoRE proposes a novel resolution protocol: **token holders vote on evidence validity, not outcomes.** An AI policy engine then evaluates the curated evidence deterministically.

- Manipulation shifts from a 1-bit problem (flip YES/NO) to an N-dimensional constraint satisfaction problem (subvert entire evidence ecosystem)
- Whitelisted sources (government, on-chain oracles) cannot be voted out
- Quality ceilings prevent low-tier sources from dominating regardless of vote count
- Full game-theoretic analysis in the [PoRE Whitepaper](../whitepaper/PoRE_Whitepaper_v1.md)

## Technical highlights

- **Quality-weighted source analysis**: Official sources (q=0.95) dominate over manipulated market prices (q=0.20)
- **8 deterministic policy gates**: source count, type diversity, deviation, freshness, confidence, conflict, timing, rule-text
- **Chainlink Price Feed integration**: Live on-chain data for numeric markets
- **PoreRegistry.sol**: On-chain decision recording
- **Full audit trail**: SHA-256 hashes for policy, event, evidence, and decision

## Track fit

- **Prediction Markets**: Resolution safety layer against whale manipulation
- **CRE & AI**: Proposer/challenger + CRE orchestration
- **Risk & Compliance**: Policy-gated approval with audit trail

## Reproducibility

```bash
npm test                    # 9/9 passing
npm run live                # Live Chainlink evaluation
npm run replay -- --case=data/replay/case-ukraine-deal  # Replay real controversy
```

Zero external dependencies beyond `ethers`. Node 20+ required.
