import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import test, { describe } from "node:test";

const ROOT = process.cwd();
const CLI_PATH = path.join(ROOT, "bin", "cli.js");

function runCli(args: string): { stdout: string; status: number } {
  try {
    const stdout = execSync(`node "${CLI_PATH}" ${args}`, {
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, status: 0 };
  } catch (err: any) {
    return { stdout: err.stdout?.toString() || "", status: err.status ?? 1 };
  }
}

describe("DevShelf CLI & TUI Suite", () => {
  test("prints version with --version flag", () => {
    const res = runCli("--version");
    assert.equal(res.status, 0);
    assert.match(res.stdout, /devshelf v1\.0\.0/);
  });

  test("prints help message with --help flag", () => {
    const res = runCli("--help");
    assert.equal(res.status, 0);
    assert.match(res.stdout, /USAGE:/);
    assert.match(res.stdout, /npx devshelf search/);
    assert.match(res.stdout, /npx devshelf random/);
  });

  test("returns valid JSON telemetry with stats --json", () => {
    const res = runCli("stats --json");
    assert.equal(res.status, 0);
    const parsed = JSON.parse(res.stdout);
    assert.ok(typeof parsed === "object" && parsed !== null);
    assert.ok(parsed.repos >= 300, "Should report at least 300 GitHub repos");
  });

  test("searches items by keyword and returns matching results in JSON", () => {
    const res = runCli('search "postgres" --json');
    assert.equal(res.status, 0);
    const results = JSON.parse(res.stdout);
    assert.ok(Array.isArray(results), "Search results should be an array");
    assert.ok(results.length > 0, "Should find matches for postgres");
    assert.ok(
      results.some(
        (r: any) =>
          (r.name || "").toLowerCase().includes("neon") ||
          (r.description || "").toLowerCase().includes("postgres"),
      ),
      "Results should contain relevant postgres tools",
    );
  });

  test("picks a random resource with random --json", () => {
    const res = runCli("random --json");
    assert.equal(res.status, 0);
    const item = JSON.parse(res.stdout);
    assert.ok(typeof item === "object" && item !== null);
    assert.ok(item.name && item.name.length > 0, "Random item must have a name");
  });
});
