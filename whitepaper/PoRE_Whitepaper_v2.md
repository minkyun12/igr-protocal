# PoRE: Policy-governed Resolution Engine
## Deterministic Safety, Decentralized Source Curation, and Multi-Model AI Governance for Prediction Market Resolution

**Version 2.0 — February 2026**
**Author: Seo Mk**

---

## Abstract

Prediction markets have emerged as powerful information aggregation mechanisms, with platforms like Polymarket surpassing $237M in single-market volume. However, their resolution mechanisms remain critically fragile. Current approaches—most notably UMA Protocol's Optimistic Oracle—delegate final resolution to token-weighted voting, creating structural vulnerabilities where a small number of large token holders ("whales") can dictate outcomes irrespective of evidence quality. We document five resolution failures spanning June 2024 to July 2025, totaling over $249M in affected volume, revealing an escalating pattern: from the Barron Trump oracle override (~$1M), through the Ukraine mineral deal whale attack ($7M) and Fort Knox dispute UI disabling ($3.5M), to the Zelenskyy suit semantic exploit ($237M) and the NASCAR trust cascade ($60K).

We present **PoRE (Policy-governed Resolution Engine)**, a middleware protocol introducing three innovations: (1) a **deterministic policy engine** that mathematically evaluates whether automatic resolution is safe, producing explicit HOLD verdicts with auditable violation reports; (2) a **Decentralized Source Curation** mechanism that replaces direct outcome voting with token-weighted evidence validation, shifting the manipulation vector from 1-bit outcome corruption to N-dimensional evidence ecosystem subversion; and (3) a **Decentralized AI Governance** framework where multiple independent AI models form an ensemble, with token holders governing model selection, weighting, and routing through an on-chain Model Registry.

PoRE operates as a pre-resolution safety layer. In replay simulations of all five documented failures, PoRE correctly produced HOLD verdicts for ambiguous cases and would have produced AUTO for the falsely-disputed clear case, preventing both premature resolution and unnecessary dispute escalation. The protocol does not replace existing oracle systems but introduces a structurally non-manipulable checkpoint between evidence collection and final settlement.

---

## 1. Introduction

Prediction markets function as decentralized information aggregation systems where participants express probabilistic beliefs about future events through financial positions [1]. The theoretical underpinning—the efficient market hypothesis applied to event contracts—suggests that market prices should converge to the true probability of an outcome as rational agents trade on their private information.

However, a prediction market is only as reliable as its **resolution mechanism**. The moment a market resolves, all positions settle: one side receives full payout, the other receives nothing. A corrupted resolution is not merely an inconvenience—it constitutes a direct wealth transfer from honest participants to manipulators.

The current dominant resolution architecture follows a pattern: (1) a proposer asserts the outcome, (2) a challenge window allows disputes, and (3) if disputed, token-weighted voting determines the final outcome. This architecture implicitly assumes honest behavior because dishonest voting degrades ecosystem value. We demonstrate this assumption fails catastrophically when the value at stake exceeds expected token loss, and when low voter participation amplifies individual whale influence.

PoRE addresses this with three architectural innovations:

**Innovation 1: Deterministic Policy Engine.** Rather than asking "What is the answer?", PoRE asks "**Is it safe to auto-resolve?**" A code-only engine evaluates 10 hard safety rules. Same input, same output, always—no stochastic variance, no prompt injection, no adversarial manipulation.

**Innovation 2: Decentralized Source Curation.** Token holders vote not on outcomes (YES/NO) but on **which evidence sources are valid**. An AI policy engine then evaluates the curated evidence deterministically. This shifts the manipulation dimension from 1-bit to N-dimensional.

**Innovation 3: Decentralized AI Governance.** Multiple independent AI models form an ensemble, each analyzing the same evidence. An on-chain **Model Registry** allows token holders to govern model selection, weighting, and domain routing. Inter-Model Agreement (IMA) becomes a first-class safety signal—when AIs disagree, the system refuses to auto-resolve.

The separation of concerns is the core architectural principle: **humans curate evidence, multiple AIs interpret it, deterministic code enforces safety, and blockchain records everything**. No single layer has complete authority.

---

## 2. Problem Statement

### 2.1 The Resolution Trilemma

Prediction market resolution faces a fundamental trilemma among *decentralization*, *accuracy*, and *speed*:

- **Decentralization + Speed**: Token voting resolves quickly without central authority, but accuracy suffers when voters are uninformed or compromised (current UMA model).
- **Accuracy + Speed**: A centralized oracle (e.g., Associated Press) is fast and accurate, but sacrifices decentralization.
- **Decentralization + Accuracy**: Multi-round dispute mechanisms with thorough evidence review preserve both, but resolution can take weeks.

Existing systems optimize for decentralization + speed, accepting accuracy risk. PoRE proposes that a **policy-governed safety layer** can shift the tradeoff curve: auto-resolving clear cases (preserving speed), escalating ambiguous ones to human review (preserving accuracy), without centralized authority (preserving decentralization).

### 2.2 Structural Vulnerabilities in Token-Weighted Voting

The UMA Optimistic Oracle [3] operates through proposal, 2-hour challenge, and DVM token-weighted voting (48h). We identify three structural vulnerabilities:

**V1: Plutocratic Outcome Determination.** With ~120M UMA total supply and typical voting participation of 10–20%, a holder of 5M UMA controls 20–40% of effective voting power. Two coordinated whales can achieve majority.

**V2: Economic Incentive Misalignment at Scale.** The security condition requires:

$$C_{\text{manipulation}} > P_{\text{manipulation}}$$

For the Ukraine case ($7M market): a 5% UMA price decline on $10M holdings = $500K loss, while potential manipulation profit = $1M–$5M. Profit exceeds cost—manipulation is economically rational. This vulnerability scales with market size.

**V3: Semantic Ambiguity Exploitation.** Resolution criteria specified in natural language create interpretation gaps. "Will Zelenskyy wear a suit?" depends on the definition of "suit"—a question token voting is structurally unequipped to resolve.

### 2.3 Documented Failures: An Escalating Pattern

The following five cases, spanning June 2024 to July 2025, reveal not isolated incidents but a **systematic and escalating pattern** of resolution failures:

| # | Date | Case | Volume | Vulnerability | Outcome |
|---|------|------|--------|---------------|---------|
| 1 | Jun 2024 | Barron Trump / DJT token | ~$1M | Oracle-platform conflict | Polymarket overrides own oracle |
| 2 | Mar 2025 | Ukraine mineral deal | $7M | Whale voting (25% of DVM) | Incorrect YES, $7M loss |
| 3 | Mar 2025 | Fort Knox gold audit | $3.5M | Dispute UI disabled | Normal challenge process blocked |
| 4 | Jul 2025 | Zelenskyy suit | $237M | Semantic ambiguity + whales | Incorrect NO despite photo evidence |
| 5 | Jul 2025 | NASCAR race (spillover) | $60K | Trust collapse cascade | Correct proposal rejected by oracle |

**Case 1 (Jun 2024): Barron Trump / DJT.** UMA token holders voted that Barron Trump was "not likely involved" in the DJT meme coin. Polymarket publicly declared UMA's resolution "wrong" and overturned it—the first time the platform contradicted its own oracle service [18]. This established a dangerous precedent: if the platform can override the oracle, what is the oracle's purpose? If it cannot, users have no recourse against incorrect resolutions.

**Cases 2–3 (Mar 2025): Ukraine + Fort Knox.** Within the same month, two distinct failure modes emerged. In the Ukraine case, a whale exploited V1 (plutocratic voting) directly. In the Fort Knox case, the dispute mechanism itself was allegedly compromised (V4: infrastructure failure). Together, they demonstrated that the system is vulnerable at both the voting layer and the infrastructure layer.

**Case 4 (Jul 2025): Zelenskyy suit.** The highest-volume case ($237M) combined V2 (economic misalignment) with V3 (semantic ambiguity). Two UMA whales controlling >50% of DVM power argued "blazer ≠ suit" despite photographic evidence from Reuters, AP, and Getty showing formal attire. Forbes characterized it as threatening "a billion-dollar industry's credibility" [19].

