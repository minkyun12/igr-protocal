import test from "node:test";
import assert from "node:assert/strict";
import { AbiCoder } from "ethers";

test("CRE report payload ABI encoding matches IgrRegistry.onReport decode contract", () => {
  const abi = AbiCoder.defaultAbiCoder();

  const eventId = "42";
  const decision = JSON.stringify({
    marketId: "42",
    finalState: "FINAL_MATCH",
    finalSettlement: "YES",
    verdictA: "YES",
    verdictB: "YES",
    ts: 1700000000000,
  });
  const finalState = "FINAL_MATCH";
  const reasonCodes = "CRE_WORKFLOW";
  const decisionHash = "0x" + "ab".repeat(32);

  const reportPayload = abi.encode(
    ["string", "string", "string", "string", "bytes32"],
    [eventId, decision, finalState, reasonCodes, decisionHash]
  );

  const decoded = abi.decode(
    ["string", "string", "string", "string", "bytes32"],
    reportPayload
  );

  assert.equal(decoded[0], eventId);
  assert.equal(decoded[1], decision);
  assert.equal(decoded[2], finalState);
  assert.equal(decoded[3], reasonCodes);
  assert.equal(decoded[4], decisionHash);
});

test("Invalid report payload fails ABI decode", () => {
  const abi = AbiCoder.defaultAbiCoder();
  const badPayload = "0x1234";

  assert.throws(() => {
    abi.decode(["string", "string", "string", "string", "bytes32"], badPayload);
  });
});
