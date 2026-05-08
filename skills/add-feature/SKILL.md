---
name: add-feature
description: Add one or more features to an existing project mid-flight. Auto-detects whether the project was built with Stagecoach (has docs/plans/), wasn't (existing app, needs setup first), or doesn't exist yet (needs bootstrap). For Stagecoach projects, runs complexity assessment, writes new stage files via phased-plan-writer (extending the master checklist), and hands off to /stagecoach:deliver-stage for delivery. Use when the user wants to bolt on extra features after the original PRD-to-app run is complete.
model: opus
effort: high
user-invocable: true
triggers: ["/stagecoach:add-feature", "/add-feature", "add a feature", "add features", "extend the app", "bolt on a feature", "what about adding"]
---

<!-- skills/add-feature/SKILL.md -->
<!-- Mid-flight feature addition. Detects project state, assesses complexity, writes incremental stage files, hands off to deliver-stage. For non-Stagecoach apps, redirects to setup. -->

# Add Feature

Bolt new features onto an existing project without restarting from a fresh PRD. Used after `/stagecoach:run-pipeline` has already shipped the original plan, OR for adding Stagecoach to an existing non-Stagecoach project.

The flow auto-detects which state the project is in and either runs the addition flow directly or redirects you to the right entry point first.

## Reference Files

| File | Purpose |
| --- | --- |
| [`skills/plan-phases/references/stage-frontmatter-contract.md`](../plan-phases/references/stage-frontmatter-contract.md) | YAML frontmatter shape every new stage file must match |
| [`skills/plan-phases/references/templates.md`](../plan-phases/references/templates.md) | Stage plan + master checklist templates |
| [`skills/plan-phases/references/canned-stages/auth-dev-mode-switcher-task.md`](../plan-phases/references/canned-stages/auth-dev-mode-switcher-task.md) | Auto-injected if any new feature is auth-tagged |
| [`skills/setup/references/stagecoach-config-schema.md`](../setup/references/stagecoach-config-schema.md) | Honors `stages.maxTasksPerStage` from `stagecoach.config.json` |

## Sub-agents

| When | File | Model | Effort |
|---|---|---|---|
| Step 1 (always) | [`agents/complexity-assessor.md`](agents/complexity-assessor.md) | `sonnet` | medium |
| Step 2 (always) | [`../plan-phases/agents/phased-plan-writer.md`](../plan-phases/agents/phased-plan-writer.md) | `sonnet` | medium |

