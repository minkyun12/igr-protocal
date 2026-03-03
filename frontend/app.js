const res = await fetch('./cases.json');
const cases = await res.json();

const listEl = document.getElementById('caseList');
const countEl = document.getElementById('caseCount');
const demoToggle = document.getElementById('demoToggle');
const demoStatus = document.getElementById('demoStatus');
const demoCaption = document.getElementById('demoCaption');
const demoBar = document.getElementById('demoBar');
const presenterCue = document.getElementById('presenterCue');

let demoRunning = false;
let demoTimer = null;
let demoTick = null;
let activeIdx = 0;

function short(hash = '') {
  return hash ? `${hash.slice(0, 18)}…` : '-';
}

function pct(n) {
  return `${(n * 100).toFixed(0)}%`;
}

function isSplit(branch = '') {
  return branch.includes('SPLIT') || branch.includes('MISMATCH');
}

function fillKPIs(items) {
  const total = items.length || 1;
  const splitCount = items.filter((c) => isSplit(c.settlement?.branch_code)).length;
  const matchCount = total - splitCount;

  document.getElementById('kpiMatch').textContent = `${pct(matchCount / total)}`;
  document.getElementById('kpiSplit').textContent = `${pct(splitCount / total)}`;
  countEl.textContent = `${items.length}`;
}

function cueFor(c) {
  const settlement = c.settlement.final_settlement;
  const branch = c.settlement.branch_code;
  if (isSplit(branch)) {
    return `This case demonstrates IGR safety behavior: disagreement remains unresolved, so the protocol exits with neutral split settlement.`;
  }
  return `Both adjudicators converged to ${settlement}. This is the deterministic fast path with no discretionary override.`;
}

function renderCase(c, idx = 0) {
  activeIdx = idx;

  const branch = c.settlement.branch_code;
  const settlement = c.settlement.final_settlement;

  document.getElementById('marketTitle').textContent = c.market.question;
  document.getElementById('marketSub').textContent = `${c.case_id} · ${c.market.market_id}`;

  const chip = document.getElementById('branchChip');
  chip.textContent = branch;
  chip.classList.remove('match', 'split');
  chip.classList.add(isSplit(branch) ? 'split' : 'match');

  document.getElementById('ruleText').textContent = c.market.rule_text;
  document.getElementById('finalSettlement').textContent = settlement;
  document.getElementById('policyLine').textContent = `Policy: ${c.policy.mismatch_policy} · rerun ${c.policy.rerun_delay_hours}h`;

  document.getElementById('modelA').textContent = JSON.stringify(c.model_outputs.first_run.adjudicatorA, null, 2);
  document.getElementById('modelB').textContent = JSON.stringify(c.model_outputs.first_run.adjudicatorB, null, 2);

  const rows = c.evidence.map((e) => {
    const yesProb = Number(e.normalized_value);
    const quality = e.quality_score == null ? '-' : Number(e.quality_score).toFixed(2);
    return `
      <tr>
        <td>${e.source_id}</td>
        <td>${e.source_type}</td>
        <td>${Number.isFinite(yesProb) ? yesProb.toFixed(2) : '-'}</td>
        <td>${quality}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('evidenceRows').innerHTML = rows;

  document.getElementById('audit').textContent =
`package_hash     ${short(c.audit.package_hash)}
policy_hash      ${short(c.audit.policy_hash)}
model_pair_hash  ${short(c.audit.model_pair_hash)}
decision_hash    ${short(c.audit.decision_hash)}`;

  presenterCue.textContent = cueFor(c);
}

function createCaseItem(c, idx) {
  const item = document.createElement('button');
  item.className = 'case-item';
  item.innerHTML = `
    <strong>${c.case_id}</strong><br>
    <small>${c.settlement.branch_code} · ${c.settlement.final_settlement}</small>
  `;

  item.onclick = () => {
    [...listEl.children].forEach((el) => el.classList.remove('active'));
    item.classList.add('active');
    renderCase(c, idx);
  };

  listEl.appendChild(item);
  if (idx === 0) item.click();
}

function setActiveByIndex(idx) {
  const item = listEl.children[idx];
  if (!item) return;
  [...listEl.children].forEach((el) => el.classList.remove('active'));
  item.classList.add('active');
  renderCase(cases[idx], idx);
}

function stopDemo() {
  demoRunning = false;
  demoToggle.classList.remove('active');
  demoToggle.textContent = '▶ Demo Mode';
  demoStatus.textContent = 'Idle';
  demoCaption.textContent = 'Press Demo Mode to auto-play case transitions.';
  demoBar.style.width = '0%';
  if (demoTimer) clearTimeout(demoTimer);
  if (demoTick) clearInterval(demoTick);
}

function startDemo() {
  demoRunning = true;
  demoToggle.classList.add('active');
  demoToggle.textContent = '■ Stop Demo';
  demoStatus.textContent = 'Running';

  const durationMs = 5000;

  const runStep = () => {
    if (!demoRunning) return;

    activeIdx = (activeIdx + 1) % cases.length;
    setActiveByIndex(activeIdx);
    demoCaption.textContent = `Now presenting ${cases[activeIdx].case_id} (${cases[activeIdx].settlement.branch_code})`;

    let elapsed = 0;
    demoBar.style.width = '0%';
    if (demoTick) clearInterval(demoTick);
    demoTick = setInterval(() => {
      elapsed += 100;
      const p = Math.min((elapsed / durationMs) * 100, 100);
      demoBar.style.width = `${p}%`;
    }, 100);

    if (demoTimer) clearTimeout(demoTimer);
    demoTimer = setTimeout(runStep, durationMs);
  };

  runStep();
}

demoToggle.addEventListener('click', () => {
  if (demoRunning) stopDemo();
  else startDemo();
});

fillKPIs(cases);
cases.forEach(createCaseItem);
