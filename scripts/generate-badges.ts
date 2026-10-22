import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BADGES_DIR = path.join(ROOT_DIR, "site", "api", "v1", "badges");

export interface BadgeOptions {
  name?: string;
  handle?: string;
  tier?: "enterprise" | "gold" | "silver" | "bronze" | "supporter";
  amountUSD?: number;
  style?: "pill" | "card";
}

function escapeXml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generatePillBadgeSvg(options: BadgeOptions): string {
  const tier =
    options.tier ||
    (options.amountUSD && options.amountUSD >= 250
      ? "enterprise"
      : options.amountUSD && options.amountUSD >= 100
        ? "gold"
        : options.amountUSD && options.amountUSD >= 50
          ? "silver"
          : "bronze");

  let rightBg = "#7c3aed";
  let rightText = "☕ Supporter";
  let borderColor = "rgba(168, 85, 247, 0.4)";

  if (tier === "enterprise") {
    rightBg = "#4338ca";
    rightText = "👑 Enterprise";
    borderColor = "rgba(245, 158, 11, 0.85)";
  } else if (tier === "gold") {
    rightBg = "#b45309";
    rightText = "👑 Gold Patron";
    borderColor = "rgba(245, 158, 11, 0.5)";
  } else if (tier === "silver") {
    rightBg = "#334155";
    rightText = "🛡️ Silver Backer";
    borderColor = "rgba(148, 163, 184, 0.5)";
  } else if (tier === "bronze") {
    rightBg = "#9a3412";
    rightText = "⚡ Supporter";
    borderColor = "rgba(249, 115, 22, 0.5)";
  }

  const safeLabel = escapeXml(rightText);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="28" viewBox="0 0 220 28" role="img" aria-label="DevShelf Sponsor: ${safeLabel}">
  <defs>
    <clipPath id="pill-clip">
      <rect width="220" height="28" rx="6" fill="#fff"/>
    </clipPath>
  </defs>
  <g clip-path="url(#pill-clip)">
    <rect width="105" height="28" fill="#0f172a"/>
    <rect x="105" width="115" height="28" fill="${rightBg}"/>
    <rect width="220" height="28" fill="none" stroke="${borderColor}" stroke-width="2"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="11" font-weight="700">
    <text x="52" y="18" fill="#e2e8f0">💖 DevShelf</text>
    <text x="162" y="18" fill="#ffffff">${safeLabel}</text>
  </g>
</svg>`;
}

export function generateCardBadgeSvg(options: BadgeOptions): string {
  const tier =
    options.tier ||
    (options.amountUSD && options.amountUSD >= 250
      ? "enterprise"
      : options.amountUSD && options.amountUSD >= 100
        ? "gold"
        : options.amountUSD && options.amountUSD >= 50
          ? "silver"
          : "bronze");
  const rawName = options.name || (options.handle ? `@${options.handle}` : "DevShelf Patron");
  const safeName = escapeXml(rawName);

  let borderStart = "#f59e0b";
  let tierLabel = "Gold Patron ★ Verified Sponsor";
  let tierBadgeBg = "#78350f";
  let tierBadgeText = "#fde68a";
  let icon = "👑";

  if (tier === "enterprise") {
    borderStart = "#f59e0b";
    tierLabel = "Enterprise Placement ★ Verified";
    tierBadgeBg = "#4338ca";
    tierBadgeText = "#fde047";
    icon = "👑";
  } else if (tier === "silver") {
    borderStart = "#94a3b8";
    tierLabel = "Silver Backer ★ Verified Sponsor";
    tierBadgeBg = "#1e293b";
    tierBadgeText = "#e2e8f0";
    icon = "🛡️";
  } else if (tier === "bronze" || tier === "supporter") {
    borderStart = "#a855f7";
    tierLabel = "Dev Supporter ★ Verified Sponsor";
    tierBadgeBg = "#581c87";
    tierBadgeText = "#f3e8ff";
    icon = "💖";
  }

  const safeTierLabel = escapeXml(tierLabel);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="92" viewBox="0 0 380 92" fill="none" role="img" aria-label="DevShelf Sponsor Card: ${safeName}">
  <defs>
    <linearGradient id="card-bg" x1="0" y1="0" x2="380" y2="92" gradientUnits="userSpaceOnUse">
      <stop stop-color="#090d16"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="card-border" x1="0" y1="0" x2="380" y2="92" gradientUnits="userSpaceOnUse">
      <stop stop-color="${borderStart}" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#8b5cf6" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <rect width="380" height="92" rx="14" fill="url(#card-bg)"/>
  <rect x="0.5" y="0.5" width="379" height="91" rx="13.5" stroke="url(#card-border)"/>
  <circle cx="46" cy="46" r="23" fill="#0f172a" stroke="${borderStart}" stroke-width="1.5"/>
  <text x="46" y="53" font-size="20" text-anchor="middle">${icon}</text>
  <g font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <text x="82" y="34" fill="#ffffff" font-size="14" font-weight="700">${safeName}</text>
    <text x="82" y="53" fill="${borderStart}" font-size="11" font-weight="600">${safeTierLabel}</text>
    <text x="82" y="73" fill="#64748b" font-family="monospace" font-size="10">devshelf.ritualdev.in/sponsors</text>
  </g>
  <rect x="302" y="16" width="62" height="20" rx="10" fill="${tierBadgeBg}" stroke="${borderStart}" stroke-width="1"/>
  <text x="333" y="30" fill="${tierBadgeText}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="10" font-weight="700" text-anchor="middle">✓ Backer</text>
</svg>`;
}

