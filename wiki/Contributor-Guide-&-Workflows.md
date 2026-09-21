# ?? Contributor Guide & Development Workflow

We welcome submissions of developer tools, free APIs, AI agents, testing utilities, and startup perks!

---

## ? Method 1: Submitting via GitHub Issues (No Git Required)

The quickest way to recommend a resource is to open an interactive issue template on GitHub:
- [?? Submit an Open Source Project / Tool](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=01_submit_tool.yml)
- [?? Submit a Free Public API](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=02_submit_api.yml)

Maintainers review incoming issues, verify endpoints, and merge them into the repository.

---

## ?? Method 2: Submitting via Pull Request

If you prefer submitting directly via Git:

### 1. Fork and Clone
```bash
git clone https://github.com/<your-username>/DevShelf.git
cd DevShelf
pnpm install
```

### 2. Add Your Entry to `shelf/`
Choose the matching file:
- `shelf/apis.json` &mdash; Free public APIs
- `shelf/cli-tools.json` &mdash; Terminal and developer productivity utilities
- `shelf/ai-tools.json` &mdash; Open-source AI tools and local LLM runners
- `shelf/testing-qa.json` &mdash; Testing and QA frameworks
- `shelf/free-cloud.json` &mdash; Permanent free tiers
- `shelf/contributors-wanted.json` &mdash; Projects with open issues
- `shelf/perks.json` &mdash; Maintainer/student sponsorships

### 3. Run Validation and Formatting
Before opening a PR, ensure all automated verification scripts succeed:
```bash
# 1. Validate data schema
pnpm run validate

# 2. Verify URL endpoint reachability
npx tsx scripts/check-links.ts

# 3. Format code with Biome
pnpm run format:check

# 4. Rebuild README and web app data
pnpm run build
```

### 4. Submit Your Pull Request
```bash
git checkout -b add-tool-name
git commit -m "feat(shelf): add ToolName to cli-tools.json"
git push origin add-tool-name
```
Open a Pull Request against `main`. Our CI will automatically verify your changes.

---

## 🎖️ Display the "Featured on DevShelf" Badge

If your project is curated on DevShelf, show it off on your README! Pick whichever style fits your project aesthetic:

### Option 1: Modern Electric Violet (Recommended)
[![Featured on DevShelf](https://img.shields.io/badge/Featured_on-DevShelf-8B5CF6?style=for-the-badge&logo=compass&logoColor=06B6D4&labelColor=0B0F19)](https://devshelf.ritualdev.in/)

```markdown
[![Featured on DevShelf](https://img.shields.io/badge/Featured_on-DevShelf-8B5CF6?style=for-the-badge&logo=compass&logoColor=06B6D4&labelColor=0B0F19)](https://devshelf.ritualdev.in/)
```

### Option 2: Terminal Emerald
[![DevShelf Verified](https://img.shields.io/badge/DevShelf-100%25_Verified_FOSS-10B981?style=for-the-badge&logo=gnubash&logoColor=white&labelColor=111827)](https://devshelf.ritualdev.in/)

```markdown
[![DevShelf Verified](https://img.shields.io/badge/DevShelf-100%25_Verified_FOSS-10B981?style=for-the-badge&logo=gnubash&logoColor=white&labelColor=111827)](https://devshelf.ritualdev.in/)
```

### Option 3: Minimal Dark Pill
[![Featured on DevShelf](https://img.shields.io/badge/📚_Featured_on-DevShelf-6366F1?style=flat&labelColor=1E1E2E&color=A855F7)](https://devshelf.ritualdev.in/)

```markdown
[![Featured on DevShelf](https://img.shields.io/badge/📚_Featured_on-DevShelf-6366F1?style=flat&labelColor=1E1E2E&color=A855F7)](https://devshelf.ritualdev.in/)
```

