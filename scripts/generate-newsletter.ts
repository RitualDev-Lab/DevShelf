import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SITE_DIR = path.join(ROOT_DIR, "site");
const NEWSLETTER_JSON_PATH = path.join(DATA_DIR, "newsletter.json");
const SPONSORS_JSON_PATH = path.join(DATA_DIR, "sponsors.json");

export interface NewsletterTool {
  name: string;
  category: string;
  description: string;
  url: string;
  badge?: string;
}

export interface NewsletterSponsor {
  name: string;
  tagline: string;
  url: string;
  perk?: string;
  badge?: string;
}

export interface NewsletterIssue {
  issueNumber: number;
  date: string;
  title: string;
  slug: string;
  summary: string;
  sponsor?: NewsletterSponsor;
  featuredTools: NewsletterTool[];
  perkOfTheWeek?: {
    title: string;
    description: string;
    url: string;
  };
}

export interface NewsletterData {
  version: string;
  updatedAt: string;
  name: string;
  tagline: string;
  description: string;
  website: string;
  feedUrl: string;
  stats: {
    totalIssues: number;
    activeSubscribers: number;
    openRate: string;
    clickRate: string;
  };
  issues: NewsletterIssue[];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateRssFeedXml(data: NewsletterData): string {
  const domain = "https://devshelf.ritualdev.in";
  const now = new Date().toUTCString();

  const itemsXml = data.issues
    .map((issue) => {
      const pubDate = new Date(`${issue.date}T08:00:00Z`).toUTCString();
      const issueUrl = `${domain}/newsletter.html#${issue.slug}`;

      let contentHtml = `<p>${escapeHtml(issue.summary)}</p>`;
      if (issue.sponsor) {
        contentHtml += `<p><strong>⚡ Issue Sponsor:</strong> <a href="${issue.sponsor.url}">${escapeHtml(issue.sponsor.name)}</a> - ${escapeHtml(issue.sponsor.tagline)} (${escapeHtml(issue.sponsor.perk || "")})</p>`;
      }
      contentHtml += `<h3>🛠️ Featured Zero-Paywall Tools</h3><ul>`;
      for (const tool of issue.featuredTools) {
        contentHtml += `<li><a href="${tool.url}"><strong>${escapeHtml(tool.name)}</strong></a>: ${escapeHtml(tool.description)}</li>`;
      }
      contentHtml += `</ul>`;
      if (issue.perkOfTheWeek) {
        contentHtml += `<p><strong>🎁 Perk of the Week:</strong> <a href="${issue.perkOfTheWeek.url}">${escapeHtml(issue.perkOfTheWeek.title)}</a> - ${escapeHtml(issue.perkOfTheWeek.description)}</p>`;
      }

      return `    <item>
      <title>${escapeXml(issue.title)}</title>
      <link>${issueUrl}</link>
      <guid isPermaLink="true">${issueUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${contentHtml}]]></description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevShelf Weekly - Free Developer Tools, APIs &amp; Open Source</title>
    <link>${domain}/newsletter.html</link>
    <description>${escapeXml(data.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${domain}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>
`;
}

export function generateNewsletterHtml(data: NewsletterData, sponsorsData?: any): string {
  const domain = "https://devshelf.ritualdev.in";
  const latestIssue = data.issues[0];

  const issuesListHtml = data.issues
    .map((issue) => {
      return `
      <article id="${issue.slug}" class="mb-12 p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl scroll-mt-24">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-4 pb-4 border-b border-slate-800">
          <div class="flex items-center space-x-2.5">
            <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300">
              Edition #${issue.issueNumber}
            </span>
            <span class="text-xs font-mono text-slate-400">Published: ${issue.date}</span>
          </div>
          <button onclick="navigator.clipboard.writeText('${domain}/newsletter.html#${issue.slug}'); alert('Copied issue permalink to clipboard!');" class="text-xs font-mono text-purple-400 hover:text-purple-300 transition">
            🔗 Copy Link
          </button>
        </div>

        <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          ${escapeHtml(issue.title)}
        </h2>

        <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          ${escapeHtml(issue.summary)}
        </p>

        ${
          issue.sponsor
            ? `
        <div class="mb-8 p-4 rounded-xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-purple-950/20">
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900/80 text-purple-300 border border-purple-500/40">
                ${escapeHtml(issue.sponsor.badge || "⚡ Weekly Sponsor")}
              </span>
              <span class="text-xs font-bold text-white">${escapeHtml(issue.sponsor.name)}</span>
            </div>
            <p class="text-xs text-slate-300">${escapeHtml(issue.sponsor.tagline)} ${issue.sponsor.perk ? `<span class="text-amber-300">• ${escapeHtml(issue.sponsor.perk)}</span>` : ""}</p>
          </div>
          <a href="${escapeHtml(issue.sponsor.url)}" target="_blank" rel="noopener noreferrer sponsored" class="shrink-0 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-md shadow-purple-900/30">
            Visit Partner Site →
          </a>
        </div>`
            : ""
        }

        <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <span>🛠️ 5 Curated Discoveries of the Week</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          ${issue.featuredTools
            .map(
              (t) => `
          <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-bold text-white text-sm">${escapeHtml(t.name)}</span>
                ${t.badge ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">${escapeHtml(t.badge)}</span>` : ""}
              </div>
              <p class="text-xs text-slate-400 leading-relaxed mb-3">${escapeHtml(t.description)}</p>
            </div>
            <a href="${escapeHtml(t.url)}" class="text-xs font-mono font-bold text-purple-400 hover:text-purple-300 transition inline-flex items-center space-x-1">
              <span>Explore Specs</span>
              <span>→</span>
            </a>
          </div>`,
            )
            .join("")}
        </div>

        ${
          issue.perkOfTheWeek
            ? `
        <div class="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-orange-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider mb-1">🎁 Developer Perk of the Week</div>
            <div class="text-sm font-bold text-white">${escapeHtml(issue.perkOfTheWeek.title)}</div>
            <p class="text-xs text-slate-300 mt-0.5">${escapeHtml(issue.perkOfTheWeek.description)}</p>
          </div>
          <a href="${escapeHtml(issue.perkOfTheWeek.url)}" target="_blank" rel="noopener noreferrer sponsored" class="shrink-0 px-4 py-2 rounded-xl text-xs font-mono font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition shadow-md shadow-amber-500/20">
            Claim Perk →
          </a>
        </div>`
            : ""
        }
      </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevShelf Weekly (2026) — Curated Zero-Paywall Tools &amp; Public APIs Newsletter</title>
  <meta name="description" content="Subscribe to DevShelf Weekly in 2026: 5 curated free developer tools, open-source alternatives, public APIs, and verified partner perks delivered every Monday. Zero spam.">
  <link rel="canonical" href="${domain}/newsletter.html">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="author" content="RitualDev Lab">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${domain}/newsletter.html">
  <meta property="og:title" content="DevShelf Weekly (2026) — Curated Zero-Paywall Developer Newsletter">
  <meta property="og:description" content="Join 2,800+ developers discovering battle-tested open-source alternatives, public APIs, and free developer credits before they hit Hacker News.">
  <meta property="og:image" content="${domain}/og-image.jpg">

  <!-- RSS / Atom Feeds -->
  <link rel="alternate" type="application/rss+xml" title="DevShelf Weekly RSS Feed" href="feed.xml">
  <link rel="alternate" type="application/rss+xml" title="DevShelf Weekly RSS Feed" href="newsletter.xml">
  <link rel="alternate" type="application/json" title="DevShelf Weekly JSON API" href="api/v1/newsletter.json">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="tailwind.min.css">
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col justify-between selection:bg-purple-500 selection:text-white">
  <!-- Ambient Glow -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/15 blur-[100px] rounded-full"></div>
    <div class="absolute top-[600px] -left-32 w-[400px] h-[400px] bg-pink-600/10 blur-[100px] rounded-full"></div>
  </div>

  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="./" class="flex items-center space-x-2 text-white font-extrabold text-lg hover:text-purple-400 transition">
        <span>📚 DevShelf</span>
      </a>
      <div class="flex items-center space-x-3 text-xs font-mono">
        <a href="feed.xml" target="_blank" class="px-2.5 py-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-500/40 text-orange-300 font-bold transition flex items-center space-x-1">
          <span>📡</span>
          <span>RSS Feed</span>
        </a>
        <a href="#sponsor-kit" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900 border border-emerald-500/50 text-emerald-200 font-bold transition">
          ⚡ Sponsor ($99)
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
    <!-- Hero Header -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300 mb-4">
        <span>📬</span>
        <span>Every Monday Morning • Zero Paywall Guarantee</span>
      </div>
      <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
        DevShelf Weekly
      </h1>
      <p class="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-6">
        5 battle-tested open-source alternatives, free developer APIs, and verified partner perks delivered directly to your inbox or RSS reader every Monday.
      </p>

      <!-- Metric Badges -->
      <div class="flex items-center justify-center flex-wrap gap-3 font-mono text-xs text-slate-300 mb-8">
        <span class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          👥 <strong class="text-white">${data.stats.activeSubscribers.toLocaleString()}</strong> Engineers &amp; Founders
        </span>
        <span class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          📈 <strong class="text-emerald-400">${data.stats.openRate}</strong> Open Rate
        </span>
        <span class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          ⚡ <strong class="text-cyan-300">${data.stats.totalIssues}</strong> Published Editions
        </span>
        <span class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-purple-300">
          100% Free Forever
        </span>
      </div>

      <!-- Free Email Subscription Form -->
      <div class="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/40 shadow-2xl max-w-xl mx-auto text-left">
        <h3 class="text-base font-bold text-white mb-2">Join 2,800+ Developers Subscribing Free</h3>
        <p class="text-xs text-slate-300 mb-4">No spam, no vendor pitches. Just clean tool summaries, benchmarks, and exclusive perks.</p>
        
        <form id="newsletter-form" onsubmit="event.preventDefault(); const em = document.getElementById('nl-email').value; if(em){ localStorage.setItem('devshelf_subscriber', em); document.getElementById('nl-success').classList.remove('hidden'); document.getElementById('nl-inputs').classList.add('hidden'); }" class="space-y-3">
          <div id="nl-inputs" class="flex flex-col sm:flex-row gap-2">
            <input type="email" id="nl-email" required placeholder="developer@acme.com" class="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono">
            <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold font-mono text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-600/30 whitespace-nowrap">
              Subscribe Free →
            </button>
          </div>
          <div id="nl-success" class="hidden p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300 text-center">
            🎉 You're subscribed! You will receive Issue #${latestIssue.issueNumber + 1} next Monday. You can also add <a href="feed.xml" class="underline font-bold">our RSS feed</a> to your reader.
          </div>
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>🔒 Strict zero-spam policy</span>
            <a href="feed.xml" class="text-orange-400 hover:underline">Prefer RSS? Click here →</a>
          </div>
        </form>
      </div>
    </div>

    <!-- Sponsor Media Kit & B2B Packages Section -->
    <section id="sponsor-kit" class="mb-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/40 shadow-xl scroll-mt-24">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <div class="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">📢 Sponsor Media Kit</div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-white">Feature Your Tool in DevShelf Weekly</h2>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
          ⚡ 2,800+ Active Subscribers
        </span>
      </div>

      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
        Reach software architects, fullstack developers, DevOps engineers, and startup founders who actively test, evaluate, and adopt new developer tools every week.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="text-xs font-mono font-bold text-slate-400 mb-1">Single Issue Spotlight</div>
            <div class="text-2xl font-extrabold text-white font-mono mb-2">$99 <span class="text-xs text-slate-400 font-normal">/ issue</span></div>
            <ul class="text-xs text-slate-300 space-y-2 mb-4">
              <li>✓ Top header sponsor slot in 1 upcoming Monday edition</li>
              <li>✓ 100-word product pitch with custom CTA button</li>
              <li>✓ Included in W3C RSS 2.0 / Atom feed and web archive</li>
              <li>✓ Direct clickout telemetry reporting</li>
            </ul>
          </div>
          <a href="sponsors.html?tier=newsletter-spotlight&amount=99&currency=USD" class="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold text-center text-white bg-purple-600 hover:bg-purple-500 transition shadow-md shadow-purple-900/30">
            Book Next Monday ($99) →
          </a>
        </div>

        <div class="p-5 rounded-xl bg-slate-950/80 border border-purple-500/40 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -right-8 -top-8 w-24 h-24 bg-purple-600/20 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono font-bold text-purple-300">Monthly 4-Issue Retainer</span>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">Best Value</span>
            </div>
            <div class="text-2xl font-extrabold text-white font-mono mb-2">$299 <span class="text-xs text-slate-400 font-normal">/ month (4 issues)</span></div>
            <ul class="text-xs text-slate-300 space-y-2 mb-4">
              <li>✓ Top sponsor slot across 4 consecutive Monday editions</li>
              <li>✓ Rotational CTA messaging &amp; headline split-testing</li>
              <li>✓ Permanent archive entry &amp; do-follow backlink</li>
              <li>✓ Category takeover inclusion across web directory</li>
            </ul>
          </div>
          <a href="sponsors.html?tier=category-takeover&amount=199&currency=USD" class="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold text-center text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition shadow-md shadow-amber-500/20">
            Reserve Monthly Retainer →
          </a>
        </div>
      </div>
    </section>

    <!-- Past Issues Archives -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Recent Editions &amp; Archives
        </h2>
        <span class="text-xs font-mono text-slate-400">Showing all ${data.issues.length} editions</span>
      </div>

      ${issuesListHtml}
    </div>
  </main>

  <footer class="border-t border-slate-800 bg-slate-900/40 py-6 text-center text-xs text-slate-400 space-y-2">
    <div class="flex items-center justify-center flex-wrap gap-3 font-mono text-[11px] text-slate-400 mb-2">
      <a href="./" class="hover:text-purple-300 transition">DevShelf Home</a>
      <span>•</span>
      <a href="directory.html" class="hover:text-purple-300 transition">All Tools Index</a>
      <span>•</span>
      <a href="feed.xml" class="hover:text-purple-300 transition">RSS Feed</a>
      <span>•</span>
      <a href="sponsors.html" class="hover:text-purple-300 transition">Sponsors &amp; Patrons</a>
    </div>
    <p>Curated with ❤️ by <a href="https://github.com/RitualDev-Lab" class="text-purple-400 hover:underline">RitualDev-Lab</a> and the global open-source community.</p>
  </footer>
</body>
</html>
`;
}

export async function buildNewsletter(): Promise<{
  data: NewsletterData;
  rssXml: string;
  html: string;
}> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SITE_DIR, { recursive: true });

  const rawNewsletter = await fs.readFile(NEWSLETTER_JSON_PATH, "utf8");
  const data: NewsletterData = JSON.parse(rawNewsletter);

  let sponsorsData: any = null;
  try {
    const rawSponsors = await fs.readFile(SPONSORS_JSON_PATH, "utf8");
    sponsorsData = JSON.parse(rawSponsors);
  } catch {
    // fallback
  }

  // 1. Generate site/feed.xml and site/newsletter.xml
  const rssXml = generateRssFeedXml(data);
  await fs.writeFile(path.join(SITE_DIR, "feed.xml"), rssXml, "utf8");
  await fs.writeFile(path.join(SITE_DIR, "newsletter.xml"), rssXml, "utf8");

  // 2. Generate site/newsletter.html
  const html = generateNewsletterHtml(data, sponsorsData);
  await fs.writeFile(path.join(SITE_DIR, "newsletter.html"), html, "utf8");

  // 3. Generate site/api/v1/newsletter.json
  const apiV1Dir = path.join(SITE_DIR, "api", "v1");
  await fs.mkdir(apiV1Dir, { recursive: true });
  await fs.writeFile(
    path.join(apiV1Dir, "newsletter.json"),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );

  return { data, rssXml, html };
}

async function main() {
  console.log("⚡ [DevShelf Newsletter Engine] Generating newsletter artifacts and RSS feeds...");
  const { data } = await buildNewsletter();
  console.log(`✅ Generated site/newsletter.html (${data.issues.length} issues)`);
  console.log("✅ Generated site/feed.xml & site/newsletter.xml (W3C RSS 2.0 / Atom feed)");
  console.log("✅ Generated site/api/v1/newsletter.json REST API");
}

if (process.argv[1]?.endsWith("generate-newsletter.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
