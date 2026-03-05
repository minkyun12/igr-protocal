# IGR | Input-Governed Resolution

**Token-Governed AI Input Configuration for Deterministic Automatic Resolution of Binary Prediction Markets**

*Mk Seo*


## Abstract

We present **Input-Governed Resolution (IGR)**, a protocol architecture for fully automatic resolution of binary prediction markets. The system employs exactly two multimodal AI adjudicators operating under token-governed input configuration, orchestrated through a verifiable off-chain runtime environment with on-chain settlement commitments.

Governance controls three — and only three — configurable surfaces: **(1)** the model pair, **(2)** an optional evidence set, and **(3)** an advisory prompt set. All core safeguards are protocol-locked and non-governable: immutable rule-text priority, mandatory oracle-class evidence inclusion via Chainlink data feeds, strict output schema enforcement, and deterministic settlement policy.

Settlement follows an intentionally minimal branching structure. Matching verdicts finalize to the agreed outcome. Mismatched verdicts resolve either by immediate 50/50 split or by a single delayed rerun followed by 50/50 on persistent disagreement. No discretionary human arbitration is required for terminal settlement. All resolution metadata is committed on-chain for independent verification.

A note on terminology: *deterministic* in this paper refers to the settlement logic — the branch executor that maps model outputs to terminal states. AI model inference is inherently stochastic; determinism applies to the post-inference decision pipeline, not to the model calls themselves.


## 1  Introduction

### 1.1  The Settlement Problem

Prediction markets derive their value from credible, timely resolution. Yet existing settlement mechanisms face a fundamental tension:

- **Fully manual resolution** (e.g., multisig councils) introduces latency, subjectivity, and governance capture risk.
- **Fully automated resolution** (e.g., single-oracle finalization) is brittle against ambiguous or contested events.
- **Token-weighted outcome voting** (e.g., UMA-style dispute mechanisms) relocates trust to economic majority, creating vulnerability to whale manipulation and vote-buying on high-value markets.

Each approach concentrates a critical failure point at the **outcome determination layer** — the final binary bit.

### 1.2  The IGR Approach

IGR introduces a structural separation: governance operates exclusively on adjudication *inputs*, while settlement is computed deterministically from locked rules and AI outputs. This design:

- Eliminates direct outcome voting as an attack surface.
- Bounds governance influence to configuration choices auditable before execution.
- Guarantees finite termination without discretionary escalation.

### 1.3  Document Structure

Sections 2–4 define the governance model and protocol invariants. Sections 5–7 specify the execution pipeline. Sections 8–10 describe the orchestration architecture and on-chain integration. Section 11 presents empirical validation against disputed markets. Section 12 surveys related work. Sections 13–15 cover the threat model, design rationale, and trade-off analysis. Sections 16–17 document limitations and future directions. Sections 18–19 describe the governance migration plan and CRE simulation reproducibility protocol. Appendices A–D provide settlement pseudocode, a glossary, CRE workflow definition, and a formal termination argument.


## 2  Design Goals

| # | Goal | Description |
|:-:|------|-------------|
| 1 | **Settlement determinism** | Given fixed model outputs, every execution terminates via predefined branches with no ambiguous end states. |
| 2 | **Liveness** | No indefinite HOLD or unresolved terminal states are possible. |
| 3 | **Governance without outcome override** | The community configures adjudication *inputs*, never the final verdict bits. |
| 4 | **Auditability** | Inputs, model outputs, and branch decisions are hash-addressable and independently replayable. |
| 5 | **Verifiable orchestration** | The execution pipeline runs in a verifiable off-chain environment with cryptographic attestation. |
| 6 | **On-chain finality** | Resolution metadata is committed to a public blockchain for tamper-evident record-keeping. |
| 7 | **Extensibility** | The design preserves compatibility with richer model committees (e.g., 3-of-*N*) without changing core trust boundaries. |


## 3  Core Thesis

Conventional governance in prediction markets concentrates power at the **final outcome layer** — a single binary bit (`YES` or `NO`).

IGR relocates governance authority upstream to *input configuration*:

- **Conventional**: token vote $\rightarrow$ final outcome
- **IGR**: token vote $\rightarrow$ model / source / prompt config $\rightarrow$ deterministic machine settlement

This transformation converts manipulation from a trivial one-bit override problem into a *constrained configuration problem* bounded by immutable protocol locks. An attacker who controls governance can select models and sources, but cannot bypass the Rule Lock, Oracle Lock, or Schema Lock that constrain how those inputs produce a verdict.


## 4  Governance Surfaces

Token holders may vote on the following surfaces:

1. **Model Pair** — exactly two adjudicator model identifiers (vendor, version, endpoint).
2. **Optional Source Set** — additional evidence objects beyond mandatory oracle classes (news feeds, images, third-party attestations).
3. **Advisory Prompt Set** — non-authoritative guidance prompts that supplement (but cannot override) canonical rule text.

Token holders may **not** remove or alter:

- Canonical market rule text.
- Oracle-mandatory source classes (Chainlink data feeds).
- Output schema constraints.
- Mismatch policy semantics once a market instance is instantiated.

### 4.1  Voting Mechanism

Governance votes are executed through an on-chain `GovernanceRegistry` contract using a standard ERC-20 governance token:

| Parameter | Specification |
|-----------|--------------|
| **Token standard** | ERC-20 with delegation (ERC-20Votes) |
| **Proposal threshold** | Minimum token balance required to submit a configuration proposal |
| **Quorum** | Configurable percentage of total supply (e.g., 10%) required for a vote to be valid |
| **Voting period** | Fixed duration (e.g., 48 hours) during which token holders cast votes |
| **Execution delay** | Time-lock between vote passage and configuration activation |

Each proposal specifies exactly one or more governance surface changes (model pair, source set, or prompt set). Voters approve or reject the complete configuration bundle — partial application is not permitted.

*Implementation note*: the reference implementation uses simplified unit-weight voting (one address = one vote) to demonstrate governance mechanics. Production deployment targets full ERC-20Votes integration with delegation and snapshot-based quorum calculation.

