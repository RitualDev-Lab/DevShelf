import fs from "node:fs/promises";
import path from "node:path";
import { evaluateBinaryTrustPolicy } from "./binary-trust-policy.js";
import { findDuplicatesInCatalog, normalizeCanonicalUrl } from "./fuzzy-duplicate-detector.js";

interface CatalogItem {
  name: string;
  url?: string;
  repo?: string;
  category: string;
  description: string;
  language?: string;
  license?: string;
  auth?: string;
  cors?: string;
  rateLimit?: string;
  freeTier?: string;
  statusTags?: string[];
  tags?: string[];
  nativeBinary?: boolean;
  codeSigned?: boolean;
  featured?: boolean;
  https?: boolean;
  [key: string]: unknown;
}

function extractEmbeddedJson(text: string): Record<string, unknown> | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch {
      // Ignore parse failure, fallback to form parsing
    }
  }
  return null;
}

function parseFormBody(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = body.split("\n");
  let currentKey = "";
  let currentVal: string[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (currentKey) {
        sections[currentKey.toLowerCase()] = currentVal.join("\n").trim();
      }
      currentKey = line.replace(/^###\s+/, "").trim();
      currentVal = [];
    } else {
      currentVal.push(line);
    }
  }
  if (currentKey) {
    sections[currentKey.toLowerCase()] = currentVal.join("\n").trim();
  }
  return sections;
}

function resolveTargetFile(
  category: string,
  targetShelf = "",
  formData: Record<string, string> = {},
): string {
  const combined = `${targetShelf} ${category}`.toLowerCase();

  if (
    combined.includes("cli-tools") ||
    combined.includes("terminal") ||
    combined.includes("cli utility")
  ) {
    return "cli-tools.json";
  }
  if (
    combined.includes("ai-tools") ||
    combined.includes("mcp") ||
    combined.includes("local llm") ||
    combined.includes("ai agent")
  ) {
    return "ai-tools.json";
  }
  if (
    combined.includes("apis.json") ||
    combined.includes("public api") ||
    combined.includes("rest") ||
    combined.includes("graphql") ||
    Boolean(formData["api name"]) ||
    Boolean(formData["api website or documentation url"])
  ) {
    return "apis.json";
  }
  if (combined.includes("testing-qa") || combined.includes("testing") || combined.includes("qa")) {
    return "testing-qa.json";
  }
  if (
    combined.includes("free-cloud") ||
    combined.includes("cloud") ||
    combined.includes("hosting") ||
    combined.includes("database")
  ) {
    return "free-cloud.json";
  }
  if (
    combined.includes("contributors-wanted") ||
    combined.includes("contributor") ||
    combined.includes("matchmaker")
  ) {
    return "contributors-wanted.json";
  }
  if (combined.includes("perks") || combined.includes("discount") || combined.includes("deal")) {
    return "perks.json";
  }
  if (
    combined.includes("boilerplates") ||
    combined.includes("boilerplate") ||
    combined.includes("starter")
  ) {
    return "boilerplates.json";
  }

  return "cli-tools.json";
}

