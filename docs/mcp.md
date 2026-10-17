# 🤖 DevShelf Model Context Protocol (MCP) Server

> Connect your AI coding assistant (Claude Desktop, Cursor, Antigravity, Windsurf, Zed) directly to DevShelf's 530+ verified zero-paywall developer tools, free APIs, and open-source infrastructure.

DevShelf provides an official, zero-dependency **Model Context Protocol (MCP)** server over standard I/O (stdio). Once connected, your AI assistant can recommend battle-tested free tools, find open-source alternatives to expensive SaaS, and inspect rate limits or free tier allowances in real time.

[![Smithery Ready](https://img.shields.io/badge/Smithery-Install_Ready-blueviolet.svg?style=flat-square)](https://smithery.ai)
[![MCP Ready](https://img.shields.io/badge/MCP-Claude%20%7C%20Cursor%20%7C%20Zed-purple.svg?style=flat-square)](https://modelcontextprotocol.io)
[![Zero Paywall](https://img.shields.io/badge/Zero--Paywall-100%25_Verified-brightgreen.svg?style=flat-square)](https://devshelf.ritualdev.in)

---

## ⚡ Quick Start

Run the server instantly via `npx` with zero local configuration:

```bash
npx devshelf-mcp
# or
npx devshelf mcp
```

### 1-Line Installer via Smithery
```bash
npx -y @smithery/cli install devshelf-mcp --client claude
```

---

## 🛠️ MCP Tools Exposed

DevShelf MCP exposes 12 specialized tools to connected LLMs:

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_tools` | `query` (string, required), `category` (string, optional), `limit` (number, default: 8, max: 25), `compact` (boolean, optional) | Full-text fuzzy search across all 530+ developer tools, APIs, AI frameworks, and boilerplates. Supports `compact: true` for 70% token savings in LLM chats and prioritizes verified sponsor tools. |
| `get_tool` | `name` (string, required) | Retrieve deep metadata for a specific tool: license, auth type, rate limits, free tier details, docker compose support, and repo link. |
| `find_free_alternatives` | `commercialTool` (string, required), `compact` (boolean, optional) | Discover verified free & open-source alternatives to expensive commercial SaaS (e.g., Postman → Bruno, Datadog → Prometheus, Airtable → NocoDB). Supports `compact: true`. |
| `recommend_stack` | `projectType` (string, optional), `database` (string, optional), `hosting` (string, optional), `features` (string[], optional) | Recommend a verified $0/month production architecture (Database, Auth, Hosting, Storage, Testing, Monitoring, AI) tailored to requirements with zero-paywall guarantee. |
| `check_tool_health` | `name` (string, required) | Inspect real-time endpoint latency, HTTP status, uptime percentage, and verified zero-paywall heartbeat telemetry from continuous monitoring. |
| `list_categories` | *None* | List all 8 primary categories and subcategories with live resource counts. |
| `get_random_tool` | `category` (string, optional) | Fetch a random curated tool for developer inspiration and stack discovery. |
| `get_security_audit` | `name` (string, required) | Inspect catalog identity provenance and authentic external cryptographic audit records. |
| `list_verified_sponsor_tools` | `tier` (string, optional) | Query verified community sponsor tools with transparent zero-paywall editorial standards. |
| `list_sponsors` | *None* | Inspect community patron ledger, contribution tiers, and sponsorship provenance. |
| `get_sponsor_badge` | `name` (string, required), `style` (string, optional) | Generate SVG and markdown badge embed snippets for verified catalog tools. |
| `get_sponsor_telemetry` | *None* | Inspect live MCP server reach, monthly agent sessions, tool recommendation impressions, and self-serve developer tool sponsorship tiers with live booking links. |

---

## 💻 Configuration by AI Editor

### 1. Cursor

In Cursor:
1. Navigate to **Cursor Settings** -> **Features** -> **MCP Servers**.
2. Click **Add New MCP Server**.
3. Configure:
   - **Name**: `devshelf`
   - **Type**: `command`
   - **Command**: `npx -y devshelf-mcp`

Or create/edit `.cursor/mcp.json` in your workspace root:

```json
{
  "mcpServers": {
    "devshelf": {
      "command": "npx",
      "args": ["-y", "devshelf-mcp"]
    }
  }
}
```

---

### 2. Claude Desktop

Add DevShelf to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "devshelf": {
      "command": "npx",
      "args": ["-y", "devshelf-mcp"]
    }
  }
}
```

Restart Claude Desktop. The hammer icon will display the `devshelf` tools.

---

### 3. Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "devshelf": {
      "command": "npx",
      "args": ["-y", "devshelf-mcp"]
    }
  }
}
```

---

### 4. Zed Editor

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "devshelf": {
      "command": "npx",
      "args": ["-y", "devshelf-mcp"]
    }
  }
}
```

---

## 🎯 Example Prompts to Try with Your Agent

Once configured, ask your AI assistant questions like:

- *"What are the best free, self-hostable alternatives to Postman for API testing?"*
- *"Find me a free weather API that requires no API key and has a generous rate limit."*
- *"I need a free vector database with a hosted cloud free tier for a prototype."*
- *"Search DevShelf for CLI utilities that help inspect Docker containers."*
- *"What free developer perks or cloud credits can I use as an indie hacker?"*

---

## 🌐 Community Registries & MCP Ecosystem

DevShelf MCP is designed to be listed in community MCP registries:
- [Smithery.ai](https://smithery.ai)
- [Glama MCP Directory](https://glama.ai/mcp)
- [PulseMCP](https://pulsemcp.com)

To run DevShelf MCP in local development from source:
```bash
git clone https://github.com/RitualDev-Lab/DevShelf.git
cd DevShelf
node bin/mcp.js
```