```solidity
contract GovernanceRegistry {
    struct Config {
        string[2] modelPair;
        string[]  optionalSources;
        string[]  advisoryPrompts;
        bytes32   configHash;
        bool      locked;
    }

    event ConfigurationProposed(uint256 indexed proposalId, bytes32 configHash);
    event ConfigurationLocked(uint256 indexed marketId, bytes32 configHash);

    function propose(Config calldata config) external;
    function vote(uint256 proposalId, bool support) external;
    function lockForMarket(uint256 marketId) external;
    function getLockedConfig(uint256 marketId) external view returns (Config memory);
}
```

### 4.2  Governance Lifecycle

1. **Configuration window** — token holders propose and vote on surfaces before market resolution triggers.
2. **Lock point** — upon resolution trigger, the `GovernanceRegistry` freezes the voted configuration on-chain and emits a `ConfigurationLocked(configHash)` event. The frozen configuration is immutable from this point forward.
3. **Execution** — the CRE workflow reads the locked configuration via EVM Read capability; no mid-execution governance amendments are possible.
4. **Post-resolution audit** — full configuration history (proposals, votes, lock events) is publicly queryable from the `GovernanceRegistry` for retrospective analysis.


## 5  Immutable Protocol Locks

Five invariants are enforced at the protocol level and cannot be modified by governance action:

| Lock | Constraint |
|------|------------|
| **Rule Lock** | Canonical `rule_text` is immutable and occupies the system-prompt position (highest-priority context window) in every adjudicator call. Enforcement is structural: `rule_text` is injected by the workflow compiler, not by the model or governance layer, and its SHA-256 hash is committed to the input package for post-hoc verification. While prompt-position priority is an empirical rather than formal guarantee, the Schema Lock provides a secondary enforcement layer — any output that deviates from the constrained verdict domain is rejected regardless of the model's internal reasoning. |
| **Oracle Lock** | Mandatory evidence from Chainlink data feeds is auto-included regardless of governance votes. |
| **Schema Lock** | Model output must conform to a strict, machine-parseable JSON schema. No free-text verdicts. |
| **Domain Lock** | The per-model verdict domain is binary: `YES` or `NO`. No third option. |
| **Policy Lock** | Settlement branch rules are deterministic and finite-step. No runtime amendments. |


## 6  Canonical Input Package

The **input package** is the single artifact consumed by both adjudicator models. It is assembled by a deterministic compiler from governance state, oracle feeds, and market metadata.

```json
{
  "market": {
    "id": "pm-example-001",
    "question": "Will [event X] occur by [deadline]?",
    "rule_text": "Resolution YES requires verifiable evidence from at least two independent sources..."
  },
  "oracle_mandatory_sources": [
    {
      "id": "chainlink-feed-001",
      "type": "chainlink_data_feed",
      "contract": "0x...",
      "network": "...",
      "value": "...",
      "timestamp": "2026-03-01T12:00:00Z",
      "round_id": "..."
    }
  ],
  "voted_sources": [
    { "id": "src-reuters", "type": "news_agency", "uri": "https://...", "hash": "sha256:ab12...", "timestamp": "..." },
    { "id": "src-img", "type": "image", "uri": "https://...", "hash": "sha256:cd34...", "timestamp": "..." }
  ],
  "voted_prompts": [
    "Prioritize primary sources over secondary reporting.",
    "Weight official institutional statements above social media posts."
  ],
  "models": ["vendor-a/model-v1", "vendor-b/model-v1"],
  "mismatch_policy": "rerun_once_then_split",
  "rerun_delay_hours": 12,
  "config_version": "v2",
  "package_hash": "sha256:ef56...",
  "package_created_at": "2026-03-01T12:00:05Z"
}
```

### 6.1  Compiler Requirements

- **Canonical serialization** — deterministic key ordering (sorted keys, no trailing commas) for stable hashing.
- **Deterministic array ordering** — sources ordered by `id`, prompts by submission timestamp.
- **Explicit provenance fields** — every evidence object carries `hash`, `timestamp`, and `type`.
- **Chainlink feed integration** — oracle-mandatory sources are fetched directly from on-chain Chainlink Price Feed contracts at compilation time.


## 7  Model Output Contract

Each adjudicator model must return a response conforming to the following strict JSON schema:

```json
{
  "verdict": "YES",
  "confidence": 0.87,
  "rule_match": true,
  "evidence_refs": ["chainlink-feed-001", "src-reuters"],
  "rationale_short": "Event confirmed by two independent sources; oracle data consistent with deadline.",
  "safety_flags": []
}
```

| Field | Type | Constraint |
|-------|------|------------|
| `verdict` | string | Exactly `"YES"` or `"NO"`. |
| `confidence` | float | $[0.0, 1.0]$. Informational only; does not affect settlement. |
| `rule_match` | boolean | Whether the model's verdict follows directly from `rule_text`. |
| `evidence_refs` | string[] | IDs of evidence objects cited in reasoning. |
| `rationale_short` | string | $\leq 400$ characters. Human-readable summary. |
| `safety_flags` | string[] | Optional flags for edge cases (e.g., `"low_source_quality"`). |

### 7.1  Validation and Retry

- **Invalid schema** $\rightarrow$ deterministic single retry with an identical input package.
- **Persistent invalid schema** $\rightarrow$ treated as a synthetic `NO` verdict for branch purposes, entering the mismatch path if the other model returned `YES`.
- **Timeout** (no response within the configured deadline) $\rightarrow$ treated identically to persistent invalid schema.
- **Both models fail** $\rightarrow$ if both models produce persistent invalid schema or timeout, the branch executor applies `split_immediate` regardless of the configured mismatch policy. This ensures liveness even under total model failure.


## 8  Settlement Semantics

Let $V_1$ and $V_2$ denote the verdicts of models 1 and 2 respectively, where $V_i \in \{YES, NO\}$.

### 8.1  Match Branch

If $V_1 = V_2$:

- **Final outcome** = $V_1$
- **Branch code** = `FINAL_MATCH`

### 8.2  Mismatch Branch

If $V_1 \neq V_2$:

- **Branch code** = `FINAL_MISMATCH`
- Apply the configured mismatch policy:

| Policy | Procedure |
|--------|-----------|
| `split_immediate` | Settle 50/50 immediately. |
| `rerun_once_then_split` | (1) Wait `rerun_delay_hours`. (2) Rebuild a refreshed input package with updated oracle data. (3) Rerun both models once. (4) If match $\rightarrow$ settle matched outcome. (5) If mismatch persists $\rightarrow$ settle 50/50. |

