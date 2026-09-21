import fs from "node:fs/promises";
import path from "node:path";

async function build() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");

  const readJson = async (filename: string) => {
    const raw = await fs.readFile(path.join(shelfDir, filename), "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  };

  const apis = await readJson("apis.json");
  const aiTools = await readJson("ai-tools.json");
  const cliTools = await readJson("cli-tools.json");
  const testingQa = await readJson("testing-qa.json");
  const freeCloud = await readJson("free-cloud.json");
  const contributors = await readJson("contributors-wanted.json");
  const perks = await readJson("perks.json");

  const totalItems =
    apis.length +
    aiTools.length +
    cliTools.length +
    testingQa.length +
    freeCloud.length +
    contributors.length +
    perks.length;

  let md = `<div align="center">

# 📚 DevShelf

### The Crowdsourced Developer Ecosystem & Zero-Cost Resource Index
**Discover high-quality developer tools, verified free APIs, AI agents, and open-source projects with zero paywalls.**

[![Live Web Directory](https://img.shields.io/badge/Web_Directory-Live_Search_%26_Filters-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ritualdev-lab.github.io/DevShelf)
[![Curated Resources](https://img.shields.io/badge/Listed_Resources-${totalItems}+_Curated-blueviolet?style=for-the-badge)](https://github.com/RitualDev-Lab/DevShelf)
[![Endpoint Health](https://img.shields.io/badge/Endpoint_Health-100%25_Verified-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/RitualDev-Lab/DevShelf/actions)
[![Open Source](https://img.shields.io/badge/Open_Source-100%25_FOSS-blue?style=for-the-badge)](https://github.com/RitualDev-Lab/DevShelf)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome_&_Amplified-brightgreen?style=for-the-badge)](#-how-to-submit-your-project-or-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<p align="center">
  <a href="https://ritualdev-lab.github.io/DevShelf"><b>🌐 Interactive Web App</b></a> •
  <a href="https://github.com/RitualDev-Lab/DevShelf/wiki"><b>📖 Project Wiki</b></a> •
  <a href="#-featured-spotlight--tools-of-the-week"><b>🔥 Featured Spotlight</b></a> •
  <a href="#-social-amplification-guarantee"><b>🚀 Social Guarantee</b></a> •
  <a href="#-top-contributors--community-wall"><b>👥 Contributors</b></a> •
  <a href="#-how-to-submit-your-project-or-api"><b>➕ Submit Yours</b></a>
</p>

<p align="center">
  <b>Quick Jump:</b>
  <a href="#-1-free--public-apis">Free APIs</a> (${apis.length}) •
  <a href="#-2-ai-agents--local-llm-tools">AI & LLMs</a> (${aiTools.length}) •
  <a href="#-3-cli--productivity-tools">CLI Tools</a> (${cliTools.length}) •
  <a href="#-4-testing--qa-reliability">Testing & QA</a> (${testingQa.length}) •
  <a href="#-5-free-cloud--developer-tiers">Free Cloud</a> (${freeCloud.length}) •
  <a href="#-6-contributors-wanted-up-for-grabs">Up for Grabs</a> (${contributors.length}) •
  <a href="#-7-developer-discounts--startup-perks">Dev Perks</a> (${perks.length})
</p>

---

</div>

## 💡 Why DevShelf?

Most "Awesome" lists suffer from two major problems:
1. **Link Rot & Dead Endpoints**: Outdated links, broken APIs, and unmaintained repos sit untouched for years.
2. **High Barriers for Indie Creators**: Solo developers and open-source creators struggle to get discovered amidst corporate marketing.

**DevShelf is built differently:**
- 🛡️ **Automated Health Checks**: GitHub Actions continuously ping every API, repository, and service to ensure endpoints are 100% active.
- 🌐 **Interactive Web UI**: Instant search, filter by license/language/auth, and 1-click clipboard copying via our GitHub Pages web application.
- 🚀 **1-Click Submissions**: Add your own project or API in 30 seconds via structured GitHub Issue forms.
- 📢 **Social Amplification**: Every merged project gets free social promotion across our developer channels.
- 🌟 **Quality First**: Hand-curated, zero paywalls, clear free tier transparency.

---

## 🔥 Featured Spotlight & Tools of the Week

Every week, we highlight outstanding open-source utilities, developer gems, and community submissions:

| Project | Category | Highlights | Links |
| :--- | :--- | :--- | :---: |
| **GitWhisper** | Git & Version Control | Local-first AI Git commit intelligence with Conventional Commits, AST secret redaction & atomic hunk splitting. | [GitHub](https://github.com/RitualDev-Lab/GitWhisper) |
| **FlashLane** | OS & Hardware Utilities | Universal high-speed bootable ISO/IMG USB writer with Rufus parity for Windows, macOS, & Linux. | [GitHub](https://github.com/RitualDev-Lab/FlashLane) |
| **AutoHeal-QA** | E2E Testing & Playwright | 100% Free & Local-first agentic self-healing E2E test runner for Playwright with zero cloud costs. | [GitHub](https://github.com/RitualDev-Lab/autoheal-qa) |
| **Ollama** | Local AI & Inference | Run Llama 3.3, Mistral, Qwen, and custom models locally with a simple CLI and REST API. | [GitHub](https://github.com/ollama/ollama) |
| **Bruno** | API Testing & Exploration | Fast, git-friendly open-source API client storing collections directly in your repo in plain text. | [GitHub](https://github.com/usebruno/bruno) |
| **PocketBase** | Databases & BaaS | Open-source backend in 1 single binary file with embedded SQLite, realtime subscriptions, and auth. | [Website](https://pocketbase.io) |

---

## 🚀 Social Amplification Guarantee

> [!IMPORTANT]
> ### 📢 We Promote Your Project When You Get Listed!
> Building great developer tools is hard. Getting discovered is even harder.  
> **When your tool, API, or project is accepted and merged into DevShelf:**
> 1. **🌟 Social Media Spotlight**: We publish a dedicated shoutout post about your project on **X (Twitter)** and **LinkedIn** via the RitualDev Lab channels.
> 2. **🌐 Permanent Web Directory Inclusion**: Your tool is permanently listed in our live search index at [ritualdev-lab.github.io/DevShelf](https://ritualdev-lab.github.io/DevShelf).
> 3. **🔗 High-Quality Backlink**: Guaranteed direct dofollow backlink to your GitHub repository or documentation.

---

## 🎖️ "Featured on DevShelf" Badges

Are you listed on DevShelf? Display an official badge on your project's \`README.md\` to show off your community verification:

### Style 1: Modern Purple (Recommended)
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ritualdev-lab.github.io/DevShelf/)

\`\`\`markdown
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ritualdev-lab.github.io/DevShelf/)
\`\`\`

### Style 2: Cyberpunk Neon Cyan
[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Curated%20Resource-00E5FF?style=for-the-badge&logo=github&logoColor=black)](https://ritualdev-lab.github.io/DevShelf/)

\`\`\`markdown
[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Curated%20Resource-00E5FF?style=for-the-badge&logo=github&logoColor=black)](https://ritualdev-lab.github.io/DevShelf/)
\`\`\`

### Style 3: Minimal Flat Square
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-blueviolet?style=flat-square&logo=googlechrome&logoColor=white)](https://ritualdev-lab.github.io/DevShelf/)

\`\`\`markdown
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-blueviolet?style=flat-square&logo=googlechrome&logoColor=white)](https://ritualdev-lab.github.io/DevShelf/)
\`\`\`

---

## 👥 Top Contributors & Community Wall

DevShelf is built with passion by developers worldwide. Huge thanks to all the amazing contributors who have submitted tools, squashed bugs, and expanded the directory!

<div align="center">

[![DevShelf Contributors](https://contrib.rocks/image?repo=RitualDev-Lab/DevShelf)](https://github.com/RitualDev-Lab/DevShelf/graphs/contributors)

*Want your avatar here? Submit a pull request with your favorite developer tool or fix an open issue!*

</div>

---

## 🌐 1. Free & Public APIs

APIs that provide a 100% free tier or require no API key at all.

| Name & URL | Category | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
`;

  for (const api of apis) {
    const authBadge = api.auth === "No Key" ? "🟢 No Key" : "🔑 Free Key";
    md += `| [**${api.name}**](${api.url}) | \`${api.category}\` | ${authBadge} | \`${api.rateLimit}\` | ${api.description} |\n`;
  }

  md +=
    "\n---\n\n## 🤖 2. AI Agents & Local LLM Tools\n\nOpen-source AI frameworks, local LLM serving, and coding assistants.\n\n";

  for (const tool of aiTools) {
    const featured = tool.featured ? "⭐ **Featured** • " : "";
    md += `### [${tool.name}](${tool.repo})\n`;
    md += `> ${tool.description}\n\n`;
    md += `${featured}\`Category: ${tool.category}\` • \`Language: ${tool.language}\` • \`License: ${tool.license}\` • [View Repo →](${tool.repo})\n\n`;
  }

  md +=
    "---\n\n## ⚡ 3. CLI & Productivity Tools\n\nTerminal utilities, git enhancers, and developer workflows that save hours every week.\n\n";

  for (const tool of cliTools) {
    const featured = tool.featured ? "⭐ **Featured** • " : "";
    md += `### [${tool.name}](${tool.repo})\n`;
    md += `> ${tool.description}\n\n`;
    md += `${featured}\`Category: ${tool.category}\` • \`Language: ${tool.language}\` • \`License: ${tool.license}\` • [View Repo →](${tool.repo})\n\n`;
  }

  md +=
    "---\n\n## 🧪 4. Testing & QA Reliability\n\nEnd-to-end testing, self-healing frameworks, mock servers, and test automation.\n\n";

  for (const tool of testingQa) {
    const featured = tool.featured ? "⭐ **Featured** • " : "";
    md += `### [${tool.name}](${tool.repo})\n`;
    md += `> ${tool.description}\n\n`;
    md += `${featured}\`Category: ${tool.category}\` • \`Language: ${tool.language}\` • \`License: ${tool.license}\` • [View Repo →](${tool.repo})\n\n`;
  }

  md +=
    "---\n\n## ☁️ 5. Free Cloud & Developer Tiers\n\nGenerous zero-dollar free tiers for databases, authentication, serverless compute, and email.\n\n";

  for (const cloud of freeCloud) {
    md += `### [${cloud.name}](${cloud.url})\n`;
    md += `> ${cloud.description}\n\n`;
    md += `\`Category: ${cloud.category}\` • 🎁 **Free Tier**: \`${cloud.freeTier}\` • [Explore ${cloud.name} →](${cloud.url})\n\n`;
  }

  md +=
    '---\n\n## 🤝 6. Contributors Wanted ("Up for Grabs")\n\nActive open-source projects looking for contributors, bug hunters, or co-maintainers.\n\n';

  for (const item of contributors) {
    md += `### [${item.name}](${item.repo})\n`;
    md += `> ${item.description}\n\n`;
    md += `🎯 **Seeking**: ${item.seeking}  \n`;
    md += `\`Language: ${item.language}\` • [Browse Open Issues →](${item.goodFirstIssues}) • [Repo Link →](${item.repo})\n\n`;
  }

  md +=
    "---\n\n## 🎁 7. Developer Discounts & Startup Perks\n\nFree cloud credits, software sponsorships, and startup program perks for developers and open-source teams.\n\n";

  md += `| Perk & Provider | Category | Value & Benefits | Eligibility |
| :--- | :--- | :--- | :--- |
`;

  for (const perk of perks) {
    md += `| [**${perk.name}**](${perk.url}) | \`${perk.category}\` | 🎁 **${perk.perkValue}** | ${perk.eligibility} |\n`;
  }

  md += `\n---

## 🚀 How to Submit Your Project or API

Adding your project or API to **DevShelf** is 100% free and takes less than 30 seconds!

### Option 1: 1-Click Submission via GitHub Issue (Easiest)
1. Open a new issue using our structured template:
   - 👉 **[Submit an Open Source Repo / Tool](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=submit_project.yml)**
   - 👉 **[Submit a Free API](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=submit_api.yml)**
2. Fill in your project name, repository URL, category, and a one-sentence summary.
3. Our automated GitHub Action validates the link and adds it to the shelf!

### Option 2: Submit a Pull Request
1. Fork this repository.
2. Add your entry to the appropriate JSON file in the \`shelf/\` directory (\`shelf/apis.json\`, \`shelf/cli-tools.json\`, etc.).
3. Run \`pnpm run build\` to update the README.
4. Submit your PR — automated checks will review and merge it.

---

## 🛡️ Quality Guidelines
- **No Paywalled "Free Trials"**: APIs and tools must have a permanent free tier or be 100% open-source.
- **Active Projects**: Repositories must have a README, an open-source license, and be publicly accessible.
- **Zero Spam**: Crypto schemes, affiliate spam, and deceptive links will be permanently rejected.

---

## 📜 License
Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<div align="center">
  <sub>Curated with ❤️ by <a href="https://github.com/RitualDev-Lab">RitualDev-Lab</a> and the global open-source community.</sub>
</div>
`;

  await fs.writeFile(path.join(root, "README.md"), md, "utf8");
  console.log(`✅ Successfully built README.md with ${totalItems} curated resources.`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
