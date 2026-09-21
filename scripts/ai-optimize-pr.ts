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
  auth?: string;
  freeTier?: string;
  statusTags?: string[];
  [key: string]: unknown;
}

interface ScrapedMetadata {
  title: string;
  description: string;
  ogDescription: string;
  keywords: string;
}

interface OptimizationResult {
  file: string;
  original: ResourceItem;
  scraped: ScrapedMetadata;
  suggestedDescription: string;
  suggestedShelf: string;
  suggestedTags: string[];
  optimizedJson: ResourceItem;
}

const VALID_SHELVES = [
  "apis",
  "ai-tools",
  "cli-tools",
  "testing-qa",
  "free-cloud",
  "boilerplates",
  "perks",
  "contributors-wanted",
];

async function scrapeMetadata(targetUrl: string): Promise<ScrapedMetadata> {
  const meta: ScrapedMetadata = {
    title: "",
    description: "",
    ogDescription: "",
    keywords: "",
  };

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DevShelf-Scraper/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
    });

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) meta.title = titleMatch[1].trim();

    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );
    if (descMatch) meta.description = descMatch[1].trim();

    const ogDescMatch = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    );
    if (ogDescMatch) meta.ogDescription = ogDescMatch[1].trim();

    const keywordsMatch = html.match(
      /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i,
    );
    if (keywordsMatch) meta.keywords = keywordsMatch[1].trim();
  } catch (_err) {
    // If scrape fails, use empty metadata
  }

  return meta;
}