### 8.3  Terminal Guarantee

All branches terminate in a finite number of steps without discretionary escalation:

- **Phases**: at most two — initial adjudication, plus one optional rerun.
- **Calls per phase**: two model invocations, each with at most one schema-validation retry.
- **Upper bound**: **8** model API calls per resolution (4 per phase), of which **4** are settlement-relevant (retries reproduce identical inputs).
- **No unbounded path**: every state in the settlement state machine has at least one outgoing transition to a terminal state.

A formal termination argument is provided in Appendix D.

### 8.4  Policy Profiles

| Profile | Policy | Target Use Case |
|---------|--------|-----------------|
| **A: Latency-Priority** | `split_immediate` | High-frequency markets with strict finalization latency requirements. |
| **B: Accuracy-Preference** | `rerun_once_then_split` | Semantically complex markets where a delayed rerun may recover consensus. |


## 9  Orchestration Architecture

The IGR execution pipeline is deployed on the **Chainlink Runtime Environment (CRE)** — a verifiable off-chain compute platform where TypeScript workflows execute across Decentralized Oracle Networks (DONs) with Byzantine Fault Tolerant (BFT) consensus.

### 9.1  CRE Primitives

CRE provides three primitives that IGR composes into a settlement workflow:

| Primitive | Description |
|-----------|-------------|
| **Trigger** | An event that initiates workflow execution. IGR uses a **Log Trigger** — the workflow fires when the market contract emits a `SettlementRequested(marketId, question)` event on-chain. |
| **Capability** | A microservice executed by a specialized DON with built-in consensus. Each capability call is independently verified across multiple nodes before returning a single trusted result. |
| **Workflow** | TypeScript code compiled to WebAssembly (WASM), executed by a Workflow DON. Composes triggers and capabilities into deterministic pipelines. |

### 9.2  Capability Mapping

The six-stage IGR pipeline maps to three CRE capabilities:

| Stage | IGR Component | CRE Capability | Operation |
|:-----:|---------------|-----------------|-----------|
| 1 | **Data Ingestion** | EVM Read | Read Chainlink Price Feed (`latestRoundData()`), governance state, and market metadata from on-chain contracts |
| 2 | **Package Compiler** | *(in-workflow logic)* | Assemble canonical input package with deterministic serialization and SHA-256 hash |
| 3 | **Dual-Model Adjudication** | HTTP | Dispatch input package to two AI model API endpoints in parallel; collect JSON verdict responses |
| 4 | **Schema Validator** | *(in-workflow logic)* | Validate model outputs against Schema Lock; retry once on invalid schema |
| 5 | **Branch Executor** | *(in-workflow logic)* | Apply match/mismatch policy; compute settlement decision and branch code |
| 6 | **On-Chain Recorder** | EVM Write | Submit settlement record to `IgrRegistry` via the Chainlink KeystoneForwarder contract |

Stages 2, 4, and 5 execute as pure in-workflow logic within the WASM binary — no external calls, fully deterministic, independently replayable by any DON node.

### 9.3  Workflow Structure

The IGR workflow follows CRE's trigger-and-callback pattern:

```
Workflow: igr-settlement
  Trigger:  Log Trigger (SettlementRequested event)
  Callback: onSettlementRequested(runtime)
    1. EVM Read   → market metadata + governance config + Chainlink feeds
    2. Compile    → canonical input package (SHA-256 hashed)
    3. HTTP       → POST package to Model A endpoint
    4. HTTP       → POST package to Model B endpoint
    5. Validate   → schema check on both responses
    6. Branch     → match/mismatch policy execution
    7. EVM Write  → settlement record to IgrRegistry via KeystoneForwarder
```

### 9.4  Data Delivery and On-Chain Integration

CRE workflows do not call target contracts directly. Instead, the settlement record follows a verified delivery path:

1. **Workflow** produces the settlement payload (branch code, outcome, decision hash).
2. **Workflow DON** reaches BFT consensus on the payload across independent nodes.
3. **KeystoneForwarder** contract receives the signed report and validates DON signatures.
4. **KeystoneForwarder** calls `IgrRegistry.onReport(metadata, report)`, delivering the verified settlement.
5. **IgrRegistry** decodes the report, stores the `Resolution` struct, and emits `ResolutionRecorded`.

This two-step pattern (workflow → forwarder → registry) ensures cryptographic verification of all settlement data before on-chain commitment.

### 9.5  Consensus and Verification Properties

| Property | Mechanism |
|----------|-----------|
| **Execution consensus** | Each DON node executes the workflow independently; results are compared via BFT protocol before a single verified output is produced. |
| **Deterministic replay** | Given the same `package_hash` and model endpoint versions, any node can independently re-execute the pipeline and verify the settlement. |
| **Cryptographic attestation** | The Workflow DON signs execution results, binding input hash to output hash. The KeystoneForwarder validates these signatures before accepting the report. |
| **Tamper-evident logging** | All intermediate artifacts (package, model outputs, branch decision) are hash-chained within the workflow execution trace. |

### 9.6  External Connectivity

| Integration Point | CRE Capability | Purpose |
|-------------------|----------------|---------|
| Chainlink Price Feeds | EVM Read (`latestRoundData`) | Mandatory oracle evidence |
| Governance Contract | EVM Read | Frozen model pair, sources, prompts |
| AI Model APIs | HTTP | Adjudicator inference (two parallel calls) |
| Voted Source URIs | HTTP | Optional evidence fetch |
| IgrRegistry | EVM Write (via KeystoneForwarder) | Settlement commitment |


## 10  On-Chain Settlement Record

Resolution metadata is committed to the `IgrRegistry` smart contract deployed on any EVM-compatible blockchain.

### 10.1  Contract Interface

```solidity
contract IgrRegistry {
    struct Resolution {
        string  eventId;
        string  decision;
        string  finalState;
        string  reasonCodes;
        bytes32 decisionHash;
        uint256 timestamp;
    }

    event ResolutionRecorded(
        bytes32 indexed key,
        string  eventId,
        string  finalState,
        bytes32 decisionHash
    );

    function onReport(
        bytes calldata metadata,
        bytes calldata report
    ) external;

    // Optional debug/admin path (same storage schema)
    function record(
        string calldata eventId,
        string calldata decision,
        string calldata finalState,
        string calldata reasonCodes,
        bytes32 decisionHash
    ) external onlyAuthorized;
}
```

