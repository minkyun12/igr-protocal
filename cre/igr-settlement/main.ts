import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";
import { createHash } from "node:crypto";
import { AbiCoder } from "ethers";
import { settleDeterministically } from "../../src/protocol/settle.js";
import { compileCanonicalPackage } from "../../src/protocol/compilePackage.js";
import { validateCanonicalGuards } from "../../src/protocol/guards.js";
import { validateModelOutput } from "../../src/protocol/modelAdapters.js";

type IgrConfig = {
  marketContract: string;
  governanceRegistry: string;
  priceFeed: string;
  igrRegistry: string;
  chainId: number;
  modelAEndpoint?: string;
  modelBEndpoint?: string;
  simulationSafe?: boolean;
  mismatchPolicy?: "split_immediate" | "rerun_once_then_split";
  rerunDelayHours?: number;
};

type ModelOutput = {
  verdict: "YES" | "NO";
  confidence: number;
  rule_match: boolean;
  evidence_refs: string[];
  rationale_short: string;
  safety_flags: string[];
};

const logCap = new cre.capabilities.LogCapability();
const cronCap = new cre.capabilities.CronCapability();
const evmRead = new cre.capabilities.EvmReadCapability();
const http = new cre.capabilities.HttpCapability();
const evmWrite = new cre.capabilities.EvmWriteCapability();

const ALLOW_DEBUG_RECORD_FALLBACK = process.env.ALLOW_DEBUG_RECORD_FALLBACK === "1";

