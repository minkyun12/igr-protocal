import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const SRC_PATH = new URL("../contracts/GovernanceRegistry.sol", import.meta.url);

async function src() {
  return fs.readFile(SRC_PATH, "utf8");
}

test("GovernanceRegistry Config includes locked settlement profile fields", async () => {
  const s = await src();
  assert.match(s, /string\s+mismatchPolicy\s*;/, "missing mismatchPolicy field");
  assert.match(s, /uint256\s+rerunDelayHours\s*;/, "missing rerunDelayHours field");
});

test("GovernanceRegistry propose validates mismatchPolicy enum", async () => {
  const s = await src();
  assert.match(s, /empty mismatch policy/, "missing empty mismatch policy guard");
  assert.match(s, /invalid mismatch policy/, "missing mismatch policy enum guard");
  assert.match(s, /split_immediate/, "split_immediate enum value missing");
  assert.match(s, /rerun_once_then_split/, "rerun_once_then_split enum value missing");
});

test("GovernanceRegistry lockForMarket persists settlement profile fields", async () => {
  const s = await src();
  assert.match(s, /stored\.mismatchPolicy\s*=\s*p\.config\.mismatchPolicy\s*;/, "mismatchPolicy not persisted on lock");
  assert.match(s, /stored\.rerunDelayHours\s*=\s*p\.config\.rerunDelayHours\s*;/, "rerunDelayHours not persisted on lock");
});
