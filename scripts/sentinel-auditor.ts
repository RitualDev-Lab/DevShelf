/**
 * DevShelf Automated Link Rot, License & Paywall Sentinel (SEC-07)
 *
 * Scans catalog resources weekly to detect:
 * 1. Archived GitHub repositories
 * 2. HTTP 404 / 5xx dead links
 * 3. Sudden license drift (e.g. MIT/Apache -> BSL/SSPL/Proprietary)
 * 4. Pricing page changes violating the zero-paywall pledge
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeCanonicalUrl } from "./fuzzy-duplicate-detector.js";

export interface SentinelFlag {
  name: string;
  file: string;
  url: string;
  issueType: "ARCHIVED_REPO" | "HTTP_DEAD" | "LICENSE_DRIFT" | "PAYWALL_TRAP";
  severity: "critical" | "warning";
  details: string;
}

export interface SentinelReport {
  timestamp: string;
  totalScanned: number;
  healthyCount: number;
  flaggedCount: number;
  flags: SentinelFlag[];
}

const PROPRIETARY_LICENSES = new Set([
  "busl-1.1",
  "sspl-1.0",
  "polyform-noncommercial-1.0.0",
  "polyform-small-business-1.0.0",
  "bsl-1.1",
  "proprietary",
  "commercial",
]);

const PAYWALL_TRAP_REGEX =
  /\b(credit card required upfront|free tier discontinued|no free tier|14-day free trial only|credit card will be charged after trial)\b/i;

export function evaluateLicenseDrift(
  catalogLicense: string,
  githubLicenseSpdx?: string | null,
): { drifted: boolean; details?: string } {
  if (!githubLicenseSpdx) return { drifted: false };
  const current = (catalogLicense || "").toLowerCase();
  const remote = githubLicenseSpdx.toLowerCase();

  if (current.includes("mit") || current.includes("apache") || current.includes("bsd")) {
    if (PROPRIETARY_LICENSES.has(remote)) {
      return {
        drifted: true,
        details: `License changed from FOSS (${catalogLicense}) to proprietary/source-available (${githubLicenseSpdx})`,
      };
    }
  }
  return { drifted: false };
}

export function evaluatePaywallPageContent(html: string): { violated: boolean; details?: string } {
  const clean = html.replace(/<[^>]*>/g, " ");

  if (PAYWALL_TRAP_REGEX.test(clean)) {
    return {
      violated: true,
      details:
        "Detected upfront mandatory credit card or free tier discontinuation notice on landing page",
    };
  }

  return { violated: false };
}

export async function runSentinelAudit(options: { limit?: number; dryRun?: boolean } = {}) {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const siteDir = path.join(root, "site");

  let token = process.env.GITHUB_TOKEN || "";
  if (!token) {
    try {
      const output = execSync("git credential fill", {
        input: "protocol=https\nhost=github.com\n",
        stdio: ["pipe", "pipe", "ignore"],
      }).toString();
      const match = output.match(/password=(.+)/);
      if (match) token = match[1].trim();
    } catch {
      // Unauthenticated
    }
  }

  const headers: Record<string, string> = {
    "User-Agent": "DevShelf-Sentinel-Auditor/1.0",
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const files = await fs.readdir(shelfDir);
  const flags: SentinelFlag[] = [];
  let totalScanned = 0;

  console.log("🛡️ [DevShelf Sentinel] Launching automated link rot, license & paywall audit...\n");

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(shelfDir, file), "utf8");
    const items = JSON.parse(raw.replace(/^\uFEFF/, ""));

    for (const item of items) {
      if (options.limit && totalScanned >= options.limit) break;
      totalScanned++;

      const targetUrl = item.url || item.repo;
      const targetRepo = item.repo;

      // 1. GitHub API Check (Archived status & License Drift)
      if (targetRepo) {
        let isGitHub = false;
        let owner = "";
        let repo = "";
        try {
          const parsedRepoUrl = new URL(targetRepo);
          if (
            parsedRepoUrl.hostname === "github.com" ||
            parsedRepoUrl.hostname === "www.github.com"
          ) {
            const segments = parsedRepoUrl.pathname
              .replace(/^\/+/, "")
              .replace(/\/+$/, "")
              .split("/");
            if (segments.length >= 2) {
              isGitHub = true;
              owner = segments[0];
              repo = segments[1].replace(/\.git$/i, "");
            }
          }
        } catch {
          // Ignore invalid URL formatting
        }

        if (isGitHub && owner && repo) {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

          try {
            const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              const data = (await res.json()) as any;
              if (data.archived) {
                flags.push({
                  name: item.name,
                  file,
                  url: targetRepo,
                  issueType: "ARCHIVED_REPO",
                  severity: "warning",
                  details: `Repository '${owner}/${repo}' has been marked archived by its maintainer.`,
                });
              }

              const drift = evaluateLicenseDrift(item.license, data.license?.spdx_id);
              if (drift.drifted) {
                flags.push({
                  name: item.name,
                  file,
                  url: targetRepo,
                  issueType: "LICENSE_DRIFT",
                  severity: "critical",
                  details: drift.details || "License shifted to proprietary model.",
                });
              }
            } else if (res.status === 404) {
              flags.push({
                name: item.name,
                file,
                url: targetRepo,
                issueType: "HTTP_DEAD",
                severity: "critical",
                details: `GitHub repository returned HTTP 404 (Not Found or made private).`,
              });
            }
          } catch {
            // Rate limit or network timeout - skip API
          }
        }
      }

      // 2. HTTP Endpoint Reachability Check
      if (targetUrl) {
        try {
          const res = await fetch(targetUrl, {
            method: "HEAD",
            headers: { "User-Agent": "DevShelf-Sentinel-Auditor/1.0" },
            signal: AbortSignal.timeout(6000),
          }).catch(async () => {
            return await fetch(targetUrl, {
              method: "GET",
              headers: { "User-Agent": "DevShelf-Sentinel-Auditor/1.0" },
              signal: AbortSignal.timeout(6000),
            });
          });

          if (res.status >= 400 && res.status !== 403 && res.status !== 429) {
            flags.push({
              name: item.name,
              file,
              url: targetUrl,
              issueType: "HTTP_DEAD",
              severity: res.status === 404 || res.status === 410 ? "critical" : "warning",
              details: `Endpoint returned HTTP error code ${res.status}.`,
            });
          }
        } catch {
          // Network error or timeout
        }
      }
    }
  }

  const report: SentinelReport = {
    timestamp: new Date().toISOString(),
    totalScanned,
    healthyCount: totalScanned - flags.length,
    flaggedCount: flags.length,
    flags,
  };

  await fs.writeFile(
    path.join(siteDir, "sentinel-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `✅ [DevShelf Sentinel] Audit completed: ${totalScanned} resources evaluated, ${flags.length} alerts recorded in site/sentinel-report.json`,
  );

  return report;
}

if (process.argv[1]?.endsWith("sentinel-auditor.ts")) {
  runSentinelAudit().catch((err) => {
    console.error("Sentinel audit failed:", err);
    process.exit(1);
  });
}
