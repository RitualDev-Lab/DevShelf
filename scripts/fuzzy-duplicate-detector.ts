/**
 * DevShelf Fuzzy Duplicate & Canonical URL Detection Engine
 *
 * Normalizes code repository and project URLs, strips tracking noise,
 * and computes Levenshtein distance & token overlap to prevent duplicate
 * or confusingly similar submissions.
 */

export interface CatalogCandidate {
  name: string;
  url?: string;
  repo?: string;
  category?: string;
  [key: string]: unknown;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchType?: "exact_url" | "exact_name" | "fuzzy_name" | "canonical_repo";
  matchItem?: CatalogCandidate;
  similarity?: number;
  reason?: string;
}

const COMMON_CODE_HOSTS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "sourcehut.org",
]);

/**
 * Normalizes any project or repository URL to its canonical form:
 * - Converts SSH git syntax (git@github.com:org/repo.git) to HTTPS
 * - Strips trailing slashes, .git extensions, and www prefixes
 * - Normalizes protocol to https
 * - Lowercases host and repository paths
 * - Strips URL search query parameters and hash anchors
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let clean = rawUrl.trim();

  // Convert SSH syntax: git@github.com:owner/repo.git -> https://github.com/owner/repo
  const sshMatch = clean.match(/^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/i);
  if (sshMatch) {
    clean = `https://${sshMatch[1]}/${sshMatch[2]}/${sshMatch[3]}`;
  }

  try {
    const parsed = new URL(clean);
    let host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let pathname = parsed.pathname.replace(/\/+$/, "").replace(/\.git$/i, "");

    if (COMMON_CODE_HOSTS.has(host)) {
      pathname = pathname.toLowerCase();
    }

    return `https://${host}${pathname}`;
  } catch {
    // If not a standard URL, clean up manual string
    return clean
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .replace(/\.git$/i, "")
      .toLowerCase();
  }
}

/**
 * Computes standard Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes a normalized similarity score [0.0 - 1.0] between two strings
 */
export function fuzzyStringSimilarity(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLen) * 100) / 100;
}

/**
 * Tokenizes a tool name into semantic words (stripping delimiters and generic suffixes)
 */
function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter(
      (t) => t.length > 0 && !["tool", "cli", "mcp", "server", "app", "framework"].includes(t),
    );
}

/**
 * Checks if a candidate tool is a duplicate of any existing item in the catalog
 */
export function findDuplicatesInCatalog(
  candidate: CatalogCandidate,
  catalog: CatalogCandidate[],
): DuplicateDetectionResult {
  const candName = candidate.name.trim().toLowerCase();
  const candUrlNorm = normalizeCanonicalUrl(candidate.url || candidate.repo || "");
  const candRepoNorm = normalizeCanonicalUrl(candidate.repo || candidate.url || "");
  const candTokens = tokenizeName(candidate.name);

  for (const item of catalog) {
    const itemName = item.name.trim().toLowerCase();
    const itemUrlNorm = normalizeCanonicalUrl(item.url || item.repo || "");
    const itemRepoNorm = normalizeCanonicalUrl(item.repo || item.url || "");

    // 1. Exact Canonical URL match
    if (candUrlNorm && (candUrlNorm === itemUrlNorm || candUrlNorm === itemRepoNorm)) {
      return {
        isDuplicate: true,
        matchType: "exact_url",
        matchItem: item,
        similarity: 1.0,
        reason: `Canonical URL '${candUrlNorm}' matches existing tool '${item.name}'`,
      };
    }

    if (candRepoNorm && (candRepoNorm === itemRepoNorm || candRepoNorm === itemUrlNorm)) {
      return {
        isDuplicate: true,
        matchType: "canonical_repo",
        matchItem: item,
        similarity: 1.0,
        reason: `Canonical Repository '${candRepoNorm}' matches existing tool '${item.name}'`,
      };
    }

    // 2. Exact Name Match (case-insensitive)
    if (candName === itemName) {
      return {
        isDuplicate: true,
        matchType: "exact_name",
        matchItem: item,
        similarity: 1.0,
        reason: `Exact name '${candidate.name}' is already listed in the directory`,
      };
    }

    // 3. Fuzzy Name Match via Levenshtein
    const nameSim = fuzzyStringSimilarity(candName, itemName);
    const dist = levenshteinDistance(candName, itemName);

    if (nameSim >= 0.88 || (candName.length >= 4 && dist <= 1)) {
      return {
        isDuplicate: true,
        matchType: "fuzzy_name",
        matchItem: item,
        similarity: nameSim,
        reason: `Tool name '${candidate.name}' is strikingly similar to existing tool '${item.name}' (${Math.round(nameSim * 100)}% match, edit distance ${dist})`,
      };
    }

    // 4. Token Overlap for compound names (e.g. "Postgres MCP" vs "PostgreSQL MCP Server")
    if (candTokens.length >= 2) {
      const itemTokens = tokenizeName(item.name);
      const intersection = candTokens.filter((t) => itemTokens.includes(t));
      if (
        intersection.length >= 2 &&
        intersection.length === candTokens.length &&
        intersection.length === itemTokens.length
      ) {
        return {
          isDuplicate: true,
          matchType: "fuzzy_name",
          matchItem: item,
          similarity: 0.92,
          reason: `Tool '${candidate.name}' has identical token signature to existing tool '${item.name}'`,
        };
      }
    }
  }

  return { isDuplicate: false };
}
