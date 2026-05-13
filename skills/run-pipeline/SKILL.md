---
name: run-pipeline
description: EXPERIMENTAL. Drive your entire phased plan to completion in one session (supervised by default).
experimental: true
user-invocable: true
triggers: ["/bytheslice:run-pipeline", "/run-pipeline", "run the pipeline", "run pipeline", "autonomous delivery", "run all stages"]
---
<!-- skills/run-pipeline/SKILL.md -->
<!-- EXPERIMENTAL multi-stage orchestrator. Drives a phased plan to completion in one chat session by dispatching /deliver-stage per stage. The everyday tool is /deliver-stage (run once per slice, fresh chat each time); run-pipeline is a sidecar for users who want autonomous multi-stage delivery and accept the reliability tradeoff. -->

# The Orchestrator (EXPERIMENTAL)

> **EXPERIMENTAL.** This skill is the autonomous multi-stage variant. It tries to drive every stage in one chat session, which is unreliable for full 20–30-stage plans today. The everyday tool is **`/bytheslice:deliver-stage`** — run it once per slice, in a fresh chat. Use `/run-pipeline` only when you explicitly want a single-session multi-stage run and accept the reliability tradeoff.

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

The orchestrator does not route per stage type — that's `deliver-stage`'s job. Every stage, regardless of `type:`, is dispatched the same way: invoke `/bytheslice:deliver-stage` for the active stage. `deliver-stage` reads the frontmatter and routes internally to the right sub-skill or pipeline (see [deliver-stage SKILL.md](../deliver-stage/SKILL.md) Phase 4 — Stage-Type Routing).

## Project Config (optional)

Before Phase 0, check for `bytheslice.config.json` at the project root. If present:

1. Read the file as JSONC (comments + trailing commas allowed).
2. Apply the precedence rules from [`skills/setup/references/bytheslice-config-schema.md`](../setup/references/bytheslice-config-schema.md): env vars > config file > project rules file > plugin defaults.
3. Compute the resolved values for `modelTiers`, `stages`, `mcps`, `visualReview`, `hitl.additionalCategories`, `rules.imports`, and `runPipeline` (the new platform-walk checkpoint settings — see Phase 1.5 below).
4. Log a one-line summary of any non-default resolutions in the orchestrator's first message so the user knows what's in effect (e.g., `Config overrides: implementer→opus, maxTasksPerStage→8, platformWalkEvery=5`).
5. Pass the resolved config to each `/deliver-stage` invocation so the inner `rules-loader` agent can re-read it (deliver-stage handles per-agent thread-through internally).

If the file exists but parses as malformed JSON, stop and surface an HITL prompt to the user (`hitl_category: "prd_ambiguity"`, `hitl_question: "bytheslice.config.json failed to parse — please fix the syntax error at line N before continuing"`). Never silently fall through to defaults — surprising defaults are worse than an explicit halt.

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
3. **Dispatch `stage-runner`.** The stage-runner is a thin wrapper that invokes `/bytheslice:deliver-stage` for the active stage and returns its structured result. Wait for the return.
4. **Handle HITL if returned.** If `deliver-stage` (via the stage-runner) returns `needs_human: true`, see HITL Handling below before advancing.
5. **Dispatch `pr-reviewer`** (read-only) against the merged PR. Wait for verdict.
6. **Walk the Per-Stage Gate Checklist** (see below). Stop the loop if any item fails.
7. **Update master checklist** if `deliver-stage` did not already flip the row (it usually does, in its Phase 9 closeout). Idempotent — no-op if already `Completed`.
8. **Report stage completion** to the user (see Progress Report Format).
9. **Mode-based pause decision:**
   - Default mode: always pause. Ask: "Stage N complete. Ready to advance to Stage N+1? (Reply 'continue' or give instructions.)"
   - `--auto-mvp`: pause only if the next stage has `mvp: false` OR if HITL occurred.
   - `--auto-all`: do not pause unless HITL occurred.
10. **Platform-walk checkpoint (conditional).** Before advancing to the next stage, check whether a periodic walk is due — see Phase 1.5 below. The checkpoint runs only **after** the per-stage gate checklist has passed, so a failing gate halts the run before any walk is scheduled.
11. Advance to next stage. Repeat.

### Phase 1.5 — Platform-walk checkpoint (conditional, between stages)

A periodic, read-only cross-cutting audit dispatched between stages during autonomous multi-stage runs. Catches silent regressions on surfaces the just-shipped slice didn't touch — broken footer links, mock-data leaks, dynamic-route validation gaps, console errors on first paint — before they compound across N more stages.

This is distinct from `deliver-stage`'s per-slice `visual-reviewer` (Phase 4.7), which reviews one slice against its declared states. The checkpoint walks **every route** of the whole app.

**Trigger rule:** Dispatch only if `runPipeline.platformWalkEvery` from the resolved config is a positive integer and `STAGE_N % platformWalkEvery == 0`. If the config key is missing or `0`, the checkpoint is a no-op and the run-pipeline workflow is unchanged from prior versions.

**Workflow:**

