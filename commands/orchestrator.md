<!-- commands/orchestrator.md -->
<!-- Slash command shim that loads the the-orchestrator skill to drive a phased plan end-to-end via sequential stage-runner subagents. -->

---
description: Drive an entire phased plan end-to-end by dispatching one stage-runner subagent per stage in strict sequence. Reads docs/plans/00_master_checklist.md, runs each stage through the correct skill (sp-design-system-gate, sp-ci-cd-scaffold, sp-environment-setup-gate, sp-feature-delivery, or sp-frontend-design), verifies each PR, ensures clean return to main, then advances.
---

# /orchestrator

Load and follow the [`the-orchestrator`](../skills/the-orchestrator/SKILL.md) skill.

The skill drives an entire phased plan end-to-end:

1. Reads `docs/plans/00_master_checklist.md` and identifies the first stage that is not `Completed`.
2. For each remaining stage (sequentially, never parallel):
   - Dispatches an opus-tier [`stage-runner`](../skills/the-orchestrator/agents/stage-runner.md) subagent that loads the correct skill and ships the slice end-to-end.
   - Dispatches a sonnet-tier [`pr-reviewer`](../skills/the-orchestrator/agents/pr-reviewer.md) subagent to sanity-check the merged PR.
   - Walks the Per-Stage Gate Checklist (embedded in `skills/the-orchestrator/SKILL.md`) before advancing.
   - Verifies clean `main` (no leftover branches, no leftover worktrees) between every stage.
   - Updates the stage row in the master checklist to `Completed`.
3. Returns a final report when every stage is `Completed`.

## Preconditions

- Running on the opus model tier (see `references/model-tier-guide.md`). If model is insufficient, the skill stops and reports the gap.
- `docs/plans/00_master_checklist.md` and every referenced `docs/plans/stage_<n>_*.md` exist.
- Working tree is clean on `main`.
- `gh` CLI is installed and authenticated.

If any precondition fails, the skill stops and reports the gap before doing anything else.

## When to use this command

Use `/orchestrator` when you want the entire phased plan delivered autonomously and you don't want to paste `Complete all steps in @{STAGE_FILE} /feature-delivery` for each stage by hand.

For a single stage only, use `/feature-delivery` (or `/ci-cd-scaffold` for stage 1) directly.
