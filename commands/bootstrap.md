<!-- commands/bootstrap.md -->
<!-- Slash command shim that loads the bootstrap skill to scaffold a new project (Stage 0). -->

---
description: Stage 0 — scaffold a fresh single-app or Turborepo monorepo via the official scaffolders (create-next-app, create-turbo), drop in a stagecoach.config.json, and create a gitignored ROADMAP.local.md for personal future-version notes. Use when starting a brand-new project from scratch, before /stagecoach:prd-generator. Skip if you already have a project on disk.
---

# /bootstrap

Load and follow the [`bootstrap`](../skills/bootstrap/SKILL.md) skill.

The skill is the on-ramp to Stagecoach — Stage 0 of every project. It runs the official Next.js or Turborepo scaffolder, drops in a `stagecoach.config.json` with the user's bootstrap defaults, creates a gitignored `ROADMAP.local.md` for personal scratch notes, and prints the next-step pointer.

## Preconditions

- Working directory is the parent folder where the new project should live (NOT inside an existing project).
- `pnpm` and `git` installed and on PATH.

## When to use this command

Use `/bootstrap` (or `/stagecoach:bootstrap` once installed via the marketplace) when starting a brand-new project. Skip this and go straight to `/prd-generator` if a project already exists on disk.

For non-Next.js stacks (Astro, Vite, Remix, plain Node, etc.) — file an issue or fork. v2.1 supports Next.js single-app and Turborepo monorepo only.
