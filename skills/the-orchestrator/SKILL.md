<!-- skills/the-orchestrator/SKILL.md -->
<!-- Top-level orchestrator skill. Conducts a phased plan by dispatching one stage-runner per stage. Default mode: supervised — dispatches one stage, returns to human, waits for "continue". -->

---
name: the-orchestrator
description: Conduct a phased plan from docs/plans/00_master_checklist.md by dispatching one stage-runner subagent per stage. Default mode is supervised — runs one stage, reports results, and waits for human approval before advancing. Supports --auto-mvp and --auto-all flags. Use when the user runs /the-orchestrator, says "run the whole plan", "ship every stage", "automate the build", or "drive the phased plan to completion".
---

# The Orchestrator

The orchestrator is a **conductor**, not an autopilot. It reads the master checklist, dispatches one stage at a time, and returns to the human between stages — unless a mode flag removes that pause.

## Modes

| Invocation | Behavior |
|---|---|
| `/the-orchestrator` (default) | Dispatch one stage → report → **pause and wait for human "continue"** |
| `/the-orchestrator --auto-mvp` | Auto-advance stages where `mvp: true` in frontmatter; pause before Phase 2 stages (`mvp: false`); pause on any HITL |
| `/the-orchestrator --auto-all` | Auto-advance all stages; pause **only** on HITL |

In every mode, the orchestrator **never advances past a HITL pause** until the human responds. It is the only surface that calls `ask_user_input_v0`.

## Subagents

| When | File | Model | Effort |
|---|---|---|---|
| Per stage | [agents/stage-runner.md](agents/stage-runner.md) | `opus` | high |
| After each merge | [agents/pr-reviewer.md](agents/pr-reviewer.md) | `sonnet` | medium |

Read each file in full before dispatching. Pass the file's body as the prompt to the `Task` tool.

For model override paths, see `references/model-tier-guide.md` (created in Wave 4 — link resolves after that wave).

## Inputs and Preconditions

- `docs/plans/00_master_checklist.md` exists and is readable.
- Every stage referenced in the master checklist has a `docs/plans/stage_<n>_*.md` file.
- `git status --short` is clean and the current branch is `main`.
- Local `main` is up to date with `origin/main` (`git pull --ff-only`).
- `gh` CLI installed and authenticated.

If any precondition fails, stop and surface the gap to the user before doing anything else.

## Stage Routing

The orchestrator reads each stage file's `type` frontmatter field and dispatches to the correct skill:

| Stage `type` | Skill dispatched |
|---|---|
| `design-system` | `sp-design-system-gate` |
| `ci-cd` | `sp-ci-cd-scaffold` |
| `env-setup` | `sp-environment-setup-gate` |
| `db-schema` | `sp-feature-delivery` (with DB context flag) |
| `frontend` | `sp-frontend-design` |
| `backend` | `sp-feature-delivery` |
| `full-stack` | `sp-feature-delivery` |
| `infrastructure` | `sp-feature-delivery` |

Pass `SKILL_TO_LOAD` to the stage-runner so it loads the right skill without re-reading frontmatter.

## Workflow

### Phase 0 — Read the master checklist

1. Read `docs/plans/00_master_checklist.md`.
2. Build an ordered list of `(stage_n, stage_file_path, type, mvp, status)` from the file.
3. Find the first stage whose status is not `Completed`. That is the active starting point.
4. If every stage is `Completed`, skip to Phase 2 — Final Report.
5. If any stage file is missing, stop and ask the user.
6. Confirm workspace is on `main`, clean, latest pulled.

### Phase 1 — Per-stage loop (strictly sequential)

For each stage from the active starting point, in order:

1. **Pre-stage state check.** Verify `git status` clean, on `main`, latest pulled.
2. **Read stage frontmatter.** Determine `type`, `mvp`, `hitl_required`, `SKILL_TO_LOAD`.
3. **Dispatch `stage-runner`.** Pass the full body of `agents/stage-runner.md` plus filled prompt variables (see Per-Stage Prompt Variables below). Wait for a structured return.
4. **Handle HITL if returned.** If the stage-runner returns `needs_human: true`, see HITL Handling below before advancing.
5. **Dispatch `pr-reviewer`** (read-only). Pass the stage-runner's `pr_url` and `stage_file_path`. Wait for verdict.
6. **Walk the Per-Stage Gate Checklist** (see below). Stop the loop if any item fails.
7. **Update master checklist.** Flip the stage row to `Completed`.
8. **Report stage completion** to the user (see Progress Report Format).
9. **Mode-based pause decision:**
   - Default mode: always pause. Ask: "Stage N complete. Ready to advance to Stage N+1? (Reply 'continue' or give instructions.)"
   - `--auto-mvp`: pause only if the next stage has `mvp: false` OR if HITL occurred.
   - `--auto-all`: do not pause unless HITL occurred.
10. Advance to next stage. Repeat.

### Phase 2 — Final Report

When every stage is `Completed`:

1. Confirm `git status` clean, on `main`, no leftover branches or worktrees.
2. Confirm every PR listed in stage-runner summaries is merged.
3. Output the Final Report Format.

## HITL Handling

When a stage-runner returns `needs_human: true`:

