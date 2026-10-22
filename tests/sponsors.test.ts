import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

// Mirror and test the core algorithms used in site/sponsors.html for checkout return verification
const GITHUB_HANDLE_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function calculateTier(
  amount: number,
  currency = "USD",
): "enterprise" | "gold" | "silver" | "bronze" {
  const isINR = currency.toUpperCase() === "INR";
  const usd = isINR ? (amount > 0 ? Math.round(amount / 84) : 15) : amount > 0 ? amount : 15;
  if (usd >= 250) return "enterprise";
  if (usd >= 100) return "gold";
  if (usd >= 50) return "silver";
  return "bronze";
}

function getSafeAvatarUrl(github: string): string {
  if (github && GITHUB_HANDLE_REGEX.test(github)) {
    return `https://github.com/${encodeURIComponent(github)}.png`;
  }
  return "https://api.dicebear.com/7.x/identicon/svg?seed=backer";
}

function getSafeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}

interface InvoicePayload {
  patronId: string;
  name: string;
  amountUSD: number;
  billingCompany?: string;
  billingTaxId?: string;
  productType?: string;
  shippingRequired?: string;
  toolName?: string;
  toolCategory?: string;
}

function generateDigitalInvoice(payload: InvoicePayload) {
  const code = (payload.patronId || "TX001")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  return {
    invoiceNumber: `INV-DEVSHELF-2026-${code}`,
    isDigitalOnly: payload.productType === "digital" && payload.shippingRequired === "false",
    shippingCost: 0,
    billedTo: payload.billingCompany || payload.name || "Anonymous Patron",
    taxId: payload.billingTaxId || "Exempt (Digital Open-Source Grant)",
    toolPlacement: payload.toolName
      ? `${payload.toolName} (${payload.toolCategory || "general"})`
      : undefined,
  };
}

test("Sponsors Return Handler - Tier Calculation with Enterprise Placement", () => {
  assert.equal(calculateTier(250, "USD"), "enterprise", "USD >= 250 should be enterprise");
  assert.equal(calculateTier(500, "USD"), "enterprise", "USD 500 should be enterprise");
  assert.equal(calculateTier(100, "USD"), "gold", "USD 100 should be gold");
  assert.equal(calculateTier(249, "USD"), "gold", "USD 249 should be gold");
  assert.equal(calculateTier(50, "USD"), "silver", "USD 50 should be silver");
  assert.equal(calculateTier(99, "USD"), "silver", "USD 99 should be silver");
  assert.equal(calculateTier(15, "USD"), "bronze", "USD 15 should be bronze");
  assert.equal(calculateTier(5, "USD"), "bronze", "USD 5 should be bronze");

  // INR conversions (~84 INR per USD)
  assert.equal(
    calculateTier(21000, "INR"),
    "enterprise",
    "INR 21,000 (~$250) should be enterprise",
  );
  assert.equal(calculateTier(8400, "INR"), "gold", "INR 8400 (~$100) should be gold");
  assert.equal(calculateTier(4200, "INR"), "silver", "INR 4200 (~$50) should be silver");
  assert.equal(calculateTier(1200, "INR"), "bronze", "INR 1200 (~$14) should be bronze");
});

test("Sponsors Return Handler - GitHub Handle Sanitization", () => {
  assert.ok(GITHUB_HANDLE_REGEX.test("RitualDev-Lab"), "Valid org handle");
  assert.ok(GITHUB_HANDLE_REGEX.test("torvalds"), "Valid username");
  assert.ok(!GITHUB_HANDLE_REGEX.test("<script>"), "Must reject script tags");
  assert.ok(!GITHUB_HANDLE_REGEX.test("-invalid-start"), "Must reject starting hyphen");
  assert.ok(!GITHUB_HANDLE_REGEX.test("invalid--double"), "Must reject double hyphens");
});

test("Sponsors Return Handler - Safe URL Enforcement", () => {
  assert.equal(
    getSafeUrl("https://example.com"),
    "https://example.com/",
    "Should allow valid HTTPS URL",
  );
  assert.equal(
    getSafeUrl("http://example.com"),
    "http://example.com/",
    "Should allow valid HTTP URL",
  );
  assert.equal(getSafeUrl("javascript:alert(1)"), "", "Must reject javascript protocol");
  assert.equal(getSafeUrl("data:text/html,test"), "", "Must reject data protocol");
  assert.equal(getSafeUrl("not a url"), "", "Must reject invalid strings");
});

