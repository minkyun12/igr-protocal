import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { fetchChainlinkPrice } from "../evidence/chainlinkFeed.js";
import { recordOnChain } from "./onchainRecorder.js";

const exec = promisify(execCb);

/**
 * CRE adapter abstraction.
 * - mode=sim: local simulated orchestration
 * - mode=real: reads Chainlink Price Feed + records on-chain via IgrRegistry
 */
export async function runCreWorkflow({ mode = process.env.CRE_MODE || "sim", payload }) {
  if (mode === "sim") {
    return {
      mode: "sim",
      status: "ok",
      workflow_id: `sim-${Date.now()}`,
      detail: "Simulated CRE orchestration executed locally",
      payload_echo: payload
    };
  }

  if (mode === "real") {
    const results = { mode: "real", status: "ok", workflow_id: `real-${Date.now()}` };

    // 1. Read Chainlink Price Feed
    try {
      results.chainlink_read = await fetchChainlinkPrice();
    } catch (err) {
      results.chainlink_read = { error: err.message };
    }

    // 2. Record on-chain
    try {
      results.onchain_record = await recordOnChain({
        eventId: payload.event_id,
        decision: payload.decision,
        finalState: payload.final_state,
        reasonCodes: payload.reasons,
        decisionHash: payload.decision_hash || "0x" + "0".repeat(64)
      });
    } catch (err) {
      results.onchain_record = { status: "error", error: err.message };
    }

    return results;
  }

  // Legacy: external command mode
  const cmd = process.env.CRE_EXEC_COMMAND;
  if (!cmd) {
    return { mode: "real", status: "error", error: "CRE_EXEC_COMMAND is not configured" };
  }

  try {
    const { stdout, stderr } = await exec(cmd, { env: process.env });
    return { mode: "real", status: "ok", workflow_id: `real-${Date.now()}`, stdout, stderr };
  } catch (err) {
    return { mode: "real", status: "error", error: String(err?.message || err) };
  }
}