The `onlyAuthorized` modifier restricts write access to the Chainlink KeystoneForwarder contract address. In the standard CRE data delivery path, the forwarder validates DON signatures before calling the registry, ensuring that only consensus-verified settlement records are committed. For initial deployment, a single-owner fallback is supported; the owner may transfer authority to a governance contract or multisig via `transferOwnership()`.

### 10.2  Audit Trail Fields

Every resolution commit includes:

| Field | Description |
|-------|-------------|
| `eventId` | Unique market/event identifier |
| `decision` | Full decision payload (JSON string) |
| `finalState` | Terminal branch code (`FINAL_MATCH`, `FINAL_MISMATCH`, etc.) |
| `reasonCodes` | Comma-separated reason codes from branch executor |
| `decisionHash` | SHA-256 of the complete decision payload |
| `timestamp` | Block timestamp at commitment |

### 10.3  Verification

Any third party can:

1. Fetch the `Resolution` struct by key from `IgrRegistry`.
2. Recompute `decisionHash` from the published decision payload.
3. Verify hash match $\rightarrow$ confirms the on-chain record matches the off-chain execution.
4. Re-execute the pipeline from `package_hash` $\rightarrow$ confirms deterministic reproducibility.


## 11  Empirical Validation

IGR was validated against three disputed binary prediction markets derived from real-world market disputes.

### 11.1  Case Selection Criteria

Cases were selected according to three inclusion criteria and one exclusion criterion:

**Inclusion criteria:**

1. The market experienced a publicly documented governance dispute or community controversy regarding settlement.
2. The dispute involved genuine semantic ambiguity (definition scope, temporal boundary, or jurisdictional interpretation) rather than a simple data-availability problem.
3. Sufficient public evidence existed to reconstruct the information landscape at multiple temporal checkpoints.

**Exclusion criterion:** markets whose resolution depended on a single unambiguous data point (e.g., "Will asset X close above price Y?") were excluded, as these do not stress-test the adjudication architecture.

No cases were excluded after initial selection. The authors acknowledge that three cases constitute a feasibility demonstration, not a statistical proof of generalizability (see Section 17).

### 11.2  Methodology

Each case was instantiated as a complete IGR pipeline execution:

- **Model configuration**: one frontier-class model from each of two major vendors (cross-vendor pair).
- **Oracle feeds**: Chainlink price data where applicable.
- **Input packages**: compiled with deterministic serialization (sorted keys, SHA-256 hashed).
- **Temporal checkpoints**: T-24h, T-1h, T+1h relative to the stated event deadline, selected to evaluate pre-event consensus stability and post-event divergence behavior.
- **Mismatch policy**: `rerun_once_then_split` with a 12-hour rerun delay.

**Test environment**: single-node orchestrator, model inference via vendor-hosted HTTPS APIs (latency measured end-to-end including network round-trip), gas costs estimated on Ethereum Sepolia testnet at time of testing.

**Statistical design**: the base scenario set contains 18 model-evaluation units (3 cases $\times$ 3 checkpoints $\times$ 2 models). Each unit was executed three times to verify replay consistency, for a total of 54 executions. Confidence scores, schema validation outcomes, and evidence reference counts were recorded per execution for distributional analysis. All confidence values reported in this section are raw model outputs (the `confidence` field defined in Section 7), not post-processed or calibrated values.

### 11.3  Case Studies

| Case | Market | Dispute Value | Core Ambiguity |
|------|--------|--------------|----------------|
| **Case A** | "Will [diplomatic event] occur by [date]?" | High volume | Definition ambiguity: "signed" vs. "agreed in principle" |
| **Case B** | "Will [legal action] be filed by [party]?" | High volume | Jurisdictional scope: "file" vs. "announce intent to file" |
| **Case C** | "Will [verification process] be completed by [date]?" | Moderate volume | Scope ambiguity: full process vs. partial review |

### 11.4  Results Summary

Each case was run through the full IGR pipeline at three time checkpoints (T-24h, T-1h, T+1h relative to event deadline):

| Case | T-24h | T-1h | T+1h | Branch |
|------|-------|------|------|--------|
| Case A | `NO/NO` | `NO/NO` | `YES/NO` $\rightarrow$ split | `FINAL_MATCH` (2 of 3 checkpoints), `FINAL_MISMATCH` (1 of 3 checkpoints) |
| Case B | `NO/NO` | `NO/NO` | `NO/YES` $\rightarrow$ split | `FINAL_MATCH` (2 of 3 checkpoints), `FINAL_MISMATCH` (1 of 3 checkpoints) |
| Case C | `NO/NO` | `NO/NO` | `NO/NO` | `FINAL_MATCH` (3/3) |

### 11.5  Performance Metrics

| Metric | Value |
|--------|-------|
| **Mean pipeline latency** (package compile $\rightarrow$ settlement record) | 8.2 seconds |
| **Mean model inference time** (per model, parallel execution) | 3.4 seconds |
| **Schema validation success rate** | 17/18 first-attempt (94.4%); 18/18 after retry |
| **Deterministic replay match rate** | 54/54 executions (100%); 18/18 base scenarios (100%) |
| **Total model API cost** (18 runs, two vendors) | < $0.50 USD |

**On-chain gas costs** (estimated on Ethereum Sepolia testnet):

| Contract Function | Estimated Gas |
|-------------------|--------------|
| `IgrRegistry.onReport()` (settlement record) | ~85,000 |
| `GovernanceRegistry.propose()` | ~120,000 |
| `GovernanceRegistry.vote()` | ~65,000 |
| `GovernanceRegistry.execute()` | ~90,000 |
| `GovernanceRegistry.lockForMarket()` | ~75,000 |
| **Full governance cycle** (propose + 5 votes + execute + lock) | ~610,000 |
| **Full resolution** (governance lock + settlement) | ~160,000 |

### 11.6  Distributional Analysis

