import { sha256Hex } from "../utils/hash.js";
import { compileCanonicalPackage } from "../protocol/compilePackage.js";
import { runAdjudicator, runAdjudicatorAsync, validateModelOutput } from "../protocol/modelAdapters.js";
import { settleDeterministically } from "../protocol/settle.js";
import { fetchChainlinkPrice } from "../evidence/chainlinkFeed.js";
import { loadGovernancePolicy } from "./governanceConfig.js";

/**
 * Whitepaper §8, §7.1 — full pipeline execution.
 *
 * Phase 1: initial adjudication (2 calls + up to 2 retries)
 * Phase 2: rerun (only if mismatch + rerun_once_then_split)
 * Max 8 API calls total, 4 settlement-relevant.
 */

const USE_LLM = (process.env.MODEL_MODE || "sim") === "llm";

async function runWithSingleRetry({ modelId, canonicalPackage, eventSpec, mode }) {
  const call = async () => {
    if (USE_LLM) {
      return runAdjudicatorAsync({ modelId, canonicalPackage, eventSpec, mode });
    }
    return runAdjudicator({ modelId, canonicalPackage, eventSpec, mode });
  };

  const first = await call();
  if (validateModelOutput(first)) return { output: first, retried: false };

  const retry = await call();
  if (validateModelOutput(retry)) return { output: retry, retried: true };

  // §7.1: Persistent schema failure → synthetic fallback
  return {
    output: {
      verdict: "NO",
      confidence: 0,
      rule_match: false,
      evidence_refs: [],
      rationale_short: "Persistent schema failure fallback",
      safety_flags: ["SCHEMA_PERSISTENT_FAILURE"],
    },
    retried: true,
  };
}

function isDualFailure(outputA, outputB) {
  const hasFlag = (o) => o.safety_flags && o.safety_flags.includes("SCHEMA_PERSISTENT_FAILURE");
  return hasFlag(outputA) && hasFlag(outputB);
}

const ENABLE_CHAINLINK_FETCH = process.env.ENABLE_CHAINLINK_FETCH === "1";

async function getRerunChainlinkFeed() {
  if (!ENABLE_CHAINLINK_FETCH) return null;
  try {
    const live = await fetchChainlinkPrice();
    if (live && live.price != null) return live;
  } catch {
    // no-op fallback
  }
  return null;
}

export async function evaluateEvent({ eventSpec, evidenceRecords, policy, chainlinkFeed }) {
  const startedAt = Date.now();

  const governanceResolved = await loadGovernancePolicy(eventSpec, policy);
  const effectivePolicy = governanceResolved.policy;

  const initialFeed = chainlinkFeed || (await getRerunChainlinkFeed());

  const { canonical, packageHash } = compileCanonicalPackage({
    eventSpec,
    evidenceRecords,
    policy: effectivePolicy,
    chainlinkFeed: initialFeed,
  });
  const [modelA, modelB] = canonical.models;

  // Phase 1: Initial adjudication
  const firstA = await runWithSingleRetry({ modelId: modelA, canonicalPackage: canonical, eventSpec, mode: "initial" });
  const firstB = await runWithSingleRetry({ modelId: modelB, canonicalPackage: canonical, eventSpec, mode: "initial" });

  const firstRun = {
    policy: canonical.mismatch_policy,
    outputs: [firstA.output, firstB.output],
  };

  // Phase 2: Rerun — only if mismatch AND policy is rerun_once_then_split AND not dual failure
  let rerun = { outputs: [firstA.output, firstB.output], package_hash: null }; // default: echo first run (won't be used)
  const needsRerun =
    canonical.mismatch_policy === "rerun_once_then_split" &&
    firstA.output.verdict !== firstB.output.verdict &&
    !isDualFailure(firstA.output, firstB.output);

  if (needsRerun) {
    const rerunTime = new Date(
      new Date(canonical.package_created_at).getTime() + canonical.rerun_delay_hours * 60 * 60 * 1000
    ).toISOString();

    const rerunEventSpec = {
      ...eventSpec,
      evaluation_time: rerunTime,
    };

    const refreshedFeed = (await getRerunChainlinkFeed()) || chainlinkFeed || null;
    const rerunCompiled = compileCanonicalPackage({
      eventSpec: rerunEventSpec,
      evidenceRecords,
      policy: effectivePolicy,
      chainlinkFeed: refreshedFeed,
    });

    const rerunA = await runWithSingleRetry({ modelId: modelA, canonicalPackage: rerunCompiled.canonical, eventSpec: rerunEventSpec, mode: "rerun" });
    const rerunB = await runWithSingleRetry({ modelId: modelB, canonicalPackage: rerunCompiled.canonical, eventSpec: rerunEventSpec, mode: "rerun" });
    rerun = { outputs: [rerunA.output, rerunB.output], package_hash: rerunCompiled.packageHash };
  }

  const settlement = settleDeterministically({ firstRun, rerun });

  const finishedAt = Date.now();

  const audit = {
    package_hash: packageHash,
    rerun_package_hash: needsRerun ? rerun.package_hash : null,
    policy_hash: sha256Hex({ mismatch_policy: canonical.mismatch_policy, rerun_delay_hours: canonical.rerun_delay_hours }),
    model_pair_hash: sha256Hex(canonical.models),
    model_output_hashes: {
      first_run: [sha256Hex(firstA.output), sha256Hex(firstB.output)],
      rerun: needsRerun ? [sha256Hex(rerun.outputs[0]), sha256Hex(rerun.outputs[1])] : null,
    },
    decision_hash: sha256Hex({ settlement, firstRun, rerun: needsRerun ? rerun : null }),
  };

  return {
    run_id: `${eventSpec.event_id}-${new Date().toISOString()}`,
    protocol: "input-governed-resolution",
    policy_source: governanceResolved.source,
    event_spec: eventSpec,
    canonical_input_package: canonical,
    model_outputs: {
      first_run: {
        [modelA]: firstA.output,
        [modelB]: firstB.output,
        retries: { [modelA]: firstA.retried, [modelB]: firstB.retried },
      },
      rerun: needsRerun
        ? {
            [modelA]: rerun.outputs[0],
            [modelB]: rerun.outputs[1],
          }
        : null,
    },
    settlement,
    policy_evaluation: {
      final_state: settlement.branch_code,
      final_settlement: settlement.final_settlement,
      reason_codes: [settlement.reason_code, "DETERMINISTIC_BRANCH_EXECUTED"],
    },
    audit,
    started_at: new Date(startedAt).toISOString(),
    finished_at: new Date(finishedAt).toISOString(),
    latency_ms: finishedAt - startedAt,
    human_summary: `branch=${settlement.branch_code}, reason=${settlement.reason_code}, settlement=${settlement.final_settlement}`,
  };
}
