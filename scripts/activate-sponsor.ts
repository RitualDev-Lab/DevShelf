import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SHELF_DIR = path.join(ROOT_DIR, "shelf");
const DATA_DIR = path.join(ROOT_DIR, "data");

export type ShelfCategory = "ai" | "cli" | "apis" | "cloud" | "testing" | "boilerplates" | "perks";

export type SponsorTier = "starter" | "mcpPro" | "enterprise";

export interface ActivateSponsorOptions {
  name: string;
  url: string;
  category?: ShelfCategory;
  pitch?: string;
  alt?: string;
  tier?: SponsorTier;
  patronName?: string;
  github?: string;
  amount?: number;
  comment?: string;
  dryRun?: boolean;
  skipBuild?: boolean;
}

export interface ActivationResult {
  success: boolean;
  toolName: string;
  category: ShelfCategory;
  tier: SponsorTier;
  shelfFile: string;
  isNewTool: boolean;
  item: Record<string, unknown>;
  patron: Record<string, unknown>;
  dryRun: boolean;
}

const CATEGORY_MAP: Record<ShelfCategory, { file: string; defaultCategory: string }> = {
  ai: { file: "ai-tools.json", defaultCategory: "AI Agent & Workflow Tools" },
  cli: { file: "cli-tools.json", defaultCategory: "CLI Utilities & Productivity" },
  apis: { file: "apis.json", defaultCategory: "Developer Tools & APIs" },
  cloud: { file: "free-cloud.json", defaultCategory: "Cloud Hosting & PaaS" },
  testing: { file: "testing-qa.json", defaultCategory: "Testing & QA Automation" },
  boilerplates: { file: "boilerplates.json", defaultCategory: "Fullstack Boilerplates" },
  perks: { file: "perks.json", defaultCategory: "Developer Credits & Startup Perks" },
};

const TIER_MAP: Record<
  SponsorTier,
  {
    defaultUSD: number;
    patronTier: "enterprise" | "gold" | "silver" | "bronze";
    sponsorTierLabel: string;
  }
> = {
  starter: {
    defaultUSD: 29,
    patronTier: "silver",
    sponsorTierLabel: "Verified Sponsor ★ (Starter)",
  },
  mcpPro: {
    defaultUSD: 99,
    patronTier: "gold",
    sponsorTierLabel: "Verified Sponsor ★ (MCP Pro)",
  },
  enterprise: {
    defaultUSD: 199,
    patronTier: "enterprise",
    sponsorTierLabel: "Verified Sponsor ★ (Enterprise Partner)",
  },
};

const ALL_SHELF_FILES = [
  "ai-tools.json",
  "cli-tools.json",
  "apis.json",
  "testing-qa.json",
  "free-cloud.json",
  "boilerplates.json",
  "perks.json",
  "contributors-wanted.json",
];

function normalizeUrl(u: string): string {
  try {
    const parsed = new URL(u);
    return `${parsed.hostname.replace(/^www\./, "").toLowerCase()}${parsed.pathname.replace(/\/$/, "").toLowerCase()}`;
  } catch {
    return String(u || "")
      .toLowerCase()
      .trim()
      .replace(/\/$/, "");
  }
}

/**
 * Activates a sponsored tool on DevShelf:
 * 1. Locates or creates the tool entry in the appropriate shelf/*.json file
 * 2. Tags the tool with featured: true and sponsorTier: "Verified Sponsor ★ ..."
 * 3. Appends/updates the sponsor ledger in data/sponsors.json with patron details & telemetry
 * 4. Triggers catalog & badge rebuild to maintain 100% sync
 */
