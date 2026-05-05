---
name: sp-feature-delivery
description: Orchestrate phased feature delivery from docs/plans/ using a parallel-subagent pipeline (discovery, checklist curation, implementation, spec + quality review) with branching, CI/E2E gates, and live master-checklist updates. Use when the user runs /sp-feature-delivery, says "deliver the next stage", "execute the plan", "ship stage N", "work the checklist", or "implement docs/plans".
---

<!-- skills/sp-feature-delivery/SKILL.md -->

# Feature Delivery (Subagent Orchestrator)

The agent loading this skill is the **orchestrator**. It reads plans, dispatches subagents, merges outputs, and manages the master checklist. It does not write production code itself.

MCPs and project-specific tool configs are defined in the phased plan and read from the project rules file — not discovered at runtime.

## Subagent Roster

Each subagent lives in its own file under `./agents/`. Read the file before dispatching.

| Phase | Subagent file | Model | Effort | Mode |
|-------|--------------|-------|--------|------|
| 1 | [agents/discovery.md](agents/discovery.md) | haiku | medium | readonly |
| 1 | [agents/checklist-curator.md](agents/checklist-curator.md) | sonnet | medium | readonly |
| 4 | [agents/implementer.md](agents/implementer.md) | opus | xhigh | write |
| 4 | [agents/spec-reviewer.md](agents/spec-reviewer.md) | sonnet | medium | readonly |
| 4 | [agents/quality-reviewer.md](agents/quality-reviewer.md) | opus | high | readonly |
| 5 | [agents/ci-cd-guardrails.md](agents/ci-cd-guardrails.md) | sonnet | medium | readonly |

## Preconditions

- `docs/plans/00_master_checklist.md` exists.
- One or more `docs/plans/stage_<n>_*.md` exist.
- Clean git working tree, OR explicit user OK to proceed dirty.

If `docs/plans/` is missing, instruct the user to run `/prd-to-phased-plans` first and stop.

## Workflow

### Phase 0 — Orientation (orchestrator only)

1. Read `docs/plans/00_master_checklist.md` and every `docs/plans/stage_*.md`.
2. Read the project rules file for MCP configs, design-system rules, and any project-specific constraints.
3. Identify the **active stage**: first stage with status `Not Started` or `In Progress`, unless the user named one.
4. Confirm git state: `git status --short`, `git rev-parse --abbrev-ref HEAD`.
5. Switch to **Plan Mode** before continuing.

### Phase 1 — Parallel Reconnaissance

Dispatch both subagents in a **single tool batch**:

1. [agents/discovery.md](agents/discovery.md) — codebase recon (GitNexus-first, grep/glob fallback)
2. [agents/checklist-curator.md](agents/checklist-curator.md) — slice scoping + checklist diff proposal

Merge their reports into the Build Plan in Phase 2.

### Phase 2 — Build Plan + User Authorization

Present a compact plan:

1. Active stage + slice name
2. In-scope checklist items with acceptance tests
3. Out-of-scope items being deferred
4. Touched modules + blast-radius highlights
5. Branch / worktree name
6. Forward-reference risks, open questions

End with: **"Authorize this build plan? (yes / edits / cancel)"** and wait. The implementer does **not** dispatch until the user says yes.

