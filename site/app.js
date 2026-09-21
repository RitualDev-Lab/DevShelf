let allResources = [];
let activeCategory = "all";
let activeTag = "";
let searchQuery = "";
let currentSort = "featured";
let matchmakerData = null;
let activeMatchLang = "all";
const activeMatrixTags = new Set();
let uptimeData = null;
const drawerState = {
  currentItem: null,
  activeTab: "curl",
};
const wizardState = {
  step: 1,
};

const BADGE_MARKDOWNS = {
  purple:
    "[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)",
  cyan: "[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Curated%20Resource-00E5FF?style=for-the-badge&logo=github&logoColor=black)](https://devshelf.ritualdev.in/)",
  flat: "[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-blueviolet?style=flat-square&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)",
};

/**
 * Main application bootstrapper.
 * Attaches listeners immediately so buttons never fail, then loads and renders data.
 */
function boot() {
  setupListeners();
  loadDataAndRender();
  loadUptimeData();
}

/**
 * Loads data from preloaded window.DEVSHELF_DATA (0ms latency, zero CORS restrictions)
 * and falls back / refreshes from data.json if available.
 */
async function loadDataAndRender() {
  if (
    typeof window !== "undefined" &&
    window.DEVSHELF_DATA &&
    Array.isArray(window.DEVSHELF_DATA.resources)
  ) {
    applyData(window.DEVSHELF_DATA);
  }

  try {
    const res = await fetch(`data.json?v=${Date.now()}`);
    if (res.ok) {
      const liveData = await res.json();
      if (liveData && Array.isArray(liveData.resources)) {
        applyData(liveData);
      }
    }
  } catch (err) {
    console.info("Using embedded DevShelf data.", err);
  }
}

async function loadUptimeData() {
  if (uptimeData) return uptimeData;
  try {
    const res = await fetch(`uptime.json?v=${Date.now()}`);
    if (res.ok) {
      uptimeData = await res.json();
      render();
    }
  } catch (err) {
    console.info("Uptime telemetry loading deferred.", err);
  }
  return uptimeData;
}

function applyData(data) {
  allResources = data.resources || [];
  updateStatsAndPills(data);
  updateMatrixCounts();
  renderSpotlight();
  render();
}

function updateMatrixCounts() {
  const counts = {
    noauth: 0,
    selfhost: 0,
    freetier: 0,
    offline: 0,
  };

  for (const item of allResources) {
    if (matchesMatrixTag(item, "noauth")) counts.noauth++;
    if (matchesMatrixTag(item, "selfhost")) counts.selfhost++;
    if (matchesMatrixTag(item, "freetier")) counts.freetier++;
    if (matchesMatrixTag(item, "offline")) counts.offline++;
  }

  setElText("matrix-count-noauth", counts.noauth);
  setElText("matrix-count-selfhost", counts.selfhost);
  setElText("matrix-count-freetier", counts.freetier);
  setElText("matrix-count-offline", counts.offline);
}

function matchesMatrixTag(item, tag) {
  if (tag === "noauth") {
    return (
      item.auth === "No Key" ||
      (item.statusTags || []).some(
        (t) => t.toLowerCase().includes("no auth") || t.toLowerCase().includes("no key"),
      )
    );
  }
  if (tag === "selfhost") {
    return (
      item.type === "boilerplate" ||
      (item.statusTags || []).some(
        (t) => t.toLowerCase().includes("self-hostable") || t.toLowerCase().includes("selfhost"),
      )
    );
  }
  if (tag === "freetier") {
    return (
      item.type === "boilerplate" ||
      item.auth === "No Key" ||
      (item.freeTier && !item.freeTier.toLowerCase().includes("credit card")) ||
      (item.statusTags || []).some(
        (t) => t.toLowerCase().includes("no card") || t.toLowerCase().includes("nocard"),
      )
    );
  }
  if (tag === "offline") {
    return (item.statusTags || []).some((t) => t.toLowerCase().includes("offline"));
  }
  return false;
}

function updateStatsAndPills(data) {
  const total = data.totalCount || allResources.length;
  const reposCount = data.counts?.repos || allResources.filter((r) => Boolean(r.repo)).length;
  const boilerplatesCount =
    data.counts?.boilerplates || allResources.filter((r) => r.type === "boilerplate").length;
  const apisCount = data.counts?.apis || 0;
  const aiCount = data.counts?.aiTools || 0;
  const cliCount = data.counts?.cliTools || 0;
  const testingCount = data.counts?.testingQa || 0;
  const cloudCount = data.counts?.freeCloud || 0;
  const perksCount = data.counts?.perks || 0;
  const contributorsCount =
    data.counts?.contributors ||
    allResources.filter((r) => r.contributorsWanted || r.seeking || r.type === "contributors")
      .length;

  // Stats bar
  setElText("stat-total", `${total} Resources`);
  setElText("stat-repos", reposCount);
  setElText("stat-boilerplates", boilerplatesCount);
  setElText("stat-apis", apisCount);
  setElText("stat-ai", aiCount);
  setElText("stat-cli", cliCount);
  setElText("stat-testing", testingCount);
  setElText("stat-cloud", cloudCount);
  setElText("stat-perks", perksCount);

  // Category pill counts
  setElText("pill-count-all", total);
  setElText("pill-count-repo", reposCount);
  setElText("pill-count-boilerplates", boilerplatesCount);
  setElText("pill-count-api", apisCount);
  setElText("pill-count-ai", aiCount);
  setElText("pill-count-cli", cliCount);
  setElText("pill-count-testing", testingCount);
  setElText("pill-count-cloud", cloudCount);
  setElText("pill-count-perks", perksCount);
  setElText("pill-count-contributors", contributorsCount);
}

