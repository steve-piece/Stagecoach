---
name: setup
description: Stagecoach setup orchestrator — three flows in one skill. (1) First-time install — creates a system-wide ~/.stagecoach/defaults.json so future projects can opt in to your defaults. (2) New project — bootstraps a fresh single-app or Turborepo monorepo, then creates the per-project stagecoach.config.json. (3) Existing project — skips the bootstrap and goes straight to per-project config customization. Use for any first-touch interaction with Stagecoach.
model: opus
effort: high
user-invocable: true
triggers: ["/stagecoach:setup", "/setup", "set up stagecoach", "configure stagecoach", "scaffold a new project", "first time using stagecoach", "create a new monorepo", "create a next.js app for stagecoach"]
---

<!-- skills/setup/SKILL.md -->
<!-- Three-flow setup orchestrator: first-time-install (system-wide), new-project (bootstrap + per-project config), existing-project (per-project config only). All Stagecoach personalization flows through this skill. -->

# Setup

Stagecoach setup orchestrator. Drives every first-touch interaction with the plugin: system-wide install, new-project scaffold, and per-project config customization.

## Reference Files

Read all of these before beginning:

| File | Purpose |
| --- | --- |
| [references/stagecoach-config-schema.md](references/stagecoach-config-schema.md) | Full config schema, precedence rules, per-key documentation |
| [references/stagecoach.config.example.json](references/stagecoach.config.example.json) | Copy-pasteable JSONC starter — every block commented out |
| [references/model-tier-guide.md](references/model-tier-guide.md) | Per-agent model tier defaults; cross-link from `modelTiers` config block |
| [references/bootstrap-templates-catalog.md](references/bootstrap-templates-catalog.md) | Documents which scaffolders Step 1 wraps (`create-next-app`, `create-turbo`) and why |

## Flow Selection

Detect which flow applies before doing anything else:

```
1. Does ~/.stagecoach/defaults.json exist?
   No  → consider Flow A (offer first-time install) before continuing
   Yes → skip to step 2

2. Working directory contains a package.json?
   No  → Flow B (new project: bootstrap + per-project config)
   Yes → Flow C (existing project: per-project config only)
```

If the user explicitly asks for first-time install (e.g. "configure my Stagecoach defaults", "system-wide setup"), run **Flow A** regardless of detection.

---

## Flow A — First-time install (system-wide setup)

**Goal:** create `~/.stagecoach/defaults.json` so future projects can opt in to your preferred defaults via Group 1.

**When this fires:**
- `~/.stagecoach/defaults.json` does NOT exist, AND
- The user is willing to set up defaults now (ask first; many users prefer per-project answers).

**Procedure:**

1. Ask: *"Stagecoach can store system-wide defaults at `~/.stagecoach/defaults.json` so you don't have to answer the same setup questions on every project. Want to set those up now?"*
   - `single_select: ["Yes — set up system-wide defaults", "No — skip; ask per project"]`
2. If yes: run the **Group 2** questions below, but write the answers to `~/.stagecoach/defaults.json` instead of a per-project file.
3. Print: *"Defaults saved at `~/.stagecoach/defaults.json`. Future runs of `/stagecoach:setup` will offer these as one-click defaults via the 'use defaults?' question."*
4. After Flow A completes, fall through to Flow B or C based on the working-directory detection.

---

## Flow B — New project (Bootstrap + Config + CI/CD baseline)

**Goal:** scaffold a fresh project on disk, drop in a per-project `stagecoach.config.json`, gitignored `ROADMAP.local.md`, and offer to scaffold the CI/CD baseline.

**When this fires:** working directory contains no `package.json` (parent folder of a new project).

