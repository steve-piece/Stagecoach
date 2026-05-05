<!-- commands/setup.md -->
<!-- Slash command shim that loads the setup skill — Stagecoach's first-touch entry point. Three flows in one skill: first-time install (system-wide defaults), new-project bootstrap, existing-project config customization. -->

---
description: Stagecoach setup — three flows in one skill. (1) First-time install creates a system-wide ~/.stagecoach/defaults.json so future projects can opt in to your preferences. (2) New project scaffolds a fresh single-app or Turborepo monorepo, then drops in a per-project stagecoach.config.json. (3) Existing project skips the bootstrap and goes straight to per-project config customization. Use for any first-touch interaction with Stagecoach.
---

# /setup

Load and follow the [`setup`](../skills/setup/SKILL.md) skill.

The skill auto-detects which flow applies:

- **Flow A — First-time install (system-wide).** Triggers when `~/.stagecoach/defaults.json` doesn't exist. Asks the per-section questions once and saves them as your machine-wide defaults so future projects can opt in via a single "use defaults?" question.
- **Flow B — New project (Bootstrap + Config).** Triggers when the working directory has no `package.json`. Scaffolds a Next.js single-app or Turborepo monorepo via the official scaffolders, then drops in a per-project `stagecoach.config.json` and a gitignored `ROADMAP.local.md`.
- **Flow C — Existing project (Config only).** Triggers when the working directory already has a `package.json`. Skips the bootstrap and goes straight to per-project config customization.

## When to use this command

Use `/stagecoach:setup` (or `/setup` in local dev) for any first-touch interaction with Stagecoach. Whether you're standing up a new machine, scaffolding a fresh project, or adding Stagecoach config to an existing repo — this is the entry point.

For non-Next.js stacks (Astro, Vite, Remix, plain Node, etc.) — file an issue or fork. v2.2 supports Next.js single-app and Turborepo monorepo only for the bootstrap flow.
