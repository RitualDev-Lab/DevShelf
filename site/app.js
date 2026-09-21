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
  const totalEl = document.getElementById("stat-total");
  if (totalEl) totalEl.textContent = `${total} Resources`;
  const apiEl = document.getElementById("stat-apis");
  if (apiEl) apiEl.textContent = apisCount;
  const aiEl = document.getElementById("stat-ai");
  if (aiEl) aiEl.textContent = aiCount;
  const cliEl = document.getElementById("stat-cli");
  if (cliEl) cliEl.textContent = cliCount;
  const cloudEl = document.getElementById("stat-cloud");
  if (cloudEl) cloudEl.textContent = cloudCount;
  const perksEl = document.getElementById("stat-perks");
  if (perksEl) perksEl.textContent = perksCount;

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

  const featured = allResources.filter((r) => r.featured).slice(0, 6);
  if (featured.length === 0) return;

  spotlightContainer.innerHTML = featured
    .map((item) => {
      const targetUrl = item.url || item.repo;
      return `
      <div class="spotlight-card glass-card rounded-2xl p-5 flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center space-x-2">
              <h3 class="text-base font-extrabold text-white group-hover:text-purple-300 transition line-clamp-1">
                <a href="${targetUrl}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>
              </h3>
              <span class="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Spotlight</span>
            </div>
            <button data-url="${targetUrl}" class="copy-btn text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition" title="Copy URL">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div class="text-[11px] font-mono font-semibold text-purple-400 mb-2">${escapeHtml(item.category || item.section)}</div>
          <p class="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4">${escapeHtml(item.description)}</p>
        </div>
        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span class="text-[11px] font-mono text-slate-400">${escapeHtml(item.language || item.license || "Free Tier")}</span>
          <a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition">
            <span>Explore</span>
            <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
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

  searchInput.addEventListener("input", (e) => {
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
      searchInput.focus();
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
      activeCategory = btn.dataset.category;
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
        activeTag = tag;
        tagBtn.classList.add("active");
      }
      render();
    });
  }

  // Reset filters
  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    searchInput.value = "";
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
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }
}

function closeBadgeModal() {
  const modal = document.getElementById("badge-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }
}

function render() {
  const grid = document.getElementById("cards-grid");
  const emptyState = document.getElementById("empty-state");
  const countLabel = document.getElementById("results-count");

  const filtered = allResources.filter((item) => {
    // Category check
    const matchesCategory = activeCategory === "all" || item.type === activeCategory;
    if (!matchesCategory) return false;

    // Quick tag check
    if (activeTag) {
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

  // Re-run lucide icons on dynamically injected elements
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Attach copy listeners
  for (const btn of document.querySelectorAll(".copy-btn")) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.dataset.url;
      navigator.clipboard.writeText(url).then(() => {
        showToast(`Copied: ${url}`);
      });
    });
  }
}

function createCardHtml(item) {
  const targetUrl = item.url || item.repo;
  const isFeatured = item.featured
    ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">⭐ Featured</span>`
    : "";

  let categoryBadgeColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
  if (item.type === "api")
    categoryBadgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (item.type === "cli")
    categoryBadgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (item.type === "cloud") categoryBadgeColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
  if (item.type === "testing")
    categoryBadgeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (item.type === "perks") categoryBadgeColor = "text-pink-400 bg-pink-500/10 border-pink-500/20";

  let metaBadges = "";
  if (item.type === "api") {
    const authColor =
      item.auth === "No Key"
        ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30 font-semibold"
        : "text-cyan-300 bg-cyan-500/15 border-cyan-500/30";
    metaBadges = `
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border ${authColor}">${item.auth}</span>
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-300">${item.rateLimit || "Free"}</span>
    `;
  } else if (item.type === "perks") {
    metaBadges = `
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border border-pink-500/30 bg-pink-500/15 text-pink-300">🎁 ${escapeHtml(item.perkValue)}</span>
    `;
  } else if (item.type === "cloud") {
    metaBadges = `
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border border-sky-500/30 bg-sky-500/15 text-sky-300">🎁 ${escapeHtml(item.freeTier || "Generous Free Tier")}</span>
    `;
  } else if (item.type === "contributors") {
    metaBadges = `
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border border-violet-500/30 bg-violet-500/15 text-violet-300">🎯 Seeking: ${escapeHtml(item.seeking || "Contributors")}</span>
    `;
  } else {
    metaBadges = `
      ${item.language ? `<span class="px-2 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800/90 text-slate-300">${escapeHtml(item.language)}</span>` : ""}
      ${item.license ? `<span class="px-2 py-0.5 text-[10px] font-mono rounded border border-purple-500/20 bg-purple-500/10 text-purple-300">${escapeHtml(item.license)}</span>` : ""}
    `;
  }

  return `
    <div class="glass-card rounded-2xl p-5 flex flex-col justify-between relative group">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2.5">
          <div class="flex items-center space-x-2">
            <h3 class="text-base font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
              <a href="${targetUrl}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>
            </h3>
            ${isFeatured}
          </div>
          <button data-url="${targetUrl}" class="copy-btn text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition" title="Copy URL">
            <i data-lucide="copy" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="inline-block px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-full border mb-2.5 ${categoryBadgeColor}">
          ${escapeHtml(item.category || item.section)}
        </div>
        
        <p class="text-xs text-slate-300/90 leading-relaxed line-clamp-3 mb-4">${escapeHtml(item.description)}</p>
      </div>

      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div class="flex items-center flex-wrap gap-1.5 overflow-hidden">
          ${metaBadges}
        </div>
        <a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition shrink-0">
          <span>Visit</span>
          <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
        </a>
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