1. **Confirm the gate passed.** If the Per-Stage Gate Checklist for `STAGE_N` did not all pass, skip the checkpoint — the orchestrator is already halted for a stage failure.
2. **Dispatch `/bytheslice:walk-platform` as a sub-skill.** Read [`../walk-platform/SKILL.md`](../walk-platform/SKILL.md), follow its workflow, and capture the structured return contract. The walk runs in its own sub-agent context so screenshots don't burn the orchestrator's context window.
3. **Capture the verdict and counts** — `verdict` (`clean | drifted | broken`), `report_path`, `screenshot_dir`, `top_gaps`, full `counts` block.
4. **Apply the halt rule** from `runPipeline.haltOn` (default `"broken"`):
   - `"broken"` — pause for human review if `verdict: broken`. Otherwise log + continue.
   - `"drifted"` — pause if `verdict: drifted` OR `broken`. Stricter; useful before UAT.
   - `"never"` — never pause on walk results. Log only.
5. **When pausing**, call `ask_user_input_v0` with `hitl_category: prd_ambiguity` (closest fit) and surface:
   - The walk's verdict
   - Top 5 gaps from the report (each: rank, description, file/route, user-impact)
   - Path to the full report
   - Three options for the user (always with a recommended answer):
     1. **Halt and address now** (recommended if `verdict: broken`) — exit the pipeline; user opens a fresh chat with `/bytheslice:add-feature` or `/bytheslice:deliver-stage` to fix.
     2. **Acknowledge and continue** — record the walk's findings in the orchestrator's session notes; advance to the next stage.
     3. **Disable checkpoints for the rest of this run** — set `platformWalkEvery: 0` for the remainder of this pipeline invocation only (does not modify the config file).
6. **Include the walk's verdict + top 3 gaps in the per-stage Progress Report** (see Progress Report Format below). If `runPipeline.checkpointMode: "background"`, log only the report path and omit gap detail from the report unless `haltOn` fired.

**Why this works:** the walk is read-only — it never edits code, never opens PRs, never pushes commits. So it cannot corrupt the run-pipeline gate state. The only effect on pipeline flow is the halt decision, which is bounded by the explicit `haltOn` rule.

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

### HITL from Phase 1.5 platform-walk checkpoint

The checkpoint produces its own HITL bubbles, separate from stage-runner failures:

- The `/walk-platform` skill itself returns `needs_human: true` with `hitl_category: external_credentials` when no browser MCP is available, the dev server failed to boot within 90s, or env vars are missing. Surface this directly to the user — the run-pipeline run continues only after they resolve it (typically by skipping the walk for this checkpoint via option 3 in the halt prompt, or fixing the env and retrying).
- When the walk completes with a `verdict` that triggers the configured `haltOn` rule, the orchestrator initiates a `prd_ambiguity`-categorized HITL itself (no sub-agent bubble — the walk completed successfully; the orchestrator is making the halt decision). See Phase 1.5 step 5 for the prompt shape and options.

In both cases, the orchestrator NEVER advances past the checkpoint until the user responds. Walk-induced HITL pauses follow the same "no auto-advance" rule as stage HITL pauses.

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

**Platform-walk checkpoint (only when scheduled this stage)**
[ ] Walk dispatch decision recorded (`scheduled` / `skipped — N % every ≠ 0` / `disabled — every == 0`).
[ ] If dispatched: walk returned a structured contract (`status`, `verdict`, `counts`, `report_path`).
[ ] If `haltOn` rule fired: user responded via `ask_user_input_v0` and chose Halt / Continue / Disable-for-rest-of-run.
[ ] Walk results (verdict + top gaps OR report path only, per `checkpointMode`) appended to the Progress Report for this stage.

## Per-Stage Prompt Variables

| Variable | Value |
|---|---|
| `{STAGE_N}` | Integer stage number, e.g. `3` |
| `{STAGE_FILE_PATH}` | Workspace-relative path to `docs/plans/stage_<n>_*.md` |
| `{STAGE_GOAL}` | The goal sentence from the stage file's `**Goal:**` line |

Fill these into the stage-runner prompt (see `agents/stage-runner.md` for the expected format). The stage-runner uses these to invoke `/bytheslice:deliver-stage` for the right stage.

## Progress Report Format (per stage)

```
Stage <N> — <name>: Completed
- Branch: <slice branch name> (deleted)
- PR: <pr url> (merged, CI green)
- Checklist items closed: <count>
- pr-reviewer verdict: pass | fail
- Notes: <one line>

[Platform-walk checkpoint section — included only if a walk ran this stage]
- Walk verdict: clean | drifted | broken
- Routes walked: <count> · 404s: <count> · mock-data leaks: <count> · dynamic-route gaps: <count>
- Top gaps (foreground mode only):
  1. <rank-1 description>
  2. <rank-2 description>
  3. <rank-3 description>
- Report: <path>
- Halt decision: continued | halted | checkpoints disabled for rest of run

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
- **Platform-walk checkpoints are read-only and never block stage advance on their own.** They produce a HITL pause only when the configured `haltOn` rule fires. When `platformWalkEvery: 0` (the default), the checkpoint is a complete no-op — run-pipeline behaves identically to its pre-checkpoint version.
- **Checkpoint cadence is fixed by config**, not adjusted mid-run. The orchestrator must not re-read `bytheslice.config.json` between stages — the resolved config is fixed at session start. Option 3 of the halt prompt is the only way to change checkpoint behavior mid-run (and it only disables checkpoints; it does not change the frequency).

## Triggers

Follow this skill whenever the user:

- runs `/run-pipeline` (optionally with `--auto-mvp` or `--auto-all`)
- says "run the whole plan", "ship every stage", "automate the build", "drive the phased plan to completion", "execute all stages"
- explicitly passes the master checklist and asks for autonomous delivery

If the user wants one stage only, redirect to the appropriate skill per the routing table.