export async function activateSponsor(options: ActivateSponsorOptions): Promise<ActivationResult> {
  const toolName = (options.name || "").trim();
  const toolUrl = (options.url || "").trim();

  if (!toolName) {
    throw new Error("Missing required option: --name <tool-name>");
  }
  if (!toolUrl) {
    throw new Error("Missing required option: --url <tool-url>");
  }

  const category: ShelfCategory =
    options.category && CATEGORY_MAP[options.category] ? options.category : "cli";
  const tier: SponsorTier = options.tier && TIER_MAP[options.tier] ? options.tier : "mcpPro";

  const categoryConfig = CATEGORY_MAP[category];
  const tierConfig = TIER_MAP[tier];
  const amountUSD =
    typeof options.amount === "number" && options.amount > 0
      ? options.amount
      : tierConfig.defaultUSD;

  const targetNormUrl = normalizeUrl(toolUrl);
  const targetNormName = toolName.toLowerCase();

  // Step 1: Search across all shelf files to find existing tool
  let foundFile: string | null = null;
  let foundIndex = -1;
  let foundShelfData: any[] = [];

  for (const file of ALL_SHELF_FILES) {
    const filePath = path.join(SHELF_DIR, file);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const items = JSON.parse(raw.replace(/^\uFEFF/, ""));
      if (Array.isArray(items)) {
        const idx = items.findIndex((it: any) => {
          if (!it || !it.name) return false;
          if (it.name.toLowerCase().trim() === targetNormName) return true;
          const itUrl = normalizeUrl(it.url || it.repo || "");
          if (itUrl && itUrl === targetNormUrl) return true;
          return false;
        });
        if (idx !== -1) {
          foundFile = file;
          foundIndex = idx;
          foundShelfData = items;
          break;
        }
      }
    } catch {
      // Continue search
    }
  }

  let finalItem: Record<string, unknown>;
  const isNewTool = foundIndex === -1;
  const targetShelfFile = foundFile || categoryConfig.file;
  const targetShelfPath = path.join(SHELF_DIR, targetShelfFile);

  if (!isNewTool) {
    // Update existing tool in place
    const existing = foundShelfData[foundIndex];
    existing.featured = true;
    existing.sponsorTier = tierConfig.sponsorTierLabel;
    if (options.pitch && options.pitch.trim().length >= 10) {
      existing.description = options.pitch.trim();
    }
    existing.verifiedZeroPaywall = true;
    existing.pricingVerifiedAt = new Date().toISOString();

    const tags = Array.isArray(existing.statusTags) ? existing.statusTags : [];
    if (!tags.includes("Verified Sponsor ★")) {
      tags.unshift("Verified Sponsor ★");
    }
    if (!tags.includes("Zero-Paywall")) {
      tags.push("Zero-Paywall");
    }
    existing.statusTags = tags;
    finalItem = existing;
  } else {
    // Load target shelf file and prepend new entry
    let targetItems: any[] = [];
    try {
      const raw = await fs.readFile(targetShelfPath, "utf8");
      targetItems = JSON.parse(raw.replace(/^\uFEFF/, ""));
    } catch {
      targetItems = [];
    }

    const defaultPitch = `${toolName} - Verified zero-paywall developer tooling and AI context integration.`;
    const pitch =
      options.pitch && options.pitch.trim().length >= 10 ? options.pitch.trim() : defaultPitch;

    if (category === "apis") {
      finalItem = {
        name: toolName,
        url: toolUrl,
        category: categoryConfig.defaultCategory,
        description: pitch,
        auth: "Free Key",
        rateLimit: "Generous Free Tier",
        https: toolUrl.startsWith("https://"),
        featured: true,
        sponsorTier: tierConfig.sponsorTierLabel,
        verifiedZeroPaywall: true,
        pricingVerifiedAt: new Date().toISOString(),
        statusTags: ["Verified Sponsor ★", "Zero-Paywall", "No Card Required"],
      };
    } else if (category === "cloud") {
      finalItem = {
        name: toolName,
        url: toolUrl,
        category: categoryConfig.defaultCategory,
        description: pitch,
        freeTier: "Generous perpetual free tier allowance",
        featured: true,
        sponsorTier: tierConfig.sponsorTierLabel,
        verifiedZeroPaywall: true,
        pricingVerifiedAt: new Date().toISOString(),
        statusTags: ["Verified Sponsor ★", "Zero-Paywall", "No Card Required"],
      };
    } else if (category === "boilerplates") {
      finalItem = {
        name: toolName,
        repo: toolUrl,
        category: categoryConfig.defaultCategory,
        description: pitch,
        techStack: "TypeScript, Tailwind, Node.js",
        deployUrl: toolUrl,
        freeTierCost: "100% Free on Free Tiers",
        featured: true,
        sponsorTier: tierConfig.sponsorTierLabel,
        verifiedZeroPaywall: true,
        pricingVerifiedAt: new Date().toISOString(),
        statusTags: ["Verified Sponsor ★", "Zero-Paywall"],
      };
    } else if (category === "perks") {
      finalItem = {
        name: toolName,
        url: toolUrl,
        category: categoryConfig.defaultCategory,
        description: pitch,
        perkValue: "Developer Plan Credits",
        eligibility: "All Developers",
        featured: true,
        sponsorTier: tierConfig.sponsorTierLabel,
        verifiedZeroPaywall: true,
        pricingVerifiedAt: new Date().toISOString(),
        statusTags: ["Verified Sponsor ★", "Zero-Paywall"],
      };
    } else {
      // Default tool schema (ai, cli, testing)
      finalItem = {
        name: toolName,
        repo: toolUrl,
        category: categoryConfig.defaultCategory,
        description: pitch,
        language: "TypeScript / Node.js",
        license: "MIT",
        featured: true,
        sponsorTier: tierConfig.sponsorTierLabel,
        verifiedZeroPaywall: true,
        pricingVerifiedAt: new Date().toISOString(),
        statusTags: ["Verified Sponsor ★", "Zero-Paywall", "No Card Required"],
      };
    }

    targetItems.unshift(finalItem);
    foundShelfData = targetItems;
  }

  // Step 2: Update data/sponsors.json
  const sponsorsJsonPath = path.join(DATA_DIR, "sponsors.json");
  let sponsorsData: any;
  try {
    const rawSponsors = await fs.readFile(sponsorsJsonPath, "utf8");
    sponsorsData = JSON.parse(rawSponsors);
  } catch {
    sponsorsData = {
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      stats: {
        totalPatrons: 0,
        totalContributedUSD: 0,
        totalContributedINR: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
      },
      patrons: [],
    };
  }

  const rawGithub = (options.github || "").trim().replace(/^@/, "");
  const cleanGithub = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(rawGithub)
    ? rawGithub
    : "";
  const patronName = (options.patronName || toolName).trim();
  const patronId = cleanGithub
    ? `patron-${cleanGithub.toLowerCase()}`
    : `patron-${toolName.toLowerCase().replace(/[^a-z0-9]/g, "") || Date.now()}`;

  const patronEntry: Record<string, unknown> = {
    id: patronId,
    rank: 1,
    name: patronName,
    github: cleanGithub || "ghost",
    avatar: cleanGithub ? `https://github.com/${cleanGithub}.png` : "https://github.com/ghost.png",
    url: toolUrl,
    amountUSD,
    amountINR: Math.round(amountUSD * 84),
    tier: tierConfig.patronTier,
    date: new Date().toISOString().split("T")[0],
    comment:
      (options.comment || "").trim() ||
      `Sponsoring DevShelf to feature ${toolName} across MCP coding queries and developer dossiers.`,
    badgeUrl: `https://devshelf.ritualdev.in/api/v1/badges/${tierConfig.patronTier}.svg`,
    toolName,
  };

  const existingPatronIdx = Array.isArray(sponsorsData.patrons)
    ? sponsorsData.patrons.findIndex(
        (p: any) =>
          p.id === patronId ||
          (cleanGithub && p.github && p.github.toLowerCase() === cleanGithub.toLowerCase()) ||
          p.name.toLowerCase() === patronName.toLowerCase(),
      )
    : -1;

  if (existingPatronIdx !== -1) {
    const existing = sponsorsData.patrons[existingPatronIdx];
    existing.amountUSD = Math.max(Number(existing.amountUSD) || 0, amountUSD);
    existing.amountINR = Math.round(existing.amountUSD * 84);
    existing.tier = tierConfig.patronTier;
    existing.url = toolUrl;
    existing.toolName = toolName;
    if (options.comment?.trim()) existing.comment = options.comment.trim();
  } else {
    if (!Array.isArray(sponsorsData.patrons)) sponsorsData.patrons = [];
    sponsorsData.patrons.unshift(patronEntry);
  }

  // Sort patrons by amountUSD descending and re-rank
  sponsorsData.patrons.sort((a: any, b: any) => (b.amountUSD || 0) - (a.amountUSD || 0));
  sponsorsData.patrons.forEach((p: any, idx: number) => {
    p.rank = idx + 1;
  });

  // Update stats
  sponsorsData.stats = {
    totalPatrons: sponsorsData.patrons.length,
    totalContributedUSD: sponsorsData.patrons.reduce(
      (sum: number, p: any) => sum + (Number(p.amountUSD) || 0),
      0,
    ),
    totalContributedINR: sponsorsData.patrons.reduce(
      (sum: number, p: any) => sum + (Number(p.amountINR) || (Number(p.amountUSD) || 0) * 84),
      0,
    ),
    goldCount: sponsorsData.patrons.filter((p: any) => p.tier === "gold").length,
    silverCount: sponsorsData.patrons.filter((p: any) => p.tier === "silver").length,
    bronzeCount: sponsorsData.patrons.filter((p: any) => p.tier === "bronze").length,
  };
  sponsorsData.updatedAt = new Date().toISOString();

  // Add to telemetry.featuredSponsorTools
  if (!sponsorsData.telemetry) sponsorsData.telemetry = {};
  if (!Array.isArray(sponsorsData.telemetry.featuredSponsorTools)) {
    sponsorsData.telemetry.featuredSponsorTools = [];
  }
  if (!sponsorsData.telemetry.featuredSponsorTools.includes(toolName)) {
    sponsorsData.telemetry.featuredSponsorTools.push(toolName);
  }

  const result: ActivationResult = {
    success: true,
    toolName,
    category,
    tier,
    shelfFile: targetShelfFile,
    isNewTool,
    item: finalItem,
    patron: patronEntry,
    dryRun: Boolean(options.dryRun),
  };

  if (options.dryRun) {
    return result;
  }

  // Write changes to disk
  await fs.writeFile(targetShelfPath, `${JSON.stringify(foundShelfData, null, 2)}\n`, "utf8");
  await fs.writeFile(sponsorsJsonPath, `${JSON.stringify(sponsorsData, null, 2)}\n`, "utf8");

  // Synchronize site, README, counts, badges, and SEO pages
  if (!options.skipBuild) {
    execSync("pnpm run build", {
      cwd: ROOT_DIR,
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    });
  }

  return result;
}