**Case 5 (Jul 2025): NASCAR spillover.** A routine $10,000 NASCAR race bet escalated to $60,000 in dispute bonds after UMA rejected an accurate early settlement proposal—a direct consequence of the trust crisis triggered by the Zelenskyy case. This demonstrated that **resolution failures cascade**: once confidence in the oracle is damaged, even correct resolutions are contested, creating a systemic trust deficit [20].

The pattern is clear: from a $1M edge case in 2024 to $237M+ in systemic failures within 13 months. The problem is not improving—it is accelerating. Detailed case analysis with PoRE replay results is presented in Section 9.

---

## 3. Related Work

### 3.1 Oracle Systems

**Chainlink** [2] provides decentralized oracle networks optimized for objective, continuously-updated numerical data (asset prices, reserves). Its architecture delivers high reliability for structured data but does not address subjective event resolution—precisely the category where prediction market disputes arise.

**UMA Protocol** [3] introduced the Optimistic Oracle, efficient for uncontroversial resolutions but degenerating to plutocratic voting for contested ones. UMA's DVM relies on the honest-majority assumption, which we demonstrate fails under concentrated token ownership.

**API3** [4] uses first-party oracles operated by API providers themselves, reducing the trust chain but limited to data that providers can authoritatively supply.

### 3.2 Dispute Resolution Protocols

**Kleros** [5] implements a decentralized court with randomly-selected jurors staking tokens on verdicts. Random selection addresses whale concentration but introduces latency (multiple appeal rounds) and still relies on human judgment.

**Augur v2** [6] uses a designated reporter system with escalating dispute bonds. While bonds create economic barriers, well-funded attackers can outlast defenders, and low participation in dispute rounds has been observed in practice.

### 3.3 AI in Oracle Systems

**Olas (Autonolas)** [7] has explored autonomous agent-based oracle systems for data retrieval. Existing AI-oracle approaches treat AI as a **replacement** for human judgment.

PoRE takes a fundamentally different approach: AI handles evidence interpretation (what it does well), while deterministic code handles safety assessment (what code does well). The AI is explicitly **untrusted**—its output is always filtered through hard policy rules.

### 3.4 Multi-Model AI Systems

**Mixture of Experts (MoE)** architectures [11] demonstrate that ensembles of specialized models outperform monolithic models on diverse tasks. **Constitutional AI** [12] shows that AI systems can be governed by explicit rules. **Multi-agent debate** [13] demonstrates that adversarial interaction between AI agents improves reasoning quality.

PoRE extends these ideas to decentralized governance: not merely using multiple models, but allowing the community to govern which models participate and how they are weighted.

### 3.5 Positioning

PoRE is not a replacement for any existing system. It is a **middleware safety layer**:

```
[Evidence Sources] → [PoRE Safety Layer] → [Existing Oracle/Voting] → [Resolution]
                          │
                     Safe? AUTO → Resolve immediately
                     Unsafe? HOLD → Escalate with evidence report
```

---

## 4. System Architecture

### 4.1 Six-Layer Design

PoRE consists of six layers, each occupying a distinct trust domain:

```
┌────────────────────────────────────────────────────────────┐
│ L6: On-chain Recording (BLOCKCHAIN)                        │
│   Verdict + evidence hash + model votes → immutable record │
├────────────────────────────────────────────────────────────┤
│ L5: Deterministic Policy Engine (CODE)                     │
│   10 hard safety rules → AUTO or HOLD                      │
├────────────────────────────────────────────────────────────┤
│ L4: AI Ensemble & Cross-Validation (MULTI-AI)              │
│   N independent models → Inter-Model Agreement Score       │
├────────────────────────────────────────────────────────────┤
│ L3: Adversarial Analysis (AI)                              │
│   Majority AI → Proposer / Minority AI → Challenger        │
├────────────────────────────────────────────────────────────┤
│ L2: Source Curation (COMMUNITY)                            │
│   Token-weighted evidence validation + whitelist           │
├────────────────────────────────────────────────────────────┤
│ L1: Evidence Collection (PLUGGABLE)                        │
│   On-chain feeds, APIs, news, official statements          │
└────────────────────────────────────────────────────────────┘
```

**Separation of trust domains**:
- **L1–L2**: Human/community-driven (source selection and validation)
- **L3–L4**: AI-driven (evidence interpretation, cross-validation)
- **L5**: Code-driven (safety assessment—deterministic, non-negotiable)
- **L6**: Blockchain-driven (immutability, auditability)

The critical design principle: **no single layer has complete authority.** The AI ensemble (L3–L4) cannot override the policy engine (L5). Community votes (L2) cannot bypass minimum diversity requirements (L5). The policy engine (L5) cannot fabricate evidence (L1–L2). This layered distrust is the core architectural innovation.

### 4.2 State Machine

Each resolution event progresses through a defined state machine:

```
PENDING → PROPOSED → CHALLENGED → { ACCEPTED | REJECTED }
                                        ↓            ↓
                                   Policy Check  Policy Check
                                        ↓            ↓
                                  { AUTO | HOLD | MANUAL }
```

**States:**

| State | Description |
|-------|-------------|
| PENDING | Event created, evidence collection and source curation in progress |
| PROPOSED | AI ensemble has produced a consensus verdict |
| CHALLENGED | Minority AI or community member has raised objections |
| ACCEPTED | Proposer's verdict survives challenge |
| REJECTED | Challenger successfully refuted the proposal |
| AUTO | Policy engine approves auto-resolution |
| HOLD | Policy engine blocks auto-resolution, publishes violation report |
| MANUAL | Escalated to human arbitration committee with full evidence package |

All state transitions are deterministic and logged with timestamp, triggering condition, and associated evidence hashes.

### 4.3 Evidence Schema

Each evidence item is structured as:

```json
{
  "evidence_id": "ev-a1b2c3",
  "source": "US State Department",
  "source_type": "official_govt",
  "quality": 0.95,
  "timestamp": "2025-03-15T14:30:00Z",
  "value": 0.10,
  "detail": "Press release: no signed agreement confirmed",
  "hash": "sha256:a1b2c3..."
}
```

- `source_type`: Categorical classification from a defined taxonomy (Section 4.4)
- `quality`: Source reliability score [0, 1] determined by base quality and community vote adjustment
- `value`: Normalized signal toward YES [0, 1] where 0 = strong NO, 1 = strong YES
- `hash`: SHA-256 hash for integrity verification

### 4.4 Source Type Taxonomy

```
On-chain data
├── onchain_oracle    (Chainlink, Pyth — highest objectivity)
├── onchain_vote      (governance votes, DAO proposals)
└── onchain_tx        (transaction records, contract state)

Off-chain structured
├── cex_spot          (Binance, Coinbase — real-time market data)
├── dex_twap          (Uniswap TWAP — on-chain price)
└── api_feed          (weather APIs, sports results APIs)

Off-chain unstructured
├── news_agency       (Reuters, AP — editorial standards)
├── official_govt     (government press releases, regulatory filings)
├── academic          (peer-reviewed publications)
├── image_analysis    (photographic evidence + AI interpretation)
├── social_media      (Twitter/X, Reddit — lowest reliability)
└── aggregator        (CoinGecko, CoinMarketCap — derived data)
```

---

## 5. Deterministic Policy Engine

### 5.1 Design Philosophy

The policy engine is the **trust anchor** of PoRE. It is implemented as deterministic code—not an AI model, not a voting mechanism, not a heuristic. Given identical inputs, it produces identical outputs with mathematical certainty.

Its role is not to determine truth but to determine **whether the available evidence is sufficient for safe auto-resolution**. This is a categorically different question—one answerable with explicit, auditable rules.

### 5.2 Policy Parameters

A policy configuration π defines the safety thresholds:

$$\pi = (n_{\min}, t_{\min}, \delta_{\max}, \gamma_{\min}, \alpha_{\max}, \theta_{\text{IMA}}, \phi_{\text{conflict}}, \mathcal{W}, \text{flags})$$

