# 02 — DevShelf Architecture

```mermaid
flowchart LR
  Shelf["shelf/*.json (Curated Verified Sources)"] --> Builder["TypeScript Build Pipeline (scripts/build-*.ts)"]
  Builder --> Artifacts["data.json / API v1 JSON / Sitemap / Atom & RSS Feeds"]
  Builder --> Web["ritualdev-web Dossier Sync"]
  Shelf --> CLI["npx devshelf CLI & 1-Click MCP Installer"]
  CLI --> Clients["Claude Desktop / Cursor / Windsurf Configs"]
```

## Registry Guarantees
- **Schema-Validated Catalog**: Every entry in `shelf/*.json` is validated against strict Zod schemas (`scripts/validate.ts`), verifying metadata (`freeTier`, `auth`, `selfHostable`, `license`, install commands, and active URLs).
- **Automated Uptime & Quality Telemetry**: Scheduled verification checks prevent dead links and stale packages from polluting developer workflows.
- **Zero-Touch Client Patching**: `bin/lib/mcp-installer.js` atomically updates IDE MCP JSON configs while preserving existing user-configured servers.
