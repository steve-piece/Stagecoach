<!-- commands/run-the-day.md -->
<!-- EXPERIMENTAL slash command that loads the run-the-day skill — autonomous multi-stage variant of /sell-slice. Pizza-shop framing: open the shop, run the whole day's service end-to-end, close out. -->

---
description: EXPERIMENTAL. Open → service → close on autopilot. Drive an entire phased plan end-to-end in one chat session by dispatching /bytheslice:sell-slice per stage in strict sequence. Reads docs/plans/00_master_checklist.md, invokes sell-slice on the next Not-Started stage, waits for the structured result, sanity-checks the merged PR, ensures clean return to main, then advances. The everyday tool is /bytheslice:sell-slice (run once per slice, fresh chat each time); use /run-the-day only when you want autonomous multi-stage delivery and accept that long sessions can drift.
---

# /run-the-day (EXPERIMENTAL)

> **EXPERIMENTAL.** This command tries to deliver every remaining stage in one chat session, which is unreliable for full 20–30-stage plans today. The everyday entry point is **`/bytheslice:sell-slice`** — run it once per slice in a fresh chat. Use `/run-the-day` only when you want a single-session autonomous multi-stage run and accept the reliability tradeoff.

Load and follow the [`run-the-day`](../skills/run-the-day/SKILL.md) skill.

The skill drives an entire phased plan end-to-end by **dispatching `/bytheslice:sell-slice` per stage**:

1. Reads `docs/plans/00_master_checklist.md` and identifies the first stage that is not `Completed`.
2. For each remaining stage (sequentially, never parallel):
   - Dispatches an opus-tier [`stage-runner`](../skills/run-the-day/agents/stage-runner.md) subagent that invokes `/bytheslice:sell-slice` for the active stage and returns its structured result.
   - Dispatches a sonnet-tier [`pr-reviewer`](../skills/run-the-day/agents/pr-reviewer.md) subagent to sanity-check the merged PR.
   - Walks the Per-Stage Gate Checklist (embedded in `skills/run-the-day/SKILL.md`) before advancing.
   - Verifies clean `main` (no leftover branches, no leftover worktrees) between every stage.
   - Updates the stage row in the master checklist to `Completed` (if `sell-slice` did not already).
3. Returns a final report when every stage is `Completed`.

## Modes

| Invocation | Behavior |
|---|---|
| `/run-the-day` (default) | Dispatch one stage → report → pause and wait for human "continue" |
| `/run-the-day --auto-mvp` | Auto-advance MVP stages; pause on Phase 2 stages and on any HITL |
| `/run-the-day --auto-all` | Auto-advance every stage; pause only on HITL |

## Preconditions

- Running on the opus model tier (see `skills/setup-shop/references/model-tier-guide.md`). If model is insufficient, the skill stops and reports the gap.
- `docs/plans/00_master_checklist.md` and every referenced `docs/plans/stage_<n>_*.md` exist.
- Working tree is clean on `main`.
- `gh` CLI is installed and authenticated.

If any precondition fails, the skill stops and reports the gap before doing anything else.

## When to use this command

Use `/run-the-day` only when you explicitly want autonomous multi-stage delivery in one chat session. For everyday use, run `/bytheslice:sell-slice` once per slice in a fresh chat — that's the supported, reliable path.
