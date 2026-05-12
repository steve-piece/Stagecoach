// scripts/install/args.js
// Argument parser and validator for the ByTheSlice installer CLI.

const DEFAULTS = {
  command: "install",
  mode: "plugin",
  target: "both",
  dryRun: false,
  skills: [],
  configPath: null,
  cursorDir: null,
  claudeDir: null,
  skillsDir: null,
  help: false,
};

function parseArgs(argv) {
  const args = { ...DEFAULTS };
  const input = [...argv];

  if (input.length === 0) {
    return args;
  }

  const first = input[0];
  if (!first.startsWith("-")) {
    args.command = first;
    input.shift();
  }

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--mode") {
      args.mode = readValue(input, ++index, token);
      continue;
    }

    if (token === "--target") {
      args.target = readValue(input, ++index, token);
      continue;
    }

    if (token === "--skill") {
      args.skills.push(readValue(input, ++index, token));
      continue;
    }

    if (token === "--config") {
      args.configPath = readValue(input, ++index, token);
      continue;
    }

    if (token === "--cursor-dir") {
      args.cursorDir = readValue(input, ++index, token);
      continue;
    }

    if (token === "--claude-dir") {
      args.claudeDir = readValue(input, ++index, token);
      continue;
    }

    if (token === "--skills-dir") {
      args.skillsDir = readValue(input, ++index, token);
      continue;
    }

    throw new Error(`Unknown option "${token}". Use --help for usage.`);
  }

  validateArgs(args);
  return args;
}

function mergeWithConfig(args, config) {
  if (!config || typeof config !== "object") {
    return args;
  }

  const merged = { ...args };

  if (typeof config.mode === "string" && args.mode === DEFAULTS.mode) {
    merged.mode = config.mode;
  }

  if (typeof config.target === "string" && args.target === DEFAULTS.target) {
    merged.target = config.target;
  }

  if (Array.isArray(config.skills) && args.skills.length === 0) {
    merged.skills = config.skills.map(String);
  }

  if (typeof config.cursorDir === "string" && !args.cursorDir) {
    merged.cursorDir = config.cursorDir;
  }

  if (typeof config.claudeDir === "string" && !args.claudeDir) {
    merged.claudeDir = config.claudeDir;
  }

  if (typeof config.skillsDir === "string" && !args.skillsDir) {
    merged.skillsDir = config.skillsDir;
  }

  validateArgs(merged);
  return merged;
}

function renderHelp() {
  return [
    "Usage:",
    "  bytheslice install [options]",
    "",
    "Options:",
    "  --mode plugin|skills      Install full plugin wiring or selected skills (default: plugin)",
    "  --target cursor|claude|both",
    "                            Plugin host targets (default: both)",
    "  --cursor-dir <path>       Override Cursor plugin directory",
    "  --claude-dir <path>       Override Claude plugin directory",
    "  --skills-dir <path>       Destination root for skills mode",
    "  --skill <name>            Install one skill (repeatable)",
    "  --config <path>           Optional JSON/JSONC config file",
    "  --dry-run                 Print planned changes without writing files",
    "  --help                    Show this help output",
    "",
    "Examples:",
    "  npx bytheslice install --target both",
    "  npx bytheslice install --mode skills --skill setup --skill deliver-stage",
    "  npx bytheslice install --mode skills --config ./skills.sh.config.json",
  ].join("\n");
}

function readValue(input, index, flag) {
  const value = input[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function validateArgs(args) {
  if (args.command !== "install") {
    throw new Error(`Unsupported command "${args.command}". Only "install" is available.`);
  }

  if (!["plugin", "skills"].includes(args.mode)) {
    throw new Error(`Invalid --mode "${args.mode}". Use "plugin" or "skills".`);
  }

  if (!["cursor", "claude", "both"].includes(args.target)) {
    throw new Error(`Invalid --target "${args.target}". Use "cursor", "claude", or "both".`);
  }
}

module.exports = {
  parseArgs,
  mergeWithConfig,
  renderHelp,
};
