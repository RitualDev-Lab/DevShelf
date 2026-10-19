import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { describe } from "node:test";
import {
  type AffiliatePartner,
  addOrUpdateAffiliate,
  generateGoRedirectHtml,
  slugify,
} from "../scripts/add-affiliate.ts";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const AFFILIATES_PATH = path.join(DATA_DIR, "affiliates.json");
const SITE_DIR = path.join(ROOT, "site");
const GO_DIR = path.join(SITE_DIR, "go");
const API_AFFILIATES_PATH = path.join(SITE_DIR, "api", "v1", "affiliates.json");

describe("DevShelf Affiliate Engine & Partner Registry Suite", async () => {
  test("affiliates.json exists and satisfies schema requirements", async () => {
    const raw = await fs.readFile(AFFILIATES_PATH, "utf8");
    const data = JSON.parse(raw);

    assert.ok(data.version, "Missing version field in affiliates.json");
    assert.ok(Array.isArray(data.partners), "Expected partners to be an array");
    assert.ok(data.partners.length > 0, "Expected at least 1 affiliate partner");

    const seenSlugs = new Set<string>();

    for (const partner of data.partners as AffiliatePartner[]) {
      assert.ok(partner.slug, `Partner missing slug: ${JSON.stringify(partner)}`);
      assert.strictEqual(
        partner.slug,
        slugify(partner.slug),
        `Slug must be normalized: ${partner.slug}`,
      );
      assert.ok(!seenSlugs.has(partner.slug), `Duplicate slug detected: ${partner.slug}`);
      seenSlugs.add(partner.slug);

      assert.ok(partner.toolName?.trim(), `Missing toolName for partner ${partner.slug}`);
      assert.match(
        partner.url,
        /^https?:\/\//i,
        `Partner URL must be a valid http(s) URL: ${partner.url}`,
      );
      assert.ok(
        partner.vanityPath.startsWith("/go/") && partner.vanityPath.endsWith(".html"),
        `Invalid vanityPath: ${partner.vanityPath}`,
      );
      assert.ok(partner.perkTitle?.trim(), `Missing perkTitle for ${partner.slug}`);
      assert.ok(partner.perkDescription?.trim(), `Missing perkDescription for ${partner.slug}`);
      assert.strictEqual(
        typeof partner.active,
        "boolean",
        `active must be a boolean for ${partner.slug}`,
      );
    }
  });

  test("slugify correctly normalizes strings with special characters and casing", () => {
    assert.strictEqual(slugify("DigitalOcean"), "digitalocean");
    assert.strictEqual(slugify("Hetzner Cloud!"), "hetzner-cloud");
    assert.strictEqual(slugify("Supabase / Postgres DB"), "supabase-postgres-db");
    assert.strictEqual(slugify("  Neon Tech -- Serverless  "), "neon-tech-serverless");
  });

  test("generateGoRedirectHtml produces SEO-safe redirect with sponsored rel and noindex", () => {
    const testPartner: AffiliatePartner = {
      slug: "test-cloud",
      toolName: "Test Cloud",
      url: "https://testcloud.io/?ref=devshelf",
      vanityPath: "/go/test-cloud.html",
      perkTitle: "$150 Free Test Credits",
      perkDescription: "Get $150 in cloud compute credits for 60 days.",
      ctaText: "Claim $150 Credits →",
      badge: "🎁 $150 Credit",
      active: true,
    };

    const html = generateGoRedirectHtml(testPartner);

    assert.ok(
      html.includes('<meta http-equiv="refresh" content="0; url=https://testcloud.io/?ref=devshelf">'),
      "Must contain meta refresh tag pointing to destination URL",
    );
    assert.ok(
      html.includes('<meta name="robots" content="noindex, follow">'),
      "Must contain noindex, follow to preserve SEO ranking and avoid tracking dilution",
    );
    assert.ok(
      html.includes('<link rel="canonical" href="https://testcloud.io/?ref=devshelf">'),
      "Must set canonical link to partner URL",
    );
    assert.ok(
      html.includes('rel="noopener noreferrer sponsored"'),
      "Outbound button must have rel='noopener noreferrer sponsored' per FTC & search guidelines",
    );
    assert.ok(html.includes("Test Cloud"), "Must display partner tool name");
    assert.ok(html.includes("$150 Free Test Credits"), "Must display perk headline");
  });

  test("all active partners have generated /go/[slug].html vanity redirect files", async () => {
    const raw = await fs.readFile(AFFILIATES_PATH, "utf8");
    const data = JSON.parse(raw);

    for (const partner of data.partners as AffiliatePartner[]) {
      if (!partner.active) continue;

      const goFile = path.join(GO_DIR, `${partner.slug}.html`);
      const exists = await fs
        .access(goFile)
        .then(() => true)
        .catch(() => false);
      assert.ok(exists, `Expected vanity redirect file to exist at: ${goFile}`);

      const content = await fs.readFile(goFile, "utf8");
      assert.ok(
        content.includes('rel="noopener noreferrer sponsored"'),
        `Missing sponsored rel tag in ${partner.slug}.html`,
      );
      assert.ok(
        content.includes('<meta name="robots" content="noindex, follow">'),
        `Missing noindex tag in ${partner.slug}.html`,
      );
      assert.ok(
        content.includes(partner.url),
        `Missing destination link in ${partner.slug}.html`,
      );
    }
  });

  test("site/api/v1/affiliates.json is synced and matches data/affiliates.json", async () => {
    const rawData = await fs.readFile(AFFILIATES_PATH, "utf8");
    const rawApi = await fs.readFile(API_AFFILIATES_PATH, "utf8");

    const dataObj = JSON.parse(rawData);
    const apiObj = JSON.parse(rawApi);

    assert.strictEqual(dataObj.version, apiObj.version);
    assert.strictEqual(dataObj.partners.length, apiObj.partners.length);
    assert.deepStrictEqual(
      dataObj.partners.map((p: any) => p.slug),
      apiObj.partners.map((p: any) => p.slug),
    );
  });

  test("addOrUpdateAffiliate programmatically creates and updates partner entries", async () => {
    const initialRaw = await fs.readFile(AFFILIATES_PATH, "utf8");

    try {
      // Add temporary test partner
      const { partner, isNew } = await addOrUpdateAffiliate({
        tool: "Vitest Demo Cloud",
        url: "https://vitest-demo.com/?aff=devshelf",
        slug: "vitest-demo-cloud",
        perk: "$50 Free Pipeline Credits",
        description: "Run fast automated unit and integration tests with generous cloud concurrency.",
        cta: "Claim Test Pipeline →",
        badge: "⚡ $50 Free",
        skipBuild: true,
      });

      assert.ok(isNew, "Expected partner to be newly created");
      assert.strictEqual(partner.slug, "vitest-demo-cloud");

      // Verify vanity redirect created
      const redirectPath = path.join(GO_DIR, "vitest-demo-cloud.html");
      const redirectContent = await fs.readFile(redirectPath, "utf8");
      assert.ok(redirectContent.includes("https://vitest-demo.com/?aff=devshelf"));
      assert.ok(redirectContent.includes("rel=\"noopener noreferrer sponsored\""));

      // Update the same partner
      const updated = await addOrUpdateAffiliate({
        tool: "Vitest Demo Cloud",
        url: "https://vitest-demo.com/?aff=devshelf-updated",
        slug: "vitest-demo-cloud",
        perk: "$100 Free Pipeline Credits",
        skipBuild: true,
      });

      assert.strictEqual(updated.isNew, false, "Expected existing partner to be updated");
      assert.strictEqual(updated.partner.perkTitle, "$100 Free Pipeline Credits");
      assert.strictEqual(updated.partner.url, "https://vitest-demo.com/?aff=devshelf-updated");
    } finally {
      // Revert affiliates.json to pristine state
      await fs.writeFile(AFFILIATES_PATH, initialRaw, "utf8");
      await fs.writeFile(API_AFFILIATES_PATH, initialRaw, "utf8");

      // Clean up temporary redirect file
      const tempFile = path.join(GO_DIR, "vitest-demo-cloud.html");
      await fs.rm(tempFile, { force: true });
    }
  });

  test("matching logic accurately associates catalog tools with partner perks without false positives", async () => {
    const rawData = await fs.readFile(AFFILIATES_PATH, "utf8");
    const affiliates = JSON.parse(rawData);

    function getHostname(urlStr: string): string {
      try {
        return new URL(urlStr).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return "";
      }
    }

    function findPartner(tool: any): AffiliatePartner | undefined {
      if (!tool || !tool.name) return undefined;
      const toolNameLower = tool.name.toLowerCase();
      const toolHost = getHostname(tool.url || tool.repo || "");

      return affiliates.partners.find((p: AffiliatePartner) => {
        if (!p.active) return false;
        const pSlug = p.slug.toLowerCase();
        const pName = p.toolName.toLowerCase();
        if (pSlug === toolNameLower || pName === toolNameLower) return true;
        if (slugify(tool.name) === pSlug) return true;
        if (toolNameLower.includes(pName)) return true;
        const partnerHost = getHostname(p.url);
        if (toolHost && partnerHost && toolHost === partnerHost) return true;
        return false;
      });
    }

    // Positive matches
    const supabaseTool = { name: "Supabase", url: "https://supabase.com" };
    const neonTool = { name: "Neon", url: "https://neon.tech" };
    const doTool = {
      name: "DigitalOcean Open Source Sponsorship",
      url: "https://www.digitalocean.com/open-source",
    };

    assert.strictEqual(findPartner(supabaseTool)?.slug, "supabase");
    assert.strictEqual(findPartner(neonTool)?.slug, "neon");
    assert.strictEqual(findPartner(doTool)?.slug, "digitalocean");

    // Negative matches (unrelated tools shouldn't trigger affiliate claims)
    const redisTool = { name: "Redis", url: "https://redis.io" };
    const postgresTool = { name: "PostgreSQL", url: "https://www.postgresql.org" };
    const gitTool = { name: "Git", url: "https://git-scm.com" };

    assert.strictEqual(findPartner(redisTool), undefined);
    assert.strictEqual(findPartner(postgresTool), undefined);
    assert.strictEqual(findPartner(gitTool), undefined);
  });
});
