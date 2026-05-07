<!-- skills/deliver-stage/SKILL.md -->
<!-- The everyday delivery loop. Reads the master checklist, picks the next Not-Started stage, dispatches the right sub-skill or internal pipeline by stage type, runs basic checks + type-aware aggregating test review, and opens the PR. Replaces v2 ship-feature + ship-frontend in v3. -->

---
name: deliver-stage
description: The everyday stage-delivery orchestrator. Reads the master checklist, picks the next Not-Started stage, dispatches the right sub-skill (init-design-system / scaffold-ci-cd / setup-environment) or internal pipeline (frontend / backend / full-stack / db-schema) by stage type, runs spec/quality review, basic checks (lint/type/build), and a type-aware aggregating test review (dev server + browser UAT for frontend; CI gates only for backend), then opens the PR. Use when the user runs /deliver-stage, says "deliver the next stage", "ship stage N", "work the checklist", "ship a slice", or "execute docs/plans".
user-invocable: true
triggers: ["/stagecoach:deliver-stage", "/deliver-stage", "deliver the next stage", "ship the next slice", "work the checklist"]
---

# /deliver-stage — The Everyday Delivery Loop

The agent loading this skill is the **orchestrator** for one stage of the master checklist. It reads plans, routes by stage `type:`, dispatches subagents, merges their structured outputs, and gates the PR on real verification.

**The orchestrator does not write production code itself.** Every heavy step is a subagent or a sub-skill.

Run `/deliver-stage` → finish a slice → start a fresh chat → run again. Repeat until every row in `docs/plans/00_master_checklist.md` is `[x]`. For multi-stage autonomous delivery (experimental), see `/run-pipeline`. For mid-flight feature additions, see `/add-feature` (it feeds into `deliver-stage`).

---

## Subagent Roster

Each subagent lives in its own file under `./agents/`. **Read the file before dispatching.**

### Core (every stage type)

| Phase | Agent file | Model | Effort | Mode |
|-------|-----------|-------|--------|------|
| 1 | [agents/discovery.md](agents/discovery.md) | haiku | medium | readonly |
| 1 | [agents/checklist-curator.md](agents/checklist-curator.md) | sonnet | medium | readonly |
| 1 | [agents/rules-loader.md](agents/rules-loader.md) | haiku | low | readonly |
| 4 (backend/full-stack/db-schema/infrastructure) | [agents/implementer.md](agents/implementer.md) | opus | xhigh | write |
| 5 | [agents/spec-reviewer.md](agents/spec-reviewer.md) | sonnet | medium | readonly |
| 5 | [agents/quality-reviewer.md](agents/quality-reviewer.md) | opus | high | readonly |
| 6 | [agents/basic-checks-runner.md](agents/basic-checks-runner.md) | haiku | low | write |
| 6 / 7 (on fail) | [agents/fix-attempter.md](agents/fix-attempter.md) | sonnet | high | write |
| 6 / 7 (on 2nd fail) | [agents/debug-instrumenter.md](agents/debug-instrumenter.md) | sonnet | high | write |
| 7 (frontend/full-stack/backend/db-schema) | [agents/aggregating-test-reviewer.md](agents/aggregating-test-reviewer.md) | sonnet | high | write |
| 8 | [agents/ci-cd-guardrails.md](agents/ci-cd-guardrails.md) | sonnet | medium | readonly |

### Frontend pipeline (Phase 4, `type: frontend`)

| Step | Agent file | Model | Mode |
|------|-----------|-------|------|
| 4.1 | [agents/frontend/modern-ux-expert.md](agents/frontend/modern-ux-expert.md) | sonnet | write |
| 4.2 | [agents/frontend/layout-architect.md](agents/frontend/layout-architect.md) | sonnet | write |
| 4.3 (always) | [agents/frontend/block-composer.md](agents/frontend/block-composer.md) | sonnet | write |
| 4.4 (conditional on gaps) | [agents/frontend/component-crafter.md](agents/frontend/component-crafter.md) | sonnet | write |
| 4.5 (Library Preview Gate) | [agents/frontend/library-entry-writer.md](agents/frontend/library-entry-writer.md) | sonnet | write |
| 4.6 | [agents/frontend/state-illustrator.md](agents/frontend/state-illustrator.md) | sonnet | write |
| 4.7 | [agents/frontend/visual-reviewer.md](agents/frontend/visual-reviewer.md) | sonnet | readonly |

### Sub-skill dispatches (Phase 4, foundation stage types)

