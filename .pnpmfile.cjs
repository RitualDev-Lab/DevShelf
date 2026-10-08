function readPackage(pkg) {
  if (pkg.dependencies?.["postcss-selector-parser"]) {
    pkg.dependencies["postcss-selector-parser"] = "^7.1.6";
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
