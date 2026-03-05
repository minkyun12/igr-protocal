import fs from "node:fs/promises";
import path from "node:path";
import { evaluateEvent } from "../src/workflow/evaluateEvent.js";
import { readJson } from "../src/utils/io.js";
import { sha256Hex } from "../src/utils/hash.js";

const outDir = process.argv[2] || "simulation/output/cre-sim";
const caseDir = process.argv[3] || "simulation/input/replay/case-a";
const checkpointName = process.argv[4] || "checkpoint-T+1h.json";
const sourceSimLog = process.argv[5] || "";

await fs.mkdir(outDir, { recursive: true });

const eventSpec = await readJson(path.join(caseDir, "event_spec.json"));
const checkpoint = await readJson(path.join(caseDir, checkpointName));
const policy = await readJson("configs/policy.json");

const report = await evaluateEvent({
  eventSpec: { ...eventSpec, evaluation_time: checkpoint.evaluation_time },
  evidenceRecords: checkpoint.evidence_records,
  policy,
});

const modelKeys = Object.keys(report.model_outputs.first_run).filter((k) => k !== "retries");
const modelAKey = modelKeys[0];
const modelBKey = modelKeys[1];
const modelA = report.model_outputs.first_run[modelAKey];
const modelB = report.model_outputs.first_run[modelBKey];

const decision = {
  eventId: String(report.event_spec?.market_id ?? report.event_spec?.event_id ?? "unknown"),
  decision: report.settlement,
  finalState: report.policy_evaluation.final_state,
  reasonCodes: report.policy_evaluation.reason_codes,
  decisionHash: report.audit.decision_hash,
};

const localDecisionHash = sha256Hex({ settlement: report.settlement, firstRun: {
  policy: report.canonical_input_package.mismatch_policy,
  outputs: [modelA, modelB],
}, rerun: report.model_outputs.rerun ? {
  outputs: [report.model_outputs.rerun[modelAKey], report.model_outputs.rerun[modelBKey]],
} : null });

const decisionHashVerified = localDecisionHash === report.audit.decision_hash;

await fs.writeFile(path.join(outDir, "input-package.json"), JSON.stringify(report.canonical_input_package, null, 2));
await fs.writeFile(path.join(outDir, "model-output-a.json"), JSON.stringify(modelA, null, 2));
await fs.writeFile(path.join(outDir, "model-output-b.json"), JSON.stringify(modelB, null, 2));
await fs.writeFile(path.join(outDir, "decision.json"), JSON.stringify(decision, null, 2));

const hashesLines = [
  `package_hash=${report.audit.package_hash}`,
  `decision_hash=${report.audit.decision_hash}`,
  `local_decision_hash=${localDecisionHash}`,
  `decision_hash_verified=${decisionHashVerified ? "yes" : "no"}`,
  `model_output_hash_a=${report.audit.model_output_hashes.first_run[0]}`,
  `model_output_hash_b=${report.audit.model_output_hashes.first_run[1]}`,
  `policy_hash=${report.audit.policy_hash}`,
  `model_pair_hash=${report.audit.model_pair_hash}`,
];
await fs.writeFile(path.join(outDir, "hashes.txt"), `${hashesLines.join("\n")}\n`);

const simulateLogPath = path.join(outDir, "simulate.log");
if (sourceSimLog) {
  const raw = await fs.readFile(sourceSimLog, "utf8");
  await fs.writeFile(simulateLogPath, raw);
} else {
  const lines = [
    `[repro-bundle] generated_at=${new Date().toISOString()}`,
    `[repro-bundle] source=local evaluateEvent`,
    `[repro-bundle] case_dir=${caseDir}`,
    `[repro-bundle] checkpoint=${checkpointName}`,
    `[repro-bundle] branch=${report.policy_evaluation.final_state}`,
    `[repro-bundle] settlement=${report.policy_evaluation.final_settlement}`,
    `[repro-bundle] note=pass -- <outDir> <caseDir> <checkpointFile> <sourceSimLog> to copy real CRE simulate.log`,
  ];
  await fs.writeFile(simulateLogPath, `${lines.join("\n")}\n`);
}

console.log(JSON.stringify({
  ok: true,
  outDir,
  files: [
    "simulate.log",
    "input-package.json",
    "model-output-a.json",
    "model-output-b.json",
    "decision.json",
    "hashes.txt",
  ],
  decision_hash_verified: decisionHashVerified,
}, null, 2));
