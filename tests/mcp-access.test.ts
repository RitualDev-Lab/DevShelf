import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("MCP catalog reads preserve declared access terms", (t) => {
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), "devshelf-access-"));
  t.after(() => fs.rmSync(cache, { recursive: true, force: true }));
  const sample = {
    name: "Example API",
    category: "Example",
    url: "https://example.com",
    alternativeTo: "Example Pro",
  };
  const resources = [
    { ...sample, rateLimit: "50 requests per month" },
    {
      ...sample,
      name: "Declared",
      license: "MIT",
      rateLimit: "10 per minute",
      freeTier: "One project",
    },
    { ...sample, name: "Unknown" },
  ];
  fs.writeFileSync(
    path.join(cache, "catalog.json"),
    JSON.stringify({ fetchedAt: new Date().toISOString(), resources }),
  );

  const calls = [
    ["search_tools", { query: sample.name }],
    ["search_tools", { query: sample.name, compact: true }],
    ["get_tool", { name: sample.name }],
    ["find_free_alternatives", { commercialTool: sample.alternativeTo }],
    ["find_free_alternatives", { commercialTool: sample.alternativeTo, compact: true }],
    ["get_tool", { name: "Declared" }],
    ["get_tool", { name: "Unknown" }],
  ];
  const input =
    calls
      .map(([name, args], id) =>
        JSON.stringify({
          jsonrpc: "2.0",
          id: id + 1,
          method: "tools/call",
          params: { name, arguments: args },
        }),
      )
      .join("\n") + "\n";
  const output = execFileSync(process.execPath, ["bin/mcp.js"], {
    input,
    encoding: "utf8",
    env: { ...process.env, DEVSHELF_CACHE_DIR: cache },
    timeout: 5000,
  });
  const rows = output
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .sort((a, b) => a.id - b.id)
    .map((r) => JSON.parse(r.result.content[0].text));
  assert.equal(rows.length, calls.length);
  for (const api of [
    rows[0].results[0],
    rows[1].results[0],
    rows[2],
    rows[3].alternatives[0],
    rows[4].alternatives[0],
  ]) {
    assert.equal(api.license, "Not specified");
    assert.equal(api.freeTier, "50 requests per month");
  }
  assert.equal(rows[5].license, "MIT");
  assert.equal(rows[5].freeTier, "One project");
  assert.equal(rows[6].freeTier, "See official site for free access and limits");
});