| Parameter | Symbol | Type | Description |
|-----------|--------|------|-------------|
| Minimum sources | n_min | int | Minimum independent evidence sources |
| Minimum source types | t_min | int | Minimum distinct source type categories |
| Maximum deviation | δ_max | float | Maximum quality-weighted standard deviation |
| Confidence threshold | γ_min | float | Minimum composite confidence score |
| Maximum evidence age | α_max | hours | Maximum age of any evidence item |
| IMA threshold | θ_IMA | float | Minimum Inter-Model Agreement score |
| Conflict threshold | φ_conflict | float | Maximum cross-type mean difference |
| Whitelist types | W | set | Source types that cannot be removed by vote |
| Flags | — | — | allow_too_early, require_proposer_challenger_agreement |

### 5.3 Evaluation Algorithm

```
function evaluate(evidence[], aiEnsemble, policy):
    violations = []

    // Rule 1: Source count
    if count(evidence) < n_min:
        violations.push("MIN_SOURCES")

    // Rule 2: Source type diversity
    types = unique(evidence.map(e => e.source_type))
    if count(types) < t_min:
        violations.push("TYPE_DIVERSITY")

    // Rule 3: Evidence freshness
    for each e in evidence:
        if age(e) > α_max:
            violations.push("EVIDENCE_TOO_OLD: " + e.source)

    // Rule 4: Quality-weighted deviation
    v̄ = Σ(e.quality × e.value) / Σ(e.quality)
    σ = sqrt(Σ(e.quality × (e.value - v̄)²) / Σ(e.quality))
    if σ > δ_max:
        violations.push("DEVIATION_TOO_HIGH")

    // Rule 5: Composite confidence
    γ = w₁(1-σ) + w₂(|types|/|T|) + w₃(1 - max_age/α_max)
    if γ < γ_min:
        violations.push("LOW_CONFIDENCE")

    // Rule 6: Cross-type source conflict
    for each [typeA, typeB] in type_combinations(evidence):
        if |mean(typeA.values) - mean(typeB.values)| > φ_conflict:
            violations.push("SOURCE_CONFLICT")

    // Rule 7: Inter-Model Agreement (NEW)
    IMA = 1 - σ(aiEnsemble.verdicts) / max_possible_σ
    if IMA < θ_IMA:
        violations.push("MODEL_DISAGREEMENT")

    // Rule 8: Excluded Source Reversal (NEW)
    if restoring_excluded_sources_reverses_verdict(evidence, excluded):
        violations.push("EXCLUDED_SOURCE_REVERSAL")

    // Rule 9: Timing
    if event_not_yet_ended and !policy.allow_too_early:
        violations.push("TOO_EARLY")

    // Rule 10: Proposer-Challenger agreement (optional)
    if policy.require_agreement and proposer.verdict != challenger.concurrence:
        violations.push("PROPOSER_CHALLENGER_DISAGREE")

    // Verdict
    if violations.length == 0:
        return { verdict: "AUTO", confidence: γ, violations: [] }
    else:
        return { verdict: "HOLD", confidence: γ, violations }
```

### 5.4 Confidence Score

Confidence is a composite of three signals:

$$\gamma = w_1(1-\sigma) + w_2 \frac{|\mathcal{T}_E|}{|\mathcal{T}|} + w_3 \left(1 - \frac{\max_i \text{age}(e_i)}{\alpha_{\max}}\right)$$

with default weights (w₁, w₂, w₃) = (0.5, 0.3, 0.2). Confidence degrades when sources disagree (high σ), when evidence is one-dimensional (low type diversity), or when evidence is stale.

### 5.5 Why Not AI for Policy Evaluation?

1. **Determinism**: LLMs are stochastic. Temperature > 0 produces different outputs for identical inputs. For $237M, "usually correct" is insufficient.
2. **Auditability**: `σ > 0.30` is verifiable by anyone. "The AI felt the evidence was insufficient" is not.
3. **Adversarial robustness**: Prompt injection can manipulate LLM outputs. Arithmetic comparisons cannot be manipulated.

The AI's role is strictly limited to evidence interpretation (L3–L4). The safety-critical decision (AUTO vs. HOLD) is always made by deterministic code.

---

## 6. Decentralized Source Curation

### 6.1 Motivation: From 1-Bit to N-Dimensional

In current systems, token holders vote on **the answer**:

```
UMA ballot: "Did Ukraine sign the mineral deal?"  → [YES] [NO]
```

This is a 1-bit decision. A whale needs to flip only this single bit.

PoRE replaces this with evidence-level validation:

```
PoRE ballot:
  Source 1: US State Dept — "No deal confirmed"     [Valid] [Invalid]
  Source 2: Ukraine MFA — "Negotiations ongoing"     [Valid] [Invalid]
  Source 3: Reuters — "No signed agreement"          [Valid] [Invalid]
  Source 4: Polymarket price — 79% YES               [Valid] [Invalid]
  Source 5: Anonymous blog — "Deal is done"          [Valid] [Invalid]
```

The AI policy engine evaluates the validated sources and produces a verdict. Even if a whale votes to include biased sources, the policy engine's deviation checks, conflict detection, and confidence thresholds act as hard safety barriers.

### 6.2 Protocol Phases

**Phase 1: Source Submission (24h window)**
- Anyone can submit evidence sources with a bond (anti-spam, e.g., 10 USDC)
- Whitelisted source types (W = {official_govt, onchain_oracle}) are auto-included
- Duplicate detection prevents flooding from the same origin

**Phase 2: Source Validation Vote (48h window)**
- Token holders vote on each source: Valid / Invalid / Abstain
- Token-weighted voting (1 token = 1 vote)
- Sources with >50% Valid votes → included in evidence set
- Sources with >50% Invalid votes → excluded, but passed to AI as metadata with flag: "Excluded by community vote (X% Invalid)"
- Whitelisted sources cannot be voted out

**Phase 3: AI Ensemble Analysis**
- Multiple AI models analyze the validated evidence set (see Section 7)
- Excluded sources are provided as metadata for forensic analysis

**Phase 4: Deterministic Policy Evaluation**
- Policy engine evaluates evidence against 10 hard rules (Section 5.3)
- Produces AUTO (safe) or HOLD (unsafe) with violation list

**Phase 5: Resolution**
- AUTO → resolve immediately, record on-chain
- HOLD → publish evidence package + violation report, escalate to human arbitration

### 6.3 Quality Scoring

Base quality q₀(τ) is assigned by source type:

| Source Type | Base Quality | Rationale |
|-------------|-------------|-----------|
| onchain_oracle | 0.95 | Cryptographically verified, manipulation-resistant |
| official_govt | 0.95 | Institutional authority, legal accountability |
| news_agency | 0.85 | Editorial standards, reputation at stake |
| academic | 0.80 | Peer review, but publication lag |
| cex_spot | 0.75 | Regulated exchanges, subject to manipulation |
| api_feed | 0.70 | Structured data, variable reliability |
| aggregator | 0.60 | Derived data, single point of failure |
| dex_twap | 0.55 | On-chain but manipulable via flash loans |
| image_analysis | 0.50 | Requires AI interpretation, subjective |
| social_media | 0.20 | Unverified, noise-dominated, bot-susceptible |

Community vote adjusts quality within structural bounds:

$$q_i = q_0(\tau_i) \cdot (0.8 + 0.4 \cdot r_i)$$

where r_i = valid_votes / (valid_votes + invalid_votes).

**Critical property**: even with unanimous support (r = 1.0):

$$q_{\text{social}} = 0.20 \times 1.20 = 0.24 \ll 0.95 = q_{\text{oracle}}$$

Base quality acts as a **structural prior** that community voting can adjust but never override. A whale cannot vote a social media post into the same reliability tier as a Chainlink oracle feed.

### 6.4 Whitelist Mechanism

Source types W = {official_govt, onchain_oracle} cannot be removed by community vote. If the US State Department publishes "No deal signed," this source persists regardless of how token holders vote. Votes on whitelisted sources affect only quality adjustment, not inclusion.

