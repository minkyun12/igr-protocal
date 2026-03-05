export function bindElements() {
  const ids = [
    'themeToggle','marketCount','marketRows','searchInput','statusFilter','detailTitle','detailSub','stateChip',
    'kpiSettlement','kpiPolicy','kpiSpread','modelA','modelB','ruleText','evidenceRows','presenterCue','auditBox',
    'demoToggle','gActive','gMatch','gDispute','gSpread','govRows','timeline','signalChart','openDispute',
    'closeDispute','submitDispute','disputeModal','disputeText','depthChart','stateFlow','proposalModal',
    'proposalDetail','closeProposal','dataMode','refreshBtn','proposeYesBtn','proposeNoBtn','escalateBtn',
    'trustLock','trustOracle','trustRerunMode','trustFreshness','toast','addEvidenceBtn','voteYesBtn','voteNoBtn','lockConfigBtn'
  ];

  return Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
}
