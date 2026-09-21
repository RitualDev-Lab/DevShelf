import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SHELF_DIR = path.join(ROOT_DIR, "shelf");

// Common analytics, affiliate, and social tracking query parameters
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "ref_src",
  "source",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "si",
  "feature",
  "trk",
  "aff",
  "affiliate",
]);

/**
 * Sanitizes and normalizes a candidate URL:
 * - Validates HTTP/HTTPS protocol
 * - Strips all tracking and affiliate query parameters
 * - Strips redundant or tracking hash fragments
 * - Removes trailing slashes on non-root paths
 */
export function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { sanitized: "", isDirty: false, issues: ["Missing or non-string URL"] };
  }

  const trimmed = rawUrl.trim();
  const issues = [];

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_err) {
    return { sanitized: trimmed, isDirty: true, issues: ["Malformed URL syntax"] };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      sanitized: trimmed,
      isDirty: true,
      issues: [`Unsupported protocol: '${parsed.protocol}' (must be http: or https:)`],
    };
  }

  let isDirty = false;

  // 1. Detect and strip tracking parameters
  const paramsToRemove = [];
  for (const [key] of parsed.searchParams.entries()) {
    if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
      paramsToRemove.push(key);
      isDirty = true;
    }
  }

  if (paramsToRemove.length > 0) {
    issues.push(`Contains tracking parameter(s): ${paramsToRemove.join(", ")}`);
    for (const p of paramsToRemove) {
      parsed.searchParams.delete(p);
    }
  }

  // 2. Remove trailing slashes on non-empty paths (e.g. /docs/ -> /docs)
  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
    isDirty = true;
    issues.push("Contains trailing slash");
  }

  // 3. Strip redundant or tracking hash fragments
  if (parsed.hash && (parsed.hash === "#" || parsed.hash.includes("utm_"))) {
    parsed.hash = "";
    isDirty = true;
    issues.push("Contains redundant hash fragment");
  }

  const search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : "";
  const sanitized = `${parsed.protocol}//${parsed.host}${pathname}${search}${parsed.hash}`;

  return { sanitized, isDirty, issues };
}

/**
 * Normalizes URL for strict duplicate comparison
 */
export function getUrlFingerprint(rawUrl) {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    return rawUrl.toLowerCase().trim();
  }
}

