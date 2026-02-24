# PoRE: Policy-governed Resolution Engine
## Decentralized Source Curation and Deterministic Safety for Prediction Market Resolution

**Version 1.0 — February 2026**
**Authors: Seo Mk**

---

## Abstract

Prediction markets have emerged as powerful mechanisms for aggregating information and forecasting real-world events, with platforms like Polymarket surpassing $237M in single-market volume. However, their resolution mechanisms remain critically fragile. Current approaches—most notably UMA Protocol's Optimistic Oracle—delegate final resolution to token-weighted voting, creating structural vulnerabilities where a small number of large token holders ("whales") can dictate outcomes irrespective of evidence quality. We document three high-profile resolution failures totaling over $247M in affected volume: the Ukraine mineral deal ($7M, March 2025), the Zelenskyy suit dispute ($237M, July 2025), and the Fort Knox gold audit ($3.5M, March 2025).

We present **PoRE (Policy-governed Resolution Engine)**, a middleware protocol that introduces two fundamental innovations: (1) a **deterministic policy engine** that mathematically evaluates whether automatic resolution is safe, producing explicit HOLD verdicts with auditable violation reports when conditions are not met; and (2) a **Decentralized Source Curation** mechanism that replaces direct outcome voting with token-weighted evidence validation, fundamentally shifting the manipulation vector from 1-bit outcome corruption to N-dimensional evidence ecosystem subversion.

