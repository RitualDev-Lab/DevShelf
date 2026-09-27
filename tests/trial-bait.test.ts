import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { analyzePageContent, extractTextFromHtml } from "../scripts/audit-trial-bait.ts";

describe("DevShelf Trial Bait & Paywall Trap Analyzer", () => {
  test("extractTextFromHtml correctly strips HTML, script, and style tags", () => {
    const html = `
      <html>
        <head>
          <style>body { color: red; }</style>
          <script>console.log("secret");</script>
        </head>
        <body>
          <h1>Welcome to DevPlatform</h1>
          <p>Get started for free &amp; easily!</p>
        </body>
      </html>
    `;
    const text = extractTextFromHtml(html);
    assert.strictEqual(text, "Welcome to DevPlatform Get started for free & easily!");
  });

  test("does not flag tools with 'No credit card required'", () => {
    const html = `
      <div>
        <h2>Sign Up for Free</h2>
        <p>Start building in seconds. No credit card required. Free forever for individuals.</p>
      </div>
    `;
    const result = analyzePageContent(html);
    assert.strictEqual(result.isSuspicious, false);
    assert.strictEqual(result.confidence, "none");
    assert.strictEqual(result.matches.length, 0);
  });

  test("flags upfront mandatory credit card requirements", () => {
    const html = `
      <div>
        <h2>Start your cloud sandbox</h2>
        <p>A valid credit card required to activate your workspace and start testing.</p>
      </div>
    `;
    const result = analyzePageContent(html);
    assert.strictEqual(result.isSuspicious, true);
    assert.strictEqual(result.confidence, "high");
    assert.ok(result.matches.some((m) => m.rule === "credit_card_upfront"));
  });

  test("flags explicit free tier discontinuation notifications", () => {
    const html = `
      <div class="announcement">
        <h3>Important Pricing Update</h3>
        <p>We are officially sunsetting our free tier. All existing free tier accounts must upgrade by next month.</p>
      </div>
    `;
    const result = analyzePageContent(html);
    assert.strictEqual(result.isSuspicious, true);
    assert.strictEqual(result.confidence, "high");
    assert.ok(result.matches.some((m) => m.rule === "free_tier_sunset"));
  });

  test("flags 14-day trial traps when no permanent free tier exists", () => {
    const html = `
      <section>
        <h2>Enterprise Observability</h2>
        <p>Start your 14-day free trial today. After the trial period ends, choose from our professional tiers.</p>
      </section>
    `;
    const result = analyzePageContent(html);
    assert.strictEqual(result.isSuspicious, true);
    assert.ok(result.matches.some((m) => m.rule === "trial_only_bait"));
  });

  test("does not flag platforms offering both free trial of enterprise and a permanent free plan", () => {
    const html = `
      <section>
        <h2>Developer Pricing</h2>
        <p>Free plan: $0/mo forever. Or test our Pro features with a 14-day free trial.</p>
      </section>
    `;
    const result = analyzePageContent(html);
    assert.strictEqual(result.isSuspicious, false);
    assert.strictEqual(result.confidence, "none");
  });

  test("flags declared paid-only platforms", () => {
    const html = `
      <div>
        <h2>Subscription Options</h2>
        <p>We offer paid plans only with dedicated SLA support. No free tier available.</p>
      </div>
    `;
    const result = analyzePageContent(html);
    assert.strictEqual(result.isSuspicious, true);
    assert.strictEqual(result.confidence, "high");
    assert.ok(result.matches.some((m) => m.rule === "paid_only"));
  });
});
