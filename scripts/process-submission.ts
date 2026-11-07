import fs from "node:fs/promises";
import path from "node:path";

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
  if (combined.includes("testing") || combined.includes("qa")) {
    return "testing-qa.json";
  }
  if (
    combined.includes("api") ||
    combined.includes("rest") ||
    combined.includes("graphql") ||
    Boolean(formData["api name"]) ||
    Boolean(formData["api website or documentation url"]) ||
    Boolean(formData["authentication required"]) ||
    Boolean(formData["cors support (usable from browser)"]) ||
    Boolean(formData["free tier rate limit"])
  ) {
    return "apis.json";
  }
  if (combined.includes("cloud") || combined.includes("hosting") || combined.includes("database")) {
    return "free-cloud.json";
  }
  if (
    combined.includes("ai") ||
    combined.includes("llm") ||
    combined.includes("agent") ||
    combined.includes("gpt")
  ) {
    return "ai-tools.json";
  }
  if (combined.includes("perk") || combined.includes("discount") || combined.includes("student")) {
    return "perks.json";
  }
  if (
    combined.includes("boilerplate") ||
    combined.includes("starter") ||
    combined.includes("template")
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

  // Check if issue has a pre-validated JSON block
  const embedded = extractEmbeddedJson(issueBody);
  const formData = parseFormBody(issueBody);

  const name = (
    (embedded?.name as string) ||
    formData["resource name"] ||
    formData["project name"] ||
    formData["tool name"] ||
    formData["api name"] ||
    formData.name ||
    ""
  ).trim();

  const rawUrl = (
    (embedded?.url as string) ||
    (embedded?.repo as string) ||
    formData["website / repo"] ||
    formData.website ||
    formData["github repository url"] ||
    formData["repository url"] ||
    formData["api website or documentation url"] ||
    formData["repo url"] ||
    formData.url ||
    formData.repo ||
    formData["github url"] ||
    ""
  ).trim();

  const cleanUrl = rawUrl
    .replace(/^-\s*website:\s*/i, "")
    .replace(/^-\s*repo:\s*/i, "")
    .trim()
    .replace(/\/+$/, "");

  let description = (
    (embedded?.description as string) ||
    formData.description ||
    formData["short description (1-2 sentences)"] ||
    formData["short description"] ||
    ""
  ).trim();

  if (description.length > 300) {
    description = `${description.slice(0, 297).replace(/\s+\S*$/, "")}...`;
  }

  const category = (
    (embedded?.category as string) ||
    formData.category ||
    formData["target shelf"] ||
    formData.shelf ||
    "CLI & Developer Productivity"
  ).trim();

  const targetShelf = (
    formData["target shelf"] ||
    (embedded?.section as string) ||
    formData.shelf ||
    ""
  ).trim();

  if (!name || !cleanUrl || !description) {
    throw new Error(
      `Missing required fields for submission. Extracted name='${name}', url='${cleanUrl}', description length=${description.length}`,
    );
  }

  // Reachability check
  const isLive = await verifyUrl(cleanUrl);
  if (!isLive) {
    console.warn(
      `⚠️ Warning: URL did not respond to automated probe, continuing submission: ${cleanUrl}`,
    );
  }

  const targetFile = resolveTargetFile(category, targetShelf, formData);
  const filePath = path.join(shelfDir, targetFile);
  const rawContent = await fs.readFile(filePath, "utf8");
  const list: CatalogItem[] = JSON.parse(rawContent.replace(/^\uFEFF/, ""));

  // Check duplicate
  const isDuplicate = list.some(
    (item) =>
      item.name.toLowerCase() === name.toLowerCase() ||
      (item.url && item.url.toLowerCase().replace(/\/+$/, "") === cleanUrl.toLowerCase()) ||
      (item.repo && item.repo.toLowerCase().replace(/\/+$/, "") === cleanUrl.toLowerCase()),
  );

  if (isDuplicate) {
    console.log(`Resource '${name}' or URL '${cleanUrl}' is already listed in ${targetFile}.`);
    return;
  }

  const isApiShelf = targetFile === "apis.json";
  const item: CatalogItem = {
    name,
    category,
    description,
  };

  if (isApiShelf) {
    item.url = cleanUrl;
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
    item.https = cleanUrl.startsWith("https://");
  } else {
    // For tools and frameworks, supply repo or url
    let isRepoHost = false;
    try {
      const parsed = new URL(cleanUrl);
      const host = parsed.hostname.toLowerCase();
      isRepoHost =
        host === "github.com" ||
        host.endsWith(".github.com") ||
        host === "gitlab.com" ||
        host.endsWith(".gitlab.com") ||
        host === "bitbucket.org" ||
        host.endsWith(".bitbucket.org");
    } catch {
      isRepoHost = false;
    }

    if (isRepoHost) {
      item.repo = cleanUrl;
    } else {
      item.repo = cleanUrl;
      item.url = cleanUrl;
    }
    item.language =
      (embedded?.language as string) ||
      formData["primary language / stack"] ||
      formData.language ||
      formData.stack ||
      "TypeScript";
    item.license =
      (embedded?.license as string) || formData["open source license"] || formData.license || "MIT";
    item.featured = Boolean(embedded?.featured ?? false);
  }

  if (embedded?.freeTier || formData["free tier"]) {
    item.freeTier = (embedded?.freeTier as string) || formData["free tier"];
  }

  if (Array.isArray(embedded?.statusTags)) {
    item.statusTags = embedded.statusTags as string[];
  } else if (formData["status tags"]) {
    item.statusTags = formData["status tags"].split(",").map((t) => t.trim());
  }

  list.push(item);
  await fs.writeFile(filePath, `${JSON.stringify(list, null, 2)}\n`, "utf8");
  console.log(`✅ Successfully processed community submission: '${name}' into ${targetFile}`);
}

run().catch((err) => {
  console.warn("⚠️ Submission processing notice:", err.message);
  process.exit(0);
});
