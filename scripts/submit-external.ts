import { execSync } from "node:child_process";

// Dynamically fetch GitHub token from local Git Credential Manager
function getGitHubToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const output = execSync("git credential fill", {
      input: "protocol=https\nhost=github.com\n",
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const match = output.match(/password=(.+)/);
    if (match?.[1]) return match[1].trim();
  } catch (err) {
    // fallback
  }
  throw new Error(
    "GitHub token not found. Please log in with git credential manager or set GITHUB_TOKEN environment variable.",
  );
}

const token = getGitHubToken();
const headers: Record<string, string> = {
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "DevShelf-Automation-CLI",
};

async function ghFetch(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}) on ${url}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function getAuthUser(): Promise<string> {
  const u = await ghFetch("https://api.github.com/user");
  return u.login;
}

// ── Check Status ──────────────────────────────────────────

async function checkStatus() {
  const user = await getAuthUser();
  console.log(`\n🔍 Checking Directory Submission Status for user: @${user}\n`);

  // 1. open-source-ideas/ideas
  try {
    const issues = await ghFetch(
      "https://api.github.com/repos/open-source-ideas/ideas/issues?creator=Ritual-Dev-Git&state=all",
    );
    const osiIssue = issues.find((i: any) => i.title.includes("DevShelf"));
    if (osiIssue) {
      console.log(`✅ [open-source-ideas/ideas] Issue #${osiIssue.number} is ACTIVE:`);
      console.log(`   URL: ${osiIssue.html_url}`);
    } else {
      console.log("ℹ️ [open-source-ideas/ideas] No issue found from Ritual-Dev-Git.");
    }
  } catch (e: any) {
    console.log(`⚠️ [open-source-ideas/ideas] Status check error: ${e.message}`);
  }

  // 2. up-for-grabs/up-for-grabs.net
  try {
    const prs = await ghFetch(
      `https://api.github.com/repos/up-for-grabs/up-for-grabs.net/pulls?head=${user}:add-devshelf&state=all`,
    );
    if (prs.length > 0) {
      console.log(`✅ [up-for-grabs.net] Pull Request #${prs[0].number} is ACTIVE:`);
      console.log(`   URL: ${prs[0].html_url} (State: ${prs[0].state})`);
    } else {
      console.log(`⏳ [up-for-grabs.net] No PR found yet for branch 'add-devshelf'.`);
    }
  } catch (e: any) {
    console.log(`⚠️ [up-for-grabs.net] Check error: ${e.message}`);
  }

  // 3. ripienaar/free-for-dev
  try {
    const prs = await ghFetch(
      `https://api.github.com/repos/ripienaar/free-for-dev/pulls?head=${user}:add-devshelf&state=all`,
    );
    if (prs.length > 0) {
      console.log(`✅ [free-for-dev] Pull Request #${prs[0].number} is ACTIVE:`);
      console.log(`   URL: ${prs[0].html_url} (State: ${prs[0].state})`);
    } else {
      console.log("⏳ [free-for-dev] Not yet submitted.");
    }
  } catch (e: any) {
    console.log(`⚠️ [free-for-dev] Check error: ${e.message}`);
  }

  // 4. MunGell/awesome-for-beginners
  try {
    const prs = await ghFetch(
      `https://api.github.com/repos/MunGell/awesome-for-beginners/pulls?head=${user}:add-devshelf&state=all`,
    );
    if (prs.length > 0) {
      console.log(`✅ [awesome-for-beginners] Pull Request #${prs[0].number} is ACTIVE:`);
      console.log(`   URL: ${prs[0].html_url} (State: ${prs[0].state})`);
    } else {
      console.log("⏳ [awesome-for-beginners] Not yet submitted.");
    }
  } catch (e: any) {
    console.log(`⚠️ [awesome-for-beginners] Check error: ${e.message}`);
  }

  console.log("\n=======================================================");
}

// ── Submit to MunGell/awesome-for-beginners ───────────────

