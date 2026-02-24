#!/usr/bin/env node
import path from "node:path";
import { buildReplayPackage } from "../workflow/buildReplayPackage.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((v) => {
    const [k, ...rest] = v.replace(/^--/, "").split("=");
    return [k, rest.join("=") || true];
  })
);

const reportsDir = args.reports ? path.resolve(args.reports) : path.resolve("artifacts/reports");
const outDir = args.out ? path.resolve(args.out) : path.resolve("artifacts/replay-package");

const summary = await buildReplayPackage({ reportsDir, outputDir: outDir });
console.log(JSON.stringify({ ok: true, reportsDir, outDir, packageHash: summary.package_hash, reportCount: summary.report_count }, null, 2));
