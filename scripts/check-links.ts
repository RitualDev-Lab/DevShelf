import fs from "node:fs/promises";
import path from "node:path";

interface ResourceItem {
  name: string;
  url?: string;
  repo?: string;
  category?: string;
  description?: string;
}

interface LinkCheckResult {
  file: string;
  name: string;
  url: string;
  status: number | string;
  ok: boolean;
  error?: string;
}

async function pingUrl(
  urlStr: string,
): Promise<{ ok: boolean; status: number | string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Try HEAD first, then fallback to GET
    let res: Response | null = null;
    try {
      res = await fetch(urlStr, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "DevShelf-Healthcheck/1.0 (+https://github.com/RitualDev-Lab/DevShelf)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    } catch {
      // Some servers block HEAD, try GET
      res = await fetch(urlStr, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "DevShelf-Healthcheck/1.0 (+https://github.com/RitualDev-Lab/DevShelf)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res) {
      return { ok: false, status: "NO_RESPONSE", error: "Empty HTTP response" };
    }

    // Accept any 2xx, 3xx, and even 403/429 (since bots might get rate-limited but site is up)
    const isUp = res.status < 400 || res.status === 403 || res.status === 429;
    return {
      ok: isUp,
      status: res.status,
      error: isUp ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: "TIMEOUT_OR_DNS",
      error: err.name === "AbortError" ? "Request Timeout (8s)" : err.message,
    };
  }
}

async function checkDeadLinks() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const files = await fs.readdir(shelfDir);

  const results: LinkCheckResult[] = [];
  const itemsToCheck: { file: string; name: string; url: string }[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await fs.readFile(path.join(shelfDir, file), "utf8");
    const items: ResourceItem[] = JSON.parse(content.replace(/^\uFEFF/, ""));

    for (const item of items) {
      const targetUrl = item.url || item.repo;
      if (targetUrl) {
        itemsToCheck.push({ file, name: item.name, url: targetUrl });
      }
    }
  }

  console.log(
    `🔍 [DevShelf Validator] Pinging ${itemsToCheck.length} curated endpoints across ${files.length} shelf files...\n`,
  );

  // Run in chunks of 5 concurrent requests to avoid rate limits
  const concurrency = 5;
  for (let i = 0; i < itemsToCheck.length; i += concurrency) {
    const batch = itemsToCheck.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item) => {
      const ping = await pingUrl(item.url);
      const result: LinkCheckResult = {
        file: item.file,
        name: item.name,
        url: item.url,
        status: ping.status,
        ok: ping.ok,
        error: ping.error,
      };

      if (result.ok) {
        console.log(`  ✓ [${result.status}] ${result.name} (${result.url})`);
      } else {
        console.error(`  ❌ [${result.status}] ${result.name} (${result.url}) - ${result.error}`);
      }
      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const deadLinks = results.filter((r) => !r.ok);
  const total = results.length;
  const alive = total - deadLinks.length;
  const healthPercent = ((alive / total) * 100).toFixed(1);

  console.log("\n========================================");
  console.log("📊 DevShelf Healthcheck Summary:");
  console.log(`   Total Endpoints Checked: ${total}`);
  console.log(`   Active & Reachable:     ${alive} (${healthPercent}%)`);
  console.log(`   Dead / Unreachable:     ${deadLinks.length}`);
  console.log("========================================\n");

  const uptimeReport = {
    lastChecked: new Date().toISOString(),
    totalChecked: total,
    activeReachable: alive,
    deadUnreachable: deadLinks.length,
    healthPercent: Number(healthPercent),
    status: deadLinks.length === 0 ? "100% Operational" : "Degraded",
    endpoints: results.map((r) => ({
      name: r.name,
      file: r.file,
      url: r.url,
      status: r.status,
      ok: r.ok,
    })),
  };

  const siteDir = path.join(root, "site");
  await fs.writeFile(
    path.join(siteDir, "uptime.json"),
    `${JSON.stringify(uptimeReport, null, 2)}\n`,
    "utf8",
  );
  console.log("📁 Exported uptime history telemetry to site/uptime.json");

  if (deadLinks.length > 0) {
    console.warn(`⚠️ Warning: ${deadLinks.length} dead or unreachable link(s) found:`);
    for (const dead of deadLinks) {
      console.warn(` - [${dead.file}] ${dead.name}: ${dead.url} (${dead.error})`);
    }
    // Fail process if more than 3 links are permanently dead
    if (deadLinks.length > 3) {
      process.exit(1);
    }
  } else {
    console.log("🎉 100% of curated DevShelf resources are active and healthy!");
  }
}

checkDeadLinks().catch((err) => {
  console.error("Link check execution error:", err);
  process.exit(1);
});
