export function cue(c, { isMismatch }) {
  if (!c) return 'Select a market.';
  if (isMismatch(c)) {
    return 'Disagreement persisted across adjudication path. Safe fallback is SPLIT_50_50 with full hash trace.';
  }
  return `Both adjudicators converged to ${c.settlement.final_settlement}. Deterministic branch finalized without discretionary override.`;
}

export function renderDetailCore(el, c, { stateClass, spreadOf }) {
  if (!c) {
    el.detailTitle.textContent = 'No market found';
    return false;
  }

  el.detailTitle.textContent = c.market.question;
  el.detailSub.textContent = `${c.case_id} · ${c.market.market_id}`;

  el.stateChip.textContent = c.settlement.branch_code;
  el.stateChip.classList.remove('match', 'mismatch');
  el.stateChip.classList.add(stateClass(c));

  el.kpiSettlement.textContent = c.settlement.final_settlement;
  el.kpiPolicy.textContent = `${c.policy.mismatch_policy} / ${c.policy.rerun_delay_hours}h`;
  el.kpiSpread.textContent = `${(spreadOf(c) * 100).toFixed(1)}%`;

  el.modelA.textContent = JSON.stringify(c.model_outputs.first_run.adjudicatorA, null, 2);
  el.modelB.textContent = JSON.stringify(c.model_outputs.first_run.adjudicatorB, null, 2);
  el.ruleText.textContent = c.market.rule_text;

  el.evidenceRows.innerHTML = c.evidence.map((e) => {
    const sig = Number.isFinite(Number(e.normalized_value)) ? Number(e.normalized_value).toFixed(2) : '-';
    const q = Number.isFinite(Number(e.quality_score)) ? Number(e.quality_score).toFixed(2) : '-';
    return `
      <tr>
        <td>${e.source_id}</td>
        <td>${e.source_type}</td>
        <td>${sig}</td>
        <td>${q}</td>
        <td>${(e.notes || '').slice(0, 100)}</td>
      </tr>
    `;
  }).join('');

  const a = c.audit;
  el.auditBox.textContent = [
    `package_hash      ${a.package_hash}`,
    `policy_hash       ${a.policy_hash}`,
    `model_pair_hash   ${a.model_pair_hash}`,
    `decision_hash     ${a.decision_hash}`
  ].join('\n');

  return true;
}