| Stage `type` | Sub-skill (path) |
|---|---|
| `design-system` | [`skills/sub-disciplines/init-design-system/SKILL.md`](../sub-disciplines/init-design-system/SKILL.md) |
| `ci-cd` | [`skills/sub-disciplines/scaffold-ci-cd/SKILL.md`](../sub-disciplines/scaffold-ci-cd/SKILL.md) |
| `env-setup` | [`skills/sub-disciplines/setup-environment/SKILL.md`](../sub-disciplines/setup-environment/SKILL.md) |

---

## Preconditions

- `docs/plans/00_master_checklist.md` exists.
- One or more `docs/plans/stage_<n>_*.md` exist.
- Clean git working tree, OR explicit user OK to proceed dirty.

If `docs/plans/` is missing, instruct the user to run `/plan-phases` first and stop.

---

## Project Config

If `stagecoach.config.json` exists at the project root, the `rules-loader` agent (Phase 1) reads it and returns resolved values. Honor:

- `modelTiers.<agent>` — overrides the agent file's `model:` for THIS run
- `stages.maxTasksPerStage` — overrides the default cap of 6 (warn if user sets > 8)
- `mcps.*` — declarative MCP availability
- `visualReview.tools` / `visualReview.vizzly` — passed to `aggregating-test-reviewer`

See [`skills/setup/references/stagecoach-config-schema.md`](../setup/references/stagecoach-config-schema.md) for the full schema.

---

## Stage-Type Routing

Phase 4 routes the work based on the active stage's `type:` frontmatter:

| `type:` | Phase 4 path |
|---|---|
| `design-system` | Dispatch the `init-design-system` sub-skill. Skip Phase 4 internal implementer. |
| `ci-cd` | Dispatch the `scaffold-ci-cd` sub-skill. Skip Phase 4 internal implementer. |
| `env-setup` | Dispatch the `setup-environment` sub-skill. Skip Phase 4 internal implementer. |
| `frontend` | Run the internal frontend pipeline (4.1 → 4.6). |
| `backend` | Dispatch the internal `implementer` agent. |
| `full-stack` | Dispatch the internal `implementer` agent (covers both UI and API code). |
| `db-schema` | Dispatch the internal `implementer` agent with DB context flag. Schema updated FIRST in `db/schema.sql` (or detected equivalent). |
| `infrastructure` | Dispatch the internal `implementer` agent. |

After Phase 4, Phases 5–9 run regardless of stage type (with type-aware depth in Phase 7).

---

## Workflow

### Phase 0 — Orientation

1. Read `docs/plans/00_master_checklist.md` and every `docs/plans/stage_*.md`.
2. Identify the **active stage**: first stage with status `Not Started` or `In Progress`, unless the user named one.
3. Confirm git state: `git status --short`, `git rev-parse --abbrev-ref HEAD`.
4. Switch to **Plan Mode** before continuing.

### Phase 1 — Reconnaissance (parallel)

Dispatch all three subagents in a **single tool batch**:

1. `discovery` — codebase recon
2. `checklist-curator` — slice scoping + checklist diff proposal
3. `rules-loader` — project rules file + `stagecoach.config.json` resolution

Merge their reports into the Build Plan in Phase 2.

### Phase 2 — Build Plan + User Authorization

Present a compact plan:

1. Active stage + slice name + stage `type:`
2. In-scope checklist items with acceptance tests
3. Out-of-scope items being deferred
4. Touched modules + blast-radius highlights
5. Sub-skill or pipeline that will dispatch in Phase 4
6. Branch / worktree name
7. MCP availability + visual-review tools
8. Forward-reference risks, open questions

End with: **"Authorize this build plan? (yes / edits / cancel)"** and wait. Phase 4 does not start until the user says yes.

**Always provide a recommended answer in available options** when prompting.

