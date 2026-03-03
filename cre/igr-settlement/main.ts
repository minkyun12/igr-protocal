import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";

type IgrConfig = {
  marketContract: string;
  governanceRegistry: string;
  priceFeed: string;
  igrRegistry: string;
  chainId: number;
};

// Local simulation-safe workflow.
// NOTE: We intentionally use only CRE SDK primitives here to avoid host-runtime traps.
const cron = new cre.capabilities.CronCapability();
const simulationTrigger = cron.trigger({ schedule: "*/5 * * * *" });

const onSimulation = async (_runtime: Runtime<IgrConfig>) => {
  return {
    workflow: "igr-settlement",
    mode: "simulation",
    status: "ok",
    timestamp: new Date().toISOString(),
    note: "CRE simulate smoke path is active",
  };
};

const initWorkflow = (_config: IgrConfig) => {
  return [cre.handler(simulationTrigger, onSimulation)];
};

export async function main() {
  const runner = await Runner.newRunner<IgrConfig>();
  await runner.run(initWorkflow);
}

main();
