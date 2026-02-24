import path from "node:path";
import fs from "node:fs/promises";
import { readJson, writeJson } from "../utils/io.js";
import { sha256Hex } from "../utils/hash.js";
import { evaluateEvent } from "./evaluateEvent.js";

export async function replayCase({ caseDir, policyPath, outputDir, checkpoint }) {
  const policy = await readJson(policyPath);
  const eventSpec = await readJson(path.join(caseDir, "event_spec.json"));

  const files = (await fs.readdir(caseDir))
    .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".json"))
    .sort();

  const targetFiles = checkpoint
    ? files.filter((f) => f.includes(checkpoint))
    : files;

  const results = [];

  for (const fileName of targetFiles) {
    const cp = await readJson(path.join(caseDir, fileName));
    const effectiveEvent = {
      ...eventSpec,
      evaluation_time: cp.evaluation_time
    };

    const report = await evaluateEvent({
      eventSpec: effectiveEvent,
      evidenceRecords: cp.evidence_records,
      policy
    });

    report.case_id = path.basename(caseDir);
    report.checkpoint = cp.label;

    const outPath = path.join(outputDir, `${report.case_id}-${cp.label}.report.json`);
    await writeJson(outPath, report);

    results.push({
      checkpoint: cp.label,
      final_state: report.policy_evaluation.final_state,
      decision_hash: report.audit?.decision_hash || null,
      report_path: outPath
    });
  }

  const manifest = {
    case_id: path.basename(caseDir),
    policy_path: policyPath,
    generated_at: new Date().toISOString(),
    checkpoint_count: results.length,
    state_counts: results.reduce((acc, r) => {
      acc[r.final_state] = (acc[r.final_state] || 0) + 1;
      return acc;
    }, {}),
    report_bundle_hash: sha256Hex(results.map((r) => ({ checkpoint: r.checkpoint, final_state: r.final_state, decision_hash: r.decision_hash }))),
    reports: results
  };

  await writeJson(path.join(outputDir, `${manifest.case_id}.manifest.json`), manifest);

  return results;
}
