import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { evaluateLicenseDrift, evaluatePaywallPageContent } from "../scripts/sentinel-auditor.js";

describe("Automated Link Rot, License & Paywall Sentinel Suite", () => {
  test("evaluateLicenseDrift flags shift from MIT/Apache to BSL or SSPL", () => {
    const check1 = evaluateLicenseDrift("MIT", "BUSL-1.1");
    assert.strictEqual(check1.drifted, true);
    assert.ok(check1.details?.includes("proprietary"));

    const check2 = evaluateLicenseDrift("Apache-2.0", "SSPL-1.0");
    assert.strictEqual(check2.drifted, true);

    const check3 = evaluateLicenseDrift("MIT", "MIT");
    assert.strictEqual(check3.drifted, false);
  });

  test("evaluatePaywallPageContent catches mandatory upfront credit card traps", () => {
    const badPage = `
      <html>
        <body>
          <h1>Sign up now</h1>
          <p>Credit card required upfront to start your trial.</p>
        </body>
      </html>
    `;
    const result = evaluatePaywallPageContent(badPage);
    assert.strictEqual(result.violated, true);
  });

  test("evaluatePaywallPageContent passes generous zero-paywall landing pages", () => {
    const goodPage = `
      <html>
        <body>
          <h1>Free & Open Source</h1>
          <p>No credit card required. Free tier includes 10,000 monthly API calls forever.</p>
        </body>
      </html>
    `;
    const result = evaluatePaywallPageContent(goodPage);
    assert.strictEqual(result.violated, false);
  });
});