export function generateDirectoryBadgeSvg(
  type: "featured" | "verified-free" | "zero-paywall" | "free-alternative" = "featured",
  customText?: string,
): string {
  let rightBg = "#7928ca";
  let rightText = "⭐ Featured";
  let borderColor = "rgba(168, 85, 247, 0.4)";
  let totalWidth = 168;
  const leftWidth = 78;
  let rightWidth = 90;
  let textX = 123;

  if (type === "verified-free") {
    rightBg = "#059669";
    rightText = "✓ Verified Free";
    borderColor = "rgba(16, 185, 129, 0.4)";
    totalWidth = 186;
    rightWidth = 108;
    textX = 132;
  } else if (type === "zero-paywall") {
    rightBg = "#0284c7";
    rightText = "💎 Zero Paywall";
    borderColor = "rgba(14, 165, 233, 0.4)";
    totalWidth = 194;
    rightWidth = 116;
    textX = 136;
  } else if (type === "free-alternative") {
    rightBg = "#d97706";
    rightText = customText ? `⚡ Free ${customText} Alt` : "⚡ Free Alternative";
    borderColor = "rgba(245, 158, 11, 0.4)";
    const calcWidth = Math.max(120, rightText.length * 8 + 18);
    rightWidth = calcWidth;
    totalWidth = leftWidth + rightWidth;
    textX = leftWidth + rightWidth / 2;
  }

  const safeLabel = escapeXml(rightText);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" viewBox="0 0 ${totalWidth} 24" role="img" aria-label="DevShelf: ${safeLabel}">
  <defs>
    <clipPath id="devshelf-${type}-clip">
      <rect width="${totalWidth}" height="24" rx="5" fill="#fff"/>
    </clipPath>
  </defs>
  <g clip-path="url(#devshelf-${type}-clip)">
    <rect width="${leftWidth}" height="24" fill="#0f172a"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="24" fill="${rightBg}"/>
    <rect width="${totalWidth}" height="24" fill="none" stroke="${borderColor}" stroke-width="1.5"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="11" font-weight="700">
    <text x="39" y="16" fill="#e2e8f0">📚 DevShelf</text>
    <text x="${textX}" y="16" fill="#ffffff">${safeLabel}</text>
  </g>
</svg>`;
}

export function generateFeaturedCardSvg(toolName = "Featured Open Source Project"): string {
  const safeName = escapeXml(toolName);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="92" viewBox="0 0 380 92" fill="none" role="img" aria-label="DevShelf Verified: ${safeName}">
  <defs>
    <linearGradient id="feat-card-bg" x1="0" y1="0" x2="380" y2="92" gradientUnits="userSpaceOnUse">
      <stop stop-color="#090d16"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="feat-card-border" x1="0" y1="0" x2="380" y2="92" gradientUnits="userSpaceOnUse">
      <stop stop-color="#a855f7" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#3b82f6" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="380" height="92" rx="14" fill="url(#feat-card-bg)"/>
  <rect x="0.5" y="0.5" width="379" height="91" rx="13.5" stroke="url(#feat-card-border)"/>
  <circle cx="46" cy="46" r="23" fill="#0f172a" stroke="#a855f7" stroke-width="1.5"/>
  <text x="46" y="53" font-size="20" text-anchor="middle">⭐</text>
  <g font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <text x="82" y="34" fill="#ffffff" font-size="14" font-weight="700">${safeName}</text>
    <text x="82" y="53" fill="#c084fc" font-size="11" font-weight="600">✓ Verified Free Tier • Zero-Paywall Index</text>
    <text x="82" y="73" fill="#64748b" font-family="monospace" font-size="10">devshelf.ritualdev.in</text>
  </g>
  <rect x="290" y="16" width="74" height="20" rx="10" fill="#581c87" stroke="#a855f7" stroke-width="1"/>
  <text x="327" y="30" fill="#f3e8ff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="10" font-weight="700" text-anchor="middle">Featured</text>
</svg>`;
}