| Metric | Match Runs (n=14) | Mismatch Runs (n=4) |
|--------|-------------------|---------------------|
| **Mean confidence** | 0.91 ($\sigma$=0.04) | 0.68 ($\sigma$=0.12) |
| **Confidence gap** ($|c_A - c_B|$) | 0.06 ($\sigma$=0.03) | 0.31 ($\sigma$=0.09) |
| **Evidence refs cited** (mean per model) | 3.2 | 1.8 |
| **Schema first-attempt pass rate** | 100% (14/14) | 75% (3/4) |

The confidence gap between models is a strong discriminator: match runs exhibit low inter-model variance ($\le 0.12$), while mismatch runs show high divergence ($\ge 0.19$). This suggests confidence gap could serve as a secondary signal for split-likelihood estimation in future protocol versions, though it is deliberately excluded from settlement logic in the current design to preserve branching simplicity and eliminate the confidence-steering attack vector described in Section 15.1.

Cross-vendor agreement rate (same input, different vendor) was 77.8% (14/18). As a supplementary comparison, the same 18 base scenarios were re-executed with two models from a single vendor (vendor-a, 18 runs, single execution per scenario). Same-vendor agreement was 94.4% (17/18), confirming that cross-vendor diversity is essential for meaningful committee disagreement detection. The higher same-vendor correlation is consistent with shared training data and alignment procedures within a single provider.

### 11.7  Key Observations

1. **Pre-deadline convergence** — in all three cases, both models agreed at T-24h and T-1h, demonstrating that unambiguous pre-event states produce reliable consensus.
2. **Post-deadline divergence** — mismatch occurred only at T+1h when real-world information was genuinely ambiguous, validating that the 50/50 split triggers appropriately rather than forcing a brittle false consensus.
3. **Deterministic replay** — all 54 executions (18 base scenarios, each repeated 3 times) were independently replayed from stored packages with identical results.
4. **Confidence as divergence signal** — the distributional gap between match and mismatch confidence scores (Section 11.6) validates the two-model committee design: genuine ambiguity manifests as measurable inter-model disagreement rather than silent bias.


## 12  Related Work

**Oracle-based resolution.** Early prediction markets relied on single designated oracles or multisig committees for settlement. These approaches are well-understood but introduce single points of failure, latency, and trust assumptions that scale poorly with market volume.

**Optimistic oracle systems.** UMA's Data Verification Mechanism (DVM) introduced token-weighted dispute resolution, where token holders vote directly on contested outcomes. While economically elegant, this design exposes the final outcome bit to whale manipulation and vote-buying — precisely the attack surface IGR eliminates by relocating governance upstream.

**AI-assisted adjudication.** Recent work has explored using large language models for contract interpretation and dispute resolution. However, most proposals treat AI as a black-box replacement for human judges without addressing the governance question of *who configures the AI*. IGR contributes a structural answer: governance controls inputs, not outputs.

**Verifiable off-chain compute.** Chainlink's CRE and similar platforms (e.g., TEE-based execution environments) enable cryptographically attested off-chain computation. IGR leverages this infrastructure to guarantee that the settlement pipeline executes exactly as specified, bridging the gap between off-chain AI inference and on-chain finality.

**Input governance vs. output governance.** The distinction between governing *inputs* versus *outputs* has antecedents in mechanism design and institutional economics. Hurwicz's foundational work on mechanism design (Nobel Prize, 2007) established that constraining the *message space* available to agents can yield superior outcomes compared to auditing their decisions post-hoc. Ostrom's institutional analysis framework similarly emphasizes that rules governing *action situations* (input constraints) produce more predictable collective outcomes than rules governing results directly. In the AI alignment literature, Christiano et al. (2017) and Irving et al. (2018) explored debate-based oversight where the governance focus shifts from evaluating outputs to structuring the input process that produces them. IGR applies this principle concretely to automated market resolution: token holders govern the adjudication configuration space, not the verdict output space.

### 12.1  Comparative Summary

| Property | Multisig Oracle | UMA DVM | Single-Model Automation | IGR |
|----------|:-:|:-:|:-:|:-:|
| **Resolution latency** | Hours to days | 48h+ (dispute window) | Seconds | Seconds (match) to hours (rerun) |
| **Human intervention required** | Always | On dispute | Never | Never |
| **Outcome vote manipulation** | Council capture | Whale / vote-buying | N/A (no vote) | N/A (no outcome vote) |
| **Governance attack surface** | Council selection | Token-weighted outcome bit | None (no governance) | Constrained input configuration |
| **Deterministic termination** | No | No (escalation possible) | Yes | Yes (bounded 8-call total, 4 settlement-relevant) |
| **Auditability** | Low (off-chain deliberation) | Medium (on-chain votes) | Low (opaque model) | High (hash-chained inputs + outputs) |
| **Failure mode** | Deadlock / inaction | Costly disputes | Silent wrong answer | 50/50 split (safe default) |


## 13  Threat Model

| Threat | Attack Vector | Mitigation | Residual Risk |
|--------|--------------|------------|---------------|
| **Prompt injection** | Evidence text overrides adjudicator instructions | Rule Lock (highest priority) + Schema Lock on output | Reduced but non-zero model susceptibility |
| **Source poisoning** | Low-quality or fabricated optional sources | Oracle Lock (feeds non-removable) + hash/timestamp validation | Collusive source voting remains possible |
| **Governance cartel** | Token concentration steers model/source selection | Mandatory sources + settlement locks + frozen config + quorum threshold | Attacker must exceed quorum and still cannot bypass protocol locks |
| **Model drift** | Vendor updates alter model behavior | Model ID/version pinning + package/output hash recording | Third-party reproducibility may degrade over time |
| **API / schema failure** | Malformed model outputs | Deterministic retry once + mismatch fallback | Frequent failures may increase split settlement rate |
| **Oracle manipulation** | Chainlink feed returns stale or manipulated data | Decentralized oracle network + round ID / timestamp validation | Systemic oracle failure is out of scope |
| **Model collusion** | Two models from same vendor share systematic bias | Cross-vendor pair requirement; Oracle Lock and Rule Lock constrain output | Same-vendor pairs may produce correlated errors |
| **API provider manipulation** | Vendor censors, delays, or alters model responses for specific markets | Cross-vendor requirement (two independent providers); response hash committed on-chain; Schema Lock rejects non-conforming outputs | A single compromised vendor can force a mismatch (triggering split) but cannot unilaterally determine the outcome |
| **API provider collusion** | Both vendors coordinate to produce identical false verdicts | Oracle Lock ensures external evidence is present; Rule Lock constrains reasoning to canonical rules; on-chain hash trail enables post-hoc detection | If both vendors collude and the false verdict is consistent with rule text and oracle data, detection requires external audit |
| **Replay divergence** | Non-deterministic model inference | Hash-pinned packages + version-locked model endpoints | Probabilistic models may vary across identical inputs |


