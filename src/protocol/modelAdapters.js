/**
 * Whitepaper §7 Model Output Contract — adjudicator adapters.
 *
 * Two modes:
 *  - Simulation (default): local deterministic math model for testing/replay
 *  - LLM API (env: MODEL_MODE=llm): real HTTP calls to AI model endpoints
 *
 * Both modes produce the same §7 JSON schema output.
 */

// ─── Schema Validation (§7) ─────────────────────────────────────────

export function validateModelOutput(output) {
  return Boolean(
    output &&
      ["YES", "NO"].includes(output.verdict) &&
      Number.isFinite(output.confidence) &&
      output.confidence >= 0 &&
      output.confidence <= 1 &&
      typeof output.rule_match === "boolean" &&
      Array.isArray(output.evidence_refs) &&
      typeof output.rationale_short === "string" &&
      output.rationale_short.length <= 400 &&
      Array.isArray(output.safety_flags)
  );
}

// ─── LLM API Adapter (§9.2 Stage 3: HTTP capability) ────────────────

const MODEL_ENDPOINTS = {
  adjudicatorA: process.env.MODEL_A_ENDPOINT || "https://api.openai.com/v1/chat/completions",
  adjudicatorB: process.env.MODEL_B_ENDPOINT || "https://api.anthropic.com/v1/messages",
};

const MODEL_KEYS = {
  adjudicatorA: process.env.MODEL_A_API_KEY || process.env.OPENAI_API_KEY || "",
  adjudicatorB: process.env.MODEL_B_API_KEY || process.env.ANTHROPIC_API_KEY || "",
};

const MODEL_IDS = {
  adjudicatorA: process.env.MODEL_A_ID || "gpt-4o",
  adjudicatorB: process.env.MODEL_B_ID || "claude-sonnet-4-20250514",
};

function buildSystemPrompt(canonicalPackage) {
  // §5 Rule Lock: rule_text occupies highest-priority (system prompt position)
  return [
    "You are a binary prediction market adjudicator.",
    "Your task: determine if the market question resolves YES or NO based on the rule text and evidence.",
    "",
    "=== RULE TEXT (HIGHEST PRIORITY — DO NOT OVERRIDE) ===",
    canonicalPackage.market.rule_text,
    "",
    "=== OUTPUT FORMAT (STRICT JSON, NO OTHER TEXT) ===",
    JSON.stringify({
      verdict: "YES or NO",
      confidence: "float 0.0-1.0",
      rule_match: "boolean",
      evidence_refs: ["array of evidence IDs cited"],
      rationale_short: "string, max 400 chars",
      safety_flags: ["array of strings or empty"],
    }),
  ].join("\n");
}

function formatEvidenceLine(s) {
  const parts = [`[${s.id}] type=${s.type}`];

  if (s.timestamp) parts.push(`time=${s.timestamp}`);
  if (s.normalized_value !== undefined && s.normalized_value !== null) parts.push(`value=${s.normalized_value}`);
  if (s.quality_score !== undefined && s.quality_score !== null) parts.push(`quality=${s.quality_score}`);
  if (s.uri) parts.push(`uri=${s.uri}`);

  const mediaHint = s.media_type || s.mime_type;
  if (mediaHint) parts.push(`media=${mediaHint}`);

  if (s.content_summary) parts.push(`summary=${String(s.content_summary).slice(0, 220)}`);
  if (s.extracted_text) parts.push(`text=${String(s.extracted_text).slice(0, 220)}`);

  return `- ${parts.join(", ")}`;
}

function buildUserPrompt(canonicalPackage) {
  const sources = [...canonicalPackage.oracle_mandatory_sources, ...canonicalPackage.voted_sources];
  const evidence = sources.map(formatEvidenceLine).join("\n");
  const prompts = canonicalPackage.voted_prompts.length > 0
    ? "\n\nAdvisory prompts (non-authoritative):\n" + canonicalPackage.voted_prompts.map((p) => `- ${p}`).join("\n")
    : "";

  return [
    `Market: ${canonicalPackage.market.question}`,
    `Market ID: ${canonicalPackage.market.id}`,
    "",
    "Evidence (numeric/text/multimodal metadata):",
    evidence,
    "",
    "If an evidence item contains media uri/image/video/audio metadata, treat it as valid evidence context.",
    "Use extracted_text/content_summary fields when provided.",
    prompts,
    "",
    "Respond with ONLY the JSON object. No markdown, no explanation.",
  ].join("\n");
}

