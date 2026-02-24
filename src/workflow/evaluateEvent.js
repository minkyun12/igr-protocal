import { computeEvidenceStats } from "../evidence/stats.js";
import { runProposer } from "../ai/proposer.js";
import { runChallenger } from "../ai/challenger.js";
import { evaluatePolicy } from "../policy/evaluator.js";
import { sha256Hex } from "../utils/hash.js";
import { runCreWorkflow } from "./creAdapter.js";

export async function evaluateEvent({ eventSpec, evidenceRecords, policy }) {
  const startedAt = Date.now();

  const evidenceStats = computeEvidenceStats(evidenceRecords, { evaluationTime: eventSpec.evaluation_time });
  const proposer = runProposer(eventSpec, evidenceRecords);
  const challenger = runChallenger(proposer, evidenceStats, policy);
  const policyEvaluation = evaluatePolicy({ eventSpec, evidenceStats, proposer, challenger, policy });

  const cre = await runCreWorkflow({
    payload: {
      event_id: eventSpec.event_id,
      decision: policyEvaluation.decision,
      final_state: policyEvaluation.final_state,
      reasons: policyEvaluation.reason_codes
    }
  });

  const finishedAt = Date.now();

  const audit = {
    policy_hash: sha256Hex(policy),
    event_hash: sha256Hex(eventSpec),
    evidence_hash: sha256Hex(evidenceRecords),
    decision_hash: sha256Hex({ policyEvaluation, proposer, challenger })
  };

  return {
    run_id: `${eventSpec.event_id}-${new Date().toISOString()}`,
    event_spec: eventSpec,
    evidence_stats: evidenceStats,
    ai_deliberation: { proposer, challenger },
    policy_evaluation: policyEvaluation,
    cre,
    audit,
    started_at: new Date(startedAt).toISOString(),
    finished_at: new Date(finishedAt).toISOString(),
    latency_ms: finishedAt - startedAt,
    human_summary: summarize(policyEvaluation, cre)
  };
}

function summarize(policyEvaluation, cre) {
  const { final_state, reason_codes, decision, adjusted_confidence } = policyEvaluation;
  return `State=${final_state}, decision=${decision}, adjusted_confidence=${adjusted_confidence}, CRE=${cre.status}/${cre.mode}, reasons=${reason_codes.join(",")}`;
}
