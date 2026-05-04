<!-- skills/the-orchestrator/SKILL.md -->
<!-- Top-level orchestrator skill that drives a phased plan end-to-end by dispatching one Opus 4.7 stage-runner subagent per stage in strict sequence, verifying PRs, and ensuring clean return to main between stages. -->

---
name: the-orchestrator
description: Drive an entire phased plan from start to finish by dispatching one Opus 4.7 stage-runner subagent per stage in strict sequence. Reads docs/plans/00_master_checklist.md, runs each stage_<n>_*.md through sp-feature-delivery (or sp-ci-cd-scaffold for the canned Stage 1), verifies the PR + tests, ensures clean return to main, then advances to the next stage. Use when the user runs /the-orchestrator, says "run the whole plan", "ship every stage", "automate the build", or "drive the phased plan to completion". Requires Opus 4.7 as the orchestrator and dispatches Opus 4.7 stage-runner subagents.
---

# The Orchestrator

This is the top-level workflow driver for phased projects. It sits between `prd-to-phased-plans` (which produces the static plan files) and the end of full implementation. Loaded on **Opus 4.7**, it loops through every stage in `docs/plans/00_master_checklist.md` and dispatches one **Opus 4.7 `stage-runner` subagent per stage** to actually do the work. Stages run **strictly sequentially** — never parallel — because each stage's PR must merge to `main` before the next begins.

This skill replaces the manual workflow the user has been doing: opening a fresh chat for each stage and pasting `Complete all steps in @{STAGE_FILE} /sp-feature-delivery`. The orchestrator now does that loop autonomously, with explicit gates and a clean-`main` invariant between stages.

## Subagent Roster

Each subagent lives in `./agents/`. **Read the file before dispatching** and pass the file's full body as the prompt to the `Task` tool.

| When | Subagent file | `subagent_type` | Model (hard cap) | Mode |
| --- | --- | --- | --- | --- |
| Per stage (1..N) | [agents/stage-runner.md](agents/stage-runner.md) | `generalPurpose` | `claude-4.6-opus-high-thinking` | write |
| Between stages, after merge | [agents/pr-reviewer.md](agents/pr-reviewer.md) | `generalPurpose` | `claude-4.6-sonnet-medium-thinking` | readonly |

**Hard model rule:**
- `stage-runner` MUST run on `claude-4.6-opus-high-thinking`. No fallback. This is the user's explicit "Opus 4.7 pre-selected" requirement.
- `pr-reviewer` MUST run on `claude-4.6-sonnet-medium-thinking` (acceptable fallback: `composer-2`, `gemini-3-flash`).

## Inputs and Preconditions

- The current model is Opus 4.7 (orchestrator). If not, stop and tell the user to relaunch on Opus 4.7.
- `docs/plans/00_master_checklist.md` exists.
- Every stage referenced in the master checklist has a corresponding `docs/plans/stage_<n>_*.md` file.
- `git status --short` is clean and the current branch is `main`.
- Local `main` is up to date with `origin/main` (`git pull --ff-only`).
- `gh` CLI is installed and authenticated.
- The `sp-ci-cd-scaffold`, `sp-feature-delivery`, `prd-to-phased-plans` skills are all loadable in this workspace.

If any precondition fails, stop and surface the gap to the user before doing anything else.

## Workflow

### Phase 0 — Read the master checklist

1. Read `docs/plans/00_master_checklist.md`.
2. Build an ordered list of `(stage_n, stage_file_path, status, ship_blocking)` from the file.
3. Identify the **first stage whose status is not `Completed`**. Treat that as the active starting point.
4. If every stage is already `Completed`, skip to **Phase 2 — Final Report**.
5. If any stage is missing its corresponding `stage_<n>_*.md` file, stop and ask the user before proceeding.
6. Confirm the workspace is on `main`, clean tree, latest pulled.

### Phase 1 — Per-stage loop (sequential, never parallel)

For each stage from the active starting point to the last, in order:

1. **Pre-stage state check.** Verify `git status` is clean, current branch is `main`, latest pulled. If not, stop.
2. **Build the stage-runner prompt.** Read [references/per-stage-prompt-template.md](references/per-stage-prompt-template.md). Fill in `{STAGE_N}`, `{STAGE_FILE_PATH}`, and `{STAGE_GOAL}` from the master checklist + stage file.
3. **Dispatch the `stage-runner` subagent.** Read [agents/stage-runner.md](agents/stage-runner.md) and pass its full body + the filled prompt template via the `Task` tool, with `model: "claude-4.6-opus-high-thinking"`. Wait for it to return a structured summary (`{stage_n, branch, pr_url, checklist_items_completed, on_main, tests_green, notes}`).
4. **Dispatch the `pr-reviewer` subagent** (readonly, Sonnet 4.6). Read [agents/pr-reviewer.md](agents/pr-reviewer.md), pass the stage-runner's `pr_url` and `stage_file_path`, wait for `{verdict, scope_drift, ci_status, notes}`.
5. **Walk [references/orchestrator-loop-checklist.md](references/orchestrator-loop-checklist.md) end-to-end.** If any item fails, surface it to the user and **stop the loop** — do not silently advance to the next stage.
6. **Verify clean `main` invariant.** Run `git branch --list` and confirm only `main` (and any pre-existing long-lived branches the user explicitly listed) remain locally. If a leftover slice branch exists, run `git branch -d <name>` and prune any worktrees (`git worktree remove <path>`, `git worktree prune`). Confirm `git status --short` is empty on `main`.
7. **Update the master checklist.** Flip the stage row in `00_master_checklist.md` from `In Progress` (or `Not Started`) to `Completed`. Per-task `[x]` flips were already done by `sp-feature-delivery` (or `sp-ci-cd-scaffold` for stage 1). The orchestrator only updates the stage-level status.
8. **Report stage completion to the user.** One concise paragraph: stage N done, PR URL, checklist items closed, notes from pr-reviewer.
9. Advance to the next stage. Repeat from step 1 until no stages remain.

