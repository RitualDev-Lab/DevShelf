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
  const boilerplates = await readJson("boilerplates.json");

  const totalItems =
    apis.length +
    aiTools.length +
    cliTools.length +
    testingQa.length +
    freeCloud.length +
    contributors.length +
    perks.length +
    boilerplates.length;

  let md = `<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,12,19,24,30&height=200&section=header&text=📚%20DevShelf&fontSize=60&fontAlignY=35&desc=The%20Crowdsourced%20Zero-Paywall%20Developer%20Directory&descAlignY=55&descSize=18&fontColor=fff&animation=twinkling">
  <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,12,19,24,30&height=200&section=header&text=📚%20DevShelf&fontSize=60&fontAlignY=35&desc=The%20Crowdsourced%20Zero-Paywall%20Developer%20Directory&descAlignY=55&descSize=18&fontColor=fff">
  <img alt="DevShelf Banner" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,12,19,24,30&height=200&section=header&text=📚%20DevShelf&fontSize=60&fontAlignY=35&desc=The%20Crowdsourced%20Zero-Paywall%20Developer%20Directory&descAlignY=55&descSize=18&fontColor=fff" width="100%">
</picture>

<br>

**Discover high-quality developer tools, verified free APIs, AI agents, and open-source projects — all with zero paywalls.**

<br>

[![Live Web Directory](https://img.shields.io/badge/🌐_Web_Directory-Live_Search_%26_Filters-7928CA?style=for-the-badge&logoColor=white)](https://devshelf.ritualdev.in)
[![Curated Resources](https://img.shields.io/badge/📦_Resources-${totalItems}+_Curated-blueviolet?style=for-the-badge)](https://github.com/RitualDev-Lab/DevShelf)
[![Endpoint Health](https://img.shields.io/badge/🛡️_Health-100%25_Verified-brightgreen?style=for-the-badge)](https://github.com/RitualDev-Lab/DevShelf/actions)
[![Open Source](https://img.shields.io/badge/🔓_License-MIT_FOSS-blue?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/🤝_PRs-Welcome_%26_Amplified-brightgreen?style=for-the-badge)](#-how-to-submit-your-project-or-api)

<br>

<table>
<tr>
<td align="center"><b>🌐 Free APIs</b><br><code>${apis.length}</code></td>
<td align="center"><b>🤖 AI & LLMs</b><br><code>${aiTools.length}</code></td>
<td align="center"><b>⚡ CLI Tools</b><br><code>${cliTools.length}</code></td>
<td align="center"><b>🧪 Testing & QA</b><br><code>${testingQa.length}</code></td>
<td align="center"><b>☁️ Free Cloud</b><br><code>${freeCloud.length}</code></td>
<td align="center"><b>🤝 Up for Grabs</b><br><code>${contributors.length}</code></td>
<td align="center"><b>🎁 Dev Perks</b><br><code>${perks.length}</code></td>
<td align="center"><b>🚀 1-Click Deploys</b><br><code>${boilerplates.length}</code></td>
</tr>
</table>

<p>
  <a href="https://devshelf.ritualdev.in"><b>🌐 Interactive Web App</b></a> •
  <a href="#-featured-spotlight--tools-of-the-week"><b>🔥 Spotlight</b></a> •
  <a href="#-social-amplification-guarantee"><b>🚀 Social Guarantee</b></a> •
  <a href="#-team--contributors"><b>👥 Team</b></a> •
  <a href="#-how-to-submit-your-project-or-api"><b>➕ Submit Yours</b></a>
</p>

</div>

<br>

## 💡 Why DevShelf?

<table>
<tr>
<td width="50%">

### ❌ Traditional "Awesome" Lists
- 🔴 Links rot — broken APIs sit untouched for years
- 🔴 No discovery — indie creators buried under corporate tools
- 🔴 Static lists — no search, no filters, no live status
- 🔴 No incentive — contributors get nothing in return

</td>
<td width="50%">

### ✅ DevShelf is Built Different
- 🟢 **Automated Health Checks** — GitHub Actions pings every endpoint continuously
- 🟢 **Interactive Web UI** — instant search, filters, 1-click copy at [devshelf.ritualdev.in](https://devshelf.ritualdev.in)
- 🟢 **1-Click Submissions** — add your project in 30 seconds via GitHub Issue forms
- 🟢 **Social Amplification** — every merged project gets free promotion

</td>
</tr>
</table>

<div align="center">

\`\`\`
🛡️ 100% Verified Uptime  •  🌟 Quality First  •  🚫 Zero Paywalls  •  📢 Free Social Promotion
\`\`\`

</div>

---

## 🔥 Featured Spotlight & Tools of the Week

> Every week, we highlight outstanding open-source utilities, developer gems, and community submissions.

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
> 2. **🌐 Permanent Web Directory Inclusion**: Your tool is permanently listed in our live search index at [devshelf.ritualdev.in](https://devshelf.ritualdev.in).
> 3. **🔗 High-Quality Backlink**: Guaranteed direct dofollow backlink to your GitHub repository or documentation.

---

## 🎖️ "Featured on DevShelf" Badges

Are you listed on DevShelf? Display an official badge on your project's \`README.md\` to show off your community verification:

### Style 1: Modern Purple (Recommended)
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)

\`\`\`markdown
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)
\`\`\`

### Style 2: Cyberpunk Neon Cyan
[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Curated%20Resource-00E5FF?style=for-the-badge&logo=github&logoColor=black)](https://devshelf.ritualdev.in/)

\`\`\`markdown
[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Curated%20Resource-00E5FF?style=for-the-badge&logo=github&logoColor=black)](https://devshelf.ritualdev.in/)
\`\`\`

### Style 3: Minimal Flat Square
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-blueviolet?style=flat-square&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)

\`\`\`markdown
[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-blueviolet?style=flat-square&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)
\`\`\`

---

## 👥 Team & Contributors

DevShelf is initiated by the team at [RitualDev Lab](https://github.com/RitualDev-Lab) and expanded by the global open-source community.

### 🛡️ Core Team & Maintainers

<table align="center">
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/divyanshujethi">
        <img src="https://github.com/divyanshujethi.png" width="80" style="border-radius: 50%;" alt="Divyanshu Jethi"/><br />
        <sub><b>Divyanshu Jethi</b></sub>
      </a><br />
      <sub>🚀 Founder & Lead</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Sakshisharma1616">
        <img src="https://github.com/Sakshisharma1616.png" width="80" style="border-radius: 50%;" alt="Sakshi Sharma"/><br />
        <sub><b>Sakshi Sharma</b></sub>
      </a><br />
      <sub>🎨 Core Maintainer & Product</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Ritual-Dev-Git">
        <img src="https://github.com/Ritual-Dev-Git.png" width="80" style="border-radius: 50%;" alt="RitualDev"/><br />
        <sub><b>RitualDev</b></sub>
      </a><br />
      <sub>⚙️ Core Maintainer & Infra</sub>
    </td>
  </tr>
</table>

### 🌟 Community Contributors & Builders

<table align="center">
  <tr>
    <td align="center" width="160">
      <a href="https://github.com/Voyagerroc-Lab">
        <img src="https://github.com/Voyagerroc-Lab.png" width="70" style="border-radius: 50%;" alt="Voyagerroc-Lab"/><br />
        <sub><b>Voyagerroc-Lab</b></sub>
      </a><br />
      <sub>🔤 Coding Fonts (PR #35)</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/ayushxx01">
        <img src="https://github.com/ayushxx01.png" width="70" style="border-radius: 50%;" alt="ayushxx01"/><br />
        <sub><b>ayushxx01</b></sub>
      </a><br />
      <sub>🐶 Dog API (PR #36)</sub>
    </td>
  </tr>
</table>

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
    "\n---\n\n<details open>\n<summary><h2>🤖 2. AI Agents & Local LLM Tools</h2></summary>\n\n> Open-source AI frameworks, local LLM serving, and coding assistants.\n\n";

  for (const tool of aiTools) {
    const featured = tool.featured ? "⭐ **Featured** • " : "";
    md += `### [${tool.name}](${tool.repo})\n`;
    md += `> ${tool.description}\n\n`;
    md += `${featured}\`Category: ${tool.category}\` • \`Language: ${tool.language}\` • \`License: ${tool.license}\` • [View Repo →](${tool.repo})\n\n`;
  }

  md += "</details>\n";

  md +=
    "---\n\n<details open>\n<summary><h2>⚡ 3. CLI & Productivity Tools</h2></summary>\n\n> Terminal utilities, git enhancers, and developer workflows that save hours every week.\n\n";

  for (const tool of cliTools) {
    const featured = tool.featured ? "⭐ **Featured** • " : "";
    md += `### [${tool.name}](${tool.repo})\n`;
    md += `> ${tool.description}\n\n`;
    md += `${featured}\`Category: ${tool.category}\` • \`Language: ${tool.language}\` • \`License: ${tool.license}\` • [View Repo →](${tool.repo})\n\n`;
  }

  md += "</details>\n";

  md +=
    "\n---\n\n<details open>\n<summary><h2>🧪 4. Testing & QA Reliability</h2></summary>\n\n> End-to-end testing, self-healing frameworks, mock servers, and test automation.\n\n";

  for (const tool of testingQa) {
    const featured = tool.featured ? "⭐ **Featured** • " : "";
    md += `### [${tool.name}](${tool.repo})\n`;
    md += `> ${tool.description}\n\n`;
    md += `${featured}\`Category: ${tool.category}\` • \`Language: ${tool.language}\` • \`License: ${tool.license}\` • [View Repo →](${tool.repo})\n\n`;
  }

  md += "</details>\n";

  md +=
    "\n---\n\n<details open>\n<summary><h2>☁️ 5. Free Cloud & Developer Tiers</h2></summary>\n\n> Generous zero-dollar free tiers for databases, authentication, serverless compute, and email.\n\n";

  for (const cloud of freeCloud) {
    md += `### [${cloud.name}](${cloud.url})\n`;
    md += `> ${cloud.description}\n\n`;
    md += `\`Category: ${cloud.category}\` • 🎁 **Free Tier**: \`${cloud.freeTier}\` • [Explore ${cloud.name} →](${cloud.url})\n\n`;
  }

  md += "</details>\n";

  md +=
    '\n---\n\n<details open>\n<summary><h2>🤝 6. Contributors Wanted ("Up for Grabs")</h2></summary>\n\n> Active open-source projects looking for contributors, bug hunters, or co-maintainers.\n\n';

  for (const item of contributors) {
    md += `### [${item.name}](${item.repo})\n`;
    md += `> ${item.description}\n\n`;
    md += `🎯 **Seeking**: ${item.seeking}  \n`;
    md += `\`Language: ${item.language}\` • [Browse Open Issues →](${item.goodFirstIssues}) • [Repo Link →](${item.repo})\n\n`;
  }

  md += "</details>\n";

  md +=
    "---\n\n## 🎁 7. Developer Discounts & Startup Perks\n\nFree cloud credits, software sponsorships, and startup program perks for developers and open-source teams.\n\n";

  md += `| Perk & Provider | Category | Value & Benefits | Eligibility |
| :--- | :--- | :--- | :--- |
`;

  for (const perk of perks) {
    md += `| [**${perk.name}**](${perk.url}) | \`${perk.category}\` | 🎁 **${perk.perkValue}** | ${perk.eligibility} |\n`;
  }

  md += "</details>\n\n";

  md +=
    "---\n\n<details open>\n<summary><h2>🚀 8. One-Click Deployment Boilerplates</h2></summary>\n\n> Zero-cost templates and server configurations deployable in 1 click to free cloud tiers.\n\n";

  md += `| Template & Repository | Category | Target Platform | 1-Click Deploy | Free Tier Cost |
| :--- | :--- | :---: | :---: | :--- |
`;

  for (const b of boilerplates) {
    md += `| [**${b.name}**](${b.repo}) | \`${b.category}\` | **${b.platform}** | [🚀 **Deploy to ${b.platform}**](${b.deployUrl}) | \`${b.freeTierCost}\` |\n`;
  }

  md += "</details>\n";

  md += `\n---

## 🚀 Community Contributions & Issue Hub

DevShelf is powered by the open-source community! We provide tailored issue templates for every kind of contribution:

| Action / Goal | Issue Template | Description |
| :--- | :--- | :--- |
| **🚀 Submit Open Source Tool** | [**Open Project Form →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=01_submit_tool.yml) | Submit your developer tool, CLI, or library for automated addition & social shoutout |
| **🌐 Submit Free Public API** | [**Open API Form →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=02_submit_api.yml) | Add a free, no-key, or generous rate-limit public API |
| **💡 Propose a Feature** | [**Open Feature Request →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=03_feature_request.yml) | Suggest new UI features, dark mode, filtering capabilities, or web app improvements |
| **🌱 Good First Issue** | [**Open Starter Task →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=04_good_first_issue.yml) | Propose or claim bite-sized tasks for new open-source contributors |
| **📖 Docs & Guides** | [**Open Docs Issue →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=05_docs_improvement.yml) | Suggest clarifications or guides for DevShelf or the Wiki |
| **🔗 Report Broken Link** | [**Open Health Report →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=06_report_broken_link.yml) | Flag an unreachable URL or moved API endpoint |
| **🚨 Report Paywall / Spam** | [**Open Content Report →**](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=07_content_report.yml) | Report deceptive paywalls or spam for immediate delisting |

---

## 🛠️ How to Contribute via Pull Request (PR)
1. Fork this repository and clone your fork.
2. Add your entry to the appropriate JSON file in the \`shelf/\` directory (\`shelf/apis.json\`, \`shelf/cli-tools.json\`, \`shelf/ai-tools.json\`, etc.).
3. Run \`pnpm run validate\` to test schema conformance.
4. Run \`pnpm run build\` to re-generate the web directory and README.
5. Submit your PR — our automated GitHub Actions will review and merge it!

---

## 🛡️ Quality Guidelines
- **No Paywalled "Free Trials"**: APIs and tools must have a permanent free tier or be 100% open-source.
- **Active Projects**: Repositories must have a README, an open-source license, and be publicly accessible.
- **Zero Spam**: Crypto schemes, affiliate spam, and deceptive links will be permanently rejected.

---

## 🏗️ Built With

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=flat-square&logo=biome&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222?style=flat-square&logo=github&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)

</div>

---

## 📜 License
Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,12,19,24,30&height=100&section=footer">
  <img alt="" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,12,19,24,30&height=100&section=footer" width="100%">
</picture>

<sub>Curated with ❤️ by <a href="https://github.com/RitualDev-Lab">RitualDev-Lab</a> and the global open-source community.</sub>

<sub>⭐ If DevShelf saved you time, consider giving this repo a star — it helps other developers discover these resources!</sub>

</div>
`;

  await fs.writeFile(path.join(root, "README.md"), md, "utf8");
  console.log(`✅ Successfully built README.md with ${totalItems} curated resources.`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
