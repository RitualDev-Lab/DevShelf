const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

module.exports = async function postMergeCelebration({ github, context }) {
  const pr = context.payload.pull_request;
  if (!pr || !pr.merged) {
    console.log("Not a merged PR. Skipping celebration.");
    return;
  }

  const prNumber = pr.number;
  const prTitle = pr.title || "";
  const prBody = pr.body || "";
  let contributor = pr.user.login;

  // Check if submitted on behalf of someone via the issue form
  const submitterMatch = prBody.match(/Submitted by @([a-zA-Z0-9_-]+)/i);
  if (submitterMatch?.[1]) {
    contributor = submitterMatch[1];
  }

  // Detect which items were added in shelf/*.json
  const addedItems = [];
  try {
    const filesList = await github.rest.pulls.listFiles({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_request_number: prNumber,
    });

    const shelfFiles = filesList.data.filter(
      (f) => f.filename.startsWith("shelf/") && f.filename.endsWith(".json"),
    );

    for (const sf of shelfFiles) {
      if (sf.patch) {
        // Find added names from the git patch (+ "name": "...")
        const nameMatches = [...sf.patch.matchAll(/\+\s*"name":\s*"([^"]+)"/g)];
        for (const m of nameMatches) {
          addedItems.push({ name: m[1], file: sf.filename });
        }
      }
    }
  } catch (err) {
    console.warn("Could not inspect PR file list:", err.message);
  }

  // Fallback: search title or body for tool name
  if (addedItems.length === 0) {
    const titleMatch = prTitle.match(/add (?:submission from #\d+|([A-Za-z0-9_-]+))/i);
    if (titleMatch?.[1]) {
      addedItems.push({ name: titleMatch[1] });
    }
  }

  const toolName = addedItems.length > 0 ? addedItems[0].name : "your project";
  const slug = addedItems.length > 0 ? slugify(toolName) : "";
  const toolPageUrl = slug
    ? `https://devshelf.ritualdev.in/tools/${slug}.html`
    : "https://devshelf.ritualdev.in";

  const tweetText = encodeURIComponent(
    `Excited to share that ${toolName} is now officially featured on @RitualDevLab's DevShelf — the zero-paywall directory for verified free developer tools & APIs! 🚀\n\nCheck it out here: ${toolPageUrl}`,
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const commentBody = [
    `# 🚀 Congratulations @${contributor}! Your tool is officially LIVE on DevShelf! 🎉`,
    "",
    `Your submission of **${toolName}** has passed all schema, duplicate, and endpoint integrity audits and is now merged into \`main\`!`,
    "",
    "### 🌐 Permanent Live Listing",
    "Your project has a dedicated, high-ranking SEO landing page with verified zero-paywall status:",
    `👉 **[View ${toolName} on DevShelf](${toolPageUrl})**`,
    "",
    "---",
    "",
    '### 🏷️ Add the Official "Featured on DevShelf" Badge',
    "Show your users and visitors that your project is community-verified and free of paywalls or tracking traps by embedding an official badge in your `README.md`:",
    "",
    "#### Style 1: Modern Purple (Recommended)",
    `[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](${toolPageUrl})`,
    "",
    "```markdown",
    `[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](${toolPageUrl})`,
    "```",
    "",
    "#### Style 2: Flat Square Verified Free",
    `[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Verified_Free-7928CA?style=flat-square&logo=googlechrome&logoColor=white)](${toolPageUrl})`,
    "",
    "```markdown",
    `[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Verified_Free-7928CA?style=flat-square&logo=googlechrome&logoColor=white)](${toolPageUrl})`,
    "```",
    "",
    "---",
    "",
    "### 📢 Amplify & Get Discovered",
    `- 🐦 **[Click here to share the news on X / Twitter](${tweetUrl})** to get amplified by @RitualDevLab`,
    "- ⭐ Give **[RitualDev-Lab/DevShelf](https://github.com/RitualDev-Lab/DevShelf)** a star on GitHub to help more developers discover great open-source tools!",
    "",
    "Welcome to the community! 🤝",
  ].join("\n");

  // Post comment on the merged PR
  try {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: commentBody,
    });
    console.log(`Successfully posted celebration comment to PR #${prNumber}`);
  } catch (err) {
    console.error("Failed to post celebration comment on PR:", err.message);
  }

  // Also post on the resolved issue if one is linked (e.g. Resolves #54)
  const resolvedIssueMatch = prBody.match(/Resolves #(\d+)/i);
  if (resolvedIssueMatch?.[1]) {
    const issueNum = Number.parseInt(resolvedIssueMatch[1], 10);
    try {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNum,
        body: commentBody,
      });
      console.log(`Successfully posted celebration comment to linked Issue #${issueNum}`);
    } catch (err) {
      console.warn(`Could not post celebration comment to issue #${issueNum}:`, err.message);
    }
  }
};
