# Security Policy & Vulnerability Disclosure

RitualDev Lab takes the integrity of the **DevShelf** developer catalog, 1-Click MCP Registry Installer (`npx devshelf install`), and binary verification policies seriously.

## Supported Versions

| Version | Supported | Minimum Runtime | Response Target |
| :--- | :---: | :---: | :---: |
| **1.1.x** | Active | Node.js >= 20.0.0 | Critical & High: < 24 Hours |
| < 1.1.0 | End-of-Life | Node.js >= 18.0.0 | Upgrade to latest 1.1.x |

## Reporting a Vulnerability or Malicious Listing

Please **do not** open public GitHub issues for undisclosed vulnerabilities or compromised catalog URLs.

- **GitHub Private Security Advisory (Preferred)**: [Report a Security Advisory](https://github.com/RitualDev-Lab/DevShelf/security/advisories/new)
- **Email**: `security@ritualdev.in` with subject `[SECURITY VULNERABILITY] @ritualdev-lab/devshelf`

## Native Binary Trust Policy

Native OS desktop executables lacking Authenticode (Windows) or Apple Notarization (macOS) signatures are labeled `[UNVERIFIED BINARY - UNSIGNED]` and are ineligible for Verified/Featured badges.

## Compliance & Control Alignment

- **Status**: SOC 2 Type II & ISO 27001 Control-Mapped Architecture (**Self-Attested Readiness; Formal Independent Audit Planned**).
- **Trust & Control Mapping Portal**: [https://ritualdev.in/trust](https://ritualdev.in/trust)