If discovery reported `index_freshness: stale`, run `npx gitnexus analyze` once before re-dispatching discovery (or proceed with the user's blessing).

### Phase 3 — Branch / Worktree Setup

- Branch naming: `feat/stage-<n>-<scope>` | `fix/stage-<n>-<scope>` | `chore/stage-<n>-<scope>`
- Prefer a git worktree per active slice. Never implement directly on `main`/`master`.
- One checklist slice per PR.

### Phase 4 — Implementation Loop (sequential per branch)

For each in-scope item, in dependency order:

1. Dispatch the **implementer** (reads stage plan, updates DB schema first for backend/full-stack stages, then writes code).
2. Dispatch the **spec reviewer** with the implementer's output.
3. Dispatch the **quality reviewer** with both prior outputs.
4. If either reviewer returns `verdict: fail`, send findings back to a fresh implementer dispatch and re-review. Repeat until both `pass`.
5. Apply the curator's checklist diff for this item: flip `[ ]` → `[x]` only after both reviewers pass AND local gates ran green.
6. Commit on the slice branch using the implementer's conventional-commit message.

**HITL handling:** if any subagent returns `needs_human: true`, the orchestrator pauses and uses `ask_user_input_v0` to prompt the user. The answer is appended to the relevant context (PRD Section 6 for `prd_ambiguity`, project rules for credentials, etc.), then the stage is re-dispatched.

### Phase 5 — CI/CD Gates

Before opening a PR, dispatch **ci-cd-guardrails** with the slice diff + workflow inventory + E2E inventory + acceptance test. Wait for its structured verdict.

- `verdict: fail` with `infrastructure_intact: false` → run `sp-ci-cd-scaffold` skill, then re-dispatch.
- `verdict: fail` with `workflow_violations` → send violations back to implementer to remove regressions, then re-dispatch.
- Missing E2E coverage → send proposed specs back to implementer to apply, then re-dispatch.
- **Do not open the PR until verdict is `pass`.**

### Phase 6 — Stage Closeout

When every in-scope item is `[x]`:

1. Flip stage status `In Progress` → `Completed` in `00_master_checklist.md`.
2. Open the PR via `gh pr create` (or `git-commit-push-pr` / `new-branch-and-pr` skill if available).
3. Wait for CI/CD; patch on the same branch until all checks are green.
4. After CI green + PR merged: sync `main`, clean up the slice branch + worktree.
5. Walk the **Completion Checklist** (below). The feature is not done until every box is `[x]`.
6. Report to the user using the **Progress Report Format**.

## Progress Report Format

After each task and at stage closeout:

1. Checklist items completed (with file paths)
2. Files changed (grouped by package/app)
3. Tests run and results (lint, types, unit, integration, E2E by tag)
4. Subagent run summary (which roles ran, how many review loops)
5. Open risks / blockers
6. Next recommended slice

## Hard Constraints

- **Build plan must be authorized** by the user before any implementer subagent runs.
- **One slice per PR.** Never bundle multiple checklist items unless the user explicitly approves it in Phase 2.
- **Checklist edits only after green gates.** Do not optimistically mark items done.
- **Subagent prompts live in `./agents/*.md`.** This SKILL.md is workflow only — never inline subagent prompts here.
- **Never modify other stage plan files** during execution. Plans are static; deviations are noted inline in the checklist.
- **HITL bubbling is mandatory.** Subagents never prompt the user directly. Only the orchestrator calls `ask_user_input_v0`.

## Completion Checklist

Run at the end of every slice. Do not report the feature "done" until every box is `[x]`.

### 1. Plan Tasks Complete

[ ] Every in-scope checklist item from the active `docs/plans/stage_<n>_*.md` is implemented.
[ ] Both `spec-reviewer` and `quality-reviewer` returned `verdict: pass` for each item.
[ ] Local gates green: lint, typecheck, unit, integration, affected E2E.
[ ] No `[ ]` items remain in the active slice (deferred items moved out-of-scope with a note).

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

## Model Override

Subagents use model aliases (`haiku`, `sonnet`, `opus`) that auto-resolve to the latest version per provider. Override the mapping globally with these env vars:

```
ANTHROPIC_DEFAULT_HAIKU_MODEL=<model-id>
ANTHROPIC_DEFAULT_SONNET_MODEL=<model-id>
ANTHROPIC_DEFAULT_OPUS_MODEL=<model-id>
CLAUDE_CODE_SUBAGENT_MODEL=<model-id>   # overrides all sub-agent tiers at once
```

See `references/model-tier-guide.md` for the full tier philosophy and per-provider alias resolution. (This file is created in Wave 4 — link will resolve after that wave completes.)
