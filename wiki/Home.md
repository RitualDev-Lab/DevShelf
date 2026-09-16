# ?? Welcome to the DevShelf Wiki

**DevShelf** is an open-source, crowdsourced directory of high-utility developer tools, free APIs, AI agents, CLI productivity utilities, testing frameworks, and startup perks.

Unlike static markdown "Awesome" lists that slowly decay into dead links and abandoned URLs over time, DevShelf is built as an **automated, programmatic database** with:
- Structured JSON schemas in `shelf/*.json`.
- Automated weekly HTTP link validation ([`scripts/check-links.ts`](Automated-Validation-Pipeline)).
- An instantaneous, zero-latency [interactive Web Directory](https://ritualdev-lab.github.io/DevShelf/) with category filtering and fuzzy search.
- Zero-paywall guarantee (only 100% open-source or genuine perpetual free tiers).

---

## ??? Wiki Navigation

1. **[?? Curated Categories & Schemas](Curated-Categories)**
   Detailed breakdown of the 7 shelf categories, inclusion criteria, and metadata properties.
2. **[?? Automated Validation & Healthcheck Pipeline](Automated-Validation-Pipeline)**
   Technical explanation of how dead links are detected, concurrent pings, bot-defense handling, and GitHub Actions cron jobs.
3. **[?? Contributor Guide & Development Workflow](Contributor-Guide-&-Workflows)**
   Step-by-step instructions for submitting a new tool, testing endpoints locally, and passing CI validation.
4. **[?? Ecosystem Synergy](Ecosystem-Synergy)**
   How DevShelf interconnects with FlashLane, GitWhisper, AutoHeal-QA, and LocalRAG-Kit.

---

## ??? System Architecture

DevShelf maintains a single source of truth for all curated developer resources:

```mermaid
flowchart TD
    subgraph DataLayer ["1. Source of Truth (shelf/*.json)"]
        A1[shelf/apis.json]
        A2[shelf/cli-tools.json]
        A3[shelf/ai-tools.json]
        A4[shelf/testing-qa.json]
        A5[shelf/free-cloud.json]
        A6[shelf/contributors-wanted.json]
        A7[shelf/perks.json]
    end

    subgraph Validation ["2. Automated Healthcheck"]
        B1[scripts/validate-shelf.ts]
        B2[scripts/check-links.ts]
        A1 & A2 & A3 & A4 & A5 & A6 & A7 --> B1
        B1 --> B2
    end

    subgraph Distribution ["3. Dual Delivery Targets"]
        C1[scripts/build-readme.ts] --> D1[README.md - GitHub Organic Search]
        C2[scripts/build-site.ts] --> D2[site/data.json -> GitHub Pages Web App]
        B2 --> C1
        B2 --> C2
    end
```

---

## ??? The 3 Core Guarantees of DevShelf

1. **0% Hidden Paywalls**: No "14-day free trials" that require credit cards. Every resource must offer an authentic perpetual free tier or be 100% Free and Open Source Software (FOSS).
2. **100% Endpoint Health**: If a project domain expires, gets acquired, or 404s, our automated weekly healthcheck catches it and alerts maintainers to update or delist it.
3. **Developer First**: Concise, objective descriptions without marketing buzzwords, affiliate links, or tracking parameters.
