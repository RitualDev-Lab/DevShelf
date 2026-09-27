# 🎃 Hacktoberfest 2026 at DevShelf

Welcome to **Hacktoberfest 2026** at **DevShelf**! 🍁

DevShelf is a community-driven, 100% paywall-free index of developer tools, open-source APIs, AI frameworks, CLI utilities, and developer perks. We are thrilled to welcome first-time contributors and seasoned open-source veterans alike.

This guide outlines our quality standards, qualifying contribution tracks, and validation steps so your Pull Requests are reviewed promptly and counted towards your Hacktoberfest badge.

---

## 🌟 Our Philosophy: Quality Over Spam

Hacktoberfest is a celebration of open source. To protect our community and maintainers' time, **DevShelf enforces a strict zero-spam policy**:

- Every entry must provide genuine value to software engineers.
- Every URL must be direct and clean (zero UTM tags, tracking parameters, or affiliate links).
- Every submitted tool or API must have a verified permanent free tier or be 100% open source under an OSI-approved license.
- Automated PRs, unvetted bulk lists, or whitespace/typo churn will be labeled `spam` or `invalid` and closed immediately.

Quality PRs will receive prompt reviews (usually within 24–48 hours) and direct maintainer mentorship!

---

## 🚀 4 Ways to Participate

### 1. 🗃️ Curate Missing Developer Gems (Shelf Datasets)
DevShelf organizes resources across structured JSON datasets in `shelf/`. Each file is protected by strict JSON Schemas (`schemas/`):

- [`shelf/apis.json`](shelf/apis.json) &mdash; Free public APIs (authentication, endpoints, CORS).
- [`shelf/ai-tools.json`](shelf/ai-tools.json) &mdash; Open-source AI agents, LLM toolkits, and inference runtimes.
- [`shelf/cli-tools.json`](shelf/cli-tools.json) &mdash; Terminal utilities, productivity boosters, and shell tools.
- [`shelf/testing-qa.json`](shelf/testing-qa.json) &mdash; Testing frameworks, mock servers, performance profiling.
- [`shelf/free-cloud.json`](shelf/free-cloud.json) &mdash; Cloud databases, serverless platforms, and managed infrastructure with generous free tiers.
- [`shelf/contributors-wanted.json`](shelf/contributors-wanted.json) &mdash; Active open-source repositories welcoming contributors.
- [`shelf/perks.json`](shelf/perks.json) &mdash; Verified student developer packs, startup programs, and non-profit credits.

### 2. 🔗 Heal the Shelf (Link Rot & Stale Endpoints)
Help keep DevShelf reliable!
- Browse open issues labeled [`good first issue`](https://github.com/RitualDev-Lab/DevShelf/labels/good%20first%20issue) and [`broken-link`](https://github.com/RitualDev-Lab/DevShelf/labels/broken-link).
- Verify dead endpoints, update defunct URLs, or replace abandoned repositories with modern, actively maintained alternatives.

### 3. 🎨 Enhance Web UI & Search Experience
Our web portal (`site/`) is built with vanilla HTML, modern CSS, and JavaScript with fast local client-side search.
- Add keyboard shortcuts (`/` to focus search, `Esc` to clear).
- Improve mobile touch responsiveness, dark mode contrast, or screen-reader accessibility (WCAG AA).
- Optimize performance, Largest Contentful Paint (LCP), and Schema.org metadata.

### 4. ⚙️ Automation, Schemas & Tooling
- Improve our test suite in `tests/`.
- Add automated schema assertions or link-checking enhancements in `scripts/`.
- Help improve generator scripts (`scripts/generate-seo.ts`, `scripts/build-site.ts`).

---

## 🛠️ Step-by-Step Contribution Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/DevShelf.git
cd DevShelf
pnpm install
```

### 2. Create a Feature Branch
```bash
git checkout -b feat/add-my-tool
```

### 3. Make Your Edits
Edit the target file in `shelf/`, `site/`, or `scripts/`. If you are using VS Code, your editor will automatically validate your JSON entries against our schemas in `schemas/`.

### 4. Run the Full Test Suite & Validation Pipeline
Before opening a PR, ensure all local automated checks pass:

```bash
# 1. Run unit & integrity tests
pnpm test

# 2. Validate JSON schemas across all datasets
pnpm run validate

# 3. Verify clean URLs and cross-shelf references
node scripts/validate-links.js

# 4. Rebuild the site, README, sitemap, and SEO pages
pnpm run build

# 5. Check code formatting & linting
pnpm run format:check
pnpm run lint
```

*(Tip: If formatting has minor differences, run `pnpm run format` to auto-fix!)*

### 5. Commit & Submit PR
Commit with a conventional commit message:
```bash
git add -A
git commit -m "feat(shelf): add AwesomeTool to cli-tools"
git push origin feat/add-my-tool
```

Open a Pull Request on GitHub. When our automated PR validation workflow passes, maintainers will review and merge!

---

## 🏆 Rewards & Recognition

- Merged PRs earn the official **Hacktoberfest 2026** credit.
- All merged contributors are automatically credited in the repository's **Community Contributors** hall of fame in `README.md`.
- Featured tool submissions are showcased across DevShelf social channels and release updates.

Happy Hacking! 🎃🚀
