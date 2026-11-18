# 03 — DevShelf Configuration & CLI Reference

## CLI Commands

| Command | Description |
| :--- | :--- |
| `npx devshelf search <query>` | Search 575+ verified developer tools, APIs, and MCP servers. |
| `npx devshelf install <tool-slug>` | Install a verified MCP server directly into Claude Desktop, Cursor, and Windsurf configs. |
| `npx devshelf install <slug> --client cursor` | Target a specific IDE client (`claude`, `cursor`, `windsurf`, or `all`). |
| `npx devshelf install <slug> --dry-run` | Preview the exact JSON diff without writing to disk. |
| `npx devshelf list --category mcp` | List tools filtered by category. |

## Local Development Scripts
```bash
npm run validate      # Validate all shelf/*.json schemas
npm run build         # Rebuild README, docs, HTML pages, and JSON APIs
npm test              # Run 146+ unit and installer verification tests
```