async function verifyUrl(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(urlStr, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "DevShelf-Validator/1.0" },
    }).catch(async () => {
      // Fallback to GET if HEAD is disallowed
      return await fetch(urlStr, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "DevShelf-Validator/1.0" },
      });
    });
    clearTimeout(timeout);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function run() {
  const issueBody = process.env.ISSUE_BODY;
  const issueLabels = (process.env.ISSUE_LABELS || "")
    .split(",")
    .map((l) => l.trim().toLowerCase());

  if (!issueBody) {
    console.error("Missing ISSUE_BODY environment variable.");
    process.exit(1);
  }

  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");

  // Check if issue has a pre-validated JSON block or issue form
  const embedded = extractEmbeddedJson(issueBody);
  const formData = parseFormBody(issueBody);

  const name = (
    (embedded?.name as string) ||
    formData["tool or project name"] ||
    formData["resource name"] ||
    formData["project name"] ||
    formData["tool name"] ||
    formData["api name"] ||
    formData.name ||
    ""
  ).trim();

  const rawRepo = (
    (embedded?.repo as string) ||
    formData["github / gitlab repository url"] ||
    formData["github repository url"] ||
    formData["repository url"] ||
    formData["repo url"] ||
    formData.repo ||
    ""
  ).trim();

  const rawWebsite = (
    (embedded?.url as string) ||
    formData["project website or documentation url"] ||
    formData["website / repo"] ||
    formData.website ||
    formData["api website or documentation url"] ||
    formData.url ||
    ""
  ).trim();

  const cleanRepo = rawRepo ? normalizeCanonicalUrl(rawRepo.replace(/^-\s*repo:\s*/i, "")) : "";
  const cleanWebsite = rawWebsite
    ? normalizeCanonicalUrl(rawWebsite.replace(/^-\s*website:\s*/i, ""))
    : "";
  const primaryUrl = cleanWebsite || cleanRepo;

  let description = (
    (embedded?.description as string) ||
    formData["short description (1-2 sentences)"] ||
    formData["short description"] ||
    formData.description ||
    ""
  ).trim();

  if (description.length > 300) {
    description = `${description.slice(0, 297).replace(/\s+\S*$/, "")}...`;
  }

  const category = (
    (embedded?.category as string) ||
    formData["subcategory or tagline"] ||
    formData.category ||
    "CLI & Developer Productivity"
  ).trim();

  const targetShelf = (
    formData["target shelf category"] ||
    formData["target shelf"] ||
    (embedded?.section as string) ||
    formData.shelf ||
    ""
  ).trim();

  if (!name || (!cleanRepo && !cleanWebsite) || !description) {
    throw new Error(
      `Missing required fields for submission: extracted name='${name}', repo='${cleanRepo}', website='${cleanWebsite}', descLen=${description.length}`,
    );
  }

  // Reachability check
  const checkUrl = cleanWebsite || cleanRepo;
  const isLive = await verifyUrl(checkUrl);
  if (!isLive) {
    console.warn(`⚠️ Warning: URL did not respond with 2xx/3xx/4xx: ${checkUrl}`);
  }

  const targetFile = resolveTargetFile(category, targetShelf, formData);
  const filePath = path.join(shelfDir, targetFile);
  const rawContent = await fs.readFile(filePath, "utf8");
  const list: CatalogItem[] = JSON.parse(rawContent.replace(/^\uFEFF/, ""));

  // Duplicate Inspection across target shelf
  const dupResult = findDuplicatesInCatalog({ name, url: cleanWebsite, repo: cleanRepo }, list);
  if (dupResult.isDuplicate) {
    console.log(`⚠️ Duplicate detected: ${dupResult.reason}`);
    return;
  }

  const isApiShelf = targetFile === "apis.json";
  const item: CatalogItem = {
    name,
    category,
    description,
  };

  if (isApiShelf) {
    item.url = cleanWebsite || cleanRepo;
    item.auth =
      (embedded?.auth as string) ||
      formData["authentication required"] ||
      formData.auth ||
      "No Key";
    item.cors =
      (embedded?.cors as string) ||
      formData["cors support (usable from browser)"] ||
      formData.cors ||
      "Yes";
    item.rateLimit =
      (embedded?.rateLimit as string) ||
      formData["free tier rate limit"] ||
      formData.rateLimit ||
      "Unlimited";
    item.https = (cleanWebsite || cleanRepo).startsWith("https://");
  } else {
    item.repo = cleanRepo || cleanWebsite;
    if (cleanWebsite && cleanWebsite !== cleanRepo) {
      item.url = cleanWebsite;
    }
    item.language =
      (embedded?.language as string) ||
      formData["primary programming language / runtime"] ||
      formData["primary language / stack"] ||
      formData.language ||
      "TypeScript";
    item.license =
      (embedded?.license as string) || formData["open source license"] || formData.license || "MIT";
    item.featured = false;
  }

  // Native binary SEC-06 flag
  const nativeBinaryAnswer = (
    formData["native os executable distribution (sec-06)"] ||
    formData["native binary"] ||
    ""
  ).toLowerCase();

  if (nativeBinaryAnswer.includes("yes")) {
    item.nativeBinary = true;
    item.codeSigned = nativeBinaryAnswer.includes("code signed");
  }

  // Tags
  const rawTags =
    (embedded?.tags as string[]) ||
    (formData["search tags (comma-separated)"] || formData.tags || "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

  if (Array.isArray(rawTags) && rawTags.length > 0) {
    item.tags = [...new Set(rawTags)];
  }

  // Binary trust evaluation
  const evalResult = evaluateBinaryTrustPolicy(item);
  if (!evalResult.allowedVerifiedBadge && item.nativeBinary && !item.codeSigned) {
    item.statusTags = ["[UNVERIFIED BINARY - UNSIGNED]"];
  }

  list.push(item);
  await fs.writeFile(filePath, `${JSON.stringify(list, null, 2)}\n`, "utf8");
  console.log(`✅ Successfully processed community submission: '${name}' into ${targetFile}`);
}

run().catch((err) => {
  console.warn("⚠️ Submission processing notice:", err.message);
  process.exit(0);
});
