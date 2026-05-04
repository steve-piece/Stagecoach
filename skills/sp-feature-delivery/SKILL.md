---
name: sp-feature-delivery
description: Orchestrate phased feature delivery from docs/plans/ using a parallel-subagent pipeline (discovery, checklist curation, skill/MCP scouting, implementation, spec + quality review) with branching, CI/E2E gates, and live master-checklist updates. Use when the user runs /sp-feature-delivery, says "deliver the next stage", "execute the plan", "ship stage N", "work the checklist", or "implement docs/plans". Requires Opus 4.7 as the orchestrator; all subagents MUST use Sonnet 4.6 or smaller models.
---

<!-- skills/sp-feature-delivery/SKILL.md -->
<!-- Orchestrator skill that drives docs/plans/ stages via six standalone subagents (defined in ./agents/*.md) capped at Sonnet 4.6. -->

# Feature Delivery (Subagent Orchestrator)

This skill replaces the legacy `/sp-feature-delivery` command. The agent loading this skill is the **orchestrator** and runs on **Opus 4.7** (the model the user authorized for the "build plan" step). The orchestrator does not write production code itself — it reads plans, dispatches subagents, and merges their outputs back into the master checklist.

## Subagent Roster

Each subagent lives in its own file under `./agents/`. **Read the file before dispatching**, then pass the file's prompt to the `Task` tool. Never inline the prompts here.

| Phase | Subagent file                          | `subagent_type`         | Model (hard cap)                    | Mode     |
| ----- | -------------------------------------- | ----------------------- | ----------------------------------- | -------- |
| 1     | [agents/discovery.md](agents/discovery.md)               | `explore`               | `claude-4.6-sonnet-medium-thinking` | readonly |
| 1     | [agents/checklist-curator.md](agents/checklist-curator.md) | `generalPurpose`        | `claude-4.6-sonnet-medium-thinking` | readonly |
| 1     | [agents/skill-mcp-scout.md](agents/skill-mcp-scout.md)     | `generalPurpose`        | `claude-4.6-sonnet-medium-thinking` | readonly |
| 4     | [agents/implementer.md](agents/implementer.md)             | `generalPurpose`        | `claude-4.6-sonnet-medium-thinking` | write    |
| 4     | [agents/spec-reviewer.md](agents/spec-reviewer.md)         | `code-reviewer`         | `claude-4.6-sonnet-medium-thinking` | readonly |
| 4     | [agents/quality-reviewer.md](agents/quality-reviewer.md)   | `correctness-reviewer`  | `claude-4.6-sonnet-medium-thinking` | readonly |
| 5     | [agents/ci-cd-guardrails.md](agents/ci-cd-guardrails.md)   | `generalPurpose`        | `claude-4.6-sonnet-medium-thinking` | readonly |

**Hard model rule:** every `Task` call MUST set `model: "claude-4.6-sonnet-medium-thinking"` (or fall back to `composer-2` / `gemini-3-flash` if unavailable). Never substitute upward — no Opus, no GPT‑5.x, no Sonnet > 4.6, no Gemini ≥ 3.1.

## Inputs and Preconditions

- `docs/plans/00_master_checklist.md` exists.
- One or more `docs/plans/stage_<n>_*.md` exist.
- The current model is Opus 4.7 (orchestrator). If not, stop and tell the user to relaunch on Opus 4.7.
- Clean git working tree, OR explicit user OK to proceed dirty.

If `docs/plans/` is missing, instruct the user to run `/prd-to-phased-plans` first and stop.

## Workflow

### Phase 0 — Orientation (orchestrator only)

1. Read `docs/plans/00_master_checklist.md`.
2. Read every `docs/plans/stage_*.md`.
3. Read `.cursor/rules/*.mdc` if present (especially `prd-ci-cd-checklist.mdc`).
4. Identify the **active stage**: the first stage whose checklist status is `Not Started` or `In Progress`, unless the user named one.
5. Confirm git state: `git status --short`, `git rev-parse --abbrev-ref HEAD`.
6. Switch to **Plan Mode** before continuing.

### Phase 1 — Parallel Reconnaissance (3 subagents in one batch)

Read these three files first, then dispatch all three subagents in a **single tool batch** so they run in parallel:

1. [agents/discovery.md](agents/discovery.md) — codebase + GitNexus reconnaissance
2. [agents/checklist-curator.md](agents/checklist-curator.md) — slice scoping + checklist diff proposal
3. [agents/skill-mcp-scout.md](agents/skill-mcp-scout.md) — skill / MCP / rule discovery for the upcoming work

Each agent file specifies its own input contract (what to paste into the prompt), output contract (the structured report it returns), and hard constraints. Follow them verbatim.

When all three return, the orchestrator merges their reports into the **Build Plan** in Phase 2.

### Phase 2 — Build Plan + User Authorization (orchestrator only)

Present a single, compact plan in chat:

1. Active stage + slice name (from curator)
2. In-scope checklist items with acceptance tests (from curator)
3. Out-of-scope items being deferred (from curator)
4. Touched modules + blast-radius highlights (from discovery)
5. Skills + MCP servers + rules the implementer will load (from scout)
6. Branch / worktree name
7. Index freshness, forward-reference risks, open questions

End with: **"Authorize this build plan? (yes / edits / cancel)"** and wait. The implementer subagent does **not** dispatch until the user says yes. This is the explicit "build plan" gate the user authorizes on Opus 4.7.

If discovery reported `index_freshness: stale`, run `npx gitnexus analyze` once before re-dispatching discovery (or proceed with the user's blessing if they accept the staleness).

### Phase 3 — Branch / Worktree Setup (orchestrator only)

After authorization:

- Branch naming:
  - `feat/stage-<n>-<scope>` for new behavior
  - `fix/stage-<n>-<scope>` for bug fixes
  - `chore/stage-<n>-<scope>` for refactors / infra
- Prefer a git worktree per active slice (use the `using-git-worktrees` or `git-worktree` skill if available). Never implement directly on `main`/`master`.
- Keep one checklist slice per PR.

### Phase 4 — Implementation Loop (sequential per branch)

For each in-scope item, in dependency order:

1. Read [agents/implementer.md](agents/implementer.md) and dispatch the implementer subagent with the inputs that file requires.
2. Read [agents/spec-reviewer.md](agents/spec-reviewer.md) and dispatch the spec reviewer with the implementer's output.
3. Read [agents/quality-reviewer.md](agents/quality-reviewer.md) and dispatch the quality reviewer with both prior outputs.
4. If either reviewer returns `verdict: fail`, append the findings to a fresh implementer dispatch and re-review. Repeat until both `pass`.
5. **Apply the curator's checklist diff** for this item (orchestrator, directly via `StrReplace`): flip `[ ]` → `[x]` only after both reviewers pass AND local gates ran green. Add a one-line note next to the item if scope deviated.
6. Commit on the slice branch using the implementer's suggested conventional-commit message (already done by implementer, but verify the sha exists).

### Phase 5 — CI/CD + E2E Gates (orchestrator)

For each slice, before opening a PR:

- Local gates (must be green): lint, typecheck, unit/integration, affected E2E.
- E2E structure:
  - `@feature` suite for new/changed behavior
  - `@regression-core` suite for critical existing flows
  - rerun impacted historical suites when shared components/routes change
- If `.github/workflows/ci.yml` or `e2e.yml` are missing, stop and run the `sp-ci-cd-scaffold` skill first.
- If the slice touches shared modules/routes, widen E2E tags accordingly.
- Artifact upload on E2E failure (trace/video/report) must be in the workflow.

**Dispatch the `ci-cd-guardrails` subagent before opening the PR.** Read [agents/ci-cd-guardrails.md](agents/ci-cd-guardrails.md), pass it the slice diff + workflow inventory + existing E2E inventory + acceptance test, and wait for its structured verdict.

- If the subagent returns `verdict: fail`:
  - For `infrastructure_intact: false`, run the `sp-ci-cd-scaffold` skill, then re-dispatch.
  - For `workflow_violations`, send the violations back to the implementer to remove the regressions, then re-dispatch.
  - For missing E2E coverage (`acceptance_test_observable_by` empty or `proposed_specs` non-empty), send the proposed specs back to the implementer to apply, then re-dispatch.
- **Do not open the PR until the guardrails verdict is `pass`.**

Never mark a checklist item `[x]` until the gate that proves it is green.

### Phase 6 — Stage Closeout (orchestrator)

When every in-scope item in the active stage is `[x]`:

1. Flip the stage's status from `In Progress` → `Completed` in `00_master_checklist.md`.
2. Update any stage-level exit criteria checkboxes the slice satisfied.
3. Open the PR using the `git-commit-push-pr` or `new-branch-and-pr` skill if available; otherwise fall back to `gh pr create`.
4. Wait for CI/CD to finish; if any required check fails, patch on the same branch and push until every check is green.
5. After CI is green and the PR is merged, sync `main` and clean up the slice branch + worktree so the orchestrator finishes on a clean `main`.
6. Walk [references/completion-checklist.md](references/completion-checklist.md) end-to-end and confirm every box is `[x]` before declaring the feature delivered.
7. Report to the user using the **Progress Report Format** below.

## Subagent Dispatch Cheat Sheet

```
Task(
  subagent_type: <from the agent file's frontmatter>,
  model: "claude-4.6-sonnet-medium-thinking",
  description: <5-word title from the role>,
  prompt: <the full body of agents/<role>.md, with input placeholders filled in>,
  readonly: <from the agent file's frontmatter>
)
```

Approved fallback models if the default is unavailable: `composer-2`, `gemini-3-flash`. Never substitute upward.

Parallelism rules:
- **Phase 1 reconnaissance:** dispatch the 3 readonly subagents in **one** tool batch.
- **Phase 4 implementation:** strictly sequential per branch. Do not parallelize implementers on the same worktree.
- Independent slices on independent worktrees may run in parallel — but only after the orchestrator confirms the worktrees are isolated.

## Progress Report Format

After each task and at stage closeout, report to the user:

1. Checklist items completed (with file paths)
2. Files changed (grouped by package/app)
3. Tests run and results (lint, types, unit, integration, E2E by tag)
4. Subagent run summary (which roles ran, how many review loops)
5. Open risks / blockers
6. Next recommended slice

## Hard Constraints

- **Model cap is non-negotiable.** Subagents must run on `claude-4.6-sonnet-medium-thinking`, `composer-2`, or `gemini-3-flash`. The orchestrator stays on Opus 4.7.
- **Build plan must be authorized** by the user before any implementer subagent runs.
- **One slice per PR.** Never bundle multiple checklist items unless the user explicitly approves it in Phase 2.
- **Checklist edits only after green gates.** Do not optimistically mark items done.
- **Subagent prompts live in `./agents/*.md`.** This SKILL.md is workflow only — never inline subagent prompts here.
- **GitNexus index freshness** is reported by the discovery subagent; the orchestrator decides whether to re-index.
- **Never modify other stage plan files** during execution. Plans are static; deviations are noted inline in the checklist.
- **Completion checklist is mandatory.** At the end of every feature implementation (every slice), the orchestrator MUST walk [references/completion-checklist.md](references/completion-checklist.md) end-to-end and confirm every box is `[x]`. The feature is not "done" — and the orchestrator must not report success — until all six sections of that checklist pass. If any item cannot be checked, surface the gap to the user before claiming completion.

## Fallbacks

- No GitNexus index? Discovery falls back to `Grep` + `Glob` (its agent file documents this); reports `index_freshness: unknown`.
- No skilltags / skillpm installed? Scout walks `.cursor/skills/`, `~/.cursor/skills/`, `~/.agents/skills/`, and plugin caches manually.
- No `.cursor/rules/`? Scout reports "no project rules" and the implementer falls back to global standards only.
- No git worktree support? Use plain branches but warn the user that parallel slices are disabled.

## Triggers

Follow this skill whenever the user:

- runs `/sp-feature-delivery`
- says "deliver the next stage", "ship stage N", "execute docs/plans", "work the checklist"
- asks for the next slice of an existing phased plan

If the user asks to **plan** rather than execute, redirect them to `/prd-to-phased-plans`.
