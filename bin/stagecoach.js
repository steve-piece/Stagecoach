#!/usr/bin/env node
// bin/stagecoach.js
// CLI entrypoint for Stagecoach installer commands.

const { runInstallerCli } = require("../scripts/install");

runInstallerCli(process.argv.slice(2)).catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`[stagecoach] ${message}`);
  process.exit(1);
});
