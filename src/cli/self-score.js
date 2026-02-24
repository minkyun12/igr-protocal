#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function score() {
  let technical = 0;      // max 40
  let trackFit = 0;       // max 30
  let demoClarity = 0;    // max 20
  let reproducibility = 0;// max 10

  const testsExist = await exists(path.resolve("tests/pore.test.js"));
  const artifactsA = await exists(path.resolve("artifacts/reports/case-a-T+1h.report.json"));
  const artifactsB = await exists(path.resolve("artifacts/reports/case-b-T+1h.report.json"));
  const playbook = await exists(path.resolve("docs/08_PORE_MASTER_PLAYBOOK.md"));
  const submissionGuide = await exists(path.resolve("docs/12_SUBMISSION_PACKAGE_GUIDE.md"));
  const runbook = await exists(path.resolve("docs/10_LLM_HANDOFF_RUNBOOK.md"));
  const realCreAdapter = await exists(path.resolve("src/workflow/creAdapter.js"));
  const onePager = await exists(path.resolve("submission/one-pager.md"));
  const demoScript = await exists(path.resolve("submission/demo-script.md"));
  const demoVideo = await exists(path.resolve("submission/demo-video.mp4"));

  technical += testsExist ? 14 : 5;
  technical += artifactsA && artifactsB ? 8 : 2;
  technical += realCreAdapter ? 18 : 6;

  trackFit += playbook ? 10 : 4;
  trackFit += artifactsB ? 8 : 3;
  trackFit += realCreAdapter ? 12 : 4;

  demoClarity += submissionGuide ? 6 : 2;
  demoClarity += onePager ? 6 : 0;
  demoClarity += demoScript ? 4 : 0;
  demoClarity += demoVideo ? 4 : 0;

  reproducibility += runbook ? 5 : 1;
  reproducibility += testsExist ? 3 : 1;
  reproducibility += artifactsA && artifactsB ? 2 : 0;

  let total = Math.min(100, technical + trackFit + demoClarity + reproducibility);

  // 현실적인 상한: 제출 필수 자산이 없으면 점수 캡
  if (!onePager) total = Math.min(total, 74);
  if (!demoScript) total = Math.min(total, 78);
  if (!demoVideo) total = Math.min(total, 72);

  const band = total >= 85 ? "High" : total >= 70 ? "Medium" : "Low";

  return {
    breakdown: { technical, trackFit, demoClarity, reproducibility },
    total,
    firstPrizeLikelihoodBand: band
  };
}

const result = await score();
console.log(JSON.stringify(result, null, 2));
