---
name: bootstrap
description: Stage 0 of every Stagecoach project. Scaffolds a fresh single-app or Turborepo monorepo via the official scaffolders (create-next-app, create-turbo), drops in a stagecoach.config.json, creates a gitignored ROADMAP.local.md for personal future-version notes, and prints the next-step pointer. Use when starting a brand-new project from scratch, or before the first /stagecoach:prd-generator run.
model: opus
effort: high
user-invocable: true
triggers: ["/stagecoach:bootstrap", "/bootstrap", "scaffold a new project", "start a new stagecoach project", "create a new monorepo", "create a next.js app for stagecoach"]
---

# Bootstrap (Stage 0)

The on-ramp to Stagecoach. Creates a fresh project on disk so the rest of the plugin has somewhere to land. Skip this if you already have a project — go straight to `/stagecoach:prd-generator`.

## When to use

Use this when:
- You're starting a brand-new project and have nothing on disk yet.
- You want a consistent starting structure (Next.js single-app or Turborepo monorepo) that the downstream Stagecoach skills know how to navigate.

Do NOT use this when:
- You're adding Stagecoach to an existing project (just go straight to `/stagecoach:prd-generator`).
- You want a non-Next.js stack (Astro, Vite, Remix, etc.) — file an issue or fork. v2.1 ships Next.js only.

## Inputs and Preconditions

- Working directory is the parent folder where the new project should be created (NOT inside an existing project).
- `pnpm` installed (`pnpm --version` succeeds). Other package managers can be used by editing the scaffold commands below.
- `git` installed.
- If `stagecoach.config.json` exists in the working directory and contains a `bootstrap` block, those values are used as defaults and the plan-mode question gate is skipped. Otherwise the gate runs.

## Workflow

### Phase 0 — Read config defaults (optional)

Check for `stagecoach.config.json` in the current working directory. If present and `bootstrap.{variant,stack,roadmapFile}` are all set, skip Phase 1 and use those values directly. Log: `Bootstrap defaults loaded from stagecoach.config.json — skipping question gate.`

### Phase 1 — Plan-Mode Question Gate (REQUIRED unless skipped by config)

Enter plan mode and ask the user with `ask_user_input_v0`, one question at a time:

**Q1 — Variant**
> "Single application or Turborepo monorepo?"
> single_select: ["single-app — one Next.js app", "monorepo — Turborepo with apps/ and packages/"]

**Q2 — Project name**
> "What's the project name? Use kebab-case (lowercase, hyphens only)."
> text_input: regex `^[a-z][a-z0-9-]*[a-z0-9]$`

**Q3 — Stack**
> "Stack?" (only Next.js is supported in v2.1; this question exists to make the choice explicit and to forward-compat additional stacks later)
> single_select: ["Next.js (TypeScript, App Router, Tailwind, Turbopack)"]

**Q4 — Roadmap file**
> "Create a `ROADMAP.local.md` for personal future-version notes? It will be gitignored."
> single_select: ["Yes — create ROADMAP.local.md", "No — skip"]

Confirm the answers with the user before proceeding to Phase 2.

### Phase 2 — Scaffold the project

For `variant: single-app`:

```bash
pnpm dlx create-next-app@latest <project-name> \
  --typescript \
  --app \
  --tailwind \
  --turbopack \
  --eslint \
  --import-alias "@/*" \
  --use-pnpm
```

For `variant: monorepo`:

```bash
pnpm dlx create-turbo@latest <project-name> --example basic
```

After scaffolding, `cd <project-name>` for the remaining steps. **All subsequent paths in this skill are relative to the new project root.**

### Phase 3 — Drop in `stagecoach.config.json`

Read the plugin's [`stagecoach.config.example.json`](../../stagecoach.config.example.json) and write a minimal version to the new project root:

```jsonc
{
  // Stagecoach v2 config. See:
  // https://github.com/steve-piece/phased-dev-workflow/blob/main/references/stagecoach-config-schema.md
  "bootstrap": {
    "variant": "<single-app | monorepo>",
    "stack": "nextjs",
    "roadmapFile": "ROADMAP.local.md"
  }
}
```

