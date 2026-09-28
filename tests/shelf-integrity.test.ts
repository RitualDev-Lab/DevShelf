import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { describe } from "node:test";

const ROOT = process.cwd();
const SHELF_DIR = path.join(ROOT, "shelf");
const DOCS_DIR = path.join(ROOT, "docs");

const SHELF_FILES = [
  "apis.json",
  "ai-tools.json",
  "cli-tools.json",
  "testing-qa.json",
  "free-cloud.json",
  "contributors-wanted.json",
  "perks.json",
  "boilerplates.json",
];

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
];

describe("DevShelf Catalog Data Integrity", async () => {
  const shelfData = new Map<string, any[]>();

  test("all 8 shelf JSON files exist and are valid non-empty arrays", async () => {
    for (const file of SHELF_FILES) {
      const filePath = path.join(SHELF_DIR, file);
      const raw = await fs.readFile(filePath, "utf8");
      const clean = raw.replace(/^\uFEFF/, "");
      const data = JSON.parse(clean);

      assert.ok(Array.isArray(data), `Expected ${file} to be a JSON array, got ${typeof data}`);
      assert.ok(data.length > 0, `Expected ${file} to contain at least 1 item`);
      shelfData.set(file, data);
    }
    assert.strictEqual(shelfData.size, 8);
  });

  test("every catalog item contains required core fields and valid formats", () => {
    for (const [file, items] of shelfData) {
      for (const item of items) {
        assert.ok(item.name, `Missing name in ${file}: ${JSON.stringify(item)}`);
        assert.ok(
          typeof item.name === "string" && item.name.trim().length >= 1,
          `Invalid name in ${file}: "${item.name}"`,
        );

        const url = item.url || item.repo;
        assert.ok(url, `Missing url/repo in ${file} for item: "${item.name}"`);
        assert.match(
          url,
          /^https?:\/\//,
          `URL must begin with http:// or https:// in ${file} for item "${item.name}": ${url}`,
        );

        assert.ok(item.category, `Missing category in ${file} for item: "${item.name}"`);
        assert.ok(
          typeof item.category === "string" && item.category.trim().length > 0,
          `Empty category in ${file} for item: "${item.name}"`,
        );

        if (item.description) {
          assert.ok(
            item.description.length >= 10,
            `Description too short (<10 chars) in ${file} for "${item.name}": "${item.description}"`,
          );
        }
      }
    }
  });

  test("no catalog items contain commercial marketing tracking parameters", () => {
    for (const [file, items] of shelfData) {
      for (const item of items) {
        const url = item.url || item.repo;
        if (!url) continue;

        try {
          const parsed = new URL(url);
          for (const param of TRACKING_PARAMS) {
            assert.strictEqual(
              parsed.searchParams.has(param),
              false,
              `Found tracking param '${param}' in ${file} item "${item.name}": ${url}`,
            );
          }
        } catch {
          assert.fail(`Invalid URL format in ${file} for "${item.name}": ${url}`);
        }
      }
    }
  });

  test("no duplicate names or URLs exist within individual shelf files", () => {
    for (const [file, items] of shelfData) {
      const names = new Set<string>();
      const urls = new Set<string>();

      for (const item of items) {
        const nameKey = item.name.toLowerCase().trim();
        assert.strictEqual(
          names.has(nameKey),
          false,
          `Duplicate item name "${item.name}" found in ${file}`,
        );
        names.add(nameKey);

        const rawUrl = (item.url || item.repo || "").toLowerCase().replace(/\/$/, "");
        if (rawUrl) {
          assert.strictEqual(
            urls.has(rawUrl),
            false,
            `Duplicate URL "${rawUrl}" found within ${file} for "${item.name}"`,
          );
          urls.add(rawUrl);
        }
      }
    }
  });

  test("no duplicate canonical URLs exist across any of the 8 shelf files (cross-shelf uniqueness)", () => {
    const globalUrls = new Map<string, { file: string; name: string }>();
    let total = 0;

    for (const [file, items] of shelfData) {
      total += items.length;
      for (const item of items) {
        const rawUrl = (item.url || item.repo || "").toLowerCase().replace(/\/$/, "");
        if (rawUrl) {
          const prior = globalUrls.get(rawUrl);
          assert.ok(
            !prior,
            `Duplicate URL collision across shelf files: "${rawUrl}" in both [${prior?.file}] (${prior?.name}) and [${file}] (${item.name})`,
          );
          globalUrls.set(rawUrl, { file, name: item.name });
        }
      }
    }
    assert.strictEqual(
      globalUrls.size,
      total,
      `Expected ${total} unique URLs, got ${globalUrls.size}`,
    );
  });

  test("total catalog scale satisfies 500+ milestone", () => {
    let total = 0;
    for (const [_, items] of shelfData) {
      total += items.length;
    }
    assert.ok(total >= 500, `Expected total catalog count to be at least 500 items, got ${total}`);
  });
});

describe("DevShelf Generated Artifacts & Docs Sync", async () => {
  test("site/data.json exists, is valid, and matches catalog exactly", async () => {
    const dataJsonPath = path.join(ROOT, "site", "data.json");
    const raw = await fs.readFile(dataJsonPath, "utf8");
    const data = JSON.parse(raw);

    const shelfFiles = await fs.readdir(SHELF_DIR);
    let totalCatalogCount = 0;
    for (const file of shelfFiles) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(path.join(SHELF_DIR, file), "utf8");
        const items = JSON.parse(content.replace(/^\uFEFF/, ""));
        totalCatalogCount += items.length;
      }
    }

    assert.strictEqual(
      data.totalCount,
      totalCatalogCount,
      `Expected totalCount ${totalCatalogCount}, got ${data.totalCount}`,
    );
    assert.ok(Array.isArray(data.resources), "Expected data.resources to be an array");
    assert.strictEqual(data.resources.length, totalCatalogCount);

    const countsSum = Object.values(data.counts).reduce(
      (acc: number, val: any) => acc + (typeof val === "number" ? val : 0),
      0,
    );
    assert.strictEqual(
      countsSum,
      totalCatalogCount,
      `Expected data.counts to sum to exactly ${totalCatalogCount}, got ${countsSum}`,
    );
  });

  test("all 8 modular docs/*.md category guides exist and are populated", async () => {
    const docFiles = [
      "apis.md",
      "ai-tools.md",
      "cli-tools.md",
      "testing-qa.md",
      "free-cloud.md",
      "contributors-wanted.md",
      "perks.md",
      "boilerplates.md",
    ];

    for (const docFile of docFiles) {
      const filePath = path.join(DOCS_DIR, docFile);
      const stat = await fs.stat(filePath);
      assert.ok(stat.isFile(), `Expected ${docFile} to be a file`);
      assert.ok(stat.size > 1000, `Expected ${docFile} to contain content (>1KB)`);
    }
  });
});
