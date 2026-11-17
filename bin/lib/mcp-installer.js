import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Pre-verified known MCP servers registry
 */
export const VERIFIED_MCP_REGISTRY = {
  devshelf: {
    name: "DevShelf Directory MCP",
    command: "npx",
    args: ["-y", "@ritualdev-lab/devshelf", "mcp"],
    description:
      "Official DevShelf MCP Server providing instant search across 575+ developer tools.",
  },
  agentshield: {
    name: "AgentShield Runtime Defense",
    command: "npx",
    args: ["-y", "@ritualdev-lab/agentshield", "mcp"],
    description:
      "Linux eBPF kernel sandbox and zero-leak environment defense for autonomous agents.",
  },
  dbshield: {
    name: "DBShield Database Proxy",
    command: "npx",
    args: ["-y", "@ritualdev-lab/dbshield", "mcp"],
    description: "Wire-level SQL dry-run defense with instant rollback and PII masking.",
  },
  skillprism: {
    name: "SkillPrism FinOps Gateway",
    command: "npx",
    args: ["-y", "@ritualdev-lab/skillprism", "mcp"],
    description: "JIT prompt token compaction (98%+ reduction) with OpenTelemetry FinOps metrics.",
  },
  mockforge: {
    name: "MockForge Relational Synth",
    command: "npx",
    args: ["-y", "@ritualdev-lab/mockforge", "mcp"],
    description: "Relational mock database engine with circular foreign key auto-resolution.",
  },
  "web-sec-auditor": {
    name: "WebSecAuditor AST Scanner",
    command: "npx",
    args: ["-y", "@ritualdev-lab/web-sec-auditor", "mcp"],
    description: "AST taint-flow security auditor and automated vulnerability gate.",
  },
  filesystem: {
    name: "Official Filesystem Server",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
    description: "Model Context Protocol official filesystem read/write server.",
  },
  github: {
    name: "Official GitHub MCP Server",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_PERSONAL_ACCESS_TOKEN}" },
    description: "Model Context Protocol official GitHub repository and issues server.",
  },
  postgres: {
    name: "Official Postgres MCP Server",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
    description: "Model Context Protocol PostgreSQL database query server.",
  },
  sqlite: {
    name: "Official SQLite MCP Server",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./test.db"],
    description: "Model Context Protocol SQLite database server.",
  },
  "brave-search": {
    name: "Official Brave Search MCP",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: { BRAVE_API_KEY: "${BRAVE_API_KEY}" },
    description: "Model Context Protocol official web search server.",
  },
  fetch: {
    name: "Official HTTP Fetch MCP",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    description: "Model Context Protocol web page and API content fetcher.",
  },
  slack: {
    name: "Official Slack MCP Server",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env: { SLACK_BOT_TOKEN: "${SLACK_BOT_TOKEN}", SLACK_TEAM_ID: "${SLACK_TEAM_ID}" },
    description: "Model Context Protocol Slack communication server.",
  },
  memory: {
    name: "Knowledge Graph Memory MCP",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    description: "Model Context Protocol persistent knowledge-graph memory server.",
  },
  puppeteer: {
    name: "Puppeteer Headless Browser",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    description: "Model Context Protocol headless web automation server.",
  },
  git: {
    name: "Official Git MCP Server",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git"],
    description: "Model Context Protocol local git repository operations.",
  },
  docker: {
    name: "Docker Engine MCP",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-docker"],
    description: "Model Context Protocol container management server.",
  },
  everything: {
    name: "Reference Everything MCP",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
    description: "Model Context Protocol reference test server.",
  },
};

/**
 * Resolves standard configuration file paths for AI clients across platforms
 */
export function getClientConfigPaths(options = {}) {
  const home = os.homedir();
  const platform = process.platform;

  let claudePath = "";
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    claudePath = path.join(appData, "Claude", "claude_desktop_config.json");
  } else if (platform === "darwin") {
    claudePath = path.join(
      home,
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );
  } else {
    claudePath = path.join(home, ".config", "Claude", "claude_desktop_config.json");
  }

  const cursorPath = options.workspace
    ? path.join(process.cwd(), ".cursor", "mcp.json")
    : path.join(home, ".cursor", "mcp.json");

  const windsurfPath = path.join(home, ".codeium", "windsurf", "mcp_config.json");

  return {
    claude: claudePath,
    cursor: cursorPath,
    windsurf: windsurfPath,
  };
}

/**
 * Resolves an MCP server definition from verified registry or generic npm package
 */