Pre-populate `bootstrap.variant` from Q1 and `bootstrap.roadmapFile` from Q4 (or `null` if Q4 was "skip"). Leave the other config blocks empty so the user knows they exist but doesn't get drowned in defaults.

### Phase 4 — Create the roadmap file (if Q4 = Yes)

Write `ROADMAP.local.md` at the new project root with this starter template:

```markdown
# Roadmap (local, gitignored)

Personal scratchpad for future versions and next dev stages. Not committed to the remote.

## Next Stagecoach run
[ ] Brief idea
[ ] Brand notes / design references
[ ] Open questions to resolve before /stagecoach:prd-generator

## Future versions / Phase 2+
[ ] ...

## Friction notes (for future /stagecoach:retrospective)
[ ] ...
```

### Phase 5 — Update `.gitignore`

Append to the new project's `.gitignore` (create if missing):

```
# Personal scratchpad files (gitignored by convention)
*.local.md
ROADMAP.local.md

# Per-user AI tooling workspaces
.claude/
.cursor/
.aider*
.continue/
.codex/
.windsurf/
```

Skip if these entries already exist.

### Phase 6 — Initial commit

```bash
git add -A
git commit -m "chore: scaffold project via /stagecoach:bootstrap

Stack: <stack>
Variant: <variant>
Stagecoach config + .gitignore additions included."
```

### Phase 7 — Print next-step pointer

Print to the user (verbatim, don't paraphrase):

> Project scaffolded at `<absolute-path>`.
>
> **Next steps:**
> 1. `cd <project-name>`
> 2. (Optional) Edit `stagecoach.config.json` to override plugin defaults
> 3. (Optional) Add brief notes to `ROADMAP.local.md`
> 4. Run `/stagecoach:prd-generator` to write the PRD
>
> The Stagecoach pipeline from here is: PRD → phased plans → design system gate → CI/CD scaffold → env setup → optional DB schema → 20-30 vertical-slice feature stages.

## HITL handling

Bootstrap is the **top of the funnel** — there's no orchestrator above it. The plan-mode question gate IS the user prompt. Bootstrap never bubbles up via the structured HITL contract; if something goes wrong (e.g., scaffold command fails), it stops and surfaces the error directly to the user.

The only structured-return-contract case is when the user re-runs bootstrap inside an existing project — that's a misuse. Stop and surface:

```yaml
status: failed
summary: Bootstrap was invoked inside an existing project (detected package.json at <path>). Bootstrap is for new projects only.
artifacts: []
needs_human: true
hitl_category: prd_ambiguity
hitl_question: "It looks like you're already inside a project. Did you mean /stagecoach:prd-generator instead?"
hitl_context: "Detected existing package.json at the working directory."
```

## Hard Constraints

- **One bootstrap per project root.** If the working directory contains a `package.json`, refuse to run.
- **Non-Next.js stacks are out of scope for v2.1.** When the user asks for Astro / Vite / Remix / plain Node API, surface that and stop. (Track interest via the retrospective skill.)
- **Never modify files outside the new project directory.**
- **Never delete anything.** This skill is purely additive (run scaffolders, write config, write roadmap, append to gitignore, commit).
- **The `bootstrap` skill itself never reads or modifies `stagecoach.config.json` files outside the new project root.**

## Completion Checklist

[ ] Scaffold command ran successfully (`create-next-app` or `create-turbo`)
[ ] New project directory exists at `<working-dir>/<project-name>`
[ ] `stagecoach.config.json` written at new project root with `bootstrap.{variant,stack,roadmapFile}` populated
[ ] `ROADMAP.local.md` written at new project root (if Q4 = Yes)
[ ] `.gitignore` includes the personal-scratchpad and AI-tooling-workspace entries
[ ] Initial git commit created on `main`
[ ] Next-step pointer message displayed to the user

## Sub-agent return contract (for reference — bootstrap rarely uses this)

```yaml
status: complete | failed | needs_human
summary: <one paragraph: what was scaffolded and where>
artifacts:
  - <new project root path>
  - stagecoach.config.json
  - ROADMAP.local.md (if created)
  - .gitignore (modified)
needs_human: false | true
hitl_category: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
hitl_question: null | "<plain-language question>"
hitl_context: null | "<what triggered this>"
```