### Phase 2 — Final Report

When every stage in the master checklist is `Completed`:

1. Confirm `git status` clean, on `main`, no leftover branches, no leftover worktrees.
2. Confirm every PR listed in stage-runner summaries is merged.
3. Report to the user using the **Final Report Format** below.

## Stage-Runner Dispatch Cheat Sheet

```
Task(
  subagent_type: "generalPurpose",
  model: "claude-4.6-opus-high-thinking",   # NEVER substitute
  description: "Run stage <N>",
  prompt: <full body of agents/stage-runner.md, plus the filled-in
           per-stage-prompt-template.md, plus the absolute path to
           docs/plans/stage_<N>_*.md and the stage's goal sentence>,
  readonly: false
)
```

Approved fallback for `pr-reviewer` only: `composer-2`, `gemini-3-flash`. Never substitute `stage-runner` upward or downward.

## Per-Stage Prompt Variables

Filled into [references/per-stage-prompt-template.md](references/per-stage-prompt-template.md):

- `{STAGE_N}` — the stage number (e.g. `2`).
- `{STAGE_FILE_PATH}` — absolute or workspace-relative path to `docs/plans/stage_<n>_*.md`.
- `{STAGE_GOAL}` — the goal sentence from the stage file.
- `{SKILL_TO_LOAD}` — `sp-ci-cd-scaffold` for stage 1 (canned), `sp-feature-delivery` for every other stage.

## Stage 1 Special Case

Stage 1 is always the canned CI/CD scaffold (per `prd-to-phased-plans`). For Stage 1:

- Set `{SKILL_TO_LOAD}` to `sp-ci-cd-scaffold`.
- The stage-runner loads `sp-ci-cd-scaffold` instead of `sp-feature-delivery`.
- Everything else (PR review, master checklist update, clean-main invariant) is identical.

## Progress Report Format (per stage)

After each stage completes:

```
Stage <N> — <name> ✓ Completed
- Branch: <slice branch name> (deleted)
- PR: <pr url> (merged, CI green)
- Checklist items closed: <count>
- pr-reviewer verdict: pass | fail
- Notes: <one line>
On main, clean tree, advancing to Stage <N+1>.
```

## Final Report Format

```
The Orchestrator — plan complete

Stages completed: <N> of <N>
PRs merged: <list of PR URLs in stage order>
Master checklist: docs/plans/00_master_checklist.md (all stages Completed)
Working tree: clean on main, no leftover branches

Recommended next: <empty | open Phase 2 work | run another orchestrator pass>
```

## Hard Constraints

- **Stage-runner model is non-negotiable.** Every `Task` dispatch for `stage-runner` MUST use `model: "claude-4.6-opus-high-thinking"`. No fallback. If unavailable, stop and tell the user.
- **Strictly sequential.** Never dispatch two `stage-runner` subagents in parallel. Stage N+1 cannot begin until stage N's PR is merged, `main` is clean, and the loop checklist passed.
- **Orchestrator never edits production code.** The orchestrator only reads plans, dispatches subagents, walks the loop checklist, and updates `00_master_checklist.md` stage-level statuses.
- **Loop halts on first failed item.** If any item in `orchestrator-loop-checklist.md` fails, surface to the user and stop. Never silently advance.
- **Clean-main invariant between stages.** After every stage, working tree must be clean on `main` with no leftover slice branches or worktrees. The orchestrator enforces this before dispatching the next stage-runner.
- **Master checklist is the source of truth** for stage ordering and completion status. The orchestrator never re-orders stages.
- **Stage 1 uses `sp-ci-cd-scaffold`**, not `sp-feature-delivery`. The orchestrator selects the right skill per stage.
- **No new commands without authorization.** If the user did not run `/the-orchestrator` or one of the trigger phrases, do not auto-start.

## Triggers

Follow this skill whenever the user:

- runs `/the-orchestrator`
- says "run the whole plan", "ship every stage", "automate the build", "drive the phased plan to completion", "execute all stages"
- explicitly hands the orchestrator the master checklist and asks for autonomous delivery

If the user only wants one stage, redirect to `/sp-feature-delivery` (or `sp-ci-cd-scaffold` for stage 1).

## Fallbacks

- **No `pr-reviewer` model available?** Stop and tell the user. The PR review gate is required.
- **No `stage-runner` model available?** Hard stop. Opus 4.7 is required for stage execution.
- **Master checklist drift mid-run** (someone hand-edited stage statuses while the orchestrator was running)? Re-read the file before each loop iteration; if a stage already shows `Completed` but the orchestrator did not run it, ask the user before continuing.
- **CI failure on a stage PR?** That is the stage-runner's responsibility (via `sp-feature-delivery` Phase 5). The orchestrator only advances after the stage-runner reports `tests_green: true` AND `pr-reviewer` returns `verdict: pass`.
