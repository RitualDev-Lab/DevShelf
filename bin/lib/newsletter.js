import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_NEWSLETTER_DATA = {
  version: "1.0.0",
  updatedAt: "2026-10-20T00:00:00.000Z",
  name: "DevShelf Weekly",
  tagline: "5 Curated Zero-Paywall Developer Tools & Public APIs Every Monday",
  description:
    "Weekly curated developer newsletter featuring verified open-source alternatives, free cloud infrastructure, public APIs, and developer perks with zero paywalls.",
  website: "https://devshelf.ritualdev.in/newsletter.html",
  feedUrl: "https://devshelf.ritualdev.in/feed.xml",
  stats: {
    totalIssues: 3,
    activeSubscribers: 2840,
    openRate: "48.2%",
    clickRate: "14.6%",
  },
  issues: [
    {
      issueNumber: 3,
      date: "2026-10-19",
      title: "Issue #3: Local-First AI Agents, Fast Postgres Branching, and Weather Radar APIs",
      slug: "issue-3",
      summary:
        "This week: Run local LLM agents without cloud API tokens, instant Postgres branches with Neon, and accurate free weather forecasts without credit cards.",
      sponsor: {
        name: "Neon",
        tagline: "Serverless Postgres with Instant Git-like Branching",
        url: "https://devshelf.ritualdev.in/go/neon.html",
        perk: "Permanent generous free tier with zero cold starts.",
        badge: "⚡ Weekly Sponsor",
      },
      featuredTools: [
        {
          name: "RowSafe",
          category: "cli",
          description:
            "AI-assisted PostgreSQL CLI guard that prevents accidental destructive DROP, TRUNCATE, and unindexed bulk updates.",
          url: "https://devshelf.ritualdev.in/tools/rowsafe.html",
          badge: "🛡️ 100% Free CLI",
        },
        {
          name: "CurlShot",
          category: "cli",
          description:
            "Zero-config terminal tool to convert curl commands into beautiful, shareable developer documentation snippets.",
          url: "https://devshelf.ritualdev.in/tools/curlshot.html",
          badge: "⚡ Terminal Productivity",
        },
        {
          name: "Open-Meteo",
          category: "api",
          description:
            "Public weather forecast and climate API with up to 10,000 daily requests free with no API key required.",
          url: "https://devshelf.ritualdev.in/tools/open-meteo.html",
          badge: "🌤️ No Key Needed",
        },
        {
          name: "Open-WebUI",
          category: "ai",
          description:
            "Self-hosted, ChatGPT-like web UI for local models (Ollama, vLLM) with multi-model chat, RAG, and voice.",
          url: "https://devshelf.ritualdev.in/tools/open-webui.html",
          badge: "🤖 Self-Hosted AI",
        },
        {
          name: "Bruno",
          category: "testing",
          description:
            "Fast, git-friendly open-source desktop API client alternative to Postman and Insomnia with local collection storage.",
          url: "https://devshelf.ritualdev.in/tools/bruno.html",
          badge: "🚀 Free Postman Alternative",
        },
      ],
      perkOfTheWeek: {
        title: "DigitalOcean $200 Free Cloud Credits",
        description:
          "Get $200 in free cloud infrastructure credits for 60 days to deploy Droplets, Kubernetes, and App Platform apps.",
        url: "https://devshelf.ritualdev.in/go/digitalocean.html",
      },
    },
  ],
};

let cachedNewsletter = null;

/**
 * Load DevShelf Weekly Newsletter data with 3-tier fallback strategy:
 * 1. Local data/newsletter.json or site/api/v1/newsletter.json
 * 2. Remote CDN (https://devshelf.ritualdev.in/api/v1/newsletter.json)
 * 3. Inlined default seed
 *
 * @param {{ forceReload?: boolean }} [options]
 * @returns {Promise<{ version: string, updatedAt: string, name: string, issues: Array<any>, stats: Record<string, any> }>}
 */
export async function loadNewsletter(options = {}) {
  if (cachedNewsletter && !options.forceReload) {
    return cachedNewsletter;
  }

  // Tier 1: Local file system
  const localCandidates = [
    path.join(__dirname, "..", "..", "data", "newsletter.json"),
    path.join(__dirname, "..", "..", "site", "api", "v1", "newsletter.json"),
  ];

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, "utf8");
        cachedNewsletter = JSON.parse(raw);
        return cachedNewsletter;
      } catch {
        // Continue to next candidate
      }
    }
  }

  // Tier 2: Remote endpoint
  try {
    const res = await fetch("https://devshelf.ritualdev.in/api/v1/newsletter.json", {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      cachedNewsletter = await res.json();
      return cachedNewsletter;
    }
  } catch {
    // Fall through
  }

  // Tier 3: Inlined default seed
  cachedNewsletter = DEFAULT_NEWSLETTER_DATA;
  return cachedNewsletter;
}