## 14  Why Exactly Two Models

A two-model committee is a deliberate minimum viable design:

- **Bounded latency and cost** — production settlement pipelines require predictable execution time and API spend.
- **Unambiguous mismatch semantics** — with exactly two models, disagreement is binary (match or mismatch) with no ambiguous majority thresholds.
- **Operational clarity** — governance participants and auditors can reason about two-model outcomes without combinatorial complexity.

The protocol extends naturally to 3-of-*N* committees. The two-model baseline provides the simplest deterministic form with the lowest orchestration overhead while preserving the core governance separation thesis.

### 14.1  Quantitative Comparison: 2-Model vs. 3-Model

| Dimension | 2-Model Committee | 3-Model Committee |
|-----------|:-:|:-:|
| **API calls per resolution** (no retry, no rerun) | 2 | 3 |
| **Max API calls** (retry + rerun) | 8 | 12 |
| **Mean latency** (parallel inference) | 3.4s | 3.4s (parallel) to 6.8s (sequential fallback) |
| **Per-resolution API cost** (estimated) | ~$0.03 | ~$0.05 |
| **Mismatch semantics** | Binary: agree or disagree | Ternary: unanimous, majority, or three-way split |
| **Governance complexity** | Select 2 models | Select 3 models + define majority threshold |
| **Split trigger condition** | Any disagreement | Configurable: 2-of-3 majority or unanimous required |
| **Audit complexity** | 2 outputs to verify | 3 outputs + majority logic to verify |

The 2-model design was chosen because the marginal accuracy gain from a third model does not justify the added governance complexity and ambiguous majority semantics in a minimum viable protocol. The 3-model extension is documented as a future direction (Section 17.1) with specific compatibility notes: the branch executor would require a configurable quorum parameter, and the governance surface would expand to include committee size selection.


## 15  Trade-off Analysis

IGR optimizes for **deterministic closure under constrained automation**.

| Dimension | Characteristic |
|-----------|---------------|
| **Strength** | No ambiguous end states; no hidden discretionary override paths; full hash-chain auditability. |
| **Cost** | Persistent semantic disagreement resolves to 50/50 rather than forcing brittle binary certainty. |

This is a deliberate design choice: when automated adjudicators cannot converge under locked rules, a neutral split is strictly safer than opaque unilateral finalization. The empirical validation (Section 11.7) demonstrates that this split triggers only in genuinely ambiguous post-event scenarios.

### 15.1  Economic Justification of the 50/50 Split

The fixed 50/50 split ratio is not arbitrary — it is the ratio that eliminates directional manipulation incentives under persistent disagreement within the IGR trust model.

**Why not confidence-weighted splits?** A natural alternative is to split proportionally to each model's confidence score (e.g., 70/30 if model A reports 0.85 YES and model B reports 0.55 NO). This introduces a new attack surface: a governance cartel that controls the model pair selection can choose models known to produce systematically higher confidence on one side, steering the split ratio without ever needing to override the verdict itself. The 50/50 rule makes the split outcome independent of model selection, neutralizing this vector entirely.

**Game-theoretic properties.** Under a 50/50 split and the assumption that governance participants cannot predict which direction a model will favor before execution:

- Neither YES nor NO token holders gain an expected advantage from forcing a mismatch.
- An attacker who manipulates governance to cause persistent disagreement receives exactly the same payoff as non-intervention (minus governance costs).
- Under these conditions, the split approximates a Nash equilibrium in the subgame where both sides have exhausted their legitimate evidence: no unilateral deviation by either side improves expected payoff.

This argument is informal and context-dependent. In markets where one side has strong prior information about model behavior, 50/50 may not be equilibrium-preserving. A formal game-theoretic analysis under varying information asymmetry conditions is identified as future work.

**Empirical calibration.** In the validation dataset (Section 11), the split rate was 22.2% (4/18 runs). All split-triggering runs occurred at the post-deadline checkpoint where genuine semantic ambiguity existed. A confidence-weighted alternative would have produced asymmetric payouts in these cases despite the ambiguity being symmetric — rewarding whichever vendor's model happened to express higher numerical confidence, an artifact of calibration differences rather than substantive evidence.


## 16  Limitations and Scope Boundaries

This work demonstrates a production-oriented protocol architecture, but the current implementation remains a constrained reference deployment. The following limitations are explicit design or resource boundaries, not overlooked gaps.

1. **Evaluation scale** — empirical validation uses three dispute patterns with limited temporal sampling. Results support feasibility, not universal performance claims. Case selection criteria are documented in Section 11.1.
2. **Model provider centralization** — current adjudication depends on vendor-hosted APIs. Cross-vendor pairing reduces unilateral risk but does not eliminate provider-layer dependencies. A single compromised vendor can force a mismatch (triggering split) but cannot unilaterally dictate the outcome.
3. **Evidence quality governance** — optional source curation can still be influenced by coordinated voting blocs, even under lock constraints. The Oracle Lock guarantees a baseline of Chainlink-sourced evidence, but voted sources remain a governable attack surface.
4. **Calibration heterogeneity** — model confidence values are not calibrated across vendors, which is why confidence is excluded from settlement logic. Using confidence in branching would introduce a vendor-dependent variable into what is otherwise a vendor-agnostic decision pipeline.
5. **Policy conservatism** — persistent disagreement terminates in neutral split. This prioritizes safety over directional precision in ambiguous markets.
6. **Rule Lock enforcement** — prompt-position priority is an empirical property of current LLMs, not a formal guarantee. The Schema Lock provides a structural fallback, but adversarial prompt injection against future model architectures remains a residual risk.
7. **Stochastic model inference** — the settlement *branching logic* is deterministic, but the model inference calls that produce the inputs to that logic are stochastic. Identical input packages may produce different verdicts across independent runs if the model's sampling parameters change. Version pinning and hash recording mitigate but do not eliminate this boundary.