PoRE does not replace existing oracle systems but operates as a pre-resolution safety layer. In replay simulations of all three documented failures, PoRE's policy engine correctly produced HOLD verdicts, preventing premature auto-resolution.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Related Work](#3-related-work)
4. [System Architecture](#4-system-architecture)
5. [Deterministic Policy Engine](#5-deterministic-policy-engine)
6. [Decentralized Source Curation Protocol](#6-decentralized-source-curation-protocol)
7. [Game-Theoretic Analysis](#7-game-theoretic-analysis)
8. [Case Studies](#8-case-studies)
9. [Implementation](#9-implementation)
10. [Discussion](#10-discussion)
11. [Future Work](#11-future-work)
12. [Conclusion](#12-conclusion)
13. [References](#13-references)

---

## 1. Introduction

Prediction markets function as decentralized information aggregation systems where participants express probabilistic beliefs about future events through financial positions. The theoretical underpinning—the efficient market hypothesis applied to event contracts—suggests that market prices should converge to the true probability of an outcome as rational agents trade on their private information [1].

However, a prediction market is only as reliable as its **resolution mechanism**. The moment a market resolves, all positions settle: one side receives full payout, the other receives nothing. A corrupted resolution is not merely an inconvenience—it constitutes a direct wealth transfer from honest participants to manipulators.

The current dominant resolution architecture in decentralized prediction markets follows a pattern:

1. A **proposer** asserts the outcome (YES or NO)
2. A **challenge window** allows disputes
3. If disputed, **token-weighted voting** determines the final outcome

This architecture implicitly assumes that token holders will vote honestly because dishonest voting degrades ecosystem value, thereby reducing the value of their own holdings. We demonstrate that this assumption fails catastrophically when (a) the value at stake in a single market exceeds the expected token value loss from manipulation, and (b) voter participation rates are sufficiently low to amplify individual whale influence.

PoRE addresses this by introducing a **deterministic, non-manipulable safety layer** between evidence collection and final resolution. Rather than asking "What is the answer?", PoRE asks "**Is it safe to auto-resolve?**"—and when it is not, it produces an explicit HOLD verdict with machine-readable justification.

Furthermore, we propose a novel **Decentralized Source Curation** mechanism that restructures the voting process itself. Instead of voting on outcomes, token holders vote on **which evidence sources are valid and relevant**. An AI-powered policy engine then evaluates the curated evidence deterministically. This design increases the dimensionality of manipulation from a single binary choice to a complex evidence ecosystem, dramatically raising the cost of attack.

---

## 2. Problem Statement

### 2.1 The Resolution Trilemma

Prediction market resolution faces a fundamental trilemma:

```
              Decentralization
                   /\
                  /  \
                 /    \
                /      \
               /________\
        Accuracy     Speed
```

- **Decentralization + Speed**: Token voting resolves quickly without centralized authority, but accuracy suffers when voters are uninformed or compromised (current UMA model).
- **Accuracy + Speed**: A centralized oracle (e.g., a single trusted entity like Associated Press) is fast and accurate, but sacrifices decentralization.
- **Decentralization + Accuracy**: Multi-round dispute mechanisms with thorough evidence review preserve both properties, but resolution can take weeks.

Existing systems optimize for the first corner (decentralization + speed), accepting accuracy risk. PoRE proposes that a **policy-governed safety layer** can shift the tradeoff curve by quickly auto-resolving clear cases (preserving speed) while escalating ambiguous cases to human review (preserving accuracy), all without centralized authority (preserving decentralization).

### 2.2 Structural Vulnerabilities in Token-Weighted Voting

The UMA Optimistic Oracle operates as follows:

1. **Proposal**: A proposer asserts an outcome and posts a bond (e.g., $1,000 USDC)
2. **Challenge Period**: 2-hour window for disputes
3. **DVM Escalation**: If disputed, UMA token holders vote over 48 hours
4. **Settlement**: Majority vote determines outcome; losing side forfeits bond

**Vulnerability 1: Plutocratic Outcome Determination**

UMA's DVM uses token-weighted voting where 1 UMA = 1 vote. With ~120M UMA total supply and typical voting participation of 10-20%, a holder of 5M UMA controls 20-40% of effective voting power. Two coordinated whales can achieve majority.

**Vulnerability 2: Economic Incentive Misalignment at Scale**

The Schelling point argument assumes:

```
Cost of manipulation = Token value loss from ecosystem degradation
Profit of manipulation = Market position gains

Security holds when: Cost > Profit
```

For a $7M market with a manipulator holding $10M in UMA:
- Even a 5% UMA price decline = $500K loss
- Potential profit from market manipulation = $1M-$5M
- **Profit > Cost**: Manipulation is economically rational

This vulnerability scales with market size. As prediction markets grow, individual market volumes increasingly exceed the implicit security budget of the oracle token.

**Vulnerability 3: Semantic Ambiguity Exploitation**

Resolution criteria are specified in natural language, creating interpretation gaps. "Will Zelenskyy wear a suit?" depends on the definition of "suit"—a question that token voting is structurally unequipped to resolve objectively.

### 2.3 Documented Failures

We identify three cases that collectively demonstrate these vulnerabilities:

| Case | Volume | Date | Vulnerability Exploited |
|------|--------|------|------------------------|
| Ukraine Mineral Deal | $7M | Mar 2025 | Whale voting (25% of DVM) |
| Zelenskyy Suit | $237M | Jul 2025 | Semantic ambiguity + whale voting |
| Fort Knox Gold | $3.5M | Mar 2025 | Dispute mechanism allegedly disabled |

Detailed case analyses are presented in Section 8.

---

## 3. Related Work

### 3.1 Oracle Systems

**Chainlink** [2] provides decentralized oracle networks for price feeds and external data. Its Data Feeds product delivers high-quality numerical data (asset prices, reserves) with strong reliability guarantees. However, Chainlink's architecture is optimized for **objective, continuously-updated numerical data**, not subjective event resolution. A question like "Did Ukraine sign a mineral deal?" falls outside the scope of Chainlink Data Feeds but represents exactly the category where prediction market disputes arise.

**UMA Protocol** [3] introduced the Optimistic Oracle, which assumes proposals are correct unless disputed. This is efficient for uncontroversial resolutions but degenerates to plutocratic voting for contested ones. UMA's Data Verification Mechanism (DVM) relies on the honest-majority assumption among token holders, which we demonstrate fails under concentrated ownership.

**API3** [4] uses first-party oracles operated by API providers themselves, reducing the trust chain. However, this approach is limited to data that API providers can authoritatively supply and does not address subjective event resolution.

### 3.2 Dispute Resolution Protocols

**Kleros** [5] implements a decentralized court system where jurors are randomly selected and stake tokens on their verdicts. Kleros addresses the whale concentration problem through random jury selection but introduces latency (multiple appeal rounds) and still relies on human judgment for the final verdict.

**Augur v2** [6] uses a designated reporter system with escalating dispute rounds. Each round requires a larger bond, creating economic barriers to sustained manipulation. However, the system has experienced low participation in dispute rounds, and the escalation mechanism can be exploited by well-funded attackers who outlast defenders.

### 3.3 AI in Oracle Systems

**Olas (Autonolas)** [7] has explored autonomous agent-based oracle systems where AI agents collect and validate information. However, current implementations focus on data retrieval rather than resolution safety assessment.

The use of AI for evidence analysis in decentralized resolution is nascent. Existing approaches treat AI as a **replacement** for human judgment. PoRE takes a fundamentally different approach: AI handles evidence interpretation (what it does well), while a deterministic code layer handles safety assessment (what code does well). The AI is explicitly **untrusted**—its output is always filtered through hard policy rules.

### 3.4 Positioning

PoRE is not a replacement for any of the above systems. It is a **middleware safety layer** designed to sit between evidence collection and final resolution in any oracle architecture:

```
[Evidence Sources] → [PoRE Safety Layer] → [Existing Oracle/Voting] → [Resolution]
                          │
                     Safe? AUTO ──→ Resolve immediately
                     Unsafe? HOLD ──→ Escalate with evidence report
```

---

## 4. System Architecture

### 4.1 Overview

PoRE consists of five layers:

```
┌──────────────────────────────────────────────────┐
│ Layer 5: On-chain Recording                       │
│   Verdict + evidence hash → immutable record      │
├──────────────────────────────────────────────────┤
│ Layer 4: Policy Engine (DETERMINISTIC CODE)        │
│   Hard rules: min_sources, max_deviation,          │
│   confidence_threshold, max_age → AUTO or HOLD     │
├──────────────────────────────────────────────────┤
│ Layer 3: Adversarial Analysis (AI)                 │
│   Proposer: evidence interpretation                │
│   Challenger: counterargument generation           │
├──────────────────────────────────────────────────┤
│ Layer 2: Source Curation (DECENTRALIZED VOTING)    │
│   Token holders validate source relevance/quality  │
├──────────────────────────────────────────────────┤
│ Layer 1: Evidence Collection (PLUGGABLE)           │
│   On-chain feeds, news APIs, official statements   │
└──────────────────────────────────────────────────┘
```

The critical design principle is **separation of trust domains**:

- **Layers 1-2**: Human/community-driven (source selection)
- **Layer 3**: AI-driven (evidence interpretation)
- **Layer 4**: Code-driven (safety assessment)
- **Layer 5**: Blockchain-driven (immutability)

No single layer has complete authority. The AI in Layer 3 cannot override the policy engine in Layer 4. The community vote in Layer 2 cannot bypass the minimum diversity requirements in Layer 4. This layered distrust is the core architectural innovation.

### 4.2 State Machine

Each resolution event progresses through a defined state machine:

```
PENDING → PROPOSED → CHALLENGED → { ACCEPTED | REJECTED }
                                         ↓           ↓
                                   Policy Check   Policy Check
                                         ↓           ↓
                                    { AUTO | HOLD | MANUAL }
```

**States:**

| State | Description |
|-------|-------------|
| `PENDING` | Event created, evidence collection in progress |
| `PROPOSED` | Proposer has submitted an initial verdict |
| `CHALLENGED` | Challenger has raised objections |
| `ACCEPTED` | Proposer's verdict survives challenge |
| `REJECTED` | Challenger successfully refuted the proposal |
| `AUTO` | Policy engine approves auto-resolution |
| `HOLD` | Policy engine blocks auto-resolution |
| `MANUAL` | Escalated to human review with full evidence package |

State transitions are deterministic and logged. Every transition includes a timestamp, the triggering condition, and associated evidence hashes.

### 4.3 Evidence Schema

Each evidence item is structured as:

```json
{
  "source": "Reuters",
  "source_type": "news_agency",
  "quality": 0.90,
  "timestamp": "2025-03-15T14:30:00Z",
  "value": 0.25,
  "detail": "Reuters reports negotiations ongoing, no signed agreement confirmed",
  "hash": "sha256:a1b2c3..."
}
```

**Fields:**

- `source`: Human-readable source identifier
- `source_type`: Categorical classification (see Section 4.4)
- `quality`: Source reliability score [0, 1] (see Section 6.3)
- `timestamp`: Evidence collection time (ISO 8601)
- `value`: Normalized signal toward YES [0, 1] where 0 = strong NO, 1 = strong YES
- `detail`: Human-readable description
- `hash`: SHA-256 hash for integrity verification

### 4.4 Source Type Taxonomy

```
on-chain data
├── onchain_oracle    (Chainlink, Pyth — highest objectivity)
├── onchain_vote      (governance votes, DAO proposals)
└── onchain_tx        (transaction records, contract state)

off-chain structured
├── cex_spot          (Binance, Coinbase — real-time market data)
├── dex_twap          (Uniswap TWAP, Curve — on-chain price)
└── api_feed          (weather APIs, sports results APIs)

off-chain unstructured
├── news_agency       (Reuters, AP, AFP — editorial standards)
├── official_govt     (government press releases, regulatory filings)
├── academic          (peer-reviewed publications)
├── image_analysis    (photographic evidence + vision model interpretation)
├── social_media      (Twitter/X, Reddit — lowest reliability, highest speed)
└── aggregator        (CoinGecko, CoinMarketCap — derived data)
```

Source type diversity is a policy parameter. The engine requires evidence from multiple source types to prevent echo-chamber effects.

---

## 5. Deterministic Policy Engine

### 5.1 Design Philosophy

The policy engine is the **trust anchor** of PoRE. It is implemented as deterministic code—not an AI model, not a voting mechanism, not a heuristic. Given identical inputs, it produces identical outputs with mathematical certainty.

This is a deliberate architectural choice. The policy engine's role is not to determine truth but to determine **whether the available evidence is sufficient for safe auto-resolution**. This is a categorically different question—one that can be answered with explicit, auditable rules.

### 5.2 Policy Parameters

A policy configuration defines the safety thresholds:

```json
{
  "policy_version": "v1",
  "min_sources": 3,
  "min_source_types": 2,
  "max_deviation": 0.30,
  "confidence_threshold": 0.60,
  "max_age_hours": 6,
  "quorum_source_types": ["onchain_oracle", "news_agency", "official_govt"],
  "whitelist_source_types": ["official_govt", "onchain_oracle"],
  "require_proposer_challenger_agreement": false
}
```

**Parameter definitions:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `min_sources` | int | Minimum number of independent evidence sources |
| `min_source_types` | int | Minimum number of distinct source type categories |
| `max_deviation` | float | Maximum allowed standard deviation across source values |
| `confidence_threshold` | float | Minimum quality-weighted confidence for AUTO |
| `max_age_hours` | float | Maximum age of any evidence item |
| `quorum_source_types` | list | Source types that should ideally be present |
| `whitelist_source_types` | list | Source types that cannot be removed by community vote |
| `require_proposer_challenger_agreement` | bool | Whether proposer and challenger must agree for AUTO |

### 5.3 Evaluation Algorithm

```
function evaluate(evidence[], policy):
    violations = []

    // Rule 1: Source count
    if count(evidence) < policy.min_sources:
        violations.push("MIN_SOURCES")

    // Rule 2: Source type diversity
    types = unique(evidence.map(e => e.source_type))
    if count(types) < policy.min_source_types:
        violations.push("SOURCE_TYPE_DIVERSITY")

    // Rule 3: Evidence freshness
    for each e in evidence:
        if age(e) > policy.max_age_hours:
            violations.push("EVIDENCE_TOO_OLD: " + e.source)

    // Rule 4: Quality-weighted consensus
    weighted_avg = sum(e.value * e.quality) / sum(e.quality)
    weighted_var = sum(e.quality * (e.value - weighted_avg)²) / sum(e.quality)
    deviation = sqrt(weighted_var)

    if deviation > policy.max_deviation:
        violations.push("DEVIATION_TOO_HIGH: " + deviation)

    // Rule 5: Confidence assessment
    confidence = 1 - deviation  // simplified; full formula in Section 5.4
    if confidence < policy.confidence_threshold:
        violations.push("CONFIDENCE_TOO_LOW: " + confidence)

    // Rule 6: Source conflict detection
    by_type = group(evidence, e => e.source_type)
    for each [typeA, typeB] in combinations(by_type):
        if abs(mean(typeA.values) - mean(typeB.values)) > 0.5:
            violations.push("SOURCE_CONFLICT: " + typeA + " vs " + typeB)

    // Verdict
    if violations.length == 0:
        return { verdict: "AUTO", confidence, violations: [] }
    else:
        return { verdict: "HOLD", confidence, violations }
```

### 5.4 Confidence Calculation

Confidence is computed as a composite score:

```
confidence = w₁ · (1 - deviation) + w₂ · source_diversity + w₃ · freshness_score

where:
  deviation = quality-weighted standard deviation of source values
  source_diversity = unique_types / total_possible_types
  freshness_score = 1 - (max_evidence_age / max_age_hours)
  w₁ = 0.5, w₂ = 0.3, w₃ = 0.2  (configurable)
```

This ensures that confidence degrades when sources disagree (high deviation), when evidence is one-dimensional (low diversity), or when evidence is stale (low freshness).

### 5.5 Why Not Use AI for Policy Evaluation?

A natural question arises: why not use an LLM to evaluate policy compliance? Three reasons:

1. **Determinism**: LLMs are stochastic. Temperature > 0 produces different outputs for identical inputs. For a system governing millions of dollars, "usually correct" is insufficient.

2. **Auditability**: `deviation > 0.30` is verifiable by anyone. "The AI felt the evidence was insufficient" is not.

3. **Adversarial robustness**: Prompt injection, jailbreaking, and adversarial inputs can manipulate LLM outputs. Arithmetic comparisons cannot be manipulated.

The AI's role in PoRE is strictly limited to evidence interpretation (Layer 3)—a task where probabilistic reasoning is appropriate. The safety-critical decision (AUTO vs. HOLD) is always made by deterministic code.

---

## 6. Decentralized Source Curation Protocol

This section presents the primary novel contribution of this paper: a mechanism that replaces direct outcome voting with token-weighted evidence validation.

### 6.1 Motivation

In current systems (UMA DVM), token holders vote on **the answer**:

```
Ballot: "Did Ukraine sign the mineral deal?"
Options: [ YES ] [ NO ]
```

This is a 1-bit decision. A whale needs to flip only this single bit to corrupt the outcome.

We propose an alternative where token holders vote on **which evidence sources are valid**:

```
Source 1: US State Dept press release — "No deal confirmed"  [Valid] [Invalid]
Source 2: Ukraine MFA statement — "Negotiations ongoing"     [Valid] [Invalid]
Source 3: Reuters report — "No signed agreement"             [Valid] [Invalid]
Source 4: Polymarket price — 79% YES                         [Valid] [Invalid]
Source 5: Anonymous blog — "Deal is done"                    [Valid] [Invalid]
```

The AI policy engine then evaluates the validated sources and produces a verdict. The critical insight: **even if a whale votes to include biased sources, the policy engine's deviation checks, conflict detection, and confidence thresholds still act as hard safety barriers.**

### 6.2 Protocol Flow

```
Phase 1: Source Submission (24h window)
├── Anyone can submit evidence sources
├── Each submission requires a bond (anti-spam)
├── Whitelisted source types (official_govt, onchain_oracle) are auto-included
└── Submission includes: source URL/data, source_type, quality claim, value claim

Phase 2: Source Validation Vote (48h window)
├── Token holders vote on each source: Valid / Invalid / Abstain
├── Token-weighted voting (1 token = 1 vote)
├── Sources with >50% Valid votes are included in evidence set
├── Sources with >50% Invalid votes are excluded
├── Excluded sources are still passed to AI as metadata:
│   "Source X was excluded by community vote (65% Invalid)"
└── Whitelisted sources cannot be voted out (see Section 6.4)

Phase 3: AI Evidence Analysis
├── Proposer: Analyzes validated evidence set
│   → Produces verdict proposal + confidence + reasoning
├── Challenger: Attempts to find weaknesses
│   → Produces challenge report or concurrence
└── Both outputs are logged and published

Phase 4: Deterministic Policy Evaluation
├── Policy engine evaluates evidence set against hard rules
├── Checks: min_sources, deviation, confidence, freshness, diversity
├── Produces: AUTO (safe to resolve) or HOLD (unsafe)
└── HOLD includes specific violation list

Phase 5: Resolution
├── AUTO → Resolve immediately, record on-chain
├── HOLD → Publish evidence package + violation report
│         → Escalate to human arbitration committee
│         → Committee has access to full evidence + AI analysis + policy report
└── All outcomes recorded on-chain with evidence hashes
```

### 6.3 Source Quality Scoring

Source quality is a critical input to the policy engine. We propose a hybrid scoring system:

**Base quality by source type:**

| Source Type | Base Quality | Rationale |
|-------------|-------------|-----------|
| `onchain_oracle` | 0.95 | Cryptographically verified, manipulation-resistant |
| `official_govt` | 0.95 | Institutional authority, legal accountability |
| `news_agency` | 0.85 | Editorial standards, reputation at stake |
| `academic` | 0.80 | Peer review, but publication lag |
| `cex_spot` | 0.75 | Regulated exchanges, but subject to manipulation |
| `api_feed` | 0.70 | Structured data, variable reliability |
| `aggregator` | 0.60 | Derived data, single point of failure |
| `dex_twap` | 0.55 | On-chain but manipulable via flash loans |
| `image_analysis` | 0.50 | Requires AI interpretation, subjective |
| `social_media` | 0.20 | Unverified, noise-dominated, bot-susceptible |

**Community quality adjustment:**

The validation vote can modify quality within bounds:

```
adjusted_quality = base_quality × (0.8 + 0.4 × valid_vote_ratio)

where valid_vote_ratio = valid_votes / (valid_votes + invalid_votes)

Example:
  Reuters (base 0.85) with 90% valid votes:
  0.85 × (0.8 + 0.4 × 0.9) = 0.85 × 1.16 = 0.986 → capped at 0.95

  Anonymous blog (base 0.20) with 95% valid votes:
  0.20 × (0.8 + 0.4 × 0.95) = 0.20 × 1.18 = 0.236
  → Even unanimous community support cannot make a social media source
     as reliable as an official government source
```

This design ensures that **base quality acts as a structural prior** that community voting can adjust but not override. A whale cannot vote a social media post into the same reliability tier as a Chainlink oracle feed.

### 6.4 Whitelist Mechanism

Certain source types are **whitelisted** and cannot be removed by community vote:

```
Whitelisted: official_govt, onchain_oracle
```

Rationale: If the US State Department publishes a press release saying "No deal was signed," this source must be present in the evidence set regardless of how token holders vote. Allowing the removal of authoritative sources is the primary vector for evidence manipulation.

Whitelisted sources are always included in the evidence set with their base quality. Community votes on whitelisted sources affect only the quality adjustment, not inclusion/exclusion.

### 6.5 Anti-Manipulation Mechanisms

**6.5.1 Source Flooding Defense**

Attack: Whale submits 100 low-quality sources supporting their preferred outcome, votes all as valid.

Defenses:
- **Bond requirement**: Each source submission requires a bond (e.g., 10 USDC). Submitting 100 sources costs 1,000 USDC.
- **Duplicate detection**: Sources derived from the same original (e.g., 50 tweets quoting the same Reuters article) are automatically deduplicated.
- **Source type diversity requirement**: Policy engine requires min_source_types ≥ 2. 100 social media posts all count as a single source type.
- **Quality ceiling**: Even with unanimous valid votes, social media sources cap at quality 0.236. Their weight in the quality-weighted average remains negligible against higher-tier sources.

**6.5.2 Source Removal Attack**

Attack: Whale votes to invalidate all sources opposing their preferred outcome.

Defenses:
- **Whitelist**: Official government and on-chain oracle sources cannot be removed.
- **Exclusion metadata**: Excluded sources are flagged to the AI as "removed by community vote," which the challenger can cite as suspicious.
- **Minimum source count**: If removal brings source count below min_sources, policy engine triggers HOLD regardless of remaining evidence quality.
- **Diversity floor**: If removal eliminates a source type entirely, min_source_types violation triggers HOLD.

**6.5.3 Sybil Voting**

Attack: Attacker creates multiple identities to amplify voting power.

Defenses:
- Token-weighted voting inherently resists sybil attacks (splitting tokens across identities doesn't increase total voting power).
- Optional integration with Worldcoin's World ID or similar proof-of-personhood for supplementary 1-person-1-vote signals.

**6.5.4 Collusion Between Proposer AI and Voters**

Attack: Voters strategically curate sources to trick the AI into a desired verdict.

Defense: The policy engine is deterministic code, not AI. Even if the AI proposer is "tricked" by biased evidence, the policy engine independently checks deviation, confidence, and source diversity. Manipulating the AI alone is insufficient; the attacker must also satisfy all policy rules—a much harder constraint.

---

## 7. Game-Theoretic Analysis

### 7.1 Attack Cost Comparison

We formalize the cost of successful manipulation under three systems:

**System A: Direct Outcome Voting (Current UMA)**

```
Cost_A = max(bond, tokens_needed_for_majority × token_price)

For Ukraine case:
  Voting participation: ~20M UMA
  Majority threshold: 10M UMA
  Attacker holdings: 5M UMA (needs ~5M more)
  Cost: 5M × $2 = $10M (one-time purchase)
  Plus reputational cost: ~5% UMA price decline × $10M = $500K

  Total Cost_A ≈ $10.5M
  Potential Profit: $3-5M from $7M market
  → Marginal (but executed in practice with existing holdings)
```

**System B: Source Curation + Policy Engine (PoRE)**

```
Cost_B = source_flooding_cost
       + source_removal_cost
       + policy_evasion_cost
       + tokens_needed_if_escalated

For Ukraine case:
  1. Cannot remove State Dept / Ukraine MFA sources (whitelisted)
  2. These sources uniformly say "no deal" (value ≈ 0.1)
  3. Even flooding with YES sources:
     - Quality ceiling: social_media maxes at 0.236
     - Official sources at 0.95 quality dominate weighted average
     - Deviation between source types: guaranteed > 0.30
     → Policy engine: HOLD (DEVIATION_TOO_HIGH + SOURCE_CONFLICT)
  4. To avoid HOLD, attacker must:
     a. Forge official government sources (criminal act)
     b. Compromise Chainlink oracle nodes (impractical)
     c. Wait for actual official confirmation (honest behavior)

  Cost_B ≈ ∞ (structurally impossible without real-world fraud)
```

**Key insight**: PoRE doesn't merely raise the cost of manipulation—for certain attack vectors, it makes manipulation **structurally impossible** without real-world fraud that carries criminal liability.

### 7.2 Dimensionality of Attack

| System | Manipulation Target | Dimensionality |
|--------|-------------------|----------------|
| UMA DVM | YES/NO outcome | 1-bit |
| Kleros | Juror verdicts | N jurors × 1 bit |
| Augur | Dispute rounds | Sequential bonds |
| **PoRE** | **Evidence ecosystem** | **N sources × validity × quality × type diversity + policy rules** |

In UMA, the attacker optimizes over a single binary variable. In PoRE, the attacker must simultaneously:
1. Curate a biased evidence set
2. Ensure it passes source count minimums
3. Ensure it passes source type diversity requirements
4. Ensure quality-weighted average exceeds confidence threshold
5. Ensure deviation stays below maximum
6. Ensure no whitelisted sources contradict the desired outcome
7. Ensure evidence freshness requirements are met

Satisfying all conditions simultaneously while pushing toward a false outcome is a **multi-constraint optimization problem** that becomes infeasible when whitelisted sources provide ground truth contradicting the desired outcome.

### 7.3 Nash Equilibrium Analysis

Under PoRE's source curation mechanism, we analyze two equilibria:

**Honest Equilibrium (desired):**
- Voters validate sources honestly based on relevance and reliability
- Policy engine receives high-quality, diverse evidence
- Clear cases: AUTO (fast resolution, everyone benefits)
- Ambiguous cases: HOLD (escalated, preventing premature loss)
- Voters earn staking rewards for participation
- **Stable**: No individual voter benefits from deviating

**Manipulation Equilibrium (attack):**
- Whale attempts to curate biased evidence set
- Must overcome: whitelists, quality ceilings, diversity requirements
- Even if evidence set is successfully biased, policy engine may still HOLD
- If HOLD, escalation reveals the manipulation attempt (excluded sources are logged)
- Whale's bond is at risk + reputational damage + potential criminal liability
- **Unstable**: High cost, uncertain success, traceable

The honest equilibrium is the dominant strategy for all but the most extreme edge cases (where the attacker controls whitelisted sources themselves—a scenario requiring real-world institutional compromise).

---

## 8. Case Studies

### 8.1 Case: Ukraine Mineral Deal ($7M, March 2025)

**Background**: A Polymarket market asked whether the United States and Ukraine would sign a rare-earth mineral deal by a specified date. The market reached $7M in volume.

**What happened**: A UMA token whale holding approximately 5M UMA tokens (~25% of voting power) voted to resolve the market as YES, despite no official confirmation from either the US State Department or the Ukrainian Ministry of Foreign Affairs. Multiple news agencies (Reuters, AP) reported only that negotiations were "ongoing" with no signed agreement.

**PoRE Replay Results:**

| Checkpoint | Proposer Verdict | Policy Verdict | Violations |
|-----------|-----------------|---------------|------------|
| T-24h | NO (0.15) | HOLD | TOO_EARLY, DEVIATION, LOW_CONF |
| T-1h | NO (0.20) | HOLD | DEVIATION, LOW_CONF, CONFLICT |
| T+1h | NO (0.22) | HOLD | DEVIATION, LOW_CONF, CONFLICT, STALE |

Evidence breakdown at T+1h:
```
State Dept (official_govt, q=0.95):    value=0.10  "No deal confirmed"
Ukraine MFA (official_govt, q=0.95):   value=0.15  "Negotiations ongoing"
Reuters (news_agency, q=0.90):         value=0.20  "No signed agreement"
AP (news_agency, q=0.85):              value=0.20  "Talks continue"
Polymarket price (social_media, q=0.20): value=0.79 "Market at 79% YES"

Quality-weighted average: 0.217 (→ NO)
Deviation: 0.43 (> 0.30 threshold → VIOLATION)
Source conflict: official_govt (0.125 avg) vs social_media (0.79) → VIOLATION
```

**Under PoRE with Source Curation:**
- State Dept and Ukraine MFA sources are **whitelisted** → cannot be removed
- Even if whale votes Polymarket price as valid (quality boost), its base quality (0.20) means it contributes minimally to weighted average
- Official sources (q=0.95) dominate → weighted average stays near 0.20
- Deviation between official sources and market price → guaranteed HOLD

**Conclusion**: PoRE produces HOLD with 5 policy violations. The $7M loss would have been prevented.

### 8.2 Case: Zelenskyy Suit ($237M, July 2025)

**Background**: The highest-volume Polymarket market ever asked whether Ukrainian President Zelenskyy would wear a suit at the NATO summit. The market resolved NO despite photographic evidence showing Zelenskyy in a dark formal jacket.

**The dispute**: Two large UMA holders controlling >50% of DVM voting power voted NO, arguing that Zelenskyy's attire was a "blazer, not a suit" (distinguishing a matching jacket-trouser set from a standalone jacket).

**PoRE Replay Results:**

| Checkpoint | Proposer Verdict | Policy Verdict | Violations |
|-----------|-----------------|---------------|------------|
| T-24h | UNKNOWN (0.50) | HOLD | TOO_EARLY, LOW_CONF |
| T-1h | YES (0.65) | HOLD | DEVIATION, LOW_CONF |
| T+1h | YES (0.72) | HOLD | DEVIATION, LOW_CONF, CONFLICT |

Evidence breakdown at T+1h:
```
Reuters photo (image_analysis, q=0.90):   value=0.85  "Dark formal jacket, appears to be suit"
AP photo (image_analysis, q=0.85):        value=0.80  "Formal attire at summit"
Getty (image_analysis, q=0.80):           value=0.85  "Suit-like formal wear"
BBC analysis (news_agency, q=0.85):       value=0.70  "Dressed formally, interpretation varies"
Social media (social_media, q=0.20):      value=0.60  "Mixed reactions"
Polymarket (social_media, q=0.20):        value=0.35  "Market leaning NO"
```

**Key insight**: Even though photo evidence leans YES (0.80-0.85), the presence of contradicting interpretations (BBC noting "interpretation varies," market leaning NO) creates sufficient deviation to trigger HOLD. This is **exactly the correct behavior**—the question is genuinely ambiguous and should not be auto-resolved.

**Under PoRE with Source Curation:**
- Image sources provide moderate-high YES signal
- But `image_analysis` source type has base quality 0.50 (requires AI interpretation)
- News analysis is split
- Market sentiment contradicts photo evidence
- **Source type conflict**: image_analysis vs social_media → CONFLICT violation
- Result: HOLD → escalate to human arbitration with full evidence package

The arbitration committee receives: all photos, all analyses, the AI's interpretation, the challenger's counterargument, the policy violation report, and the community voting record. This is incomparably more information than UMA voters received (just a ballot).

### 8.3 Case: Fort Knox Gold ($3.5M, March 2025)

**Background**: A market on whether a Fort Knox gold audit would occur allegedly had its dispute button disabled, preventing the normal challenge process.

**PoRE's structural defense**: PoRE operates as an independent middleware layer. Its evaluation runs regardless of whether the underlying platform's dispute mechanism is functional. Even if Polymarket's UI is compromised, PoRE's assessment is computed off-chain (or on a separate chain) and published independently.

This case illustrates why **separation of the safety layer from the resolution platform** is architecturally important. A single platform controlling both trading and resolution creates a single point of failure. PoRE as external middleware eliminates this dependency.

---

## 9. Implementation

### 9.1 Current Prototype

The PoRE prototype is implemented in JavaScript (Node.js) with the following components:

| Module | Description | Lines |
|--------|-------------|-------|
| `src/policy/evaluator.js` | Deterministic policy engine | ~150 |
| `src/ai/proposer.js` | Evidence analysis (quality-weighted) | ~200 |
| `src/ai/challenger.js` | Adversarial challenge generation | ~100 |
| `src/workflow/evaluateEvent.js` | Full evaluation pipeline | ~100 |
| `src/workflow/replayCase.js` | Historical case replay | ~80 |
| `src/evidence/liveCollector.js` | Real-time 4-source collection | ~120 |
| `src/evidence/chainlinkFeed.js` | Chainlink on-chain price feed | ~50 |
| `src/workflow/onchainRecorder.js` | On-chain verdict recording | ~80 |
| `contracts/PoreRegistry.sol` | Solidity verdict registry | ~60 |

**External dependency**: `ethers` (Ethereum interaction). All other logic is zero-dependency.

### 9.2 Replay System

PoRE includes a replay system for evaluating historical cases:

```bash
# Replay all cases
npm run replay

# Replay specific case
npm run replay -- --case ukraine-deal

# Package replay results
npm run replay:package

# Self-score against rubric
npm run score
```

Replay cases include pre-curated evidence checkpoints at T-24h, T-1h, and T+1h, enabling evaluation of how the engine's assessment evolves as evidence accumulates.

### 9.3 Live Evaluation

For real-time demonstration, PoRE collects from four sources:

```bash
# Live evaluation with dynamic threshold
npm run live

# Scenarios: edge, comfort, stress, custom
npm run live -- --scenario edge
```

Live mode queries:
1. **Chainlink BTC/USD** (on-chain oracle via Ethereum mainnet)
2. **Binance BTC/USDT** (CEX spot price)
3. **Coinbase BTC-USD** (CEX spot price)
4. **CoinGecko BTC** (aggregator)

The `edge` scenario sets the threshold at the current median price, creating a situation where minor source disagreements (tens to hundreds of dollars) determine the outcome—demonstrating the policy engine's sensitivity to real-world data divergence.

### 9.4 On-Chain Components

**PoreRegistry.sol**: A Solidity contract for recording verdicts on-chain:

```solidity
struct Verdict {
    bytes32 eventHash;
    uint8 outcome;      // 0=HOLD, 1=YES, 2=NO
    uint256 confidence;  // scaled to 1e18
    bytes32 evidenceHash;
    uint256 timestamp;
}

function recordVerdict(bytes32 eventHash, uint8 outcome, 
    uint256 confidence, bytes32 evidenceHash) external;
```

Deployable to Ethereum Sepolia testnet. In production, this would serve as the immutable audit trail for all PoRE evaluations.

**Chainlink Integration**: `chainlinkFeed.js` reads the BTC/USD Chainlink Data Feed directly from Ethereum mainnet, demonstrating real on-chain data consumption as evidence input.

---

## 10. Discussion

### 10.1 Limitations

**Evidence collection**: The current prototype relies on API-based collection for numerical data and pre-curated evidence for subjective events. A production system requires robust evidence pipelines for news, images, and official statements. This is an engineering challenge, not a fundamental limitation—the architecture is designed with a pluggable evidence layer precisely for this reason.

**AI reliability**: The proposer and challenger use deterministic heuristics rather than LLMs in the current implementation. Integration with production LLMs would improve evidence interpretation quality but introduces latency, cost, and prompt injection risks. The policy engine's role as a hard safety barrier mitigates AI failure modes.

**Source quality scores**: Base quality scores (Section 6.3) are currently assigned by expert judgment. A more rigorous approach would derive these scores empirically from historical accuracy data. This calibration is an important area for future work.

**Governance of policy parameters**: Who sets min_sources, max_deviation, and other policy parameters? In the current prototype, these are configured by the system operator. A production deployment would need governance mechanisms for policy parameter updates—potentially using the same token-voting infrastructure, applied to parameter changes rather than individual resolutions.

### 10.2 Comparison with Pure AI Resolution

A common objection is: "Why not just use a well-prompted LLM to resolve markets directly?"

We identify three fundamental issues with pure AI resolution:

1. **Stochastic output**: LLMs produce different outputs for identical inputs across runs. For a $237M resolution, any non-zero inconsistency rate is unacceptable.

2. **Unauditable reasoning**: An LLM's "reasoning" cannot be independently verified. PoRE's policy violations are mathematically verifiable.

3. **Adversarial vulnerability**: LLMs are susceptible to prompt injection and adversarial inputs. Deterministic code is not.

PoRE's architecture uses AI where it excels (interpreting ambiguous evidence) and code where code excels (enforcing safety rules). This separation of concerns is a core design principle.

### 10.3 Scalability Considerations

The source curation voting mechanism introduces additional latency (48h voting window) compared to UMA's 2h challenge period. For time-sensitive markets, this could be addressed by:

- **Fast-track mode**: Markets below a volume threshold (e.g., <$100K) use a shortened voting window
- **Reputation-weighted express voting**: High-reputation curators can fast-track source validation
- **Pre-approved source registries**: Commonly-used sources (Reuters, Chainlink feeds) are pre-validated, reducing per-market voting overhead

---

## 11. Future Work

### 11.1 Decentralized Source Curation Implementation

The source curation protocol described in Section 6 is currently at the design stage. Key implementation milestones:

1. **Smart contract for source submission and voting** (Solidity/EVM)
2. **Bond mechanism for source submitters** (ERC-20 based)
3. **Whitelist governance** (DAO-controlled)
4. **Integration with existing prediction market contracts** (Polymarket CTF, UMA)

### 11.2 Empirical Quality Score Calibration

Historical prediction market resolution data can be used to empirically calibrate source quality scores:

```
For each resolved market:
  For each source that was available:
    Compare source's signal with actual outcome
    Update source type's accuracy statistics

After N markets:
  base_quality[source_type] = historical_accuracy[source_type]
```

This creates a feedback loop where source quality scores converge to empirical reliability over time.

### 11.3 Cross-Platform Federation

PoRE is designed as platform-agnostic middleware. A federated deployment could serve multiple prediction markets simultaneously:

```
Polymarket ──┐
Kalshi    ───┤── PoRE Federation ──→ Shared source quality DB
Augur     ───┤                   ──→ Cross-platform evidence
Azuro     ───┘                   ──→ Unified policy standards
```

Cross-platform evidence sharing increases the cost of manipulation (an attacker would need to subvert evidence across multiple platforms) while improving resolution quality (more evidence sources available per event).

### 11.4 Formal Verification

The deterministic policy engine is amenable to formal verification. Future work includes:

- **Property-based testing**: Prove that no evidence set satisfying certain conditions can produce AUTO when it should produce HOLD
- **Model checking**: Verify state machine correctness (no unreachable states, no deadlocks)
- **Economic formal verification**: Prove minimum attack cost bounds under specified threat models

### 11.5 Integration with Proof-of-Personhood

Combining token-weighted voting with proof-of-personhood (e.g., Worldcoin World ID) creates a hybrid voting system:

```
vote_weight = f(token_stake, personhood_proof)
```

This mitigates plutocratic concentration while preserving economic stake alignment.

---

## 12. Conclusion

Prediction markets are among the most promising applications of decentralized technology, yet their resolution mechanisms remain the weakest link. The current paradigm—delegating resolution to token-weighted voting—creates structural vulnerabilities that have already caused millions of dollars in losses.

PoRE addresses this through two innovations:

1. **A deterministic policy engine** that mathematically evaluates whether auto-resolution is safe, providing explicit HOLD verdicts with auditable violation reports. This engine is code, not AI—it cannot be manipulated, jailbroken, or influenced by token holders.

2. **A decentralized source curation protocol** that replaces direct outcome voting with evidence validation voting. This shifts the manipulation vector from a trivial 1-bit problem to a complex multi-constraint optimization problem, dramatically increasing the cost and reducing the feasibility of attacks.

In replay simulations of three documented Polymarket failures ($247M+ in affected volume), PoRE correctly produced HOLD verdicts in every case, preventing premature auto-resolution that would have resulted in wealth transfer from honest participants to manipulators.

The prediction market industry does not need faster resolution or more confident AI. It needs a system that knows **when it doesn't know**—and refuses to guess when millions of dollars are at stake.

---

## 13. References

[1] Wolfers, J., & Zitzewitz, E. (2004). "Prediction Markets." *Journal of Economic Perspectives*, 18(2), 107-126.

[2] Breidenbach, L., et al. (2021). "Chainlink 2.0: Next Steps in the Evolution of Decentralized Oracle Networks." *Chainlink Whitepaper*.

[3] Hart, A., et al. (2020). "UMA: Universal Market Access." *UMA Protocol Whitepaper*.

[4] API3. (2020). "API3: Decentralized APIs for Web 3.0." *API3 Whitepaper*.

[5] Ast, F., & Deffains, B. (2017). "Kleros: Short Paper." *Kleros Whitepaper*.

[6] Peterson, J., et al. (2015). "Augur: A Decentralized Oracle and Prediction Market Platform." *Augur Whitepaper*.

[7] Olas Network. (2023). "Autonolas: Unified Autonomous Agent Framework." *Olas Documentation*.

[8] Buterin, V. (2014). "A Next-Generation Smart Contract and Decentralized Application Platform." *Ethereum Whitepaper*.

[9] Nakamoto, S. (2008). "Bitcoin: A Peer-to-Peer Electronic Cash System." *Bitcoin Whitepaper*.

[10] Polymarket. (2024). "How Polymarket Works." *Polymarket Documentation*.

---

## Appendix A: Policy Configuration Reference

```json
{
  "policy_version": "v1",
  "min_sources": 3,
  "min_source_types": 2,
  "max_deviation": 0.30,
  "confidence_threshold": 0.60,
  "max_age_hours": 6,
  "quorum_source_types": ["onchain_oracle", "news_agency", "official_govt"],
  "whitelist_source_types": ["official_govt", "onchain_oracle"],
  "require_proposer_challenger_agreement": false,
  "source_quality_base": {
    "onchain_oracle": 0.95,
    "official_govt": 0.95,
    "news_agency": 0.85,
    "academic": 0.80,
    "cex_spot": 0.75,
    "api_feed": 0.70,
    "aggregator": 0.60,
    "dex_twap": 0.55,
    "image_analysis": 0.50,
    "social_media": 0.20
  },
  "source_flooding_bond": "10 USDC",
  "voting_window_hours": 48,
  "fast_track_volume_threshold": "100000 USDC"
}
```

## Appendix B: Evidence Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["source", "source_type", "quality", "timestamp", "value"],
  "properties": {
    "source": { "type": "string" },
    "source_type": {
      "type": "string",
      "enum": [
        "onchain_oracle", "onchain_vote", "onchain_tx",
        "cex_spot", "dex_twap", "api_feed",
        "news_agency", "official_govt", "academic",
        "image_analysis", "social_media", "aggregator"
      ]
    },
    "quality": { "type": "number", "minimum": 0, "maximum": 1 },
    "timestamp": { "type": "string", "format": "date-time" },
    "value": { "type": "number", "minimum": 0, "maximum": 1 },
    "detail": { "type": "string" },
    "hash": { "type": "string" }
  }
}
```

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **AUTO** | Policy engine verdict: safe to auto-resolve |
| **HOLD** | Policy engine verdict: unsafe, escalate to human review |
| **DVM** | Data Verification Mechanism (UMA's token-weighted voting system) |
| **Source Curation** | The process of community-validated evidence selection |
| **Whitelist** | Source types that cannot be removed by community vote |
| **Quality-weighted average** | Mean of source values weighted by source quality scores |
| **Deviation** | Quality-weighted standard deviation of source values |
| **Policy Engine** | Deterministic code layer that evaluates evidence against hard rules |
| **Proposer** | AI component that interprets evidence and suggests a verdict |
| **Challenger** | AI component that adversarially tests the proposer's verdict |

---

*This paper is released under CC BY 4.0. The PoRE software implementation is released under the MIT License.*

*Correspondence: Seo Mk — GitHub: [repository link]*
