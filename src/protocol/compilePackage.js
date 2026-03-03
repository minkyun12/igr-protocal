import { sha256Hex } from "../utils/hash.js";

/**
 * Whitepaper §6 Canonical Input Package compiler.
 *
 * §6.1 Requirements:
 *  - Deterministic key ordering (handled by sha256Hex → stableSerialize)
 *  - Sources ordered by `id`
 *  - Explicit provenance fields (hash, timestamp, type)
 *  - Chainlink feed auto-included (Oracle Lock §5)
 */

// Oracle Lock source types — always mandatory regardless of governance votes
const ORACLE_MANDATORY_TYPES = new Set(["official", "onchain_oracle", "chainlink_data_feed"]);

function normalizeSource(record) {
  return {
    id: record.evidence_id || record.id,
    source_id: record.source_id,
    type: record.source_type || record.type,
    timestamp: record.timestamp,
    uri: record.uri || null,
    hash: sha256Hex({
      source_id: record.source_id,
      raw_value: record.raw_value,
      normalized_value: record.normalized_value,
      timestamp: record.timestamp,
    }),
    normalized_value: record.normalized_value,
    quality_score: record.quality_score ?? null,
    raw_value: record.raw_value ?? null,
  };
}

function normalizePrompts(votedPrompts) {
  const prompts = Array.isArray(votedPrompts) ? votedPrompts : [];

  const normalized = prompts
    .map((p, idx) => {
      if (typeof p === "string") {
        return { text: p, timestamp: null, idx };
      }
      if (p && typeof p === "object") {
        return {
          text: String(p.text ?? p.prompt ?? ""),
          timestamp: p.timestamp ?? p.submitted_at ?? null,
          idx,
        };
      }
      return { text: String(p ?? ""), timestamp: null, idx };
    })
    .filter((p) => p.text.length > 0);

  normalized.sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : NaN;
    const tb = b.timestamp ? Date.parse(b.timestamp) : NaN;
    const aHasTs = Number.isFinite(ta);
    const bHasTs = Number.isFinite(tb);

    if (aHasTs && bHasTs && ta !== tb) return ta - tb;
    if (aHasTs !== bHasTs) return aHasTs ? -1 : 1;

    if (a.text !== b.text) return a.text.localeCompare(b.text);
    return a.idx - b.idx;
  });

  return normalized.map((p) => p.text);
}

export function compileCanonicalPackage({ eventSpec, evidenceRecords, policy, chainlinkFeed }) {
  const normalized = evidenceRecords.map(normalizeSource);

  // §6.1: Sources ordered by id
  normalized.sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));

  // §5 Oracle Lock: auto-include oracle-mandatory sources
  const mandatory = normalized.filter((s) => ORACLE_MANDATORY_TYPES.has(s.type));
  const voted = normalized.filter((s) => !ORACLE_MANDATORY_TYPES.has(s.type));

  // If a live Chainlink feed was provided, inject it into mandatory sources
  if (chainlinkFeed && chainlinkFeed.price != null) {
    const feedSource = {
      id: "chainlink-feed-live",
      source_id: "chainlink-price-feed",
      type: "chainlink_data_feed",
      timestamp: chainlinkFeed.updatedAt || new Date().toISOString(),
      uri: null,
      hash: sha256Hex({
        source_id: "chainlink-price-feed",
        raw_value: chainlinkFeed.price,
        normalized_value: chainlinkFeed.price,
        timestamp: chainlinkFeed.updatedAt,
      }),
      normalized_value: chainlinkFeed.price,
      quality_score: 1.0,
      raw_value: chainlinkFeed.price,
      round_id: chainlinkFeed.roundId || null,
    };
    // Avoid duplicate if already present
    if (!mandatory.some((s) => s.source_id === "chainlink-price-feed")) {
      mandatory.push(feedSource);
    }
  }

  const canonical = {
    market: {
      id: eventSpec.market_id,
      question: eventSpec.question,
      rule_text: eventSpec.rule_text,
    },
    oracle_mandatory_sources: mandatory,
    voted_sources: voted,
    voted_prompts: normalizePrompts(policy.voted_prompts),
    models: policy.models || ["adjudicatorA", "adjudicatorB"],
    mismatch_policy: policy.mismatch_policy || "split_immediate",
    rerun_delay_hours: policy.rerun_delay_hours ?? 12,
    config_version: "v2",
    package_created_at: eventSpec.evaluation_time || new Date().toISOString(),
  };

  const packageHash = sha256Hex(canonical);
  return { canonical, packageHash };
}
