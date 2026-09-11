let allResources = [];
let activeCategory = "all";
let searchQuery = "";

async function init() {
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    allResources = data.resources || [];

    // Update stats bar
    document.getElementById("stat-total").textContent =
      `${data.totalCount || allResources.length} Resources Listed`;
    document.getElementById("stat-apis").textContent = data.counts?.apis || 0;
    document.getElementById("stat-tools").textContent =
      (data.counts?.cliTools || 0) + (data.counts?.aiTools || 0) + (data.counts?.testingQa || 0);
    document.getElementById("stat-perks").textContent = data.counts?.perks || 0;

    setupListeners();
    render();
  } catch (err) {
    console.error("Failed to load data.json:", err);
  }
}

function setupListeners() {
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    render();
  });

  // Shortcut key '/' to focus search
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Category pill filter buttons
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

  // Reset filters button
  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    activeCategory = "all";
    for (const b of document.querySelectorAll(".category-pill")) {
      b.classList.remove("active");
    }
    document.querySelector('.category-pill[data-category="all"]')?.classList.add("active");
    render();
  });
}

function render() {
  const grid = document.getElementById("cards-grid");
  const emptyState = document.getElementById("empty-state");
  const countLabel = document.getElementById("results-count");

  const filtered = allResources.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.type === activeCategory;
    if (!matchesCategory) return false;

    if (!searchQuery) return true;

    const targetText = [
      item.name,
      item.description,
      item.category,
      item.language,
      item.perkValue,
      item.seeking,
      item.auth,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return targetText.includes(searchQuery);
  });

  countLabel.textContent = `Showing ${filtered.length} of ${allResources.length} resources`;

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
        showToast(`Copied to clipboard: ${url}`);
      });
    });
  }
}

function createCardHtml(item) {
  const targetUrl = item.url || item.repo;
  const isFeatured = item.featured
    ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">⭐ Featured</span>`
    : "";

  let metaBadges = "";
  if (item.type === "api") {
    const authColor =
      item.auth === "No Key"
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
    metaBadges = `
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border ${authColor}">${item.auth}</span>
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-300">${item.rateLimit || "Free"}</span>
    `;
  } else if (item.type === "perks") {
    metaBadges = `
      <span class="px-2 py-0.5 text-[10px] font-mono rounded border border-pink-500/30 bg-pink-500/10 text-pink-300">🎁 ${item.perkValue}</span>
    `;
  } else {
    metaBadges = `
      ${item.language ? `<span class="px-2 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-300">${item.language}</span>` : ""}
      ${item.license ? `<span class="px-2 py-0.5 text-[10px] font-mono rounded border border-purple-500/20 bg-purple-500/10 text-purple-300">${item.license}</span>` : ""}
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

        <div class="text-xs font-semibold text-purple-400/90 mb-2">${escapeHtml(item.category || item.section)}</div>
        <p class="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">${escapeHtml(item.description)}</p>
      </div>

      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div class="flex items-center flex-wrap gap-1.5 overflow-hidden">
          ${metaBadges}
        </div>
        <a href="${targetUrl}" target="_blank" rel="noreferrer" class="inline-flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition shrink-0">
          <span>Visit</span>
          <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
        </a>
      </div>
    </div>
  `;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  const messageSpan = document.getElementById("toast-message");
  messageSpan.textContent = msg;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 2400);
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
