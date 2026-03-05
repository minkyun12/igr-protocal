export function updateTrustStrip(el, c) {
  if (!c) return;
  const hasPolicyHash = Boolean(c.audit?.policy_hash);
  const hasOracle = (c.evidence || []).some((e) => String(e.source_id || "").toLowerCase().includes("chainlink") || String(e.source_type || "").includes("oracle"));
  const mode = c.policy_evaluation?.rerun_execution_mode || "simulation_fast";
  const freshness = c.event_spec?.evaluation_time ? new Date(c.event_spec.evaluation_time).toISOString().slice(0,16).replace("T"," ")+"Z" : "--";

  if (el.trustLock) {
    el.trustLock.textContent = `LOCK: ${hasPolicyHash ? "CONFIG HASHED" : "UNVERIFIED"}`;
    el.trustLock.className = `state-pill ${hasPolicyHash ? "match" : "mismatch"}`;
  }
  if (el.trustOracle) {
    el.trustOracle.textContent = `ORACLE: ${hasOracle ? "INCLUDED" : "MISSING"}`;
    el.trustOracle.className = `state-pill ${hasOracle ? "match" : "mismatch"}`;
  }
  if (el.trustRerunMode) {
    el.trustRerunMode.textContent = `RERUN: ${mode.toUpperCase()}`;
    el.trustRerunMode.className = `state-pill ${mode === "realtime" ? "mismatch" : "match"}`;
  }
  if (el.trustFreshness) {
    el.trustFreshness.textContent = `FRESHNESS: ${freshness}`;
  }
}
