import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

interface ResourceItem {
  name: string;
  url?: string;
  repo?: string;
  description: string;
  category?: string;
  section?: string;
  type?: string;
  language?: string;
  license?: string;
  auth?: string;
  freeTier?: string;
  statusTags?: string[];
  [key: string]: unknown;
}

interface ValidationError {
  file: string;
  item: string;
  field: string;
  issue: string;
}

interface DuplicateMatch {
  newItem: string;
  newUrl: string;
  existingItem: string;
  existingFile: string;
  existingUrl: string;
  matchType: "exact_name" | "exact_url" | "same_domain";
}

function normalizeUrl(rawUrl: string): { normalized: string; domain: string } {
  try {
    const parsed = new URL(rawUrl);
    const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.replace(/\/$/, "");
    return {
      normalized: `${domain}${pathname}`,
      domain,
    };
  } catch {
    return { normalized: rawUrl.toLowerCase().trim(), domain: "" };
  }
}

function isValidUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "test.com" ||
      host === "example.com"
    ) {
      return false;
    }
    return host.includes(".");
  } catch {
    return false;
  }
}

async function loadExistingRegistry(shelfDir: string): Promise<{
  allExisting: Map<string, { file: string; item: ResourceItem }>;
  domainIndex: Map<string, { file: string; item: ResourceItem }>;
}> {
  const allExisting = new Map<string, { file: string; item: ResourceItem }>();
  const domainIndex = new Map<string, { file: string; item: ResourceItem }>();

  const files = await fs.readdir(shelfDir);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    // contributors-wanted.json contains projects seeking contributors from other shelves
    if (file === "contributors-wanted.json") continue;

    try {
      const content = await fs.readFile(path.join(shelfDir, file), "utf8");
      const items: ResourceItem[] = JSON.parse(content.replace(/^\uFEFF/, ""));
      for (const item of items) {
        allExisting.set(item.name.toLowerCase().trim(), { file, item });
        const targetUrl = item.url || item.repo;
        if (targetUrl) {
          const { domain } = normalizeUrl(targetUrl);
          if (domain && !["github.com", "gitlab.com", "bitbucket.org"].includes(domain)) {
            domainIndex.set(domain, { file, item });
          }
        }
      }
    } catch {
      // Ignore reading error if file is malformed
    }
  }

  return { allExisting, domainIndex };
}

function getChangedShelfFiles(shelfDir: string): string[] {
  try {
    const baseRef = process.env.GITHUB_BASE_REF || "main";
    let diffCommand = `git diff --name-only origin/${baseRef}...HEAD`;
    try {
      execSync(`git rev-parse --verify origin/${baseRef}`, { stdio: "ignore" });
    } catch {
      diffCommand = "git diff --name-only HEAD~1 HEAD";
    }

    const output = execSync(diffCommand, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const changed = output
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.startsWith("shelf/") && f.endsWith(".json"));

    if (changed.length > 0) {
      return [...new Set(changed.map((f) => path.basename(f)))];
    }
  } catch {
    // If git diff fails (e.g. fresh clone or local test), return empty to fallback to full check
  }

  return [];
}

