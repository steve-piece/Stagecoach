<!-- commands/run-pipeline.md -->
<!-- Slash command shim that loads the run-pipeline skill to drive a phased plan end-to-end via sequential stage-runner subagents. -->

---
description: Drive an entire phased plan end-to-end by dispatching one stage-runner subagent per stage in strict sequence. Reads docs/plans/00_master_checklist.md, runs each stage through the correct skill (init-design-system, scaffold-ci-cd, setup-environment, ship-feature, or ship-frontend), verifies each PR, ensures clean return to main, then advances.
---

# /run-pipeline

Load and follow the [`run-pipeline`](../skills/run-pipeline/SKILL.md) skill.

The skill drives an entire phased plan end-to-end:

1. Reads `docs/plans/00_master_checklist.md` and identifies the first stage that is not `Completed`.
2. For each remaining stage (sequentially, never parallel):
   - Dispatches an opus-tier [`stage-runner`](../skills/run-pipeline/agents/stage-runner.md) subagent that loads the correct skill and ships the slice end-to-end.
   - Dispatches a sonnet-tier [`pr-reviewer`](../skills/run-pipeline/agents/pr-reviewer.md) subagent to sanity-check the merged PR.
   - Walks the Per-Stage Gate Checklist (embedded in `skills/run-pipeline/SKILL.md`) before advancing.
   - Verifies clean `main` (no leftover branches, no leftover worktrees) between every stage.
   - Updates the stage row in the master checklist to `Completed`.
3. Returns a final report when every stage is `Completed`.

## Preconditions

- Running on the opus model tier (see `skills/setup/references/model-tier-guide.md`). If model is insufficient, the skill stops and reports the gap.
- `docs/plans/00_master_checklist.md` and every referenced `docs/plans/stage_<n>_*.md` exist.
- Working tree is clean on `main`.
- `gh` CLI is installed and authenticated.

If any precondition fails, the skill stops and reports the gap before doing anything else.

## When to use this command

Use `/run-pipeline` when you want the entire phased plan delivered autonomously and you don't want to paste `Complete all steps in @{STAGE_FILE} /ship-feature` for each stage by hand.

For a single stage only, use `/ship-feature` (or `/scaffold-ci-cd` for stage 1) directly.