async function callGeminiAi(
  item: ResourceItem,
  scraped: ScrapedMetadata,
  apiKey: string,
): Promise<{ description: string; shelf: string; tags: string[] } | null> {
  const prompt = `You are an expert open-source directory curator for DevShelf (devshelf.ritualdev.in).
A contributor submitted a developer tool/resource:
- Name: ${item.name}
- Current Description: ${item.description || "(none)"}
- URL: ${item.url || "(none)"}
- Repo: ${item.repo || "(none)"}
- Scraped Title: ${scraped.title}
- Scraped Meta Description: ${scraped.description || scraped.ogDescription}
- Scraped Keywords: ${scraped.keywords}

Please generate an optimized entry for DevShelf:
1. "description": A punchy, clean 1-sentence developer-focused summary of what the tool does and its killer feature (between 40 and 130 characters). Do NOT include marketing fluff like "best in class" or "revolutionary".
2. "shelf": Best target shelf category from this exact list: ["apis", "ai-tools", "cli-tools", "testing-qa", "free-cloud", "boilerplates", "perks", "contributors-wanted"].
3. "tags": An array of appropriate structural status tags selected strictly from: ["[No Auth Required]", "[Self-Hostable]", "[100% Free Tier]", "[100% Offline-Friendly]", "[Rate-Limited]"].

Respond strictly with valid JSON only in this exact format:
{
  "description": "...",
  "shelf": "...",
  "tags": ["..."]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
      },
    );

    if (res.ok) {
      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          description: parsed.description || item.description,
          shelf: VALID_SHELVES.includes(parsed.shelf) ? parsed.shelf : item.category || "apis",
          tags: Array.isArray(parsed.tags) ? parsed.tags : ["[100% Free Tier]"],
        };
      }
    }
  } catch (_err) {
    // Fall back to heuristic
  }

  return null;
}

function heuristicOptimize(
  item: ResourceItem,
  scraped: ScrapedMetadata,
): { description: string; shelf: string; tags: string[] } {
  let desc = item.description || "";
  if (desc.length < 25 && (scraped.description || scraped.ogDescription)) {
    desc = (scraped.description || scraped.ogDescription).slice(0, 140).trim();
  }
  if (!desc) {
    desc = `${item.name} - Open-source developer utility and developer resource.`;
  }

  const combined = `${item.name} ${desc} ${scraped.keywords} ${scraped.title}`.toLowerCase();
  let shelf = item.category || "apis";

  if (
    combined.includes("ai") ||
    combined.includes("llm") ||
    combined.includes("agent") ||
    combined.includes("gpt")
  ) {
    shelf = "ai-tools";
  } else if (
    combined.includes("cli") ||
    combined.includes("terminal") ||
    combined.includes("command line")
  ) {
    shelf = "cli-tools";
  } else if (
    combined.includes("test") ||
    combined.includes("mock") ||
    combined.includes("qa") ||
    combined.includes("cypress")
  ) {
    shelf = "testing-qa";
  } else if (
    combined.includes("cloud") ||
    combined.includes("hosting") ||
    combined.includes("serverless")
  ) {
    shelf = "free-cloud";
  } else if (
    combined.includes("boilerplate") ||
    combined.includes("template") ||
    combined.includes("starter")
  ) {
    shelf = "boilerplates";
  }

  const tags: string[] = ["[100% Free Tier]"];
  if (combined.includes("offline") || combined.includes("local"))
    tags.push("[100% Offline-Friendly]");
  if (combined.includes("self-host") || combined.includes("docker") || item.repo)
    tags.push("[Self-Hostable]");
  if (item.auth === "No Key" || combined.includes("no key") || combined.includes("no auth")) {
    tags.push("[No Auth Required]");
  }

  return { description: desc, shelf, tags: [...new Set(tags)] };
}

function getChangedOrNewItems(shelfDir: string): { file: string; item: ResourceItem }[] {
  try {
    const baseRef = process.env.GITHUB_BASE_REF || "main";
    let diffCmd = `git diff --name-only origin/${baseRef}...HEAD`;
    try {
      execSync(`git rev-parse --verify origin/${baseRef}`, { stdio: "ignore" });
    } catch {
      diffCmd = "git diff --name-only HEAD~1 HEAD";
    }

    const output = execSync(diffCmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const changedFiles = output
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.startsWith("shelf/") && f.endsWith(".json"));

    const result: { file: string; item: ResourceItem }[] = [];

    for (const f of changedFiles) {
      const fileName = path.basename(f);
      try {
        const fullPath = path.join(shelfDir, fileName);
        const curContent = execSync(`git show HEAD:${f}`, { encoding: "utf8" });
        const curItems: ResourceItem[] = JSON.parse(curContent.replace(/^\uFEFF/, ""));

        let baseItems: ResourceItem[] = [];
        try {
          const baseContent = execSync(`git show origin/${baseRef}:${f}`, { encoding: "utf8" });
          baseItems = JSON.parse(baseContent.replace(/^\uFEFF/, ""));
        } catch {
          baseItems = [];
        }

        const baseNames = new Set(baseItems.map((i) => i.name.toLowerCase().trim()));

        for (const it of curItems) {
          if (!baseNames.has(it.name.toLowerCase().trim())) {
            result.push({ file: fileName, item: it });
          }
        }
      } catch {
        // Fallback
      }
    }

    return result;
  } catch {
    return [];
  }
}

async function runAiOptimizer() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const apiKey = process.env.GEMINI_API_KEY || "";

  console.log("🤖 [DevShelf AI PR Optimizer] Analyzing candidate PR resources...\n");

  let candidateItems = getChangedOrNewItems(shelfDir);

  // If running locally without a git PR diff, take the first item of apis.json for demonstration
  if (candidateItems.length === 0) {
    try {
      const demoFile = "apis.json";
      const content = await fs.readFile(path.join(shelfDir, demoFile), "utf8");
      const items: ResourceItem[] = JSON.parse(content.replace(/^\uFEFF/, ""));
      if (items.length > 0) {
        candidateItems = [{ file: demoFile, item: items[0] }];
        console.log(
          `ℹ️ No active PR git diff detected. Analyzing sample resource for preview: '${items[0].name}'`,
        );
      }
    } catch {
      // Nothing to check
    }
  }

  if (candidateItems.length === 0) {
    console.log("Zero new resources detected in this PR. No AI optimization required.");
    return;
  }

  const results: OptimizationResult[] = [];

  for (const { file, item } of candidateItems) {
    const targetUrl = item.url || item.repo || "";
    console.log(`🔍 Inspecting '${item.name}' (${targetUrl})...`);

    const scraped = targetUrl
      ? await scrapeMetadata(targetUrl)
      : { title: "", description: "", ogDescription: "", keywords: "" };

    let aiOutput: { description: string; shelf: string; tags: string[] } | null = null;
    if (apiKey) {
      console.log("  ⚡ Running Gemini 2.5 Flash optimization...");
      aiOutput = await callGeminiAi(item, scraped, apiKey);
    }

    if (!aiOutput) {
      console.log("  ℹ️ Using intelligent heuristic optimization...");
      aiOutput = heuristicOptimize(item, scraped);
    }

    const optimizedJson: ResourceItem = {
      ...item,
      description: aiOutput.description,
      category: aiOutput.shelf,
      section: aiOutput.shelf,
      statusTags: aiOutput.tags,
    };

    results.push({
      file,
      original: item,
      scraped,
      suggestedDescription: aiOutput.description,
      suggestedShelf: aiOutput.shelf,
      suggestedTags: aiOutput.tags,
      optimizedJson,
    });
  }

  // Generate Markdown Suggestion Report
  const reportLines: string[] = [];
  reportLines.push("## 🤖 DevShelf AI-Driven PR Optimization & Tagging");
  reportLines.push(
    apiKey
      ? "> Powered by **Gemini 2.5 Flash** • Target metadata analyzed in real time."
      : "> Automated Heuristic Analyzer • Add `GEMINI_API_KEY` for LLM enhancement.",
  );
  reportLines.push("");

  for (const res of results) {
    reportLines.push(`### 📦 Resource: \`${res.original.name}\``);
    reportLines.push(`- **Target File**: \`shelf/${res.file}\``);
    reportLines.push(`- **Suggested Category**: \`${res.suggestedShelf}.json\``);
    reportLines.push(
      `- **Recommended Tags**: ${res.suggestedTags.map((t) => `\`${t}\``).join(" ")}`,
    );
    reportLines.push("");
    reportLines.push("#### 📝 Description Refinement");
    reportLines.push(`- **Original**: "${res.original.description || "*(none provided)*"}"`);
    reportLines.push(`- **✨ Suggested**: "${res.suggestedDescription}"`);
    reportLines.push("");
    reportLines.push("#### 📋 Ready-to-Merge JSON Block");
    reportLines.push("```json");
    reportLines.push(JSON.stringify(res.optimizedJson, null, 2));
    reportLines.push("```");
    reportLines.push("");
    reportLines.push("---");
  }

  reportLines.push(
    "💡 *Contributors can copy the JSON block above directly into their PR to ensure pristine catalog formatting.*",
  );

  const reportPath = path.join(root, ".ai-pr-optimization.md");
  const reportContent = reportLines.join("\n");
  await fs.writeFile(reportPath, reportContent, "utf8");

  console.log(reportContent);
  console.log("\n🎉 AI PR optimization report generated at .ai-pr-optimization.md");
}

runAiOptimizer().catch((err) => {
  console.error("AI PR Optimizer error:", err);
  process.exit(1);
});
