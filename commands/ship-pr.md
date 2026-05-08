<!-- commands/ship-pr.md -->
<!-- Slash command that loads the ship-pr skill: takes a feature branch with locally-committed work and ships it through PR open → CI watch (with auto-fix loop on red) → user-authorized merge → main sync + cleanup. -->

---
description: Ship the current feature branch end-to-end. Pre-flight safety checks (not on main, branch + worktree state confirmed), commits any remaining changes, pushes, opens the PR, watches CI to settle (auto-dispatches ci-fix-attempter to push targeted fixes on red, capped at 3 attempts), pauses for user merge approval when CI is green, then on approval merges and cleans up local + remote branch and worktree. Decoupled from /deliver-stage and /add-feature so you can review or UAT the slice locally first. Use after /deliver-stage or /add-feature finishes.
---

# /ship-pr

Load and follow the [`ship-pr`](../skills/ship-pr/SKILL.md) skill.

`/deliver-stage` and `/add-feature` stop at "slice committed locally, ready for review" so you can run a manual visual UAT or do code review locally before deciding to ship. `/ship-pr` is the next step in the chain — it takes a branch with locally-committed work and shepherds it through:

1. Pre-flight safety checks (not on `main`, worktree state captured, no accidental branch reuse, `gh` authenticated).
2. Commit any remaining changes (with a recommended conventional commit message you can override).
3. Push the branch and open the PR (or reuse the existing one if you already have a PR open against this branch).
4. Watch CI to settle. On red, dispatch the `ci-fix-attempter` subagent to land a targeted fix and push — capped at 3 attempts before bubbling HITL.
5. Pause and prompt for merge approval when CI is green. You pick: approve and merge now, hold for manual review, or cancel.
6. After merge: sync `main`, delete local + remote branch, remove the worktree (if used), and confirm clean tree fully synced with `origin/main`.

## Preconditions

- Working tree on a feature branch (not `main` / `master`).
- The slice's intended changes are committed locally (or present as uncommitted changes the skill should commit).
- `gh` CLI installed and authenticated.

## When to use this command

- After `/stagecoach:deliver-stage` finishes a slice and you've reviewed it locally.
- After `/stagecoach:add-feature` writes new plan files and you want to ship them as a chore PR before starting delivery.
- For any hand-rolled feature branch that didn't go through the Stagecoach delivery loop — the pre-flight checks and closeout pattern are universal.

If you want to open the PR but pause before merging for an external code review, pick the **Hold** option at the merge-authorization gate. The skill will exit with the PR open; merge it via the GitHub UI when ready, then re-invoke `/ship-pr` to do cleanup.
