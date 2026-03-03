import { ethers } from "ethers";

const GOVERNANCE_ABI = [
  "function getLockedConfig(uint256 marketId) external view returns ((string[2] modelPair,string[] optionalSources,string[] advisoryPrompts,bytes32 configHash,bool locked))"
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

  if (!rpcUrl || !governanceAddress || numericMarketId == null) {
    return { policy: fallbackPolicy, source: "local-fallback" };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(governanceAddress, GOVERNANCE_ABI, provider);
    const cfg = await contract.getLockedConfig(numericMarketId);

    const models = Array.isArray(cfg.modelPair) ? cfg.modelPair.filter(Boolean) : [];
    const votedPrompts = Array.isArray(cfg.advisoryPrompts) ? cfg.advisoryPrompts : [];

    const merged = {
      ...fallbackPolicy,
      models: models.length === 2 ? models : fallbackPolicy.models,
      voted_prompts: votedPrompts.length ? votedPrompts : fallbackPolicy.voted_prompts,
      governance_config_hash: cfg.configHash || null,
    };

    return { policy: merged, source: "onchain-locked-config" };
  } catch {
    return { policy: fallbackPolicy, source: "local-fallback" };
  }
}
