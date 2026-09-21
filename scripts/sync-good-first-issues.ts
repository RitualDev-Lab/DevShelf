import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

interface MatchmakerProject {
  name: string;
  repo: string;
  category: string;
  language: string;
  seeking: string;
  description: string;
  issues: Array<{
    title: string;
    url: string;
    labels: string[];
    comments?: number;
    difficulty?: string;
  }>;
}

async function syncGoodFirstIssues() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const siteDir = path.join(root, "site");

  // Try to get GitHub token from git credential helper if available
  let token = process.env.GITHUB_TOKEN || "";
  if (!token) {
    try {
      const output = execSync("git credential fill", {
        input: "protocol=https\nhost=github.com\n",
        stdio: ["pipe", "pipe", "ignore"],
      }).toString();
      const match = output.match(/password=(.+)/);
      if (match) token = match[1].trim();
    } catch {
      // Unauthenticated fallback
    }
  }

  const rawContributors = await fs.readFile(
    path.join(shelfDir, "contributors-wanted.json"),
    "utf8",
  );
  const contributors = JSON.parse(rawContributors.replace(/^\uFEFF/, ""));

  console.log(
    `🤝 [Matchmaker] Syncing live Good First Issues for ${contributors.length} open source projects...`,
  );

  const matchmakerProjects: MatchmakerProject[] = [];

  for (const proj of contributors) {
    const repoMatch = proj.repo.match(/github\.com\/([^/]+)\/([^/]+)/);
    const repoSlug = repoMatch ? `${repoMatch[1]}/${repoMatch[2].replace(/\.git$/, "")}` : "";

    const projectData: MatchmakerProject = {
      name: proj.name,
      repo: proj.repo,
      category: proj.category,
      language: proj.language,
      seeking: proj.seeking,
      description: proj.description,
      issues: [],
    };

    if (repoSlug) {
      try {
        const headers: Record<string, string> = {
          Accept: "application/vnd.github+json",
          "User-Agent": "DevShelf-Matchmaker/1.0",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const apiUrl = `https://api.github.com/repos/${repoSlug}/issues?labels=good%20first%20issue&state=open&per_page=3`;
        const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(6000) });

        if (res.ok) {
          const rawIssues = (await res.json()) as any[];
          projectData.issues = rawIssues.map((iss) => ({
            title: iss.title,
            url: iss.html_url,
            labels: (iss.labels || []).map((l: any) => l.name),
            comments: iss.comments || 0,
            difficulty: "Beginner Friendly",
          }));
        }
      } catch (err) {
        // Fallback to project issues link if API hits rate limit
      }
    }

    // Default fallback issue link if none fetched
    if (projectData.issues.length === 0) {
      projectData.issues.push({
        title: `Explore open issues & help wanted in ${proj.name}`,
        url: proj.goodFirstIssues || `${proj.repo}/issues`,
        labels: ["good first issue", "help wanted"],
        difficulty: "Starter Task",
      });
    }

    matchmakerProjects.push(projectData);
  }

  const outputPayload = {
    updatedAt: new Date().toISOString(),
    totalProjects: matchmakerProjects.length,
    totalOpenIssues: matchmakerProjects.reduce((acc, p) => acc + p.issues.length, 0),
    projects: matchmakerProjects,
  };

  await fs.writeFile(
    path.join(siteDir, "matchmaker.json"),
    `${JSON.stringify(outputPayload, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `✅ [Matchmaker] Wrote site/matchmaker.json with ${matchmakerProjects.length} projects!`,
  );
}

syncGoodFirstIssues().catch((err) => {
  console.error("Matchmaker sync failed:", err);
  process.exit(1);
});
