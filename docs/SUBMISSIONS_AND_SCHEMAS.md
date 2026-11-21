# 📐 DevShelf & MCPShelf: Submissions, Directory Structure & Shared Schema Specification

This document defines the canonical directory structure, submission interfaces, and shared JSON schema contracts across the **DevShelf** and **MCPShelf** developer ecosystem.

---

## 🗂️ 1. Standardized Directory Conventions

To avoid ambiguity between public directory datasets and internal build metadata, both repositories adhere to a strict folder separation:

| Directory | Purpose | Mutability & Contribution Rules |
| :--- | :--- | :--- |
| **`shelf/`** | **Canonical Category Datasets** (`shelf/*.json`) | **Publicly editable by contributors via PR**. Contains all curated tools, APIs, AI agents, CLIs, cloud services, and boilerplates. |
| **`data/`** | **Internal Metadata & Telemetry** | **Automated / Maintainer-only**. Contains build outputs, sync telemetry, tool counts (`data/counts.json`), and sponsor configs (`data/sponsors.json`). |
| **`schemas/`** | **JSON Schema Definitions** | Contains draft-2020-12 / draft-07 schemas for automated validation. |
| **`site/`** | **Web Directory Frontend & Static API** | Built by `pnpm run build`. Contains web portal assets and static JSON endpoints (`/api/v1/*`). |

> [!IMPORTANT]
> Always submit new tools and APIs to the appropriate file in **`shelf/`** (e.g. `shelf/cli-tools.json`, `shelf/ai-tools.json`, `shelf/apis.json`). **Never** submit entries to `data/`.

---

## 🔄 2. Cross-Repo Unified Submission Protocol

Developers and AI coding agents can submit tools directly via terminal using MCPShelf's unified submission CLI or DevShelf's git PR workflow:

```bash
# Submit an MCP server to MCPShelf
npx @ritualdev-lab/mcpshelf submit ./tool.json --target=mcpshelf

# Submit a developer tool or API to DevShelf
npx @ritualdev-lab/mcpshelf submit ./tool.json --target=devshelf
```

Both targets share common core validation rules:
- **`target`**: `'mcpshelf'` or `'devshelf'`.
- **`item.name`**: Required string, minimum 2 characters.
- **`item.description`**: Required string, 10–300 characters, objective description.
- **`item.category`**: Functional category string.
- **`item.repositoryUrl`** or **`item.websiteUrl`**: At least one valid HTTP(S) URL is required.

---

## 📋 3. Canonical DevShelf Item Schema

Entries inside `shelf/*.json` satisfy the following JSON schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["name", "description"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2,
      "description": "Unique title of the tool or resource"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Primary project homepage or live documentation URL"
    },
    "repo": {
      "type": "string",
      "format": "uri",
      "description": "Direct link to public GitHub / GitLab source repository"
    },
    "category": {
      "type": "string",
      "description": "Functional subcategory within the shelf"
    },
    "description": {
      "type": "string",
      "minLength": 10,
      "maxLength": 300,
      "description": "Concise summary of functionality and developer benefits"
    },
    "language": {
      "type": "string",
      "description": "Primary implementation language or runtime (e.g. Rust, Go, TypeScript)"
    },
    "license": {
      "type": "string",
      "description": "Open source license (e.g. MIT, Apache-2.0, MPL-2.0)"
    },
    "nativeBinary": {
      "type": "boolean",
      "description": "True if pre-compiled OS executables (.exe, .dmg) are distributed"
    },
    "codeSigned": {
      "type": "boolean",
      "description": "True if binaries are signed via Authenticode or Apple Notarization (SEC-06)"
    },
    "firstParty": {
      "type": "boolean",
      "description": "True if authored or incubated by RitualDev Studio (editorial transparency)"
    },
    "editorialNote": {
      "type": "string",
      "description": "Affiliation disclosure statement displayed on the tool card"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Search discovery keywords"
    }
  }
}
```

---

## 🧪 4. CI/CD Validation Pipeline

Every PR opened on `RitualDev-Lab/DevShelf` triggers automated validation:

1. **`pnpm run validate`** (`scripts/validate-shelf.ts`):
   - Confirms every `shelf/*.json` file is a valid array.
   - Verifies each item has `name`, either `url` or `repo`, and `description`.
2. **`pnpm run validate:pr`** (`scripts/validate-pr.ts`):
   - Checks for duplicate entries across all categories (exact name, exact URL, normalized host).
   - Validates URL syntax and protocols (prevents broken schemas or test domains like `example.com`).
   - Runs `evaluateBinaryTrustPolicy()` to flag unsigned native binaries.
3. **`pnpm test`** (`tsx --test`):
   - Runs unit and integration suites, including cross-repo schema compatibility tests (`tests/cross-repo-schema.test.ts`).