test("Sponsors Return Handler - Safe Avatar URL Generation", () => {
  assert.equal(
    getSafeAvatarUrl("octocat"),
    "https://github.com/octocat.png",
    "Should generate valid GitHub avatar URL",
  );
  assert.equal(
    getSafeAvatarUrl("evil<script>"),
    "https://api.dicebear.com/7.x/identicon/svg?seed=backer",
    "Should fallback to identicon for invalid handle",
  );
});

test("Digital Invoice & Receipt Setup - Zero Physical Shipping Verification", () => {
  const invoice = generateDigitalInvoice({
    patronId: "patron-1729081234567",
    name: "Acme Corp",
    amountUSD: 250,
    billingCompany: "Acme Inc.",
    billingTaxId: "US-EIN-12345678",
    productType: "digital",
    shippingRequired: "false",
  });

  assert.match(invoice.invoiceNumber, /^INV-DEVSHELF-2026-[A-Z0-9]{6}$/);
  assert.equal(invoice.isDigitalOnly, true, "Product must be digital-only with zero shipping");
  assert.equal(invoice.shippingCost, 0, "Physical shipping cost must be exactly 0");
  assert.equal(invoice.billedTo, "Acme Inc.");
  assert.equal(invoice.taxId, "US-EIN-12345678");
});

test("Tool Sponsorship Checkout Return - URL Parameter & Metadata Processing", () => {
  const urlParams = new URLSearchParams({
    status: "success",
    amount: "149",
    currency: "USD",
    sponsor_name: "RowSafe Security",
    tool_name: "RowSafe",
    tool_url: "https://github.com/RitualDev-Lab/RowSafe",
    tool_category: "cli",
    tool_alt: "Postman, Datadog",
    tool_pitch: "Zero-leak secret interception and local sandbox for autonomous AI agents.",
  });

  const toolName = urlParams.get("tool_name");
  const toolUrl = urlParams.get("tool_url");
  const toolCategory = urlParams.get("tool_category");
  const toolPitch = urlParams.get("tool_pitch");

  assert.equal(toolName, "RowSafe");
  assert.equal(toolUrl, "https://github.com/RitualDev-Lab/RowSafe");
  assert.equal(toolCategory, "cli");
  assert.ok(toolPitch?.includes("Zero-leak secret interception"));
});

test("Digital Invoice - Generates Tool Placement Line Items", () => {
  const invoice = generateDigitalInvoice({
    patronId: "patron-1729089999999",
    name: "RowSafe Labs",
    amountUSD: 149,
    billingCompany: "RowSafe Technologies Ltd.",
    billingTaxId: "GB-VAT-987654321",
    productType: "digital",
    shippingRequired: "false",
    toolName: "RowSafe",
    toolCategory: "cli",
  });

  assert.equal(invoice.isDigitalOnly, true);
  assert.equal(invoice.shippingCost, 0);
  assert.equal(invoice.toolPlacement, "RowSafe (cli)");
});

test("Sponsors Ledger Data Integrity - Schema and Values", async () => {
  const sponsorsPath = path.resolve("data/sponsors.json");
  const rawData = await fs.readFile(sponsorsPath, "utf8");
  const data = JSON.parse(rawData);

  assert.ok(data.version, "Should have a version string");
  assert.ok(data.stats, "Should have stats object");
  assert.equal(typeof data.stats.totalPatrons, "number", "totalPatrons should be number");
  assert.equal(Array.isArray(data.patrons), true, "patrons should be an array");
  assert.equal(
    data.stats.totalPatrons,
    data.patrons.length,
    "totalPatrons should match patrons count",
  );

  for (const patron of data.patrons) {
    assert.ok(patron.id, `Patron must have id: ${JSON.stringify(patron)}`);
    assert.equal(typeof patron.rank, "number", `Patron rank must be number: ${patron.id}`);
    assert.ok(patron.name, `Patron must have name: ${patron.id}`);
    assert.ok(patron.github, `Patron must have github handle: ${patron.id}`);
    assert.ok(
      GITHUB_HANDLE_REGEX.test(patron.github),
      `Patron handle must be valid: ${patron.github}`,
    );
    assert.ok(
      ["enterprise", "gold", "silver", "bronze"].includes(patron.tier),
      `Valid tier: ${patron.tier}`,
    );
    assert.ok(patron.amountUSD > 0, `Patron amountUSD must be > 0: ${patron.id}`);
    assert.ok(patron.avatar.startsWith("https://"), `Avatar must use HTTPS: ${patron.avatar}`);
    assert.ok(
      patron.badgeUrl.startsWith("https://"),
      `Badge URL must use HTTPS: ${patron.badgeUrl}`,
    );
  }
});

