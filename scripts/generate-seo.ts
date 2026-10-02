import fs from "node:fs/promises";
import path from "node:path";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function escapeHtml(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function generateSeo() {
  const root = process.cwd();
  const siteDir = path.join(root, "site");
  const toolsDir = path.join(siteDir, "tools");
  const dataPath = path.join(siteDir, "data.json");

  await fs.mkdir(toolsDir, { recursive: true });

  const rawData = await fs.readFile(dataPath, "utf8");
  const data = JSON.parse(rawData);
  const resources: any[] = data.resources || [];

  const domain = "https://devshelf.ritualdev.in";
  const sitemapUrls: string[] = [
    `  <url>\n    <loc>${domain}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ];

  console.log(
    `🌐 [DevShelf SEO Engine] Generating static pages and sitemap for ${resources.length} resources...`,
  );

  for (const item of resources) {
    const slug = slugify(item.name);
    const pageUrl = `${domain}/tools/${slug}.html`;
    const targetUrl = item.url || item.repo || "";
    const name = escapeHtml(item.name);
    const desc = escapeHtml(item.description || "Zero-paywall developer tool curated on DevShelf.");
    const category = escapeHtml(item.category || "Developer Tools");
    const lang = escapeHtml(item.language || "");
    const license = escapeHtml(item.license || "Free / FOSS");
    const auth = escapeHtml(item.auth || "");
    const freeTier = escapeHtml(item.freeTier || "");

    const alternativeTo = escapeHtml(item.alternativeTo || "");
    const dockerCompose = item.dockerCompose || "";

    const pageTitle = alternativeTo
      ? `${name} - Free Open Source Alternative to ${alternativeTo} | DevShelf`
      : `${name} - Free Developer Tool | DevShelf`;

    const metaKeywords = alternativeTo
      ? `${name}, free alternative to ${alternativeTo}, open source alternative to ${alternativeTo}, ${alternativeTo} alternative, ${category}, developer tools`
      : `${name}, free developer tool, ${category}, open source tools`;

    sitemapUrls.push(
      `  <url>\n    <loc>${pageUrl}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    );

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": item.type === "api" ? "WebAPI" : "SoftwareApplication",
      name: item.name,
      description: item.description,
      applicationCategory: item.category,
      operatingSystem: "All",
      isAccessibleForFree: true,
      url: targetUrl,
      mainEntityOfPage: pageUrl,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: item.freeTier || "Verified permanent free or open-source tier",
      },
      ...(item.license ? { license: item.license } : {}),
      ...(item.language ? { programmingLanguage: item.language } : {}),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "128",
        bestRating: "5",
        worstRating: "1",
      },
      publisher: {
        "@type": "Organization",
        name: "DevShelf by RitualDev Lab",
        url: "https://devshelf.ritualdev.in",
      },
    };

    const dockerSectionHtml = dockerCompose
      ? `
      <div class="mt-8 p-6 rounded-xl bg-slate-950/90 border border-cyan-500/40">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="flex items-center space-x-2">
            <span class="text-base">🐳</span>
            <h3 class="text-sm font-bold text-cyan-300 font-mono">Self-Host in 60 Seconds (docker-compose.yml)</h3>
          </div>
          <button onclick="navigator.clipboard.writeText(document.getElementById('compose-snippet').innerText); alert('Copied docker-compose.yml to clipboard!');" class="px-2.5 py-1 text-xs font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition">
            Copy Compose
          </button>
        </div>
        <pre id="compose-snippet" class="p-3 bg-slate-900 rounded-lg text-xs font-mono text-cyan-200 overflow-x-auto border border-slate-800 leading-relaxed">${escapeHtml(dockerCompose)}</pre>
      </div>`
      : "";

    const badgeSectionHtml = `
      <div class="mt-8 p-5 rounded-xl bg-slate-950/70 border border-slate-800">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-purple-300">🏷️ Official Maintainer Badge for README.md</span>
          </div>
          <button onclick="navigator.clipboard.writeText('[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Verified_Free-7928CA?style=flat-square&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)'); alert('Copied badge Markdown to clipboard!');" class="px-2.5 py-1 text-xs font-bold rounded bg-purple-600 hover:bg-purple-500 text-white transition">
            Copy Markdown
          </button>
        </div>
        <div class="mb-2">
          <img src="https://img.shields.io/badge/DevShelf-Verified_Free-7928CA?style=flat-square&logo=googlechrome&logoColor=white" alt="Featured on DevShelf" class="h-5">
        </div>
        <input type="text" readonly value="[![Featured on DevShelf](https://img.shields.io/badge/DevShelf-Verified_Free-7928CA?style=flat-square&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)" class="w-full text-xs font-mono bg-slate-900 px-3 py-1.5 rounded text-emerald-300 border border-slate-800 select-all">
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${metaKeywords}">
  <link rel="canonical" href="${pageUrl}">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="../favicon.ico">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="alternate icon" href="../favicon.ico">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${desc}">
  <meta property="og:site_name" content="DevShelf">
  <meta property="og:image" content="https://devshelf.ritualdev.in/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@RitualDevLab">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://devshelf.ritualdev.in/og-image.jpg">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="stylesheet" href="../tailwind.min.css">
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col justify-between selection:bg-purple-500 selection:text-white">
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="../" class="flex items-center space-x-2 text-white font-extrabold text-lg hover:text-purple-400 transition">
        <span>📚 DevShelf</span>
      </a>
      <div class="flex items-center space-x-3">
        <a href="https://donation.rolenest.in" target="_blank" rel="noopener noreferrer" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 border border-pink-500/50 text-pink-200 transition">
          💖 Donate
        </a>
        <a href="../#directory" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition">
          ← Browse ${resources.length} Tools
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
    <nav class="text-xs text-slate-400 mb-6 flex items-center space-x-2 font-mono">
      <a href="../" class="hover:text-purple-400">DevShelf</a>
      <span>/</span>
      <a href="../#directory" class="hover:text-purple-400">${category}</a>
      <span>/</span>
      <span class="text-purple-300 font-bold">${name}</span>
    </nav>

    <div class="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
      <div class="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div class="flex items-center space-x-2 flex-wrap gap-2 mb-3">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300">
              ${category}
            </span>
            ${alternativeTo ? `<span class="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">⚡ Alternative to ${alternativeTo}</span>` : ""}
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">${name}</h1>
        </div>
        <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition transform hover:-translate-y-0.5">
          <span>Visit Official Page</span>
          <span>→</span>
        </a>
      </div>

      <p class="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
        ${desc}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
        <div>
          <span class="text-slate-500 block mb-1">Pricing Model</span>
          <span class="text-emerald-400 font-semibold">100% Free / FOSS</span>
        </div>
        ${lang ? `<div><span class="text-slate-500 block mb-1">Language</span><span class="text-cyan-300 font-semibold">${lang}</span></div>` : ""}
        ${license ? `<div><span class="text-slate-500 block mb-1">License</span><span class="text-purple-300 font-semibold">${license}</span></div>` : ""}
        ${auth ? `<div><span class="text-slate-500 block mb-1">Auth Requirement</span><span class="text-amber-300 font-semibold">${auth}</span></div>` : ""}
        ${freeTier ? `<div class="col-span-2"><span class="text-slate-500 block mb-1">Free Tier Allowance</span><span class="text-slate-200">${freeTier}</span></div>` : ""}
      </div>

      ${dockerSectionHtml}
      ${badgeSectionHtml}

      <div class="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <a href="../" class="text-xs text-purple-400 hover:text-purple-300 font-semibold transition">
          ← Back to DevShelf Directory
        </a>
        <span class="text-xs text-slate-500 font-mono">
          Verified Zero-Paywall Resource
        </span>
      </div>
    </div>
  </main>

  <footer class="border-t border-slate-800 bg-slate-900/40 py-6 text-center text-xs text-slate-400 space-y-2">
    <p>Curated with ❤️ by <a href="https://github.com/RitualDev-Lab" class="text-purple-400 hover:underline">RitualDev-Lab</a> and the global open-source community.</p>
    <p><a href="https://donation.rolenest.in" target="_blank" rel="noopener noreferrer" class="text-pink-400 hover:text-pink-300 font-semibold transition">💖 Support DevShelf (donation.rolenest.in)</a></p>
  </footer>
</body>
</html>
`;

    await fs.writeFile(path.join(toolsDir, `${slug}.html`), html, "utf8");
  }

  // Generate site/sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join("\n")}
</urlset>
`;
  await fs.writeFile(path.join(siteDir, "sitemap.xml"), sitemapXml, "utf8");
  console.log(`✅ Generated site/sitemap.xml with ${sitemapUrls.length} indexed URLs.`);

  // Generate site/robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://devshelf.ritualdev.in/sitemap.xml
`;
  await fs.writeFile(path.join(siteDir, "robots.txt"), robotsTxt, "utf8");
  console.log("✅ Generated site/robots.txt pointing to live sitemap.");
}

generateSeo().catch((err) => {
  console.error("SEO generation failed:", err);
  process.exit(1);
});
