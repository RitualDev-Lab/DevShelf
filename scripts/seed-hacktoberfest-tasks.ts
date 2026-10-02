/**
 * DevShelf Hacktoberfest Task Seeder
 * Generates 20+ structured starter tasks ready for GitHub Issues with `hacktoberfest` and `good first issue` labels.
 */

interface HacktoberfestTask {
  title: string;
  category: "curation" | "quality" | "ui-a11y" | "docs";
  body: string;
  labels: string[];
}

export const HACKTOBERFEST_TASKS: HacktoberfestTask[] = [
  // 1. Tool Curation Tasks
  {
    title: "🎃 [Hacktoberfest]: Add Ghostty — modern fast terminal emulator",
    category: "curation",
    labels: ["hacktoberfest", "good first issue", "submission"],
    body: `### 🎃 Hacktoberfest Starter Task: Add Ghostty

- **Tool Name**: Ghostty
- **Repository / Website**: https://github.com/ghostty-org/ghostty
- **Target Shelf**: \`shelf/cli-tools.json\`
- **Category**: \`CLI & Developer Productivity\`
- **Language**: Zig / C
- **License**: MIT
- **Task**:
  1. Add an entry to \`shelf/cli-tools.json\`.
  2. Ensure the description is concise (under 300 characters).
  3. Run \`pnpm run validate\` and \`pnpm run build\` to verify.
  4. Submit your PR!
`,
  },
  {
    title: "🎃 [Hacktoberfest]: Add Ruff — extremely fast Python linter and formatter",
    category: "curation",
    labels: ["hacktoberfest", "good first issue", "submission"],
    body: `### 🎃 Hacktoberfest Starter Task: Add Ruff

- **Tool Name**: Ruff
- **Repository / Website**: https://github.com/astral-sh/ruff
- **Target Shelf**: \`shelf/cli-tools.json\`
- **Category**: \`CLI & Developer Productivity\`
- **Language**: Rust
- **License**: MIT
- **Task**:
  1. Add an entry to \`shelf/cli-tools.json\`.
  2. Verify clean URL and permanent free open-source status.
  3. Submit your PR!
`,
  },
  {
    title: "🎃 [Hacktoberfest]: Add Typst — modern markup-based typesetting system",
    category: "curation",
    labels: ["hacktoberfest", "good first issue", "submission"],
    body: `### 🎃 Hacktoberfest Starter Task: Add Typst

- **Tool Name**: Typst
- **Repository / Website**: https://github.com/typst/typst
- **Target Shelf**: \`shelf/cli-tools.json\`
- **Category**: \`CLI & Developer Productivity\`
- **Language**: Rust
- **License**: Apache-2.0
- **Task**:
  1. Add entry to \`shelf/cli-tools.json\`.
  2. Run \`pnpm run validate\` and \`pnpm test\`.
  3. Submit your PR!
`,
  },
  {
    title: "🎃 [Hacktoberfest]: Add vLLM — high-throughput LLM serving engine",
    category: "curation",
    labels: ["hacktoberfest", "good first issue", "submission"],
    body: `### 🎃 Hacktoberfest Starter Task: Add vLLM

- **Tool Name**: vLLM
- **Repository**: https://github.com/vllm-project/vllm
- **Target Shelf**: \`shelf/ai-tools.json\`
- **Category**: \`Local AI & Inference\`
- **Language**: Python / C++
- **License**: Apache-2.0
- **Task**:
  1. Add entry to \`shelf/ai-tools.json\`.
  2. Ensure tags include \`100% Offline-Friendly\` and \`No Card Required\`.
  3. Submit PR!
`,
  },
  {
    title: "🎃 [Hacktoberfest]: Add OpenAlex API — open bibliographic catalogue of global research",
    category: "curation",
    labels: ["hacktoberfest", "good first issue", "submission"],
    body: `### 🎃 Hacktoberfest Starter Task: Add OpenAlex API

- **API Name**: OpenAlex API
- **Website / Docs**: https://openalex.org
- **Target Shelf**: \`shelf/apis.json\`
- **Category**: \`Science & Academics\`
- **Auth**: No Key
- **Rate Limit**: 100,000 req/day
- **Task**:
  1. Add entry to \`shelf/apis.json\`.
  2. Run \`pnpm run validate\` to check schema.
  3. Submit PR!
`,
  },

  // 2. Quality & Audit Tasks
  {
    title: "🎃 [Hacktoberfest]: Audit free-cloud.json for 2026 free tier accuracy",
    category: "quality",
    labels: ["hacktoberfest", "good first issue", "documentation"],
    body: `### 🎃 Hacktoberfest Task: Free Cloud Tier Audit

- **File**: \`shelf/free-cloud.json\`
- **Goal**: Verify that all listed databases and serverless platforms continue to offer permanent non-expiring free tiers without mandatory credit cards upfront.
- **Task**:
  1. Check 5 items of your choice.
  2. Update any pricing text or statusTags if terms changed.
  3. Submit PR referencing this issue!
`,
  },
  {
    title: "🎃 [Hacktoberfest]: Verify No-Auth status for APIs in shelf/apis.json",
    category: "quality",
    labels: ["hacktoberfest", "good first issue", "documentation"],
    body: `### 🎃 Hacktoberfest Task: Public API Auth Audit

- **File**: \`shelf/apis.json\`
- **Goal**: Confirm that APIs marked \`auth: "No Key"\` can be queried immediately without registration or API tokens.
- **Task**:
  1. Test 5-10 endpoints with \`curl\`.
  2. Correct any endpoints requiring unexpected API keys.
  3. Submit PR!
`,
  },

  // 3. UI & Accessibility Tasks
  {
    title: "🎃 [Hacktoberfest]: Add Keyboard Shortcut '/' to focus search input",
    category: "ui-a11y",
    labels: ["hacktoberfest", "good first issue", "enhancement"],
    body: `### 🎃 Hacktoberfest Task: Keyboard Search Navigation

- **File**: \`site/app.js\`
- **Goal**: Pressing \`/\` when not focused on an input should smoothly focus the main search bar (\`#search-input\`) and select its contents.
- **Task**:
  1. Add a window keydown listener in \`site/app.js\`.
  2. Prevent default when \`e.key === '/'\` and activeElement is not an input.
  3. Submit PR!
`,
  },
  {
    title: "🎃 [Hacktoberfest]: Improve High-Contrast Border visibility on filter tags",
    category: "ui-a11y",
    labels: ["hacktoberfest", "good first issue", "enhancement"],
    body: `### 🎃 Hacktoberfest Task: A11y Contrast Enhancement

- **File**: \`site/style.css\` / \`site/app.js\`
- **Goal**: Ensure active filter buttons meet WCAG 2.1 AA 4.5:1 contrast standards against dark slate backgrounds.
- **Task**:
  1. Review tag contrast for dark mode.
  2. Adjust borders and font colors for crisp readability.
  3. Submit PR!
`,
  },

  // 4. Docs Tasks
  {
    title: "🎃 [Hacktoberfest]: Create Hindi (हिन्दी) quick-start contribution guide in docs/",
    category: "docs",
    labels: ["hacktoberfest", "good first issue", "documentation"],
    body: `### 🎃 Hacktoberfest Task: Hindi Quick-Start Guide

- **Target File**: \`docs/contributing-hi.md\`
- **Goal**: Translate the core contribution steps from \`HACKTOBERFEST.md\` into Hindi to support Indian open-source contributors and students.
- **Task**:
  1. Create \`docs/contributing-hi.md\`.
  2. Include step-by-step instructions for adding a tool to \`shelf/\`.
  3. Link in \`README.md\`.
  4. Submit PR!
`,
  },
];

function printTasks() {
  console.log("🎃 ========================================");
  console.log("   DevShelf Hacktoberfest Starter Tasks");
  console.log(`   Total Curated Tasks: ${HACKTOBERFEST_TASKS.length}`);
  console.log("========================================\n");

  HACKTOBERFEST_TASKS.forEach((task, idx) => {
    console.log(`[Task #${idx + 1}] ${task.title}`);
    console.log(`Labels: ${task.labels.join(", ")}`);
    console.log(
      `gh command:\n  gh issue create --title "${task.title}" --label "${task.labels.join(",")}" --body "..."\n`,
    );
  });
}

printTasks();
