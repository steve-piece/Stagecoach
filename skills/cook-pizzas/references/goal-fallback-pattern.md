<!-- skills/cook-pizzas/references/goal-fallback-pattern.md -->
<!-- Shared fallback pattern for /sell-slice Phase 2.5 and /run-the-day Phase 0.5 when /goal is unavailable. -->

# Manual goal-tracking pattern — when `/goal` is unavailable

`/goal` is a Claude Code feature that uses a prompt-based Stop hook to evaluate a session-scoped completion condition between turns. ByTheSlice's `/sell-slice` (Phase 2.5) and `/run-the-day` (Phase 0.5) integrate with it to drive autonomous work without per-turn user re-prompting.

`/goal` may be unavailable for several reasons (see the table below). This reference defines the **fallback pattern**: when the slash command can't be used, the skill applies the same continuation logic manually by self-evaluating against the same condition every turn.

## When `/goal` is unavailable

| Reason | What happens |
|---|---|
| **Running in Cursor** (or any non-Claude-Code host) | The slash command doesn't exist. Invoking it produces "unknown command" or similar. |
| **Claude Code workspace trust dialog not accepted** | Hooks system disabled for this workspace; `/goal` reports the reason inline. |
| **`disableAllHooks` set at any settings level** | Hooks system off globally; `/goal` reports the reason inline. |
| **`allowManagedHooksOnly` set in managed settings** | The user can't register new hooks; `/goal` reports the reason inline. |
| **Any other Claude-Code-specific reason** | Surfaced inline when the command is invoked. |

**How to detect**: invoke `/goal` with no arguments at startup. If the command:
- Returns the current goal state (active or none) → `/goal` is **available**; use it normally per the calling skill's Phase 2.5 / Phase 0.5.
- Returns an error explaining why it's disabled → fall back to the **manual pattern** below.
- Doesn't exist (Cursor / non-Claude-Code) → fall back to the **manual pattern** below.

## The manual pattern

When `/goal` is unavailable, the skill applies the same continuation logic as the platform's prompt-based Stop hook, with Claude itself performing the between-turn evaluation.

### 1. Fetch the canonical docs

WebFetch [`https://code.claude.com/docs/en/goal.md`](https://code.claude.com/docs/en/goal.md) at fallback-activation time. Focus on:

- **"How evaluation works"** — describes the evaluator's input shape (condition + conversation transcript), what counts as evidence, and the yes/no decision protocol.
- **"Write an effective condition"** — describes what makes a condition transcript-verifiable, binary, and bounded.

These sections describe what `/goal` would have done internally; the skill emulates the same logic manually.

### 2. Hold the goal condition in working memory

Build the same condition string that `/goal` would have received from the calling skill. For:

- **`/sell-slice` Phase 2.5** — header + lifted Exit criteria from the active stage file + pipeline constraints + turn cap. (See Phase 2.5 for the exact ordering.)
- **`/run-the-day` Phase 0.5** — the mode-specific condition string documented in that phase (`--auto-all` vs `--auto-mvp`).

Log to the user on activation:

> *"`/goal` is unavailable ({reason}); falling back to manual goal-tracking against the Exit criteria. The skill will self-evaluate against the goal condition every turn instead of relying on the platform's Stop hook. See [`goal.md`](https://code.claude.com/docs/en/goal.md) for the pattern."*

### 3. Evaluate after each phase completion

After each completed phase (Phases 3 → 9 for `/sell-slice`; per-stage loop iterations for `/run-the-day`), self-prompt against the condition:

- Has every Exit criterion been demonstrated in the conversation transcript?
- Are any HITL bubbles unresolved?
- Has the turn cap been reached?

If **yes** → declare slice/plan complete; run the closeout report (Phase 9 for `/sell-slice`; Phase 2 — Final Report for `/run-the-day`).

If **no** → continue to the next phase.

### 4. Surface progress every ~5 phases

Without the platform-side evaluator, the user has no automatic visibility into "how close are we to done?" Every ~5 phases (or per-stage in `/run-the-day`), surface a one-line progress note:

> *"Goal-tracking: 4 of 7 Exit criteria met. Outstanding: <list>. Continuing to {next phase}."*

This is the manual analogue of the evaluator's "not yet, reason: ..." message that `/goal` surfaces between turns.

### 5. HITL bubbles end turns naturally

Identical to `/goal` behavior: any HITL prompt surfaced via `ask_user_input_v0` ends the turn. The orchestrator does not silently continue past HITL — the user's response is what resumes work.

### 6. Cleanup on exit

`/goal` auto-clears when the condition is met or via `/goal clear`. In the fallback, the skill simply stops tracking on:

- Normal completion (closeout report run)
- User-requested abort
- Unresolvable HITL (skill returns control to user with status)

No state to clean up — manual tracking lives only in the agent's context.

## What you DON'T do in fallback mode

- **Do NOT silently drop the goal logic.** The fallback is "manual tracking," not "no tracking." Skipping goal evaluation entirely defeats the purpose of Phase 2.5 / Phase 0.5 and you'll drift.
- **Do NOT loop indefinitely.** If the turn cap is hit without the condition being met, surface as `prd_ambiguity` HITL with full evidence of where the agent got stuck.
- **Do NOT pretend `/goal` is set.** If the user asks "is a goal active?", reply honestly that the platform `/goal` is unavailable and the skill is doing manual goal-tracking against the same condition.
- **Do NOT replace the condition with something easier.** The Exit-criteria contract still applies. If criteria are weak, surface `prd_ambiguity` HITL the same as you would when `/goal` is available — don't quietly relax them.

## Cross-skill references

This pattern is invoked by:

- [`skills/sell-slice/SKILL.md`](../../sell-slice/SKILL.md) — Phase 2.5 (slice-completion goal)
- [`skills/run-the-day/SKILL.md`](../../run-the-day/SKILL.md) — Phase 0.5 (session goal in `--auto-*` modes)

The Exit-criteria contract (the source of the goal condition) lives in [`templates.md`](templates.md) → "Exit-criteria contract (consumed by `/goal`)".
