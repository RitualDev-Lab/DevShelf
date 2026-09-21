import fs from "node:fs/promises";
import path from "node:path";

async function buildSiteData() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const siteDir = path.join(root, "site");

  const readJson = async (filename: string) => {
    const raw = await fs.readFile(path.join(shelfDir, filename), "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  };

  const apis = (await readJson("apis.json")).map((item: any) => ({
    ...item,
    type: "api",
    section: "Free & Public APIs",
  }));
  const aiTools = (await readJson("ai-tools.json")).map((item: any) => ({
    ...item,
    type: "ai",
    section: "AI Agents & Local LLMs",
  }));
  const cliTools = (await readJson("cli-tools.json")).map((item: any) => ({
    ...item,
    type: "cli",
    section: "CLI & Productivity Tools",
  }));
  const testingQa = (await readJson("testing-qa.json")).map((item: any) => ({
    ...item,
    type: "testing",
    section: "Testing & QA Reliability",
  }));
  const freeCloud = (await readJson("free-cloud.json")).map((item: any) => ({
    ...item,
    type: "cloud",
    section: "Free Cloud & Developer Tiers",
  }));
  const contributors = (await readJson("contributors-wanted.json")).map((item: any) => ({
    ...item,
    type: "contributors",
    section: "Contributors Wanted",
  }));
  const perks = (await readJson("perks.json")).map((item: any) => ({
    ...item,
    type: "perks",
    section: "Developer Discounts & Startup Perks",
  }));
  const boilerplates = (await readJson("boilerplates.json")).map((item: any) => ({
    ...item,
    type: "boilerplate",
    section: "One-Click Deployment Boilerplates",
  }));

  // Merge contributor metadata into matching tools so tools aren't duplicated in "All Items",
  // but remain filterable under "contributors" / Up for Grabs!
  const contributorMap = new Map<string, any>();
  for (const c of contributors) {
    contributorMap.set(c.name.toLowerCase(), c);
  }

  const tagContributor = (item: any) => {
    const c = contributorMap.get(item.name.toLowerCase());
    if (c) {
      return {
        ...item,
        seeking: c.seeking || item.seeking,
        goodFirstIssues: c.goodFirstIssues || item.goodFirstIssues,
        contributorsWanted: true,
      };
    }
    return item;
  };

  const taggedAi = aiTools.map(tagContributor);
  const taggedCli = cliTools.map(tagContributor);
  const taggedTesting = testingQa.map(tagContributor);

  // If any item in contributors-wanted is NOT in ai, cli, or testing, include it as well
  const knownNames = new Set([
    ...taggedAi.map((t: any) => t.name.toLowerCase()),
    ...taggedCli.map((t: any) => t.name.toLowerCase()),
    ...taggedTesting.map((t: any) => t.name.toLowerCase()),
  ]);

  const standaloneContributors = contributors.filter(
    (c: any) => !knownNames.has(c.name.toLowerCase()),
  );

  // Primary curated list: Open source & developer tools first, then APIs, cloud, perks, boilerplates
  const allResources = [
    ...taggedAi,
    ...taggedCli,
    ...taggedTesting,
    ...apis,
    ...freeCloud,
    ...perks,
    ...boilerplates,
    ...standaloneContributors,
  ];

  const reposCount = allResources.filter((r) => Boolean(r.repo)).length;
  const contributorsWantedCount = allResources.filter(
    (r) => r.contributorsWanted || r.type === "contributors",
  ).length;

  const payload = {
    updatedAt: new Date().toISOString(),
    totalCount: allResources.length,
    counts: {
      repos: reposCount,
      apis: apis.length,
      aiTools: aiTools.length,
      cliTools: cliTools.length,
      testingQa: testingQa.length,
      freeCloud: freeCloud.length,
      contributors: contributorsWantedCount,
      perks: perks.length,
      boilerplates: boilerplates.length,
    },
    resources: allResources,
  };

  // 1. Write data.json for fetch requests
  await fs.writeFile(
    path.join(siteDir, "data.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  // 2. Write data.js for instantaneous synchronous offline/local/zero-latency execution
  await fs.writeFile(
    path.join(siteDir, "data.js"),
    `window.DEVSHELF_DATA = ${JSON.stringify(payload, null, 2)};\n`,
    "utf8",
  );

  // 3. Write CNAME for custom domain
  await fs.writeFile(path.join(siteDir, "CNAME"), "devshelf.ritualdev.in\n", "utf8");

  console.log(
    `✅ Built site/data.json & site/data.js with ${allResources.length} total resources (${reposCount} GitHub repos) and wrote CNAME.`,
  );
}

buildSiteData().catch((err) => {
  console.error("Site data build failed:", err);
  process.exit(1);
});
