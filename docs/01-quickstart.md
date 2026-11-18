# 01 — DevShelf Quickstart

**DevShelf (`devshelf`)** is a curated, continuously verified open-source registry of 575+ free developer tools, APIs, cloud tiers, and Model Context Protocol (MCP) servers with a 1-Click MCP Registry Installer.

## 1. Search the Registry from Your Terminal
```bash
npx devshelf search postgres
```

## 2. 1-Click MCP Registry Installer
Write verified MCP server configurations directly into **Claude Desktop**, **Cursor**, and **Windsurf** config files:
```bash
npx devshelf install <tool-slug>
# Preview changes without modifying disk:
npx devshelf install <tool-slug> --dry-run
```

## 3. Browse Online
Visit the interactive searchable catalog at [ritualdev.in/devshelf](https://ritualdev.in/devshelf/).

## Next Steps
- [02 — Architecture](02-architecture.md)
- [03 — Configuration & CLI Reference](03-configuration-and-cli.md)
- [04 — Integrations & MCP Registry](04-integrations-and-mcp.md)
- [05 — Enterprise VPC & Security](05-enterprise-vpc-and-security.md)
