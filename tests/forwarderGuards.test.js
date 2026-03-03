import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("IgrRegistry forwarder guard checks pass", async () => {
  const { stdout } = await execFileAsync("node", ["scripts/verify-forwarder-guards.mjs"], {
    cwd: process.cwd(),
  });
  assert.match(stdout, /forwarder-guards:ok/);
});