1. **Pause immediately.** Do not advance to the next step.
2. **Translate the structured fields** into a plain-language user prompt:
   - `hitl_category: prd_ambiguity` → prompt prefixed with "The stage hit a PRD ambiguity."
   - `hitl_category: external_credentials` → prompt prefixed with "The stage needs external credentials or configuration."
   - `hitl_category: destructive_operation` → prompt prefixed with "The stage is about to perform a destructive operation."
   - `hitl_category: creative_direction` → prompt prefixed with "The stage needs creative direction."
3. **Call `ask_user_input_v0`** with the `hitl_question` as the prompt body and the `hitl_context` as supplemental context.
4. **Apply the answer** to the relevant context:
   - `prd_ambiguity`: append the answer to PRD Section 6 (Open Questions).
   - `external_credentials`: append credential confirmation to the project rules file (rules file format: cursor or claude).
   - `destructive_operation`: record explicit approval in the stage notes.
   - `creative_direction`: append the direction decision to the stage notes.
5. **Re-dispatch the stage-runner** with the updated context appended to the prompt.

Only the orchestrator calls `ask_user_input_v0`. Sub-agents bubble HITL up via the return contract — they never prompt the user directly.

## Per-Stage Gate Checklist

Walk this checklist after each stage before advancing. Stop and surface any failing item.

**Stage Runner Return**
[ ] `stage-runner` returned a complete structured summary (not partial, not an exception).
[ ] `needs_human` is `false` (or HITL was resolved and stage re-ran successfully).
[ ] `stage-runner` reported `pr_merged: true`.
[ ] `stage-runner` reported `tests_green: true`.
[ ] `stage-runner` reported `completion_checklist_all_checked: true`.

**PR Reviewer Verdict**
[ ] `pr-reviewer` was dispatched and returned.
[ ] `pr-reviewer` returned `verdict: pass`.
[ ] `ci_status: all_green` on the merged head SHA.
[ ] `required_checks_failed` is empty.
[ ] `scope_drift` is empty (or any drift was explicitly approved by the user).
[ ] Design-system-compliance CI check passed (if `design-system-compliance` job exists).
[ ] Visual diffs reviewed and approved (if `@visual` suite ran).
[ ] `db/schema.sql` updated if any DB code was touched.
[ ] Env-setup gate completion is recorded in the master checklist (for any stage after stage 3).

**Git State — Clean Main Invariant**
[ ] Current branch is `main`.
[ ] `git status --short` is empty.
[ ] `git pull --ff-only` succeeds with no new changes.
[ ] No leftover slice branches from this stage (local or remote).
[ ] No leftover git worktrees for this stage.

**Master Checklist**
[ ] `docs/plans/00_master_checklist.md` stage row shows `Status: Completed`.
[ ] Per-task `[x]` flips are present (done by the dispatched skill, verified here).
[ ] No other stage's status was accidentally modified.

**Ready to Advance**
[ ] Next stage file exists and is well-formed.
[ ] User has not requested a stop.
[ ] No unresolved HITL items remain for this stage.

## Per-Stage Prompt Variables

| Variable | Value |
|---|---|
| `{STAGE_N}` | Integer stage number, e.g. `3` |
| `{STAGE_FILE_PATH}` | Workspace-relative path to `docs/plans/stage_<n>_*.md` |
| `{STAGE_GOAL}` | The goal sentence from the stage file's `**Goal:**` line |
| `{SKILL_TO_LOAD}` | Determined from stage `type` via the routing table above |

Fill these into the stage-runner prompt (see `agents/stage-runner.md` for the expected format). Pass the full body of `agents/stage-runner.md` alongside the filled prompt.

## Progress Report Format (per stage)

```
Stage <N> — <name>: Completed
- Branch: <slice branch name> (deleted)
- PR: <pr url> (merged, CI green)
- Checklist items closed: <count>
- pr-reviewer verdict: pass | fail
- Notes: <one line>
On main, clean tree. [Advancing to Stage <N+1> automatically. | Waiting for your "continue".]
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

- **Strictly sequential.** Never dispatch two stage-runners in parallel. Stage N+1 cannot start until stage N's PR is merged, main is clean, and the gate checklist passed.
- **Orchestrator never edits production code.** It only reads plans, dispatches subagents, walks the gate checklist, and updates `00_master_checklist.md` stage-level statuses.
- **Gate halts on first failed item.** Never silently advance past a failing checklist item.
- **Clean-main invariant.** Enforced before every stage-runner dispatch.
- **Master checklist is source of truth** for stage ordering and completion. Never re-order stages.
- **HITL goes through `ask_user_input_v0` only.** Sub-agents bubble up; orchestrator prompts.
- **No new commands without authorization.** Only activate on `/the-orchestrator` or the listed trigger phrases.

## Triggers

Follow this skill whenever the user:

- runs `/the-orchestrator` (optionally with `--auto-mvp` or `--auto-all`)
- says "run the whole plan", "ship every stage", "automate the build", "drive the phased plan to completion", "execute all stages"
- explicitly passes the master checklist and asks for autonomous delivery

If the user wants one stage only, redirect to the appropriate skill per the routing table.
