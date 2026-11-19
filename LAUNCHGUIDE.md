---
name: devshelf
title: DevShelf
tagline: Search 577+ CI-audited developer tools, free APIs & stacks inside Claude & Cursor
description: Connect your AI coding assistant directly to 577+ CI-audited, zero-paywall developer tools, free APIs, and open-source infrastructure. Includes fuzzy search, open-source alternative finder, and $0/month production stack recommendations.
category: Developer Tools
use_cases:
  - Developer Tool Discovery
  - Open Source Alternatives
  - Free API Search
  - Zero-Cost Stack Recommendation
  - Developer Utilities
getting_started:
  - "Find a free database with Postgres: search_tools query: postgres"
  - "What is a free open-source alternative to Postman?: find_free_alternatives commercialTool: Postman"
  - "Recommend a $0/month full-stack setup: recommend_stack projectType: web"
  - "Tool: search_tools: Full-text fuzzy search across 577+ developer tools, APIs, and AI packages"
tags:
  - developer-tools
  - free-apis
  - mcp-server
  - open-source
  - cursor
  - claude
  - ai-agents
  - database
documentation_url: https://devshelf.ritualdev.in
repository: https://github.com/RitualDev-Lab/DevShelf
homepage: https://devshelf.ritualdev.in
npm: "@ritualdev-lab/devshelf"
transport: stdio
command: npx
args: ["-y", "@ritualdev-lab/devshelf", "mcp"]
pricing:
  type: free
  license: MIT
environment_variables: []
---

# DevShelf MCP Server

**DevShelf** connects Claude Desktop, Cursor, Windsurf, and other AI coding assistants directly to 577+ CI-audited, zero-paywall developer tools, free APIs, and open-source infrastructure.

## Setup Requirements

**None.** DevShelf runs completely client-side over stdio with zero API keys or environment variables required.

## Quick Installation

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

## Exposed Tools

1. `search_tools`: Full-text fuzzy search across all 577+ developer tools, APIs, and frameworks.
2. `find_free_alternatives`: Discover verified free & open-source alternatives to commercial SaaS (Postman, Datadog, Airtable).
3. `recommend_stack`: Generate complete $0/month production architectures tailored to project requirements.
4. `get_tool`: Retrieve deep metadata: license, rate limits, free tiers, docker compose support.
5. `check_tool_health`: Real-time HTTP uptime, latency, and reachability telemetry.
6. `list_categories`: Browse 8 primary developer categories with live resource counts.
