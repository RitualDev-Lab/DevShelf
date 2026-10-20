/**
 * DevShelf IndexNow Submission Engine
 * Submits all sitemap URLs directly to IndexNow (Bing, Yandex, Seznam, Naver)
 * for instant discovery, real-time crawling, and immediate search indexation.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const SITEMAP_PATH = path.join(ROOT, "site", "sitemap.xml");

const HOST = "devshelf.ritualdev.in";
const KEY = "devshelf6b9f4a1c8d2e3f5a7b0c4e6d";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"];

async function submitIndexNow() {
  console.log("⚡ [DevShelf IndexNow Engine] Extracting URLs from sitemap.xml...");

  let xml: string;
  try {
    xml = await fs.readFile(SITEMAP_PATH, "utf8");
  } catch (err: any) {
    console.error(`❌ Could not read sitemap at ${SITEMAP_PATH}:`, err.message);
    process.exit(1);
  }

  const urlMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
  const urls: string[] = [];
  for (const match of urlMatches) {
    if (match[1]) {
      urls.push(match[1].trim());
    }
  }

  if (urls.length === 0) {
    console.error("❌ No URLs found in sitemap.xml to submit.");
    process.exit(1);
  }

  console.log(`📋 Found ${urls.length} URLs ready for instant indexation.`);

  // IndexNow allows batches up to 10,000 URLs per request
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`🚀 Pinging ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 200 || res.status === 202) {
        console.log(
          `✅ ${endpoint} successfully accepted ${urls.length} URLs (Status: ${res.status})!`,
        );
      } else {
        const text = await res.text().catch(() => "");
        console.warn(`⚠️ ${endpoint} returned status ${res.status}: ${text}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Warning: Failed to submit to ${endpoint}:`, err.message);
    }
  }

  console.log("\n🎉 IndexNow submission sequence complete!");
}

submitIndexNow().catch((err) => {
  console.error("❌ IndexNow execution failed:", err);
  process.exit(1);
});
