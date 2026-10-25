# 👾 Reddit Community Launch Pack

> **Goal:** High-engagement, value-first Reddit posts that drive thousands of genuine developer visits, establishing DevShelf as the canonical index in Chrome navigation history.

---

## 📌 Post 1: r/webdev (2.2M+ members)
- **Flair:** `Project / Showcase` or `Resource`
- **Title:** `Tired of fake "free tier" dev tools, so we curated 546+ zero-paywall tools, APIs, and boilerplates with automated health checks`
- **Post Body:**

```markdown
Hey r/webdev!

Over the past few months, my team and I got fed up with clicking "Free Tier" on devtools only to discover it requires an upfront credit card, or expires after 14 days, or silently abandons CORS support on their free endpoints.

We decided to build an open-source, community-maintained directory called **DevShelf**:
👉 **https://devshelf.ritualdev.in**

### What makes this different from awesome lists:
1. **Zero-Paywall Guarantee:** Every tool is audited to ensure it offers a permanent free tier or is 100% open-source with no upfront credit card required.
2. **Automated CI Health Checks:** Our daily GitHub Action pings every single resource, checking HTTP 200 uptime, detecting dead links, and checking for newly introduced paywalls.
3. **Alternative Hubs:** Quick reference for common commercial tools (e.g. Postman → Bruno, Datadog → SigNoz, Firebase → Supabase/PocketBase, Algolia → Meilisearch).
4. **Terminal CLI & AI MCP Server:** You can search tools directly in your terminal via `npx devshelf search <query>`, or plug `npx devshelf-mcp` into Cursor or Claude Code so your AI assistant knows real free APIs.
5. **No tracking or cookies:** Clean static site, zero third-party tracking scripts.

### Some of the 546+ resources indexed:
- **Free APIs:** Currency, Geocoding, IP, Weather, Mock Payment endpoints without CORS issues.
- **Local AI:** Ollama, vLLM, AgentShield, LocalAI for running local models without OpenAI bills.
- **Testing & Mocking:** LocalStack, WireMock, Mockoon, MSW, Playwright.
- **Cloud & DBs:** Neon (Serverless Postgres), Turso (LibSQL/SQLite), Supabase, Railway, Fly.io.

Source code and catalog data are completely open on GitHub:
https://github.com/RitualDev-Lab/DevShelf

Would love to hear your thoughts and suggestions for web dev tools we should add!
```

---

## 📌 Post 2: r/selfhosted (350k+ members)
- **Flair:** `Open Source` or `Tool`
- **Title:** `We indexed 337+ open-source, self-hostable developer tools & stacks (with automated uptime & license auditing)`
- **Post Body:**

```markdown
Hey r/selfhosted!

If you prefer self-hosting your developer infrastructure rather than getting locked into proprietary SaaS pricing, you might like this:

We built **DevShelf** (https://devshelf.ritualdev.in), an open-source directory that indexes **337+ self-hostable, open-source repositories and tools** for developers.

### Highlights for self-hosters:
- **Commercial SaaS Replacements:** We track direct open-source alternatives to:
  - Datadog / New Relic → SigNoz, Grafana, OpenTelemetry
  - Firebase → Supabase, PocketBase, Appwrite
  - Vercel / Heroku → Coolify, Dokku, CapRover
  - Postman → Bruno, Hoppscotch
  - Algolia → Meilisearch, Typesense
- **Strict Verification:** Every tool has a verified open-source license (MIT, Apache 2.0, AGPL, BSD) and is audited daily via GitHub Actions for repository health and active maintenance.
- **CLI & Local-First:** You can query the directory completely offline or via CLI with `npx devshelf`.

Check it out live: https://devshelf.ritualdev.in  
Repo: https://github.com/RitualDev-Lab/DevShelf

Let me know what self-hosted developer tools we're missing!
```

---

## 📌 Post 3: r/opensource (250k+ members)
- **Flair:** `Project`
- **Title:** `DevShelf: An open-source directory of 546+ free developer tools with zero telemetry and native MCP server`
- **Post Body:**

```markdown
Hello r/opensource!

We built **DevShelf** (https://devshelf.ritualdev.in) to solve a growing problem: the commercialization and paywalling of developer tools.

### What is DevShelf?
A 100% open-source, community-driven catalog of **546+ verified developer tools, free public APIs, AI agents, and 1-click boilerplates** that never require credit cards or trial commitments.

### Open-Source Architecture:
- The entire catalog lives in JSON schemas in the git repo.
- Daily CI workflows test all URLs for uptime and dead links.
- We built a native Model Context Protocol (MCP) server (`npx devshelf-mcp`) and interactive CLI (`npx devshelf`).
- First-party SVG Badge Studio (https://devshelf.ritualdev.in/badges.html) allowing open-source maintainers to show verification badges in their READMEs.
- Zero analytics, zero ad-tech, zero monetization paywalls.

We are currently welcoming community contributions and Hacktoberfest submissions!
GitHub: https://github.com/RitualDev-Lab/DevShelf

Feedback and PRs are warmly welcomed!
```

---

## 📌 Post 4: r/SideProject (180k+ members)
- **Flair:** `Launched`
- **Title:** `I built a zero-paywall developer directory to help indie hackers build for $0 [Includes CLI + MCP Server]`
- **Post Body:**

```markdown
Hey indie makers!

When building side projects on a budget, SaaS bills for authentication, database hosting, error logging, and APIs can kill a project before it even launches.

To help myself and other makers bootstrap with $0 infrastructure costs, I built **DevShelf**:
👉 https://devshelf.ritualdev.in

It's a curated directory of **546+ developer resources** with permanent free tiers, no credit-card requirements, and zero trial traps.

### Features:
- Filter by: Free APIs, CLI Tools, AI Agents, Mocking/QA, 1-Click Boilerplates, and Free Cloud.
- "My Stack" builder to assemble your free side-project stack and export it.
- Terminal CLI: `npx devshelf search "postgres"`
- MCP Server for Cursor/Claude: `npx devshelf-mcp`

Would love your feedback on the UI and any free gems you use for your side projects!
```

---

## 📋 Reddit Posting Rules & Safety
1. **Spread across 48 hours:** Do NOT post to all 4 subreddits in the same hour. Stagger:
   - Day 1: `r/webdev` (Morning) & `r/selfhosted` (Evening)
   - Day 2: `r/SideProject` (Morning) & `r/opensource` (Evening)
2. **Be the OP in comments:** Reply to every question, thank people for suggestions, and accept constructive criticism openly.
3. **Never use URL shorteners:** Always use direct canonical URLs (`https://devshelf.ritualdev.in`).
