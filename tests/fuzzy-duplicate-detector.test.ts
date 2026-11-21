import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  findDuplicatesInCatalog,
  fuzzyStringSimilarity,
  levenshteinDistance,
  normalizeCanonicalUrl,
} from "../scripts/fuzzy-duplicate-detector.js";

describe("Fuzzy Duplicate & Canonical URL Detector Suite", () => {
  test("normalizeCanonicalUrl strips .git, trailing slashes, www, and normalizes SSH/HTTPS", () => {
    assert.strictEqual(
      normalizeCanonicalUrl("https://www.github.com/RitualDev-Lab/DevShelf.git/"),
      "https://github.com/ritualdev-lab/devshelf",
    );
    assert.strictEqual(
      normalizeCanonicalUrl("git@github.com:RitualDev-Lab/DevShelf.git"),
      "https://github.com/ritualdev-lab/devshelf",
    );
    assert.strictEqual(
      normalizeCanonicalUrl("http://github.com/RitualDev-Lab/DevShelf"),
      "https://github.com/ritualdev-lab/devshelf",
    );
  });

  test("levenshteinDistance accurately computes edit operations", () => {
    assert.strictEqual(levenshteinDistance("kitten", "sitting"), 3);
    assert.strictEqual(levenshteinDistance("DevShelf", "DevShelf"), 0);
    assert.strictEqual(levenshteinDistance("Postgres", "Postgre"), 1);
  });

  test("fuzzyStringSimilarity returns expected normalized ratios", () => {
    assert.strictEqual(fuzzyStringSimilarity("DevShelf", "DevShelf"), 1.0);
    assert.ok(fuzzyStringSimilarity("DockerDesktop", "Docker Desktop") >= 0.85);
    assert.ok(fuzzyStringSimilarity("uv", "curl") < 0.3);
  });

  test("findDuplicatesInCatalog detects canonical URL duplicates across syntax variants", () => {
    const catalog = [
      {
        name: "DevShelf",
        repo: "https://github.com/RitualDev-Lab/DevShelf",
        category: "CLI & Developer Productivity",
      },
    ];

    const submissionWithGit = {
      name: "Dev Shelf CLI",
      repo: "git@github.com:RitualDev-Lab/DevShelf.git",
    };

    const result = findDuplicatesInCatalog(submissionWithGit, catalog);
    assert.strictEqual(result.isDuplicate, true);
    assert.ok(["exact_url", "canonical_repo"].includes(result.matchType!));
  });

  test("findDuplicatesInCatalog detects striking fuzzy name matches", () => {
    const catalog = [
      {
        name: "Playwright",
        repo: "https://github.com/microsoft/playwright",
        category: "Testing & QA Reliability",
      },
    ];

    const typoSubmission = {
      name: "Playw銷right", // or slight typo
      repo: "https://github.com/fork/playwright-alt",
    };

    const typoSubmission2 = {
      name: "Playwrigh",
      repo: "https://github.com/fork/playwright-alt",
    };

    const result = findDuplicatesInCatalog(typoSubmission2, catalog);
    assert.strictEqual(result.isDuplicate, true);
    assert.strictEqual(result.matchType, "fuzzy_name");
  });

  test("findDuplicatesInCatalog approves truly distinct tools", () => {
    const catalog = [
      {
        name: "PromptShield",
        repo: "https://github.com/RitualDev-Lab/PromptShield",
      },
    ];

    const uniqueTool = {
      name: "DuckDB",
      repo: "https://github.com/duckdb/duckdb",
    };

    const result = findDuplicatesInCatalog(uniqueTool, catalog);
    assert.strictEqual(result.isDuplicate, false);
  });
});
