<!-- skills/run-pipeline/SKILL.md -->
<!-- EXPERIMENTAL multi-stage orchestrator. Drives a phased plan to completion in one chat session by dispatching /deliver-stage per stage. The everyday tool is /deliver-stage (run once per slice, fresh chat each time); run-pipeline is a sidecar for users who want autonomous multi-stage delivery and accept the reliability tradeoff. -->

---
name: run-pipeline
description: EXPERIMENTAL. Drive your entire phased plan to completion in one session (supervised by default).
experimental: true
---

# The Orchestrator (EXPERIMENTAL)

> **EXPERIMENTAL.** This skill is the autonomous multi-stage variant. It tries to drive every stage in one chat session, which is unreliable for full 20–30-stage plans today. The everyday tool is **`/stagecoach:deliver-stage`** — run it once per slice, in a fresh chat. Use `/run-pipeline` only when you explicitly want a single-session multi-stage run and accept the reliability tradeoff.

The orchestrator is a **conductor**, not an autopilot. It reads the master checklist, dispatches **one `/deliver-stage` invocation per stage**, and returns to the human between stages — unless a mode flag removes that pause.

`run-pipeline` does not duplicate `deliver-stage`'s logic. The `stage-runner` agent is a thin wrapper that loads the active stage's context and invokes `/deliver-stage` for that specific stage; this guarantees `run-pipeline` and direct `deliver-stage` runs produce the same artifacts and gate the PR on the same Phase 6/7 verifications.

## Modes

| Invocation | Behavior |
|---|---|
| `/run-pipeline` (default) | Dispatch one stage → report → **pause and wait for human "continue"** |
| `/run-pipeline --auto-mvp` | Auto-advance stages where `mvp: true` in frontmatter; pause before Phase 2 stages (`mvp: false`); pause on any HITL |
| `/run-pipeline --auto-all` | Auto-advance all stages; pause **only** on HITL |

In every mode, the orchestrator **never advances past a HITL pause** until the human responds. It is the only surface that calls `ask_user_input_v0`.

## Subagents

| When | File | Model | Effort |
|---|---|---|---|
| Per stage | [agents/stage-runner.md](agents/stage-runner.md) | `opus` | high |
| After each merge | [agents/pr-reviewer.md](agents/pr-reviewer.md) | `sonnet` | medium |

Read each file in full before dispatching. Pass the file's body as the prompt to the `Task` tool.

For model override paths, see `skills/setup/references/model-tier-guide.md`.

## Inputs and Preconditions

- `docs/plans/00_master_checklist.md` exists and is readable.
- Every stage referenced in the master checklist has a `docs/plans/stage_<n>_*.md` file.
- `git status --short` is clean and the current branch is `main`.
- Local `main` is up to date with `origin/main` (`git pull --ff-only`).
- `gh` CLI installed and authenticated.

If any precondition fails, stop and surface the gap to the user before doing anything else.

## Stage Routing

The orchestrator does not route per stage type — that's `deliver-stage`'s job. Every stage, regardless of `type:`, is dispatched the same way: invoke `/stagecoach:deliver-stage` for the active stage. `deliver-stage` reads the frontmatter and routes internally to the right sub-skill or pipeline (see [deliver-stage SKILL.md](../deliver-stage/SKILL.md) Phase 4 — Stage-Type Routing).

## Project Config (optional)

Before Phase 0, check for `stagecoach.config.json` at the project root. If present:

1. Read the file as JSONC (comments + trailing commas allowed).
2. Apply the precedence rules from [`skills/setup/references/stagecoach-config-schema.md`](../setup/references/stagecoach-config-schema.md): env vars > config file > project rules file > plugin defaults.
3. Compute the resolved values for `modelTiers`, `stages`, `mcps`, `visualReview`, `hitl.additionalCategories`, and `rules.imports`.
4. Log a one-line summary of any non-default resolutions in the orchestrator's first message so the user knows what's in effect (e.g., `Config overrides: implementer→opus, maxTasksPerStage→8, vizzly disabled`).
5. Pass the resolved config to each `/deliver-stage` invocation so the inner `rules-loader` agent can re-read it (deliver-stage handles per-agent thread-through internally).

If the file exists but parses as malformed JSON, stop and surface an HITL prompt to the user (`hitl_category: "prd_ambiguity"`, `hitl_question: "stagecoach.config.json failed to parse — please fix the syntax error at line N before continuing"`). Never silently fall through to defaults — surprising defaults are worse than an explicit halt.

If the file is absent, proceed with plugin defaults (no warning).

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
2. **Read stage frontmatter.** Determine `mvp` (for pause decisions) and `hitl_required`.
3. **Dispatch `stage-runner`.** The stage-runner is a thin wrapper that invokes `/stagecoach:deliver-stage` for the active stage and returns its structured result. Wait for the return.
4. **Handle HITL if returned.** If `deliver-stage` (via the stage-runner) returns `needs_human: true`, see HITL Handling below before advancing.
5. **Dispatch `pr-reviewer`** (read-only) against the merged PR. Wait for verdict.
6. **Walk the Per-Stage Gate Checklist** (see below). Stop the loop if any item fails.
7. **Update master checklist** if `deliver-stage` did not already flip the row (it usually does, in its Phase 9 closeout). Idempotent — no-op if already `Completed`.
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

Fill these into the stage-runner prompt (see `agents/stage-runner.md` for the expected format). The stage-runner uses these to invoke `/stagecoach:deliver-stage` for the right stage.

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
- **No new commands without authorization.** Only activate on `/run-pipeline` or the listed trigger phrases.

## Triggers

Follow this skill whenever the user:

- runs `/run-pipeline` (optionally with `--auto-mvp` or `--auto-all`)
- says "run the whole plan", "ship every stage", "automate the build", "drive the phased plan to completion", "execute all stages"
- explicitly passes the master checklist and asks for autonomous delivery

If the user wants one stage only, redirect to the appropriate skill per the routing table.
