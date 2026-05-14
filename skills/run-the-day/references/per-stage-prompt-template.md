<!-- skills/run-the-day/references/per-stage-prompt-template.md -->
<!-- Supplemental reference: example prompt run-the-day constructs for stage-runner dispatch. The authoritative variable list lives in SKILL.md. This file shows how the variables compose into a complete prompt. -->

# Per-Stage Prompt Template (Reference)

The orchestrator fills in these four variables and passes the result to the `stage-runner` subagent alongside the full body of `agents/stage-runner.md`. The authoritative variable descriptions live in `SKILL.md` — this file shows the composed form.

## Variables

- `{STAGE_N}` — integer stage number, e.g. `3`.
- `{STAGE_FILE_PATH}` — workspace-relative path to the stage file, e.g. `docs/plans/stage_3_env_setup.md`.
- `{STAGE_GOAL}` — the goal sentence from the stage file's `**Goal:**` line.
- `{SKILL_TO_LOAD}` — determined from stage `type` frontmatter via the routing table in `SKILL.md`.

## Composed Prompt

```
You are the stage-runner for Stage {STAGE_N} of the active phased plan.

Stage file: @{STAGE_FILE_PATH}
Stage goal: {STAGE_GOAL}
Skill to load: /{SKILL_TO_LOAD}
Master checklist: docs/plans/00_master_checklist.md

Complete all steps in @{STAGE_FILE_PATH} using /{SKILL_TO_LOAD}.

Requirements:
1. Read the stage file end-to-end before doing anything.
2. Load the skill and run its full workflow (let it dispatch its own subagents).
3. Open and merge the PR. Wait for CI. Patch failures on the same branch until
   every required check is green.
4. After merge: sync local main, delete the slice branch (local + remote if
   not auto-deleted), prune any worktrees, confirm clean tree on main.
5. Walk the loaded skill's embedded completion checklist. Confirm every item is
   checked before returning.
6. Return the structured summary from the stage-runner return contract.
   Do NOT advance to Stage {STAGE_N}+1 — that is the orchestrator's job.
7. If you need human input at any point, return needs_human: true with the
   structured HITL fields. Do NOT call ask_user_input_v0 directly.
```

## Notes

- Variables are filled by the orchestrator before sending.
- The orchestrator passes the full body of `agents/stage-runner.md` alongside this filled prompt.
- For the `--auto-mvp` and `--auto-all` mode flags, no changes are needed to this prompt — mode logic lives in the orchestrator's loop, not in the per-stage prompt.
