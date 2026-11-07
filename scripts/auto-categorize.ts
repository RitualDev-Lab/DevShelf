#!/usr/bin/env tsx

/**
 * DevShelf Auto-Categorizing Tool
 * Evaluates tools using technical taxonomy, keyword weights, and repo metadata
 * to automatically assign the appropriate shelf file, category, and status tags.
 *
 * Usage:
 *   npx tsx scripts/auto-categorize.ts --name "<ToolName>" --desc "<Description>" [--tags "t1,t2"]
 *   npx tsx scripts/auto-categorize.ts --audit
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TaxonomyRule {
  id: string;
  name: string;
  shelf: string;
  shelfCategory: string;
  keywords: string[];
  weight: number;
}

const CATEGORY_TAXONOMY: TaxonomyRule[] = [
  {
    id: "ai-mcp",
    name: "AI & MCP Servers",
    shelf: "shelf/ai-tools.json",
    shelfCategory: "AI Agents & MCP Servers",
    keywords: [
      "ai",
      "llm",
      "agent",
      "gpt",
      "claude",
      "mcp",
      "model context protocol",
      "inference",
      "ollama",
      "vllm",
      "localai",
      "prompt",
      "autonomous",
      "rag",
      "vector",
      "embeddings",
      "langchain",
      "crewai",
      "transformer",
      "genai",
      "copilot",
    ],
    weight: 1.2,
  },
  {
    id: "database",
    name: "Databases & SQL",
    shelf: "shelf/cli-tools.json",
    shelfCategory: "Database & SQL",
    keywords: [
      "database",
      "db",
      "sql",
      "postgres",
      "postgresql",
      "sqlite",
      "mysql",
      "redis",
      "mongodb",
      "baas",
      "orm",
      "prisma",
      "drizzle",
      "migration",
      "query",
      "duckdb",
      "vector database",
      "surrealdb",
      "nosql",
      "supabase",
      "clickhouse",
    ],
    weight: 1.1,
  },
  {
    id: "devops-containers",
    name: "DevOps & Containers",
    shelf: "shelf/cli-tools.json",
    shelfCategory: "DevOps & Containers",
    keywords: [
      "docker",
      "container",
      "kubernetes",
      "k8s",
      "compose",
      "podman",
      "helm",
      "ci",
      "cd",
      "pipeline",
      "deploy",
      "terraform",
      "ansible",
      "self-host",
      "selfhosted",
      "nginx",
      "caddy",
      "traefik",
      "reverse proxy",
      "devops",
      "cloud",
    ],
    weight: 1.1,
  },
  {
    id: "cli-terminal",
    name: "CLI Tools & Terminal",
    shelf: "shelf/cli-tools.json",
    shelfCategory: "Terminal & Shell",
    keywords: [
      "cli",
      "terminal",
      "shell",
      "bash",
      "zsh",
      "fish",
      "tui",
      "command-line",
      "console",
      "prompt",
      "tmux",
      "git",
      "diff",
      "ssh",
      "repl",
      "keyboard",
      "developer productivity",
      "utility",
    ],
    weight: 1.0,
  },
  {
    id: "testing-qa",
    name: "Testing & QA",
    shelf: "shelf/testing-qa.json",
    shelfCategory: "Browser & E2E Testing",
    keywords: [
      "test",
      "testing",
      "qa",
      "e2e",
      "browser testing",
      "playwright",
      "cypress",
      "mock",
      "mocking",
      "sandbox",
      "load test",
      "benchmark",
      "k6",
      "artillery",
      "unit test",
      "integration test",
      "schema",
      "assert",
      "coverage",
    ],
    weight: 1.1,
  },
  {
    id: "api-network",
    name: "API & Network Tools",
    shelf: "shelf/apis.json",
    shelfCategory: "API Testing & Debugging",
    keywords: [
      "api",
      "rest",
      "graphql",
      "grpc",
      "http",
      "curl",
      "postman",
      "hoppscotch",
      "bruno",
      "webhook",
      "proxy",
      "tunnel",
      "ngrok",
      "packet",
      "websocket",
    ],
    weight: 1.0,
  },
  {
    id: "security-auth",
    name: "Security & Authentication",
    shelf: "shelf/free-cloud.json",
    shelfCategory: "Authentication & Security",
    keywords: [
      "security",
      "auth",
      "authentication",
      "oauth",
      "jwt",
      "identity",
      "sso",
      "vulnerability",
      "scanner",
      "cve",
      "firewall",
      "encryption",
      "audit",
      "secret",
      "token",
      "shield",
      "dpdp",
      "privacy",
      "zero telemetry",
    ],
    weight: 1.1,
  },
  {
    id: "cloud-paas",
    name: "Cloud Hosting & PaaS",
    shelf: "shelf/free-cloud.json",
    shelfCategory: "Cloud Hosting & PaaS",
    keywords: [
      "cloud",
      "hosting",
      "paas",
      "serverless",
      "edge",
      "deploy",
      "free tier",
      "cloudflare",
      "vercel",
      "netlify",
      "fly.io",
      "render",
      "railway",
    ],
    weight: 1.0,
  },
  {
    id: "boilerplates",
    name: "Boilerplates & Starters",
    shelf: "shelf/boilerplates.json",
    shelfCategory: "Full-Stack Web Starter",
    keywords: [
      "boilerplate",
      "starter",
      "template",
      "scaffold",
      "saas starter",
      "full-stack",
      "nextjs template",
      "dashboard starter",
    ],
    weight: 1.0,
  },
];

export function autoCategorize(text: string): {
  category: string;
  shelfCategory: string;
  shelf: string;
  confidence: number;
  reason: string;
  suggestedTags: string[];
} {
  const t = text.toLowerCase();
  let best: TaxonomyRule | null = null;
  let maxScore = 0;
  let matchedKw = "";

  for (const tax of CATEGORY_TAXONOMY) {
    let score = 0;
    for (const kw of tax.keywords) {
      if (t.includes(kw)) {
        score += 2.0 * tax.weight;
        matchedKw = kw;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      best = tax;
    }
  }

  if (!best || maxScore === 0) {
    return {
      category: "Developer Tools",
      shelfCategory: "Developer Tools",
      shelf: "shelf/cli-tools.json",
      confidence: 45,
      reason: "General developer utility baseline",
      suggestedTags: ["developer-tools", "open-source"],
    };
  }

  const confidence = Math.min(99, Math.round((maxScore / 6) * 100));

  return {
    category: best.name,
    shelfCategory: best.shelfCategory,
    shelf: best.shelf,
    confidence,
    reason: `Matched taxonomy keywords: "${matchedKw}"`,
    suggestedTags: best.keywords.slice(0, 4),
  };
}

// CLI Driver
const args = process.argv.slice(2);

if (args.includes("--audit")) {
  const shelfDir = path.join(__dirname, "..", "shelf");
  const files = fs.readdirSync(shelfDir).filter((f) => f.endsWith(".json"));
  let totalTools = 0;
  console.log(`\n🔍 Auditing ${files.length} shelf files in DevShelf...`);

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(shelfDir, file), "utf-8"));
    const items = Array.isArray(raw) ? raw : raw.tools || raw.items || [];
    totalTools += items.length;
    console.log(`   📁 ${file.padEnd(25)}: ${items.length} tools`);
  }

  console.log(`\n✅ Audit complete: Total ${totalTools} verified tools across all shelves.\n`);
  process.exit(0);
}

let toolName = "";
let toolDesc = "";
let toolTags = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--name" && args[i + 1]) {
    toolName = args[i + 1];
    i++;
  } else if (args[i] === "--desc" && args[i + 1]) {
    toolDesc = args[i + 1];
    i++;
  } else if (args[i] === "--tags" && args[i + 1]) {
    toolTags = args[i + 1];
    i++;
  }
}

if (!toolName && !toolDesc) {
  console.log(`
🛠️  DevShelf Auto-Categorizing Tool (TypeScript)

Usage:
  npx tsx scripts/auto-categorize.ts --name "<Name>" --desc "<Description>" [--tags "t1,t2"]
  npx tsx scripts/auto-categorize.ts --audit
`);
  process.exit(0);
}

const res = autoCategorize(`${toolName} ${toolDesc} ${toolTags}`);
console.log("\n╔════════════════════════════════════════════════════════════════════╗");
console.log("║              DEVSHELF AUTO-CATEGORIZATION REPORT                  ║");
console.log("╚════════════════════════════════════════════════════════════════════╝\n");
console.log(` 📦 Tool Name            : ${toolName || "(Not specified)"}`);
console.log(` 📝 Description          : ${toolDesc || "(Not specified)"}`);
console.log(` 🏷️  Assigned Category    : ${res.shelfCategory}`);
console.log(` 📁 Recommended Shelf    : ${res.shelf}`);
console.log(` 🎯 Confidence Level     : ${res.confidence}%`);
console.log(` 💡 Classification Logic : ${res.reason}`);
console.log(` 🔖 Suggested Tags       : ${res.suggestedTags.join(", ")}`);
console.log("\n" + "─".repeat(70) + "\n");
