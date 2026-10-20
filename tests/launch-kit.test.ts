import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { describe } from "node:test";
import { generateLaunchKit } from "../scripts/generate-launch-kit.ts";

describe("DevShelf Step 4: Community Launch Spikes & Social Amplification Suite", () => {
  const root = process.cwd();
  const launchDir = path.join(root, "community", "launch");
  const indexPath = path.join(root, "site", "index.html");

  test("generateLaunchKit programmatically creates all 6 launch assets in community/launch/", async () => {
    const result = await generateLaunchKit();
    assert.strictEqual(
      result.filesWritten.length,
      6,
      "Must generate exactly 6 launch asset files",
    );

    const expectedFiles = [
      "hacker-news-show-hn.md",
      "reddit-launch-pack.md",
      "devto-hashnode-article.md",
      "product-hunt-maker-kit.md",
      "twitter-viral-thread.md",
      "README.md",
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(launchDir, file);
      assert.strictEqual(
        fs.existsSync(filePath),
        true,
        `Expected ${file} to exist in community/launch/`,
      );
      const content = fs.readFileSync(filePath, "utf8");
      assert.ok(
        content.length > 500,
        `${file} should have substantive launch content`,
      );
    }
  });

  test("Hacker News Show HN kit contains proper technical depth and moderation etiquette", () => {
    const hnPath = path.join(launchDir, "hacker-news-show-hn.md");
    const content = fs.readFileSync(hnPath, "utf8");

    assert.match(content, /Show HN:/i, "Must have Show HN title options");
    assert.match(
      content,
      /https:\/\/devshelf\.ritualdev\.in/i,
      "Must reference canonical production URL",
    );
    assert.match(
      content,
      /npx devshelf-mcp/i,
      "Must document native Model Context Protocol (MCP) server",
    );
    assert.match(
      content,
      /Continuous CI Health Checks/i,
      "Must explain automated uptime and trial-bait detection",
    );
    assert.match(
      content,
      /NEVER ask for upvotes/i,
      "Must include HN etiquette warning against vote brigading",
    );
  });

  test("Reddit launch pack contains tailored posts for all 4 primary subreddits", () => {
    const redditPath = path.join(launchDir, "reddit-launch-pack.md");
    const content = fs.readFileSync(redditPath, "utf8");

    assert.match(content, /r\/webdev/i, "Must contain r/webdev post");
    assert.match(content, /r\/selfhosted/i, "Must contain r/selfhosted post");
    assert.match(content, /r\/opensource/i, "Must contain r/opensource post");
    assert.match(content, /r\/SideProject/i, "Must contain r/SideProject post");
    assert.match(
      content,
      /https:\/\/devshelf\.ritualdev\.in/i,
      "All posts must link to DevShelf",
    );
  });

  test("Dev.to / Hashnode long-form article includes canonical tag and rich comparison tables", () => {
    const articlePath = path.join(launchDir, "devto-hashnode-article.md");
    const content = fs.readFileSync(articlePath, "utf8");

    assert.match(
      content,
      /canonical_url:\s*https:\/\/devshelf\.ritualdev\.in/i,
      "Must include canonical_url header for SEO link equity",
    );
    assert.match(
      content,
      /The 5 Golden Rules of a "Zero-Paywall" Tool/i,
      "Must establish the criteria for zero-paywall classification",
    );
    assert.match(
      content,
      /Bruno/i,
      "Must highlight Bruno as Postman alternative",
    );
    assert.match(
      content,
      /SigNoz/i,
      "Must highlight SigNoz as Datadog alternative",
    );
  });

  test("Product Hunt kit contains maker comments and hour-by-hour launch schedule", () => {
    const phPath = path.join(launchDir, "product-hunt-maker-kit.md");
    const content = fs.readFileSync(phPath, "utf8");

    assert.match(content, /Maker Comment/i, "Must have Maker Comment template");
    assert.match(
      content,
      /Launch Day Schedule/i,
      "Must provide launch day timeline",
    );
  });

  test("Twitter / X viral thread contains multi-tweet hook and CLI demonstration", () => {
    const twitterPath = path.join(launchDir, "twitter-viral-thread.md");
    const content = fs.readFileSync(twitterPath, "utf8");

    assert.match(
      content,
      /Tweet 1 \(The Hook\)/i,
      "Must contain viral hook tweet",
    );
    assert.match(
      content,
      /npx devshelf search/i,
      "Must feature terminal CLI snippet",
    );
    assert.match(
      content,
      /npx devshelf-mcp/i,
      "Must feature MCP server capabilities",
    );
  });

  test("site/index.html includes the Community Social Sharing bar with one-click intent triggers", () => {
    const html = fs.readFileSync(indexPath, "utf8");

    assert.match(
      html,
      /id=["']community-share-bar["']/i,
      "Hero section must have community-share-bar container",
    );
    assert.match(
      html,
      /id=["']share-x-btn["']/i,
      "Must include X (Twitter) share button",
    );
    assert.match(
      html,
      /id=["']share-reddit-btn["']/i,
      "Must include Reddit share button",
    );
    assert.match(
      html,
      /id=["']share-hn-btn["']/i,
      "Must include Hacker News share button",
    );
    assert.match(
      html,
      /id=["']share-copy-btn["']/i,
      "Must include 1-click URL copy button",
    );
    assert.match(
      html,
      /ref=launch_share/i,
      "Share links must include campaign attribution ref parameter",
    );
  });
});