function sha256Hex(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function toBytes32(hexNoPrefix: string): string {
  return `0x${hexNoPrefix.padEnd(64, "0").slice(0, 64)}`;
}

function buildSettlementTrigger(config: IgrConfig) {
  if (config.simulationSafe) {
    return cronCap.trigger({ schedule: "*/5 * * * *" });
  }

  return logCap.trigger({
    contractAddress: config.marketContract,
    eventSignature: "SettlementRequested(uint256,string)",
  });
}

function resolveEndpoint(modelRef: string, runtime: Runtime<IgrConfig>) {
  if (/^https?:\/\//.test(modelRef)) return modelRef;
  if (modelRef === "adjudicatorA" && runtime.config.modelAEndpoint) return runtime.config.modelAEndpoint;
  if (modelRef === "adjudicatorB" && runtime.config.modelBEndpoint) return runtime.config.modelBEndpoint;
  return modelRef;
}

function toFailureOutput(reason: string): ModelOutput {
  return {
    verdict: "NO",
    confidence: 0,
    rule_match: false,
    evidence_refs: [],
    rationale_short: "Persistent schema/timeout failure fallback",
    safety_flags: ["SCHEMA_PERSISTENT_FAILURE", reason],
  };
}

function toModelOutput(raw: any): ModelOutput | null {
  const normalized: ModelOutput = {
    verdict: raw?.verdict === "YES" ? "YES" : "NO",
    confidence: Number.isFinite(Number(raw?.confidence)) ? Number(raw.confidence) : 0,
    rule_match: Boolean(raw?.rule_match),
    evidence_refs: Array.isArray(raw?.evidence_refs) ? raw.evidence_refs : [],
    rationale_short: String(raw?.rationale_short || "").slice(0, 400),
    safety_flags: Array.isArray(raw?.safety_flags) ? raw.safety_flags : [],
  };
  return validateModelOutput(normalized) ? normalized : null;
}

async function callModelOnce(endpoint: string, payload: unknown): Promise<ModelOutput | null> {
  try {
    const resp = await http.call({ url: endpoint, method: "POST", body: payload });
    return toModelOutput(resp);
  } catch {
    return null;
  }
}

async function runModelWithSingleRetry(endpoint: string, payload: unknown): Promise<ModelOutput> {
  const first = await callModelOnce(endpoint, payload);
  if (first) return first;

  const retry = await callModelOnce(endpoint, payload);
  if (retry) return retry;

  return toFailureOutput("SCHEMA_OR_TRANSPORT_FAILURE");
}

async function runPair(models: string[], payload: unknown, runtime: Runtime<IgrConfig>) {
  const [a, b] = await Promise.all([
    runModelWithSingleRetry(resolveEndpoint(models[0], runtime), payload),
    runModelWithSingleRetry(resolveEndpoint(models[1], runtime), payload),
  ]);
  return [a, b] as const;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeFromReads(params: {
  marketId: string;
  market: any;
  govConfig: any;
  feed: any;
  runtime: Runtime<IgrConfig>;
  rerun?: boolean;
}) {
  const { marketId, market, govConfig, feed, runtime, rerun } = params;

  const eventSpec = {
    event_id: String(market?.eventId || marketId),
    market_id: String(marketId),
    question: String(market?.question || market?.[1] || ""),
    rule_text: String(market?.ruleText || market?.rule_text || market?.[2] || ""),
    evaluation_time: new Date().toISOString(),
  };

  const answer = Array.isArray(feed) ? Number(feed[1]) : Number(feed?.answer);
  const updatedAtRaw = Array.isArray(feed) ? Number(feed[3]) : Number(feed?.updatedAt);
  const roundIdRaw = Array.isArray(feed) ? feed[0] : feed?.roundId;
  const chainlinkFeed = Number.isFinite(answer)
    ? {
        price: answer / 1e8,
        updatedAt: Number.isFinite(updatedAtRaw) ? new Date(updatedAtRaw * 1000).toISOString() : new Date().toISOString(),
        roundId: roundIdRaw != null ? String(roundIdRaw) : null,
      }
    : null;

  const models = Array.isArray(govConfig?.modelPair) && govConfig.modelPair.length === 2
    ? govConfig.modelPair
    : ["adjudicatorA", "adjudicatorB"];

  const mismatchPolicy =
    govConfig?.mismatchPolicy === "split_immediate" || govConfig?.mismatchPolicy === "rerun_once_then_split"
      ? govConfig.mismatchPolicy
      : (runtime.config.mismatchPolicy || "rerun_once_then_split");

  const rerunDelayHours = Number.isFinite(Number(govConfig?.rerunDelayHours))
    ? Number(govConfig.rerunDelayHours)
    : (runtime.config.rerunDelayHours ?? 12);

  const policy = {
    models,
    voted_prompts: Array.isArray(govConfig?.advisoryPrompts) ? govConfig.advisoryPrompts : [],
    optional_sources: Array.isArray(govConfig?.optionalSources) ? govConfig.optionalSources : [],
    mismatch_policy: mismatchPolicy,
    rerun_delay_hours: rerunDelayHours,
    require_cross_vendor: true,
    require_oracle_mandatory: true,
  };

  const evidenceRecords: any[] = [];

  const compiled = compileCanonicalPackage({
    eventSpec,
    evidenceRecords,
    policy,
    chainlinkFeed,
  });

  validateCanonicalGuards({ canonical: compiled.canonical, policy });

  return {
    eventSpec,
    policy,
    chainlinkFeed,
    compiled,
    payload: {
      canonical_input_package: compiled.canonical,
      package_hash: compiled.packageHash,
      governance_config_hash: govConfig?.configHash || null,
      rerun: Boolean(rerun),
      timestamp: new Date().toISOString(),
    },
  };
}

const onSettlementRequested = async (runtime: Runtime<IgrConfig>) => {
  if (runtime.config.simulationSafe) {
    return {
      workflow: "igr-settlement",
      mode: "simulation-safe",
      status: "ok",
      timestamp: new Date().toISOString(),
      note: "CRE smoke path active",
    };
  }

  const event = runtime.triggerEvent as any;
  const marketId = String(event?.marketId ?? event?.args?.[0]);

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

  const initialCtx = normalizeFromReads({ marketId, market, govConfig, feed, runtime });
  const models = initialCtx.policy.models;

  const [firstA, firstB] = await runPair(models, initialCtx.payload, runtime);
  const firstRun = { policy: initialCtx.compiled.canonical.mismatch_policy, outputs: [firstA, firstB] };

  let rerun = { outputs: [firstA, firstB], packageHash: initialCtx.compiled.packageHash };
  if (initialCtx.compiled.canonical.mismatch_policy === "rerun_once_then_split" && firstA.verdict !== firstB.verdict) {
    const delayMs = Math.max(0, Number(initialCtx.compiled.canonical.rerun_delay_hours || 0) * 60 * 60 * 1000);
    if (delayMs > 0) {
      await sleep(delayMs);
    }

    const rerunCtx = normalizeFromReads({ marketId, market, govConfig, feed, runtime, rerun: true });
    const [rerunA, rerunB] = await runPair(models, rerunCtx.payload, runtime);
    rerun = { outputs: [rerunA, rerunB], packageHash: rerunCtx.compiled.packageHash };
  }

  const settled = settleDeterministically({ firstRun, rerun });
  const finalState = settled.branch_code;
  const finalSettlement = settled.final_settlement;

  const decisionObj = {
    marketId,
    packageHash: initialCtx.compiled.packageHash,
    rerunPackageHash: rerun.packageHash,
    finalState,
    finalSettlement,
    reasonCode: settled.reason_code,
    rerunUsed: settled.rerun_used,
    firstRun: { a: firstA.verdict, b: firstB.verdict },
    rerunRun: { a: rerun.outputs[0].verdict, b: rerun.outputs[1].verdict },
    ts: Date.now(),
  };
  const decision = JSON.stringify(decisionObj);
  const decisionHash = toBytes32(sha256Hex(decisionObj));

  const abi = AbiCoder.defaultAbiCoder();
  const reportPayload = abi.encode(
    ["string", "string", "string", "string", "bytes32"],
    [marketId, decision, finalState, `CRE_WORKFLOW,${settled.reason_code}`, decisionHash]
  );

  try {
    await evmWrite.call({
      contract: runtime.config.igrRegistry,
      method: "onReport(bytes,bytes)",
      args: ["0x", reportPayload],
    });
  } catch (err) {
    if (!ALLOW_DEBUG_RECORD_FALLBACK) {
      throw new Error(`FORWARDER_WRITE_REQUIRED: onReport failed and debug fallback disabled (${String((err as Error)?.message || err)})`);
    }

    await evmWrite.call({
      contract: runtime.config.igrRegistry,
      method: "record(string,string,string,string,bytes32)",
      args: [marketId, decision, finalState, `CRE_WORKFLOW,${settled.reason_code}`, decisionHash],
    });
  }

  return {
    marketId,
    packageHash: initialCtx.compiled.packageHash,
    finalState,
    finalSettlement,
    reasonCode: settled.reason_code,
    rerunUsed: settled.rerun_used,
    decisionHash,
  };
};

const initWorkflow = (config: IgrConfig) => {
  const trigger = buildSettlementTrigger(config);
  return [cre.handler(trigger, onSettlementRequested)];
};

export async function main() {
  const runner = await Runner.newRunner<IgrConfig>();
  await runner.run(initWorkflow);
}

main();
