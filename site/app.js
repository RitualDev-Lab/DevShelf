let allResources = [];
let activeCategory = "all";
let activeTag = "";
let searchQuery = "";
let currentSort = "featured";

const BADGE_MARKDOWNS = {
  purple:
    "[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)",
  cyan: "[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Curated%20Resource-00E5FF?style=for-the-badge&logo=github&logoColor=black)](https://devshelf.ritualdev.in/)",
  flat: "[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-blueviolet?style=flat-square&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)",
};

async function init() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    allResources = data.resources || [];

    // Populate counts in stats bar and category pills
    updateStatsAndPills(data);

    // Render spotlight
    renderSpotlight();

    // Setup interactive event listeners
    setupListeners();

    // Initial render
    render();
  } catch (err) {
    console.error("Failed to load data.json:", err);
  }
}

function updateStatsAndPills(data) {
  const total = data.totalCount || allResources.length;
  const apisCount = data.counts?.apis || 0;
  const aiCount = data.counts?.aiTools || 0;
  const cliCount = data.counts?.cliTools || 0;
  const testingCount = data.counts?.testingQa || 0;
  const cloudCount = data.counts?.freeCloud || 0;
  const perksCount = data.counts?.perks || 0;
  const contributorsCount = data.counts?.contributors || 0;

  // Stats bar
  setElText("stat-total", `${total} Resources`);
  setElText("stat-apis", apisCount);
  setElText("stat-ai", aiCount);
  setElText("stat-cli", cliCount);
  setElText("stat-cloud", cloudCount);
  setElText("stat-perks", perksCount);

  // Pills counts
  setElText("pill-count-all", total);
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
  if (!spotlightContainer) return;

  // Select top featured or prominent open source tools
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
      const displayUrl = targetUrl ? targetUrl.replace(/^https?:\/\/(www\.)?/, "") : "";

      return `
      <div class="spotlight-card rounded-2xl p-5 flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-base font-extrabold text-white group-hover:text-purple-300 transition">
                  <a href="${targetUrl}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>
                </h3>
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/25 text-amber-200 border border-amber-500/40">Spotlight</span>
              </div>
              <div class="text-xs font-mono text-purple-300 mt-0.5">${escapeHtml(displayUrl)}</div>
            </div>
            <button data-url="${targetUrl}" class="copy-btn text-slate-300 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition" title="Copy URL">
              📋
            </button>
          </div>
          
          <p class="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3 my-3">${escapeHtml(item.description)}</p>
        </div>

        <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            ${escapeHtml(item.language || item.license || "Free Tier")}
          </span>
          <a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold ${isRepo ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white"} transition shadow">
            <span>${isRepo ? "🐙 GitHub Repo →" : "🌐 Website →"}</span>
          </a>
        </div>
      </div>
    `;
    })
    .join("");
}

function setupListeners() {
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

  clearBtn?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    searchQuery = "";
    clearBtn.classList.add("hidden");
    render();
    searchInput.focus();
  });

  // Shortcut keys
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput?.focus();
    }
    if (e.key === "Escape") {
      closeBadgeModal();
      if (document.activeElement === searchInput) {
        searchInput.value = "";
        searchQuery = "";
        clearBtn?.classList.add("hidden");
        render();
        searchInput.blur();
      }
    }
  });

  // Sort dropdown
  const sortSelect = document.getElementById("sort-select");
  sortSelect?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    render();
  });

  // Category pills
  for (const btn of document.querySelectorAll(".category-pill")) {
    btn.addEventListener("click", () => {
      for (const b of document.querySelectorAll(".category-pill")) {
        b.classList.remove("active");
      }
      btn.classList.add("active");
      activeCategory = btn.dataset.category || "all";
      render();
    });
  }

  // Quick filter tags
  for (const tagBtn of document.querySelectorAll(".filter-tag")) {
    tagBtn.addEventListener("click", () => {
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
    });
  }

  // Reset filters
  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    searchQuery = "";
    activeCategory = "all";
    activeTag = "";
    clearBtn?.classList.add("hidden");
    for (const b of document.querySelectorAll(".category-pill")) {
      b.classList.remove("active");
    }
    document.querySelector('.category-pill[data-category="all"]')?.classList.add("active");
    for (const tb of document.querySelectorAll(".filter-tag")) {
      tb.classList.remove("active");
    }
    render();
  });

  // Badge Modal Handlers
  document.getElementById("open-badge-modal-btn")?.addEventListener("click", openBadgeModal);
  document.getElementById("nav-badge-btn")?.addEventListener("click", openBadgeModal);
  document.getElementById("hero-badge-btn")?.addEventListener("click", openBadgeModal);
  document.getElementById("close-badge-modal-btn")?.addEventListener("click", closeBadgeModal);

  document.getElementById("badge-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "badge-modal") {
      closeBadgeModal();
    }
  });

  // Copy badge buttons in modal
  for (const btn of document.querySelectorAll(".copy-badge-btn")) {
    btn.addEventListener("click", () => {
      const badgeType = btn.dataset.badge;
      const text = BADGE_MARKDOWNS[badgeType];
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Badge markdown copied to clipboard!");
        });
      }
    });
  }
}

function openBadgeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.classList.add("overflow-hidden");
  }
}

function closeBadgeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.classList.remove("overflow-hidden");
  }
}

