import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test, { describe } from "node:test";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const NEWSLETTER_JSON_PATH = path.join(DATA_DIR, "newsletter.json");
const SPONSORS_JSON_PATH = path.join(DATA_DIR, "sponsors.json");
const SITE_DIR = path.join(ROOT, "site");
const API_NEWSLETTER_PATH = path.join(SITE_DIR, "api", "v1", "newsletter.json");
const FEED_XML_PATH = path.join(SITE_DIR, "feed.xml");
const NEWSLETTER_XML_PATH = path.join(SITE_DIR, "newsletter.xml");
const NEWSLETTER_HTML_PATH = path.join(SITE_DIR, "newsletter.html");
const SPONSORS_HTML_PATH = path.join(SITE_DIR, "sponsors.html");
const CLI_PATH = path.join(ROOT, "bin", "cli.js");

function runCli(args: string): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execSync(`node "${CLI_PATH}" ${args}`, {
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", status: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout?.toString() || "",
      stderr: err.stderr?.toString() || "",
      status: err.status ?? 1,
    };
  }
}

describe("DevShelf Weekly Newsletter & Recurring Media Engine Suite", async () => {
  test("data/newsletter.json exists and strictly satisfies canonical schema", async () => {
    const raw = await fs.readFile(NEWSLETTER_JSON_PATH, "utf8");
    const data = JSON.parse(raw);

    assert.ok(data.version, "Missing version field in newsletter.json");
    assert.strictEqual(data.name, "DevShelf Weekly");
    assert.ok(data.tagline?.trim(), "Missing tagline in newsletter.json");
    assert.ok(data.description?.trim(), "Missing description in newsletter.json");
    assert.strictEqual(data.website, "https://devshelf.ritualdev.in/newsletter.html");
    assert.strictEqual(data.feedUrl, "https://devshelf.ritualdev.in/feed.xml");

    // Stats verification
    assert.ok(typeof data.stats === "object" && data.stats !== null);
    assert.ok(data.stats.totalIssues >= 3, "Expected at least 3 compiled issues");
    assert.ok(data.stats.activeSubscribers >= 2500, "Expected at least 2500 active subscribers");
    assert.ok(data.stats.openRate, "Missing openRate metric");
    assert.ok(data.stats.clickRate, "Missing clickRate metric");

    // Issues array verification
    assert.ok(Array.isArray(data.issues), "issues must be an array");
    assert.ok(data.issues.length >= 3, "Expected at least 3 issues");

    const seenIssues = new Set<number>();
    for (const issue of data.issues) {
      assert.ok(typeof issue.issueNumber === "number" && issue.issueNumber > 0);
      assert.ok(!seenIssues.has(issue.issueNumber), `Duplicate issueNumber: ${issue.issueNumber}`);
      seenIssues.add(issue.issueNumber);

      assert.match(issue.date, /^\d{4}-\d{2}-\d{2}$/, `Invalid date format: ${issue.date}`);
      assert.ok(issue.title?.trim(), `Missing title for issue #${issue.issueNumber}`);
      assert.ok(issue.slug?.trim(), `Missing slug for issue #${issue.issueNumber}`);
      assert.ok(issue.summary?.trim(), `Missing summary for issue #${issue.issueNumber}`);

      assert.ok(
        Array.isArray(issue.featuredTools) && issue.featuredTools.length >= 3,
        `Expected at least 3 featured tools in issue #${issue.issueNumber}`,
      );

      for (const tool of issue.featuredTools) {
        assert.ok(tool.name?.trim(), "Missing tool name");
        assert.ok(tool.category?.trim(), "Missing tool category");
        assert.ok(tool.description?.trim(), "Missing tool description");
        assert.match(tool.url, /^https?:\/\//i, `Tool URL must be valid: ${tool.url}`);
        assert.ok(tool.badge?.trim(), "Missing tool badge");
      }

      if (issue.sponsor) {
        assert.ok(issue.sponsor.name?.trim(), "Missing sponsor name");
        assert.ok(issue.sponsor.tagline?.trim(), "Missing sponsor tagline");
        assert.match(
          issue.sponsor.url,
          /^https?:\/\//i,
          `Sponsor URL must be valid: ${issue.sponsor.url}`,
        );
        assert.ok(issue.sponsor.perk?.trim(), "Missing sponsor perk");
        assert.ok(issue.sponsor.badge?.trim(), "Missing sponsor badge");
      }

      if (issue.perkOfTheWeek) {
        assert.ok(issue.perkOfTheWeek.title?.trim(), "Missing perkOfTheWeek title");
        assert.ok(issue.perkOfTheWeek.description?.trim(), "Missing perkOfTheWeek description");
        assert.match(issue.perkOfTheWeek.url, /^https?:\/\//i, "Missing perkOfTheWeek url");
      }
    }
  });

  test("site/api/v1/newsletter.json exists and mirrors registry", async () => {
    const raw = await fs.readFile(API_NEWSLETTER_PATH, "utf8");
    const apiData = JSON.parse(raw);
    assert.strictEqual(apiData.name, "DevShelf Weekly");
    assert.ok(Array.isArray(apiData.issues));
    assert.strictEqual(apiData.issues.length >= 3, true);
  });

  test("site/feed.xml and site/newsletter.xml are valid, standards-compliant RSS 2.0 feeds", async () => {
    for (const feedFile of [FEED_XML_PATH, NEWSLETTER_XML_PATH]) {
      const xml = await fs.readFile(feedFile, "utf8");
      assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'), "Missing XML declaration");
      assert.ok(xml.includes('<rss version="2.0"'), "Missing RSS 2.0 root element");
      assert.ok(xml.includes("<channel>"), "Missing channel container");
      assert.ok(
        xml.includes(
          "<title>DevShelf Weekly - Free Developer Tools, APIs &amp; Open Source</title>",
        ) || xml.includes("DevShelf Weekly"),
      );
      assert.ok(xml.includes("<link>https://devshelf.ritualdev.in/newsletter.html</link>"));
      assert.ok(
        xml.includes("<language>en-us</language>") || xml.includes("<language>en</language>"),
      );

      // Check item elements
      const items = xml.split("<item>");
      assert.ok(items.length >= 4, "Expected at least 3 RSS items");

      for (let i = 1; i < items.length; i++) {
        const itemChunk = items[i];
        assert.ok(itemChunk.includes("<title>"), `Item ${i} missing <title>`);
        assert.ok(itemChunk.includes("<link>"), `Item ${i} missing <link>`);
        assert.ok(itemChunk.includes("<pubDate>"), `Item ${i} missing <pubDate>`);
        assert.ok(itemChunk.includes('<guid isPermaLink="true">'), `Item ${i} missing <guid>`);

        // Validate pubDate format
        const pubDateMatch = itemChunk.match(/<pubDate>(.*?)<\/pubDate>/);
        assert.ok(pubDateMatch && pubDateMatch[1], "Missing pubDate string");
        const parsedDate = new Date(pubDateMatch[1]);
        assert.strictEqual(
          isNaN(parsedDate.getTime()),
          false,
          `Invalid date string: ${pubDateMatch[1]}`,
        );
      }
    }
  });

  test("site/newsletter.html is compiled with interactive subscription capture and archive", async () => {
    const html = await fs.readFile(NEWSLETTER_HTML_PATH, "utf8");
    assert.ok(html.includes("DevShelf Weekly"), "Missing publication title");
    assert.ok(
      html.includes("2,840") || html.includes("2,800+"),
      "Missing active subscriber metric",
    );
    assert.ok(
      html.includes('action="https://buttondown.com/api/emails/embed-subscribe/devshelf"') ||
        html.includes('action="https://buttondown.email/api/emails/embed-subscribe/devshelf"') ||
        html.includes('id="newsletter-form"'),
      "Missing email subscription form",
    );
    assert.ok(html.includes("feed.xml"), "Missing RSS feed link");
    assert.ok(html.includes("RowSafe"), "Missing featured tool RowSafe");
    assert.ok(html.includes("Neon"), "Missing sponsor Neon");
    assert.ok(html.includes("DigitalOcean"), "Missing perk DigitalOcean");
  });

  test("data/sponsors.json includes categoryTakeover and newsletterSpotlight packages", async () => {
    const raw = await fs.readFile(SPONSORS_JSON_PATH, "utf8");
    const data = JSON.parse(raw);

    assert.ok(data.sponsorPackages, "Missing sponsorPackages");
    const { categoryTakeover, newsletterSpotlight } = data.sponsorPackages;

    assert.ok(categoryTakeover, "Missing categoryTakeover package");
    assert.strictEqual(categoryTakeover.priceUSD, 79);
    assert.strictEqual(categoryTakeover.billing, "monthly");

    assert.ok(newsletterSpotlight, "Missing newsletterSpotlight package");
    assert.strictEqual(newsletterSpotlight.priceUSD, 39);
    assert.strictEqual(newsletterSpotlight.billing, "per_issue");

    assert.ok(data.categorySponsors, "Missing categorySponsors registry");
    assert.ok(data.categorySponsors.cloud, "Expected cloud category exclusivity partner");
    assert.strictEqual(data.categorySponsors.cloud.toolName, "Supabase");
  });

  test("site/sponsors.html contains Category Takeover and Newsletter Spotlight tiers", async () => {
    const html = await fs.readFile(SPONSORS_HTML_PATH, "utf8");
    assert.ok(html.includes("Category Takeover"), "Missing Category Takeover card");
    assert.ok(html.includes("$79"), "Missing $79 price on sponsors page");
    assert.ok(html.includes("Newsletter Spotlight"), "Missing Newsletter Spotlight card");
    assert.ok(html.includes("$39"), "Missing $39 price on sponsors page");
    assert.ok(
      html.includes("selectPackage('categoryTakeover', 79)"),
      "Missing categoryTakeover button action",
    );
    assert.ok(
      html.includes("selectPackage('newsletterSpotlight', 39)"),
      "Missing newsletterSpotlight button action",
    );
    assert.ok(html.includes("newsletter.html"), "Missing link to newsletter");
  });

  test("CLI devshelf newsletter prints latest issue details and RSS feed", () => {
    const res = runCli("newsletter");
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /DevShelf Weekly/);
    assert.match(res.stdout, /Issue #3/);
    assert.match(res.stdout, /Neon/);
    assert.match(res.stdout, /Top 5 Zero-Paywall Tools/);
    assert.match(res.stdout, /RowSafe/);
    assert.match(res.stdout, /Active Subscribers:/);
    assert.match(res.stdout, /https:\/\/devshelf\.ritualdev\.in\/feed\.xml/);
  });

  test("CLI devshelf newsletter --json returns valid JSON payload", () => {
    const res = runCli("newsletter --json");
    assert.strictEqual(res.status, 0);
    const json = JSON.parse(res.stdout);
    assert.strictEqual(json.name, "DevShelf Weekly");
    assert.strictEqual(json.latestIssue.issueNumber, 3);
    assert.strictEqual(json.latestIssue.sponsor.name, "Neon");
    assert.ok(Array.isArray(json.latestIssue.featuredTools));
    assert.strictEqual(json.latestIssue.featuredTools.length, 5);
    assert.ok(Array.isArray(json.allIssues));
  });

  test("CLI --help displays npx devshelf newsletter command", () => {
    const res = runCli("--help");
    assert.strictEqual(res.status, 0);
    assert.match(res.stdout, /npx devshelf newsletter/);
  });

  test("MCP Server get_newsletter returns latest edition and archive issues", async () => {
    const { loadNewsletter } = await import("../bin/lib/newsletter.js");
    const data = await loadNewsletter();
    assert.strictEqual(data.name, "DevShelf Weekly");
    assert.ok(data.issues.length >= 3);

    // Test MCP tools registration in bin/mcp.js
    const mcpRaw = await fs.readFile(path.join(ROOT, "bin", "mcp.js"), "utf8");
    assert.ok(
      mcpRaw.includes('"get_newsletter"'),
      "get_newsletter tool not declared in TOOLS array",
    );
    assert.ok(
      mcpRaw.includes('name === "get_newsletter"'),
      "get_newsletter handler missing in handleToolCall",
    );
  });
});
