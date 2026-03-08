# IGR v2 Claim-Evidence Map

This sheet maps whitepaper claims to concrete repository evidence for fast judge verification.

| Whitepaper Claim | Code Location | Test / Command | Evidence Artifact |
|---|---|---|---|
| Deterministic finite settlement branching (no undefined terminal state) | `src/protocol/settle.js`, `src/workflow/evaluateEvent.js` | `npm run test:core` (branch tests in `tests/igr.test.js`) | `simulation/output/reports/*/*.report.json` (`settlement.branch_code`, `reason_code`) |
| Strict schema lock + one-time retry + persistent failure fallback (timeout/transport treated equivalently) | `src/protocol/modelAdapters.js` (`validateModelOutput`, timeout flagging), `src/workflow/evaluateEvent.js` (`runWithSingleRetry`) | `npm run test:core` (`§7` schema tests + `rerunModeAndFailureSemantics.test.js`) | Core test output + report `model_outputs.first_run.retries` / `persistent_failures` fields |
| Governance controls only input surfaces (model pair / optional sources / advisory prompts) | `contracts/GovernanceRegistry.sol`, `src/workflow/governanceConfig.js` | `npm run test:core` (`tests/governanceConfig.test.js`) | On-chain read integration path in `policy_source` + merged policy fields |
| Oracle lock path supports mandatory Chainlink inclusion | `src/protocol/compilePackage.js`, `src/evidence/chainlinkFeed.js` | `npm run test:core` (Oracle lock test) | Reports showing `canonical_input_package.oracle_mandatory_sources` |
| Hash-addressable audit trail (package/policy/model outputs/decision) | `src/workflow/evaluateEvent.js`, `src/utils/hash.js` | `npm run replay`, `npm run replay:package` | `simulation/output/reports/*/*.report.json` (`audit.*`), `simulation/output/replay-package/*` |
| Forwarder-guarded on-chain recorder path | `contracts/IgrRegistry.sol` (`onlyAuthorized`, `onReport`) | `npm run verify:forwarder`, `npm run test:core` (`tests/forwarderGuards.test.js`) | Static verification output: `forwarder-guards:ok` |
| CRE workflow pipeline scaffold (Log/Cron Trigger -> EVM Read -> HTTP x2 -> EVM Write) | `cre/igr-settlement/main.ts`, `cre/igr-settlement/workflow.yaml` | `cd cre && set -a && source ../.env && set +a && MODEL_A_API_KEY="${OPENAI_API_KEY:-dummy}" MODEL_B_API_KEY="${ANTHROPIC_API_KEY:-dummy}" CRE_ETH_PRIVATE_KEY="${PRIVATE_KEY#0x}" ~/.cre/bin/cre workflow simulate ./igr-settlement -T simulation-settings --non-interactive --trigger-index 0` | CLI simulation success output + `simulation/output/cre-sim/*` (if generated in local run) |
| Replay reproducibility package export | `src/workflow/buildReplayPackage.js`, `src/cli/replay-package.js` | `npm run replay:package -- --reports=... --out=...` | `simulation/output/replay-package/*/replay-package.summary.json` |
| Flexible evidence schema (numeric/text/multimodal metadata) | `src/protocol/compilePackage.js`, `src/protocol/modelAdapters.js` | `npm run test:core` (`tests/multimodalEvidence.test.js`) | Canonical package contains `uri/mime_type/extracted_text/content_summary` |
| Oracle-lock and cross-vendor hard guards (policy-level) | `src/protocol/guards.js`, `src/workflow/evaluateEvent.js` | `npm run test:core` (`tests/policyGuards.test.js`) | Guard errors: `POLICY_VIOLATION_ORACLE_LOCK`, `POLICY_VIOLATION_CROSS_VENDOR` |

## Credential-dependent evidence (not included in no-secret run)

- Sepolia deployment and transaction proofs (`SEPOLIA_RPC_URL`, `PRIVATE_KEY` required)
- CRE org-bound validation/deployment (CRE login required)
- External LLM API reproducibility bundle (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` etc. required)