async function runPrValidation() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const errors: ValidationError[] = [];
  const duplicates: DuplicateMatch[] = [];

  console.log("🔍 [DevShelf PR Validator] Initializing schema & duplicate inspection...\n");

  const { allExisting, domainIndex } = await loadExistingRegistry(shelfDir);
  const changedFiles = getChangedShelfFiles(shelfDir);

  const filesToInspect =
    changedFiles.length > 0
      ? changedFiles
      : (await fs.readdir(shelfDir)).filter((f) => f.endsWith(".json"));

  console.log(`📁 Inspecting ${filesToInspect.length} shelf file(s): ${filesToInspect.join(", ")}`);

  let totalItemsChecked = 0;

  for (const file of filesToInspect) {
    const filePath = path.join(shelfDir, file);
    let items: ResourceItem[];

    try {
      const raw = await fs.readFile(filePath, "utf8");
      items = JSON.parse(raw.replace(/^\uFEFF/, ""));
      if (!Array.isArray(items)) {
        errors.push({
          file,
          item: "ROOT",
          field: "structure",
          issue: "File must be a valid JSON array.",
        });
        continue;
      }
    } catch (err: unknown) {
      errors.push({
        file,
        item: "ROOT",
        field: "syntax",
        issue: `JSON parsing failed: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const seenInFile = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      totalItemsChecked++;
      const itemName = item.name?.trim() || `Item #${i + 1}`;

      // 1. Required Field: Name
      if (!item.name || typeof item.name !== "string" || item.name.trim().length === 0) {
        errors.push({
          file,
          item: itemName,
          field: "name",
          issue: "Missing required 'name' field.",
        });
      }

      // 2. Required Field: URL or Repo
      const targetUrl = item.url || item.repo;
      if (!targetUrl) {
        errors.push({
          file,
          item: itemName,
          field: "url/repo",
          issue: "Item must provide either 'url' or 'repo'.",
        });
      } else {
        if (!isValidUrl(targetUrl)) {
          errors.push({
            file,
            item: itemName,
            field: item.url ? "url" : "repo",
            issue: `Invalid URL format: '${targetUrl}'. Must be a valid public HTTP/HTTPS URL.`,
          });
        }
      }

      if (item.repo && !isValidUrl(item.repo)) {
        errors.push({
          file,
          item: itemName,
          field: "repo",
          issue: `Invalid repository URL format: '${item.repo}'.`,
        });
      }

      // 3. Required Field: Description Quality Check
      if (!item.description || typeof item.description !== "string") {
        errors.push({
          file,
          item: itemName,
          field: "description",
          issue: "Missing required 'description' field.",
        });
      } else {
        const desc = item.description.trim();
        if (desc.length < 15) {
          errors.push({
            file,
            item: itemName,
            field: "description",
            issue: `Description is too short (${desc.length} chars). Minimum 15 characters required.`,
          });
        }
        if (desc.length > 300) {
          errors.push({
            file,
            item: itemName,
            field: "description",
            issue: `Description is too long (${desc.length} chars). Maximum 300 characters allowed.`,
          });
        }
        if (/^(todo|tbd|test|placeholder|lorem ipsum)/i.test(desc)) {
          errors.push({
            file,
            item: itemName,
            field: "description",
            issue: "Description contains placeholder or incomplete text.",
          });
        }
      }

      // 4. In-file duplicate check
      const lowerName = itemName.toLowerCase();
      if (seenInFile.has(lowerName)) {
        errors.push({
          file,
          item: itemName,
          field: "name",
          issue: `Duplicate entry '${itemName}' occurs multiple times in ${file}.`,
        });
      }
      seenInFile.add(lowerName);

      // 5. Cross-registry Duplicate Detection
      // Skip duplicate checks if validating contributors-wanted.json (which intentionally matches other categories)
      if (file !== "contributors-wanted.json" && targetUrl) {
        const { domain } = normalizeUrl(targetUrl);

        // Check if another resource already exists with this exact name in a DIFFERENT file
        const existingByName = allExisting.get(lowerName);
        if (existingByName && existingByName.file !== file) {
          duplicates.push({
            newItem: itemName,
            newUrl: targetUrl,
            existingItem: existingByName.item.name,
            existingFile: existingByName.file,
            existingUrl: existingByName.item.url || existingByName.item.repo || "",
            matchType: "exact_name",
          });
        }

        // Check domain collision (excluding github/gitlab)
        if (domain && !["github.com", "gitlab.com", "bitbucket.org"].includes(domain)) {
          const existingByDomain = domainIndex.get(domain);
          if (
            existingByDomain &&
            existingByDomain.file !== file &&
            existingByDomain.item.name.toLowerCase() !== lowerName
          ) {
            duplicates.push({
              newItem: itemName,
              newUrl: targetUrl,
              existingItem: existingByDomain.item.name,
              existingFile: existingByDomain.file,
              existingUrl: existingByDomain.item.url || existingByDomain.item.repo || "",
              matchType: "same_domain",
            });
          }
        }
      }
    }
  }

  // Generate Report
  const passed = errors.length === 0 && duplicates.length === 0;

  const reportLines: string[] = [];
  reportLines.push("## 🛡️ DevShelf PR Validation Report\n");

  if (passed) {
    reportLines.push("### ✅ All Schema Checks & Duplicate Audits Passed!");
    reportLines.push(`- **Items Inspected**: ${totalItemsChecked}`);
    reportLines.push(`- **Files Checked**: ${filesToInspect.length}`);
    reportLines.push("- **Syntax & Schema**: 100% Valid");
    reportLines.push("- **Duplicate Detector**: 0 Collisions");
  } else {
    reportLines.push("### ⚠️ Action Required: Formatting or Duplicate Issues Detected\n");
    reportLines.push(
      "Please review and address the findings below before this PR can be merged:\n",
    );

    if (errors.length > 0) {
      reportLines.push("#### ❌ Schema & Validation Errors");
      reportLines.push("| File | Resource | Field | Issue |");
      reportLines.push("|---|---|---|---|");
      for (const e of errors) {
        reportLines.push(`| \`${e.file}\` | **${e.item}** | \`${e.field}\` | ${e.issue} |`);
      }
      reportLines.push("");
    }

    if (duplicates.length > 0) {
      reportLines.push("#### 🔄 Duplicate Detection Warnings");
      reportLines.push(
        "| Incoming Resource | Target URL | Existing Match | Existing File | Match Type |",
      );
      reportLines.push("|---|---|---|---|---|");
      for (const d of duplicates) {
        reportLines.push(
          `| **${d.newItem}** | [Link](${d.newUrl}) | **${d.existingItem}** | \`${d.existingFile}\` | \`${d.matchType}\` |`,
        );
      }
      reportLines.push(
        "\n> **Note**: If this tool is an entirely new separate product hosted on the same domain, please leave a comment explaining why.",
      );
      reportLines.push("");
    }

    reportLines.push("---");
    reportLines.push(
      "💡 *Tip: You can use the [DevShelf Contribution Wizard](https://devshelf.ritualdev.in) to generate error-free JSON.*",
    );
  }

  const reportContent = reportLines.join("\n");
  const reportPath = path.join(root, ".pr-validation-report.md");
  await fs.writeFile(reportPath, reportContent, "utf8");

  console.log(reportContent);

  if (!passed) {
    console.error(
      `\n❌ PR validation failed with ${errors.length} error(s) and ${duplicates.length} duplicate(s).`,
    );
    process.exit(1);
  } else {
    console.log("\n🎉 PR validation passed cleanly!");
  }
}

runPrValidation().catch((err) => {
  console.error("PR validation runner crashed:", err);
  process.exit(1);
});
