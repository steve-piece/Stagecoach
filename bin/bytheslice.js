#!/usr/bin/env node
// bin/bytheslice.js
// CLI entrypoint for ByTheSlice installer commands.

const { runInstallerCli } = require("../scripts/install");

runInstallerCli(process.argv.slice(2)).catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`[bytheslice] ${message}`);
  process.exit(1);
});