export async function buildStaticBadges() {
  await fs.mkdir(BADGES_DIR, { recursive: true });

  const tiers: Array<BadgeOptions["tier"]> = [
    "enterprise",
    "gold",
    "silver",
    "bronze",
    "supporter",
  ];
  for (const t of tiers) {
    const pill = generatePillBadgeSvg({ tier: t });
    const card = generateCardBadgeSvg({ tier: t });
    await fs.writeFile(path.join(BADGES_DIR, `${t}.svg`), pill, "utf8");
    await fs.writeFile(path.join(BADGES_DIR, `${t}-card.svg`), card, "utf8");
  }

  // Directory repository badges (for tools, libraries, and READMEs)
  await fs.writeFile(
    path.join(BADGES_DIR, "featured.svg"),
    generateDirectoryBadgeSvg("featured"),
    "utf8",
  );
  await fs.writeFile(
    path.join(BADGES_DIR, "verified-free.svg"),
    generateDirectoryBadgeSvg("verified-free"),
    "utf8",
  );
  await fs.writeFile(
    path.join(BADGES_DIR, "zero-paywall.svg"),
    generateDirectoryBadgeSvg("zero-paywall"),
    "utf8",
  );
  await fs.writeFile(
    path.join(BADGES_DIR, "free-alternative.svg"),
    generateDirectoryBadgeSvg("free-alternative"),
    "utf8",
  );
  await fs.writeFile(path.join(BADGES_DIR, "featured-card.svg"), generateFeaturedCardSvg(), "utf8");

  // Default badges
  const defaultPill = generatePillBadgeSvg({ tier: "bronze" });
  const defaultCard = generateCardBadgeSvg({ tier: "gold", name: "DevShelf Verified Backer" });
  await fs.writeFile(path.join(BADGES_DIR, "default.svg"), defaultPill, "utf8");
  await fs.writeFile(path.join(BADGES_DIR, "verified.svg"), defaultCard, "utf8");

  // Load canonical patrons ledger from data/sponsors.json
  const sponsorsDataPath = path.join(ROOT_DIR, "data", "sponsors.json");
  const apiSponsorsPath = path.join(ROOT_DIR, "site", "api", "v1", "sponsors.json");

  let patronsList: Array<{
    handle?: string;
    name: string;
    tier: BadgeOptions["tier"];
    github?: string;
  }> = [];

  try {
    const raw = await fs.readFile(sponsorsDataPath, "utf8");
    const parsed = JSON.parse(raw);
    await fs.writeFile(apiSponsorsPath, JSON.stringify(parsed, null, 2), "utf8");
    const apiTelemetryPath = path.join(ROOT_DIR, "site", "api", "v1", "sponsor-telemetry.json");
    if (parsed.telemetry) {
      await fs.writeFile(
        apiTelemetryPath,
        JSON.stringify(
          {
            serverName: "devshelf-mcp",
            telemetry: parsed.telemetry,
            packages: parsed.sponsorPackages,
            checkoutUrl: "https://devshelf.ritualdev.in/sponsors.html#mcp-sponsors",
          },
          null,
          2,
        ),
        "utf8",
      );
    }
    if (Array.isArray(parsed.patrons)) {
      patronsList = parsed.patrons.map((p: any) => ({
        handle: p.github || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "patron"),
        name: p.name,
        tier: p.tier,
        github: p.github,
      }));
    }
  } catch (err) {
    console.warn("Could not read data/sponsors.json, using defaults:", err);
  }

  // Badges for verified sponsors & patrons
  const samplePatrons = [...patronsList];

  const processedHandles = new Set<string>();
  for (const p of samplePatrons) {
    if (!p.handle || processedHandles.has(p.handle)) continue;
    processedHandles.add(p.handle);
    const pill = generatePillBadgeSvg(p);
    const card = generateCardBadgeSvg(p);
    await fs.writeFile(path.join(BADGES_DIR, `${p.handle}.svg`), pill, "utf8");
    await fs.writeFile(path.join(BADGES_DIR, `${p.handle}-card.svg`), card, "utf8");
  }

  console.log(
    "🎖️ [DevShelf Badge Engine] Generated static SVG badges and site/api/v1/sponsors.json",
  );
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith("generate-badges.ts")) {
  buildStaticBadges().catch((err) => {
    console.error("Badge generation error:", err);
    process.exit(1);
  });
}
