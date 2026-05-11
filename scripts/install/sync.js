// scripts/install/sync.js
// Idempotent copy and directory synchronization helpers for installer modes.

const fs = require("fs");
const path = require("path");

function copyPaths(repoRoot, sourcePaths, destinationRoot, options) {
  const report = {
    copied: [],
    updated: [],
    skipped: [],
    createdDirectories: [],
  };

  for (const sourcePath of sourcePaths) {
    const from = path.join(repoRoot, sourcePath);
    const to = path.join(destinationRoot, sourcePath);
    copyEntry(from, to, options, report);
  }

  return report;
}

function copyEntry(from, to, options, report) {
  const sourceStat = fs.statSync(from);
  if (sourceStat.isDirectory()) {
    ensureDir(to, options, report);
    const entries = fs.readdirSync(from, { withFileTypes: true });
    for (const entry of entries) {
      copyEntry(path.join(from, entry.name), path.join(to, entry.name), options, report);
    }
    return;
  }

  const existing = safeRead(to);
  const next = fs.readFileSync(from);

  if (existing && Buffer.compare(existing, next) === 0) {
    report.skipped.push(to);
    return;
  }

  ensureDir(path.dirname(to), options, report);
  if (!options.dryRun) {
    fs.writeFileSync(to, next);
  }

  if (existing) {
    report.updated.push(to);
  } else {
    report.copied.push(to);
  }
}

function ensureDir(targetDir, options, report) {
  if (fs.existsSync(targetDir)) {
    return;
  }

  if (!options.dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  report.createdDirectories.push(targetDir);
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    return null;
  }
}

module.exports = {
  copyPaths,
};
