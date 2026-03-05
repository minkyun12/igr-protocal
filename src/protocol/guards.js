function detectVendor(modelId, policy) {
  if (typeof modelId !== "string" || modelId.length === 0) return null;

  if (modelId.includes("/")) return modelId.split("/")[0].toLowerCase();

  const map = policy?.model_vendors;
  if (map && typeof map === "object" && !Array.isArray(map)) {
    const mapped = map[modelId];
    if (typeof mapped === "string" && mapped.length > 0) return mapped.toLowerCase();
  }

  // Alias defaults for local sim profile
  if (modelId === "adjudicatorA") return "vendor-a";
  if (modelId === "adjudicatorB") return "vendor-b";

  return modelId.toLowerCase();
}

export function validateCanonicalGuards({ canonical, policy }) {
  if (!canonical || !Array.isArray(canonical.models) || canonical.models.length !== 2) {
    throw new Error("POLICY_VIOLATION_MODEL_PAIR: exactly two models are required");
  }

  const requireCrossVendor = policy?.require_cross_vendor !== false;
  if (requireCrossVendor) {
    const [a, b] = canonical.models;
    const vendorA = detectVendor(a, policy);
    const vendorB = detectVendor(b, policy);
    if (!vendorA || !vendorB || vendorA === vendorB) {
      throw new Error(`POLICY_VIOLATION_CROSS_VENDOR: model vendors must differ (${vendorA || "unknown"} vs ${vendorB || "unknown"})`);
    }
  }

  const requireOracleMandatory = policy?.require_oracle_mandatory !== false;
  if (requireOracleMandatory) {
    const mandatory = Array.isArray(canonical.oracle_mandatory_sources)
      ? canonical.oracle_mandatory_sources
      : [];

    const hasChainlinkClass = mandatory.some((s) => s?.type === "chainlink_data_feed");
    if (!hasChainlinkClass) {
      throw new Error("POLICY_VIOLATION_ORACLE_LOCK: at least one chainlink_data_feed mandatory source is required");
    }
  }
}