async function submitAwesomeForBeginners() {
  const user = await getAuthUser();
  const upstreamRepo = "MunGell/awesome-for-beginners";
  console.log(`\n🚀 Submitting DevShelf to ${upstreamRepo} as @${user}...`);

  // 1. Check existing PR
  const existingPrs = await ghFetch(
    `https://api.github.com/repos/${upstreamRepo}/pulls?head=${user}:add-devshelf&state=open`,
  );
  if (existingPrs.length > 0) {
    console.log(`✅ Pull request already exists: ${existingPrs[0].html_url}`);
    return;
  }

  // 2. Ensure Fork exists
  try {
    await ghFetch(`https://api.github.com/repos/${user}/awesome-for-beginners`);
    console.log(`   Fork @${user}/awesome-for-beginners exists.`);
  } catch {
    console.log(`   Creating fork @${user}/awesome-for-beginners...`);
    await ghFetch(`https://api.github.com/repos/${upstreamRepo}/forks`, {
      method: "POST",
    });
    // Wait 4 seconds for GitHub fork provisioning
    await new Promise((r) => setTimeout(r, 4000));
  }

  // 3. Get default branch & SHA
  const upstreamRepoInfo = await ghFetch(`https://api.github.com/repos/${upstreamRepo}`);
  const defaultBranch = upstreamRepoInfo.default_branch;
  const upstreamMaster = await ghFetch(
    `https://api.github.com/repos/${upstreamRepo}/git/ref/heads/${defaultBranch}`,
  );
  const masterSha = upstreamMaster.object.sha;

  // 4. Create or update branch 'add-devshelf'
  try {
    await ghFetch(`https://api.github.com/repos/${user}/awesome-for-beginners/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: "refs/heads/add-devshelf",
        sha: masterSha,
      }),
    });
    console.log(`   Created branch 'add-devshelf'.`);
  } catch {
    console.log(`   Branch 'add-devshelf' already exists, updating ref...`);
    await ghFetch(
      `https://api.github.com/repos/${user}/awesome-for-beginners/git/refs/heads/add-devshelf`,
      {
        method: "PATCH",
        body: JSON.stringify({ sha: masterSha, force: true }),
      },
    );
  }

  // 5. Fetch and update data.json
  const fileData = await ghFetch(
    `https://api.github.com/repos/${user}/awesome-for-beginners/contents/data.json?ref=add-devshelf`,
  );
  const jsonContent = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf8"));

  const exists = jsonContent.repositories?.some((r: any) =>
    r.link?.toLowerCase().includes("ritualdev-lab/devshelf"),
  );

  if (exists) {
    console.log("   DevShelf already present in data.json.");
  } else {
    const newRepo = {
      name: "DevShelf",
      link: "https://github.com/RitualDev-Lab/DevShelf",
      label: "good first issue",
      technologies: ["JavaScript", "TypeScript"],
      description:
        "A crowdsourced, zero-paywall directory of developer tools, free APIs, and 1-click boilerplates with continuous uptime monitoring.",
    };

    // Find index of last JavaScript repository or append
    let lastJsIndex = -1;
    for (let i = 0; i < jsonContent.repositories.length; i++) {
      if (jsonContent.repositories[i].technologies?.includes("JavaScript")) {
        lastJsIndex = i;
      }
    }
    if (lastJsIndex !== -1) {
      jsonContent.repositories.splice(lastJsIndex + 1, 0, newRepo);
    } else {
      jsonContent.repositories.push(newRepo);
    }

    const updatedContent = `${JSON.stringify(jsonContent, null, 4)}\n`;

    // Commit file
    await ghFetch(`https://api.github.com/repos/${user}/awesome-for-beginners/contents/data.json`, {
      method: "PUT",
      body: JSON.stringify({
        message: "add DevShelf to data.json",
        content: Buffer.from(updatedContent).toString("base64"),
        sha: fileData.sha,
        branch: "add-devshelf",
      }),
    });
    console.log(`   Committed DevShelf entry to branch 'add-devshelf' in data.json.`);
  }

  // 6. Create Pull Request
  console.log(`   Opening Pull Request on ${upstreamRepo}...`);
  const pr = await ghFetch(`https://api.github.com/repos/${upstreamRepo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: "Add DevShelf",
      head: `${user}:add-devshelf`,
      base: defaultBranch,
      body: `Added DevShelf to \`data.json\`.

### Repository Details
- **Name:** DevShelf
- **Repository:** https://github.com/RitualDev-Lab/DevShelf
- **Website:** https://devshelf.ritualdev.in/
- **Technologies:** JavaScript, TypeScript
- **Beginner Issue Label:** \`good first issue\` ([view beginner issues](https://github.com/RitualDev-Lab/DevShelf/labels/good%20first%20issue))
- **Description:** A crowdsourced, zero-paywall directory of developer tools, free APIs, and 1-click boilerplates with continuous uptime monitoring.`,
    }),
  });

  console.log("🎉 Pull Request created successfully!");
  console.log(`   URL: ${pr.html_url}`);
}

// ── Submit to ripienaar/free-for-dev ───────────────────────

