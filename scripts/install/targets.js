// scripts/install/targets.js
// Resolves filesystem targets for plugin hosts and skills destinations.

const os = require("os");
const path = require("path");

function resolveTargets(args) {
  const home = os.homedir();

  const cursorDir = path.resolve(args.cursorDir || path.join(home, ".cursor", "plugins"));
  const claudeDir = path.resolve(args.claudeDir || path.join(home, ".claude", "plugins"));
  const skillsDir = path.resolve(
    args.skillsDir || path.join(process.cwd(), ".stagecoach-installs", "skills"),
  );

  const pluginTargets = [];
  if (args.target === "cursor" || args.target === "both") {
    pluginTargets.push({
      host: "cursor",
      rootDir: cursorDir,
      installDir: path.join(cursorDir, "stagecoach"),
      manifestDir: ".cursor-plugin",
    });
  }

  if (args.target === "claude" || args.target === "both") {
    pluginTargets.push({
      host: "claude",
      rootDir: claudeDir,
      installDir: path.join(claudeDir, "stagecoach"),
      manifestDir: ".claude-plugin",
    });
  }

  return {
    pluginTargets,
    skillsTarget: {
      rootDir: skillsDir,
      skillsDir: path.join(skillsDir, "skills"),
      commandsDir: path.join(skillsDir, "commands"),
    },
  };
}

module.exports = {
  resolveTargets,
};
