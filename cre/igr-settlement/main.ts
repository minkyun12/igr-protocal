import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";

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
};

const cronCap = new cre.capabilities.CronCapability();

function simpleHash(input: unknown): string {
  const s = JSON.stringify(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8).slice(0, 64);
}

function hexToBase64(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []);
  return Buffer.from(bytes).toString("base64");
}

function buildSettlementTrigger(config: IgrConfig) {
  if (config.simulationSafe) {
    return cronCap.trigger({ schedule: "*/5 * * * *" });
  }

  const sepoliaSelector = cre.capabilities.EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia"];
  const evm = new cre.capabilities.EVMClient(sepoliaSelector);

  return evm.logTrigger({
    // EVM trigger schema expects bytes values in base64 form.
    addresses: [hexToBase64(config.marketContract)],
    confidence: "CONFIDENCE_LEVEL_FINALIZED",
  });
}

function resolveEndpoint(modelRef: string, runtime: Runtime<IgrConfig>) {
  if (/^https?:\/\//.test(modelRef)) return modelRef;
  if (modelRef === "adjudicatorA" && runtime.config.modelAEndpoint) return runtime.config.modelAEndpoint;
  if (modelRef === "adjudicatorB" && runtime.config.modelBEndpoint) return runtime.config.modelBEndpoint;
  return modelRef;
}

async function callModel(_runtime: Runtime<IgrConfig>, _endpoint: string, _payload: unknown): Promise<ModelOutput> {
  // staging trigger path 검증용: 모델 호출 대신 deterministic mock verdict
  return { verdict: "YES", confidence: 0.8 };
}

function settle(firstA: ModelOutput, firstB: ModelOutput, policy: "split_immediate" | "rerun_once_then_split") {
  if (firstA.verdict === firstB.verdict) {
    return { branch_code: "FINAL_MATCH", reason_code: "MATCH_INITIAL", final_settlement: firstA.verdict, rerun_used: false };
  }
  if (policy === "split_immediate") {
    return { branch_code: "FINAL_MISMATCH", reason_code: "SPLIT_IMMEDIATE", final_settlement: "SPLIT_50_50", rerun_used: false };
  }
  return { branch_code: "FINAL_MISMATCH", reason_code: "RERUN_SPLIT", final_settlement: "SPLIT_50_50", rerun_used: true };
}

const onSettlementRequested = async (runtime: Runtime<IgrConfig>) => {
  if (runtime.config.simulationSafe) {
    return {
      workflow: "igr-settlement",
      mode: "simulation-safe",
      status: "ok",
      chainId: runtime.config.chainId,
      timestamp: new Date().toISOString(),
    };
  }

  const triggerEvent = runtime.triggerEvent as any;
  const marketId = String(triggerEvent?.marketId ?? triggerEvent?.args?.[0] ?? "unknown");

  const payload = {
    marketId,
    triggerEvent,
    ts: new Date().toISOString(),
  };

  const modelRefs = ["adjudicatorA", "adjudicatorB"];
  const [a, b] = await Promise.all([
    callModel(runtime, resolveEndpoint(modelRefs[0], runtime), payload),
    callModel(runtime, resolveEndpoint(modelRefs[1], runtime), payload),
  ]);

  const policy = runtime.config.mismatchPolicy || "split_immediate";
  const settled = settle(a, b, policy);
  const decisionHash = `0x${simpleHash({ marketId, settled, ts: payload.ts })}`;

  return {
    mode: "staging-trigger-check",
    marketId,
    finalState: settled.branch_code,
    finalSettlement: settled.final_settlement,
    reasonCode: settled.reason_code,
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