async function submitFreeForDev() {
  const user = await getAuthUser();
  const upstreamRepo = "ripienaar/free-for-dev";
  console.log(`\n🚀 Submitting DevShelf to ${upstreamRepo} as @${user}...`);

  // 1. Check existing PR
  const existingPrs = await ghFetch(
    `https://api.github.com/repos/${upstreamRepo}/pulls?head=${user}:add-devshelf&state=open`,
  );
  if (existingPrs.length > 0) {
    console.log(`✅ Pull request already exists: ${existingPrs[0].html_url}`);
    return;
  }

  // 2. Ensure Fork exists
  try {
    await ghFetch(`https://api.github.com/repos/${user}/free-for-dev`);
    console.log(`   Fork @${user}/free-for-dev exists.`);
  } catch {
    console.log(`   Creating fork @${user}/free-for-dev...`);
    await ghFetch(`https://api.github.com/repos/${upstreamRepo}/forks`, {
      method: "POST",
    });
    await new Promise((r) => setTimeout(r, 4000));
  }

  // 3. Get master SHA
  const upstreamMaster = await ghFetch(
    `https://api.github.com/repos/${upstreamRepo}/git/ref/heads/master`,
  );
  const masterSha = upstreamMaster.object.sha;

  // 4. Create or update branch 'add-devshelf'
  try {
    await ghFetch(`https://api.github.com/repos/${user}/free-for-dev/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: "refs/heads/add-devshelf",
        sha: masterSha,
      }),
    });
    console.log(`   Created branch 'add-devshelf'.`);
  } catch {
    console.log(`   Branch 'add-devshelf' already exists, updating ref...`);
    await ghFetch(`https://api.github.com/repos/${user}/free-for-dev/git/refs/heads/add-devshelf`, {
      method: "PATCH",
      body: JSON.stringify({ sha: masterSha, force: true }),
    });
  }

  // 5. Fetch README.md
  const readmeData = await ghFetch(
    `https://api.github.com/repos/${user}/free-for-dev/contents/README.md?ref=add-devshelf`,
  );
  const currentContent = Buffer.from(readmeData.content, "base64").toString("utf8");

  const entry =
    "    * [DevShelf](https://devshelf.ritualdev.in) - An open-source, community-driven directory of verified developer tools, free APIs, and 1-click boilerplates with continuous uptime and latency monitoring.";

  if (currentContent.includes("devshelf.ritualdev.in")) {
    console.log("   DevShelf already present in README.md.");
  } else {
    // Insert under "## Other Free Resources" in alphabetical order
    const sectionHeader = "## Other Free Resources";
    const sectionIndex = currentContent.indexOf(sectionHeader);
    if (sectionIndex === -1) {
      throw new Error(`Could not find '${sectionHeader}' in README.md`);
    }

    const insertPos = currentContent.indexOf("\n\n    * [", sectionIndex) + 2;
    const updatedContent = `${currentContent.slice(0, insertPos) + entry}\n${currentContent.slice(insertPos)}`;

    // Commit file
    await ghFetch(`https://api.github.com/repos/${user}/free-for-dev/contents/README.md`, {
      method: "PUT",
      body: JSON.stringify({
        message: "Add DevShelf to Other Free Resources",
        content: Buffer.from(updatedContent).toString("base64"),
        sha: readmeData.sha,
        branch: "add-devshelf",
      }),
    });
    console.log(`   Committed DevShelf entry to branch 'add-devshelf'.`);
  }

  // 6. Create Pull Request
  console.log(`   Opening Pull Request on ${upstreamRepo}...`);
  const pr = await ghFetch(`https://api.github.com/repos/${upstreamRepo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: "Add DevShelf to Other Free Resources",
      head: `${user}:add-devshelf`,
      base: "master",
      body: `### Description
Adds [DevShelf](https://devshelf.ritualdev.in) to the **Other Free Resources** section.

DevShelf is a crowdsourced, zero-paywall directory for developer tools, free APIs, AI agents, and 1-click boilerplates with continuous automated uptime & TTFB latency monitoring.

- **URL:** https://devshelf.ritualdev.in
- **Repository:** https://github.com/RitualDev-Lab/DevShelf
- **Free Tier:** 100% free with zero credit-card requirements or paywalls.`,
    }),
  });

  console.log("🎉 Pull Request created successfully!");
  console.log(`   URL: ${pr.html_url}`);
}

// ── CLI Dispatcher ────────────────────────────────────────

const arg = process.argv[2] || "status";

async function main() {
  if (arg === "status") {
    await checkStatus();
  } else if (arg === "awesome" || arg === "awesome-for-beginners") {
    await submitAwesomeForBeginners();
  } else if (arg === "free-for-dev" || arg === "freedev") {
    await submitFreeForDev();
  } else if (arg === "all") {
    await submitAwesomeForBeginners();
    await submitFreeForDev();
    await checkStatus();
  } else {
    console.log("Usage: npx tsx scripts/submit-external.ts [status|awesome|free-for-dev|all]");
  }
}

main().catch((err) => {
  console.error("❌ Submission failed:", err.message);
  process.exit(1);
});
