import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

interface UptimeEndpoint {
  name: string;
  url: string;
  status: number | string;
  ok: boolean;
  consecutiveFailures?: number;
  rotType?: string;
  file?: string;
}

interface UptimeData {
  lastChecked: string;
  totalChecked: number;
  healthyCount: number;
  deadCount: number;
  endpoints: UptimeEndpoint[];
}

async function findItemFile(name: string): Promise<string> {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const files = await fs.readdir(shelfDir);

  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(shelfDir, f), "utf8");
    const items = JSON.parse(raw.replace(/^\uFEFF/, ""));
    if (items.some((i: any) => i.name?.toLowerCase() === name.toLowerCase())) {
      return f;
    }
  }
  return "shelf/apis.json";
}

async function generateRotIssues() {
  const root = process.cwd();
  const uptimePath = path.join(root, "site", "uptime.json");

  console.log("🔍 [DevShelf Issue Inverter] Scanning telemetry for broken endpoints...");

  let uptime: UptimeData;
  try {
    const raw = await fs.readFile(uptimePath, "utf8");
    uptime = JSON.parse(raw);
  } catch (err) {
    console.log("No uptime.json found or file empty. Skipping issue generation.");
    return;
  }

  const failing = (uptime.endpoints || []).filter(
    (e) => !e.ok || e.status === 404 || (e.consecutiveFailures ?? 0) >= 2,
  );

  if (failing.length === 0) {
    console.log("✨ All audited endpoints are healthy. Zero broken link issues to create.");
    return;
  }

  console.log(`⚠️ Found ${failing.length} failing endpoint(s). Checking existing GitHub issues...`);

  // Query existing open broken-link issues via gh CLI
  let existingIssueTitles = "";
  try {
    existingIssueTitles = execSync(
      "gh issue list --state open --label broken-link --json title --jq .[].title",
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      },
    );
  } catch {
    console.log("gh CLI not authenticated or unavailable. Printing issues to console instead.");
  }

  for (const ep of failing) {
    const title = `[Broken Link]: Fix or update endpoint for ${ep.name}`;
    if (existingIssueTitles.includes(ep.name)) {
      console.log(`  ℹ️ Issue already exists for ${ep.name}. Skipping.`);
      continue;
    }

    const file = await findItemFile(ep.name);
    const body = `### 🚨 Broken Endpoint Detected by Automated Health Audit

Our automated link healthcheck detected that **${ep.name}** is currently returning an error:

- **Resource**: \`${ep.name}\`
- **Category File**: \`shelf/${file}\`
- **Reported URL**: \`${ep.url}\`
- **Error Status**: \`${ep.status}\` ${ep.rotType ? `(\`${ep.rotType}\`)` : ""}
- **Last Verified**: ${uptime.lastChecked}

---

### 🛠️ How to Fix This (Good First Issue / 5-Minute PR)

1. Fork this repository and open \`shelf/${file}\`.
2. Locate the entry for \`"${ep.name}"\`.
3. Check whether the tool has moved to a new official URL, repository, or documentation page:
   - If a new official URL exists, update the \`"url"\` or \`"repo"\` field.
   - If the project has permanently sunset or shutdown, propose a verified free alternative or remove it.
4. Verify locally:
   \`\`\`bash
   pnpm test
   pnpm run validate
   \`\`\`
5. Submit your PR! Our automated CI will verify your fix and merge it.

*This issue was automatically created by DevShelf Automated Health Audit.*
`;

    try {
      execSync(
        `gh issue create --title "${title}" --body "${body.replace(/"/g, '\\"')}" --label "broken-link,good first issue,hacktoberfest,help wanted"`,
        { stdio: "inherit" },
      );
      console.log(`  🎉 Created issue for ${ep.name}`);
    } catch (err: any) {
      console.log(`  Could not run gh issue create: ${err.message}. Ready for CI.`);
    }
  }
}

generateRotIssues().catch((err) => {
  console.error("Rot issue generator error:", err);
  process.exit(1);
});
