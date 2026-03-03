import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";

type IgrConfig = {
  marketContract: string;
  governanceRegistry: string;
  priceFeed: string;
  igrRegistry: string;
  chainId: number;
  simulationSafe?: boolean;
};

const logCap = new cre.capabilities.LogCapability();
const cronCap = new cre.capabilities.CronCapability();
const evmRead = new cre.capabilities.EvmReadCapability();
const http = new cre.capabilities.HttpCapability();
const evmWrite = new cre.capabilities.EvmWriteCapability();

function buildSettlementTrigger(config: IgrConfig) {
  if (config.simulationSafe) {
    return cronCap.trigger({ schedule: "*/5 * * * *" });
  }

  return logCap.trigger({
    contractAddress: config.marketContract,
    eventSignature: "SettlementRequested(uint256,string)",
  });
}

const onSettlementRequested = async (runtime: Runtime<IgrConfig>) => {
  // Simulation-safe mode returns heartbeat payload only.
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
  const marketId = event?.marketId ?? event?.args?.[0];

  // Stage 1: EVM Read (market + governance + chainlink)
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

  // Stage 2/3: model adjudication via HTTP (simplified payload envelope)
  const payload = {
    market,
    governance: govConfig,
    chainlink: feed,
    timestamp: new Date().toISOString(),
  };

  const [respA, respB] = await Promise.all([
    http.call({ url: govConfig.modelPair?.[0], method: "POST", body: payload }),
    http.call({ url: govConfig.modelPair?.[1], method: "POST", body: payload }),
  ]);

  // Stage 4/5 simplified deterministic branch (YES/NO only)
  const verdictA = respA?.verdict === "YES" ? "YES" : "NO";
  const verdictB = respB?.verdict === "YES" ? "YES" : "NO";
  const finalState = verdictA === verdictB ? "FINAL_MATCH" : "FINAL_MISMATCH";
  const finalSettlement = verdictA === verdictB ? verdictA : "SPLIT_50_50";

  // Stage 6: EVM Write (simulation-safe ABI path)
  // Uses record(...) for deterministic scaffold runs; production can switch to onReport(bytes,bytes)
  // once report ABI encoding is wired in this workflow package.
  const decision = JSON.stringify({ marketId, finalState, finalSettlement, verdictA, verdictB, ts: Date.now() });
  const decisionHash = "0x" + "0".repeat(64);

  await evmWrite.call({
    contract: runtime.config.igrRegistry,
    method: "record(string,string,string,string,bytes32)",
    args: [String(marketId), decision, finalState, "CRE_WORKFLOW", decisionHash],
  });

  return {
    marketId,
    finalState,
    finalSettlement,
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