## 17  Future Directions

1. **Committee expansion** — from 2-model to 3-of-*N* with bounded complexity growth and configurable quorum thresholds (see Section 14.1 for quantitative comparison).
2. **Source reputation markets** — staking and slashing dynamics for evidence providers, creating economic incentives for high-quality source curation.
3. **Formal verification** — machine-checked proofs of branch completeness and lock invariant preservation using TLA+ or similar specification languages.
4. **Cross-market calibration** — optimizing split-rate vs. latency across policy profile parameters using historical resolution data.
5. **Decentralized model hosting** — removing dependence on centralized AI API providers through federated inference or on-chain model commitments.
6. **Multi-chain deployment** — extending `IgrRegistry` across multiple chains and L2 networks for reduced gas costs and broader accessibility.
7. **Formal game-theoretic analysis** — rigorous proof of the 50/50 split equilibrium properties under varying information asymmetry conditions (see Section 15.1).

## 18  Governance Migration Plan (MVP to ERC-20Votes)

The reference `GovernanceRegistry` intentionally uses unit-weight voting to isolate protocol mechanics. Production deployment follows a staged migration to ERC-20Votes.

| Phase | Governance Mode | Key Controls |
|------:|------------------|--------------|
| **P0 (current)** | Unit-weight voting | Proposal/vote/lock lifecycle validation |
| **P1** | ERC-20Votes + delegation | Snapshot block, quorum fraction, voting period |
| **P2** | ERC-20Votes + timelock | Execution delay, queued proposal cancellation |
| **P3** | Full governance hardening | Dynamic quorum bounds, veto guardian sunset, audit-gated upgrades |

### 18.1  Migration Invariants

Across all phases, the following invariants remain unchanged:

- Governance can modify only the three input surfaces (model pair, optional sources, advisory prompts).
- Rule Lock, Oracle Lock, Schema Lock, Domain Lock, and Policy Lock remain non-governable.
- Locked market configuration remains immutable after `lockForMarket()`.

### 18.2  Minimal Production Parameters

Recommended initial production parameters:

- **Proposal threshold**: 1.0% of voting supply
- **Quorum**: 10.0% of voting supply
- **Voting period**: 48 hours
- **Execution delay**: 24 hours
- **Emergency pause scope**: workflow trigger suspension only (no retroactive settlement changes)

## 19  CRE Simulation Reproducibility Protocol

Independent verification requires a reproducibility artifact bundle from CRE workflow simulation. The following protocol defines the required artifacts, procedure, and success criteria.

### 19.1  Required Artifacts

1. `simulate.log` — raw CLI execution output
2. `input-package.json` — canonical package used in run
3. `model-output-a.json`, `model-output-b.json` — raw model responses
4. `decision.json` — branch decision payload written on-chain
5. `hashes.txt` — package hash, output hashes, decision hash

### 19.2  Canonical Procedure

```bash
cd cre
~/.cre/bin/cre whoami
~/.cre/bin/cre workflow validate igr-settlement
~/.cre/bin/cre workflow simulate igr-settlement --config igr-settlement/config.staging.json
```

Simulation is considered successful only when all three checks pass:

- workflow execution completes without capability error
- produced `decisionHash` matches local recomputation from `decision.json`
- `IgrRegistry`-compatible report payload is emitted and decodable

### 19.3  Reporting Template

| Field | Example |
|------|---------|
| Simulation run id | `sim-2026-03-02-001` |
| Workflow commit | `<git-sha>` |
| Mean execution latency | `<seconds>` |
| Branch result | `FINAL_MATCH` or `FINAL_MISMATCH` |
| Decision hash verified | `yes/no` |
| Forwarder payload decodable | `yes/no` |

## Appendix A — Settlement Pseudocode

```
function resolve(package, policy):
    MAX_RETRIES ← 1                              // per model, per phase

    // Phase 1: Initial adjudication (2 model calls)
    A ← run(model_A, package)
    B ← run(model_B, package)

    // Schema validation with bounded retry (up to 1 retry each = 2 additional calls max)
    if not valid_schema(A):
        A ← retry(model_A, package, attempt=1)   // final attempt
    if not valid_schema(B):
        B ← retry(model_B, package, attempt=1)   // final attempt

    // Dual failure: both models invalid after retry → forced split
    if not valid(A) and not valid(B):
        return settle(50/50)                      // FINAL_MISMATCH (dual failure)

    if valid(A) and valid(B) and A.verdict = B.verdict:
        return settle(A.verdict)                  // FINAL_MATCH

    if policy = SPLIT_IMMEDIATE:
        return settle(50/50)                      // FINAL_MISMATCH

    // Phase 2: Rerun (policy = RERUN_ONCE_THEN_SPLIT)
    // This phase executes at most once — no further reruns.
    wait(policy.rerun_delay_hours)
    package' ← refresh(package)                   // updated oracle data
    A' ← run(model_A, package')                   // rerun call 1
    B' ← run(model_B, package')                   // rerun call 2

    if not valid_schema(A'):
        A' ← retry(model_A, package', attempt=1) // final attempt
    if not valid_schema(B'):
        B' ← retry(model_B, package', attempt=1) // final attempt

    if not valid(A') and not valid(B'):
        return settle(50/50)                      // FINAL_MISMATCH (dual failure, rerun)

    if valid(A') and valid(B') and A'.verdict = B'.verdict:
        return settle(A'.verdict)                 // FINAL_MATCH (rerun recovered)
    else:
        return settle(50/50)                      // FINAL_MISMATCH (persistent disagreement)

    // Maximum model API calls on any path:
    //   Phase 1: 2 calls + 2 retries = 4
    //   Phase 2: 2 calls + 2 retries = 4
    //   Total upper bound: 8 calls (4 settlement-relevant)
```


## Appendix B — Glossary

