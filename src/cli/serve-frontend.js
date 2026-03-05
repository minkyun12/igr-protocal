#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 4173);
const root = path.resolve("frontend");

const disputes = [];
const proposals = [];
const escalations = [];
const governanceVotes = new Map();
const lockedByMarket = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

async function loadCases() {
  const filePath = path.join(root, "cases.json");
  return JSON.parse(await fs.readFile(filePath, "utf-8"));
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    // lightweight local API for frontend live-mode testing
    if (url.pathname === "/api/markets") {
      const data = await loadCases();
      const wrapped = url.searchParams.get("wrapped") === "1";
      const body = wrapped ? { markets: data, source: "local-mock-api" } : data;
      json(res, 200, body);
      return;
    }

    if (url.pathname.startsWith("/api/markets/")) {
      const marketId = decodeURIComponent(url.pathname.split("/").pop() || "");
      const data = await loadCases();
      const found = data.find((c) => c.case_id === marketId || c.market?.market_id === marketId);
      if (!found) return json(res, 404, { error: "market_not_found", marketId });
      return json(res, 200, found);
    }

    if (url.pathname === "/api/metrics") {
      const data = await loadCases();
      const total = data.length;
      const disputes = data.filter((c) => c.settlement?.branch_code === "FINAL_MISMATCH").length;
      const matches = total - disputes;
      const avgSpread = total
        ? data.reduce((s, c) => {
            const a = c.model_outputs?.first_run?.adjudicatorA?.confidence ?? 0;
            const b = c.model_outputs?.first_run?.adjudicatorB?.confidence ?? 0;
            return s + Math.abs(a - b);
          }, 0) / total
        : 0;
      return json(res, 200, {
        totalMarkets: total,
        resolvedMatch: matches,
        disputed: disputes,
        avgConfidenceSpread: Number((avgSpread * 100).toFixed(2)),
      });
    }


    if (url.pathname === "/api/disputes" && req.method === "POST") {
      const body = await readJsonBody(req);
      const row = { id: `D-${String(disputes.length + 1).padStart(3, "0")}`, ...body, createdAt: new Date().toISOString() };
      disputes.push(row);
      return json(res, 201, { ok: true, dispute: row });
    }

    if (url.pathname === "/api/proposals" && req.method === "POST") {
      const body = await readJsonBody(req);
      const row = { id: `PR-${String(proposals.length + 1).padStart(3, "0")}`, status: "PENDING", ...body, createdAt: new Date().toISOString() };
      proposals.push(row);
      return json(res, 201, { ok: true, proposal: row });
    }

    if (url.pathname === "/api/escalations" && req.method === "POST") {
      const body = await readJsonBody(req);
      const row = { id: `E-${String(escalations.length + 1).padStart(3, "0")}`, status: "OPEN", ...body, createdAt: new Date().toISOString() };
      escalations.push(row);
      return json(res, 201, { ok: true, escalation: row });
    }


    if (url.pathname === "/api/evidence" && req.method === "POST") {
      const body = await readJsonBody(req);
      const row = { id: `EV-${String(disputes.length + proposals.length + escalations.length + 1).padStart(3, "0")}`, ...body, createdAt: new Date().toISOString() };
      return json(res, 201, { ok: true, evidence: row });
    }

    if (url.pathname === "/api/governance/vote" && req.method === "POST") {
      const body = await readJsonBody(req);
      const key = String(body.proposalId || "");
      if (!key) return json(res, 400, { error: "proposal_id_required" });
      const prev = governanceVotes.get(key) || { yes: 0, no: 0, votes: [] };
      if (body.support) prev.yes += 1; else prev.no += 1;
      prev.votes.push({ voter: body.voter || "demo-holder", support: Boolean(body.support), at: new Date().toISOString() });
      governanceVotes.set(key, prev);
      return json(res, 201, { ok: true, proposalId: key, tally: prev });
    }

    if (url.pathname === "/api/governance/lock" && req.method === "POST") {
      const body = await readJsonBody(req);
      const proposalId = String(body.proposalId || "");
      const marketId = String(body.marketId || "");
      if (!proposalId || !marketId) return json(res, 400, { error: "proposal_id_and_market_id_required" });
      const tally = governanceVotes.get(proposalId) || { yes: 0, no: 0 };
      if (tally.yes <= tally.no) return json(res, 409, { error: "proposal_not_passed", tally });
      lockedByMarket.set(marketId, { proposalId, lockedAt: new Date().toISOString(), tally });
      return json(res, 201, { ok: true, marketId, lock: lockedByMarket.get(marketId) });
    }

    if (url.pathname === "/api/governance/proposals") {
      const data = await loadCases();
      const seeded = data.slice(0, 3).map((c, i) => ({
        id: `P-${String(i + 1).padStart(3, "0")}`,
        market: c.market?.market_id,
        change: i === 0 ? "Model pair lock" : i === 1 ? "Advisory prompts update" : "Optional source set",
        status: i === 1 ? "LOCKED" : "EXECUTED",
        quorum: ["12.4%", "15.1%", "11.8%"][i],
        eta: ["2026-03-08 14:00 UTC", "2026-03-09 02:00 UTC", "2026-03-09 12:30 UTC"][i],
        configHash: c.audit?.policy_hash || null,
      }));
      const merged = [...seeded, ...proposals.map((p) => ({
        id: p.id,
        market: p.market_id,
        change: `Outcome proposal: ${p.proposed}`,
        status: p.status,
        quorum: "pending",
        eta: p.createdAt,
        configHash: null,
      }))];
      const withVotes = merged.map((m) => {
        const tally = governanceVotes.get(m.id) || { yes: 0, no: 0 };
        const lock = lockedByMarket.get(m.market || "");
        const status = lock && lock.proposalId === m.id ? "LOCKED" : (tally.yes + tally.no > 0 ? (tally.yes > tally.no ? "PASSED" : "REJECTED") : m.status);
        return {
          ...m,
          status,
          quorum: tally.yes + tally.no > 0 ? `${tally.yes}/${tally.no}` : m.quorum,
        };
      });
      return json(res, 200, { proposals: withVotes });
    }

    const reqPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.join(root, reqPath);
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`IGR frontend running at http://localhost:${port}`);
});
