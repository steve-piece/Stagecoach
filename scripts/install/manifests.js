// scripts/install/manifests.js
// Reads Stagecoach plugin metadata and resolves installable skill paths.

const fs = require("fs");
const path = require("path");

function readPluginMetadata(repoRoot) {
  const cursorManifestPath = path.join(repoRoot, ".cursor-plugin", "plugin.json");
  const claudeManifestPath = path.join(repoRoot, ".claude-plugin", "plugin.json");

  return {
    cursor: readJson(cursorManifestPath),
    claude: readJson(claudeManifestPath),
    cursorManifestPath,
    claudeManifestPath,
  };
}

function buildSkillIndex(repoRoot) {
  const skillsRoot = path.join(repoRoot, "skills");
  const skillDirs = listSkillDirectories(skillsRoot);
  const index = new Map();

  for (const relativeSkillDir of skillDirs) {
    const basename = path.basename(relativeSkillDir);
    const skillPath = path.join("skills", relativeSkillDir);

    if (!index.has(relativeSkillDir)) {
      index.set(relativeSkillDir, skillPath);
    }

    if (!index.has(basename)) {
      index.set(basename, skillPath);
    }
  }

  return {
    allSkillPaths: skillDirs.map((dir) => path.join("skills", dir)),
    map: index,
  };
}

function resolveRequestedSkills(requestedSkills, skillIndex) {
  if (!requestedSkills || requestedSkills.length === 0) {
    return skillIndex.allSkillPaths;
  }

  const resolved = new Set();
  for (const rawSkill of requestedSkills) {
    const skill = String(rawSkill).trim();
    if (!skill) {
      continue;
    }

    if (skillIndex.map.has(skill)) {
      resolved.add(skillIndex.map.get(skill));
      continue;
    }

    const normalized = skill.startsWith("skills/") ? skill : `skills/${skill}`;
    if (skillIndex.allSkillPaths.includes(normalized)) {
      resolved.add(normalized);
      continue;
    }

    throw new Error(`Unknown skill "${skill}".`);
  }

  if (resolved.size === 0) {
    throw new Error("No valid skills selected.");
  }

  return [...resolved];
}

function resolveCommandsForSkills(repoRoot, skillPaths) {
  const commandsDir = path.join(repoRoot, "commands");
  const files = fs.readdirSync(commandsDir, { withFileTypes: true });
  const selected = [];

  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const absolutePath = path.join(commandsDir, entry.name);
    const content = fs.readFileSync(absolutePath, "utf8");

    if (skillPaths.some((skillPath) => content.includes(`../${skillPath}/SKILL.md`))) {
      selected.push(path.join("commands", entry.name));
    }
  }

  return selected;
}

function listSkillDirectories(skillsRoot) {
  const results = [];
  walk(skillsRoot, skillsRoot, results);
  return results.sort();
}

function walk(root, current, results) {
  const entries = fs.readdirSync(current, { withFileTypes: true });
  const hasSkillFile = entries.some((entry) => entry.isFile() && entry.name === "SKILL.md");

  if (hasSkillFile) {
    results.push(path.relative(root, current));
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    walk(root, path.join(current, entry.name), results);
  }
}

function readJson(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

module.exports = {
  readPluginMetadata,
  buildSkillIndex,
  resolveRequestedSkills,
  resolveCommandsForSkills,
};
