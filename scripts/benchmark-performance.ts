import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

interface ResourceItem {
  name: string;
  url?: string;
  repo?: string;
  category?: string;
  section?: string;
  statusTags?: string[];
  [key: string]: unknown;
}

interface BenchmarkRecord {
  name: string;
  file: string;
  url: string;
  lastChecked: string;
  samples: number[];
  avgLatencyMs: number;
  consecutiveSluggishAudits: number;
  hasWarning: boolean;
}

interface BenchmarksData {
  lastRun: string;
  totalBenchmarked: number;
  sluggishCount: number;
  endpoints: BenchmarkRecord[];
}

const HIGH_LATENCY_THRESHOLD_MS = 3000;
const RECOVERY_THRESHOLD_MS = 1500;
const SLUGGISH_AUDIT_LIMIT = 3;
const WARNING_TAG = "[Performance Warning: High Latency]";

async function measureLatency(urlStr: string): Promise<number | null> {
  const start = Date.now();
  try {
    const res = await fetch(urlStr, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) DevShelf-Benchmark/1.0",
        Accept: "text/html,application/json,*/*",
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });
    // Consume a minimal chunk to ensure headers and start of body arrived (TTFB + initial payload)
    await res.arrayBuffer();
    return Date.now() - start;
  } catch {
    return null;
  }
}

async function runBenchmark() {
  const isDryRun = process.argv.includes("--dry-run");
  const sampleArgIndex = process.argv.indexOf("--sample");
  const maxSamples =
    sampleArgIndex !== -1 ? Number.parseInt(process.argv[sampleArgIndex + 1], 10) : undefined;

  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const siteDir = path.join(root, "site");
  const benchmarkPath = path.join(siteDir, "benchmarks.json");

  console.log("⏱️ [DevShelf Performance Benchmark] Measuring TTFB & response latency...\n");

  const priorBenchmarks = new Map<string, BenchmarkRecord>();
  try {
    const raw = await fs.readFile(benchmarkPath, "utf8");
    const json: BenchmarksData = JSON.parse(raw);
    if (Array.isArray(json.endpoints)) {
      for (const ep of json.endpoints) {
        priorBenchmarks.set(ep.name.toLowerCase(), ep);
      }
    }
  } catch {
    // Fresh benchmark file
  }

  const files = await fs.readdir(shelfDir);
  const itemsToTest: { file: string; item: ResourceItem }[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await fs.readFile(path.join(shelfDir, file), "utf8");
    const items: ResourceItem[] = JSON.parse(content.replace(/^\uFEFF/, ""));
    for (const item of items) {
      if (item.url || item.repo) {
        itemsToTest.push({ file, item });
      }
    }
  }

  const testingQueue = maxSamples ? itemsToTest.slice(0, maxSamples) : itemsToTest;
  console.log(`📊 Benchmarking ${testingQueue.length} endpoints (3 samples each)...`);

  const results: BenchmarkRecord[] = [];
  const modifiedFiles = new Set<string>();

  for (const { file, item } of testingQueue) {
    const targetUrl = item.url || item.repo || "";
    const prior = priorBenchmarks.get(item.name.toLowerCase());
    const samples: number[] = [];

    for (let s = 0; s < 3; s++) {
      const ms = await measureLatency(targetUrl);
      if (ms !== null) samples.push(ms);
      // Small pause between consecutive pings
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const avgLatency =
      samples.length > 0
        ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
        : prior?.avgLatencyMs || 250;

    let consecutiveSluggish = prior?.consecutiveSluggishAudits || 0;
    let hasWarning = (item.statusTags || []).includes(WARNING_TAG);

    if (avgLatency > HIGH_LATENCY_THRESHOLD_MS) {
      consecutiveSluggish++;
      console.warn(
        `  ⚠️ [${avgLatency}ms] ${item.name} (${targetUrl}) - Sluggish (Audit streak: ${consecutiveSluggish})`,
      );
      if (consecutiveSluggish >= SLUGGISH_AUDIT_LIMIT && !hasWarning) {
        hasWarning = true;
        console.log(`    🚨 Applying '${WARNING_TAG}' to ${item.name}`);
        if (!item.statusTags) item.statusTags = [];
        item.statusTags.push(WARNING_TAG);
        modifiedFiles.add(file);
      }
    } else {
      if (avgLatency < RECOVERY_THRESHOLD_MS && consecutiveSluggish > 0) {
        consecutiveSluggish = 0;
        if (hasWarning) {
          hasWarning = false;
          console.log(
            `    ✅ Latency recovered (${avgLatency}ms). Removing '${WARNING_TAG}' from ${item.name}`,
          );
          item.statusTags = (item.statusTags || []).filter((t) => t !== WARNING_TAG);
          modifiedFiles.add(file);
        }
      }
      console.log(`  ✓ [${avgLatency}ms] ${item.name}`);
    }

    results.push({
      name: item.name,
      file,
      url: targetUrl,
      lastChecked: new Date().toISOString(),
      samples,
      avgLatencyMs: avgLatency,
      consecutiveSluggishAudits: consecutiveSluggish,
      hasWarning,
    });
  }

  // Update shelf JSON files if any warnings were added/removed
  if (modifiedFiles.size > 0 && !isDryRun) {
    for (const file of modifiedFiles) {
      const filePath = path.join(shelfDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const items: ResourceItem[] = JSON.parse(content.replace(/^\uFEFF/, ""));

      // Update matching items in memory
      for (const res of results.filter((r) => r.file === file)) {
        const found = items.find((i) => i.name.toLowerCase() === res.name.toLowerCase());
        if (found) {
          if (res.hasWarning && !found.statusTags?.includes(WARNING_TAG)) {
            if (!found.statusTags) found.statusTags = [];
            found.statusTags.push(WARNING_TAG);
          } else if (!res.hasWarning && found.statusTags?.includes(WARNING_TAG)) {
            found.statusTags = found.statusTags.filter((t) => t !== WARNING_TAG);
          }
        }
      }

      await fs.writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
      console.log(`✓ Updated raw dataset in shelf/${file}`);
    }

    console.log("🔨 Rebuilding web assets and README...");
    execSync("pnpm run build", { stdio: "inherit" });
    execSync("pnpm run format", { stdio: "inherit" });
  }

  // Save benchmark history
  const sluggishTotal = results.filter((r) => r.hasWarning).length;
  const benchmarkReport: BenchmarksData = {
    lastRun: new Date().toISOString(),
    totalBenchmarked: results.length,
    sluggishCount: sluggishTotal,
    endpoints: results,
  };

  await fs.writeFile(benchmarkPath, `${JSON.stringify(benchmarkReport, null, 2)}\n`, "utf8");
  console.log(
    `\n📁 Performance benchmark saved to site/benchmarks.json (${sluggishTotal} high-latency endpoints)`,
  );
}

runBenchmark().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