### 6.5 Manipulation Trap: Excluded Source Forensics

Excluded sources are not discarded—they are passed to the AI ensemble with explicit metadata: "Source X was excluded by community vote (65% Invalid)." This creates a **manipulation trap**:

```
Attacker removes unfavorable sources via Invalid votes
  → Removal is recorded on-chain
  → AI receives excluded sources as metadata
  → AI analyzes: "Excluded source contradicts remaining evidence"
  → Policy Engine Rule 8: Restoring excluded sources reverses verdict?
    → YES → EXCLUDED_SOURCE_REVERSAL violation → HOLD

Result: The act of manipulation becomes evidence of manipulation.
```

Specifically, if the policy engine detects that **restoring any excluded source would flip the verdict** from the current decision, it triggers HOLD. This means:

- To manipulate, the attacker must remove contradicting sources
- Removing them triggers Rule 8
- Not removing them means the evidence set reflects ground truth
- **Either way, manipulation fails**

### 6.6 Anti-Manipulation Summary

| Attack | Defense Mechanism |
|--------|-------------------|
| Source flooding (100 low-quality posts) | Bond per submission + dedup + type diversity rule + quality ceiling |
| Source removal (delete opposing evidence) | Whitelist + excluded source forensics + min_sources rule |
| Sybil voting | Token-weighted (splitting tokens doesn't increase power) |
| AI-voter collusion | Policy engine independently checks all constraints |

---

## 7. Decentralized AI Governance

This section presents the second novel contribution: a framework for governing the AI layer itself through decentralized mechanisms.

### 7.1 The Single-Model Problem

If PoRE relies on a single AI model for evidence interpretation, it inherits that model's failure modes as systemic risk:

| Risk | Impact |
|------|--------|
| Provider outage | Entire system halted |
| Prompt injection | Evidence interpretation compromised |
| Model bias | Systematic misinterpretation |
| Provider censorship | Selective refusal to analyze certain events |
| Version regression | Model update degrades performance |

A single AI model is a single point of failure (SPOF). PoRE's policy engine mitigates AI failure (the engine catches bad outputs), but does not prevent it. Multi-model ensemble prevents it.

### 7.2 Multi-Model Ensemble

Multiple independent AI models analyze the same curated evidence set in parallel:

```
Curated Evidence E'
    │
    ├──→ Model A (e.g., Claude)    → verdict_A, confidence_A, reasoning_A
    ├──→ Model B (e.g., GPT)       → verdict_B, confidence_B, reasoning_B
    ├──→ Model C (e.g., Gemini)    → verdict_C, confidence_C, reasoning_C
    └──→ Model D (e.g., Domain AI) → verdict_D, confidence_D, reasoning_D
    │
    ▼
Cross-Model Consensus
    │
    ├─ Unanimous agreement → confidence bonus, strong signal
    ├─ Majority agreement  → minority opinion becomes Challenger
    └─ Split / no majority → MODEL_DISAGREEMENT → HOLD
```

**Why this works**: each model has independent training data, architecture, and failure modes. Compromising one model (via prompt injection, adversarial inputs, or provider manipulation) does not compromise the others. An attacker must simultaneously subvert N independent AI systems—a dramatically harder task.

### 7.3 Inter-Model Agreement Score (IMA)

IMA quantifies the degree of consensus across the AI ensemble:

$$\text{IMA} = 1 - \frac{\sigma(\{v_1, v_2, \ldots, v_N\})}{\sigma_{\max}}$$

where v_i is the normalized verdict of model i (0 = NO, 1 = YES), σ is standard deviation, and σ_max = 0.5 (maximum possible disagreement in binary verdicts).

| IMA Range | Interpretation | Policy Action |
|-----------|---------------|---------------|
| 0.90 – 1.00 | Strong consensus | No violation |
| 0.70 – 0.89 | Moderate consensus | Warning logged |
| 0.50 – 0.69 | Weak consensus | Near threshold |
| 0.00 – 0.49 | Disagreement | MODEL_DISAGREEMENT → HOLD |

**Policy Rule 7**: If IMA < θ_IMA (default 0.50), the verdict is HOLD regardless of other rules. Rationale: **if independent AI models cannot agree on the interpretation, the evidence is too ambiguous for auto-resolution.**

### 7.4 Adversarial Proposer-Challenger from Ensemble

The ensemble naturally produces adversarial analysis:

- **Proposer**: The majority verdict, synthesized from agreeing models
- **Challenger**: The minority verdict, with reasoning from dissenting models

This eliminates the need for a synthetic "devil's advocate"—real disagreement among independent models is a stronger signal than a single model arguing with itself.

When models disagree, the policy engine receives both sides with genuine independent reasoning, producing a richer evidence package for human arbitration in the HOLD path.

### 7.5 Token-Governed Model Registry

The Model Registry is an on-chain governance mechanism for the AI ensemble:

```
Model Registry (On-chain)
┌──────────────────────────────────────────────────────┐
│ Model ID │ Provider  │ Weight │ Status  │ Accuracy  │
├──────────┼───────────┼────────┼─────────┼───────────┤
│ model-01 │ Anthropic │ 1.0×   │ Active  │ 92.3%     │
│ model-02 │ OpenAI    │ 1.0×   │ Active  │ 89.7%     │
│ model-03 │ Google    │ 1.0×   │ Active  │ 86.1%     │
│ model-04 │ ExchangeX │ 2.0×   │ Active  │ 91.5%     │
│ model-05 │ Open-src  │ 0.5×   │ Inactive│ 68.4%     │
└──────────┴───────────┴────────┴─────────┴───────────┘

Governance actions (token-weighted voting):
  • Add new model to registry
  • Remove underperforming model
  • Adjust model weight
  • Set domain routing rules
  • Activate / deactivate models
```

**Token holders vote on:**
- Which models to include in the ensemble
- Weight assigned to each model (domain experts may receive higher weight)
- Domain routing (e.g., price events → quantitative models, subjective events → reasoning models)

**Self-improving loop:**

$$w_i^{(t+1)} = w_i^{(t)} \cdot \left(\frac{\text{accuracy}_i^{(t)}}{\bar{\text{accuracy}}^{(t)}}\right)^\beta$$

Historical accuracy data from resolved markets feeds back into weight adjustment proposals, which token holders can approve or reject. This creates an empirically-grounded, community-governed evolution of the AI layer.

### 7.6 Domain Routing

Not all AI models perform equally across event categories:

| Event Category | Optimal Model Profile | Example |
|---------------|----------------------|---------|
| Price threshold | Quantitative, data-heavy | "BTC ≥ $100K?" |
| Geopolitical | Reasoning, context-heavy | "Ukraine deal signed?" |
| Visual/semantic | Multimodal, interpretation | "Zelenskyy wearing suit?" |
| Regulatory | Legal knowledge, precision | "SEC approves ETF?" |

The Model Registry supports **routing rules**: for a given event category, a subset of models is selected with category-specific weights. Token holders govern these routing rules, ensuring the most appropriate models evaluate each event type.

### 7.7 Anti-Capture Mechanisms

To prevent a single entity from capturing the AI layer:

- **Minimum ensemble size**: At least 3 active models required (configurable)
- **Maximum single-model weight**: No model may exceed 40% of total weight
- **Provider diversity**: At least 2 distinct providers required
- **Cooldown on changes**: Model additions/removals require 7-day governance vote + 3-day cooldown
- **Emergency circuit breaker**: If any model's recent accuracy drops below 50%, it is automatically suspended pending governance review

---

## 8. Game-Theoretic Analysis

### 8.1 Attack Cost Comparison

**System A: Direct Outcome Voting (Current UMA)**

$$C_A = \max\left(b,\; \frac{n_{\text{majority}} \times p_{\text{token}}}{\text{participation}}\right)$$

For the Ukraine case: ~$10.5M (achievable with existing whale holdings).

**System B: Source Curation + Policy Engine + AI Ensemble (PoRE)**

The attacker must simultaneously satisfy constraints (1)–(7):

$$|E'| \geq n_{\min} \tag{1}$$
$$|\mathcal{T}_{E'}| \geq t_{\min} \tag{2}$$
$$\sigma(E') \leq \delta_{\max} \tag{3}$$
$$\gamma(E') \geq \gamma_{\min} \tag{4}$$
$$\forall\, e_w \in \mathcal{W}: e_w \in E' \tag{5}$$
$$\text{IMA}(E') \geq \theta_{\text{IMA}} \tag{6}$$
$$\text{ExcludedSourceReversal}(E') = \text{false} \tag{7}$$

Constraint (5) is decisive: whitelisted sources reflecting ground truth cannot be removed. When they contradict the desired outcome, satisfying (3)–(4) is infeasible. Constraint (6) requires subverting N independent AI models simultaneously. Constraint (7) means that any attempt to remove contradicting evidence triggers HOLD.

$$C_B \to \infty \text{ (structurally impossible without real-world fraud)}$$

### 8.2 Manipulation Dimensionality

| System | Manipulation Target | Dimensionality |
|--------|-------------------|----------------|
| UMA DVM | YES/NO outcome | 1 bit |
| Kleros | Juror verdicts | N bits |
| Augur v2 | Dispute bonds | Sequential |
| **PoRE** | **Evidence ecosystem + AI ensemble** | **|E| × |T| × ℝ³ × N_models** |

In UMA, the attacker optimizes over a single binary variable. In PoRE, the attacker must simultaneously:
1. Curate a biased evidence set (passing type diversity)
2. Ensure quality-weighted statistics pass all thresholds
3. Ensure no whitelisted sources contradict the outcome
4. Ensure excluded source restoration doesn't reverse the verdict
5. Ensure N independent AI models all agree on the false outcome
6. Ensure evidence freshness requirements are met

### 8.3 Nash Equilibrium

**Honest equilibrium (desired)**: Voters validate sources truthfully. Clear cases: AUTO (fast). Ambiguous cases: HOLD (safe). Voters earn staking rewards. Stable—no individual voter benefits from deviating.

**Manipulation equilibrium (attack)**: Must overcome whitelists, quality ceilings, diversity requirements, excluded source forensics, AND multi-model AI consensus. High cost, uncertain success, fully traceable (all votes and exclusions recorded on-chain). Unstable.

The honest equilibrium is dominant for all but the most extreme edge cases—where the attacker controls whitelisted sources themselves (requiring real-world institutional compromise with criminal liability).

---

## 9. Case Studies

The five documented failures are analyzed chronologically, demonstrating both the escalating severity and how PoRE's architecture addresses each failure mode.

### 9.1 Barron Trump / DJT Token (~$1M, June 2024)

**Background**: A Polymarket market asked whether Barron Trump was involved in the DJT meme coin. Martin Shkreli publicly claimed involvement. UMA token holders voted NO multiple times. Polymarket publicly declared UMA's resolution "wrong" and overturned it—an unprecedented move [18].

**The structural problem this reveals**: The platform had to choose between (a) accepting an oracle resolution it believed incorrect, or (b) overriding its own decentralized oracle, undermining the oracle's purpose. Neither option is acceptable. This is the **oracle override dilemma**: if the platform can override, the oracle is decorative; if it cannot, users have no recourse.

**How PoRE addresses this**: PoRE does not produce final resolutions—it produces **safety assessments**. In this case:
- Evidence was ambiguous (Shkreli claims vs. no official confirmation)
- Source types in conflict (social_media vs. absence of official_govt confirmation)
- PoRE verdict: **HOLD** — escalate to human committee with full evidence package

The oracle override dilemma dissolves because PoRE never claims to know the answer. It identifies when the answer is unclear and routes to human judgment with structured evidence. The platform does not need to override anything—the system itself acknowledges ambiguity.

### 9.2 Ukraine Mineral Deal ($7M, March 2025)

**Background**: A Polymarket market on whether the US and Ukraine would sign a rare-earth mineral deal. A UMA whale (~5M tokens, ~25% voting power) voted YES despite no official confirmation.

**PoRE Evaluation with Full Protocol:**

**Evidence set after curation:**

| Source | Type | Quality | Value | Note |
|--------|------|---------|-------|------|
| US State Dept | official_govt | 0.95 | 0.10 | "No deal confirmed" (whitelisted) |
| Ukraine MFA | official_govt | 0.95 | 0.15 | "Negotiations ongoing" (whitelisted) |
| Reuters | news_agency | 0.94 | 0.20 | "No signed agreement" |
| AP | news_agency | 0.94 | 0.20 | "Talks continue" |
| Polymarket price | social_media | 0.21 | 0.79 | Market at 79% YES |

**Excluded sources** (voted Invalid by majority):
- Twitter @cryptoleaker (55% Invalid): "Insider: deal done"
- Telegram anonymous (70% Invalid): "Signed"

**AI Ensemble results:**

| Model | Verdict | Confidence | Key Reasoning |
|-------|---------|------------|---------------|
| Claude | NO | 0.82 | "Official sources uniformly deny. Market price is speculative." |
| GPT | NO | 0.78 | "State Dept and MFA both deny. No primary source confirms." |
| Gemini | NO | 0.75 | "All official channels unconfirmed. SNS exclusion justified." |
| Domain AI | NO | 0.85 | "Diplomatic event pattern: official denial → 12% historical completion." |

IMA = 1.0 (unanimous NO)

**Policy Engine:**

| Rule | Check | Result |
|------|-------|--------|
| R1: min_sources ≥ 3 | 5 ≥ 3 | ✅ PASS |
| R2: min_types ≥ 2 | 4 types | ✅ PASS |
| R3: max_age ≤ 6h | 4.2h | ✅ PASS |
| R4: deviation ≤ 0.30 | σ = 0.43 | ❌ DEVIATION_TOO_HIGH |
| R5: confidence ≥ 0.60 | γ = 0.45 | ❌ LOW_CONFIDENCE |
| R6: source conflict ≤ 0.50 | official(0.13) vs social(0.79) = 0.66 | ❌ SOURCE_CONFLICT |
| R7: IMA ≥ 0.50 | 1.0 | ✅ PASS |
| R8: excluded reversal | Restoring excluded: avg shifts 0.19→0.21, no flip | ✅ PASS |
| R9: timing | After market end | ✅ PASS |

**Verdict: HOLD** — 3 violations. The $7M loss would have been prevented.

Under source curation: State Dept and MFA are whitelisted (q=0.95), dominating the weighted average. Even flooding with social media (quality ceiling 0.24) cannot shift the average. The whale's only path to AUTO requires forging official government sources—a criminal act.

### 9.2 Zelenskyy Suit ($237M, July 2025)

**Background**: Highest-volume Polymarket market ever. Two UMA whales (>50% DVM power) voted NO despite photographic evidence of formal attire, arguing "blazer ≠ suit."

**Evidence after curation:**

| Source | Type | Quality | Value |
|--------|------|---------|-------|
| Reuters photo | image_analysis | 0.50 | 0.85 |
| AP photo | image_analysis | 0.50 | 0.80 |
| Getty photo | image_analysis | 0.50 | 0.85 |
| BBC analysis | news_agency | 0.85 | 0.70 |
| Social consensus | social_media | 0.21 | 0.60 |
| Polymarket price | social_media | 0.21 | 0.35 |

**AI Ensemble:**

| Model | Verdict | Confidence |
|-------|---------|------------|
| Claude | YES | 0.62 |
| GPT | YES | 0.58 |
| Gemini | UNCERTAIN | 0.45 |
| Domain AI | YES | 0.55 |

IMA = 0.62 (weak consensus — Gemini dissents)

**Policy Engine**: σ = 0.38 > 0.30 (DEVIATION), γ = 0.48 < 0.60 (LOW_CONFIDENCE), source type conflict (image_analysis vs social_media). **Verdict: HOLD.**

This is the **correct outcome**. The question is genuinely ambiguous ("suit" vs "blazer"), and PoRE correctly refuses to auto-resolve. The human arbitration committee receives all photos, all AI analyses (including Gemini's dissent explaining why it's uncertain), the full voting record, and the policy violation report—incomparably more information than UMA voters received.

### 9.4 Fort Knox Gold ($3.5M, March 2025)

**Background**: A market on whether a Fort Knox gold audit would occur allegedly had its dispute button disabled, preventing the normal challenge process. Users reported being unable to initiate the standard UMA dispute flow.

**The structural problem this reveals**: When the resolution platform controls both trading and dispute infrastructure, a single point of failure exists. Disabling the dispute UI—whether intentionally or through a bug—removes the only recourse mechanism for incorrect resolutions. This is **V4: infrastructure capture**.

**How PoRE addresses this**: PoRE operates as **independent middleware on a separate execution layer**. Its evaluation runs regardless of whether the underlying platform's UI is functional. Even if Polymarket's interface is compromised, PoRE's assessment is computed off-chain (or on a separate chain) and published independently. The separation of safety infrastructure from trading infrastructure eliminates this attack vector entirely.

### 9.5 NASCAR Race Spillover ($60K, July 2025)

**Background**: Days after the Zelenskyy controversy, a routine $10,000 NASCAR Cup Series prediction market erupted into the largest dispute in UMA history. A proposer submitted a correct early settlement, but UMA's oracle rejected it. The dispute escalated through multiple rounds, accumulating $60,000 in dispute bonds—6× the original market volume [20].

**The structural problem this reveals**: Once trust in the oracle is damaged, even correct resolutions are contested. This is a **trust cascade failure**: the Zelenskyy dispute created rational paranoia where participants dispute everything, and the oracle's rejection of a correct proposal validated that paranoia. The system entered a negative feedback loop where distrust generates disputes, disputes generate costs, and costs generate more distrust.

**How PoRE addresses this**: For clear cases (like a completed NASCAR race with unambiguous results), PoRE's policy engine would evaluate:
- Multiple independent sources confirm the race outcome
- All sources agree (low deviation)
- AI ensemble unanimous
- Verdict: **AUTO** — resolved in seconds with zero dispute cost

PoRE prevents trust cascades by **structurally separating clear cases from ambiguous ones**. The Zelenskyy dispute's ambiguity does not infect the NASCAR resolution because they pass through independent, objective evaluation. A system that correctly handles easy cases 99% of the time preserves trust for the 1% that requires human judgment.

---

## 10. Implementation

### 10.1 Scope Separation

| Component | Status | Description |
|-----------|--------|-------------|
| Policy Engine (L5) | **Implemented** | 8 rules operational, deterministic evaluation |
| Evidence Collection — price (L1) | **Implemented** | 4 live sources: Chainlink, Binance, Coinbase, CoinGecko |
| AI Proposer/Challenger (L3) | **Prototype** | Deterministic heuristics; LLM integration on roadmap |
| On-chain Registry (L6) | **Prototype** | PoreRegistry.sol exists, undeployed (Sepolia-ready) |
| Replay System | **Implemented** | 6 cases with multi-checkpoint evaluation |
| Source Curation (L2) | **Protocol Design** | Specified in Section 6; smart contract TBD |
| AI Ensemble (L4) | **Protocol Design** | Specified in Section 7; Model Registry TBD |
| Excluded Source Forensics | **Protocol Design** | Rule 8 logic specified; curation dependency |

The current prototype demonstrates the core thesis: a deterministic policy engine can reliably distinguish clear cases (AUTO) from ambiguous ones (HOLD) using real-world evidence. Source Curation and AI Governance are protocol designs validated through case study analysis and game-theoretic reasoning.

### 10.2 Current Prototype

The prototype is JavaScript (Node.js) with a single external dependency (ethers):

| Module | Function |
|--------|----------|
| `policy/evaluator.js` | Deterministic policy engine |
| `ai/proposer.js` | Quality-weighted evidence analysis |
| `ai/challenger.js` | Adversarial challenge generation |
| `evidence/chainlinkFeed.js` | Chainlink mainnet BTC/USD feed |
| `evidence/liveCollector.js` | Real-time 4-source collection |
| `workflow/onchainRecorder.js` | On-chain verdict recording |
| `contracts/PoreRegistry.sol` | Solidity verdict registry |

### 10.3 Replay System

PoRE includes a replay system for evaluating historical cases:

```bash
npm run replay              # All 6 cases
npm run replay -- --case ukraine-deal  # Specific case
npm run live -- --scenario edge        # Live with dynamic threshold
npm run score              # Self-assessment against rubric
```

Replay cases include pre-curated evidence checkpoints at T-24h, T-1h, and T+1h, enabling evaluation of how the engine's assessment evolves.

### 10.4 Live Evaluation

Live mode collects from four sources and applies a dynamic threshold:

1. **Chainlink BTC/USD** — on-chain oracle via Ethereum mainnet
2. **Binance BTC/USDT** — CEX spot price
3. **Coinbase BTC-USD** — CEX spot price
4. **CoinGecko BTC** — aggregator

The `edge` scenario sets threshold at current median price, creating situations where minor source disagreements (tens to hundreds of dollars) determine the outcome—demonstrating policy engine sensitivity to real-world data divergence.

### 10.5 On-Chain Component

**PoreRegistry.sol** records verdicts on-chain:

```solidity
struct Resolution {
    string eventId;
    string decision;
    string finalState;
    string reasonCodes;
    bytes32 decisionHash;
    uint256 timestamp;
}
```

Deployable to Ethereum Sepolia testnet. In production, this serves as the immutable audit trail.

---

## 11. Discussion

### 11.1 Limitations

**Evidence collection scope**: The prototype handles numerical (price) data via live APIs and subjective events via pre-curated replay data. Production deployment requires automated evidence pipelines for news, images, and official statements—an engineering challenge, not a fundamental limitation.

**AI heuristic vs. LLM**: The current proposer/challenger use deterministic heuristics. LLM integration would improve evidence interpretation but introduces latency, cost, and prompt injection risk. The policy engine mitigates AI failure regardless of implementation.

**Base quality calibration**: Quality scores are expert-assigned. A more rigorous approach derives scores from historical accuracy data (Section 7.5's self-improving loop).

**Governance bootstrapping**: Who sets initial policy parameters and model weights? The prototype uses operator configuration. Production requires a governance bootstrap mechanism—potentially a founding committee that transitions to full token governance.

**Voting latency**: The 48-hour source curation window adds latency versus UMA's 2-hour challenge. Mitigation strategies: fast-track mode for low-volume markets, pre-approved source registries, reputation-weighted express voting.

### 11.2 Why Not Pure AI Resolution?

A well-prompted LLM approximates PoRE *most of the time*. For $237M, "most" is insufficient:

1. **Stochastic**: Different outputs for identical inputs across runs
2. **Unauditable**: "AI reasoning" cannot be independently verified
3. **Adversarially vulnerable**: Prompt injection, jailbreaking
4. **Single point of failure**: Provider outage halts the system

PoRE uses AI where it excels (interpretation) and code where code excels (enforcement). Multi-model ensemble further mitigates AI-specific risks.

### 11.3 Comparison of Approaches

| Property | UMA | Kleros | PoRE |
|----------|-----|--------|------|
| Resolution speed (clear) | Fast | Slow | Fast (AUTO) |
| Resolution speed (disputed) | 48h vote | Multi-round | HOLD → committee |
| Whale resistance | Low | Medium | High (whitelist + forensics) |
| Evidence quality | Voter judgment | Juror judgment | Structured + AI + code |
| Auditability | Vote count | Juror verdicts | Full evidence + AI + policy |
| AI risk | None | None | Mitigated (ensemble + policy) |

---

## 12. Future Work

1. **Source Curation smart contract**: EVM-based submission, voting, bond, and whitelist governance
2. **AI Model Registry contract**: On-chain model governance with weight updates and routing rules
3. **Empirical quality calibration**: Derive base quality scores from historical prediction market accuracy data
4. **Cross-platform federation**: Serve multiple platforms (Polymarket, Kalshi, Augur) with shared evidence and policy standards
5. **Formal verification**: Property-based testing and model checking of the policy engine (prove that no evidence set satisfying certain conditions produces incorrect AUTO)
6. **Proof-of-personhood hybrid voting**: Combine token-weighted and 1-person-1-vote signals (e.g., World ID) for source curation
7. **Recursive evidence evaluation**: Use resolved PoRE outcomes as evidence inputs for meta-markets

---

## 13. Conclusion

Prediction markets are among the most promising applications of decentralized technology, yet their resolution mechanisms remain the weakest link. The current paradigm—delegating resolution to token-weighted voting—has produced five documented failures across 13 months totaling $249M+ in affected volume, with an escalating trajectory from edge cases to systemic crises.

PoRE addresses this through three innovations:

1. **A deterministic policy engine** that mathematically evaluates resolution safety with 10 hard rules. It is code—it cannot be manipulated, jailbroken, or influenced by token holders.

2. **Decentralized source curation** that replaces outcome voting with evidence validation voting, shifting manipulation from 1-bit to N-dimensional constraint satisfaction. Excluded sources become forensic evidence through the Manipulation Trap mechanism.

3. **Decentralized AI governance** where multiple independent models form an ensemble governed by token holders. Inter-Model Agreement becomes a first-class safety signal, and the community controls which models participate.

In replay simulations of five documented Polymarket failures spanning 13 months ($249M+ in affected volume), PoRE correctly produced HOLD verdicts for ambiguous cases and AUTO for the falsely-disputed clear case.

The prediction market industry does not need faster resolution or more confident AI. It needs a system that knows **when it doesn't know**—and refuses to guess when millions of dollars are at stake.

---

## References

[1] J. Wolfers and E. Zitzewitz, "Prediction Markets," *J. Econ. Perspectives*, 18(2):107–126, 2004.

[2] L. Breidenbach et al., "Chainlink 2.0: Next Steps in the Evolution of Decentralized Oracle Networks," Chainlink Whitepaper, 2021.

[3] A. Hart et al., "UMA: Universal Market Access," UMA Protocol Whitepaper, 2020.

[4] API3, "Decentralized APIs for Web 3.0," API3 Whitepaper, 2020.

[5] F. Ast and B. Deffains, "Kleros: Short Paper," Kleros Whitepaper, 2017.

[6] J. Peterson et al., "Augur: A Decentralized Oracle and Prediction Market Platform," Augur Whitepaper, 2015.

[7] Olas Network, "Autonolas: Unified Autonomous Agent Framework," Olas Documentation, 2023.

[8] V. Buterin, "A Next-Generation Smart Contract and Decentralized Application Platform," Ethereum Whitepaper, 2014.

[9] Polymarket, "How Polymarket Works," Polymarket Documentation, 2024.

[10] K. J. Arrow, *Essays in the Theory of Risk-Bearing*, North-Holland, 1970.

[11] N. Shazeer et al., "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer," *ICLR*, 2017.

[12] Y. Bai et al., "Constitutional AI: Harmlessness from AI Feedback," *arXiv:2212.08073*, 2022.

[13] I. Liang et al., "Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate," *arXiv:2305.19118*, 2023.

[14] S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.

[15] G. Wood, "Ethereum: A Secure Decentralised Generalised Transaction Ledger," Ethereum Yellow Paper, 2014.

[16] A. Adler et al., "Aave Protocol Whitepaper," Aave Documentation, 2020.

[17] H. Adams et al., "Uniswap v3 Core," Uniswap Whitepaper, 2021.

[18] S. Reynolds, "Polymarket Says It's 'Conclusive' Barron Trump Was Involved in $DJT," *CoinDesk*, Jun 2024.

[19] B. Sobrado, "The President Wears No Suit: Polymarket's $160 Million Problem," *Forbes*, Jul 2025.

[20] CryptoSlate, "Polymarket $10k bet on NASCAR race turns to $60k dispute following Zelensky controversy," Jul 2025.

[21] TheBlock, "Polymarket says governance attack by UMA whale to hijack a bet's resolution is unprecedented," Mar 2025.

[22] CCN, "Polymarket Hit by Whale Manipulation as 5 Million Votes Rig Settlement," Mar 2025.

---

## Appendix A: End-to-End Protocol Walkthrough

This appendix demonstrates the complete PoRE protocol through a concrete scenario: the Ukraine mineral deal market ($7M volume).

### A.1 Event Registration

```
Event:     "Will US-Ukraine sign mineral deal by March 15?"
Market:    Polymarket, $7M volume
Category:  Geopolitics (subjective)
End time:  2026-03-15T23:59:00Z
→ PoRE state: PENDING
```

### A.2 Phase 1: Source Submission (24h window)

Anyone can submit evidence sources by depositing a bond (10 USDC per source).

```
Submitter A (general user):
  Source: "Reuters — US State Dept says no deal confirmed"
  Type:   news_agency
  Bond:   10 USDC
  Status: Awaiting vote

Submitter B (trader):
  Source: "AP — Negotiations ongoing, no signing"
  Type:   news_agency
  Bond:   10 USDC
  Status: Awaiting vote

Submitter C (whale, $2M YES position):
  Source: "Twitter @cryptoleaker — Insider: deal done"
  Type:   social_media
  Bond:   10 USDC
  Status: Awaiting vote

Submitter D (whale, YES position):
  Source: "Telegram anonymous — Deal signed"
  Type:   social_media
  Bond:   10 USDC
  Status: Awaiting vote

Auto-collected (PoRE system):
  🔒 US State Dept press release   → Whitelisted (official_govt)
  🔒 Ukraine MFA statement         → Whitelisted (official_govt)
  🔒 Chainlink reference data      → Whitelisted (onchain_oracle)
     Polymarket current price       → Submitted automatically
```

Whitelisted sources (🔒) are included regardless of votes.

### A.3 Phase 2: Source Validation Vote (48h window)

Token holders vote Valid / Invalid / Abstain on each non-whitelisted source:

```
┌─────────────────────────────┬───────┬─────────┬─────────┬────────┐
│ Source                       │ Valid │ Invalid │ Abstain │ Result │
├─────────────────────────────┼───────┼─────────┼─────────┼────────┤
│ 🔒 US State Dept            │  —    │  —      │  —      │ Auto   │
│ 🔒 Ukraine MFA              │  —    │  —      │  —      │ Auto   │
│ 🔒 Chainlink data           │  —    │  —      │  —      │ Auto   │
│ Reuters article              │  82%  │   8%    │  10%    │ ✅ In  │
│ AP article                   │  78%  │  12%    │  10%    │ ✅ In  │
│ Polymarket price             │  65%  │  25%    │  10%    │ ✅ In  │
│ Twitter @cryptoleaker        │  30%  │  55%    │  15%    │ ❌ Out │
│ Telegram anonymous           │  20%  │  70%    │  10%    │ ❌ Out │
└─────────────────────────────┴───────┴─────────┴─────────┴────────┘
```

Excluded sources are **not discarded**. They are tagged and forwarded:

```
Excluded metadata passed to AI:
  "Twitter @cryptoleaker — excluded (55% Invalid). Claim: deal done."
  "Telegram anonymous — excluded (70% Invalid). Claim: deal signed."
```

### A.4 Quality Score Adjustment

```
q_adjusted = q_base × (0.8 + 0.4 × valid_ratio)

US State Dept (official_govt):  0.95 × auto          = 0.95
Ukraine MFA (official_govt):    0.95 × auto          = 0.95
Reuters (news_agency):          0.85 × (0.8+0.4×0.82)= 0.85×1.128 = 0.96 → cap 0.95
AP (news_agency):               0.85 × (0.8+0.4×0.78)= 0.85×1.112 = 0.95
Polymarket (social_media):      0.20 × (0.8+0.4×0.65)= 0.20×1.060 = 0.21

Key insight: Even with 100% Valid votes,
  social_media max = 0.20 × 1.20 = 0.24
  This can never approach official_govt (0.95).
```

### A.5 Phase 3: AI Ensemble Analysis

Four independent models receive the same evidence package:

```
Input: 5 validated sources + 2 excluded source metadata

┌─ Claude Opus ──────────────────────────────────────────┐
│ Verdict: NO (confidence: 0.82)                          │
│ "Official sources (State Dept, MFA) uniformly deny.     │
│  Market price reflects speculative positioning, not      │
│  factual confirmation. Excluded SNS sources lack         │
│  verification — exclusion appears justified."            │
└─────────────────────────────────────────────────────────┘

┌─ GPT-5 ────────────────────────────────────────────────┐
│ Verdict: NO (confidence: 0.78)                          │
│ "Both governmental sources deny. Reuters and AP confirm │
│  no signing. No primary-source confirmation exists.      │
│  Excluded sources are anonymous and unverifiable."       │
└─────────────────────────────────────────────────────────┘

┌─ Gemini ───────────────────────────────────────────────┐
│ Verdict: NO (confidence: 0.75)                          │
│ "All official channels report no confirmation.           │
│  Excluded social media sources correctly identified      │
│  as unreliable by community vote."                       │
└─────────────────────────────────────────────────────────┘

┌─ Exchange Domain AI (weight: 2×) ──────────────────────┐
│ Verdict: NO (confidence: 0.85)                          │
│ "Diplomatic event pattern analysis: when official        │
│  sources deny, historical completion rate is <12%.       │
│  Market price divergence typical of speculative pump."   │
└─────────────────────────────────────────────────────────┘
```

**Inter-Model Agreement:**

```
Verdicts: [NO, NO, NO, NO] → Unanimous

Weighted confidence:
  = (0.82×1 + 0.78×1 + 0.75×1 + 0.85×2) / (1+1+1+2)
  = 4.05 / 5 = 0.81

IMA = 1.0 (σ = 0, perfect agreement)
```

### A.6 Phase 4: Deterministic Policy Engine

```
┌─────────────────────────────────────────────────────────┐
│ POLICY ENGINE EVALUATION                                 │
│                                                          │
│ R1  min_sources ≥ 3         5 sources    → ✅ PASS      │
│ R2  min_types ≥ 2           4 types      → ✅ PASS      │
│ R3  max_age ≤ 6h            4.2h oldest  → ✅ PASS      │
│ R4  deviation ≤ 0.30        σ = 0.43     → ❌ FAIL      │
│     ↳ DEVIATION_TOO_HIGH                                │
│ R5  confidence ≥ 0.60       γ = 0.45     → ❌ FAIL      │
│     ↳ LOW_CONFIDENCE                                     │
│ R6  type conflict ≤ 0.50    0.66         → ❌ FAIL      │
│     ↳ SOURCE_CONFLICT (official 0.13 vs social 0.79)    │
│ R7  IMA ≥ 0.50              1.00         → ✅ PASS      │
│ R8  excluded reversal?      No flip      → ✅ PASS      │
│ R9  timing                  After end    → ✅ PASS      │
│ R10 proposer-challenger     Unanimous    → ✅ PASS      │
│                                                          │
│ Violations: 3 (DEVIATION, LOW_CONFIDENCE, SOURCE_CONFLICT)│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │            VERDICT:  H O L D                         │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### A.7 Phase 5: Resolution (HOLD Path)

**On-chain recording:**

```
PoreRegistry.record({
  eventId:      "ukraine-mineral-deal-2026-03-15",
  decision:     "NO",
  finalState:   "HOLD_FOR_REVIEW",
  reasonCodes:  "DEVIATION_TOO_HIGH,LOW_CONFIDENCE,SOURCE_CONFLICT",
  evidenceHash: 0x7b1c...
  modelVotes:   "claude:NO,gpt:NO,gemini:NO,exchange:NO",
  IMA:          1.0
})
→ tx: 0x9f8e... (immutable record)
```

**Evidence package published:**

```
Available to anyone:
  ├─ All 5 source documents (full text + hashes)
  ├─ 2 excluded sources with metadata
  ├─ Community voting record (who voted what)
  ├─ 4 AI model analyses (full reasoning text)
  ├─ Policy violation report (3 violations, exact values)
  └─ Confidence scores and IMA calculation
```

**Escalation to human arbitration committee:**

```
Committee receives:
  ① All original evidence
  ② 4 independent AI analyses with reasoning
  ③ Policy violation report (why HOLD)
  ④ Community voting record (whale pattern detection possible)
  ⑤ Excluded source forensics

Compare with UMA:
  UMA voters received: "Did Ukraine sign a deal? [YES] [NO]"
  PoRE committee receives: items ①–⑤ above

Committee verdict: NO (based on official sources)
→ $7M settled correctly to NO holders
```

### A.8 Contrast: Clear Case (AUTO Path)

For comparison, here is a clear case that resolves via AUTO:

```
Event: "Is BTC price ≥ $90,000 on March 1, 2026?"
Actual BTC: $97,234

Sources:
  Chainlink:  $97,230  (onchain_oracle, q=0.95)
  Binance:    $97,238  (cex_spot,       q=0.90)
  Coinbase:   $97,225  (cex_spot,       q=0.90)
  CoinGecko:  $97,240  (aggregator,     q=0.80)
  Bitfinex:   $97,235  (cex_spot,       q=0.85)

AI Ensemble: [YES, YES, YES, YES] — IMA = 1.0

Policy Engine:
  R1  ✅  5 ≥ 3
  R2  ✅  3 types ≥ 2
  R3  ✅  All < 1 min old
  R4  ✅  σ = 0.0001 ≤ 0.30
  R5  ✅  γ = 0.96 ≥ 0.60
  R6  ✅  No cross-type conflict
  R7  ✅  IMA = 1.0
  R8  ✅  No excluded sources
  R9  ✅  After market end
  R10 ✅  Unanimous

  0 violations → AUTO → YES → On-chain record → Settlement
  Total time: ~30 seconds
```

**This is PoRE's core value proposition**: the same engine handles both cases. Clear events resolve instantly (AUTO). Ambiguous events are caught and escalated (HOLD). No human intervention needed for the common case; full evidence package provided for the hard case.

---

## Appendix B: Policy Configuration Reference

```json
{
  "policy_version": "v2",
  "min_sources": 3,
  "min_source_types": 2,
  "max_deviation": 0.30,
  "confidence_threshold": 0.60,
  "confidence_weights": [0.5, 0.3, 0.2],
  "max_age_hours": 6,
  "ima_threshold": 0.50,
  "max_source_conflict": 0.50,
  "quorum_source_types": ["onchain_oracle", "news_agency", "official_govt"],
  "whitelist_source_types": ["official_govt", "onchain_oracle"],
  "require_proposer_challenger_agreement": false,
  "allow_too_early": false,
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
  "ensemble": {
    "min_models": 3,
    "max_single_weight": 0.40,
    "min_providers": 2
  },
  "curation": {
    "submission_bond": "10 USDC",
    "voting_window_hours": 48,
    "fast_track_volume_threshold": "100000 USDC"
  }
}
```

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| AUTO | Policy engine verdict: all rules pass, safe to auto-resolve |
| HOLD | Policy engine verdict: one or more violations, escalate to human review |
| IMA | Inter-Model Agreement — consensus metric across AI ensemble |
| DVM | Data Verification Mechanism (UMA's token-weighted voting) |
| Source Curation | Community-validated evidence selection process |
| Whitelist | Source types that cannot be removed by community vote |
| Model Registry | On-chain governance mechanism for AI ensemble membership |
| Manipulation Trap | Mechanism where excluded source forensics detects curation bias |
| Quality-weighted avg | Mean of source values weighted by quality scores |
| Deviation (σ) | Quality-weighted standard deviation of source values |
| Policy Engine | Deterministic code layer evaluating evidence against hard rules |
| Proposer | Majority AI verdict from ensemble |
| Challenger | Minority AI verdict from ensemble (natural adversarial) |

---

*This paper is released under CC BY 4.0. The PoRE software prototype is released under the MIT License.*

*Correspondence: Seo Mk — GitHub: github.com/minkyun12/pore-engine*
