# ?? Curated Categories & Schemas

All entries in DevShelf are stored inside individual category files in the `shelf/` directory.

---

## 1. Free & Public APIs (`shelf/apis.json`)
APIs that developers can build with immediately for personal projects, testing, or production MVPs without paying.

### Schema:
```json
{
  "name": "Open-Meteo",
  "url": "https://open-meteo.com",
  "category": "Weather & Climate",
  "description": "Open-source weather API offering hourly forecasts, historical climate data, and solar radiation with no API key required.",
  "auth": "No Key",
  "cors": true,
  "rateLimit": "10,000 req/day"
}
```

### Inclusion Rules:
- Must offer a permanent free tier or require no API key.
- Endpoints must have active HTTPS and return HTTP 200.

---

## 2. CLI & Productivity Tools (`shelf/cli-tools.json`)
Command-line utilities that dramatically improve developer terminal workflows.

### Schema:
```json
{
  "name": "ripgrep",
  "url": "https://github.com/BurntSushi/ripgrep",
  "category": "File Search",
  "description": "Blazingly fast recursive regex search tool that respects your .gitignore rules automatically.",
  "language": "Rust",
  "license": "Unlicense / MIT"
}
```

---

## 3. AI Agents & Local LLM Tools (`shelf/ai-tools.json`)
Open-source inference runtimes, local agents, UI wrappers, and self-hosted model runners.

### Schema:
```json
{
  "name": "Ollama",
  "url": "https://github.com/ollama/ollama",
  "category": "Local LLM Runtime",
  "description": "Run Llama 3, Mistral, Qwen, and custom GGUF models locally on macOS, Linux, and Windows with a single command.",
  "language": "Go",
  "license": "MIT"
}
```

---

## 4. Testing & QA Reliability (`shelf/testing-qa.json`)
Testing frameworks, self-healing test tools, load testers, and mocking utilities.

### Schema:
```json
{
  "name": "Playwright",
  "url": "https://github.com/microsoft/playwright",
  "category": "E2E Testing",
  "description": "Fast, reliable cross-browser end-to-end automation for modern web applications across Chromium, Firefox, and WebKit.",
  "language": "TypeScript",
  "license": "Apache-2.0"
}
```

---

## 5. Free Cloud & Databases (`shelf/free-cloud.json`)
Cloud infrastructure, serverless runtimes, and managed databases with generous non-expiring free tiers.

### Schema:
```json
{
  "name": "Supabase",
  "url": "https://supabase.com",
  "category": "Database & Backend",
  "description": "Open-source Firebase alternative providing a managed Postgres database, authentication, realtime subscriptions, and auto-generated REST APIs.",
  "freeTier": "2 free Postgres databases (500MB storage, 50,000 active monthly users)"
}
```

---

## 6. Contributors Wanted (`shelf/contributors-wanted.json`)
High-potential open-source repositories actively welcoming newcomers and community contributors.

### Schema:
```json
{
  "name": "GitWhisper",
  "url": "https://github.com/RitualDev-Lab/GitWhisper",
  "category": "AI & Developer Tooling",
  "description": "Zero-config local AI commit message generator grounded in staged git changes with AST secret redaction.",
  "language": "TypeScript",
  "goodFirstIssuesUrl": "https://github.com/RitualDev-Lab/GitWhisper/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
}
```

---

## 7. Developer Perks & Startup Credits (`shelf/perks.json`)
Verified open-source maintainer sponsorships, student developer packs, and startup cloud credits.

### Schema:
```json
{
  "name": "Sentry for Open Source",
  "url": "https://sentry.io/for/open-source/",
  "category": "Error Tracking & Observability",
  "description": "Free Sentry Business plan for qualifying open-source maintainers to monitor application health, errors, and real-time performance.",
  "perkValue": "Free Sentry Business Plan ($312+/yr value)",
  "eligibility": "Public open-source repository with OSI-approved license"
}
```
