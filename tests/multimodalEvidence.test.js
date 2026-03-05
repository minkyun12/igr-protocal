import test from "node:test";
import assert from "node:assert/strict";
import { compileCanonicalPackage } from "../src/protocol/compilePackage.js";
import { evaluateEvent } from "../src/workflow/evaluateEvent.js";

test("multimodal evidence fields are preserved in canonical package", () => {
  const eventSpec = {
    market_id: "pm-mm-1",
    question: "Did person X wear a suit?",
    rule_text: "Resolve YES if credible image evidence shows a suit.",
    evaluation_time: "2026-03-01T01:00:00Z",
  };

  const evidenceRecords = [
    {
      evidence_id: "img-1",
      source_id: "ap-photo",
      source_type: "image",
      uri: "https://example.com/photo.jpg",
      mime_type: "image/jpeg",
      extracted_text: "Official event photo published by AP",
      content_summary: "Image shows dark navy suit with tie",
      verdict_hint: "YES",
      quality_score: 0.9,
      timestamp: "2026-03-01T01:00:00Z"
    }
  ];

  const policy = { models: ["adjudicatorA", "adjudicatorB"], voted_prompts: [], mismatch_policy: "split_immediate" };
  const { canonical } = compileCanonicalPackage({ eventSpec, evidenceRecords, policy });

  assert.equal(canonical.voted_sources.length, 1);
  const item = canonical.voted_sources[0];
  assert.equal(item.type, "image");
  assert.equal(item.uri, "https://example.com/photo.jpg");
  assert.equal(item.mime_type, "image/jpeg");
  assert.ok(item.extracted_text.includes("AP"));
  assert.ok(item.content_summary.includes("suit"));
  assert.ok(typeof item.hash === "string" && item.hash.length > 0);
});

test("evaluateEvent can settle with non-numeric multimodal evidence hints", async () => {
  const eventSpec = {
    event_id: "mm-suit",
    market_id: "pm-mm-2",
    question: "Did person X wear a suit at the event?",
    rule_text: "Resolve YES if reliable visual evidence indicates a suit.",
    market_end_time: "2026-03-01T00:00:00Z",
    evaluation_time: "2026-03-01T01:00:00Z",
  };

  const evidenceRecords = [
    {
      evidence_id: "oracle-1",
      source_id: "chainlink",
      source_type: "price",
      normalized_value: 1,
      quality_score: 1.0,
      timestamp: "2026-03-01T01:00:00Z"
    },
    {
      evidence_id: "img-yes",
      source_id: "reuters-photo",
      source_type: "image",
      uri: "https://example.com/reuters.jpg",
      content_summary: "Confirmed: tailored suit and tie visible",
      quality_score: 0.95,
      timestamp: "2026-03-01T01:00:00Z"
    },
    {
      evidence_id: "txt-1",
      source_id: "official-briefing",
      source_type: "official",
      extracted_text: "Press office confirms formal attire at the event.",
      verdict_hint: "YES",
      quality_score: 0.8,
      timestamp: "2026-03-01T01:00:00Z"
    }
  ];

  const policy = {
    models: ["adjudicatorA", "adjudicatorB"],
    voted_prompts: ["Handle multimodal evidence metadata consistently."],
    mismatch_policy: "split_immediate",
    rerun_delay_hours: 12,
  };

  const report = await evaluateEvent({ eventSpec, evidenceRecords, policy });
  assert.ok(["FINAL_MATCH", "FINAL_MISMATCH"].includes(report.settlement.branch_code));
  assert.ok(["YES", "NO", "SPLIT_50_50"].includes(report.settlement.final_settlement));
  assert.equal(report.canonical_input_package.voted_sources[0].type, "image");
});
