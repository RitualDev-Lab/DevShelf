# 🛡️ Zero-Paywall Verification Criteria & Policy

DevShelf is strictly a **100% Free Forever Developer Directory & API Catalog**. Our mission is to provide developers, students, independent builders, and AI agents with completely accessible, non-deceptive tooling without paywalls or trial traps.

---

## 1. Allowed Resources & Eligibility

To qualify for listing on DevShelf, every submitted tool, library, API, or cloud service must meet at least one of the following criteria:

- **100% Free Forever Tier**: An ongoing, non-expiring free tier with sufficient quota for independent developers and hobbyists.
- **No Credit Card Required**: Sign-up must never demand upfront payment details, bank credentials, or pre-authorization charges.
- **Open-Source & Self-Hostable**: Transparently licensed open-source software (MIT, Apache-2.0, GPL, BSD, MPL, etc.) that developers can compile and run locally without proprietary runtime gates.
- **Free Community / Developer Editions**: Fully functional local or desktop editions (e.g. SQLite, Bruno, Nushell, LocalAI).
- **Public & Unauthenticated APIs**: Endpoints accessible without authentication, or using free, self-serve developer API keys.

---

## 2. Disallowed Resources & Exclusion Criteria

Submissions matching any of the following patterns will be rejected or promptly removed:

| Pattern | Policy | Reason |
| :--- | :--- | :--- |
| **Mandatory Credit Card on Signup** | ❌ Strictly Prohibited | Forces developers into accidental renewal traps. |
| **Time-Limited Free Trials (e.g. 7, 14, 30 days)** | ❌ Strictly Prohibited | Temporary trial periods without a permanent free fallback do not meet the "Free Forever" mandate. |
| **Closed Waitlists / Invitation-Only Previews** | ❌ Prohibited | All listed tools must have immediate public self-service signup. |
| **Bait-and-Switch Pricing** | ❌ Strictly Prohibited | Declaring a tool "free" that requires purchasing credits or subscriptions for basic functionality. |
| **Marketing Spyware / Forced Telemetry** | ❌ Prohibited | Utilities with intrusive adware, cryptocurrency miners, or undisclosed tracker payloads. |

---

## 3. Disclosure & Quota Requirements

Every catalog entry must specify accurate quota boundaries:
- **Rate Limits**: Disclose daily or monthly ceilings (e.g., `10,000 req/day`, `50 requests/min`).
- **Storage & Compute**: Explicitly note persistent storage or RAM limitations on free-tier sandboxes.
- **Status Tags**: Use standardized metadata tags (`No Card Required`, `100% Free Forever`, `Open-Source`).

---

## 4. Reporting Paywall Violations

If a listed resource sunsets its free tier, introduces an upfront credit card requirement, or institutes a trial bait gate:
1. Open an issue using the [Report Content Template](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=07_content_report.yml).
2. DevShelf's automated `audit:trial-bait` suite periodically crawls catalog URLs to detect changes in pricing terms, ensuring catalog freshness and developer trust.
