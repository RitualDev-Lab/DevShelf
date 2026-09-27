import assert from "node:assert/strict";
import test, { describe } from "node:test";
// @ts-ignore
import { sanitizeUrl } from "../scripts/validate-links.js";

describe("DevShelf URL Sanitizer Utility", () => {
  test("strips standard commercial UTM and analytics parameters", () => {
    const input =
      "https://example.com/tool?utm_source=twitter&utm_medium=social&utm_campaign=launch&ref=devshelf";
    const result = sanitizeUrl(input);

    assert.strictEqual(result.isDirty, true);
    assert.strictEqual(result.sanitized, "https://example.com/tool");
  });

  test("strips facebook click IDs and google click IDs", () => {
    const input = "https://example.com/docs?fbclid=12345&gclid=67890";
    const result = sanitizeUrl(input);

    assert.strictEqual(result.isDirty, true);
    assert.strictEqual(result.sanitized, "https://example.com/docs");
  });

  test("strips trailing slashes on sub-paths while preserving clean root domain slashes", () => {
    const subpath = "https://github.com/org/repo/";
    assert.strictEqual(sanitizeUrl(subpath).sanitized, "https://github.com/org/repo");

    const root = "https://example.com/";
    assert.strictEqual(sanitizeUrl(root).sanitized, "https://example.com/");
  });

  test("flags non-http/https protocols as dirty and invalid", () => {
    const ftp = "ftp://files.example.com/tool";
    const result = sanitizeUrl(ftp);
    assert.strictEqual(result.isDirty, true);
  });

  test("identifies clean URLs as non-dirty", () => {
    const clean = "https://github.com/RitualDev-Lab/DevShelf";
    const result = sanitizeUrl(clean);
    assert.strictEqual(result.isDirty, false);
    assert.strictEqual(result.sanitized, clean);
  });
});
