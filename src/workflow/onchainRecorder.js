import { ethers } from "ethers";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ABI_PATH = path.join(__dirname, "../../contracts/IgrRegistry.abi.json");

/**
 * Record a resolution decision on-chain via IgrRegistry.onReport(metadata, report).
 *
 * Env:
 * - PRIVATE_KEY
 * - IGR_REGISTRY_ADDRESS (preferred) or REGISTRY_ADDRESS (legacy)
 * - RECORDER_RPC_URL or RPC_URL
 *
 * Optional:
 * - FORWARDER_ADDRESS (for reporting metadata only; tx sender must be authorizedForwarder in contract)
 * - REPORT_METADATA_HEX (default: 0x)
 */
export async function recordOnChain({ eventId, decision, finalState, reasonCodes, decisionHash }) {
  const privateKey = process.env.PRIVATE_KEY;
  const registryAddress = process.env.IGR_REGISTRY_ADDRESS || process.env.REGISTRY_ADDRESS;
  const rpcUrl = process.env.RECORDER_RPC_URL || process.env.RPC_URL;
  const forwarderAddress = process.env.FORWARDER_ADDRESS || null;
  const requireAuthorizedForwarder = process.env.REQUIRE_AUTHORIZED_FORWARDER === "1";

  if (!privateKey || !registryAddress || !rpcUrl) {
    return {
      status: "skipped",
      reason: "on-chain recording skipped: missing PRIVATE_KEY / IGR_REGISTRY_ADDRESS / RPC_URL"
    };
  }

  try {
    const abi = JSON.parse(await readFile(ABI_PATH, "utf-8"));
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(registryAddress, abi, wallet);

    if (requireAuthorizedForwarder) {
      const authorizedForwarder = await contract.authorizedForwarder();
      if (!authorizedForwarder || wallet.address.toLowerCase() !== String(authorizedForwarder).toLowerCase()) {
        return {
          status: "error",
          error: `REQUIRE_AUTHORIZED_FORWARDER: signer ${wallet.address} is not authorizedForwarder ${authorizedForwarder}`,
        };
      }
    }

    const hashBytes = normalizeBytes32(decisionHash);
    const reasonString = Array.isArray(reasonCodes) ? reasonCodes.join(",") : String(reasonCodes ?? "");

    // report payload expected by IgrRegistry.onReport:
    // abi.encode(string eventId, string decision, string finalState, string reasonCodes, bytes32 decisionHash)
    const reportPayload = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "string", "bytes32"],
      [eventId, decision, finalState, reasonString, hashBytes]
    );

    const metadata = process.env.REPORT_METADATA_HEX || "0x";
    const tx = await contract.onReport(metadata, reportPayload);
    const receipt = await tx.wait();

    return {
      status: "recorded",
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      method: "onReport",
      forwarder: forwarderAddress,
      sender: wallet.address
    };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

function normalizeBytes32(value) {
  if (typeof value !== "string" || value.length === 0) {
    return "0x" + "0".repeat(64);
  }

  if (value.startsWith("0x")) {
    if (value.length === 66) return value;
    const hex = value.slice(2).padEnd(64, "0").slice(0, 64);
    return "0x" + hex;
  }

  return "0x" + value.padEnd(64, "0").slice(0, 64);
}
