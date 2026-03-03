#!/usr/bin/env node
import path from "node:path";
import { readJson, writeJson } from "../utils/io.js";
import { evaluateEvent } from "../workflow/evaluateEvent.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((v) => {
    const [k, ...rest] = v.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  })
);

const eventPath = args.event ? path.resolve(args.event) : null;
const evidencePath = args.evidence ? path.resolve(args.evidence) : null;
const policyPath = args.policy ? path.resolve(args.policy) : path.resolve("configs/policy.json");
const outPath = args.out ? path.resolve(args.out) : path.resolve("simulation/output/reports/single-eval.report.json");

if (!eventPath || !evidencePath) {
  console.error("Usage: npm run evaluate -- --event=<event.json> --evidence=<evidence.json> [--policy=...] [--out=...]");
  process.exit(1);
}

const eventSpec = await readJson(eventPath);
const evidenceRecords = await readJson(evidencePath);
const policy = await readJson(policyPath);

const report = await evaluateEvent({ eventSpec, evidenceRecords, policy });
await writeJson(outPath, report);

console.log(JSON.stringify({ ok: true, outPath, branch: report.settlement.branch_code, settlement: report.settlement.final_settlement }, null, 2));
