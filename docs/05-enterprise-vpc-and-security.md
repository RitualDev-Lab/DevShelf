# 05 — Enterprise VPC & Security Controls

## Supply-Chain & Verification Hygiene
- Every listed MCP server undergoes automated metadata validation, license verification, and zero-leak pre-flight checks.
- Recommended enterprise practice: wrap installed community MCP servers with AgentShield (`npx @ritualdev-lab/agentshield wrap ...`) before granting workspace access.
- Air-gapped teams can mirror DevShelf's static `data.json` catalog internally inside private VPCs with zero external runtime dependencies.

## Security & Governance
- Report malicious or compromised catalog listings immediately via [SECURITY.md](../SECURITY.md) or `security@ritualdev.in`.
- Partner Spotlight placements are transparently labeled and follow the published criteria at [ritualdev.in/partners](https://ritualdev.in/partners/).
