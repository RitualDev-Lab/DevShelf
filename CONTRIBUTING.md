# 🤝 Contributing to DevShelf

Thanks for taking the time to contribute to **DevShelf**!

DevShelf is a crowdsourced repository that aims to be the most active, clean, and developer-friendly directory of open-source tools, free APIs, AI agents, and developer resources.

---

## 🚀 Quick Ways to Submit

### 1. The Fastest Way: Submit via GitHub Issues (No Git required)
- 👉 **[Submit an Open Source Tool / Project](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=submit_project.yml)**
- 👉 **[Submit a Free API](https://github.com/RitualDev-Lab/DevShelf/issues/new?template=submit_api.yml)**

Fill out the form and submit. Our automated actions will check the link, add your entry to the appropriate shelf file, regenerate the README, and credit you as a contributor!

---

### 2. Submit via Pull Request
If you prefer submitting via Git:

1. **Fork the repository** to your own GitHub account.
2. **Clone your fork locally**:
   `ash
   git clone https://github.com/<your-username>/DevShelf.git
   cd DevShelf
   `
3. **Install dependencies**:
   `ash
   pnpm install
   `
4. **Add your resource** to the matching file in shelf/:
   - shelf/apis.json: Free and public APIs.
   - shelf/cli-tools.json: CLI tools and terminal utilities.
   - shelf/ai-tools.json: Open source AI agents, LLM tools, local models.
   - shelf/testing-qa.json: Testing frameworks, QA utilities, mock tools.
   - shelf/free-cloud.json: Cloud resources with generous free tiers.
   - shelf/contributors-wanted.json: Projects actively seeking contributors.
5. **Re-build the README**:
   `ash
   pnpm run build
   `
6. **Validate data**:
   `ash
   pnpm run validate
   pnpm run format:check
   `
7. **Commit and open a Pull Request** against the main branch.

---

## 🛡️ Inclusion Criteria

To maintain a high standard for developers:
* **Open Source or Free Tier**: Tools must be 100% open-source or offer an authentic, permanent free tier (not a trial that asks for a credit card).
* **Working Endpoints**: APIs must return HTTP 200 and have functional documentation.
* **No Spam / Scams**: Affiliate links, referral codes, crypto token promotions, and SEO spam will be rejected immediately.
* **Formatting**: Please keep descriptions concise (1-2 sentences), factual, and free of marketing fluff (e.g., avoid \"the world's greatest...\").

Thank you for helping developers build better software together! ❤️
