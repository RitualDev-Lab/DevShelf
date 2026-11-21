import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { evaluateBinaryTrustPolicy } from "../scripts/binary-trust-policy.js";
import {
  findDuplicatesInCatalog,
  normalizeCanonicalUrl,
} from "../scripts/fuzzy-duplicate-detector.js";

describe("No-Code JSON Contribution Wizard Suite", () => {
  const sampleIssueForm = `
### Tool or Project Name
FastDuck CLI

### GitHub / GitLab Repository URL
https://github.com/fastduck/fastduck.git

### Project Website or Documentation URL
https://fastduck.dev

### Target Shelf Category
cli-tools.json (Terminal, CLI & Developer Utilities)

### Subcategory or Tagline
Terminal OLAP Querying

### Short Description (1-2 sentences)
A blazingly fast in-process SQL query engine and CLI utility for developers.

### Primary Programming Language / Runtime
Rust

### Open Source License
MIT

### Native OS Executable Distribution (SEC-06)
Yes (Windows .exe / macOS .dmg - Code Signed)

### Search Tags (comma-separated)
sql, cli, database, duckdb
`;

  test("form body parses into clean canonical URLs", () => {
    const rawRepo = "https://github.com/fastduck/fastduck.git";
    const canonical = normalizeCanonicalUrl(rawRepo);
    assert.strictEqual(canonical, "https://github.com/fastduck/fastduck");
  });

  test("binary trust policy approves code-signed native submissions", () => {
    const item = {
      name: "FastDuck CLI",
      repo: "https://github.com/fastduck/fastduck",
      nativeBinary: true,
      codeSigned: true,
      category: "Terminal OLAP Querying",
      description: "A blazingly fast in-process SQL query engine and CLI utility for developers.",
    };

    const evaluation = evaluateBinaryTrustPolicy(item);
    assert.strictEqual(evaluation.isNativeBinary, true);
    assert.strictEqual(evaluation.isSigned, true);
    assert.strictEqual(evaluation.allowedVerifiedBadge, true);
    assert.strictEqual(evaluation.errors.length, 0);
  });

  test("duplicate detector catches attempts to re-submit existing repositories", () => {
    const catalog = [
      {
        name: "FastDuck CLI",
        repo: "https://github.com/fastduck/fastduck",
        category: "CLI",
      },
    ];

    const dupCheck = findDuplicatesInCatalog(
      {
        name: "fastduck-cli",
        repo: "https://github.com/fastduck/fastduck.git/",
      },
      catalog,
    );

    assert.strictEqual(dupCheck.isDuplicate, true);
  });
});
