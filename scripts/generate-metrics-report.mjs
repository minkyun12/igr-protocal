import fs from "node:fs/promises";
import path from "node:path";

const reportsDir = process.argv[2] || "simulation/output/reports";
const outPath = process.argv[3] || "simulation/output/reports/metrics-summary.json";

async function main() {
  async function collect(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let out = [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        out = out.concat(await collect(p));
      } else if (e.isFile() && e.name.endsWith('.report.json')) {
        out.push(p);
      }
    }
    return out;
  }

  const reportPaths = await collect(reportsDir);

  const reports = [];
  for (const p of reportPaths) {
    const data = JSON.parse(await fs.readFile(p, "utf8"));
    reports.push(data);
  }

  const branchCounts = {};
  const settlementCounts = {};
  let latencyTotal = 0;
  for (const r of reports) {
    const b = r?.settlement?.branch_code || "UNKNOWN";
    const s = r?.settlement?.final_settlement || "UNKNOWN";
    branchCounts[b] = (branchCounts[b] || 0) + 1;
    settlementCounts[s] = (settlementCounts[s] || 0) + 1;
    latencyTotal += Number(r?.latency_ms || 0);
  }

  const summary = {
    generated_at: new Date().toISOString(),
    reports_dir: reportsDir,
    report_count: reports.length,
    branch_counts: branchCounts,
    settlement_counts: settlementCounts,
    mean_latency_ms: reports.length ? latencyTotal / reports.length : 0,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
