# ?? Contributing to DevShelf

Thank you for your interest in contributing to **DevShelf**!  
DevShelf is an open-source, crowdsourced directory committed to curating the best **100% free, paywall-free developer tools, APIs, AI agents, CLI utilities, and startup perks**.

---

## ?? Ways to Contribute

There are two easy ways to contribute:

### 1. The Fast Way: Submit via GitHub Issues (No Git Required)
If you just want to recommend a great tool or API without cloning the repo:
- ?? **[Submit an Open Source Project / Tool](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=01_submit_tool.yml)**
- ?? **[Submit a Free Public API](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=02_submit_api.yml)**
- ?? **[Report a Dead Link / Changed URL](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=03_report_dead_link.yml)**
- ?? **[Report Inappropriate / Paywalled Content](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=04_content_report.yml)**

Fill out the form and submit. Maintainers will review and merge it!

---

### 2. The Direct Way: Submit via Pull Request (PR)

If you are comfortable with Git:

#### Step 1: Fork & Clone
```bash
git clone https://github.com/<your-username>/DevShelf.git
cd DevShelf
pnpm install
```

#### Step 2: Choose the Correct Shelf File
Locate the relevant JSON file inside the `shelf/` directory:
- `shelf/apis.json` &mdash; Free public APIs with generous/no paywalls.
- `shelf/cli-tools.json` &mdash; Terminal, CLI, and developer workflow tools.
- `shelf/ai-tools.json` &mdash; Open-source AI agents, local LLM tooling, inference runtimes.
- `shelf/testing-qa.json` &mdash; Testing frameworks, mocking libraries, QA automations.
- `shelf/free-cloud.json` &mdash; Cloud databases, serverless runtimes with permanent free tiers.
- `shelf/contributors-wanted.json` &mdash; FOSS projects looking for community contributors.
- `shelf/perks.json` &mdash; Verified student, startup, or open-source maintainer discounts/credits.

#### Step 3: Add Your Entry
Ensure the JSON matches the existing schema for that file. For example:
```json
{
  "name": "YourTool",
  "url": "https://github.com/org/yourtool",
  "category": "CLI & Productivity",
  "description": "Concise 1-2 sentence description explaining what it does and why developers need it.",
  "language": "Rust",
  "license": "MIT"
}
```

#### Step 4: Validate Data & Endpoints Locally
DevShelf comes with automated verification scripts. Run them before pushing:
```bash
# 1. Validate JSON schema and required fields
pnpm run validate

# 2. Check that all URLs are alive (HTTP 200)
npx tsx scripts/check-links.ts

# 3. Rebuild the README and web directory assets
pnpm run build
```

#### Step 5: Commit & Open a Pull Request
```bash
git checkout -b add-my-tool
git commit -m "feat(shelf): add MyTool to cli-tools.json"
git push origin add-my-tool
```
Open a PR against the `main` branch. Our automated CI will run checks and ping the live URL to verify health.

---

## ??? Inclusion Criteria & Quality Guidelines

To preserve high quality for the developer community:
* **Genuine Free Tier or 100% FOSS**: Tools must be open-source or have a genuine, non-expiring free tier (no "14-day free trial that requires a credit card").
* **Active & Maintained**: The tool/API must be actively maintained and currently functioning.
* **Working Endpoints**: All URLs must return HTTP 200 or authentic documentation.
* **No Spam / Scams**: Affiliate links, referral tracking codes, crypto coins/NFT promotions, and SEO link farms are strictly forbidden and will result in an immediate block.
* **Neutral, Objective Descriptions**: Avoid hyperbole such as *"the best tool in the universe"* or *"revolutionary AI disruption"*. State what it does plainly.

---

## 🎖️ Display the "Featured on DevShelf" Badge

If your project is curated on DevShelf, show it off on your README! Pick whichever style fits your project aesthetic:

### Option 1: Modern Electric Violet (Recommended)
[![Featured on DevShelf](https://img.shields.io/badge/Featured_on-DevShelf-8B5CF6?style=for-the-badge&logo=compass&logoColor=06B6D4&labelColor=0B0F19)](https://devshelf.ritualdev.in/)

```markdown
[![Featured on DevShelf](https://img.shields.io/badge/Featured_on-DevShelf-8B5CF6?style=for-the-badge&logo=compass&logoColor=06B6D4&labelColor=0B0F19)](https://devshelf.ritualdev.in/)
```

### Option 2: Terminal Emerald
[![DevShelf Verified](https://img.shields.io/badge/DevShelf-100%25_Verified_FOSS-10B981?style=for-the-badge&logo=gnubash&logoColor=white&labelColor=111827)](https://devshelf.ritualdev.in/)

```markdown
[![DevShelf Verified](https://img.shields.io/badge/DevShelf-100%25_Verified_FOSS-10B981?style=for-the-badge&logo=gnubash&logoColor=white&labelColor=111827)](https://devshelf.ritualdev.in/)
```

### Option 3: Minimal Dark Pill
[![Featured on DevShelf](https://img.shields.io/badge/📚_Featured_on-DevShelf-6366F1?style=flat&labelColor=1E1E2E&color=A855F7)](https://devshelf.ritualdev.in/)

```markdown
[![Featured on DevShelf](https://img.shields.io/badge/📚_Featured_on-DevShelf-6366F1?style=flat&labelColor=1E1E2E&color=A855F7)](https://devshelf.ritualdev.in/)
```

---

## 📜 Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any violations or inappropriate content to repository administrators.
