import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { activateSponsor } from "../scripts/activate-sponsor.js";

describe("DevShelf Self-Serve Sponsor Activation Engine (Phase 3)", () => {
  test("throws an error when name or url is missing", async () => {
    await assert.rejects(async () => {
      await activateSponsor({ name: "", url: "https://example.com" });
    }, /Missing required option: --name/);

    await assert.rejects(async () => {
      await activateSponsor({ name: "TestTool", url: "" });
    }, /Missing required option: --url/);
  });

  test("dry-run activation of existing tool marks featured and updates tier", async () => {
    const result = await activateSponsor({
      name: "AgentShield",
      url: "https://github.com/RitualDev-Lab/AgentShield",
      category: "ai",
      tier: "enterprise",
      patronName: "RitualDev Core Team",
      github: "RitualDev-Lab",
      dryRun: true,
      skipBuild: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.dryRun, true);
    assert.equal(result.isNewTool, false, "AgentShield must be recognized as existing tool");
    assert.equal(result.shelfFile, "ai-tools.json");
    assert.equal(result.item.featured, true);
    assert.match(String(result.item.sponsorTier), /Enterprise Partner/);
    assert.equal(result.patron.tier, "enterprise");
    assert.equal(result.patron.amountUSD, 299);
  });

  test("dry-run activation of new tool stages schema-compliant entry and patron", async () => {
    const result = await activateSponsor({
      name: "FastTerminalKit",
      url: "https://github.com/test-org/FastTerminalKit",
      category: "cli",
      tier: "mcpPro",
      pitch: "Blazing fast terminal utility with instant AI editor context injection.",
      alt: "Hyper, iTerm",
      patronName: "Terminal Labs",
      github: "test-org",
      amount: 149,
      dryRun: true,
      skipBuild: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.dryRun, true);
    assert.equal(result.isNewTool, true, "Must be tagged as new tool");
    assert.equal(result.shelfFile, "cli-tools.json");
    assert.equal(result.item.name, "FastTerminalKit");
    assert.equal(result.item.featured, true);
    assert.equal(result.item.sponsorTier, "Verified Sponsor ★ (MCP Pro)");
    assert.equal(result.item.verifiedZeroPaywall, true);
    assert.ok(Array.isArray(result.item.statusTags));
    assert.ok(result.item.statusTags.includes("Verified Sponsor ★"));
    assert.ok(result.item.statusTags.includes("Zero-Paywall"));

    // Patron verification
    assert.equal(result.patron.name, "Terminal Labs");
    assert.equal(result.patron.github, "test-org");
    assert.equal(result.patron.tier, "gold");
    assert.equal(result.patron.amountUSD, 149);
    assert.ok(String(result.patron.badgeUrl).includes("gold.svg"));
  });

  test("tier configuration defaults to starter ($49), mcpPro ($149), enterprise ($299)", async () => {
    const starterRes = await activateSponsor({
      name: "StarterTool",
      url: "https://example.com/starter",
      tier: "starter",
      dryRun: true,
      skipBuild: true,
    });
    assert.equal(starterRes.patron.amountUSD, 49);
    assert.equal(starterRes.patron.tier, "silver");

    const mcpProRes = await activateSponsor({
      name: "ProTool",
      url: "https://example.com/pro",
      tier: "mcpPro",
      dryRun: true,
      skipBuild: true,
    });
    assert.equal(mcpProRes.patron.amountUSD, 149);
    assert.equal(mcpProRes.patron.tier, "gold");

    const entRes = await activateSponsor({
      name: "EntTool",
      url: "https://example.com/enterprise",
      tier: "enterprise",
      dryRun: true,
      skipBuild: true,
    });
    assert.equal(entRes.patron.amountUSD, 299);
    assert.equal(entRes.patron.tier, "enterprise");
  });
});
