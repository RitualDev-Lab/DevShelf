import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  VERIFIED_MCP_REGISTRY,
  getClientConfigPaths,
  installMcpServer,
  listInstalledMcpServers,
  readMcpConfig,
  resolveMcpServerDefinition,
  uninstallMcpServer,
  writeMcpConfig,
} from "../bin/lib/mcp-installer.js";

test("1-Click MCP Registry Installer Suite", async (t) => {
  await t.test("Resolves pre-verified MCP servers accurately", () => {
    const devshelf = resolveMcpServerDefinition("devshelf");
    assert.strictEqual(devshelf.serverKey, "devshelf");
    assert.strictEqual(devshelf.config.command, "npx");
    assert.ok(devshelf.config.args.includes("@ritualdev-lab/devshelf"));

    const agentshield = resolveMcpServerDefinition("agentshield");
    assert.strictEqual(agentshield.serverKey, "agentshield");
    assert.ok(agentshield.config.args.includes("@ritualdev-lab/agentshield"));

    const fsServer = resolveMcpServerDefinition("filesystem");
    assert.strictEqual(fsServer.serverKey, "filesystem");
    assert.ok(fsServer.config.args.includes("@modelcontextprotocol/server-filesystem"));
  });

  await t.test("Resolves custom community tool slugs", () => {
    const custom = resolveMcpServerDefinition("@myorg/cool-mcp");
    assert.strictEqual(custom.serverKey, "myorg-cool-mcp");
    assert.strictEqual(custom.config.command, "npx");
    assert.deepStrictEqual(custom.config.args, ["-y", "@myorg/cool-mcp"]);
  });

  await t.test("Resolves client configuration paths across Claude, Cursor, and Windsurf", () => {
    const paths = getClientConfigPaths();
    assert.ok(paths.claude.includes("claude_desktop_config.json"));
    assert.ok(paths.cursor.includes("mcp.json"));
    assert.ok(paths.windsurf.includes("mcp_config.json"));

    const wsPaths = getClientConfigPaths({ workspace: true });
    assert.ok(wsPaths.cursor.startsWith(process.cwd()));
  });

  await t.test("Performs dry-run without writing to disk", () => {
    const res = installMcpServer("sqlite", { dryRun: true });
    assert.strictEqual(res.toolSlug, "sqlite");
    assert.strictEqual(res.results.length, 3);
    for (const r of res.results) {
      assert.strictEqual(r.action, "dry-run");
      assert.strictEqual(r.success, true);
    }
  });

  await t.test("Reads and writes configuration file with directory creation", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "devshelf-mcp-test-"));
    const tmpConfigFile = path.join(tmpDir, "nested", "mcp.json");

    const initial = readMcpConfig(tmpConfigFile);
    assert.deepStrictEqual(initial, { mcpServers: {} });

    initial.mcpServers["test-tool"] = { command: "node", args: ["server.js"] };
    writeMcpConfig(tmpConfigFile, initial);

    assert.ok(fs.existsSync(tmpConfigFile));
    const reloaded = readMcpConfig(tmpConfigFile);
    assert.strictEqual(reloaded.mcpServers["test-tool"].command, "node");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
