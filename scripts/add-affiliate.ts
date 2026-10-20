import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SITE_DIR = path.join(ROOT_DIR, "site");
const GO_DIR = path.join(SITE_DIR, "go");
const AFFILIATES_JSON_PATH = path.join(DATA_DIR, "affiliates.json");

export interface AffiliatePartner {
  slug: string;
  toolName: string;
  url: string;
  vanityPath: string;
  category?: string;
  perkTitle: string;
  perkDescription: string;
  ctaText?: string;
  badge?: string;
  active: boolean;
}

export interface AddAffiliateOptions {
  tool: string;
  url: string;
  slug?: string;
  category?: string;
  perk?: string;
  description?: string;
  cta?: string;
  badge?: string;
  skipBuild?: boolean;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateGoRedirectHtml(partner: AffiliatePartner): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=${partner.url}">
  <link rel="canonical" href="${partner.url}">
  <meta name="robots" content="noindex, follow">
  <title>Redirecting to ${partner.toolName} Partner Offer...</title>
  <style>
    body {
      background-color: #020617;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1rem;
      box-sizing: border-box;
    }
    .card {
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 1rem;
      padding: 2rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h2 { color: #ffffff; margin-top: 0; margin-bottom: 0.5rem; font-size: 1.25rem; }
    p { font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; color: #cbd5e1; }
    .perk-box {
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      color: #e9d5ff;
    }
    a.btn {
      display: inline-block;
      background: linear-gradient(to right, #9333ea, #4f46e5);
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.875rem;
      transition: opacity 0.2s;
    }
    a.btn:hover { opacity: 0.9; }
    .disclosure {
      margin-top: 1.25rem;
      font-size: 0.7rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 2rem; margin-bottom: 0.75rem;">⚡</div>
    <h2>Connecting to ${partner.toolName}</h2>
    <p>${partner.perkDescription || "Redirecting you to official developer partner benefits..."}</p>
    <div class="perk-box">
      <strong>Verified Offer:</strong> ${partner.perkTitle}
    </div>
    <a href="${partner.url}" rel="noopener noreferrer sponsored" class="btn">
      ${partner.ctaText || "Continue to Partner Site →"}
    </a>
    <div class="disclosure">
      Verified Developer Partner Link • Zero paywalls, transparent community funding.
    </div>
  </div>
</body>
</html>
`;
}

export async function addOrUpdateAffiliate(
  options: AddAffiliateOptions,
): Promise<{ partner: AffiliatePartner; isNew: boolean }> {
  const toolName = (options.tool || "").trim();
  const url = (options.url || "").trim();

  if (!toolName) {
    throw new Error("Missing required argument: --tool <name>");
  }
  if (!url) {
    throw new Error("Missing required argument: --url <affiliate-url>");
  }

  const slug = options.slug ? slugify(options.slug) : slugify(toolName);
  const vanityPath = `/go/${slug}.html`;

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(GO_DIR, { recursive: true });

  let rawData = {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    partners: [] as AffiliatePartner[],
  };
  try {
    const raw = await fs.readFile(AFFILIATES_JSON_PATH, "utf8");
    rawData = JSON.parse(raw);
  } catch {
    // initialize new
  }

  const existingIdx = rawData.partners.findIndex(
    (p) => p.slug === slug || p.toolName.toLowerCase() === toolName.toLowerCase(),
  );

  const isNew = existingIdx === -1;
  const partner: AffiliatePartner = {
    slug,
    toolName,
    url,
    vanityPath,
    category:
      options.category || (existingIdx !== -1 ? rawData.partners[existingIdx].category : "cloud"),
    perkTitle:
      options.perk?.trim() ||
      (existingIdx !== -1
        ? rawData.partners[existingIdx].perkTitle
        : "Developer Free Tier & Credits"),
    perkDescription:
      options.description?.trim() ||
      (existingIdx !== -1
        ? rawData.partners[existingIdx].perkDescription
        : `Claim exclusive developer credits and perpetual free tier allowances with ${toolName}.`),
    ctaText:
      options.cta?.trim() ||
      (existingIdx !== -1 ? rawData.partners[existingIdx].ctaText : "Claim Offer →"),
    badge:
      options.badge?.trim() ||
      (existingIdx !== -1 ? rawData.partners[existingIdx].badge : "🎁 Dev Perk"),
    active: true,
  };

  if (isNew) {
    rawData.partners.push(partner);
  } else {
    rawData.partners[existingIdx] = partner;
  }
  rawData.updatedAt = new Date().toISOString();

  // 1. Write data/affiliates.json
  await fs.writeFile(AFFILIATES_JSON_PATH, `${JSON.stringify(rawData, null, 2)}\n`, "utf8");

  // 2. Write static outbound redirect under site/go/[slug].html
  const redirectHtml = generateGoRedirectHtml(partner);
  await fs.writeFile(path.join(GO_DIR, `${slug}.html`), redirectHtml, "utf8");

  // 3. Write site/api/v1/affiliates.json
  const apiV1Dir = path.join(SITE_DIR, "api", "v1");
  await fs.mkdir(apiV1Dir, { recursive: true });
  await fs.writeFile(
    path.join(apiV1Dir, "affiliates.json"),
    `${JSON.stringify(rawData, null, 2)}\n`,
    "utf8",
  );

  // 4. Synchronize site if not skipped
  if (!options.skipBuild) {
    execSync("pnpm run build", {
      cwd: ROOT_DIR,
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    });
  }

  return { partner, isNew };
}

// CLI Execution Handler
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`
⚡ DevShelf Developer Affiliate & Partner Link Ingestion Engine
Usage:
  tsx scripts/add-affiliate.ts [options]

Required Options:
  --tool <name>          Tool or platform name (e.g. "DigitalOcean", "Hetzner", "Supabase")
  --url <url>            Your affiliate / partner link (e.g. "https://m.do.co/c/xxxx")

Additional Options:
  --slug <string>        Custom URL slug for /go/[slug].html (default: slugified tool name)
  --category <string>    Tool category: cloud | ai | cli | apis | testing (default: cloud)
  --perk <string>        Perk headline (e.g. "$200 Free Cloud Credits (60 Days)")
  --description <string> 1-2 sentence perk value pitch for developers
  --cta <string>         Action button text (e.g. "Claim $200 Credits →")
  --badge <string>       Short badge label (e.g. "🎁 $200 Credit")
  --skip-build           Skip automatic 'pnpm run build' after saving

Examples:
  tsx scripts/add-affiliate.ts --tool "DigitalOcean" --url "https://m.do.co/c/my-affiliate-id" --perk "$200 Cloud Credits" --cta "Claim $200 Credits →"
  tsx scripts/add-affiliate.ts --tool "Hetzner Cloud" --url "https://hetzner.cloud/?ref=my-ref-id" --perk "€20 Cloud Credits" --cta "Claim €20 Credits →"
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

  const tool = getArg("--tool");
  const url = getArg("--url");
  const slug = getArg("--slug");
  const category = getArg("--category");
  const perk = getArg("--perk");
  const description = getArg("--description");
  const cta = getArg("--cta");
  const badge = getArg("--badge");
  const skipBuild = args.includes("--skip-build");

  if (!tool || !url) {
    console.error("❌ Error: Both --tool and --url are required.");
    process.exit(1);
  }

  console.log(`\n⚡ [DevShelf Affiliate Engine] Registering partner link for: ${tool}...`);

  try {
    const { partner, isNew } = await addOrUpdateAffiliate({
      tool,
      url,
      slug,
      category,
      perk,
      description,
      cta,
      badge,
      skipBuild,
    });

    console.log("\n=======================================================");
    console.log(
      `🎉 SUCCESS: ${partner.toolName} Affiliate Partner ${isNew ? "Created" : "Updated"}!`,
    );
    console.log("=======================================================");
    console.log(`• Destination URL:   ${partner.url}`);
    console.log(`• Outbound Redirect: devshelf.ritualdev.in${partner.vanityPath}`);
    console.log(`• Perk Headline:     ${partner.perkTitle}`);
    console.log(`• Call-To-Action:    ${partner.ctaText}`);
    console.log(`• Registry File:     data/affiliates.json & site/api/v1/affiliates.json`);
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Failed to register affiliate:", err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("add-affiliate.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