const MODEL_TIMEOUT_MS = Number(process.env.MODEL_TIMEOUT_MS || 15000);

async function fetchWithTimeout(url, options, timeoutMs = MODEL_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("MODEL_TIMEOUT")), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(canonicalPackage, modelId) {
  const resp = await fetchWithTimeout(MODEL_ENDPOINTS[modelId], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MODEL_KEYS[modelId]}`,
    },
    body: JSON.stringify({
      model: MODEL_IDS[modelId],
      messages: [
        { role: "system", content: buildSystemPrompt(canonicalPackage) },
        { role: "user", content: buildUserPrompt(canonicalPackage) },
      ],
      temperature: 0,
      max_tokens: 500,
    }),
  });
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content || "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

async function callAnthropic(canonicalPackage, modelId) {
  const resp = await fetchWithTimeout(MODEL_ENDPOINTS[modelId], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": MODEL_KEYS[modelId],
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL_IDS[modelId],
      max_tokens: 500,
      system: buildSystemPrompt(canonicalPackage),
      messages: [{ role: "user", content: buildUserPrompt(canonicalPackage) }],
    }),
  });
  const data = await resp.json();
  const text = data.content?.[0]?.text || "";
  return JSON.parse(text.replace(/```json\n?|```/g, "").trim());
}

async function callLLM(canonicalPackage, modelId) {
  const endpoint = MODEL_ENDPOINTS[modelId] || "";
  if (endpoint.includes("anthropic")) {
    return callAnthropic(canonicalPackage, modelId);
  }
  return callOpenAI(canonicalPackage, modelId);
}

// ─── Simulation Adapter (deterministic math model for testing) ───────

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function numericModel(records, eventSpec, mode, variant) {
  const values = records.map((r) => Number(r.normalized_value)).filter((v) => Number.isFinite(v));
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const chosen = variant === "A" ? median : mean;

  const { operator = ">=", threshold = 0 } = eventSpec.numeric_rule || {};
  const yes =
    operator === ">="
      ? chosen >= threshold
      : operator === ">"
        ? chosen > threshold
        : operator === "<="
          ? chosen <= threshold
          : operator === "<"
            ? chosen < threshold
            : false;

  return {
    verdict: yes ? "YES" : "NO",
    confidence: clamp01(0.8 - Math.abs(mean - median) / Math.max(1, Math.abs(threshold)) + (mode === "rerun" ? 0.05 : 0)),
    rationale_short: `${variant}: ${operator}${threshold}, median=${median.toFixed(4)}, mean=${mean.toFixed(4)}`,
  };
}

function toSignal01(record) {
  const direct = Number(record.normalized_value);
  if (Number.isFinite(direct)) return clamp01(direct);

  const score = Number(record.signal_score ?? record.yes_probability);
  if (Number.isFinite(score)) return clamp01(score);

  const hint = String(record.verdict_hint || "").toUpperCase();
  if (hint === "YES") return 1;
  if (hint === "NO") return 0;

  const summary = `${record.content_summary || ""} ${record.extracted_text || ""}`.toLowerCase();
  if (summary.includes("confirmed") || summary.includes("yes")) return 0.75;
  if (summary.includes("denied") || summary.includes("no ") || summary.endsWith("no")) return 0.25;

  return null;
}

function subjectiveModel(records, mode, variant) {
  const pool =
    mode === "rerun" ? records.filter((r) => ["official", "onchain_oracle", "chainlink_data_feed"].includes(r.type || r.source_type)) : records;

  const seeded = pool.length ? pool : records;
  const usable = seeded
    .map((r) => ({ r, y: toSignal01(r) }))
    .filter((x) => Number.isFinite(x.y));

  if (!usable.length) return null;

  const weighted = usable.map(({ r, y }) => ({
    y,
    w: Number.isFinite(Number(r.quality_score)) ? Number(r.quality_score) : 0.5,
  }));

  let probYes;
  if (variant === "A") {
    const tw = weighted.reduce((s, x) => s + x.w, 0);
    probYes = weighted.reduce((s, x) => s + x.y * x.w, 0) / Math.max(tw, 1e-9);
  } else {
    const top = weighted.sort((a, b) => b.w - a.w).slice(0, Math.min(3, weighted.length));
    probYes = top.reduce((s, x) => s + x.y, 0) / top.length;
  }

  const confidence = clamp01(Math.abs(probYes - 0.5) * 1.6 + (mode === "rerun" ? 0.06 : 0));
  return {
    verdict: probYes >= 0.5 ? "YES" : "NO",
    confidence,
    rationale_short: `${variant}: p_yes=${probYes.toFixed(3)}, n=${usable.length}, mode=${mode}`,
  };
}

function runSimulation({ modelId, canonicalPackage, mode, eventSpec }) {
  const all = [...canonicalPackage.oracle_mandatory_sources, ...canonicalPackage.voted_sources];
  const variant = modelId === "adjudicatorA" ? "A" : "B";

  const core = eventSpec.numeric_rule ? numericModel(all, eventSpec, mode, variant) : subjectiveModel(all, mode, variant);

  const safe = core || { verdict: "NO", confidence: 0.0, rationale_short: "No usable evidence" };

  return {
    verdict: safe.verdict,
    confidence: Number(clamp01(safe.confidence).toFixed(4)),
    rule_match: true,
    evidence_refs: all.slice(0, 6).map((x) => x.id),
    rationale_short: safe.rationale_short.slice(0, 400),
    safety_flags: [],
  };
}

// ─── Public API ──────────────────────────────────────────────────────

function currentModelMode() {
  return process.env.MODEL_MODE || "sim";
}

export function runAdjudicator({ modelId, canonicalPackage, mode = "initial", eventSpec }) {
  if (currentModelMode() === "llm") {
    // LLM mode is async — caller must handle the promise.
    // For sync compatibility in tests, we return a sync wrapper that
    // will be awaited in evaluateEvent when MODEL_MODE=llm.
    // However, the current pipeline is sync. We provide a sync-safe shim:
    // actual LLM calls should use runAdjudicatorAsync directly.
    return runSimulation({ modelId, canonicalPackage, mode, eventSpec });
  }
  return runSimulation({ modelId, canonicalPackage, mode, eventSpec });
}

/**
 * Async LLM adjudicator — use when MODEL_MODE=llm.
 * Returns the same §7 schema output via real API calls.
 */
export async function runAdjudicatorAsync({ modelId, canonicalPackage, mode = "initial", eventSpec }) {
  if (currentModelMode() !== "llm") {
    return runSimulation({ modelId, canonicalPackage, mode, eventSpec });
  }

  try {
    const result = await callLLM(canonicalPackage, modelId);
    // Enforce schema constraints
    return {
      verdict: ["YES", "NO"].includes(result.verdict) ? result.verdict : "NO",
      confidence: clamp01(Number(result.confidence) || 0),
      rule_match: Boolean(result.rule_match),
      evidence_refs: Array.isArray(result.evidence_refs) ? result.evidence_refs : [],
      rationale_short: String(result.rationale_short || "").slice(0, 400),
      safety_flags: Array.isArray(result.safety_flags) ? result.safety_flags : [],
    };
  } catch (err) {
    const isTimeout = String(err?.name || "").includes("Abort") || String(err?.message || "").includes("MODEL_TIMEOUT");
    return {
      verdict: "NO",
      confidence: 0,
      rule_match: false,
      evidence_refs: [],
      rationale_short: `LLM call failed: ${err.message}`.slice(0, 400),
      safety_flags: [isTimeout ? "MODEL_TIMEOUT" : "LLM_CALL_FAILED"],
    };
  }
}