If discovery reported `index_freshness: stale`, run `npx gitnexus analyze` once before re-dispatching discovery (or proceed with the user's blessing).

### Phase 3 — Branch / Worktree Setup

- Branch naming: `feat/stage-<n>-<scope>` | `fix/stage-<n>-<scope>` | `chore/stage-<n>-<scope>`
- Prefer a git worktree per active slice. Never implement directly on `main`/`master`.
- One checklist slice per PR.

### Phase 4 — Stage-Type Routing

Per the routing table above:

#### `design-system` / `ci-cd` / `env-setup` — Sub-skill dispatch

Load the corresponding sub-skill SKILL.md and follow it end-to-end. The sub-skill returns the structured contract; the orchestrator records the artifacts and proceeds to Phase 5.

#### `frontend` — Internal frontend pipeline

Run sequentially:

1. **4.1 — `modern-ux-expert`** → outputs `docs/ux-spec-<slice>.md` (UX strategy with 2–3 best-in-class references)
2. **4.2 — `layout-architect`** → route files, layout components, breakpoint plan
3. **4.3 — `block-composer`** (always first) → composes from shadcn blocks; reports `ui_coverage_percent`
4. **4.4 — `component-crafter`** (only if `block-composer` reports gaps) → token-only custom components
5. **4.5 — Library Preview Gate** (non-skippable):
   - **Trigger.** Library preview gate is non-skippable and fires whenever a stage (a) authors a new component or block, OR (b) modifies any user-visible surface of an existing library component (props, copy, content, variants, states, or styles) as it appears in a production route. In the modify case, the existing `/library/<slug>` entry must be updated to reflect the change and re-approved before the production-route edit lands. Pure internal refactors with no rendered-output delta are exempt.
   - Dispatch `library-entry-writer` with one of two **modes** per item:
     - `mode: "new"` for every component / block emitted by 4.3 and 4.4 → appends a fresh `/library/<slug>` entry with the full variants × states matrix.
     - `mode: "modify"` for every existing library component whose user-visible surface changed under condition (b) → updates the existing `/library/<slug>` entry in place with the delta (copy / prop / content / variant / state / style change), leaving the registry row alone unless tags or name genuinely changed.
   - Both modes render all variants × all states (default / hover / focus / disabled / loading / empty / error / populated).
   - Stop and ask the user via `ask_user_input_v0` (or bubble HITL with `hitl_category: "creative_direction"`):
     > "I've added `<component name>` to `/library` — please review and tell me if the design is approved, needs revision, or should be rejected."
   - On **approved** → import the component from the library into the production route(s) named by the stage spec (or, in the modify case, land the consumer-route edit). Continue to Phase 4.6.
   - On **revision** → re-dispatch `component-crafter` with the user's notes, then re-run 4.5 for the revised component. Cap at 2 revision loops; on the 3rd round, surface as HITL `creative_direction` and stop.
   - On **rejected** → remove the library entry (delete the `/library/<slug>/` page and the corresponding `_registry/entries.ts` line) and surface as HITL `creative_direction` for the user to redirect.
   - **No production-route imports happen before approval.** `library-entry-writer`'s output contract requires `production_imports_added: 0`.
6. **4.6 — `state-illustrator`** → ensures every interactive surface has loading / empty / error / success states (in production routes; the library version was already populated by 4.5)
7. **4.7 — `visual-reviewer`** (loops on fail) → pass: continue; fail: re-dispatch the responsible producer with the critique. Cap 2 retry loops; on third failure HITL `creative_direction`.

**Hard rules:**
- `block-composer` MUST run and report before `component-crafter` is considered. Never skip block composition.
- **Library preview gate is non-skippable and fires whenever a stage (a) authors a new component or block, OR (b) modifies any user-visible surface of an existing library component (props, copy, content, variants, states, or styles) as it appears in a production route. In the modify case, the existing `/library/<slug>` entry must be updated to reflect the change and re-approved before the production-route edit lands. Pure internal refactors with no rendered-output delta are exempt.** Library-first applies even to single-component stages and to "small" consumer-side edits like copy or prop changes.

#### `backend` / `full-stack` / `db-schema` / `infrastructure` — Internal implementer

For each in-scope checklist item, in dependency order:

1. Dispatch the **implementer** (for `db-schema` and `full-stack` involving DB: schema is updated FIRST in `db/schema.sql` or detected equivalent before any code).
2. Dispatch the **spec reviewer** with the implementer's output.
3. Dispatch the **quality reviewer** with both prior outputs.
4. If either reviewer returns `verdict: fail`, send findings back to a fresh implementer dispatch and re-review. Repeat until both `pass`.
5. Apply the curator's checklist diff for this item: flip `[ ]` → `[x]` only after both reviewers pass AND local gates ran green.
6. Commit on the slice branch using the implementer's conventional-commit message.

### Phase 5 — Per-item review loop

For frontend / sub-skill paths, dispatch `spec-reviewer` and `quality-reviewer` against the produced artifacts. Loop the same way (fail → re-dispatch responsible producer → re-review).

### Phase 6 — Pre-summary basic checks (NEW)

Dispatch `basic-checks-runner` to run lint → typecheck → build sequentially.

- `overall: pass` → continue to Phase 7.
- `overall: fail` (1st time) → dispatch `fix-attempter` with the report + slice diff. Re-run `basic-checks-runner`.
- Still failing (2nd time) → dispatch `debug-instrumenter` to add targeted logging. Re-run `basic-checks-runner` (now with extra telemetry). Then dispatch `fix-attempter` again with the new richer report. Re-run `basic-checks-runner`.
- Cap 3 total loops. On 3rd persistent failure → bubble HITL with full evidence.

After green, the orchestrator runs the strip pattern from `debug-instrumenter` (if it ran) to remove `// INSTRUMENT` lines, then commits a "remove debug instrumentation" sweep.

### Phase 7 — Aggregating test review (NEW — TYPE-AWARE)

Dispatch `aggregating-test-reviewer`. Pass the stage type so the agent picks the right depth:

- **`frontend` / `full-stack`** → FULL review: dev server boot, CI gates, Claude-in-Chrome UAT, visual diff against tokens
- **`backend` / `db-schema` / `infrastructure`** → REDUCED review: CI gates only, no browser UAT, no visual diff
- **`design-system` / `ci-cd` / `env-setup`** → SKIP this phase (basic-checks-runner is sufficient for foundation stages)

Same fix loop as Phase 6:

- 1st fail → `fix-attempter` with full report → re-run aggregating-test-reviewer
- 2nd fail → `debug-instrumenter` → re-run aggregating-test-reviewer → `fix-attempter` → re-run
- Cap 3 total loops. On 3rd persistent failure → bubble HITL with full evidence.

### Phase 8 — CI/CD Guardrails

Dispatch `ci-cd-guardrails` with the slice diff + workflow inventory + E2E inventory + acceptance test. Wait for its structured verdict.

- `verdict: fail` with `infrastructure_intact: false` → run `scaffold-ci-cd` sub-skill, then re-dispatch.
- `verdict: fail` with `workflow_violations` → send violations back to implementer to remove regressions, then re-dispatch.
- Missing E2E coverage → send proposed specs back to implementer to apply, then re-dispatch.
- **Do not open the PR until verdict is `pass`.**

### Phase 9 — Stage Closeout

When every in-scope item is `[x]`:

1. Flip stage status `In Progress` → `Completed` in `00_master_checklist.md`.
2. Open the PR via `gh pr create` (or `git-commit-push-pr` / `new-branch-and-pr` skill if available).
3. Wait for CI/CD; patch on the same branch until all checks are green.
4. After CI green + PR merged: sync `main`, clean up the slice branch + worktree.
5. Walk the **Completion Checklist** (below). The feature is not done until every box is `[x]`.
6. Report to the user using the **Progress Report Format**.

---

## HITL Handling

If any subagent or sub-skill returns `needs_human: true`, the orchestrator pauses and uses `ask_user_input_v0` to prompt the user. The answer is appended to the relevant context (PRD Section 6 for `prd_ambiguity`, project rules for credentials, etc.), then the dispatch is repeated.

Subagents NEVER prompt the user directly. Only the orchestrator calls `ask_user_input_v0`.

---

## Progress Report Format

After each task and at stage closeout:

1. Checklist items completed (with file paths)
2. Files changed (grouped by package/app)
3. Tests run and results (lint, types, unit, integration, E2E by tag, browser UAT)
4. Subagent run summary (which roles ran, how many review loops, fix-attempter / debug-instrumenter activity)
5. Open risks / blockers
6. Next recommended slice

---

## Hard Constraints

- **Build plan must be authorized** by the user before any producer subagent runs (Phase 4 onward).
- **One slice per PR.** Never bundle multiple checklist items unless the user explicitly approves it in Phase 2.
- **Checklist edits only after green gates.** Do not optimistically mark items done.
- **Subagent prompts live in `./agents/*.md`.** This SKILL.md is workflow only — never inline subagent prompts here.
- **Never modify other stage plan files** during execution. Plans are static; deviations are noted inline in the checklist.
- **HITL bubbling is mandatory.** Subagents never prompt the user directly. Only the orchestrator calls `ask_user_input_v0`.
- **Always provide a recommended answer in available options** at every elicitation point.
- **Phase 6 (basic-checks) and Phase 7 (aggregating-test-review) gate the output summary.** No "stage complete" report until both pass (or are intentionally skipped per stage type).
- **Strip `// INSTRUMENT` lines** before final commit if `debug-instrumenter` ran.

---

## Completion Checklist

Run at the end of every slice. Do not report the feature "done" until every box is `[x]`.

### 1. Plan Tasks Complete

[ ] Every in-scope checklist item from the active `docs/plans/stage_<n>_*.md` is implemented.
[ ] Both `spec-reviewer` and `quality-reviewer` returned `verdict: pass` for each item.
[ ] Local gates green: lint, typecheck, build (Phase 6 `basic-checks-runner`).
[ ] Aggregating test review passed for non-foundation stages (Phase 7).
[ ] No `[ ]` items remain in the active slice (deferred items moved out-of-scope with a note).
[ ] If `debug-instrumenter` ran, every `// INSTRUMENT` line was stripped before final commit.

### 1a. Library Preview Gate (frontend / full-stack with UI only)

Skip only if the stage is `type: backend`, `db-schema`, or `infrastructure` with zero UI changes, OR the stage is a pure internal refactor with no rendered-output delta in any production route.

[ ] Every component / block delivered in this stage has a `/library` entry with all variants and states (default / hover / focus / disabled / loading / empty / error / populated).
[ ] Every existing library component whose user-visible surface (props, copy, content, variants, states, or styles) changed in a production route has its `/library/<slug>` entry updated to reflect the change.
[ ] User-approved each component at the library preview gate before any production-route import or consumer-side edit landed.
[ ] No component imported into a production route, and no user-visible consumer-side edit committed, without library-first review.

### 2. Master Checklist Updated

[ ] Every completed item is flipped `[ ]` → `[x]` in `docs/plans/00_master_checklist.md`.
[ ] Stage status updated (`Not Started` → `In Progress` → `Completed`) to match reality.
[ ] Stage-level exit criteria boxes ticked where satisfied.
[ ] Inline notes added next to any item whose scope deviated from the plan.
[ ] Edits committed on the slice branch (not on `main`).

### 3. PR Created and Submitted

[ ] One slice = one PR. No bundling unless the user authorized it in Phase 2.
[ ] Branch follows naming: `feat/` | `fix/` | `chore/` + `stage-<n>-<scope>`.
[ ] PR description references: stage + slice, checklist items closed, test evidence, screenshots/logs if UI.
[ ] PR is targeted at `main` and is not draft unless the user requested draft.

### 4. E2E Tests Added to CI/CD (if applicable)

Skip only if the slice is documentation-only or has zero observable behavior change.

[ ] New behavior covered by a `@feature`-tagged E2E spec.
[ ] Critical existing flows touched by this slice covered by `@regression-core`.
[ ] `.github/workflows/ci.yml` and `e2e.yml` exist and reference the new specs.
[ ] Failure artifacts (trace / video / report) upload step is present in the workflow.
[ ] New specs run green locally before pushing.

### 5. CI/CD Passing on the PR

[ ] `ci-cd-guardrails` returned `verdict: pass`.
[ ] All required GitHub Actions checks completed and green.
[ ] If any check failed: read logs, patch on the same branch, push, repeat until all pass.
[ ] Final CI run reflects the latest commit on the PR head.

### 6. Branch Cleanup and Return to Main

Only after CI is fully green and the PR is merged:

[ ] PR merged into `main`.
[ ] Local `main` updated: `git checkout main && git pull --ff-only origin main`.
[ ] Local slice branch deleted: `git branch -d <branch>`.
[ ] Remote slice branch deleted (skip if auto-deleted by GitHub).
[ ] If a worktree was used: `git worktree remove <path>` and `git worktree prune`.
[ ] Final `git status` shows clean tree on `main`.
[ ] Final state reported to the user using the Progress Report Format.

---

## Model Override

Subagents use model aliases (`haiku`, `sonnet`, `opus`) that auto-resolve to the latest version per provider. Override the mapping globally with these env vars:

```
ANTHROPIC_DEFAULT_HAIKU_MODEL=<model-id>
ANTHROPIC_DEFAULT_SONNET_MODEL=<model-id>
ANTHROPIC_DEFAULT_OPUS_MODEL=<model-id>
CLAUDE_CODE_SUBAGENT_MODEL=<model-id>   # overrides all sub-agent tiers at once
```

See [`skills/setup/references/model-tier-guide.md`](../setup/references/model-tier-guide.md) for the full tier philosophy and per-provider alias resolution.