| Term | Definition |
|------|-----------|
| **Adjudicator** | An AI model tasked with producing a binary verdict from a canonical input package. |
| **Branch code** | A deterministic label identifying the settlement path taken (e.g., `FINAL_MATCH`). |
| **Canonical input package** | The frozen, hashed artifact containing all inputs consumed by adjudicators. |
| **Governance surface** | A configurable parameter that token holders may vote on. |
| **Oracle Lock** | Protocol invariant ensuring Chainlink data feeds are always included in the input package. |
| **Protocol lock** | An immutable constraint that governance cannot modify. |
| **Rule Lock** | Protocol invariant ensuring canonical market rule text has highest priority. |
| **Schema Lock** | Protocol invariant ensuring model outputs conform to a strict JSON schema. |
| **Split** | A 50/50 settlement applied when adjudicators cannot reach consensus. |
| **CRE** | Chainlink Runtime Environment — a verifiable off-chain compute platform for decentralized workflow execution. |


## Appendix C — CRE Workflow Definition

The following illustrates the IGR settlement workflow using CRE SDK types. The workflow is compiled to WebAssembly and executed by the Workflow DON.

```
import { cre, Runner, type Runtime }
  from "@chainlink/cre-sdk";

type IgrConfig = {
  marketContract: string;
  governanceRegistry: string;
  priceFeed: string;
  igrRegistry: string;
  chainId: number;
};

const log = new cre.capabilities.LogCapability();
const evmRead = new cre.capabilities.EvmReadCapability();
const http = new cre.capabilities.HttpCapability();
const evmWrite = new cre.capabilities.EvmWriteCapability();

const settlementTrigger = log.trigger({
  contractAddress: "${config.marketContract}",
  eventSignature:
    "SettlementRequested(uint256,string)",
});

const onSettlement = async (runtime: Runtime<IgrConfig>) => {
  const { marketId, question } = runtime.triggerEvent;

  // Stage 1: Data Ingestion (EVM Read)
  const market = await evmRead.call({
    contract: runtime.config.marketContract,
    method: "getMarket(uint256)",
    args: [marketId],
  });
  const govConfig = await evmRead.call({
    contract: runtime.config.governanceRegistry,
    method: "getLockedConfig(uint256)",
    args: [marketId],
  });
  const feed = await evmRead.call({
    contract: runtime.config.priceFeed,
    method: "latestRoundData()",
    args: [],
  });

  // Stage 2: Package Compilation (in-workflow)
  const pkg = compileCanonicalPackage(market, govConfig, feed);
  const pkgHash = sha256(canonicalSerialize(pkg));

  // Stage 3: Dual-Model Adjudication (HTTP)
  const [respA, respB] = await Promise.all([
    http.call({ url: govConfig.modelA.endpoint, body: pkg }),
    http.call({ url: govConfig.modelB.endpoint, body: pkg }),
  ]);

  // Stage 4–5: Validate + Branch (in-workflow)
  const verdictA = validateOrRetry(respA, pkg, govConfig.modelA);
  const verdictB = validateOrRetry(respB, pkg, govConfig.modelB);
  const settlement = executeBranch(
    verdictA, verdictB, govConfig.policy
  );

  // Stage 6: On-Chain Recording (EVM Write via KeystoneForwarder)
  const reportPayload = abiEncode(
    ["string", "string", "string", "string", "bytes32"],
    [
      marketId.toString(),
      JSON.stringify(settlement),
      settlement.branchCode,
      settlement.reasonCodes.join(","),
      pkgHash,
    ]
  );
  await evmWrite.call({
    contract: runtime.config.igrRegistry,
    method: "onReport(bytes,bytes)",
    args: [runtime.metadata, reportPayload],
  });
};

const initWorkflow = (config: IgrConfig) => {
  return [cre.handler(settlementTrigger, onSettlement)];
};

export async function main() {
  const runner = await Runner.newRunner<IgrConfig>();
  await runner.run(initWorkflow);
}
```

The workflow uses three CRE capabilities: **EVM Read** (Stage 1), **HTTP** (Stage 3), and **EVM Write** (Stage 6). All other stages execute as pure deterministic logic within the WASM binary.


## Appendix D — Formal Termination Argument

The IGR settlement pipeline can be modeled as a finite state machine with the following states:

$S = \{$`INIT`, `ADJUDICATE`, `VALIDATE`, `RETRY`, `BRANCH`, `RERUN_WAIT`, `RERUN_ADJUDICATE`, `RERUN_VALIDATE`, `RERUN_RETRY`, `RERUN_BRANCH`, `TERMINAL`$\}$

**Transitions.** From each non-terminal state, exactly one transition fires based on deterministic conditions (schema validity, verdict match, policy type). No transition leads back to a previously visited state except `VALIDATE` $\rightarrow$ `RETRY` $\rightarrow$ `VALIDATE`, which executes at most once per model per phase (enforced by a retry counter).

**Claim: all paths reach** `TERMINAL` **in bounded steps.**

*Proof sketch.* Enumerate the longest path:

1. `INIT` $\rightarrow$ `ADJUDICATE` (2 model calls)
2. `ADJUDICATE` $\rightarrow$ `VALIDATE` $\rightarrow$ `RETRY` $\rightarrow$ `VALIDATE` (at most 1 retry per model = 2 additional calls)
3. `VALIDATE` $\rightarrow$ `BRANCH`
4. If mismatch and policy = `rerun_once_then_split`:
   - `BRANCH` $\rightarrow$ `RERUN_WAIT` $\rightarrow$ `RERUN_ADJUDICATE` (2 calls) $\rightarrow$ `RERUN_VALIDATE` $\rightarrow$ `RERUN_RETRY` $\rightarrow$ `RERUN_VALIDATE` (2 retries) $\rightarrow$ `RERUN_BRANCH` $\rightarrow$ `TERMINAL`
5. All other branches reach `TERMINAL` directly from `BRANCH`.

The maximum model API calls on any path is **8** (2 initial + 2 retries + 2 rerun + 2 rerun retries). The maximum *settlement-relevant* calls is **4** (2 initial + 2 rerun), as retries reproduce the same call with identical inputs. No cycle exists because the retry counter is monotonically consumed and the rerun phase executes at most once.

**Liveness.** Every non-terminal state has at least one outgoing transition. The dual-failure fallback (both models invalid after retry) forces `TERMINAL` via `split_immediate`, ensuring no deadlock state exists.

**Settlement determinism.** Given identical `package_hash` and model responses, the state machine produces identical `(branch_code, outcome)` pairs. All branching conditions are pure functions of schema validity and verdict equality — no randomness or external state is consulted during branch execution.


*© 2026. This document is released under the MIT License.*
