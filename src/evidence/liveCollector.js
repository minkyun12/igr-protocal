import { fetchChainlinkPrice } from "./chainlinkFeed.js";
import { randomUUID } from "node:crypto";

// Chainlink ETH/USD feed — we use it as a cross-reference for BTC dominance context
const ETH_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; // ETH/USD on mainnet

async function fetchCoinGeckoPrice() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { price: data.bitcoin.usd, source: "coingecko" };
  } catch (err) {
    return { price: null, error: err.message, source: "coingecko" };
  }
}

async function fetchBinancePrice() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { price: Number(data.price), source: "binance" };
  } catch (err) {
    return { price: null, error: err.message, source: "binance" };
  }
}

async function fetchCoinbasePrice() {
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { price: Number(data.data.amount), source: "coinbase" };
  } catch (err) {
    return { price: null, error: err.message, source: "coinbase" };
  }
}

/**
 * Collect live evidence from multiple on-chain + off-chain sources.
 * Returns EvidenceRecord[] matching evidence.schema.json.
 *
 * Sources:
 *   1. Chainlink BTC/USD Price Feed (on-chain, Ethereum mainnet)
 *   2. Binance BTC/USDT spot (off-chain, CEX)
 *   3. Coinbase BTC-USD spot (off-chain, CEX)
 *   4. CoinGecko BTC/USD aggregated (off-chain, aggregator)
 */
export async function collectLiveEvidence(eventId = "live") {
  const now = new Date().toISOString();
  const [chainlink, binance, coinbase, coingecko] = await Promise.all([
    fetchChainlinkPrice(),
    fetchBinancePrice(),
    fetchCoinbasePrice(),
    fetchCoinGeckoPrice()
  ]);

  const records = [];

  if (chainlink.price != null) {
    records.push({
      evidence_id: `cl-${randomUUID().slice(0, 8)}`,
      event_id: eventId,
      source_id: "chainlink-btc-usd",
      source_type: "onchain_oracle",
      timestamp: chainlink.updatedAt || now,
      normalized_value: chainlink.price,
      raw_value: chainlink,
      quality_score: 0.95
    });
  }

  if (binance.price != null) {
    records.push({
      evidence_id: `bn-${randomUUID().slice(0, 8)}`,
      event_id: eventId,
      source_id: "binance-btc-usdt",
      source_type: "cex_spot",
      timestamp: now,
      normalized_value: binance.price,
      raw_value: binance,
      quality_score: 0.90
    });
  }

  if (coinbase.price != null) {
    records.push({
      evidence_id: `cb-${randomUUID().slice(0, 8)}`,
      event_id: eventId,
      source_id: "coinbase-btc-usd",
      source_type: "cex_spot",
      timestamp: now,
      normalized_value: coinbase.price,
      raw_value: coinbase,
      quality_score: 0.90
    });
  }

  if (coingecko.price != null) {
    records.push({
      evidence_id: `cg-${randomUUID().slice(0, 8)}`,
      event_id: eventId,
      source_id: "coingecko-btc-usd",
      source_type: "aggregator",
      timestamp: now,
      normalized_value: coingecko.price,
      raw_value: coingecko,
      quality_score: 0.80
    });
  }

  return records;
}
