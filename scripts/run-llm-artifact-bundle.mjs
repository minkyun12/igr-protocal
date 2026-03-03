import fs from "node:fs/promises";
import path from "node:path";
import { evaluateEvent } from "../src/workflow/evaluateEvent.js";
import { readJson } from "../src/utils/io.js";

const outDir = process.argv[2] || "simulation/output/cre-sim";
const caseDir = process.argv[3] || "simulation/input/replay/case-a";

const hasCreds = Boolean(process.env.OPENAI_API_KEY || process.env.MODEL_A_API_KEY) &&
  Boolean(process.env.ANTHROPIC_API_KEY || process.env.MODEL_B_API_KEY);

if ((process.env.MODEL_MODE || "sim") !== "llm" || !hasCreds) {
  console.error("LLM artifact bundle skipped: set MODEL_MODE=llm and provider API keys.");
  process.exit(2);
}

await fs.mkdir(outDir, { recursive: true });

const eventSpec = await readJson(path.join(caseDir, "event_spec.json"));
const checkpoint = await readJson(path.join(caseDir, "checkpoint-T+1h.json"));
const policy = await readJson("configs/policy.json");

const report = await evaluateEvent({
  eventSpec: { ...eventSpec, evaluation_time: checkpoint.evaluation_time },
  evidenceRecords: checkpoint.evidence_records,
  policy,
});

const modelKeys = Object.keys(report.model_outputs.first_run).filter((k) => k !== "retries");

await fs.writeFile(path.join(outDir, "input-package.json"), JSON.stringify(report.canonical_input_package, null, 2));
await fs.writeFile(path.join(outDir, "model-output-a.json"), JSON.stringify(report.model_outputs.first_run[modelKeys[0]], null, 2));
await fs.writeFile(path.join(outDir, "model-output-b.json"), JSON.stringify(report.model_outputs.first_run[modelKeys[1]], null, 2));
await fs.writeFile(path.join(outDir, "decision.json"), JSON.stringify(report.settlement, null, 2));
await fs.writeFile(path.join(outDir, "hashes.txt"), [
  `package_hash=${report.audit.package_hash}`,
  `decision_hash=${report.audit.decision_hash}`,
  `model_output_hash_a=${report.audit.model_output_hashes.first_run[0]}`,
  `model_output_hash_b=${report.audit.model_output_hashes.first_run[1]}`,
].join("\n") + "\n");

console.log("llm-artifact-bundle:ok");