function setElText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderSpotlight() {
  const spotlightContainer = document.getElementById("spotlight-grid");
  if (!spotlightContainer || allResources.length === 0) return;

  const spotlightNames = [
    "GitWhisper",
    "FlashLane",
    "AutoHeal-QA",
    "Ollama",
    "Bruno",
    "PocketBase",
  ];
  const featured = allResources
    .filter((r) => spotlightNames.includes(r.name) || r.featured)
    .slice(0, 6);

  spotlightContainer.innerHTML = featured
    .map((item) => {
      const isRepo = Boolean(item.repo);
      const targetUrl = item.repo || item.url;
      const displaySlug = item.repo
        ? item.repo.replace(/^https?:\/\/github\.com\//, "")
        : targetUrl.replace(/^https?:\/\/(www\.)?/, "");

      return `
      <div class="spotlight-card rounded-2xl p-5 flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <div class="flex items-center space-x-2 flex-wrap">
                <h3 class="text-base font-extrabold text-white group-hover:text-purple-300 transition">
                  <a href="${targetUrl}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>
                </h3>
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/25 text-amber-200 border border-amber-500/40 font-mono">Spotlight</span>
              </div>
              <div class="text-xs font-mono text-cyan-300 mt-1 font-semibold flex items-center space-x-1">
                <span>${isRepo ? "🐙" : "🌐"}</span>
                <span>${escapeHtml(displaySlug)}</span>
              </div>
            </div>
            <button data-url="${targetUrl}" class="copy-btn text-slate-300 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition" title="Copy URL">
              📋
            </button>
          </div>
          
          <p class="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3 my-3 font-normal">${escapeHtml(item.description)}</p>
        </div>

        <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            ${escapeHtml(item.language || item.license || "100% Free")}
          </span>
          <div class="flex items-center space-x-2">
            ${
              isRepo
                ? `<a href="${item.repo}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-600/30">
                    <span>🐙 GitHub Repo →</span>
                  </a>`
                : `<a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-600/30">
                    <span>🌐 Website →</span>
                  </a>`
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // Stagger spotlight card entrance animations
  const spotCards = spotlightContainer.children;
  for (let i = 0; i < spotCards.length; i++) {
    spotCards[i].style.setProperty("--delay", `${i * 0.08}s`);
  }
}

let listenersInitialized = false;
function setupListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;
  closeBadgeModal();
  closeMatchmakerModal();
  closeWizardModal();
  closeSnippetDrawer();

  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search-btn");

  searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    if (clearBtn) {
      if (searchQuery.length > 0) {
        clearBtn.classList.remove("hidden");
      } else {
        clearBtn.classList.add("hidden");
      }
    }
    render();
  });

  // Global Unified Event Delegation
  document.addEventListener("click", (e) => {
    // 1. Open Badge Modal
    if (e.target.closest("#open-badge-modal-btn, #nav-badge-btn, #hero-badge-btn")) {
      e.preventDefault();
      openBadgeModal();
      return;
    }

    // 2. Close Badge Modal
    if (e.target.closest("#close-badge-modal-btn") || e.target.id === "badge-modal") {
      e.preventDefault();
      closeBadgeModal();
      return;
    }

    // 3. Open Matchmaker Modal
    if (e.target.closest("#open-matchmaker-btn, #nav-matchmaker-btn, #hero-matchmaker-btn")) {
      e.preventDefault();
      openMatchmakerModal();
      return;
    }

    // 4. Close Matchmaker Modal
    if (e.target.closest("#close-matchmaker-modal-btn") || e.target.id === "matchmaker-modal") {
      e.preventDefault();
      closeMatchmakerModal();
      return;
    }

    // 5. Open Contribution Wizard Modal
    if (e.target.closest("#nav-wizard-btn, #hero-wizard-btn")) {
      e.preventDefault();
      openWizardModal();
      return;
    }

    // 6. Close Contribution Wizard Modal
    if (e.target.closest("#close-wizard-modal-btn") || e.target.id === "wizard-modal") {
      e.preventDefault();
      closeWizardModal();
      return;
    }

    // 7. Wizard Step Navigation
    if (e.target.closest("#wizard-prev-btn")) {
      e.preventDefault();
      if (wizardState.step > 1) {
        setWizardStep(wizardState.step - 1);
      }
      return;
    }

    if (e.target.closest("#wizard-next-btn")) {
      e.preventDefault();
      if (wizardState.step < 4) {
        setWizardStep(wizardState.step + 1);
      }
      return;
    }

    // 8. Wizard Copy JSON & Submit PR
    if (e.target.closest("#wizard-copy-btn")) {
      e.preventDefault();
      const outputEl = document.getElementById("wizard-json-output");
      if (outputEl?.textContent) {
        copyToClipboard(outputEl.textContent, "Formatted JSON schema copied!");
      }
      return;
    }

    if (e.target.closest("#wizard-submit-btn")) {
      e.preventDefault();
      submitWizardToGithub();
      return;
    }

    // 9. Snippet Button on Card
    const snippetBtn = e.target.closest(".snippet-btn");
    if (snippetBtn) {
      e.preventDefault();
      const toolName = snippetBtn.dataset.snippetName;
      const item = allResources.find((r) => r.name === toolName);
      if (item) {
        openSnippetDrawer(item);
      }
      return;
    }

    // 10. Snippet Drawer Close
    if (e.target.closest("#close-drawer-btn, #close-drawer-overlay")) {
      e.preventDefault();
      closeSnippetDrawer();
      return;
    }

    // 11. Snippet Drawer Tab Selection
    const sTab = e.target.closest("[data-snippettab]");
    if (sTab) {
      e.preventDefault();
      drawerState.activeTab = sTab.dataset.snippettab || "curl";
      for (const b of document.querySelectorAll("[data-snippettab]")) {
        b.classList.remove("active");
      }
      sTab.classList.add("active");
      updateDrawerSnippet();
      return;
    }

    // 12. Snippet Drawer Copy
    if (e.target.closest("#drawer-copy-btn")) {
      e.preventDefault();
      const codeEl = document.getElementById("drawer-code-content");
      if (codeEl?.textContent) {
        copyToClipboard(codeEl.textContent, "Snippet copied to clipboard!");
      }
      return;
    }

    // 13. Dynamic Quick-Filter Matrix Toggles
    const matrixBtn = e.target.closest(".matrix-btn");
    if (matrixBtn) {
      e.preventDefault();
      const mTag = matrixBtn.dataset.matrixtag;
      if (activeMatrixTags.has(mTag)) {
        activeMatrixTags.delete(mTag);
        matrixBtn.classList.remove("active");
      } else {
        activeMatrixTags.add(mTag);
        matrixBtn.classList.add("active");
      }
      const clearMatrixBtn = document.getElementById("clear-matrix-btn");
      if (clearMatrixBtn) {
        if (activeMatrixTags.size > 0) clearMatrixBtn.classList.remove("hidden");
        else clearMatrixBtn.classList.add("hidden");
      }
      render();
      return;
    }

    // 14. Clear Matrix Filters
    if (e.target.closest("#clear-matrix-btn")) {
      e.preventDefault();
      activeMatrixTags.clear();
      for (const b of document.querySelectorAll(".matrix-btn")) {
        b.classList.remove("active");
      }
      document.getElementById("clear-matrix-btn")?.classList.add("hidden");
      render();
      return;
    }

    // 15. Matchmaker Language Filter Pills
    const matchLangBtn = e.target.closest(".match-lang-btn");
    if (matchLangBtn) {
      e.preventDefault();
      activeMatchLang = matchLangBtn.dataset.matchlang || "all";
      for (const b of document.querySelectorAll(".match-lang-btn")) {
        b.classList.remove("bg-purple-600", "text-white");
        b.classList.add("bg-slate-800", "text-slate-200");
      }
      matchLangBtn.classList.remove("bg-slate-800", "text-slate-200");
      matchLangBtn.classList.add("bg-purple-600", "text-white");
      if (matchmakerData) {
        renderMatchmakerList(matchmakerData);
      }
      return;
    }

    // 16. Copy Badge Markdown inside modal
    const copyBadgeBtn = e.target.closest(".copy-badge-btn");
    if (copyBadgeBtn) {
      e.preventDefault();
      const badgeType = copyBadgeBtn.dataset.badge;
      const md = BADGE_MARKDOWNS[badgeType];
      if (md) {
        copyToClipboard(md, "Badge markdown copied to clipboard!");
      }
      return;
    }

    // 17. Clear Search Button
    if (e.target.closest("#clear-search-btn")) {
      e.preventDefault();
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      searchQuery = "";
      clearBtn?.classList.add("hidden");
      render();
      return;
    }

    // 18. Reset Filters Button
    if (e.target.closest("#reset-filters-btn, #clear-filters-btn")) {
      e.preventDefault();
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      activeCategory = "all";
      activeTag = "";
      activeMatrixTags.clear();
      clearBtn?.classList.add("hidden");

      for (const b of document.querySelectorAll(".matrix-btn")) {
        b.classList.remove("active");
      }
      document.getElementById("clear-matrix-btn")?.classList.add("hidden");

      for (const b of document.querySelectorAll(".category-pill")) {
        b.classList.remove("active");
      }
      document.querySelector('.category-pill[data-category="all"]')?.classList.add("active");

      for (const tb of document.querySelectorAll(".filter-tag")) {
        tb.classList.remove("active");
      }
      render();
      return;
    }

    // 19. Category Pills Navigation
    const pill = e.target.closest(".category-pill");
    if (pill) {
      e.preventDefault();
      for (const b of document.querySelectorAll(".category-pill")) {
        b.classList.remove("active");
      }
      pill.classList.add("active");
      activeCategory = pill.dataset.category || "all";
      render();
      return;
    }

    // 20. Quick Filter Tags
    const tagBtn = e.target.closest(".filter-tag");
    if (tagBtn) {
      e.preventDefault();
      const tag = tagBtn.dataset.tag;
      if (activeTag === tag) {
        activeTag = "";
        tagBtn.classList.remove("active");
      } else {
        for (const tb of document.querySelectorAll(".filter-tag")) {
          tb.classList.remove("active");
        }
        activeTag = tag || "";
        tagBtn.classList.add("active");
      }
      render();
      return;
    }

    // 21. Copy URL buttons on any card
    const copyUrlBtn = e.target.closest(".copy-btn");
    if (copyUrlBtn) {
      e.preventDefault();
      e.stopPropagation();
      const url = copyUrlBtn.dataset.url;
      if (url) {
        copyToClipboard(url, `Copied: ${url}`);
      }
      return;
    }
  });

  // Sort dropdown
  const sortSelect = document.getElementById("sort-select");
  sortSelect?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    render();
  });

  // Keyboard Shortcuts ('/' to focus search, 'Escape' to close modals / drawer / clear search)
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput?.focus();
    }
    if (e.key === "Escape") {
      closeBadgeModal();
      closeMatchmakerModal();
      closeWizardModal();
      closeSnippetDrawer();
      if (document.activeElement === searchInput) {
        searchInput.value = "";
        searchQuery = "";
        clearBtn?.classList.add("hidden");
        render();
        searchInput.blur();
      }
    }
  });
}

function openBadgeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.classList.add("overflow-hidden");
  }
}

function closeBadgeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    modal.style.display = "none";
    document.body.classList.remove("overflow-hidden");
  }
}

async function loadMatchmaker() {
  if (matchmakerData) return matchmakerData;
  try {
    const res = await fetch("matchmaker.json");
    if (res.ok) {
      matchmakerData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load matchmaker.json", err);
  }
  return matchmakerData;
}

async function openMatchmakerModal() {
  const modal = document.getElementById("matchmaker-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.classList.add("overflow-hidden");
  }
  const data = await loadMatchmaker();
  renderMatchmakerList(data);
}

function closeMatchmakerModal() {
  const modal = document.getElementById("matchmaker-modal");
  if (modal) {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    modal.style.display = "none";
    document.body.classList.remove("overflow-hidden");
  }
}

function renderMatchmakerList(data) {
  const list = document.getElementById("matchmaker-list");
  if (!list) return;

  if (!data || !Array.isArray(data.projects) || data.projects.length === 0) {
    list.innerHTML = `
      <div class="text-center py-10 text-slate-400 text-xs">
        <p class="font-bold text-slate-300 mb-1">No matchmaker projects available yet</p>
        <p>Run the GitHub Action sync or submit good first issues via DevShelf.</p>
      </div>
    `;
    return;
  }

  const filtered = data.projects.filter((p) => {
    if (activeMatchLang === "all") return true;
    return (p.language || "").toLowerCase().includes(activeMatchLang.toLowerCase());
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs">
        No projects currently seeking contributions for <b>${escapeHtml(activeMatchLang)}</b>.
      </div>
    `;
    return;
  }

  list.innerHTML = filtered
    .map((p) => {
      const issuesHtml = (p.issues || [])
        .map(
          (issue) => `
        <div class="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-slate-200 hover:text-purple-300 truncate">
              <a href="${issue.url}" target="_blank" rel="noreferrer">${escapeHtml(issue.title)}</a>
            </div>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-purple-900/60 text-purple-200 border border-purple-500/30 font-bold">${escapeHtml(issue.difficulty || "Starter Task")}</span>
              ${(issue.labels || [])
                .slice(0, 2)
                .map(
                  (l) =>
                    `<span class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400">${escapeHtml(l)}</span>`,
                )
                .join("")}
            </div>
          </div>
          <a href="${issue.url}" target="_blank" rel="noreferrer" class="shrink-0 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1 shadow-sm shadow-emerald-600/30">
            <span>Claim Issue →</span>
          </a>
        </div>
      `,
        )
        .join("");

      return `
      <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col gap-2.5">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-white text-sm">${escapeHtml(p.name)}</span>
              <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-950 text-purple-300 border border-purple-500/40">${escapeHtml(p.language || "Open Source")}</span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">${escapeHtml(p.description || "")}</p>
          </div>
          <a href="${p.repo}" target="_blank" rel="noreferrer" class="shrink-0 text-xs text-purple-400 hover:text-purple-300 font-mono">
            🐙 Repo
          </a>
        </div>
        ${
          p.seeking
            ? `<div class="text-[11px] text-amber-200/90 font-mono bg-amber-950/40 border border-amber-500/30 rounded px-2 py-1"><span class="font-bold text-amber-300">🎯 Seeking:</span> ${escapeHtml(p.seeking)}</div>`
            : ""
        }
        <div class="space-y-1.5 mt-1">
          ${issuesHtml}
        </div>
      </div>
    `;
    })
    .join("");
}

function getStatusTagClass(tag) {
  const lower = tag.toLowerCase();
  if (lower.includes("offline")) return "status-badge-offline";
  if (lower.includes("rate-limited") || lower.includes("ratelimit"))
    return "status-badge-ratelimit";
  if (lower.includes("no card") || lower.includes("nocard")) return "status-badge-nocard";
  if (lower.includes("credit card") || lower.includes("verify")) return "status-badge-verify";
  if (lower.includes("self-hostable") || lower.includes("selfhost")) return "status-badge-selfhost";
  return "bg-slate-800 text-slate-300 border-slate-700";
}

function openWizardModal() {
  const modal = document.getElementById("wizard-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.classList.add("overflow-hidden");
  }
  setWizardStep(1);
}

function closeWizardModal() {
  const modal = document.getElementById("wizard-modal");
  if (modal) {
    modal.classList.remove("show");
    modal.classList.add("hidden");
    modal.style.display = "none";
    document.body.classList.remove("overflow-hidden");
  }
}

function setWizardStep(step) {
  wizardState.step = step;

  const stepLabels = {
    1: "Step 1 of 4: Resource Basics",
    2: "Step 2 of 4: Verification Details",
    3: "Step 3 of 4: Structural Tags",
    4: "Step 4 of 4: Export & Submit",
  };

  const percents = {
    1: "25%",
    2: "50%",
    3: "75%",
    4: "100%",
  };

  const labelEl = document.getElementById("wizard-step-label");
  const percentEl = document.getElementById("wizard-step-percent");
  const fillEl = document.getElementById("wizard-progress-fill");

  if (labelEl) labelEl.textContent = stepLabels[step] || "";
  if (percentEl) percentEl.textContent = percents[step] || "";
  if (fillEl) fillEl.style.width = percents[step] || "25%";

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`wizard-dot-${i}`);
    const stepContainer = document.getElementById(`wizard-step-${i}`);

    if (dot) {
      if (i === step) {
        dot.className = "wizard-step-dot active";
      } else if (i < step) {
        dot.className = "wizard-step-dot completed";
      } else {
        dot.className = "wizard-step-dot";
      }
    }

    if (stepContainer) {
      if (i === step) {
        stepContainer.classList.remove("hidden");
      } else {
        stepContainer.classList.add("hidden");
      }
    }
  }

  const prevBtn = document.getElementById("wizard-prev-btn");
  const nextBtn = document.getElementById("wizard-next-btn");

  if (prevBtn) {
    prevBtn.disabled = step === 1;
  }

  if (nextBtn) {
    if (step === 4) {
      nextBtn.classList.add("hidden");
    } else {
      nextBtn.classList.remove("hidden");
      nextBtn.innerHTML = "<span>Next Step →</span>";
    }
  }

  if (step === 4) {
    generateWizardJsonOutput();
  }
}

function generateWizardJsonOutput() {
  const name = document.getElementById("wz-name")?.value?.trim() || "My Developer Tool";
  const shelf = document.getElementById("wz-shelf")?.value || "apis";
  const url = document.getElementById("wz-url")?.value?.trim() || "https://example.com";
  const repo = document.getElementById("wz-repo")?.value?.trim() || undefined;
  const desc =
    document.getElementById("wz-desc")?.value?.trim() ||
    "A fast, community-vetted developer utility.";
  const lang = document.getElementById("wz-lang")?.value?.trim() || undefined;
  const license = document.getElementById("wz-license")?.value?.trim() || undefined;
  const auth = document.getElementById("wz-auth")?.value || "No Key";
  const freetier =
    document.getElementById("wz-freetier")?.value?.trim() || "100% Free Forever (No Card Required)";

  const tags = [];
  if (document.getElementById("wz-tag-offline")?.checked) tags.push("100% Offline-Friendly");
  if (document.getElementById("wz-tag-selfhost")?.checked) tags.push("Self-Hostable");
  if (document.getElementById("wz-tag-nocard")?.checked) tags.push("No Card Required");
  if (document.getElementById("wz-tag-ratelimit")?.checked) tags.push("Rate-Limited");

  const outputObj = {
    name,
    url,
    description: desc,
    category: shelf,
    section: shelf,
    ...(repo ? { repo } : {}),
    ...(lang ? { language: lang } : {}),
    ...(license ? { license } : {}),
    auth,
    freeTier: freetier,
    ...(tags.length > 0 ? { statusTags: tags } : {}),
  };

  const outputEl = document.getElementById("wizard-json-output");
  if (outputEl) {
    outputEl.textContent = JSON.stringify(outputObj, null, 2);
  }
  return outputObj;
}

function submitWizardToGithub() {
  const data = generateWizardJsonOutput();
  const title = `[Resource Submission]: ${data.name}`;
  const body = `### Resource Name\n${data.name}\n\n### Target Shelf\n${data.category}.json\n\n### Website / Repo\n- Website: ${data.url}\n${data.repo ? `- GitHub Repo: ${data.repo}\n` : ""}\n### Description\n${data.description}\n\n### Validated JSON Schema Block\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n---\n*Generated by DevShelf Contribution Wizard*`;
  const ghUrl = `https://github.com/RitualDev-Lab/DevShelf/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  window.open(ghUrl, "_blank", "noreferrer");
}

function generateSnippets(item) {
  const url = item.url || item.repo || "https://example.com";
  const repoSlug = item.repo ? item.repo.replace(/^https?:\/\/github\.com\//, "") : "";

  return {
    curl: `# 1. cURL Quick Test for ${item.name}
curl -i -X GET "${url}" \\
  -H "Accept: application/json" \\
  -H "User-Agent: DevShelf-Client/1.0"`,
    fetch: `// 2. Fetch API (Node.js 18+ / Browser)
async function test${item.name.replace(/[^a-zA-Z0-9]/g, "")}() {
  const response = await fetch("${url}", {
    headers: { "Accept": "application/json" }
  });
  const data = await response.json().catch(() => response.text());
  console.log("Response:", data);
}

test${item.name.replace(/[^a-zA-Z0-9]/g, "")}();`,
    python: `# 3. Python requests snippet
import requests

response = requests.get(
    "${url}",
    headers={"Accept": "application/json"},
    timeout=10
)
print(f"Status: {response.status_code}")
print(response.json() if "json" in response.headers.get("content-type", "") else response.text[:200])`,
    cli: `# 4. CLI / Terminal Quickstart
${
  item.repo
    ? `# Clone & Inspect repository\ngit clone ${item.repo}.git\ncd ${repoSlug.split("/")[1] || "repo"}`
    : `# Inspect endpoint headers\ncurl -s -I "${url}"`
}`,
  };
}

function openSnippetDrawer(item) {
  drawerState.currentItem = item;
  const nameEl = document.getElementById("drawer-tool-name");
  const badgeEl = document.getElementById("drawer-tool-badge");
  const linkEl = document.getElementById("drawer-endpoint-link");

  if (nameEl) nameEl.textContent = item.name;
  if (badgeEl) badgeEl.textContent = item.category || item.type?.toUpperCase() || "TOOL";
  if (linkEl) linkEl.href = item.url || item.repo || "#";

  updateDrawerSnippet();

  const drawer = document.getElementById("snippet-drawer");
  if (drawer) {
    drawer.classList.remove("hidden");
    drawer.classList.add("open");
    drawer.style.display = "flex";
    document.body.classList.add("overflow-hidden");
  }
}

function closeSnippetDrawer() {
  const drawer = document.getElementById("snippet-drawer");
  if (drawer) {
    drawer.classList.remove("open");
    drawer.classList.add("hidden");
    drawer.style.display = "none";
    document.body.classList.remove("overflow-hidden");
  }
}

function updateDrawerSnippet() {
  if (!drawerState.currentItem) return;
  const snippets = generateSnippets(drawerState.currentItem);
  const codeEl = document.getElementById("drawer-code-content");
  if (codeEl) {
    codeEl.textContent = snippets[drawerState.activeTab] || snippets.curl;
  }
}

function getHealthBarsHtml(item) {
  let history = [1, 1, 1, 1, 1, 1, 1];
  let uptimePercent = 100;
  let latencyMs = 45;

  if (uptimeData?.endpoints) {
    const endpoint = uptimeData.endpoints.find(
      (ep) =>
        ep.name?.toLowerCase() === item.name?.toLowerCase() ||
        (item.url && ep.url === item.url) ||
        (item.repo && ep.url === item.repo),
    );
    if (endpoint) {
      if (Array.isArray(endpoint.history) && endpoint.history.length > 0) {
        history = endpoint.history;
      }
      if (typeof endpoint.uptimePercent === "number") {
        uptimePercent = endpoint.uptimePercent;
      }
      if (typeof endpoint.latencyMs === "number") {
        latencyMs = endpoint.latencyMs;
      }
    }
  }

  const segmentsHtml = history
    .slice(-7)
    .map((val) => {
      const cls =
        val === 1
          ? "health-segment-up"
          : val === 0
            ? "health-segment-down"
            : "health-segment-degraded";
      return `<span class="health-segment ${cls}"></span>`;
    })
    .join("");

  const tooltipText = `${uptimePercent}% Uptime • ${latencyMs}ms latency (7-day timeline)`;

  return `
    <div class="health-bars" title="${tooltipText}" aria-label="7-day operational status: ${tooltipText}">
      ${segmentsHtml}
      <span class="health-tooltip">${tooltipText}</span>
    </div>
  `;
}

function render() {
  const grid = document.getElementById("cards-grid");
  const emptyState = document.getElementById("empty-state");
  const countLabel = document.getElementById("results-count");
  if (!grid || !emptyState || !countLabel) return;

  const filtered = allResources.filter((item) => {
    // Category check
    let matchesCategory = true;
    if (activeCategory === "all") {
      matchesCategory = true;
    } else if (activeCategory === "repo") {
      matchesCategory = Boolean(item.repo);
    } else if (activeCategory === "boilerplate") {
      matchesCategory = item.type === "boilerplate";
    } else if (activeCategory === "contributors") {
      matchesCategory = Boolean(
        item.contributorsWanted || item.seeking || item.type === "contributors",
      );
    } else {
      matchesCategory = item.type === activeCategory;
    }

    if (!matchesCategory) return false;

    // Dynamic Quick-Filter Matrix check
    if (activeMatrixTags.size > 0) {
      for (const mTag of activeMatrixTags) {
        if (!matchesMatrixTag(item, mTag)) return false;
      }
    }

    // Quick tag check
    if (activeTag) {
      if (activeTag === "repo-only" && !item.repo) return false;
      if (activeTag === "offline") {
        const hasOffline = (item.statusTags || []).some((t) => t.toLowerCase().includes("offline"));
        if (!hasOffline) return false;
      }
      if (activeTag === "selfhost") {
        const hasSelfhost = (item.statusTags || []).some(
          (t) => t.toLowerCase().includes("self-hostable") || t.toLowerCase().includes("selfhost"),
        );
        if (!hasSelfhost) return false;
      }
      if (activeTag === "nocreditcard") {
        const hasNoCard =
          (item.statusTags || []).some(
            (t) => t.toLowerCase().includes("no card") || t.toLowerCase().includes("nocard"),
          ) ||
          item.auth === "No Key" ||
          item.freeTier?.toLowerCase().includes("no credit card");
        if (!hasNoCard) return false;
      }
      if (activeTag === "featured" && !item.featured) return false;
      if (activeTag === "no-key" && item.auth !== "No Key") return false;
      if (activeTag === "typescript" && !item.language?.toLowerCase().includes("typescript"))
        return false;
      if (activeTag === "rust" && !item.language?.toLowerCase().includes("rust")) return false;
      if (activeTag === "python" && !item.language?.toLowerCase().includes("python")) return false;
      if (activeTag === "go" && !item.language?.toLowerCase().includes("go")) return false;
    }

    // Search query check
    if (!searchQuery) return true;

    const targetText = [
      item.name,
      item.description,
      item.category,
      item.section,
      item.language,
      item.platform,
      item.freeTierCost,
      item.perkValue,
      item.seeking,
      item.auth,
      item.freeTier,
      item.license,
      item.repo,
      item.url,
      ...(item.statusTags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return targetText.includes(searchQuery);
  });

  // Apply sorting
  filtered.sort((a, b) => {
    if (currentSort === "featured") {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // Put items with repos or 1-click deploys before generic links
      if ((a.repo || a.deployUrl) && !(b.repo || b.deployUrl)) return -1;
      if (!(a.repo || a.deployUrl) && (b.repo || b.deployUrl)) return 1;
      return a.name.localeCompare(b.name);
    }
    if (currentSort === "name-asc") {
      return a.name.localeCompare(b.name);
    }
    if (currentSort === "category") {
      return (a.category || "").localeCompare(b.category || "");
    }
    return 0;
  });

  countLabel.textContent = `Showing ${filtered.length} of ${allResources.length} curated resources`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  grid.innerHTML = filtered.map((item) => createCardHtml(item)).join("");

  // Stagger card entrance animations
  const cards = grid.children;
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.setProperty("--delay", `${i * 0.04}s`);
  }
}

function createCardHtml(item) {
  const isRepo = Boolean(item.repo);
  const isBoilerplate = item.type === "boilerplate";
  const targetUrl = item.deployUrl || item.repo || item.url || "#";
  const displayRepoSlug = item.repo ? item.repo.replace(/^https?:\/\/github\.com\//, "") : "";
  const displayUrl = targetUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  const isFeatured = item.featured
    ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-mono">⭐ Featured</span>`
    : "";

  const isSeeking =
    item.contributorsWanted || item.seeking
      ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-mono">🤝 Up for Grabs</span>`
      : "";

  let categoryBadgeColor = "text-purple-200 bg-purple-950/80 border-purple-500/40";
  if (item.type === "api")
    categoryBadgeColor = "text-emerald-200 bg-emerald-950/80 border-emerald-500/40";
  if (item.type === "cli")
    categoryBadgeColor = "text-amber-200 bg-amber-950/80 border-amber-500/40";
  if (item.type === "cloud") categoryBadgeColor = "text-sky-200 bg-sky-950/80 border-sky-500/40";
  if (item.type === "testing")
    categoryBadgeColor = "text-rose-200 bg-rose-950/80 border-rose-500/40";
  if (item.type === "perks") categoryBadgeColor = "text-pink-200 bg-pink-950/80 border-pink-500/40";
  if (item.type === "boilerplate")
    categoryBadgeColor = "text-orange-200 bg-orange-950/80 border-orange-500/40";

  let metaBadges = "";
  if (item.type === "api") {
    const authColor =
      item.auth === "No Key"
        ? "text-emerald-300 bg-emerald-900/60 border-emerald-500/50 font-bold"
        : "text-cyan-300 bg-cyan-900/60 border-cyan-500/50 font-bold";
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border ${authColor}">${escapeHtml(item.auth || "Free")}</span>
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-slate-700 bg-slate-800 text-slate-200">${escapeHtml(item.rateLimit || "Free")}</span>
    `;
  } else if (item.type === "perks") {
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-pink-500/40 bg-pink-950/90 text-pink-200 font-bold">🎁 ${escapeHtml(item.perkValue || "Free Perk")}</span>
    `;
  } else if (item.type === "cloud") {
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-sky-500/40 bg-sky-950/90 text-sky-200 font-bold">☁️ ${escapeHtml(item.freeTier || "Generous Free Tier")}</span>
    `;
  } else if (item.type === "boilerplate") {
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-orange-500/40 bg-orange-950/90 text-orange-200 font-bold">🚀 ${escapeHtml(item.platform || "1-Click")}</span>
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-slate-700 bg-slate-800 text-slate-200">${escapeHtml(item.freeTierCost || "$0/month")}</span>
    `;
  } else {
    metaBadges = `
      ${item.language ? `<span class="px-2 py-0.5 text-xs font-mono font-semibold rounded border border-slate-700 bg-slate-800 text-slate-200">${escapeHtml(item.language)}</span>` : ""}
      ${item.license ? `<span class="px-2 py-0.5 text-xs font-mono rounded border border-purple-500/40 bg-purple-900/50 text-purple-200 font-semibold">${escapeHtml(item.license)}</span>` : ""}
    `;
  }

  // Seeking callout box
  const seekingBox = item.seeking
    ? `<div class="text-xs bg-purple-950/80 text-purple-200 border border-purple-500/40 rounded-lg p-2.5 mb-3 font-mono">
        <span class="font-bold text-amber-300">🎯 Seeking:</span> ${escapeHtml(item.seeking)}
      </div>`
    : "";

  // Action buttons
  let actionButtons = "";
  if (isBoilerplate) {
    actionButtons = `
      <a href="${item.deployUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition shadow-md shadow-orange-600/25">
        <span>🚀 Deploy to ${escapeHtml(item.platform || "Cloud")} →</span>
      </a>
    `;
    if (item.repo) {
      actionButtons += `
        <a href="${item.repo}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700" title="Source Code">
          <span>🐙 Repo</span>
        </a>
      `;
    }
  } else if (isRepo) {
    actionButtons = `
      <a href="${item.repo}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-600/25">
        <span>🐙 GitHub Repo →</span>
      </a>
    `;
    if (item.goodFirstIssues) {
      actionButtons += `
        <a href="${item.goodFirstIssues}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-600/20" title="Good First Issues">
          <span>🎯 Issues</span>
        </a>
      `;
    }
  } else {
    actionButtons = `
      <a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-600/25">
        <span>🌐 Visit Website →</span>
      </a>
    `;
  }

  const snippetActionBtn = `
    <button data-snippet-name="${escapeHtml(item.name)}" class="snippet-btn inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 shadow-sm" title="Copy-Paste-Go Snippet">
      <span>⚡ Snippet</span>
    </button>
  `;
  actionButtons += snippetActionBtn;

  const statusTagsHtml =
    Array.isArray(item.statusTags) && item.statusTags.length > 0
      ? `<div class="flex items-center flex-wrap gap-1.5 my-2">
          ${item.statusTags
            .map(
              (tag) =>
                `<span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${getStatusTagClass(tag)}">${escapeHtml(tag)}</span>`,
            )
            .join("")}
        </div>`
      : "";

  return `
    <div class="glass-card rounded-2xl p-5 flex flex-col justify-between relative group">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 class="text-base font-extrabold text-white group-hover:text-purple-300 transition line-clamp-1">
                <a href="${targetUrl}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>
              </h3>
              ${getHealthBarsHtml(item)}
              ${isFeatured}
              ${isSeeking}
            </div>
            ${
              isRepo
                ? `<a href="${item.repo}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 text-xs font-mono text-cyan-300 hover:text-cyan-200 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-md mt-1 font-semibold transition">
                    <span>🐙</span>
                    <span>github.com/${escapeHtml(displayRepoSlug)}</span>
                  </a>`
                : `<a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md mt-1 font-semibold transition">
                    <span>🌐</span>
                    <span>${escapeHtml(displayUrl)}</span>
                  </a>`
            }
          </div>

          <button data-url="${targetUrl}" class="copy-btn text-slate-300 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition" title="Copy URL">
            📋
          </button>
        </div>

        <div class="inline-block px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border my-2 ${categoryBadgeColor}">
          ${escapeHtml(item.category || item.section)}
        </div>
        ${statusTagsHtml}
        
        <p class="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3 mb-3 font-normal">${escapeHtml(item.description)}</p>
        ${seekingBox}
      </div>

      <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center flex-wrap gap-1.5">
          ${metaBadges}
        </div>
        <div class="flex items-center space-x-2 shrink-0">
          ${actionButtons}
        </div>
      </div>
    </div>
  `;
}

function copyToClipboard(text, successMsg = "Copied to clipboard!") {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(
      () => showToast(successMsg),
      () => fallbackCopy(text, successMsg),
    );
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(ta);
    if (successful) {
      showToast(successMsg);
    } else {
      showToast("Could not copy: please select manually.");
    }
  } catch (_err) {
    showToast("Could not copy: please select manually.");
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  const messageSpan = document.getElementById("toast-message");
  if (!toast || !messageSpan) return;
  messageSpan.textContent = msg;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}

// Immediate resilient execution regardless of document ready state
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
