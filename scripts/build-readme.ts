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

### The Crowdsourced Developer Directory
**Discover high-quality developer tools, verified free APIs, AI agents, and open-source projects with zero paywalls.**

[![Live Web Directory](https://img.shields.io/badge/Web_Directory-Live_Search_%26_Filters-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ritualdev-lab.github.io/DevShelf)
[![Total Resources](https://img.shields.io/badge/Listed_Resources-${totalItems}+_Curated-blueviolet?style=for-the-badge)](https://github.com/RitualDev-Lab/DevShelf)
[![Endpoint Health](https://img.shields.io/badge/Endpoint_Health-100%25_Verified-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/RitualDev-Lab/DevShelf/actions)
[![Open Source](https://img.shields.io/badge/Open_Source-100%25_FOSS-blue?style=for-the-badge)](https://github.com/RitualDev-Lab/DevShelf)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](#-how-to-submit-your-project-or-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<p align="center">
  <a href="https://ritualdev-lab.github.io/DevShelf"><b>🌐 Interactive Web App</b></a> •
  <a href="https://github.com/RitualDev-Lab/DevShelf/wiki"><b>📖 Project Wiki</b></a> •
  <a href="#-1-free--public-apis">Free APIs</a> •
  <a href="#-2-ai-agents--local-llm-tools">AI & LLMs</a> •
  <a href="#-3-cli--productivity-tools">CLI Tools</a> •
  <a href="#-4-testing--qa-reliability">Testing & QA</a> •
  <a href="#-5-free-cloud--developer-tiers">Free Cloud</a> •
  <a href="#-how-to-submit-your-project-or-api"><b>➕ Submit Yours</b></a>
</p>

---

</div>

## 💡 Why DevShelf?

Most "Awesome" lists suffer from two major problems:
1. **Link Rot & Dead Endpoints**: Outdated links, broken APIs, and unmaintained repos sit untouched for years.
2. **High Barriers for Creators**: Indie devs and open-source creators struggle to get their work discovered.

**DevShelf is different:**
- 🛡️ **Automated Health Checks**: GitHub Actions continuously ping APIs and repositories to ensure endpoints are active.
- 🌐 **Interactive Web UI**: Search, filter, and copy API URLs with our zero-cost GitHub Pages web application.
- 🚀 **1-Click Issue Submissions**: Add your own project or API in 30 seconds via structured GitHub Issue forms.
- 🌟 **Quality First**: Hand-curated, zero paywalls, clear free tier transparency.

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
