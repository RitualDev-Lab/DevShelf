## ?? Submission Overview

<!-- Provide a quick summary of the tool, API, or fix being submitted -->
- **Resource Name**: 
- **Target Category File**: `shelf/` (e.g., `shelf/cli-tools.json`, `shelf/apis.json`, etc.)
- **URL**: 
- **License / Pricing Model**: e.g., MIT / Apache-2.0 / 100% Free Tier

---

## ?? Validation Checklist

Before submitting, please ensure you have checked the following:

- [ ] **Functional & Live URL**: The URL returns HTTP 200 and points directly to the project or docs (not a redirect or affiliate link).
- [ ] **100% Free or FOSS**: The tool is open-source or offers an authentic permanent free tier (no credit card required).
- [ ] **Factual Description**: The description is 1-2 concise, objective sentences explaining utility, without marketing superlatives ("best", "revolutionary").
- [ ] **Proper JSON Schema**: Required fields (`name`, `url`, `category`, `description`) are filled out correctly.
- [ ] **Local Validation Passed**:
  ```bash
  pnpm run validate
  npx tsx scripts/check-links.ts
  pnpm run build
  ```
- [ ] **No Conflicts**: My branch is rebased on the latest `main` branch.

---

## ?? Additional Notes / Context

<!-- Any extra details, screenshots, or context for the maintainers -->