export function resolveMcpServerDefinition(toolSlug, customArgs = [], customEnv = {}) {
  const cleanSlug = toolSlug.toLowerCase().trim();
  const verified = VERIFIED_MCP_REGISTRY[cleanSlug];

  if (verified) {
    const args = customArgs.length > 0 ? customArgs : [...verified.args];
    const env =
      Object.keys(customEnv).length > 0 ? { ...(verified.env || {}), ...customEnv } : verified.env;

    const res = {
      serverKey: cleanSlug,
      name: verified.name,
      description: verified.description,
      config: {
        command: verified.command,
        args,
      },
    };
    if (env && Object.keys(env).length > 0) {
      res.config.env = env;
    }
    return res;
  }

  // Generic npm package or scoped tool
  const serverKey = cleanSlug.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  const args = customArgs.length > 0 ? customArgs : ["-y", toolSlug];
  const res = {
    serverKey: serverKey || "custom-mcp-server",
    name: toolSlug,
    description: `Community MCP Server for ${toolSlug}`,
    config: {
      command: "npx",
      args,
    },
  };
  if (Object.keys(customEnv).length > 0) {
    res.config.env = customEnv;
  }
  return res;
}

/**
 * Safely reads existing MCP configuration JSON file
 */
export function readMcpConfig(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8").trim();
      if (!content) {
        return { mcpServers: {} };
      }
      const parsed = JSON.parse(content);
      if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
        parsed.mcpServers = {};
      }
      return parsed;
    }
  } catch (err) {
    // If parse error or corrupted, backup existing
    try {
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, `${filePath}.bak.${Date.now()}`);
      }
    } catch {}
  }
  return { mcpServers: {} };
}

/**
 * Writes configuration back to disk with proper directory creation
 */
export function writeMcpConfig(filePath, config) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");
}

/**
 * Installs an MCP server into target client configurations
 */
export function installMcpServer(toolSlug, options = {}) {
  const definition = resolveMcpServerDefinition(toolSlug, options.args, options.env);
  const paths = getClientConfigPaths(options);

  // Determine target clients
  const requestedTargets = options.target
    ? options.target.split(",").map((t) => t.trim().toLowerCase())
    : ["claude", "cursor", "windsurf"];

  const results = [];

  for (const client of requestedTargets) {
    const configPath = paths[client];
    if (!configPath) {
      results.push({ client, success: false, error: `Unknown client target: ${client}` });
      continue;
    }

    if (options.dryRun) {
      results.push({
        client,
        path: configPath,
        success: true,
        action: "dry-run",
        serverKey: definition.serverKey,
        payload: definition.config,
      });
      continue;
    }

    try {
      const config = readMcpConfig(configPath);
      const isUpdate = Boolean(config.mcpServers[definition.serverKey]);

      config.mcpServers[definition.serverKey] = definition.config;
      writeMcpConfig(configPath, config);

      results.push({
        client,
        path: configPath,
        success: true,
        action: isUpdate ? "updated" : "added",
        serverKey: definition.serverKey,
        payload: definition.config,
      });
    } catch (err) {
      results.push({
        client,
        path: configPath,
        success: false,
        error: err.message,
      });
    }
  }

  return {
    toolSlug,
    definition,
    results,
  };
}

/**
 * Uninstalls an MCP server from client configurations
 */
export function uninstallMcpServer(toolSlug, options = {}) {
  const cleanSlug = toolSlug.toLowerCase().trim();
  const paths = getClientConfigPaths(options);
  const requestedTargets = options.target
    ? options.target.split(",").map((t) => t.trim().toLowerCase())
    : ["claude", "cursor", "windsurf"];

  const results = [];

  for (const client of requestedTargets) {
    const configPath = paths[client];
    if (!configPath) continue;

    if (!fs.existsSync(configPath)) {
      results.push({ client, path: configPath, success: true, action: "not-found" });
      continue;
    }

    try {
      const config = readMcpConfig(configPath);
      if (config.mcpServers[cleanSlug]) {
        delete config.mcpServers[cleanSlug];
        writeMcpConfig(configPath, config);
        results.push({
          client,
          path: configPath,
          success: true,
          action: "removed",
          serverKey: cleanSlug,
        });
      } else {
        results.push({
          client,
          path: configPath,
          success: true,
          action: "not-found",
          serverKey: cleanSlug,
        });
      }
    } catch (err) {
      results.push({ client, path: configPath, success: false, error: err.message });
    }
  }

  return { toolSlug: cleanSlug, results };
}

/**
 * Lists installed MCP servers across clients
 */
export function listInstalledMcpServers(options = {}) {
  const paths = getClientConfigPaths(options);
  const installed = {};

  for (const [client, configPath] of Object.entries(paths)) {
    installed[client] = {
      path: configPath,
      exists: fs.existsSync(configPath),
      servers: {},
    };

    if (installed[client].exists) {
      const config = readMcpConfig(configPath);
      installed[client].servers = config.mcpServers || {};
    }
  }

  return installed;
}
