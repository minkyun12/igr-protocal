import { ethers } from "ethers";

const GOVERNANCE_ABI = [
  "function getLockedConfig(uint256 marketId) external view returns ((string[2] modelPair,string[] optionalSources,string[] advisoryPrompts,string mismatchPolicy,uint256 rerunDelayHours,bytes32 configHash,bool locked))"
];

function parseMarketId(marketId) {
  if (typeof marketId === "number" && Number.isInteger(marketId) && marketId >= 0) return marketId;
  if (typeof marketId === "string" && /^\d+$/.test(marketId)) return Number(marketId);
  return null;
}

export async function loadGovernancePolicy(eventSpec, fallbackPolicy) {
  const rpcUrl = process.env.GOV_RPC_URL || process.env.RPC_URL || null;
  const governanceAddress = process.env.GOVERNANCE_REGISTRY_ADDRESS || null;
  const numericMarketId = parseMarketId(eventSpec?.market_id);
  const strictGovernanceLock = process.env.STRICT_GOVERNANCE_LOCK === "1";

  if (!rpcUrl || !governanceAddress || numericMarketId == null) {
    if (strictGovernanceLock) {
      throw new Error("STRICT_GOVERNANCE_LOCK: missing governance env or invalid numeric market_id");
    }
    return { policy: fallbackPolicy, source: "local-fallback" };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(governanceAddress, GOVERNANCE_ABI, provider);
    const cfg = await contract.getLockedConfig(numericMarketId);

    const models = Array.isArray(cfg.modelPair) ? cfg.modelPair.filter(Boolean) : [];
    const votedPrompts = Array.isArray(cfg.advisoryPrompts) ? cfg.advisoryPrompts : [];

    const optionalSources = Array.isArray(cfg.optionalSources) ? cfg.optionalSources : [];

    const onchainMismatch = typeof cfg.mismatchPolicy === "string" ? cfg.mismatchPolicy : "";
    const onchainDelay = Number(cfg.rerunDelayHours);

    const merged = {
      ...fallbackPolicy,
      models: models.length === 2 ? models : fallbackPolicy.models,
      voted_prompts: votedPrompts.length ? votedPrompts : fallbackPolicy.voted_prompts,
      optional_sources: optionalSources.length ? optionalSources : fallbackPolicy.optional_sources,
      mismatch_policy:
        onchainMismatch === "split_immediate" || onchainMismatch === "rerun_once_then_split"
          ? onchainMismatch
          : fallbackPolicy.mismatch_policy,
      rerun_delay_hours: Number.isFinite(onchainDelay) ? onchainDelay : fallbackPolicy.rerun_delay_hours,
      governance_config_hash: cfg.configHash || null,
    };

    // locked config is authoritative for settlement policy parameters
    return { policy: merged, source: "onchain-locked-config" };
  } catch (err) {
    if (strictGovernanceLock) {
      throw new Error(`STRICT_GOVERNANCE_LOCK: failed to load onchain locked config (${err.message})`);
    }
    return { policy: fallbackPolicy, source: "local-fallback" };
  }
}
