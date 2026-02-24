# 13. Operator Prompts for Other LLMs

> 이 파일은 실제로 다른 LLM에게 붙여넣어 사용할 수 있는 작업 프롬프트 모음입니다.

---

## Prompt A — Project Bootstrap

```text
You are joining the PoRE project for Chainlink Convergence 2026.
Read in order:
1) docs/08_PORE_MASTER_PLAYBOOK.md
2) docs/09_TECHNICAL_SPEC.md
3) docs/10_LLM_HANDOFF_RUNBOOK.md
4) docs/11_CASE_REPLAY_SPEC.md
5) docs/12_SUBMISSION_PACKAGE_GUIDE.md

Your immediate objective:
- Implement the minimal end-to-end pipeline
- Produce AUTO_RESOLVE and HOLD outcomes on two replay cases
- Save machine-readable outputs under artifacts/reports/

Constraints:
- Do not expand scope beyond MVP
- Keep CRE orchestration central
- Ensure reproducibility and deterministic output format
```

---

## Prompt B — Policy Engine Implementation

```text
Implement a policy-as-code evaluator for PoRE.
Input: AIDeliberation + EvidenceStats + EventSpec + policy YAML.
Output: PolicyEvaluation JSON with reason_codes and final_state.

Required states:
- AUTO_RESOLVE_RECOMMENDED
- HOLD_FOR_REVIEW
- REJECTED_INSUFFICIENT_EVIDENCE

Add unit tests for:
1) low source count
2) high deviation
3) low confidence
4) normal pass
```

---

## Prompt C — Case Replay Builder

```text
Build a replay runner that executes three checkpoints per case: T-24h, T-1h, T+1h.
For each checkpoint produce:
- ai_deliberation.json
- policy_evaluation.json
- audit_report.json

Do not change case facts; only evaluate using existing snapshots.
```

---

## Prompt D — Demo Packager

```text
Prepare final submission package:
- README with architecture + run guide
- 1-page technical explanation
- 4-minute demo script
- artifacts from Case A and Case B

Narrative requirement:
Show why HOLD behavior improves safety under conflicting evidence.
```
