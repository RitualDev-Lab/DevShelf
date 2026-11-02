import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assembleCatalogFromShelf } from "./catalog-assembler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedCatalog = null;

export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getMilestone(totalCount) {
  const count = Number(totalCount);
  if (!Number.isFinite(count) || count <= 0) {
    return "0+";
  }
  return `${Math.floor(count / 10) * 10}+`;
}

/**
 * Resolve cross-platform cache directory for DevShelf
 * @returns {string}
 */
export function getCacheDir() {
  if (process.env.DEVSHELF_CACHE_DIR) {
    return process.env.DEVSHELF_CACHE_DIR;
  }
  if (process.env.XDG_CACHE_HOME) {
    return path.join(process.env.XDG_CACHE_HOME, "devshelf");
  }
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "devshelf");
  }
  return path.join(os.homedir(), ".cache", "devshelf");
}

/**
 * Resolve full path to cached catalog JSON file
 * @returns {string}
 */
export function getCacheFilePath() {
  return path.join(getCacheDir(), "catalog.json");
}

/**
 * Read catalog from persistent local disk cache
 * @returns {any | null}
 */
export function readPersistentCache() {
  const cacheFile = getCacheFilePath();
  if (!fs.existsSync(cacheFile)) return null;
  try {
    const raw = fs.readFileSync(cacheFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.resources)) {
      return parsed;
    }
  } catch {
    // Ignore corrupt cache file
  }
  return null;
}

/**
 * Write catalog data to persistent local disk cache
 * @param {any} catalogData
 * @returns {boolean}
 */
