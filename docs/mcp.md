# 🤖 DevShelf Model Context Protocol (MCP) Server

> Connect your AI coding assistant (Claude Desktop, Cursor, Antigravity, Windsurf, Zed) directly to DevShelf's 520+ verified zero-paywall developer tools, free APIs, and open-source infrastructure.

DevShelf provides an official, zero-dependency **Model Context Protocol (MCP)** server over standard I/O (stdio). Once connected, your AI assistant can recommend battle-tested free tools, find open-source alternatives to expensive SaaS, and inspect rate limits or free tier allowances in real time.

---

## ⚡ Quick Start

You can run the MCP server instantly via `npx` with zero installation:

```bash
npx devshelf-mcp
# or
npx devshelf mcp
```

---

## 🛠️ MCP Tools Exposed

DevShelf MCP exposes 5 specialized tools to connected LLMs:

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_tools` | `query` (string, required), `category` (string, optional), `limit` (number, default: 10) | Full-text fuzzy search across all 520+ developer tools, APIs, AI frameworks, and boilerplates. |
| `get_tool` | `name` (string, required) | Retrieve deep metadata for a specific tool: license, auth type, rate limits, free tier details, docker compose support, and repo link. |
| `find_free_alternatives` | `commercial_tool` (string, required) | Discover verified free & open-source alternatives to expensive SaaS (e.g., Postman, Firebase, Datadog, Airtable, Auth0). |
| `list_categories` | *None* | List all 8 primary categories and subcategories with resource counts. |
| `get_random_tool` | `category` (string, optional) | Fetch a random curated tool for discovery and developer inspiration. |

---

## 💻 Configuration by AI Editor

### 1. Claude Desktop

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

### 2. Cursor

In Cursor:
1. Navigate to **Cursor Settings** -> **Features** -> **MCP Servers**.
2. Click **Add New MCP Server**.
3. Configure:
   - **Name**: `devshelf`
   - **Type**: `command`
   - **Command**: `npx -y devshelf-mcp`

Or add directly to `.cursor/mcp.json` in your workspace root:

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
