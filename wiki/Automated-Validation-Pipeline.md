# ?? Automated Validation & Link Healthcheck Pipeline

Developer resource directories often suffer from **link rot** &mdash; domains expire, open-source repositories get renamed or archived, and free tiers transition behind paywalls.

DevShelf solves this with an **automated dual-tier validation pipeline**.

---

## ?? Tier 1: Schema & Data Validation (`scripts/validate-shelf.ts`)

Before any link is pinged, `validate-shelf.ts` enforces data integrity:
1. **JSON Syntax**: Ensures valid parsing across all 7 shelf files.
2. **Mandatory Keys**: Verifies that every record has `name`, `url`, `category`, and `description`.
3. **URL Format**: Enforces valid HTTPS/HTTP protocols.
4. **Deduplication**: Flags duplicate project entries or matching URLs across files.

Run locally:
```bash
pnpm run validate
```

---

## ?? Tier 2: Live HTTP Endpoint Verification (`scripts/check-links.ts`)

`check-links.ts` makes live network requests against every URL in the database to verify real-time reachability.

### Key Capabilities:
- **Concurrent Chunking**: Pings endpoints in batches of 5 concurrent requests with random backoff to avoid tripping remote rate limits.
- **HEAD with GET Fallback**: Pings with a lightweight `HEAD` request first. If a server rejects `HEAD` or returns `405 Method Not Allowed`, it seamlessly retries with a `GET` request using an authentic browser `User-Agent`.
- **Bot / WAF Distinction**: Distinguishes between actual dead endpoints (`404 Not Found`, DNS lookup failures, connection timeouts) and bot-shielded pages (`403 Forbidden` from Cloudflare/Akamai anti-scraping protections).
- **Exit Code Gating**: If any endpoint returns `404` or times out after 8 seconds, the script terminates with exit code `1`, causing CI checks to fail.

Run locally:
```bash
npx tsx scripts/check-links.ts
```

### Sample Output:
```text
?? [DevShelf Validator] Pinging 36 curated endpoints across 7 shelf files...

  ? [200] Ollama (https://github.com/ollama/ollama)
  ? [200] Open-WebUI (https://github.com/open-webui/open-webui)
  ? [200] Sentry for Open Source (https://sentry.io/for/open-source/)
  ? [200] Vitest (https://github.com/vitest-dev/vitest)

========================================
?? DevShelf Healthcheck Summary:
   Total Endpoints Checked: 36
   Active & Reachable:     36 (100.0%)
   Dead / Unreachable:     0
========================================

?? 100% of curated DevShelf resources are active and healthy!
```

---

## ?? GitHub Actions Automated Automation

The link validator runs under two triggers:
1. **Weekly Scheduled Cron**: Every Sunday at midnight UTC (`cron: '0 0 * * 0'`) in [`.github/workflows/healthcheck.yml`](../.github/workflows/healthcheck.yml).
2. **On-Demand Dispatch**: Maintainers can trigger manual health checks anytime via the GitHub Actions tab.
