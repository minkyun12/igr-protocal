import test from "node:test";
import assert from "node:assert/strict";
import { loadGovernancePolicy } from "../src/workflow/governanceConfig.js";

test("loadGovernancePolicy falls back to local policy when env/market id missing", async () => {
  const fallback = { models: ["adjudicatorA", "adjudicatorB"], voted_prompts: ["x"] };
  const res = await loadGovernancePolicy({ market_id: "pm-1" }, fallback);
  assert.equal(res.source, "local-fallback");
  assert.deepEqual(res.policy.models, fallback.models);
});