function render() {
  const grid = document.getElementById("cards-grid");
  const emptyState = document.getElementById("empty-state");
  const countLabel = document.getElementById("results-count");
  if (!grid || !emptyState || !countLabel) return;

  const filtered = allResources.filter((item) => {
    // Category check
    const matchesCategory = activeCategory === "all" || item.type === activeCategory;
    if (!matchesCategory) return false;

    // Quick tag check
    if (activeTag) {
      if (activeTag === "repo-only" && !item.repo) return false;
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
      item.language,
      item.perkValue,
      item.seeking,
      item.auth,
      item.freeTier,
      item.license,
      item.repo,
      item.url,
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

  // Attach copy listeners
  for (const btn of document.querySelectorAll(".copy-btn")) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.dataset.url;
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          showToast(`Copied: ${url}`);
        });
      }
    });
  }
}

function createCardHtml(item) {
  const isRepo = Boolean(item.repo);
  const targetUrl = item.repo || item.url || "#";
  const displayRepoSlug = item.repo ? item.repo.replace(/^https?:\/\/github\.com\//, "") : "";
  const displayUrl = targetUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  const isFeatured = item.featured
    ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-mono">⭐ Featured</span>`
    : "";

  let categoryBadgeColor = "text-purple-200 bg-purple-950 border-purple-500/40";
  if (item.type === "api")
    categoryBadgeColor = "text-emerald-200 bg-emerald-950 border-emerald-500/40";
  if (item.type === "cli") categoryBadgeColor = "text-amber-200 bg-amber-950 border-amber-500/40";
  if (item.type === "cloud") categoryBadgeColor = "text-sky-200 bg-sky-950 border-sky-500/40";
  if (item.type === "testing") categoryBadgeColor = "text-rose-200 bg-rose-950 border-rose-500/40";
  if (item.type === "perks") categoryBadgeColor = "text-pink-200 bg-pink-950 border-pink-500/40";

  let metaBadges = "";
  if (item.type === "api") {
    const authColor =
      item.auth === "No Key"
        ? "text-emerald-300 bg-emerald-900/60 border-emerald-500/40 font-bold"
        : "text-cyan-300 bg-cyan-900/60 border-cyan-500/40 font-bold";
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border ${authColor}">${item.auth}</span>
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-slate-700 bg-slate-800 text-slate-200">${item.rateLimit || "Free"}</span>
    `;
  } else if (item.type === "perks") {
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-pink-500/40 bg-pink-950/80 text-pink-200 font-bold">🎁 ${escapeHtml(item.perkValue)}</span>
    `;
  } else if (item.type === "cloud") {
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-sky-500/40 bg-sky-950/80 text-sky-200 font-bold">🎁 ${escapeHtml(item.freeTier || "Generous Free Tier")}</span>
    `;
  } else if (item.type === "contributors") {
    metaBadges = `
      <span class="px-2 py-0.5 text-xs font-mono rounded border border-purple-500/40 bg-purple-950/80 text-purple-200 font-bold">🎯 Seeking: ${escapeHtml(item.seeking || "Contributors")}</span>
    `;
  } else {
    metaBadges = `
      ${item.language ? `<span class="px-2 py-0.5 text-xs font-mono font-semibold rounded border border-slate-700 bg-slate-800 text-slate-200">${escapeHtml(item.language)}</span>` : ""}
      ${item.license ? `<span class="px-2 py-0.5 text-xs font-mono rounded border border-purple-500/30 bg-purple-900/40 text-purple-200">${escapeHtml(item.license)}</span>` : ""}
    `;
  }

  // Action buttons
  let actionButtons = "";
  if (isRepo) {
    actionButtons = `
      <a href="${item.repo}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow">
        <span>🐙 View Repo</span>
        <span>→</span>
      </a>
    `;
    if (item.goodFirstIssues) {
      actionButtons += `
        <a href="${item.goodFirstIssues}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 transition">
          <span>🎯 Issues</span>
        </a>
      `;
    }
  } else {
    actionButtons = `
      <a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow">
        <span>🌐 Visit Website</span>
        <span>→</span>
      </a>
    `;
  }

  return `
    <div class="glass-card rounded-2xl p-5 flex flex-col justify-between relative group">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="flex items-center space-x-2 flex-wrap">
              <h3 class="text-base font-extrabold text-white group-hover:text-purple-300 transition line-clamp-1">
                <a href="${targetUrl}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>
              </h3>
              ${isFeatured}
            </div>
            ${isRepo ? `<div class="text-xs font-mono text-cyan-300 font-semibold mt-0.5">github.com/${escapeHtml(displayRepoSlug)}</div>` : `<div class="text-xs font-mono text-slate-300 font-semibold mt-0.5">${escapeHtml(displayUrl)}</div>`}
          </div>

          <button data-url="${targetUrl}" class="copy-btn text-slate-300 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition" title="Copy URL">
            📋
          </button>
        </div>

        <div class="inline-block px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border my-2.5 ${categoryBadgeColor}">
          ${escapeHtml(item.category || item.section)}
        </div>
        
        <p class="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3 mb-4 font-normal">${escapeHtml(item.description)}</p>
      </div>

      <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div class="flex items-center flex-wrap gap-1.5 overflow-hidden">
          ${metaBadges}
        </div>
        <div class="flex items-center space-x-2 shrink-0">
          ${actionButtons}
        </div>
      </div>
    </div>
  `;
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

window.addEventListener("DOMContentLoaded", init);
