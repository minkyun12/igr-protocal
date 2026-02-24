import fs from "node:fs/promises";
import path from "node:path";
import { readJson, writeJson } from "../utils/io.js";
import { sha256Hex } from "../utils/hash.js";

export async function buildReplayPackage({ reportsDir, outputDir }) {
  await fs.mkdir(outputDir, { recursive: true });

  const files = (await fs.readdir(reportsDir)).sort();
  const reportFiles = files.filter((f) => f.endsWith(".report.json"));
  const manifestFiles = files.filter((f) => f.endsWith(".manifest.json"));

  const reports = [];

  for (const fileName of reportFiles) {
    const fullPath = path.join(reportsDir, fileName);
    const report = await readJson(fullPath);
    reports.push({
      file: fileName,
      case_id: report.case_id,
      checkpoint: report.checkpoint,
      final_state: report.policy_evaluation?.final_state,
      reason_codes: report.policy_evaluation?.reason_codes || [],
      decision_hash: report.audit?.decision_hash || null,
      file_hash: sha256Hex(report)
    });
  }

  const state_counts = reports.reduce((acc, r) => {
    acc[r.final_state] = (acc[r.final_state] || 0) + 1;
    return acc;
  }, {});

  const packageSummary = {
    generated_at: new Date().toISOString(),
    reports_dir: reportsDir,
    report_count: reports.length,
    manifest_count: manifestFiles.length,
    state_counts,
    package_hash: sha256Hex(reports.map((r) => ({ file: r.file, file_hash: r.file_hash, decision_hash: r.decision_hash }))),
    reports
  };

  await writeJson(path.join(outputDir, "replay-package.summary.json"), packageSummary);

  const lines = [
    "# Replay Package Summary",
    "",
    `- Generated at: ${packageSummary.generated_at}`,
    `- Reports dir: ${reportsDir}`,
    `- Report count: ${packageSummary.report_count}`,
    `- Manifest count: ${packageSummary.manifest_count}`,
    `- Package hash: ${packageSummary.package_hash}`,
    "",
    "## State counts",
    ...Object.entries(state_counts).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Reports",
    ...reports.map((r) => `- ${r.file} | ${r.final_state} | decision_hash=${r.decision_hash}`)
  ];

  await fs.writeFile(path.join(outputDir, "replay-package.summary.md"), `${lines.join("\n")}\n`);

  return packageSummary;
}
