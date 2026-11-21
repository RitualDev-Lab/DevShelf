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
  staleWarning?: boolean;
  daysInactive?: number;
  staleReason?: string;
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

export function evaluateStaleStatus(pushedAt?: string): {
  isStale: boolean;
  daysInactive: number;
  reason?: string;
} {
  if (!pushedAt) return { isStale: false, daysInactive: 0 };
  const diffMs = Date.now() - new Date(pushedAt).getTime();
  if (Number.isNaN(diffMs)) return { isStale: false, daysInactive: 0 };
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days > 180) {
    return {
      isStale: true,
      daysInactive: days,
      reason: `Repository inactive for ${days} days (>6 months)`,
    };
  }
  return { isStale: false, daysInactive: days };
}

export async function syncGoodFirstIssues() {
  const root = process.cwd();
  const shelfDir = path.join(root, "shelf");
  const siteDir = path.join(root, "site");
  const apiDir = path.join(siteDir, "api", "v1");

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
      const [owner, name] = repoSlug.split("/");
      let fetchedViaGraphQL = false;

      // 1. Try GitHub GraphQL API if token is available
      if (token && owner && name) {
        try {
          const gqlQuery = `
            query($owner: String!, $name: String!) {
              repository(owner: $owner, name: $name) {
                stargazerCount
                forkCount
                pushedAt
                issues(states: OPEN, labels: ["good first issue"], first: 5, orderBy: {field: CREATED_AT, direction: DESC}) {
                  totalCount
                  nodes {
                    title
                    url
                    createdAt
                    comments { totalCount }
                    labels(first: 5) { nodes { name } }
                  }
                }
              }
            }
          `;

          const gqlRes = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers,
            body: JSON.stringify({ query: gqlQuery, variables: { owner, name } }),
            signal: AbortSignal.timeout(6000),
          });

          if (gqlRes.ok) {
            const gqlData = (await gqlRes.json()) as any;
            const r = gqlData.data?.repository;
            if (r) {
              projectData.stars = r.stargazerCount;
              projectData.forks = r.forkCount;
              projectData.pushedAt = r.pushedAt;
              projectData.lastActivityRelative = formatRelativeTime(r.pushedAt);
              const staleEval = evaluateStaleStatus(r.pushedAt);
              projectData.staleWarning = staleEval.isStale;
              projectData.daysInactive = staleEval.daysInactive;
              if (staleEval.reason) projectData.staleReason = staleEval.reason;

              projectData.openGoodFirstIssuesCount = r.issues?.totalCount || 0;
              if (Array.isArray(r.issues?.nodes)) {
                projectData.issues = r.issues.nodes.map((n: any) => ({
                  title: n.title,
                  url: n.url,
                  createdAt: n.createdAt,
                  comments: n.comments?.totalCount || 0,
                  labels: (n.labels?.nodes || []).map((l: any) => l.name),
                  difficulty: "Beginner Friendly",
                }));
              }
              fetchedViaGraphQL = true;
            }
          }
        } catch {
          // GraphQL failed, fallback to REST
        }
      }

      // 2. Fallback to REST API if GraphQL not used or failed
      if (!fetchedViaGraphQL) {
        try {
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
            const staleEval = evaluateStaleStatus(repoJson.pushed_at);
            projectData.staleWarning = staleEval.isStale;
            projectData.daysInactive = staleEval.daysInactive;
            if (staleEval.reason) projectData.staleReason = staleEval.reason;

            if (Array.isArray(repoJson.topics) && repoJson.topics.length > 0) {
              projectData.techStack = repoJson.topics.slice(0, 5);
            }
          }

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
    activeProjects: matchmakerProjects.filter((p) => !p.staleWarning).length,
    staleProjects: matchmakerProjects.filter((p) => p.staleWarning).length,
    projects: matchmakerProjects,
  };

  await fs.writeFile(
    path.join(siteDir, "matchmaker.json"),
    `${JSON.stringify(outputPayload, null, 2)}\n`,
    "utf8",
  );

  await fs.mkdir(apiDir, { recursive: true });
  await fs.writeFile(
    path.join(apiDir, "matchmaker.json"),
    `${JSON.stringify(outputPayload, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `✅ [Matchmaker] Wrote site/matchmaker.json & API with ${matchmakerProjects.length} projects (${outputPayload.activeProjects} active, ${outputPayload.staleProjects} stale warnings)!`,
  );
}

// Run CLI directly if executed
if (process.argv[1]?.endsWith("sync-good-first-issues.ts")) {
  syncGoodFirstIssues().catch((err) => {
    console.error("Matchmaker sync failed:", err);
    process.exit(1);
  });
}