export function writePersistentCache(catalogData) {
  try {
    const cacheDir = getCacheDir();
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cacheFile = getCacheFilePath();
    fs.writeFileSync(cacheFile, JSON.stringify(catalogData, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidate in-memory and persistent local disk cache
 * @returns {boolean}
 */
export function clearPersistentCache() {
  cachedCatalog = null;
  try {
    const cacheFile = getCacheFilePath();
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch catalog from remote production CDN endpoint
 * @param {number} [timeoutMs=4000]
 * @param {typeof fetch} [fetchFn=fetch]
 * @returns {Promise<any>}
 */
export async function fetchLiveCatalog(timeoutMs = 4000, fetchFn = fetch) {
  const candidateUrls = [
    "https://ritualdev.in/data.json",
    "https://raw.githubusercontent.com/RitualDev-Lab/DevShelf/main/site/data.json",
    "https://devshelf.ritualdev.in/data.json",
  ];

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const res = await fetchFn(url, {
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        lastError = new Error(
          `Failed to fetch live catalog: HTTP ${res.status} ${res.statusText || ""}`.trim(),
        );
        continue;
      }

      const data = await res.json();
      if (!data || typeof data !== "object" || !Array.isArray(data.resources)) {
        lastError = new Error(`Invalid catalog payload format received from ${url}`);
        continue;
      }

      const now = new Date().toISOString();
      data.catalogSource = "live";
      data.catalogTimestamp = data.updatedAt || now;
      data.fetchedAt = now;
      data.cacheAgeHours = 0;
      data.milestone = getMilestone(data.totalCount || data.resources.length);
      return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to fetch live catalog: All candidate endpoints unreachable");
}

/**
 * Explicitly refresh local persistent cache from live CDN
 * @param {{ timeoutMs?: number, fetchFn?: typeof fetch }} [options]
 * @returns {Promise<any>}
 */
export async function refreshCatalog(options = {}) {
  const data = await fetchLiveCatalog(options.timeoutMs || 8000, options.fetchFn || fetch);
  writePersistentCache(data);
  cachedCatalog = data;
  return data;
}

/**
 * Load DevShelf catalog data via multi-tier caching & fallback hierarchy:
 * 1. In-memory cache
 * 2. Persistent on-disk cache (if fresh, TTL 24h)
 * 3. Live remote CDN fetch (auto-cached to disk)
 * 4. Stale on-disk cache (stale-while-revalidate / offline recovery)
 * 5. Bundled site/data.json (distributed package offline fallback)
 * 6. Local source directory shelf/*.json
 *
 * @param {{
 *   forceReload?: boolean,
 *   refresh?: boolean,
 *   forceRemote?: boolean,
 *   maxAgeMs?: number,
 *   offline?: boolean,
 *   fetchFn?: typeof fetch
 * }} [options]
 * @returns {Promise<{
 *   totalCount: number,
 *   milestone: string,
 *   resources: Array<any>,
 *   catalogSource: "live" | "cached" | "bundled" | "source",
 *   catalogTimestamp: string,
 *   cacheAgeHours?: number,
 *   isStale?: boolean,
 *   reposCount?: number,
 *   counts?: Record<string, number>
 * }>}
 */
export async function loadCatalog(options = {}) {
  if (cachedCatalog && !options.forceReload && !options.refresh && !options.forceRemote) {
    return cachedCatalog;
  }

  // Explicit refresh requested
  if (options.refresh || options.forceRemote) {
    return refreshCatalog(options);
  }

  // Explicit local preference (e.g. companion offline mode or local tooling)
  if (options.preferLocal) {
    const localDataPath = path.join(__dirname, "..", "..", "site", "data.json");
    if (fs.existsSync(localDataPath)) {
      try {
        const raw = fs.readFileSync(localDataPath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.resources)) {
          parsed.catalogSource = "bundled";
          parsed.catalogTimestamp = parsed.updatedAt || new Date().toISOString();
          parsed.milestone = getMilestone(parsed.totalCount || parsed.resources.length);
          cachedCatalog = parsed;
          return cachedCatalog;
        }
      } catch {
        // Fall through
      }
    }
  }

  const ttl = typeof options.maxAgeMs === "number" ? options.maxAgeMs : DEFAULT_CACHE_TTL_MS;
  const now = Date.now();

  // Tier 1: Fresh Persistent Local Disk Cache
  const persistent = readPersistentCache();
  if (persistent) {
    const fetchedTime = persistent.fetchedAt ? new Date(persistent.fetchedAt).getTime() : 0;
    const isFresh = fetchedTime > 0 && now - fetchedTime < ttl;

    if (isFresh && !options.forceReload) {
      persistent.catalogSource = "cached";
      persistent.cacheAgeHours = Math.round(((now - fetchedTime) / (1000 * 60 * 60)) * 10) / 10;
      persistent.milestone = getMilestone(persistent.totalCount || persistent.resources.length);
      cachedCatalog = persistent;
      return cachedCatalog;
    }
  }

  // Tier 2: Live Remote CDN Fetch (if online)
  if (!options.offline) {
    try {
      const liveData = await fetchLiveCatalog(4000, options.fetchFn || fetch);
      writePersistentCache(liveData);
      cachedCatalog = liveData;
      return cachedCatalog;
    } catch {
      // Remote fetch failed — proceed to offline fallbacks
    }
  }

  // Tier 3: Stale Persistent Local Disk Cache
  if (persistent) {
    const fetchedTime = persistent.fetchedAt ? new Date(persistent.fetchedAt).getTime() : 0;
    persistent.catalogSource = "cached";
    persistent.isStale = true;
    persistent.cacheAgeHours =
      fetchedTime > 0 ? Math.round(((now - fetchedTime) / (1000 * 60 * 60)) * 10) / 10 : undefined;
    persistent.milestone = getMilestone(persistent.totalCount || persistent.resources.length);
    cachedCatalog = persistent;
    return cachedCatalog;
  }

  // Tier 4: Bundled site/data.json
  const localDataPath = path.join(__dirname, "..", "..", "site", "data.json");
  if (fs.existsSync(localDataPath)) {
    try {
      const raw = fs.readFileSync(localDataPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.resources)) {
        parsed.catalogSource = "bundled";
        parsed.catalogTimestamp = parsed.updatedAt || new Date().toISOString();
        parsed.milestone = getMilestone(parsed.totalCount || parsed.resources.length);
        cachedCatalog = parsed;
        return cachedCatalog;
      }
    } catch {
      // Fall through to shelf/*.json
    }
  }

  // Tier 5: Source directory shelf/*.json
  const shelfDir = path.join(__dirname, "..", "..", "shelf");
  if (fs.existsSync(shelfDir)) {
    const payload = assembleCatalogFromShelf(shelfDir);
    payload.catalogSource = "source";
    payload.catalogTimestamp = payload.updatedAt;
    payload.milestone = getMilestone(payload.totalCount);
    cachedCatalog = payload;
    return cachedCatalog;
  }

  throw new Error("Could not load DevShelf catalog data locally, remotely, or from shelf/*.json");
}

/**
 * Extract canonical target URL for a resource
 * @param {any} item
 * @returns {string}
 */
export function getResourceUrl(item) {
  if (!item || typeof item !== "object") return "";
  return item.url || item.repo || item.deployUrl || "";
}

/**
 * Parse storage string (e.g. "500mb", "1gb", "0.5GB", "10 GB") to megabytes
 * @param {string} str
 * @returns {number | null}
 */
export function parseStorageSizeToMB(str) {
  if (!str || typeof str !== "string") return null;
  const match = str.trim().match(/^(\d+(?:\.\d+)?)\s*(mb|gb|tb|kb)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "mb").toLowerCase();
  if (unit === "tb") return num * 1024 * 1024;
  if (unit === "gb") return num * 1024;
  if (unit === "kb") return num / 1024;
  return num; // mb
}

/**
 * Extract storage mentions (MB/GB/TB) from text and return maximum MB found
 * @param {string} text
 * @returns {number}
 */
export function extractMaxStorageMB(text) {
  if (!text || typeof text !== "string") return 0;
  const regex = /(\d+(?:\.\d+)?)\s*(gb|mb|tb)\b/gi;
  let maxMB = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    let mb = val;
    if (unit === "gb") mb = val * 1024;
    else if (unit === "tb") mb = val * 1024 * 1024;
    if (mb > maxMB) maxMB = mb;
  }
  return maxMB;
}

/**
 * Check if a query matches a string via fuzzy character subsequence
 * @param {string} text
 * @param {string} query
 * @returns {boolean}
 */
export function isFuzzySubsequence(text, query) {
  if (!text || !query) return false;
  let tIdx = 0;
  let qIdx = 0;
  while (tIdx < text.length && qIdx < query.length) {
    if (text[tIdx] === query[qIdx]) {
      qIdx++;
    }
    tIdx++;
  }
  return qIdx === query.length;
}

/**
 * Filter and rank catalog resources with fuzzy scoring, semantic tag filtering,
 * and free-tier threshold queries.
 *
 * @param {Array<any>} resources
 * @param {string} query
 * @param {object} [options={}]
 * @param {string|string[]} [options.tags]
 * @param {string} [options.freeTierStorage]
 * @param {string} [options.category]
 * @returns {Array<any>}
 */
export function searchCatalog(resources, query, options = {}) {
  if (!Array.isArray(resources)) return [];
  const q = String(query || "")
    .toLowerCase()
    .trim();

  // Parse tag filter
  const requiredTags = (
    Array.isArray(options.tags) ? options.tags : options.tags ? [options.tags] : []
  )
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean);

  // Parse storage filter
  const requiredStorageMB = options.freeTierStorage
    ? parseStorageSizeToMB(options.freeTierStorage)
    : null;

  // Parse category filter
  const requiredCategory = options.category ? String(options.category).toLowerCase().trim() : null;

  const scored = [];

  for (const item of resources) {
    const nameLower = (item.name || "").toLowerCase();
    const descLower = (item.description || "").toLowerCase();
    const catLower = (item.category || "").toLowerCase();
    const typeLower = (item.type || "").toLowerCase();
    const sectionLower = (item.section || "").toLowerCase();
    const altLower = (item.alternativeTo || "").toLowerCase();
    const freeTierLower = (item.freeTier || "").toLowerCase();
    const rateLimitLower = (item.rateLimit || "").toLowerCase();
    const authLower = (item.auth || "").toLowerCase();
    const itemTags = (Array.isArray(item.statusTags) ? item.statusTags : []).map((t) =>
      String(t).toLowerCase(),
    );

    // 1. Tag Filtering
    if (requiredTags.length > 0) {
      const allItemTagStrings = [...itemTags, catLower, typeLower, sectionLower, authLower].join(
        " ",
      );
      const hasAllTags = requiredTags.every((t) => allItemTagStrings.includes(t));
      if (!hasAllTags) continue;
    }

    // 2. Category Filtering
    if (requiredCategory) {
      const catTarget = `${catLower} ${typeLower} ${sectionLower}`;
      if (!catTarget.includes(requiredCategory)) continue;
    }

    // 3. Free-tier storage threshold filter
    if (requiredStorageMB !== null) {
      const textToSearch = `${freeTierLower} ${descLower} ${rateLimitLower}`;
      const itemStorageMB = extractMaxStorageMB(textToSearch);
      if (itemStorageMB < requiredStorageMB) continue;
    }

    // 4. Scoring and relevance
    if (!q) {
      // If no text query, any item passing filters matches
      scored.push({ item, score: 1 });
      continue;
    }

    let score = 0;

    // Exact matches
    if (nameLower === q) score += 120;
    else if (nameLower.startsWith(q)) score += 80;
    else if (nameLower.split(/\s+/).some((w) => w.startsWith(q))) score += 60;
    else if (nameLower.includes(q)) score += 45;

    // Alternative & Category matches
    if (altLower.includes(q)) score += 35;
    if (catLower.includes(q) || typeLower.includes(q)) score += 30;

    // Status Tags & Auth
    if (itemTags.some((t) => t.includes(q))) score += 25;
    if (authLower.includes(q)) score += 20;

    // Description text match
    if (descLower.includes(q)) score += 20;
    if (freeTierLower.includes(q) || rateLimitLower.includes(q)) score += 15;

    // Fuzzy subsequence match in name if not already matched
    if (score === 0 && isFuzzySubsequence(nameLower, q)) {
      score += 10;
    }

    // Partial word tokens overlap
    if (score === 0) {
      const queryTokens = q.split(/\s+/).filter((t) => t.length > 1);
      const combined = `${nameLower} ${descLower} ${catLower} ${altLower}`;
      const matchedTokens = queryTokens.filter((token) => combined.includes(token));
      if (matchedTokens.length > 0) {
        score += 10 * matchedTokens.length;
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort descending by score, then alphabetically
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.item.name || "").localeCompare(b.item.name || "");
  });

  return scored.map((s) => s.item);
}