test("Sponsors Static Badges Artifacts Verification", async () => {
  const badgesDir = path.resolve("site/api/v1/badges");
  const requiredBadges = [
    "enterprise.svg",
    "enterprise-card.svg",
    "gold.svg",
    "gold-card.svg",
    "silver.svg",
    "silver-card.svg",
    "bronze.svg",
    "bronze-card.svg",
    "supporter.svg",
    "supporter-card.svg",
    "default.svg",
    "verified.svg",
  ];

  for (const badgeFile of requiredBadges) {
    const filePath = path.join(badgesDir, badgeFile);
    let content = await fs.readFile(filePath, "utf8");
    if (!content.trim().startsWith("<svg")) {
      await new Promise((r) => setTimeout(r, 100));
      content = await fs.readFile(filePath, "utf8");
    }
    assert.ok(content.trim().startsWith("<svg"), `${badgeFile} must start with <svg`);
    assert.ok(content.trim().endsWith("</svg>"), `${badgeFile} must end with </svg>`);
    assert.ok(!content.includes("<script"), `${badgeFile} must not contain script tags`);
  }
});

function splitFullName(fullName: string) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const firstName = parts.slice(0, -1).join(" ");
  const lastName = parts[parts.length - 1];
  return { firstName, lastName };
}

function resolveCountryCode(countryStr?: string, currency = "USD") {
  if (countryStr) {
    const c = countryStr.trim().toUpperCase();
    if (c.length === 2) return c;
    const map: Record<string, string> = {
      INDIA: "IN",
      "UNITED STATES": "US",
      USA: "US",
      "UNITED KINGDOM": "GB",
      UK: "GB",
      GERMANY: "DE",
      CANADA: "CA",
      AUSTRALIA: "AU",
      FRANCE: "FR",
      SINGAPORE: "SG",
      JAPAN: "JP",
      NETHERLANDS: "NL",
      BRAZIL: "BR",
      BANGLADESH: "BD",
    };
    if (map[c]) return map[c];
  }
  return currency.toUpperCase() === "INR" ? "IN" : "US";
}

interface DodoCheckoutBuildOptions {
  name: string;
  email: string;
  amount: number;
  currency?: string;
  github?: string;
  url?: string;
  comment?: string;
  billingCompany?: string;
  billingCountry?: string;
  billingTaxId?: string;
  toolName?: string;
  toolUrl?: string;
  toolCategory?: string;
  toolAlt?: string;
  toolPitch?: string;
  baseUrl?: string;
  returnUrl?: string;
}

function buildDodoCheckoutUrl(opts: DodoCheckoutBuildOptions): string {
  const baseUrl = opts.baseUrl || "https://checkout.dodopayments.com/buy/pdt_0NpjONGugY5QkrFDUaPva";
  const currency = opts.currency || "USD";
  const { firstName, lastName } = splitFullName(opts.name);
  const country = resolveCountryCode(opts.billingCountry, currency);

  const params = new URLSearchParams();
  params.set("fullName", opts.name);
  params.set("firstName", firstName);
  if (lastName) params.set("lastName", lastName);
  params.set("name", opts.name);

  if (opts.email) {
    params.set("email", opts.email);
    params.set("customer_email", opts.email);
  }
  params.set("country", country);
  params.set("paymentAmount", String(opts.amount));
  params.set("amount", String(opts.amount));
  params.set("paymentCurrency", currency);
  params.set("currency", currency);
  params.set("singlePage", "true");
  params.set("product_type", "digital");
  params.set("shipping_required", "false");

  if (opts.returnUrl) params.set("redirect_url", opts.returnUrl);

  params.set("metadata_sponsorName", opts.name);
  params.set("metadata_sponsor_name", opts.name);
  if (opts.email) {
    params.set("metadata_email", opts.email);
    params.set("metadata_customer_email", opts.email);
  }
  if (opts.github) {
    params.set("metadata_github", opts.github);
    params.set("github", opts.github);
  }
  if (opts.toolName) {
    params.set("metadata_toolName", opts.toolName);
    params.set("tool_name", opts.toolName);
  }

  return `${baseUrl}?${params.toString()}`;
}

