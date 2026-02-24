import { ethers } from "ethers";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ABI_PATH = path.join(__dirname, "../../contracts/PoreRegistry.abi.json");

/**
 * Record a resolution decision on-chain via PoreRegistry.
 * Requires env: PRIVATE_KEY, REGISTRY_ADDRESS, RPC_URL (or RECORDER_RPC_URL).
 * Returns { status, txHash } or { status: "skipped", reason }.
 */
export async function recordOnChain({ eventId, decision, finalState, reasonCodes, decisionHash }) {
  const privateKey = process.env.PRIVATE_KEY;
  const registryAddress = process.env.REGISTRY_ADDRESS;
  const rpcUrl = process.env.RECORDER_RPC_URL || process.env.RPC_URL;

  if (!privateKey || !registryAddress || !rpcUrl) {
    return { status: "skipped", reason: "on-chain recording skipped: no wallet configured" };
  }

  try {
    const abi = JSON.parse(await readFile(ABI_PATH, "utf-8"));
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(registryAddress, abi, wallet);

    const hashBytes = decisionHash.startsWith("0x")
      ? decisionHash
      : "0x" + decisionHash.padEnd(64, "0");

    const tx = await contract.record(
      eventId,
      decision,
      finalState,
      Array.isArray(reasonCodes) ? reasonCodes.join(",") : String(reasonCodes),
      hashBytes
    );
    const receipt = await tx.wait();
    return { status: "recorded", txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}