// CLI Execution Handler
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`
⚡ DevShelf Sponsor Instant Activation Engine
Usage:
  tsx scripts/activate-sponsor.ts [options]

Required Options:
  --name <string>         Tool or project name (e.g. "RowSafe")
  --url <string>          Product URL or GitHub repo (e.g. "https://github.com/RitualDev-Lab/RowSafe")

Additional Options:
  --category <string>     Category: ai | cli | apis | cloud | testing | boilerplates | perks (default: cli)
  --tier <string>         Sponsorship tier: starter | mcpPro | enterprise (default: mcpPro)
  --pitch <string>        1-line developer value pitch (max 160 chars)
  --alt <string>          Alternative to commercial tool (e.g. Postman, Supabase, Datadog)
  --patron-name <string>  Sponsor legal or display name (default: tool name)
  --github <string>       GitHub username/org handle for avatar and badges
  --amount <number>       Custom pledged USD amount (defaults: starter=$49, mcpPro=$149, enterprise=$299)
  --comment <string>      Custom quote for community Wall of Love
  --dry-run               Simulate and display proposed modifications without writing to disk
  --skip-build            Skip running 'pnpm run build' after writing files

Examples:
  tsx scripts/activate-sponsor.ts --name "CurlShot" --url "https://github.com/SergiuPogor/CurlShot" --category cli --tier mcpPro
  tsx scripts/activate-sponsor.ts --name "RowSafe" --url "https://github.com/RitualDev-Lab/RowSafe" --category cli --tier enterprise --patron-name "Dramex" --github "Dramex"
`);
    process.exit(0);
  }

  function getArg(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length) {
      return args[idx + 1];
    }
    return undefined;
  }

  const name = getArg("--name");
  const url = getArg("--url");
  const category = (getArg("--category") as ShelfCategory) || "cli";
  const tier = (getArg("--tier") as SponsorTier) || "mcpPro";
  const pitch = getArg("--pitch");
  const alt = getArg("--alt");
  const patronName = getArg("--patron-name");
  const github = getArg("--github");
  const amountStr = getArg("--amount");
  const amount = amountStr ? parseFloat(amountStr) : undefined;
  const comment = getArg("--comment");
  const dryRun = args.includes("--dry-run");
  const skipBuild = args.includes("--skip-build");

  if (!name || !url) {
    console.error("❌ Error: Both --name and --url are required.");
    process.exit(1);
  }

  console.log(`\n⚡ [DevShelf Activation] Initializing sponsorship ingestion for: ${name}...`);

  try {
    const result = await activateSponsor({
      name,
      url,
      category,
      tier,
      pitch,
      alt,
      patronName,
      github,
      amount,
      comment,
      dryRun,
      skipBuild,
    });

    console.log("\n=======================================================");
    console.log(`🎉 SUCCESS: ${result.toolName} Activated as ${result.tier} Sponsor!`);
    console.log("=======================================================");
    console.log(
      `• Target Shelf File:   shelf/${result.shelfFile} (${result.isNewTool ? "New Tool Created" : "Existing Tool Promoted"})`,
    );
    console.log(`• Featured Flag:       true (Tagged as: "${result.item.sponsorTier}")`);
    console.log(`• MCP AI Telemetry:    Injected into npx devshelf-mcp server recommendations`);
    console.log(`• Wall of Patrons:     Ranked in data/sponsors.json & site/sponsors.html`);
    console.log(
      `• Dry-Run Mode:        ${result.dryRun ? "YES (No files modified)" : "NO (Files synchronized)"}`,
    );
    console.log("\nEmbeddable README Badge Snippet:");
    const handle = (result.patron.github as string) || "verified";
    console.log(
      `[![DevShelf Sponsor](https://devshelf.ritualdev.in/api/v1/badges/${encodeURIComponent(handle)}.svg)](https://devshelf.ritualdev.in/sponsors.html)`,
    );
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Activation failed:", err);
    process.exit(1);
  }
}

// Auto-run if invoked directly
if (process.argv[1]?.endsWith("activate-sponsor.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
