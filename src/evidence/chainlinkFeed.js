import { ethers } from "ethers";

const AGGREGATOR_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

const DEFAULT_FEED = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
const DEFAULT_RPCS = ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"];

export async function fetchChainlinkPrice(feedAddress = DEFAULT_FEED, rpcUrl) {
  const rpcs = rpcUrl ? [rpcUrl] : DEFAULT_RPCS;

  for (const url of rpcs) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      const contract = new ethers.Contract(feedAddress, AGGREGATOR_ABI, provider);
      const [roundId, answer, , updatedAt] = await contract.latestRoundData();
      const price = Number(answer) / 1e8;
      return {
        price,
        roundId: roundId.toString(),
        updatedAt: new Date(Number(updatedAt) * 1000).toISOString(),
        source: "chainlink-mainnet"
      };
    } catch (err) {
      // try next RPC
      if (url === rpcs[rpcs.length - 1]) {
        return { price: null, error: `All RPCs failed: ${err.message}`, source: "chainlink-mainnet" };
      }
    }
  }
}