`phased-plan-writer` runs in **incremental mode** for this skill (no PRD context — receives the user's feature description + complexity-assessor output + existing-stages context directly). See its incremental-mode block.

## Project Config

Honor these `stagecoach.config.json` keys when present (see [`skills/setup/references/stagecoach-config-schema.md`](../setup/references/stagecoach-config-schema.md)):

- `stages.maxTasksPerStage` — passed to phased-plan-writer for the new stage(s)
- `modelTiers.complexityAssessor` — overrides this skill's complexity-assessor model
- `hitl.additionalCategories` — additional bubble-up categories the assessor may use

## Flow Detection

Run this detection before doing any work. It picks one of three paths.

```
1. Does docs/plans/00_master_checklist.md exist?
   Yes → Path A (Stagecoach-built project — proceed with feature addition)
   No  → continue to step 2

2. Does package.json exist in the working directory?
   Yes → Path B (existing app, not Stagecoach — redirect to /stagecoach:setup
                  for config + CI/CD baseline before re-invoking add-feature)
   No  → Path C (no project on disk — redirect to /stagecoach:setup for
                  full bootstrap before any feature work)
```

Announce which path applies and why before continuing.

---

## Path A — Stagecoach-built project (assess → write stages → handoff)

### Phase 0 — Orientation

1. Read `docs/plans/00_master_checklist.md` — get the list of every existing stage and its status.
2. Read every `docs/plans/stage_*.md` quickly (frontmatter only — `name`, `type`, `slice`, `mvp`, `depends_on`, `completion_criteria`).
3. Find the highest existing stage number. New stages will start at `<highest> + 1`.
4. Read the original PRD at `docs/prd-*.md` if present — useful for the "don't drift outside scope" check, but NOT required.
5. Read `stagecoach.config.json` at the project root if present.
6. Read the project rules file (`CLAUDE.md` or `AGENTS.md`).
7. Confirm git state: `git status --short`, `git rev-parse --abbrev-ref HEAD`. Should be clean and on `main`.
8. Switch to **Plan Mode**.

### Phase 1 — Feature elicitation (Plan Mode)

Ask the user with `ask_user_input_v0`, one question at a time.

**Always provide a recommended answer in available options.**

**Q-features**
> "What feature(s) do you want to add? List each as a one-line summary. (You can paste multiple — one per line.)"
> text_input: multiline

**Q-relationship**
> "For each feature: is it brand-new, or does it extend something already built?"
> single_select: ["All brand-new", "All extending existing features", "Mix — I'll annotate per-feature"]
> If "Mix": follow-up text input asking the user to label each feature line as `[new]` or `[ext: <existing-feature>]`.

**Q-conventions**
> "Should the new feature(s) follow the existing patterns (project rules file + recent stage conventions), or do you have new patterns to introduce?"
> single_select: ["Follow existing conventions", "Introduce new patterns (I'll specify in next step)"]
> If "Introduce new": follow-up text input asking the user to describe.

**Q-mvp-band**
> "Mark new stages as `mvp: true` (Phase 1 / immediate ship) or `mvp: false` (Phase 2 / later batch)?"
> single_select: ["mvp: true — ship immediately", "mvp: false — batch as Phase 2", "Mix — let me annotate per-feature"]

**Q-pr-style**
> "Open PRs against `main` directly, or against an integration branch?"
> single_select: ["main (one PR per stage, default)", "integration branch (specify name in next step)"]

Confirm answers before proceeding.

### Phase 2 — Complexity assessment

Read `agents/complexity-assessor.md` and dispatch it. Pass:
- The user's feature list (from Q-features) plus annotations
- The relationship answer (Q-relationship) per feature
- The `mvp:` band per feature (Q-mvp-band)
- The conventions choice (Q-conventions)
- The current highest stage number
- Frontmatter excerpts from the most-recent 3-5 stages (for pattern matching)
- The `stagecoach.config.json` (esp. `stages.maxTasksPerStage`)
- The project rules file path
- The PRD path if present (read-only)

The assessor returns a per-feature recommendation: single-stage or multi-stage, with proposed stage names, types, slices, dependencies, and estimated tasks.

### Phase 3 — Surface assessment + user authorization

Render the assessor's output as a compact table:

```
┌──────────────────┬────────────┬────────┬────────────────────────────────┐
│ Feature          │ Complexity │ Stages │ Stage names (proposed)         │
├──────────────────┼────────────┼────────┼────────────────────────────────┤
│ Reviews on       │ multi      │ 2      │ stage_28 reviews-shell         │
│ product page     │            │        │ stage_29 reviews-data          │
├──────────────────┼────────────┼────────┼────────────────────────────────┤
│ CSV export       │ single     │ 1      │ stage_30 admin-csv-export      │
└──────────────────┴────────────┴────────┴────────────────────────────────┘
```

End with: **"Authorize this stage breakdown? (yes / edits / cancel)"** and wait. Do not proceed until the user says yes.

If the user requests edits, re-dispatch the assessor with the user's feedback. Cap at 2 re-assessment rounds; on round 3 → bubble HITL `prd_ambiguity`.

### Phase 4 — Write stage files

Read `../plan-phases/agents/phased-plan-writer.md` and dispatch it ONCE PER NEW STAGE in **incremental mode**. Pass:
- Stage number, short name, output path (`docs/plans/stage_<N>_<slug>.md`)
- One-sentence goal
- `mvp:` flag from Q-mvp-band
- Scope: in-scope tasks list (≤ `stages.maxTasksPerStage`, default 6)
- Context: feature description + complexity-assessor rationale + relationship to existing features + similar-stage frontmatter for pattern matching
- Auth-tagged? If yes, the writer auto-injects the dev-mode user switcher task (per [`auth-dev-mode-switcher-task.md`](../plan-phases/references/canned-stages/auth-dev-mode-switcher-task.md))
- Dependencies: stages this new feature depends on (from `depends_on:` frontmatter — usually `[]` or just the design-system + db-schema foundation stages already built)
- The project rules file path

Dispatch all per-stage writers in parallel where independent; sequentially where one stage depends on another being defined first.

### Phase 5 — Update master checklist

Append the new stages to `docs/plans/00_master_checklist.md`:

```markdown
## Stage 28 — reviews-shell
Status: Not Started
Type: frontend
Slice: vertical
MVP: true
Depends on: 1, 4
Completion criteria:
  - tests_passing
  - <other criteria from the new stage frontmatter>

## Stage 29 — reviews-data
Status: Not Started
[etc.]
```

Use the same checklist row format as the existing stages in the file. Do NOT alter completed stages' rows.

### Phase 6 — Commit + Handoff

1. **Stage and commit the new plan files** on a `chore/add-stages-<lo>-<hi>` branch (e.g. `chore/add-stages-28-30` for three new stages 28–30):
   - Create the branch off `main`: `git checkout -b chore/add-stages-<lo>-<hi>`
   - Stage every new `docs/plans/stage_<n>_*.md` file plus the modified `docs/plans/00_master_checklist.md`
   - Conventional commit: `chore: add stages <lo>-<hi> (<feature names>)` with a body listing each new stage and its `type:` / `mvp:` flag
   - Working tree should be clean on the branch after this commit
2. **Do NOT push or open a PR from this skill.** That's `/stagecoach:ship-pr`'s responsibility — keeping the same separation as `/deliver-stage`.
3. Print the handoff message:

> Stage(s) added to `docs/plans/00_master_checklist.md` and committed on branch `chore/add-stages-<lo>-<hi>`:
> - `stage_28_reviews-shell.md` (frontend, mvp)
> - `stage_29_reviews-data.md` (full-stack, mvp)
> - `stage_30_admin-csv-export.md` (backend, mvp)
>
> **Next steps (pick one):**
> - **Ship the plan changes as a chore PR first** (recommended for clean separation): run `/stagecoach:ship-pr`. The plan-only PR opens, CI runs (lint / link-check on the new files), you approve merge, the chore branch is cleaned up. Then start a fresh chat and run `/stagecoach:deliver-stage` to ship the first new stage.
> - **Skip the chore PR — start delivery immediately**: switch back to `main` (`git checkout main`), then run `/stagecoach:deliver-stage`. The first slice's PR will mix the new plan files with the implementation.
> - **Multi-stage autonomous delivery (experimental)**: `/stagecoach:run-pipeline` drives every new stage end-to-end with per-stage approval pauses. Best for batches you want shipped without per-stage babysitting.
>
> All new stages will go through the full CI gate (`@feature` + `@regression-core` + `@visual` + design-system-compliance + db-schema-drift if applicable). Visual + design-system-compliance gates require the project to have already run `/stagecoach:scaffold-ci-cd` — if absent, the orchestrator will surface that and ask whether to scaffold first.

Return.

---

## Path B — Existing app, not Stagecoach-built

**Detection:** `package.json` exists, `docs/plans/` does NOT exist.

Print to the user:

> This project has a `package.json` but no `docs/plans/` — it wasn't built with Stagecoach.
>
> Before adding features through Stagecoach, run `/stagecoach:setup` first. It will:
> 1. Drop in a per-project `stagecoach.config.json` (Step 2 of Setup)
> 2. Check for CI/CD baseline and offer to scaffold it via `/stagecoach:scaffold-ci-cd` if missing (Step 3 of Setup, new in v2.2)
>
> After setup completes, re-invoke `/stagecoach:add-feature` and I'll detect the new state and proceed with Path A — but note: without an existing `docs/plans/` and a master checklist of completed work, I'll be working with a much narrower context. You may want to first run `/stagecoach:write-prd` against the EXISTING app's known surface area to give the complexity assessor better grounding.

Bubble HITL:

```yaml
status: needs_human
summary: Existing project detected (has package.json) but not Stagecoach-built (no docs/plans/). Redirecting to /stagecoach:setup before feature addition can proceed.
artifacts: []
needs_human: true
hitl_category: prd_ambiguity
hitl_question: "Run /stagecoach:setup first to add the config + CI/CD baseline, then re-invoke /stagecoach:add-feature?"
hitl_context: "No docs/plans/00_master_checklist.md found in working directory; package.json present at <path>."
```

Then return.

---

## Path C — No project on disk

**Detection:** Neither `package.json` nor `docs/plans/` exists.

Print:

> No project detected in this directory. Run `/stagecoach:setup` first — it will scaffold a fresh Next.js single-app or Turborepo monorepo (Flow B) and drop in the per-project config. Once a project exists, run `/stagecoach:write-prd` for new builds, or `/stagecoach:add-feature` once you have a master checklist to extend.

Bubble HITL:

```yaml
status: needs_human
summary: No project on disk. Redirecting to /stagecoach:setup for project bootstrap.
artifacts: []
needs_human: true
hitl_category: prd_ambiguity
hitl_question: "Run /stagecoach:setup to scaffold a new project, then run /stagecoach:write-prd to start the full PRD-to-app flow?"
hitl_context: "Working directory has no package.json and no docs/plans/."
```

Then return.

---

## Hard Constraints

- **Never invent a master checklist.** Only Path A operates on existing `docs/plans/`. Paths B and C ALWAYS redirect to setup.
- **Never alter completed stage rows.** add-feature only APPENDS new stages. Existing stages are read-only context.
- **One slice per PR is still the rule.** Pass `pr_style` from Q-pr-style to phased-plan-writer; default is one PR per stage.
- **Honor `stages.maxTasksPerStage`** from `stagecoach.config.json` (default 6). The complexity-assessor uses this when proposing breakdowns.
- **Auth-tagged stages must inject the dev-mode user switcher task.** This is mandatory per [`auth-dev-mode-switcher-task.md`](../plan-phases/references/canned-stages/auth-dev-mode-switcher-task.md). The phased-plan-writer handles this in incremental mode the same way it does in plan-phases mode.
- **Out-of-scope guard.** If the user proposes features that contradict the original PRD's "Out of Scope" section (Section 7), surface as HITL `prd_ambiguity` BEFORE writing any stage files.

---

## Completion Checklist

[ ] Detection ran and announced the chosen path
[ ] (Path A only) Phase 0 orientation complete (master checklist read, recent stages scanned, git state clean)
[ ] (Path A only) Plan-mode question gate ran (Q-features, Q-relationship, Q-conventions, Q-mvp-band, Q-pr-style)
[ ] (Path A only) Complexity assessor dispatched and returned
[ ] (Path A only) Assessment surfaced to user; user authorization received
[ ] (Path A only) phased-plan-writer dispatched once per new stage (incremental mode)
[ ] (Path A only) Master checklist updated with new stage rows (existing rows untouched)
[ ] (Path A only) New plan files + master-checklist update committed on a `chore/add-stages-<lo>-<hi>` branch (no push, no PR — handed off to `/stagecoach:ship-pr`)
[ ] (Path A only) Handoff message printed with the three next-step options (`/ship-pr` for plan-only chore PR / direct `/deliver-stage` / `/run-pipeline` for batch)
[ ] (Path B only) HITL bubble surfaced; user redirected to /stagecoach:setup
[ ] (Path C only) HITL bubble surfaced; user redirected to /stagecoach:setup for bootstrap

---

## Sub-agent return contract

```yaml
status: complete | failed | needs_human
summary: <one paragraph>
artifacts:
  - <list every new stage file path created>
  - docs/plans/00_master_checklist.md (if Path A and updated)
needs_human: false | true
hitl_category: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
hitl_question: null | "<plain-language question>"
hitl_context: null | "<what triggered this>"
```
