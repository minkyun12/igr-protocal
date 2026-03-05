import { sha256Hex } from "../utils/hash.js";
import { compileCanonicalPackage } from "../protocol/compilePackage.js";
import { runAdjudicator, runAdjudicatorAsync, validateModelOutput } from "../protocol/modelAdapters.js";
import { settleDeterministically } from "../protocol/settle.js";
import { validateCanonicalGuards } from "../protocol/guards.js";
import { fetchChainlinkPrice } from "../evidence/chainlinkFeed.js";
import { loadGovernancePolicy } from "./governanceConfig.js";

/**
 * Whitepaper §8, §7.1 — full pipeline execution.
 *
 * Phase 1: initial adjudication (2 calls + up to 2 retries)
 * Phase 2: rerun (only if mismatch + rerun_once_then_split)
 * Max 8 API calls total, 4 settlement-relevant.
 */

function useLlmMode() {
  return (process.env.MODEL_MODE || "sim") === "llm";
}

function hasTransportFailureFlag(output) {
  return Boolean(
    output?.safety_flags?.includes("MODEL_TIMEOUT") ||
    output?.safety_flags?.includes("LLM_CALL_FAILED")
  );
}

function toPersistentFailureFallback(reason = "SCHEMA_OR_TIMEOUT_PERSISTENT_FAILURE") {
  return {
    verdict: "NO",
    confidence: 0,
    rule_match: false,
    evidence_refs: [],
    rationale_short: "Persistent schema/timeout failure fallback",
    safety_flags: ["SCHEMA_PERSISTENT_FAILURE", reason],
  };
}

async function runWithSingleRetry({ modelId, canonicalPackage, eventSpec, mode }) {
  const call = async () => {
    if (useLlmMode()) {
      return runAdjudicatorAsync({ modelId, canonicalPackage, eventSpec, mode });
    }
    return runAdjudicator({ modelId, canonicalPackage, eventSpec, mode });
  };

  const first = await call();
  const firstUsable = validateModelOutput(first) && !hasTransportFailureFlag(first);
  if (firstUsable) return { output: first, retried: false, persistent_failure: false };

  const retry = await call();
  const retryUsable = validateModelOutput(retry) && !hasTransportFailureFlag(retry);
  if (retryUsable) return { output: retry, retried: true, persistent_failure: false };

  // §7.1: Persistent invalid schema OR timeout → synthetic NO for branch purposes
  const reason = hasTransportFailureFlag(first) || hasTransportFailureFlag(retry)
    ? "TIMEOUT_OR_TRANSPORT_FAILURE"
    : "SCHEMA_FAILURE";

  return {
    output: toPersistentFailureFallback(reason),
    retried: true,
    persistent_failure: true,
  };
}

function isDualFailure(outputA, outputB) {
  const hasFlag = (o) => o.safety_flags && o.safety_flags.includes("SCHEMA_PERSISTENT_FAILURE");
  return hasFlag(outputA) && hasFlag(outputB);
}

const ENABLE_CHAINLINK_FETCH = process.env.ENABLE_CHAINLINK_FETCH === "1";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  validateCanonicalGuards({ canonical, policy: effectivePolicy });
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

  const rerunExecutionMode = effectivePolicy.rerun_execution_mode || process.env.RERUN_EXECUTION_MODE || "simulation_fast";
  const rerunDelayMs = Math.max(0, Number(canonical.rerun_delay_hours || 0) * 60 * 60 * 1000);

  if (needsRerun) {
    if (rerunExecutionMode === "realtime" && rerunDelayMs > 0) {
      await sleep(rerunDelayMs);
    }

    const rerunTime = new Date(
      new Date(canonical.package_created_at).getTime() + rerunDelayMs
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

    validateCanonicalGuards({ canonical: rerunCompiled.canonical, policy: effectivePolicy });

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
        persistent_failures: { [modelA]: firstA.persistent_failure, [modelB]: firstB.persistent_failure },
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
      rerun_execution_mode: rerunExecutionMode,
    },
    audit,
    started_at: new Date(startedAt).toISOString(),
    finished_at: new Date(finishedAt).toISOString(),
    latency_ms: finishedAt - startedAt,
    human_summary: `branch=${settlement.branch_code}, reason=${settlement.reason_code}, settlement=${settlement.final_settlement}`,
  };
}
