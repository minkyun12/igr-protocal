#!/usr/bin/env node
import path from "node:path";
import { replayCase } from "../workflow/replayCase.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((v) => {
    const [k, ...rest] = v.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  })
);

const defaultCase = "simulation/input/replay/case-bitcoin-up-or-down-march-8-5am-et";
const caseDir = args.case ? path.resolve(args.case) : path.resolve(defaultCase);
const policyPath = args.policy
  ? path.resolve(args.policy)
  : path.resolve(path.join(defaultCase, "policy.assumption.json"));
const outputDir = args.out ? path.resolve(args.out) : path.resolve("simulation/output/reports/case-bitcoin-up-or-down-march-8-5am-et");
const checkpoint = typeof args.checkpoint === "string" ? args.checkpoint : undefined;

const results = await replayCase({ caseDir, policyPath, outputDir, checkpoint });
console.log(JSON.stringify({ ok: true, caseDir, policyPath, results }, null, 2));
