const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoDir = process.cwd();
const wikiSourceDir = path.join(repoDir, "wiki");
const tempWikiDir = path.join(repoDir, ".wiki-tmp");

console.log("?? [DevShelf Wiki Sync] Preparing wiki pages for deployment...");

if (!fs.existsSync(wikiSourceDir)) {
  console.error("? Error: wiki/ directory does not exist.");
  process.exit(1);
}

try {
  if (fs.existsSync(tempWikiDir)) {
    fs.rmSync(tempWikiDir, { recursive: true, force: true });
  }

  // Clone or init
  console.log("?? Connecting to GitHub Wiki remote...");
  try {
    execSync("git clone https://github.com/RitualDev-Lab/DevShelf.wiki.git .wiki-tmp", {
      cwd: repoDir,
      stdio: "pipe",
    });
    console.log("? Cloned existing wiki repository.");
  } catch (err) {
    console.log("?? Wiki git repository not yet initialized by GitHub.");
    console.log(
      '?? To activate: Visit https://github.com/RitualDev-Lab/DevShelf/wiki and click "Create the first page".',
    );
    console.log("?? All wiki pages are safely archived in the /wiki directory in the main repo.");
    process.exit(0);
  }

  // Copy all files from wiki/ to .wiki-tmp/
  const files = fs.readdirSync(wikiSourceDir);
  for (const file of files) {
    const src = path.join(wikiSourceDir, file);
    const dest = path.join(tempWikiDir, file);
    fs.copyFileSync(src, dest);
    console.log(`  + Synced: ${file}`);
  }

  // Commit and push
  execSync("git add .", { cwd: tempWikiDir });
  try {
    execSync('git commit -m "docs(wiki): update DevShelf wiki documentation"', {
      cwd: tempWikiDir,
    });
    execSync("git push origin master", { cwd: tempWikiDir });
    console.log("?? Successfully published all wiki pages to GitHub Wiki!");
  } catch (commitErr) {
    console.log("?? No changes to commit in wiki repository.");
  }
} catch (error) {
  console.error("? Wiki sync error:", error.message);
} finally {
  if (fs.existsSync(tempWikiDir)) {
    try {
      fs.rmSync(tempWikiDir, { recursive: true, force: true });
    } catch (_) {}
  }
}
