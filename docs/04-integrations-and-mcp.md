# 04 — Integrations & MCP Registry

## Supported IDE Targets for `npx devshelf install`
- **Claude Desktop** (`claude_desktop_config.json`)
- **Cursor** (`~/.cursor/mcp.json`)
- **Windsurf** (`~/.codeium/windsurf/mcp_config.json`)

## Programmatic Catalog API
Consume verified JSON feeds directly from DevShelf or SkillPrism (`DevShelfSync`):
- Full index: `/api/v1/tools.json`
- MCP servers only: `/api/v1/categories/mcp.json`
- Uptime health ledger: `/uptime.json`

## Submitting a Tool
Use `npx @ritualdev-lab/mcp-builder-kit publish-devshelf <server-name>` or open a Pull Request updating the relevant category file under `shelf/*.json`.
