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

  const allResources = [
    ...apis,
    ...aiTools,
    ...cliTools,
    ...testingQa,
    ...freeCloud,
    ...contributors,
    ...perks,
  ];

  const payload = {
    updatedAt: new Date().toISOString(),
    totalCount: allResources.length,
    counts: {
      apis: apis.length,
      aiTools: aiTools.length,
      cliTools: cliTools.length,
      testingQa: testingQa.length,
      freeCloud: freeCloud.length,
      contributors: contributors.length,
      perks: perks.length,
    },
    resources: allResources,
  };

  await fs.writeFile(
    path.join(siteDir, "data.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(path.join(siteDir, "CNAME"), "devshelf.ritualdev.in\n", "utf8");
  console.log(
    `✅ Built site/data.json with ${allResources.length} total resources and wrote CNAME.`,
  );
}

buildSiteData().catch((err) => {
  console.error("Site data build failed:", err);
  process.exit(1);
});
