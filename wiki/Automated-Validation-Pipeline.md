# 🛡️ Automated Validation & Link Healthcheck Pipeline

Developer resource directories often suffer from **link rot** &mdash; domains expire, open-source repositories get renamed or archived, and free tiers transition behind paywalls.

DevShelf solves this with an **automated dual-tier validation pipeline**.

---

## 🔍 Tier 1: Schema & Data Validation (`scripts/validate-shelf.ts`)

Before any link is pinged, `validate-shelf.ts` enforces data integrity:
1. **JSON Syntax**: Ensures valid parsing across all 8 shelf files.
2. **Mandatory Keys**: Verifies that every record has `name`, `url` (or `repo`), `category`, and `description`.
3. **URL Format**: Enforces valid HTTPS/HTTP protocols.
4. **Deduplication**: Flags duplicate project entries or matching URLs across files.

Run locally:
```bash
pnpm run validate
```

---

## 🌐 Tier 2: Live HTTP Endpoint Verification (`scripts/check-links.ts`)

`check-links.ts` makes live network requests against catalog URLs in the database to verify real-time reachability.

### Key Capabilities:
- **Concurrent Chunking**: Pings endpoints in batches with backoff to avoid tripping remote rate limits.
- **HEAD with GET Fallback**: Pings with a lightweight `HEAD` request first. If a server rejects `HEAD` or returns `405 Method Not Allowed`, it seamlessly retries with a `GET` request using an authentic browser `User-Agent`.
- **Bot / WAF Distinction**: Distinguishes between actual dead endpoints (`404 Not Found`, DNS lookup failures, connection timeouts) and bot-shielded pages (`403 Forbidden` from Cloudflare/Akamai anti-scraping protections).
- **Rot & Sunset Classification**: Distinguishes between soft-404s, parked domains, expired SSL, and chronic failures for automated PR sunsetting.

Run locally:
```bash
npx tsx scripts/check-links.ts
```

---

## 🤖 GitHub Actions Automated Validation

The link validator and healthcheck run under two triggers:
1. **Weekly Scheduled Cron**: Automatically audits endpoints in [`.github/workflows/healthcheck.yml`](../.github/workflows/healthcheck.yml).
2. **On-Demand Dispatch**: Maintainers can trigger manual health checks anytime via the GitHub Actions tab.
