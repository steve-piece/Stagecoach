<!-- commands/sc-the-orchestrator.md -->
<!-- Slash command shim that loads the the-orchestrator skill to drive a phased plan end-to-end via sequential Opus 4.7 stage-runner subagents. -->

---
description: Drive an entire phased plan end-to-end by dispatching one Opus 4.7 stage-runner subagent per stage in strict sequence. Reads docs/plans/00_master_checklist.md, runs each stage through sp-feature-delivery (or sp-ci-cd-scaffold for stage 1), verifies each PR, ensures clean return to main, then advances. Requires Opus 4.7.
---

# /sc-the-orchestrator

Load and follow the [`the-orchestrator`](../skills/the-orchestrator/SKILL.md) skill.

The skill drives an entire phased plan end-to-end:

1. Reads `docs/plans/00_master_checklist.md` and identifies the first stage that is not `Completed`.
2. For each remaining stage (sequentially, never parallel):
   - Dispatches an Opus 4.7 [`stage-runner`](../skills/the-orchestrator/agents/stage-runner.md) subagent that loads `sp-feature-delivery` (or `sp-ci-cd-scaffold` for stage 1) and ships the slice end-to-end.
   - Dispatches a Sonnet 4.6 [`pr-reviewer`](../skills/the-orchestrator/agents/pr-reviewer.md) subagent to sanity-check the merged PR.
   - Walks the [orchestrator loop checklist](../skills/the-orchestrator/references/orchestrator-loop-checklist.md) before advancing.
   - Verifies clean `main` (no leftover branches, no leftover worktrees) between every stage.
   - Updates the stage row in the master checklist to `Completed`.
3. Returns a final report when every stage is `Completed`.

## Preconditions

- Current model is **Opus 4.7** (`claude-4.6-opus-high-thinking`). If not, the skill stops and asks the user to relaunch on Opus 4.7.
- `docs/plans/00_master_checklist.md` and every referenced `docs/plans/stage_<n>_*.md` exist.
- Working tree is clean on `main`.
- `gh` CLI is installed and authenticated.

If any precondition fails, the skill stops and reports the gap before doing anything else.

## When to use this command

Use `/sc-the-orchestrator` when you want the entire phased plan delivered autonomously and you don't want to paste `Complete all steps in @{STAGE_FILE} /sc-feature-delivery` for each stage by hand.

For a single stage only, use `/sc-feature-delivery` (or `/sc-ci-cd-scaffold` for stage 1) directly.
