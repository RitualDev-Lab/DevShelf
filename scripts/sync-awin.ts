import https from "node:https";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const AFFILIATES_JSON_PATH = path.join(ROOT_DIR, "data", "affiliates.json");

interface AwinProgramme {
  id: number;
  name: string;
  description?: string;
  displayUrl?: string;
  clickThroughUrl?: string;
  logoUrl?: string;
  currencyCode?: string;
  status?: string;
  primaryRegion?: { name: string; countryCode: string };
  primarySector?: string;
}

const DEFAULT_TOKEN = process.env.AWIN_API_TOKEN || "9fe79340-0278-4001-94b4-f6a80823a268";
const DEFAULT_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || "3132128";

async function fetchAwinProgrammes(
  publisherId: string,
  token: string,
  relationship: "joined" | "pending" = "joined",
): Promise<AwinProgramme[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.awin.com",
      path: `/publishers/${publisherId}/programmes?relationship=${relationship}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "DevShelf-Awin-Sync/1.0",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed) ? parsed : []);
          } catch (err) {
            reject(new Error(`Failed to parse Awin JSON response: ${err}`));
          }
        } else {
          reject(new Error(`Awin API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.end();
  });
}

export async function syncAwinAffiliates(): Promise<void> {
  console.log("🌐 [DevShelf Affiliate Engine] Syncing with Awin Publisher Network...");
  console.log(`• Publisher ID: ${DEFAULT_PUBLISHER_ID}`);
  console.log("• Authenticating via OAuth2 token...");

  try {
    const [joined, pending] = await Promise.all([
      fetchAwinProgrammes(DEFAULT_PUBLISHER_ID, DEFAULT_TOKEN, "joined"),
      fetchAwinProgrammes(DEFAULT_PUBLISHER_ID, DEFAULT_TOKEN, "pending"),
    ]);

    console.log("\n=======================================================");
    console.log(`📊 Awin Account Summary for Publisher #${DEFAULT_PUBLISHER_ID}:`);
    console.log(`   Joined Active Programmes:   ${joined.length}`);
    console.log(`   Pending Approval:           ${pending.length}`);
    console.log("=======================================================\n");

    const allProgrammes = [...joined, ...pending];

    for (const prog of allProgrammes) {
      const isPending = pending.some((p) => p.id === prog.id);
      const trackingUrl = `https://www.awin1.com/awclick.php?mid=${prog.id}&id=${DEFAULT_PUBLISHER_ID}`;
      console.log(`• [${isPending ? "PENDING" : "ACTIVE"}] ${prog.name} (Merchant ID: ${prog.id})`);
      console.log(`  Target Site:  ${prog.displayUrl || "N/A"}`);
      console.log(`  Tracking URL: ${trackingUrl}`);
      console.log(`  Region:       ${prog.primaryRegion?.name || "Global"}\n`);
    }

    // Read local affiliates.json to check current mapping
    const rawAffiliates = await fs.readFile(AFFILIATES_JSON_PATH, "utf8");
    const affiliatesData = JSON.parse(rawAffiliates);

    console.log("📋 Current Active DevShelf Partner Vanity Links:");
    for (const p of affiliatesData.partners) {
      console.log(`  /go/${p.slug}.html -> ${p.url} (${p.perkTitle})`);
    }

    console.log("\n🎉 Awin affiliate synchronization check complete!");
  } catch (err) {
    console.error("❌ Awin sync failed:", err);
    process.exit(1);
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith("sync-awin.ts")) {
  syncAwinAffiliates();
}
