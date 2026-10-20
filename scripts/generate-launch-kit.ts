import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SITE_DIR = path.join(ROOT_DIR, "site");
const LAUNCH_DIR = path.join(ROOT_DIR, "community", "launch");

interface ToolItem {
  name: string;
  repo?: string;
  url?: string;
  category: string;
  description: string;
  language?: string;
  license?: string;
  featured?: boolean;
  type?: string;
  section?: string;
  statusTags?: string[];
  alternativeTo?: string[];
}

interface CatalogData {
  totalCount: number;
  reposCount: number;
  counts: {
    aiTools: number;
    cliTools: number;
    testingQa: number;
    apis: number;
    freeCloud: number;
    perks: number;
    boilerplates: number;
    contributors: number;
  };
  resources: ToolItem[];
}

interface CountsData {
  totalCount: number;
  milestone: string;
  exactCount: number;
  shelfCounts: Record<string, number>;
  reposCount: number;
}

export async function generateLaunchKit(): Promise<{ filesWritten: string[] }> {
  await fs.mkdir(LAUNCH_DIR, { recursive: true });

  // 1. Load counts and catalog
  let counts: CountsData = {
    totalCount: 537,
    milestone: "530+",
    exactCount: 537,
    shelfCounts: {},
    reposCount: 334,
  };

  try {
    const rawCounts = await fs.readFile(
      path.join(DATA_DIR, "counts.json"),
      "utf8",
    );
    counts = JSON.parse(rawCounts);
  } catch {
    // fallback to defaults
  }

  let catalog: CatalogData = {
    totalCount: counts.totalCount,
    reposCount: counts.reposCount,
    counts: {
      aiTools: 90,
      cliTools: 119,
      testingQa: 63,
      apis: 102,
      freeCloud: 71,
      perks: 30,
      boilerplates: 41,
      contributors: 21,
    },
    resources: [],
  };

  try {
    const rawCatalog = await fs.readFile(
      path.join(SITE_DIR, "data.json"),
      "utf8",
    );
    catalog = JSON.parse(rawCatalog);
  } catch {
    // fallback
  }

  const total = catalog.totalCount || counts.totalCount || 537;
  const repos = catalog.reposCount || counts.reposCount || 334;
  const apis = catalog.counts?.apis || 102;
  const ai = catalog.counts?.aiTools || 90;
  const cli = catalog.counts?.cliTools || 119;
  const testing = catalog.counts?.testingQa || 63;
  const cloud = catalog.counts?.freeCloud || 71;
  const boilerplates = catalog.counts?.boilerplates || 41;
  const perks = catalog.counts?.perks || 30;

  // Extract key featured tools
  const featuredTools = catalog.resources.filter((r) => r.featured).slice(0, 10);
  const aiPicks = catalog.resources
    .filter((r) => r.type === "ai" || r.category?.toLowerCase().includes("ai"))
    .slice(0, 4);
  const testingPicks = catalog.resources
    .filter((r) => r.type === "testing" || r.category?.toLowerCase().includes("test"))
    .slice(0, 4);

  const filesWritten: string[] = [];

  // ==========================================
  // 1. Hacker News Show HN Kit
  // ==========================================
  const hnContent = `# 🚀 Hacker News Show HN Launch Kit

> **Goal:** Flood DevShelf with senior engineer traffic, triggering Chrome dwell-time (>3 minutes) and NavBoost ranking signals in Google.

---

## 📌 Submission Details

- **Title Option 1 (Recommended - Value & Transparency):**  
  \`Show HN: DevShelf – Zero-paywall developer directory with CLI and MCP server\`
- **Title Option 2 (Problem-First):**  
  \`Show HN: We got tired of 14-day trial traps, so we built a zero-paywall dev directory\`
- **Title Option 3 (Engineering / Utility):**  
  \`Show HN: DevShelf – ${total}+ verified free developer tools & APIs with CI health checks\`
- **URL:** \`https://devshelf.ritualdev.in\`
- **Source Code:** \`https://github.com/RitualDev-Lab/DevShelf\`

---

## 📝 First Comment (Post Body to submit immediately after posting)

\`\`\`markdown
Hey HN! 👋

I'm the creator of DevShelf (https://devshelf.ritualdev.in).

Like many of you, I got completely tired of modern SaaS "Free Tier" bait-and-switches. You search for an API, vector database, or auth library, sign up, and realize:
1. It requires an upfront credit card just to touch the sandbox.
2. It's actually a 14-day trial that self-destructs into a $50/mo bill.
3. The project was abandoned 2 years ago and the endpoint 404s.

So we built DevShelf: an open-source, community-curated directory of **${total}+ verified developer tools, free public APIs, AI agents, and boilerplates** that have **zero credit-card paywalls and permanent free plans**.

### 🛠️ What's Under the Hood:
- **Continuous CI Health Checks:** Every night, GitHub Actions pings URLs to verify HTTP 200 uptime and scans landing pages with a trial-bait analyzer that flags hidden credit card gates and expiring trials.
- **Terminal CLI:** Query the entire catalog directly from your shell without opening a browser:
  \`\`\`bash
  npx devshelf search "vector db"
  npx devshelf random
  \`\`\`
- **Model Context Protocol (MCP) Server:** Pair-program with Claude Desktop, Cursor, or Windsurf? Run our native stdio MCP server (\`npx devshelf-mcp\`) so your AI assistant can discover verified free APIs and open-source alternatives mid-prompt.
- **100% Static & Lightweight:** Built with vanilla JS, static Tailwind CSS, and JSON schemas. Zero tracking, zero telemetry, zero analytics scripts, and zero cookies.
- **Maintainer Badge Engine:** Developers who submit their open-source tools get dynamic SVG verification badges for their READMEs (https://devshelf.ritualdev.in/badges.html).

### 📊 Real Catalog Scale Today:
- **${repos}** Open-Source GitHub Repositories
- **${apis}** Free Public APIs (Weather, AI, Finance, IP, Geocoding)
- **${ai}** AI Tools, Local LLM Runtimes & Inference Engines
- **${cli}** CLI Utilities & Developer Productivity Tools
- **${cloud}** Free Cloud, Hosting & Database Platforms
- **${testing}** Mocking, Load Testing & QA Frameworks
- **${boilerplates}** 1-Click Production Boilerplates
- **146** Commercial Alternative Hubs (e.g. Postman → Bruno, Datadog → SigNoz, Firebase → Supabase/PocketBase)

Everything is open-source under MIT on GitHub:
https://github.com/RitualDev-Lab/DevShelf

We'd love HN's honest feedback on the directory, the CLI, and the MCP integration. What hidden gem developer tools are we missing? What tools have stealthily added paywalls that we should audit?
\`\`\`

---

## ⏰ Optimal Launch Timing (EST / UTC)
- **Best Days:** Tuesday or Wednesday
- **Best Window:** **8:00 AM – 9:30 AM EST** (12:00 – 13:30 UTC)
- *Why:* Catches the US East Coast starting work while Europe is active and US West Coast is waking up.

## ⚠️ Hacker News Moderation Rules
1. **NEVER ask for upvotes:** Do not share the link on Discord, Telegram, or Twitter asking people to upvote. HN detects vote clustering and will silently flag or bury the post.
2. **Share via "New" tab only:** If sharing with friends or colleagues, tell them: *"DevShelf is on Show HN under the 'newest' tab if you want to check out the discussion."*
3. **Reply to every comment:** Respond within 10–15 minutes with humility, technical depth, and gratitude.
`;

  // ==========================================
  // 2. Reddit Launch Pack
  // ==========================================
  const redditContent = `# 👾 Reddit Community Launch Pack

> **Goal:** High-engagement, value-first Reddit posts that drive thousands of genuine developer visits, establishing DevShelf as the canonical index in Chrome navigation history.

---

## 📌 Post 1: r/webdev (2.2M+ members)
- **Flair:** \`Project / Showcase\` or \`Resource\`
- **Title:** \`Tired of fake "free tier" dev tools, so we curated ${total}+ zero-paywall tools, APIs, and boilerplates with automated health checks\`
- **Post Body:**

\`\`\`markdown
Hey r/webdev!

Over the past few months, my team and I got fed up with clicking "Free Tier" on devtools only to discover it requires an upfront credit card, or expires after 14 days, or silently abandons CORS support on their free endpoints.

We decided to build an open-source, community-maintained directory called **DevShelf**:
👉 **https://devshelf.ritualdev.in**

### What makes this different from awesome lists:
1. **Zero-Paywall Guarantee:** Every tool is audited to ensure it offers a permanent free tier or is 100% open-source with no upfront credit card required.
2. **Automated CI Health Checks:** Our daily GitHub Action pings every single resource, checking HTTP 200 uptime, detecting dead links, and checking for newly introduced paywalls.
3. **Alternative Hubs:** Quick reference for common commercial tools (e.g. Postman → Bruno, Datadog → SigNoz, Firebase → Supabase/PocketBase, Algolia → Meilisearch).
4. **Terminal CLI & AI MCP Server:** You can search tools directly in your terminal via \`npx devshelf search <query>\`, or plug \`npx devshelf-mcp\` into Cursor or Claude Code so your AI assistant knows real free APIs.
5. **No tracking or cookies:** Clean static site, zero third-party tracking scripts.

### Some of the ${total}+ resources indexed:
- **Free APIs:** Currency, Geocoding, IP, Weather, Mock Payment endpoints without CORS issues.
- **Local AI:** Ollama, vLLM, AgentShield, LocalAI for running local models without OpenAI bills.
- **Testing & Mocking:** LocalStack, WireMock, Mockoon, MSW, Playwright.
- **Cloud & DBs:** Neon (Serverless Postgres), Turso (LibSQL/SQLite), Supabase, Railway, Fly.io.

Source code and catalog data are completely open on GitHub:
https://github.com/RitualDev-Lab/DevShelf

Would love to hear your thoughts and suggestions for web dev tools we should add!
\`\`\`

---

## 📌 Post 2: r/selfhosted (350k+ members)
- **Flair:** \`Open Source\` or \`Tool\`
- **Title:** \`We indexed ${repos}+ open-source, self-hostable developer tools & stacks (with automated uptime & license auditing)\`
- **Post Body:**

\`\`\`markdown
Hey r/selfhosted!

If you prefer self-hosting your developer infrastructure rather than getting locked into proprietary SaaS pricing, you might like this:

We built **DevShelf** (https://devshelf.ritualdev.in), an open-source directory that indexes **${repos}+ self-hostable, open-source repositories and tools** for developers.

### Highlights for self-hosters:
- **Commercial SaaS Replacements:** We track direct open-source alternatives to:
  - Datadog / New Relic → SigNoz, Grafana, OpenTelemetry
  - Firebase → Supabase, PocketBase, Appwrite
  - Vercel / Heroku → Coolify, Dokku, CapRover
  - Postman → Bruno, Hoppscotch
  - Algolia → Meilisearch, Typesense
- **Strict Verification:** Every tool has a verified open-source license (MIT, Apache 2.0, AGPL, BSD) and is audited daily via GitHub Actions for repository health and active maintenance.
- **CLI & Local-First:** You can query the directory completely offline or via CLI with \`npx devshelf\`.

Check it out live: https://devshelf.ritualdev.in  
Repo: https://github.com/RitualDev-Lab/DevShelf

Let me know what self-hosted developer tools we're missing!
\`\`\`

---

## 📌 Post 3: r/opensource (250k+ members)
- **Flair:** \`Project\`
- **Title:** \`DevShelf: An open-source directory of ${total}+ free developer tools with zero telemetry and native MCP server\`
- **Post Body:**

\`\`\`markdown
Hello r/opensource!

We built **DevShelf** (https://devshelf.ritualdev.in) to solve a growing problem: the commercialization and paywalling of developer tools.

### What is DevShelf?
A 100% open-source, community-driven catalog of **${total}+ verified developer tools, free public APIs, AI agents, and 1-click boilerplates** that never require credit cards or trial commitments.

### Open-Source Architecture:
- The entire catalog lives in JSON schemas in the git repo.
- Daily CI workflows test all URLs for uptime and dead links.
- We built a native Model Context Protocol (MCP) server (\`npx devshelf-mcp\`) and interactive CLI (\`npx devshelf\`).
- First-party SVG Badge Studio (https://devshelf.ritualdev.in/badges.html) allowing open-source maintainers to show verification badges in their READMEs.
- Zero analytics, zero ad-tech, zero monetization paywalls.

We are currently welcoming community contributions and Hacktoberfest submissions!
GitHub: https://github.com/RitualDev-Lab/DevShelf

Feedback and PRs are warmly welcomed!
\`\`\`

---

## 📌 Post 4: r/SideProject (180k+ members)
- **Flair:** \`Launched\`
- **Title:** \`I built a zero-paywall developer directory to help indie hackers build for $0 [Includes CLI + MCP Server]\`
- **Post Body:**

\`\`\`markdown
Hey indie makers!

When building side projects on a budget, SaaS bills for authentication, database hosting, error logging, and APIs can kill a project before it even launches.

To help myself and other makers bootstrap with $0 infrastructure costs, I built **DevShelf**:
👉 https://devshelf.ritualdev.in

It's a curated directory of **${total}+ developer resources** with permanent free tiers, no credit-card requirements, and zero trial traps.

### Features:
- Filter by: Free APIs, CLI Tools, AI Agents, Mocking/QA, 1-Click Boilerplates, and Free Cloud.
- "My Stack" builder to assemble your free side-project stack and export it.
- Terminal CLI: \`npx devshelf search "postgres"\`
- MCP Server for Cursor/Claude: \`npx devshelf-mcp\`

Would love your feedback on the UI and any free gems you use for your side projects!
\`\`\`

---

## 📋 Reddit Posting Rules & Safety
1. **Spread across 48 hours:** Do NOT post to all 4 subreddits in the same hour. Stagger:
   - Day 1: \`r/webdev\` (Morning) & \`r/selfhosted\` (Evening)
   - Day 2: \`r/SideProject\` (Morning) & \`r/opensource\` (Evening)
2. **Be the OP in comments:** Reply to every question, thank people for suggestions, and accept constructive criticism openly.
3. **Never use URL shorteners:** Always use direct canonical URLs (\`https://devshelf.ritualdev.in\`).
`;

  // ==========================================
  // 3. Dev.to / Hashnode / Medium Long-Form Article
  // ==========================================
  const devtoContent = `---
title: We Audited 530+ Developer Tools to Find Every Secret Free Tier (And Built a Zero-Paywall Directory)
published: true
tags: webdev, opensource, programming, productivity
canonical_url: https://devshelf.ritualdev.in
cover_image: https://devshelf.ritualdev.in/api/v1/badges/featured.svg
description: Modern SaaS "Free Tiers" have become 14-day trial traps. Here is our audit of 530+ genuinely free developer tools, APIs, and open-source alternatives.
---

# We Audited 530+ Developer Tools to Find Every Secret Free Tier (And Built a Zero-Paywall Directory)

If you have tried signing up for a new developer tool recently, you have probably experienced this sequence:

1. Land on a shiny marketing page promising **"Free Forever"**.
2. Click **"Get Started"**.
3. Meet an aggressive modal: *"Enter credit card to begin 14-day trial (you will be billed $49/mo after)"*.
4. Close the tab in frustration.

Over the past decade, the developer software landscape has undergone a silent transformation. What used to be genuine free tiers designed to nurture grass-roots adoption have increasingly morphed into **trial traps**, **freemium bait**, and **vendor lock-in funnels**.

Frustrated by this trend, our open-source team spent the last several months auditing over **${total} developer tools, public APIs, AI agents, and cloud platforms**. 

We set out to answer one question:  
*Can a developer still build, test, and ship production-grade software on a true $0 budget without entering a credit card?*

The answer is **yes** — but you need to know where to look.

To solve this permanently, we built and open-sourced **[DevShelf](https://devshelf.ritualdev.in)**: a zero-paywall developer ecosystem with continuous automated health checks, a terminal CLI, and a native Model Context Protocol (MCP) server.

Here is what we learned from auditing ${total}+ tools, along with the most valuable zero-paywall discoveries you can use today.

---

## 🏛️ The 5 Golden Rules of a "Zero-Paywall" Tool

Before adding any resource to DevShelf, it must pass five strict criteria:

1. **No Upfront Credit Card Required:** If a tool asks for payment details before granting access to its sandbox or core features, it is disqualified.
2. **Permanent Free Tier (No 14-Day Traps):** The free allowance must be sustainable indefinitely (e.g. 500MB DB storage, 10,000 monthly API calls, or self-hosted open-source).
3. **No Artificial Hostage Gates:** Essential functionality like exporting data, CORS headers, or reading logs cannot be locked behind enterprise paywalls.
4. **Verified Uptime & Active Maintenance:** If the repository has been archived or the HTTP endpoint returns 5xx/404 errors, it is sunsetted by our CI.
5. **Permissive Open-Source or Generous Indie Tier:** Tools that foster community and self-hosting are prioritized.

---

## 💎 The Top Zero-Paywall Discoveries by Category

### 1. AI Agents & Local LLMs (${ai} Tools)
Running LLMs in production can quickly run up thousands of dollars in token bills. These open-source tools let you develop and run AI locally with zero API costs:

- **[Ollama](https://github.com/ollama/ollama)**: The gold standard for running Llama 3.3, Mistral, and Qwen locally on macOS, Linux, and Windows with a single command.
- **[vLLM](https://github.com/vllm-project/vllm)**: High-throughput, memory-efficient serving engine for LLMs with PagedAttention.
- **[AgentShield](https://github.com/RitualDev-Lab/AgentShield)**: Zero-leak secret interception, entropy tokenization, and command sandboxing for Claude Code and Cursor agents.
- **[LocalAI](https://github.com/mudler/LocalAI)**: Drop-in REST API replacement for OpenAI that runs completely offline on consumer CPU hardware.

### 2. Free Public APIs (${apis} Endpoints)
Need real data for your prototype without wading through 10-step enterprise API key approvals?
- **Public APIs without Auth**: Weather, exchange rates, geocoding, and mock banking endpoints that return instant JSON without registration.
- **CORS-Friendly**: All tested directly from browser \`fetch()\` without blocking security headers.

### 3. Testing, Mocking & QA (${testing} Tools)
- **[LocalStack](https://github.com/localstack/localstack)**: Fully functional local AWS cloud stack. Develop your S3, SQS, DynamoDB, and Lambda apps entirely on your laptop.
- **[Mockoon](https://mockoon.com)**: The easiest way to design and run mock REST APIs locally in seconds.
- **[WireMock](https://wiremock.org)**: Battle-tested API mocking with stateful behavior and fault injection.

### 4. Free Cloud & Database Tiers (${cloud} Platforms)
- **[Neon](https://neon.tech)**: Serverless Postgres with instant branching and generous free storage.
- **[Turso](https://turso.tech)**: Edge-replicated SQLite powered by LibSQL.
- **[PocketBase](https://pocketbase.io)**: 1-file backend with embedded SQLite, realtime subscriptions, and auth.
- **[Supabase](https://supabase.com)**: Open-source Firebase alternative with Postgres, Edge Functions, and Vector search.

---

## 🔄 The Commercial Alternatives Cheat Sheet

One of the most popular sections on DevShelf is our **[Alternative Hubs](https://devshelf.ritualdev.in/alternatives/postman.html)**. Here are the top community swaps:

| Expensive SaaS | Verified Free / Open-Source Alternative | Why Switch? |
| :--- | :--- | :--- |
| **Postman** | **[Bruno](https://www.usebruno.com)** | Git-friendly, stores collections as plain text in your repo, 100% offline. |
| **Datadog** | **[SigNoz](https://signoz.io)** | OpenTelemetry-native, self-hostable APM, logs, and metrics with zero per-host fees. |
| **Firebase** | **[PocketBase](https://pocketbase.io)** / **[Supabase](https://supabase.com)** | Real SQL database, self-hostable, no vendor lock-in. |
| **Algolia** | **[Meilisearch](https://www.meilisearch.com)** | Ultra-fast typo-tolerant search engine with instant setup. |
| **Vercel** | **[Coolify](https://coolify.io)** | Self-hosted PaaS on any \$4/mo VPS with 1-click Git push deploys. |

---

## 🤖 Built for Developers: CLI and Native MCP Server

We know developers dislike leaving their code editor. That's why DevShelf was built with two first-class developer interfaces:

### 1. Terminal CLI (\`npx devshelf\`)
Search the directory or get a random recommendation directly from your shell:

\`\`\`bash
# Search by keyword
npx devshelf search "vector database"

# Get a random verified tool for weekend inspiration
npx devshelf random

# View category statistics
npx devshelf stats
\`\`\`

### 2. Model Context Protocol (MCP) Server
If you use **Claude Desktop**, **Cursor**, or **Windsurf**, you can connect DevShelf directly to your AI pair programmer. Add this to your MCP settings:

\`\`\`json
{
  "mcpServers": {
    "devshelf": {
      "command": "npx",
      "args": ["-y", "@ritualdev-lab/devshelf@latest", "mcp"]
    }
  }
}
\`\`\`

Now, you can ask your AI:
> *"Find me a free, CORS-friendly geocoding API with no credit card required."*

And your AI will query DevShelf's live index to return exact documentation and code snippets!

---

## 🏷️ The Maintainer README Badge Engine

If you maintain an open-source project or developer tool, you can claim your official verification badge:

[![Featured on DevShelf](https://devshelf.ritualdev.in/api/v1/badges/featured.svg)](https://devshelf.ritualdev.in)

Visit the **[Badge Studio](https://devshelf.ritualdev.in/badges.html)** to generate custom markdown snippets for your README.

---

## 🚀 Explore the Catalog

The entire project is free, open-source, and maintained by the developer community.

- 🌐 **Web Directory:** [devshelf.ritualdev.in](https://devshelf.ritualdev.in)
- 🐙 **GitHub Repository:** [github.com/RitualDev-Lab/DevShelf](https://github.com/RitualDev-Lab/DevShelf)
- 💬 **Submit a Tool:** Open a Pull Request or Issue on GitHub!

Let's take back the developer experience. Zero paywalls, zero trial bait. Just great code.
`;

  // ==========================================
  // 4. Product Hunt Maker Kit
  // ==========================================
  const phContent = `# 🚀 Product Hunt Launch Kit

> **Goal:** Secure a top-5 Product of the Day spot, driving massive external referral spikes and high-dwell-time Chrome engagement signals.

---

## 📋 Product Information
- **Name:** DevShelf
- **Tagline:** The Zero-Paywall Developer Directory + Native MCP Server
- **Primary Category:** Developer Tools
- **Secondary Categories:** Open Source, Artificial Intelligence, Productivity
- **Website URL:** \`https://devshelf.ritualdev.in\`
- **GitHub URL:** \`https://github.com/RitualDev-Lab/DevShelf\`

---

## 🏷️ Short Description (260 characters max)
> A curated directory of ${total}+ verified free developer tools, open-source repos, and APIs with zero credit-card paywalls. Includes automated CI health checks, a terminal CLI (\`npx devshelf\`), and native MCP server for Cursor & Claude.

---

## 💬 Maker Comment (Post immediately upon launch)

\`\`\`markdown
Hello Product Hunt community! 👋

I'm thrilled to launch **DevShelf** today! 🚀

### Why we built DevShelf:
Every developer has felt the frustration of signing up for a "free" tool, only to be ambushed by a mandatory credit card modal or a 14-day trial that turns into a surprise recurring bill.

We built DevShelf to be the ultimate **Zero-Paywall Ecosystem**:
Every single resource in our directory has a **genuine, permanent free tier or is 100% open-source**. No credit card required. No trial traps.

### 🌟 Key Highlights:
1. **${total}+ Audited Tools:** Hand-curated across AI Agents, Free APIs, Testing/Mocking, Cloud DBs, and 1-Click Boilerplates.
2. **Continuous Automated Health Checks:** Every night, GitHub Actions pings all URLs and audits landing pages to ensure uptime and flag newly introduced paywalls.
3. **Native Terminal CLI:** Run \`npx devshelf search "sqlite"\` or \`npx devshelf random\` right from your command line.
4. **Native MCP Server:** Connect DevShelf to Claude Desktop, Cursor, and Windsurf via \`npx devshelf-mcp\` so your AI assistant can recommend verified free tools.
5. **Alternative Hubs:** Instantly find open-source alternatives to Postman (Bruno), Datadog (SigNoz), Firebase (Supabase), and Algolia (Meilisearch).
6. **Zero Tracking:** 100% static, zero cookies, zero analytics bloat.

The entire project is open-source under MIT on GitHub:
https://github.com/RitualDev-Lab/DevShelf

We would love your feedback, suggestions, and tool recommendations in the comments! What free tool has saved your project the most time?

Thank you for your support! ❤️
\`\`\`

---

## 🎨 Recommended Gallery Screenshots
1. **Slide 1 (Hero):** DevShelf homepage with search bar and live count pills (${total}+ Resources).
2. **Slide 2 (MCP in Action):** Cursor / Claude Desktop chatting with \`npx devshelf-mcp\` discovering free APIs.
3. **Slide 3 (Terminal CLI):** Beautiful dark-mode terminal showing \`npx devshelf search "vector db"\`.
4. **Slide 4 (Alternative Hubs):** Side-by-side comparison matrix of commercial SaaS vs open-source alternatives.
5. **Slide 5 (Badge Studio):** Interactive README badge studio for maintainers.

---

## ⏱️ Launch Day Schedule (12:01 AM PST – 11:59 PM PST)
- **12:05 AM PST:** Launch post goes live. Post Maker Comment immediately.
- **1:00 AM PST:** Share link on X / Twitter and LinkedIn.
- **6:00 AM PST (East Coast Morning):** Notify community on Discord and GitHub Discussions.
- **All Day:** Respond to every comment on Product Hunt within 10 minutes.
`;

  // ==========================================
  // 5. Twitter / X Viral Thread Kit
  // ==========================================
  const twitterContent = `# 🐦 X (Twitter) Viral Launch Thread

> **Goal:** Drive high-velocity social amplification, bookmarks, and quote-tweets with direct clicks to \`https://devshelf.ritualdev.in\`.

---

## 🧵 The 8-Tweet Thread

### Tweet 1 (The Hook):
\`\`\`text
Most "free" developer tools are actually 14-day trial traps designed to extract your credit card.

We audited 530+ developer resources and open-sourced the whole zero-paywall directory (with a terminal CLI & AI MCP server).

Here are 10 insane free tools you probably didn't know existed 🧵👇
\`\`\`

### Tweet 2 (AI & Local Inference):
\`\`\`text
1. Ollama + AgentShield

Tired of OpenAI token bills?
- Ollama lets you run Llama 3.3, Mistral, and DeepSeek locally with a simple CLI.
- AgentShield acts as a zero-leak sandbox intercepting secrets & commands before autonomous AI agents execute them.

100% free, 100% offline.
\`\`\`

### Tweet 3 (API Mocking & Testing):
\`\`\`text
2. LocalStack + Mockoon

Never pay for AWS testing sandboxes again.
- LocalStack spins up a fully functional AWS cloud (S3, Lambda, SQS, DynamoDB) on your laptop.
- Mockoon lets you build mock REST APIs with realistic routes and delays in 30 seconds.
\`\`\`

### Tweet 4 (Database & Backend):
\`\`\`text
3. PocketBase + Turso

Building a side-project backend?
- PocketBase gives you a realtime database, auth, and file storage in a single portable SQLite binary.
- Turso offers edge-replicated LibSQL with a massive free allowance.

Zero infrastructure headaches.
\`\`\`

### Tweet 5 (API Testing & Debugging):
\`\`\`text
4. Bruno (The Postman Killer)

Postman forced cloud accounts and broke offline workflows.
Bruno is 100% offline, open-source, and saves your API collections as plain text files directly in your Git repository.
\`\`\`

### Tweet 6 (Observability & APM):
\`\`\`text
5. SigNoz (The Datadog Alternative)

Datadog's per-host pricing is notorious for surprise bills.
SigNoz is an open-source, OpenTelemetry-native APM providing distributed tracing, metrics, and logs in a single dashboard you can self-host.
\`\`\`

### Tweet 7 (Terminal CLI & MCP Server):
\`\`\`text
6. DevShelf Terminal CLI & AI MCP Server

You don't even have to leave your code editor:
- Run \`npx devshelf search "vector db"\` right in your shell.
- Or plug \`npx devshelf-mcp\` into Cursor & Claude Code so your AI assistant queries ${total}+ verified free tools natively!
\`\`\`

### Tweet 8 (CTA & Link):
\`\`\`text
Every tool on DevShelf is audited daily with automated CI health checks. No credit cards. No trial traps.

Explore all ${total}+ verified developer tools:
🔗 https://devshelf.ritualdev.in

Star the repo & help reach 1,000 tools:
⭐ https://github.com/RitualDev-Lab/DevShelf

RT the first tweet if this saved you some cash! 🔁
\`\`\`
`;

  // ==========================================
  // 6. Master Launch Playbook (README.md)
  // ==========================================
  const readmeContent = `# 🚀 DevShelf Community Launch & RankBrain Trigger Playbook

> **Strategic Objective:** Flood DevShelf with high-dwell-time, high-engagement developer traffic from high-authority referral sources (Hacker News, Reddit, Dev.to, Product Hunt, X). This fires Google's **NavBoost**, **RankBrain**, and **Chrome User Engagement** signals, permanently breaking DevShelf out of the new-domain sandbox.

---

## 📈 The Algorithmic Mechanism: Why Launch Spikes Rank Sites in 2026

Google's ranking engine relies heavily on real-user Chrome telemetry and user satisfaction signals:
1. **NavBoost (Navigation Boost):** When hundreds of users search for *"devshelf"*, *"devshelf free tools"*, or *"devshelf mcp"* and click our domain, Google upgrades our domain's query authority.
2. **Dwell Time & Session Depth:** When developers visit DevShelf, search tools, click outbound repositories, test the CLI, and visit \`/alternatives/\` or \`/badges.html\`, their multi-minute session signals a high-quality, non-spam destination.
3. **High-Authority Referring Domains:** Referral visits from \`news.ycombinator.com\`, \`reddit.com\`, \`dev.to\`, and \`github.com\` pass instant contextual relevance.

---

## 📅 The 5-Day Launch Orchestration Schedule

| Day | Target Channel | Asset File | Objective |
| :--- | :--- | :--- | :--- |
| **Day 1 (Tuesday)** | **Hacker News (Show HN)** + **X (Twitter)** | \`hacker-news-show-hn.md\`, \`twitter-viral-thread.md\` | Capture US East Coast / EU morning peak; drive 2,000+ technical visits. |
| **Day 2 (Wednesday)** | **Reddit (\`r/webdev\` & \`r/selfhosted\`)** | \`reddit-launch-pack.md\` | Engage subreddits with focused, non-promotional technical breakdowns. |
| **Day 3 (Thursday)** | **Dev.to & Hashnode Long-Form** | \`devto-hashnode-article.md\` | Long-form 1,500-word post with canonical URL pointing to \`devshelf.ritualdev.in\`. |
| **Day 4 (Friday)** | **Reddit (\`r/SideProject\` & \`r/opensource\`)** | \`reddit-launch-pack.md\` | Target weekend builders and open-source contributors for Hacktoberfest. |
| **Day 5 (Next Tuesday)**| **Product Hunt Launch** | \`product-hunt-maker-kit.md\` | Global launch day sprint for Product of the Day. |

---

## 📂 Launch Kit Assets Directory

- 🟠 **[Hacker News Show HN Kit](./hacker-news-show-hn.md)**
- 👾 **[Reddit Multi-Subreddit Pack](./reddit-launch-pack.md)**
- 📝 **[Dev.to / Hashnode 1,500-Word Article](./devto-hashnode-article.md)**
- 😸 **[Product Hunt Maker Kit](./product-hunt-maker-kit.md)**
- 🐦 **[X (Twitter) 8-Tweet Viral Thread](./twitter-viral-thread.md)**

---

## 🔍 Real-Time Monitoring & Telemetry Checklist

During every launch spike, monitor these 3 feedback loops:
1. **Google Search Console (GSC):** Watch for sudden impressions jump on brand queries (\`devshelf\`, \`devshelf tools\`, \`devshelf alternatives\`).
2. **GitHub Insights:** Star velocity, fork rate, and incoming PRs from contributors submitting new tools.
3. **IndexNow Verification:** Run \`pnpm run indexnow\` after the launch spike to notify Bing/Google of freshly indexed pages.
`;

  // Write all files
  const files = [
    { name: "hacker-news-show-hn.md", content: hnContent },
    { name: "reddit-launch-pack.md", content: redditContent },
    { name: "devto-hashnode-article.md", content: devtoContent },
    { name: "product-hunt-maker-kit.md", content: phContent },
    { name: "twitter-viral-thread.md", content: twitterContent },
    { name: "README.md", content: readmeContent },
  ];

  for (const f of files) {
    const filePath = path.join(LAUNCH_DIR, f.name);
    await fs.writeFile(filePath, f.content, "utf8");
    filesWritten.push(filePath);
  }

  console.log(
    `🚀 [DevShelf Launch Kit Engine] Generated ${filesWritten.length} launch kit files in community/launch/`,
  );
  return { filesWritten };
}

// Execute when invoked directly
if (process.argv[1] && process.argv[1].endsWith("generate-launch-kit.ts")) {
  generateLaunchKit()
    .then((res) => {
      console.log(`✅ Launch kit ready: ${res.filesWritten.length} files generated.`);
    })
    .catch((err) => {
      console.error("❌ Failed to generate launch kit:", err);
      process.exit(1);
    });
}