async function validateAndSanitizeRegistry() {
  const isFixMode = process.argv.includes("--fix");
  console.log("🔗 [DevShelf URL Sanitizer & Duplicate Detector]");
  console.log(isFixMode ? "Mode: Auto-Fix (--fix active)\n" : "Mode: Lint & Enforce\n");

  const files = (await fs.readdir(SHELF_DIR)).filter((f) => f.endsWith(".json"));
  const urlRegistry = new Map();
  const nameRegistry = new Map();

  const dirtyUrls = [];
  const duplicates = [];
  const modifiedFiles = new Set();

  // Shelves that intentionally reference projects from primary shelves
  const REFERENCE_SHELVES = new Set(["contributors-wanted.json", "boilerplates.json"]);

  for (const file of files) {
    const filePath = path.join(SHELF_DIR, file);
    const content = await fs.readFile(filePath, "utf8");
    const items = JSON.parse(content.replace(/^\uFEFF/, ""));
    let fileHasEdits = false;
    const seenInThisFile = new Set();

    for (const item of items) {
      const targetUrl = item.deployUrl || item.url || item.repo;
      const itemName = item.name?.trim() || "(unnamed)";
      const lowerName = itemName.toLowerCase();

      // Check name uniqueness within the same file
      if (seenInThisFile.has(lowerName)) {
        duplicates.push({
          type: "Duplicate In-File Name Collision",
          name: itemName,
          firstFile: file,
          secondFile: file,
          value: itemName,
        });
      }
      seenInThisFile.add(lowerName);

      // Check name uniqueness across primary shelves
      if (!REFERENCE_SHELVES.has(file)) {
        if (nameRegistry.has(lowerName)) {
          const prior = nameRegistry.get(lowerName);
          duplicates.push({
            type: "Duplicate Cross-Shelf Name Collision",
            name: itemName,
            firstFile: prior.file,
            secondFile: file,
            value: itemName,
          });
        } else {
          nameRegistry.set(lowerName, { file, item });
        }
      }

      if (!targetUrl) continue;

      // Sanitize URL
      const { sanitized, isDirty, issues } = sanitizeUrl(targetUrl);
      if (isDirty) {
        dirtyUrls.push({
          file,
          name: itemName,
          original: targetUrl,
          sanitized,
          issues,
        });

        if (isFixMode) {
          if (item.deployUrl && item.deployUrl === targetUrl) item.deployUrl = sanitized;
          if (item.url && item.url === targetUrl) item.url = sanitized;
          if (item.repo && item.repo === targetUrl) item.repo = sanitized;
          fileHasEdits = true;
        }
      }

      // Check URL Fingerprint Duplicates
      const fingerprint = getUrlFingerprint(targetUrl);
      if (!REFERENCE_SHELVES.has(file)) {
        if (urlRegistry.has(fingerprint)) {
          const prior = urlRegistry.get(fingerprint);
          duplicates.push({
            type: "Duplicate URL Collision",
            name: itemName,
            firstFile: prior.file,
            firstItem: prior.item.name,
            secondFile: file,
            secondItem: itemName,
            value: targetUrl,
          });
        } else {
          urlRegistry.set(fingerprint, { file, item });
        }
      }
    }

    if (fileHasEdits && isFixMode) {
      await fs.writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
      modifiedFiles.add(file);
      console.log(`✓ Sanitized URLs in shelf/${file}`);
    }
  }

  // Summary Report
  console.log("========================================");
  console.log("📊 URL Validation & Duplicate Audit Summary:");
  console.log(`   Files Scanned:        ${files.length}`);
  console.log(`   Primary URLs Audited: ${urlRegistry.size}`);
  console.log(`   Dirty URLs Found:     ${dirtyUrls.length}`);
  console.log(`   Duplicate Collisions: ${duplicates.length}`);
  console.log("========================================\n");

  if (dirtyUrls.length > 0) {
    console.log("⚠️ Dirty URLs Detected (Tracking parameters or trailing slashes):");
    for (const d of dirtyUrls) {
      console.log(` - [${d.file}] ${d.name}`);
      console.log(`   Original:  ${d.original}`);
      console.log(`   Sanitized: ${d.sanitized}`);
      console.log(`   Issues:    ${d.issues.join("; ")}\n`);
    }
  }

  if (duplicates.length > 0) {
    console.log("❌ Duplicate Entries Detected:");
    for (const dup of duplicates) {
      if (dup.type === "Duplicate URL Collision") {
        console.log(` - [URL Collision] '${dup.value}'`);
        console.log(`   1. [${dup.firstFile}] ${dup.firstItem}`);
        console.log(`   2. [${dup.secondFile}] ${dup.secondItem}\n`);
      } else {
        console.log(
          ` - [Name Collision] '${dup.name}' exists in both ${dup.firstFile} and ${dup.secondFile}\n`,
        );
      }
    }
  }

  if (isFixMode && modifiedFiles.size > 0) {
    console.log(`🎉 Auto-fixed dirty URLs across ${modifiedFiles.size} shelf file(s).`);
    process.exit(0);
  }

  if (dirtyUrls.length > 0 || duplicates.length > 0) {
    console.error(
      `❌ Validation failed with ${dirtyUrls.length} dirty URL(s) and ${duplicates.length} duplicate(s). Run 'node scripts/validate-links.js --fix' to auto-clean dirty URLs.`,
    );
    process.exit(1);
  } else {
    console.log("🎉 All registry URLs are completely sanitized and unique!");
    process.exit(0);
  }
}

validateAndSanitizeRegistry().catch((err) => {
  console.error("Link validation crashed:", err);
  process.exit(1);
});
