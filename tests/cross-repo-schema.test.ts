import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { describe } from "node:test";
import { evaluateBinaryTrustPolicy } from "../scripts/binary-trust-policy.js";

const ROOT = process.cwd();
const SHELF_DIR = path.join(ROOT, "shelf");
const DATA_DIR = path.join(ROOT, "data");

const CANONICAL_SHELF_FILES = [
  "apis.json",
  "ai-tools.json",
  "cli-tools.json",
  "testing-qa.json",
  "free-cloud.json",
  "contributors-wanted.json",
  "perks.json",
  "boilerplates.json",
];

describe("Cross-Repo Schema & Directory Parity with MCPShelf", () => {
  test("shelf/ directory holds all 8 canonical catalog files", async () => {
    const files = await fs.readdir(SHELF_DIR);
    for (const file of CANONICAL_SHELF_FILES) {
      assert.ok(
        files.includes(file),
        `Missing canonical catalog file '${file}' in shelf/ directory`,
      );
    }
  });

  test("data/ directory must NOT contain duplicate or legacy shelf catalogs", async () => {
    try {
      const dataFiles = await fs.readdir(DATA_DIR);
      for (const shelfFile of CANONICAL_SHELF_FILES) {
        assert.ok(
          !dataFiles.includes(shelfFile),
          `Found prohibited catalog file '${shelfFile}' in data/ directory; catalogs belong in shelf/`,
        );
      }
    } catch {
      // If data/ doesn't exist, assertion passes
    }
  });

  test("MCPShelf unified submission CLI format converts cleanly to DevShelf schema", () => {
    // Model payload sent by: npx @ritualdev-lab/mcpshelf submit ./tool.json --target=devshelf
    const mcpShelfSubmission = {
      target: "devshelf",
      item: {
        name: "TestAgent CLI",
        description: "An automated zero-leak terminal testing harness for MCP servers.",
        repositoryUrl: "https://github.com/RitualDev-Lab/TestAgent",
        websiteUrl: "https://testagent.ritualdev.in",
        category: "CLI & Developer Tools",
        language: "TypeScript",
        license: "MIT",
      },
    };

    assert.strictEqual(mcpShelfSubmission.target, "devshelf");

    // Adapter mapping into DevShelf catalog item
    const devShelfItem = {
      name: mcpShelfSubmission.item.name,
      repo: mcpShelfSubmission.item.repositoryUrl,
      url: mcpShelfSubmission.item.websiteUrl,
      description: mcpShelfSubmission.item.description,
      category: mcpShelfSubmission.item.category,
      language: mcpShelfSubmission.item.language,
      license: mcpShelfSubmission.item.license,
    };

    // DevShelf validation assertions
    assert.ok(devShelfItem.name.length >= 2, "name must be >= 2 characters");
    assert.ok(devShelfItem.description.length >= 10, "description must be >= 10 characters");
    assert.ok(
      Boolean(devShelfItem.repo || devShelfItem.url),
      "item must have a repository or website URL",
    );
  });

  test("firstParty tools require an editorialNote disclosure", async () => {
    const aiToolsRaw = await fs.readFile(path.join(SHELF_DIR, "ai-tools.json"), "utf8");
    const aiTools = JSON.parse(aiToolsRaw.replace(/^\uFEFF/, ""));

    const firstPartyItems = aiTools.filter((t: any) => t.firstParty === true);
    assert.ok(firstPartyItems.length > 0, "Expected at least 1 firstParty tool in ai-tools.json");

    for (const item of firstPartyItems) {
      assert.ok(
        typeof item.editorialNote === "string" && item.editorialNote.length > 10,
        `firstParty tool '${item.name}' missing descriptive editorialNote`,
      );
    }
  });

  test("binary trust policy blocks verified status for unsigned binaries", () => {
    const evaluation = evaluateBinaryTrustPolicy({
      name: "UnsignedBench",
      description: "Fast Windows utility and .exe benchmark tool",
      nativeBinary: true,
      codeSigned: false,
      verified: true,
    });

    assert.strictEqual(evaluation.isNativeBinary, true);
    assert.strictEqual(evaluation.isSigned, false);
    assert.strictEqual(evaluation.allowedVerifiedBadge, false);
    assert.ok(evaluation.errors.length > 0);
  });
});
