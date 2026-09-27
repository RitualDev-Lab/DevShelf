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
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      url: targetUrl,
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Free Developer Tool | DevShelf</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${pageUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${name} - Free Developer Tool | DevShelf">
  <meta property="og:description" content="${desc}">
  <meta property="og:site_name" content="DevShelf">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${name} - DevShelf">
  <meta name="twitter:description" content="${desc}">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>

  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col justify-between selection:bg-purple-500 selection:text-white">
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="../" class="flex items-center space-x-2 text-white font-extrabold text-lg hover:text-purple-400 transition">
        <span>📚 DevShelf</span>
      </a>
      <a href="../#directory" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition">
        ← Browse 500+ Tools
      </a>
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
          <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300 mb-3">
            ${category}
          </span>
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

  <footer class="border-t border-slate-800 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
    <p>Curated with ❤️ by <a href="https://github.com/RitualDev-Lab" class="text-purple-400 hover:underline">RitualDev-Lab</a> and the global open-source community.</p>
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
