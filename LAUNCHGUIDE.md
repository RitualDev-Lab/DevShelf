---
name: devshelf
title: DevShelf MCP Server
description: Discover 577+ CI-audited developer tools, free APIs, and open-source infrastructure directly inside Claude Desktop, Cursor, and Windsurf via MCP.
version: 1.1.2
author: RitualDev Studio <developer@ritualdev.in>
license: MIT
repository: https://github.com/RitualDev-Lab/DevShelf
homepage: https://devshelf.ritualdev.in
npm: "@ritualdev-lab/devshelf"
transport: stdio
command: npx
args: ["-y", "@ritualdev-lab/devshelf", "mcp"]
tags:
  - developer-tools
  - free-apis
  - mcp-server
  - model-context-protocol
  - ai-agents
  - open-source
  - cursor
  - claude
pricing:
  type: free
  license: MIT
---

# DevShelf MCP Server

**DevShelf** connects Claude Desktop, Cursor, Windsurf, and other AI coding assistants directly to 577+ CI-audited, zero-paywall developer tools, free APIs, and open-source infrastructure.

## Quick Installation

### Standard stdio configuration:
```json
{
  "mcpServers": {
    "devshelf": {
      "command": "npx",
      "args": ["-y", "@ritualdev-lab/devshelf", "mcp"]
    }
  }
}
```

## Features & Capabilities

- **Fuzzy Search 577+ Tools**: Search databases, auth, hosting, CI/CD, AI tools, and free APIs.
- **Find Free Alternatives**: Query free & open-source alternatives to commercial SaaS (e.g. Postman -> Bruno, Datadog -> Prometheus).
- **Recommend $0/mo Stacks**: Tailor a verified, zero-cost production architecture (Database, Auth, Hosting, Storage, AI) based on project specs.
- **Real-Time Health & Rate Limits**: Inspect real-time reachability, rate limits, and free tier allowances without leaving your AI editor.

## Exposed MCP Tools

1. `search_tools`: Full-text fuzzy search across all 577+ developer tools, APIs, AI frameworks, and boilerplates.
2. `get_tool`: Retrieve deep metadata: license, auth type, rate limits, free tier details, and repo URL.
3. `find_free_alternatives`: Discover verified open-source alternatives to expensive commercial tools.
4. `recommend_stack`: Generate complete zero-cost production architectures tailored to project requirements.
5. `check_tool_health`: Real-time HTTP uptime, latency, and reachability telemetry.
6. `list_categories`: Browse 8 primary developer categories with live resource counts.
7. `get_random_tool`: Discover trending developer utilities.
8. `get_security_audit`: View catalog identity provenance and cryptographic audit records.
9. `list_verified_sponsor_tools`: Inspect verified community-endorsed tooling.
10. `get_sponsor_telemetry`: View live ecosystem telemetry.

## Pricing & Licensing

- **License**: MIT (100% Free & Open Source)
- **Zero Paywalls**: All listed tools are audited against misleading 14-day trials or hidden fees.
