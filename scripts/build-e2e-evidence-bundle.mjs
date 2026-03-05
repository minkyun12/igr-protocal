import fs from "node:fs/promises";
import path from "node:path";
import { evaluateEvent } from "../src/workflow/evaluateEvent.js";
import { recordOnChain } from "../src/workflow/onchainRecorder.js";
import { readJson } from "../src/utils/io.js";
import { sha256Hex } from "../src/utils/hash.js";

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    const clean = raw.replace(/^--/, "");
    const [k, ...rest] = clean.split("=");
    args[k] = rest.length ? rest.join("=") : true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args.out || "simulation/output/e2e-bundle");
const caseDir = path.resolve(args.case || "simulation/input/replay/case-a");
const checkpointName = String(args.checkpoint || "checkpoint-T+1h.json");
const policyPath = path.resolve(args.policy || "configs/policy.json");
const writeOnchain = args.onchain === true || args.onchain === "1";

await fs.mkdir(outDir, { recursive: true });

const eventSpec = await readJson(path.join(caseDir, "event_spec.json"));
const checkpoint = await readJson(path.join(caseDir, checkpointName));
const policy = await readJson(policyPath);

const report = await evaluateEvent({
  eventSpec: { ...eventSpec, evaluation_time: checkpoint.evaluation_time },
  evidenceRecords: checkpoint.evidence_records,
  policy,
});

const modelNames = Object.keys(report.model_outputs.first_run).filter((k) => !["retries", "persistent_failures"].includes(k));
const modelA = modelNames[0];
const modelB = modelNames[1];

const localDecisionHash = sha256Hex({
  settlement: report.settlement,
  firstRun: {
    policy: report.canonical_input_package.mismatch_policy,
    outputs: [report.model_outputs.first_run[modelA], report.model_outputs.first_run[modelB]],
  },
  rerun: report.model_outputs.rerun
    ? { outputs: [report.model_outputs.rerun[modelA], report.model_outputs.rerun[modelB]] }
    : null,
});

const decisionHashVerified = localDecisionHash === report.audit.decision_hash;

const onchainInput = {
  eventId: String(report.event_spec?.market_id ?? report.event_spec?.event_id ?? "unknown"),
  decision: JSON.stringify(report.settlement),
  finalState: report.policy_evaluation.final_state,
  reasonCodes: report.policy_evaluation.reason_codes,
  decisionHash: `0x${report.audit.decision_hash}`,
};

let onchain = { status: "skipped", reason: "--onchain not enabled" };
if (writeOnchain) {
  onchain = await recordOnChain(onchainInput);
}

const summary = {
  generated_at: new Date().toISOString(),
  case_dir: caseDir,
  checkpoint: checkpointName,
  policy_path: policyPath,
  settlement: {
    branch_code: report.settlement.branch_code,
    reason_code: report.settlement.reason_code,
    final_settlement: report.settlement.final_settlement,
    rerun_used: report.settlement.rerun_used,
  },
  hashes: {
    package_hash: report.audit.package_hash,
    rerun_package_hash: report.audit.rerun_package_hash,
    policy_hash: report.audit.policy_hash,
    model_pair_hash: report.audit.model_pair_hash,
    model_output_hashes: report.audit.model_output_hashes,
    decision_hash: report.audit.decision_hash,
    local_decision_hash: localDecisionHash,
    decision_hash_verified: decisionHashVerified,
  },
  onchain,
};

await fs.writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await fs.writeFile(path.join(outDir, "input-package.json"), JSON.stringify(report.canonical_input_package, null, 2));
await fs.writeFile(path.join(outDir, "model-output-a.json"), JSON.stringify(report.model_outputs.first_run[modelA], null, 2));
await fs.writeFile(path.join(outDir, "model-output-b.json"), JSON.stringify(report.model_outputs.first_run[modelB], null, 2));
await fs.writeFile(
  path.join(outDir, "hashes.txt"),
  [
    `package_hash=${report.audit.package_hash}`,
    `rerun_package_hash=${report.audit.rerun_package_hash || ""}`,
    `policy_hash=${report.audit.policy_hash}`,
    `model_pair_hash=${report.audit.model_pair_hash}`,
    `model_output_hash_a=${report.audit.model_output_hashes.first_run[0]}`,
    `model_output_hash_b=${report.audit.model_output_hashes.first_run[1]}`,
    `decision_hash=${report.audit.decision_hash}`,
    `local_decision_hash=${localDecisionHash}`,
    `decision_hash_verified=${decisionHashVerified ? "yes" : "no"}`,
    `onchain_status=${onchain.status}`,
    `onchain_tx_hash=${onchain.txHash || ""}`,
    `onchain_block=${onchain.blockNumber || ""}`,
  ].join("\n") + "\n"
);

const md = [
  "# IGR E2E Evidence Bundle",
  "",
  `- generated_at: ${summary.generated_at}`,
  `- case: ${path.basename(caseDir)}`,
  `- checkpoint: ${checkpointName}`,
  `- branch: ${summary.settlement.branch_code}`,
  `- reason: ${summary.settlement.reason_code}`,
  `- settlement: ${summary.settlement.final_settlement}`,
  `- decision_hash_verified: ${decisionHashVerified ? "yes" : "no"}`,
  `- onchain: ${onchain.status}`,
  onchain.txHash ? `- tx: ${onchain.txHash}` : "",
].filter(Boolean).join("\n");
await fs.writeFile(path.join(outDir, "summary.md"), md + "\n");

console.log(JSON.stringify({ ok: true, outDir, onchain: onchain.status, decision_hash_verified: decisionHashVerified }, null, 2));