test("Dodo Checkout URL Prefill - Customer and Payment Parameters", () => {
  const checkoutUrl = buildDodoCheckoutUrl({
    name: "Divyanshu Jethi",
    email: "divyanshu@example.com",
    amount: 5,
    currency: "USD",
    github: "divyanshu",
    returnUrl: "https://devshelf.ritualdev.in/sponsors.html?status=success",
  });

  const parsed = new URL(checkoutUrl);
  assert.equal(parsed.pathname, "/buy/pdt_0NpjONGugY5QkrFDUaPva");
  assert.equal(parsed.searchParams.get("fullName"), "Divyanshu Jethi");
  assert.equal(parsed.searchParams.get("firstName"), "Divyanshu");
  assert.equal(parsed.searchParams.get("lastName"), "Jethi");
  assert.equal(parsed.searchParams.get("name"), "Divyanshu Jethi");
  assert.equal(parsed.searchParams.get("email"), "divyanshu@example.com");
  assert.equal(parsed.searchParams.get("customer_email"), "divyanshu@example.com");
  assert.equal(parsed.searchParams.get("paymentAmount"), "5");
  assert.equal(parsed.searchParams.get("amount"), "5");
  assert.equal(parsed.searchParams.get("paymentCurrency"), "USD");
  assert.equal(parsed.searchParams.get("currency"), "USD");
  assert.equal(parsed.searchParams.get("singlePage"), "true");
  assert.equal(parsed.searchParams.get("country"), "US");
  assert.equal(parsed.searchParams.get("metadata_sponsorName"), "Divyanshu Jethi");
  assert.equal(parsed.searchParams.get("metadata_email"), "divyanshu@example.com");
  assert.equal(
    parsed.searchParams.get("redirect_url"),
    "https://devshelf.ritualdev.in/sponsors.html?status=success",
  );
});

test("Dodo Checkout URL Prefill - INR Currency and Country Mapping", () => {
  const checkoutUrl = buildDodoCheckoutUrl({
    name: "Alex",
    email: "alex@ritualdev.in",
    amount: 150,
    currency: "INR",
  });

  const parsed = new URL(checkoutUrl);
  assert.equal(parsed.searchParams.get("fullName"), "Alex");
  assert.equal(parsed.searchParams.get("firstName"), "Alex");
  assert.equal(parsed.searchParams.get("lastName"), null);
  assert.equal(parsed.searchParams.get("paymentCurrency"), "INR");
  assert.equal(
    parsed.searchParams.get("country"),
    "IN",
    "INR currency should default country to IN",
  );
  assert.equal(parsed.searchParams.get("singlePage"), "true");
});

test("Dodo Checkout URL Prefill - Tool Promotion Metadata", () => {
  const checkoutUrl = buildDodoCheckoutUrl({
    name: "RowSafe Team",
    email: "founders@rowsafe.dev",
    amount: 149,
    currency: "USD",
    toolName: "RowSafe",
  });

  const parsed = new URL(checkoutUrl);
  assert.equal(parsed.searchParams.get("tool_name"), "RowSafe");
  assert.equal(parsed.searchParams.get("metadata_toolName"), "RowSafe");
  assert.equal(parsed.searchParams.get("singlePage"), "true");
});

// Form Submission & Validation Engine (matching site/sponsors.html)
interface SponsorValidationInput {
  name: string;
  email: string;
  packageId?: string | null;
  toolName?: string;
  toolUrl?: string;
  toolPitch?: string;
  toolAlt?: string;
  toolNotes?: string;
}

interface SponsorValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  normalizedToolUrl?: string;
}