**Step 1 — Project Bootstrap (REQUIRED in Flow B)** — see [Step 1](#step-1--project-bootstrap) below.

**Step 2 — Per-project Config Customization (REQUIRED)** — see [Step 2](#step-2--per-project-config-customization) below.

**Step 3 — CI/CD Baseline Check (REQUIRED — but the SCAFFOLD action is optional)** — see [Step 3](#step-3--cicd-baseline-check-flow-b-and-flow-c-only--skipped-in-flow-a) below. Detects whether the baseline exists; offers to scaffold via `/stagecoach:scaffold-ci-cd` if not.

---

## Flow C — Existing project (Config + CI/CD baseline)

**Goal:** drop a per-project `stagecoach.config.json` into a project that already exists, then check CI/CD readiness.

**When this fires:** working directory contains a `package.json`.

Skip Step 1 entirely. Run **Step 2** then **Step 3**. Step 3 is what makes this flow viable for projects that aren't going through the full PRD-to-phased-dev workflow — `add-feature` and `deliver-stage` need the CI/CD baseline to be present.

---

## Step 1 — Project Bootstrap

(Flow B only — skipped in Flow C.)

### Phase 1 — Plan-Mode Question Gate

Enter plan mode and ask the user with `ask_user_input_v0`, one question at a time. If `bootstrap.{variant,stack,roadmapFile}` are all set in `~/.stagecoach/defaults.json` (and the user opted into defaults in Step 2 Group 1), skip this gate and use those values directly.

**Q-bootstrap-variant**
> "Single application or Turborepo monorepo?"
> single_select: ["single-app — one Next.js app", "monorepo — Turborepo with apps/ and packages/"]

**Q-bootstrap-name**
> "What's the project name? Use kebab-case (lowercase, hyphens only)."
> text_input: regex `^[a-z][a-z0-9-]*[a-z0-9]$`

**Q-bootstrap-stack**
> "Stack? (Only Next.js is supported in v2.2 — this question exists to make the choice explicit and to forward-compat additional stacks later.)"
> single_select: ["Next.js (TypeScript, App Router, Tailwind, Turbopack)"]

**Q-bootstrap-roadmap**
> "Create a `ROADMAP.local.md` for personal future-version notes? It will be gitignored."
> single_select: ["Yes — create ROADMAP.local.md", "No — skip"]

Confirm answers before proceeding.

### Phase 2 — Run the official scaffolder

Read [`references/bootstrap-templates-catalog.md`](references/bootstrap-templates-catalog.md) for the exact invocation. Single-app uses `create-next-app`; monorepo uses `create-turbo`.

After scaffolding, `cd <project-name>` for the remaining steps.

### Phase 3 — Initial commit

```bash
git add -A
git commit -m "chore: scaffold project via /stagecoach:setup

Stack: <stack>
Variant: <variant>"
```

### Phase 4 — Update .gitignore

Append to the new project's `.gitignore`:

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

### Phase 5 — Create the roadmap file (if Q-bootstrap-roadmap = Yes)

Write `ROADMAP.local.md` at the new project root:

```markdown
# Roadmap (local, gitignored)

Personal scratchpad for future versions and next dev stages. Not committed to the remote.

## Next Stagecoach run
[ ] Brief idea
[ ] Brand notes / design references
[ ] Open questions to resolve before /stagecoach:write-prd

## Future versions / Phase 2+
[ ] ...

## Friction notes (for future /stagecoach:review-pipeline)
[ ] ...
```

Then proceed to **Step 2**.

### Hard constraints — Step 1

- **One bootstrap per project root.** If working directory contains a `package.json`, refuse Step 1 and switch to Flow C (Config only). Surface: *"Detected an existing project at <path>. Skipping bootstrap; running per-project config setup only."*
- **Non-Next.js stacks are out of scope for v2.2.** When the user asks for Astro / Vite / Remix / plain Node API, surface that and stop. Track interest via `/stagecoach:review-pipeline`.
- **Never modify files outside the new project directory** during bootstrap.
- **Never delete anything.** Step 1 is purely additive.

---

## Step 2 — Per-project Config Customization

Generate a `stagecoach.config.json` at the project root (or `~/.stagecoach/defaults.json` for Flow A). All keys are optional; the plugin uses built-in defaults for anything you omit.

### Group 1 — Use system-wide defaults?

**Skip Group 1 entirely if `~/.stagecoach/defaults.json` does NOT exist** (no defaults to opt into yet — go straight to Group 2). Skip Group 1 in Flow A (we're CREATING the defaults file in this flow).

**Q-defaults**
> "You have system-wide defaults at `~/.stagecoach/defaults.json`. Want to use them as the starting point for this project?"
> single_select: ["Yes — copy my system-wide defaults into this project", "No — answer the per-section questions below"]

If yes: copy `~/.stagecoach/defaults.json` content into the project's `stagecoach.config.json` and skip Group 2. Print the resolved values for the user to review.

If no: continue to Group 2.

### Group 2 — Per-section questions

One question per top-level config section. Multi-select where multiple apply, single-select otherwise. Sections that take freeform input ("custom rules", "additional categories", "bootstrap defaults") include a "No / skip" option plus a text-input alternative.

**Always provide a recommended answer in available options.**

**Q-modelTiers**
> "How do you want to handle per-agent model tier assignments? Each agent has a default tier per [`skills/setup/references/model-tier-guide.md`](references/model-tier-guide.md). Most projects don't need overrides."
> single_select: ["Use plugin defaults (recommended)", "I'll edit the modelTiers block manually after generation"]

If "Use plugin defaults": leave `modelTiers: {}` in the generated file. If "edit manually": leave `modelTiers: {}` plus a comment block listing the most-overridden agents (`implementer`, `qualityReviewer`, `ciCdGuardrails`) for the user to fill in.

**Q-stages**
> "Use the default stage shape (6 tasks max per stage, target 20–30 feature stages)? The defaults work for most projects. Lower the task cap for tighter slices; raise the stage band for finer-grained splits."
> single_select: ["Yes — use defaults", "No — set custom values"]

If "No": follow up with two text inputs:
- *"Max tasks per stage (1–8)?"* — text_input
- *"Target feature-stage band (e.g. `10-15`, `30-40`)?"* — text_input

**Q-mcps** (multi_select)
> "Which MCPs do you have installed in this workspace? Pick the ones you actually have running locally — the plugin reads this in addition to the project rules file."
> multi_select: ["shadcn", "Magic (21st.dev)", "Figma", "Chrome DevTools", "Supabase", "GitNexus", "None"]

Map the selections to boolean entries in the `mcps` block. Selecting "None" sets every key to `false`.

**Q-visualReview-tools**
> "Use the default visual-review tooling priority (claude-in-chrome > chrome-devtools-mcp > playwright > vizzly)? Override if you don't have Claude in Chrome installed."
> single_select: ["Yes — use defaults", "No — customize the ordered list (text input)"]

If "No": text input for an ordered list (one tool per line, top = highest priority).

**Q-visualReview-vizzly**
> "Use Vizzly for visual diffs? Vizzly is a SaaS for visual diff review — skip if you don't have an account."
> single_select: ["Yes — keep Vizzly enabled", "No — disable Vizzly entirely"]

**Q-hitl**
> "Add custom HITL categories beyond the four built-in (PRD ambiguity, external credentials, destructive operations, creative direction)? Use this if your project has domain-specific bubble-up needs (e.g. legal review, security signoff). Each entry creates a new HITL category the orchestrator surfaces."
> single_select: ["No — keep the four built-ins", "Yes — describe the additional categories (text input)"]

If "Yes": text input. Parse one category per line in the form `<name>: <prompt-hint>` and convert into the `additionalCategories` array.

**Q-rules**
> "Import external rule files now (skips the Q9 elicitation in `/stagecoach:plan-phases` for this project)? Useful if you have a stable set of agentic rules across projects."
> single_select: ["No — answer Q9 per project", "Yes — paste URLs to your rule files (text input)"]

If "Yes": text input. One URL per line.

**Q-bootstrap-defaults**
> "Set bootstrap defaults so future `/stagecoach:setup` runs in fresh project folders skip the bootstrap question gate? Useful if you always start projects the same way."
> single_select: ["No — ask the bootstrap questions every time", "Yes — set variant / stack / roadmap-file defaults (text input)"]

If "Yes": three text inputs (`variant`, `stack`, `roadmapFile` — note `null` is allowed for `roadmapFile` to skip creating it).

### Phase — Write the config file

Generate the JSONC file. Use [`references/stagecoach.config.example.json`](references/stagecoach.config.example.json) as the structural template. Fill in only the sections the user customized; leave the rest commented out.

- Flow A target: `~/.stagecoach/defaults.json` (create the directory if missing: `mkdir -p ~/.stagecoach`)
- Flow B / C target: `<project-root>/stagecoach.config.json`

Print the resolved values back to the user before continuing to Step 3.

---

## Step 3 — CI/CD Baseline Check (Flow B and Flow C only — skipped in Flow A)

Apps that haven't run `/stagecoach:scaffold-ci-cd` lack the gates that `/stagecoach:deliver-stage` expects (typecheck, lint, design-system-compliance, `@feature` E2E, `@regression-core` E2E, `@visual` E2E, optional `db-schema-drift`). This step detects whether the baseline exists and offers to scaffold it for projects that aren't going through the full PRD-to-phased-dev workflow.

### Detection

Check the working directory (Flow C) or the newly-scaffolded project root (Flow B) for these markers:

| Marker | What "present" looks like |
|---|---|
| `.github/workflows/ci.yml` | Has `typecheck`, `lint`, and at least one test job (unit/integration/e2e) |
| `.github/workflows/design-system-compliance.yml` | Exists |
| `.husky/pre-push` | Exists and runs the same gates as CI |
| `.github/pull_request_template.md` | Exists |

If ALL four markers are present and look complete, set `ci_cd_ready: true` and skip the rest of Step 3 (just announce: *"CI/CD baseline detected. Proceeding to next-step pointer."*).

If any marker is missing, set `ci_cd_ready: false` and ask the user.

### Q-ci-cd-baseline (only if `ci_cd_ready: false`)

> "This project doesn't have the Stagecoach CI/CD baseline (one or more of: ci.yml, design-system-compliance.yml, husky pre-push hook, PR template). The `deliver-stage` and `add-feature` skills depend on these gates being green before opening a PR. Want to scaffold the baseline now?"
> single_select: ["Yes — scaffold CI/CD baseline now (recommended)", "No — skip; I'll handle CI my own way"]

If "Yes": print *"Run `/stagecoach:scaffold-ci-cd` next — it will run on a dedicated `chore/scaffold-ci-cd` branch and open a PR. Once that PR merges, return here and run `/stagecoach:add-feature` (or `/stagecoach:write-prd` for a full PRD-to-app run)."*

If "No": warn the user and continue:
> ⚠️ **Without the CI/CD baseline:** `/stagecoach:deliver-stage`'s Phase 8 (CI/CD guardrails) will likely fail because the `ci-cd-guardrails` agent expects the baseline workflows to exist. You can still run `/stagecoach:deliver-stage`, but you'll need to manually wire equivalent gates in your own CI for the per-stage `@visual` and `design-system-compliance` checks. To re-enable the offer later, delete `.stagecoach/.skip-ci-cd` and re-run `/stagecoach:setup`.

If the user chose "No": create a sentinel file `.stagecoach/.skip-ci-cd` so future `/stagecoach:setup` runs skip Q-ci-cd-baseline.

### Phase — Print next-step pointer

For Flow A:
> Defaults saved at `~/.stagecoach/defaults.json`. To use them on a project, run `/stagecoach:setup` from the project's parent folder (Flow B) or inside the project (Flow C) and answer "Yes" to the Group 1 "use defaults?" question.

For Flow B:
> Project scaffolded at `<absolute-path>` with `stagecoach.config.json` and `ROADMAP.local.md`.
>
> **CI/CD baseline:** <"present" | "scaffold pending — run /stagecoach:scaffold-ci-cd next" | "skipped per user choice">
>
> **Next steps:**
> 1. `cd <project-name>`
> 2. (Optional) Edit `stagecoach.config.json` to refine any defaults
> 3. (Optional) Add brief notes to `ROADMAP.local.md`
> 4. Run `/stagecoach:scaffold-ci-cd` (if Step 3 said scaffold pending)
> 5. Run `/stagecoach:write-prd` to write the PRD (full PRD-to-app flow), OR run `/stagecoach:add-feature` later if you only want to bolt features onto an existing master checklist
>
> The Stagecoach pipeline from here is: PRD → phased plans → design system gate → CI/CD scaffold → env setup → optional DB schema → 20-30 vertical-slice feature stages.

For Flow C:
> Config written to `<project-root>/stagecoach.config.json`. Future Stagecoach skill runs in this project will honor these settings.
>
> **CI/CD baseline:** <"present" | "scaffold pending — run /stagecoach:scaffold-ci-cd next" | "skipped per user choice">
>
> **Next steps:**
> - **Have a PRD already?** Run `/stagecoach:plan-phases` to generate phased plans.
> - **No PRD yet?** Run `/stagecoach:write-prd` to write one against this existing app's surface area.
> - **Just want to add a feature or two?** Run `/stagecoach:add-feature` directly. Note: without a master checklist (no `docs/plans/`), add-feature will redirect you back here. To go from existing-app → add-feature flow, run `/stagecoach:write-prd` first to give the complexity assessor grounding context.

---

## HITL Handling

Setup is a top-of-funnel skill — there's no orchestrator above it. Plan-mode question gates ARE the user prompts; setup never bubbles up via the structured HITL contract. The one exception:

**If the user re-runs setup inside an existing project but explicitly requests Flow B (bootstrap):**

```yaml
status: needs_human
summary: Bootstrap was requested inside an existing project (detected package.json at <path>). Bootstrap is for new projects only.
artifacts: []
needs_human: true
hitl_category: prd_ambiguity
hitl_question: "It looks like you're already inside a project. Did you mean to run Flow C (Config only)? Or should setup operate in the parent directory?"
hitl_context: "Detected existing package.json at the working directory; user explicitly requested bootstrap."
```

---

## Hard Constraints — overall

- **One umbrella for setup.** Don't fork the Bootstrap-only or Config-only behavior into separate skills; flow detection picks the right path.
- **Never write `~/.stagecoach/defaults.json` without explicit consent** (Flow A's Q-Flow-A question gates this).
- **Never overwrite an existing `stagecoach.config.json`** in a project root without surfacing it to the user first. If detected, ask: *"This project already has stagecoach.config.json. Overwrite, merge, or cancel?"*
- **Never delete anything.** Setup is additive.

---

## Completion Checklist

[ ] Flow detected correctly (A / B / C) and announced to the user
[ ] Step 1 ran ONLY in Flow B (skipped in Flow A and Flow C)
[ ] Step 2 ran in every flow (always required)
[ ] Group 1 ran ONLY when `~/.stagecoach/defaults.json` exists (skipped on first run + during Flow A)
[ ] Group 2 ran when needed (no defaults, OR Group 1 = "No", OR Flow A)
[ ] Generated config file is valid JSONC (parses cleanly, no syntax errors)
[ ] Generated config file is at the correct path (Flow A: `~/.stagecoach/defaults.json`; Flow B/C: project root)
[ ] (Flow B only) `.gitignore` includes the personal-scratchpad and AI-tooling-workspace entries
[ ] (Flow B only) Initial git commit created on `main`
[ ] Step 3 (CI/CD baseline check) ran in Flow B and Flow C (skipped in Flow A)
[ ] Step 3 detected ci_cd_ready accurately based on the four markers
[ ] (Step 3 + ci_cd_ready false + user said no) `.stagecoach/.skip-ci-cd` sentinel file written
[ ] Next-step pointer printed to the user, including CI/CD baseline status line

---

## Sub-agent return contract

Setup uses this shape only when re-running inside an existing project under a misuse condition (see HITL Handling). Otherwise it returns plainly to the user.

```yaml
status: complete | failed | needs_human
summary: <one paragraph>
artifacts:
  - <generated config file path>
  - <new project root path, if Flow B>
  - ROADMAP.local.md (if Flow B + Q-bootstrap-roadmap = Yes)
  - .gitignore (modified, if Flow B)
needs_human: false | true
hitl_category: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
hitl_question: null | "<plain-language question>"
hitl_context: null | "<what triggered this>"
```
