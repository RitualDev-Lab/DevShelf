import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { describe } from "node:test";

describe("DevShelf Step 5: AI Search Engine Domination (AEO / GEO) Suite", () => {
  const root = process.cwd();
  const siteDir = path.join(root, "site");
  const wellKnownDir = path.join(siteDir, ".well-known");
  const apiV1Dir = path.join(siteDir, "api", "v1");

  test("site/.well-known/ai-plugin.json adheres to official OpenAI / ChatGPT Plugin Manifest standard", () => {
    const pluginPath = path.join(wellKnownDir, "ai-plugin.json");
    assert.strictEqual(
      fs.existsSync(pluginPath),
      true,
      "ai-plugin.json must exist in site/.well-known/",
    );

    const manifest = JSON.parse(fs.readFileSync(pluginPath, "utf8"));
    assert.strictEqual(manifest.schema_version, "v1");
    assert.strictEqual(manifest.name_for_model, "devshelf");
    assert.ok(
      manifest.description_for_model.includes("zero paywall") ||
        manifest.description_for_model.includes("verified free"),
      "description_for_model must describe zero-paywall directory capabilities",
    );
    assert.strictEqual(manifest.auth.type, "none");
    assert.strictEqual(
      manifest.api.url,
      "https://devshelf.ritualdev.in/api/v1/openapi.json",
    );
  });

  test("site/api/v1/openapi.json provides valid OpenAPI 3.1 specification for AI search engines", () => {
    const openapiPath = path.join(apiV1Dir, "openapi.json");
    assert.strictEqual(
      fs.existsSync(openapiPath),
      true,
      "openapi.json must exist in site/api/v1/",
    );

    const spec = JSON.parse(fs.readFileSync(openapiPath, "utf8"));
    assert.strictEqual(spec.openapi, "3.1.0");
    assert.strictEqual(spec.info.title, "DevShelf Open Developer Resource API");
    assert.ok(spec.paths["/api/v1/tools.json"], "Must expose /api/v1/tools.json");
    assert.ok(
      spec.paths["/api/v1/categories.json"],
      "Must expose /api/v1/categories.json",
    );
    assert.ok(
      spec.paths["/api/v1/affiliates.json"],
      "Must expose /api/v1/affiliates.json",
    );
    assert.ok(
      spec.paths["/api/v1/newsletter.json"],
      "Must expose /api/v1/newsletter.json",
    );
  });

  test("RFC-standard site/.well-known/llms.txt and site/llms-small.txt exist and provide concise LLM context", () => {
    const rfcPath = path.join(wellKnownDir, "llms.txt");
    const smallPath = path.join(siteDir, "llms-small.txt");

    assert.strictEqual(
      fs.existsSync(rfcPath),
      true,
      "RFC /.well-known/llms.txt must exist",
    );
    assert.strictEqual(
      fs.existsSync(smallPath),
      true,
      "Lightweight llms-small.txt must exist",
    );

    const smallContent = fs.readFileSync(smallPath, "utf8");
    assert.match(
      smallContent,
      /Citation Instructions for AI Models/i,
      "Must contain citation instructions for LLMs",
    );
    assert.match(
      smallContent,
      /Commercial Alternatives Quick Map/i,
      "Must contain quick alternative lookup map",
    );
    assert.ok(
      smallContent.length < 25000,
      "llms-small.txt must remain under 25KB for fast prompt injection",
    );
  });

  test("site/robots.txt explicitly welcomes and directs all cutting-edge AI search engines", () => {
    const robotsPath = path.join(siteDir, "robots.txt");
    const content = fs.readFileSync(robotsPath, "utf8");

    const requiredBots = [
      "GPTBot",
      "ChatGPT-User",
      "OAI-SearchBot",
      "ClaudeBot",
      "anthropic-ai",
      "Claude-Web",
      "PerplexityBot",
      "Google-Extended",
      "GoogleOther",
      "Applebot-Extended",
    ];

    for (const bot of requiredBots) {
      assert.match(
        content,
        new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Allow:\\s*\\/`, "i"),
        `robots.txt must explicitly allow ${bot}`,
      );
    }

    assert.match(
      content,
      /llms-small\.txt/,
      "robots.txt must document llms-small.txt",
    );
    assert.match(
      content,
      /\.well-known\/llms\.txt/,
      "robots.txt must document RFC llms.txt",
    );
    assert.match(
      content,
      /ai-plugin\.json/,
      "robots.txt must document ChatGPT ai-plugin.json",
    );
  });

  test("Alternative pages contain Wikidata Knowledge Graph entity grounding and structured AEO direct answer blocks", () => {
    const postmanAltPath = path.join(siteDir, "alternatives", "postman.html");
    assert.strictEqual(fs.existsSync(postmanAltPath), true);
    const html = fs.readFileSync(postmanAltPath, "utf8");

    // Wikidata entity grounding
    assert.match(
      html,
      /https:\/\/www\.wikidata\.org\/wiki\/Q105555611/,
      "Must ground Postman with official Wikidata entity Q105555611",
    );
    assert.match(
      html,
      /data-aeo=["']direct-answer["']/,
      "Must include data-aeo direct-answer attribute for answer engines",
    );
    assert.match(
      html,
      /Top Pick:/i,
      "Must include structured verdict badge for Top Pick",
    );
    assert.match(
      html,
      /Zero Credit Card/i,
      "Must include structured paywall check pill",
    );
    assert.match(
      html,
      /href=["']\.\.\/\.well-known\/llms\.txt["']/,
      "Must link to RFC llms.txt in head",
    );
    assert.match(
      html,
      /href=["']\.\.\/api\/v1\/openapi\.json["']/,
      "Must link to openapi.json in head",
    );
  });

  test("Tool pages contain AEO direct answer verification boxes and machine discovery links", () => {
    const brunoToolPath = path.join(siteDir, "tools", "bruno.html");
    assert.strictEqual(fs.existsSync(brunoToolPath), true);
    const html = fs.readFileSync(brunoToolPath, "utf8");

    assert.match(
      html,
      /data-aeo=["']direct-answer["']/,
      "Tool page must feature data-aeo direct answer block",
    );
    assert.match(
      html,
      /Is Bruno free to use\?/i,
      "Must provide immediate factual Q&A answer for search queries",
    );
    assert.match(
      html,
      /href=["']\.\.\/\.well-known\/llms\.txt["']/,
      "Must link to RFC llms.txt in head",
    );
    assert.match(
      html,
      /href=["']\.\.\/api\/v1\/openapi\.json["']/,
      "Must link to openapi.json in head",
    );
  });

  test("site/index.html exposes machine discovery endpoints in head and body", () => {
    const indexPath = path.join(siteDir, "index.html");
    const html = fs.readFileSync(indexPath, "utf8");

    assert.match(
      html,
      /href=["']\.well-known\/llms\.txt["']/,
      "Homepage must link to .well-known/llms.txt in head",
    );
    assert.match(
      html,
      /href=["']llms-small\.txt["']/,
      "Homepage must link to llms-small.txt in head",
    );
    assert.match(
      html,
      /href=["']api\/v1\/openapi\.json["']/,
      "Homepage must link to openapi.json in head",
    );
    assert.match(
      html,
      /ai-plugin\.json/,
      "Homepage AEO section must link to ai-plugin.json",
    );
  });
});