function validateSponsorSubmission(input: SponsorValidationInput): SponsorValidationResult {
  const errors: Record<string, string> = {};
  const name = (input.name || "").trim();
  const email = (input.email || "").trim();
  const packageId = (input.packageId || "").trim();
  const toolName = (input.toolName || "").trim();
  let toolUrl = (input.toolUrl || "").trim();
  const toolPitch = (input.toolPitch || "").trim();
  const toolAlt = (input.toolAlt || "").trim();
  const toolNotes = (input.toolNotes || "").trim();

  if (!name) {
    errors.name = "Please enter your name, handle, or organization.";
  }

  if (!email) {
    errors.email = "Please enter your email address for your receipt & confirmation.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address (e.g. dev@example.com).";
  }

  const isToolSubmission = Boolean(
    packageId || toolName || toolUrl || toolPitch || toolAlt || toolNotes,
  );

  if (isToolSubmission) {
    if (!toolName) {
      errors.toolName = packageId
        ? "Tool / Product Name is required to reserve this package."
        : "Please enter your Tool / Product Name.";
    }

    if (!toolUrl) {
      errors.toolUrl = packageId
        ? "Tool URL or GitHub Repo is required to reserve this package."
        : "Please enter your Tool URL or GitHub Repo.";
    } else {
      if (!/^https?:\/\//i.test(toolUrl)) {
        toolUrl = "https://" + toolUrl;
      }
      let validUrl = false;
      try {
        const parsed = new URL(toolUrl);
        if (
          ["http:", "https:"].includes(parsed.protocol) &&
          parsed.hostname &&
          parsed.hostname.includes(".")
        ) {
          validUrl = true;
        }
      } catch {
        validUrl = false;
      }
      if (!validUrl) {
        errors.toolUrl =
          "Please enter a valid URL (e.g. https://github.com/org/tool or https://mytool.dev).";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedToolUrl: toolUrl,
  };
}

test("Sponsors Form Validation - Pure Backer (No Tool) Allows Seamless Checkout", () => {
  const result = validateSponsorSubmission({
    name: "Alex Supporter",
    email: "alex@example.com",
  });

  assert.equal(result.isValid, true, "Pure backer with name and email should be valid");
  assert.equal(Object.keys(result.errors).length, 0);
});

test("Sponsors Form Validation - Rejects Empty Name or Invalid Email", () => {
  const missingName = validateSponsorSubmission({
    name: "",
    email: "test@example.com",
  });
  assert.equal(missingName.isValid, false);
  assert.ok(missingName.errors.name, "Should complain about missing name");

  const invalidEmail = validateSponsorSubmission({
    name: "Alex",
    email: "not-an-email",
  });
  assert.equal(invalidEmail.isValid, false);
  assert.ok(invalidEmail.errors.email, "Should complain about invalid email");
});

test("Sponsors Form Validation - Strict Tool Name & URL Validation for Tool Packages", () => {
  // 1. When a package is selected, Tool Name & Tool URL must NOT be omitted
  const missingBoth = validateSponsorSubmission({
    name: "Founder",
    email: "founder@tool.dev",
    packageId: "starter",
  });
  assert.equal(missingBoth.isValid, false);
  assert.equal(
    missingBoth.errors.toolName,
    "Tool / Product Name is required to reserve this package.",
  );
  assert.equal(
    missingBoth.errors.toolUrl,
    "Tool URL or GitHub Repo is required to reserve this package.",
  );

  // 2. Missing Tool URL when Tool Name is provided
  const missingUrl = validateSponsorSubmission({
    name: "Founder",
    email: "founder@tool.dev",
    packageId: "starter",
    toolName: "AwesomeCLI",
  });
  assert.equal(missingUrl.isValid, false);
  assert.equal(
    missingUrl.errors.toolUrl,
    "Tool URL or GitHub Repo is required to reserve this package.",
  );

  // 3. Invalid URL string
  const badUrl = validateSponsorSubmission({
    name: "Founder",
    email: "founder@tool.dev",
    packageId: "starter",
    toolName: "AwesomeCLI",
    toolUrl: "not_a_valid_url",
  });
  assert.equal(badUrl.isValid, false);
  assert.match(badUrl.errors.toolUrl, /valid URL/);

  // 4. Valid Tool URL auto-prefixes https:// if omitted
  const validSubmission = validateSponsorSubmission({
    name: "Founder",
    email: "founder@tool.dev",
    packageId: "newsletterSpotlight",
    toolName: "AwesomeCLI",
    toolUrl: "github.com/org/awesome-cli",
  });
  assert.equal(validSubmission.isValid, true);
  assert.equal(validSubmission.normalizedToolUrl, "https://github.com/org/awesome-cli");
});

test("Sponsors HTML UI Structure - Contains Error Elements & Active Package Banner", async () => {
  const sponsorsHtml = await fs.readFile(path.resolve("site/sponsors.html"), "utf-8");

  assert.ok(
    sponsorsHtml.includes('id="active-package-banner"'),
    "Must contain active package banner container",
  );
  assert.ok(
    sponsorsHtml.includes('id="tool-name-error"'),
    "Must contain tool name inline error div",
  );
  assert.ok(sponsorsHtml.includes('id="tool-url-error"'), "Must contain tool url inline error div");
  assert.ok(
    sponsorsHtml.includes('id="sponsor-name-error"'),
    "Must contain sponsor name inline error div",
  );
  assert.ok(
    sponsorsHtml.includes('id="sponsor-email-error"'),
    "Must contain sponsor email inline error div",
  );
  assert.ok(
    sponsorsHtml.includes("PACKAGE_DISPLAY_NAMES"),
    "Must define package display names dictionary",
  );
  assert.ok(sponsorsHtml.includes("showFieldError"), "Must define showFieldError UI helper");
  assert.ok(sponsorsHtml.includes("clearFieldError"), "Must define clearFieldError UI helper");
  assert.ok(
    sponsorsHtml.includes("clearSelectedPackage"),
    "Must define clearSelectedPackage UI helper",
  );
});
