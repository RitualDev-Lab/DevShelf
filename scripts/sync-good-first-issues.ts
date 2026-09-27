import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export interface MatchmakerIssue {
  title: string;
  url: string;
  labels: string[];
  comments?: number;
  difficulty?: string;
  createdAt?: string;
}

export interface MatchmakerProject {
  name: string;
  repo: string;
  category: string;
  language: string;
  techStack?: string[];
  seeking: string;
  description: string;
  stars?: number;
  forks?: number;
  pushedAt?: string;
  lastActivityRelative?: string;
  openGoodFirstIssuesCount: number;
  issues: MatchmakerIssue[];
}

export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return "recently";
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "recently";
  const diffMs = Math.max(0, now - then);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay === 0) {
    if (diffHour === 0) {
      if (diffMin <= 1) return "just now";
      return `${diffMin}m ago`;
    }
    return `${diffHour}h ago`;
  }
  if (diffDay === 1) return "yesterday";
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth === 1) return "1mo ago";
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

export async function syncGoodFirstIssues() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const siteDir = path.join(root, "site");

  // Try to get GitHub token from env or git credential helper
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
    `🤝 [Matchmaker] Syncing live GitHub stats & Good First Issues for ${contributors.length} open-source projects...`,
  );

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DevShelf-Matchmaker/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

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
      openGoodFirstIssuesCount: 0,
      issues: [],
    };

    if (repoSlug) {
      try {
        // 1. Fetch Repository Details (stars, forks, pushed_at, topics)
        const repoUrl = `https://api.github.com/repos/${repoSlug}`;
        const repoRes = await fetch(repoUrl, {
          headers,
          signal: AbortSignal.timeout(6000),
        });

        if (repoRes.ok) {
          const repoJson = (await repoRes.json()) as any;
          projectData.stars = repoJson.stargazers_count ?? 0;
          projectData.forks = repoJson.forks_count ?? 0;
          projectData.pushedAt = repoJson.pushed_at;
          projectData.lastActivityRelative = formatRelativeTime(repoJson.pushed_at);
          if (Array.isArray(repoJson.topics) && repoJson.topics.length > 0) {
            projectData.techStack = repoJson.topics.slice(0, 5);
          }
        }

        // 2. Fetch Open "Good First Issues"
        const apiUrl = `https://api.github.com/repos/${repoSlug}/issues?labels=good%20first%20issue&state=open&per_page=5`;
        const res = await fetch(apiUrl, {
          headers,
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const rawIssues = (await res.json()) as any[];
          projectData.issues = rawIssues.map((iss) => ({
            title: iss.title,
            url: iss.html_url,
            labels: (iss.labels || []).map((l: any) => l.name),
            comments: iss.comments || 0,
            difficulty: "Beginner Friendly",
            createdAt: iss.created_at,
          }));
          projectData.openGoodFirstIssuesCount = rawIssues.length;
        }
      } catch (_err) {
        // Fallback to project issues link if API hits rate limit or times out
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
      projectData.openGoodFirstIssuesCount = 1;
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
    `✅ [Matchmaker] Wrote site/matchmaker.json with ${matchmakerProjects.length} projects and ${outputPayload.totalOpenIssues} issues!`,
  );
}

// Run CLI directly if executed
if (process.argv[1]?.endsWith("sync-good-first-issues.ts")) {
  syncGoodFirstIssues().catch((err) => {
    console.error("Matchmaker sync failed:", err);
    process.exit(1);
  });
}
