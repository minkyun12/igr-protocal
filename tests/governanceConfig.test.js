import test from "node:test";
import assert from "node:assert/strict";
import { loadGovernancePolicy } from "../src/workflow/governanceConfig.js";

test("loadGovernancePolicy falls back to local policy when env/market id missing", async () => {
  const prevStrict = process.env.STRICT_GOVERNANCE_LOCK;
  delete process.env.STRICT_GOVERNANCE_LOCK;

  try {
    const fallback = { models: ["adjudicatorA", "adjudicatorB"], voted_prompts: ["x"] };
    const res = await loadGovernancePolicy({ market_id: "pm-1" }, fallback);
    assert.equal(res.source, "local-fallback");
    assert.deepEqual(res.policy.models, fallback.models);
  } finally {
    if (prevStrict === undefined) delete process.env.STRICT_GOVERNANCE_LOCK;
    else process.env.STRICT_GOVERNANCE_LOCK = prevStrict;
  }
});

test("loadGovernancePolicy strict mode throws when lock cannot be loaded", async () => {
  const prevStrict = process.env.STRICT_GOVERNANCE_LOCK;
  const prevRpc = process.env.GOV_RPC_URL;
  const prevRegistry = process.env.GOVERNANCE_REGISTRY_ADDRESS;

  process.env.STRICT_GOVERNANCE_LOCK = "1";
  delete process.env.GOV_RPC_URL;
  delete process.env.GOVERNANCE_REGISTRY_ADDRESS;

  try {
    const fallback = { models: ["adjudicatorA", "adjudicatorB"], voted_prompts: ["x"] };
    await assert.rejects(
      () => loadGovernancePolicy({ market_id: "pm-1" }, fallback),
      /STRICT_GOVERNANCE_LOCK/
    );
  } finally {
    if (prevStrict === undefined) delete process.env.STRICT_GOVERNANCE_LOCK;
    else process.env.STRICT_GOVERNANCE_LOCK = prevStrict;

    if (prevRpc === undefined) delete process.env.GOV_RPC_URL;
    else process.env.GOV_RPC_URL = prevRpc;

    if (prevRegistry === undefined) delete process.env.GOVERNANCE_REGISTRY_ADDRESS;
    else process.env.GOVERNANCE_REGISTRY_ADDRESS = prevRegistry;
  }
});
