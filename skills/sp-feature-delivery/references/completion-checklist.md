<!-- skills/sp-feature-delivery/references/completion-checklist.md -->
<!-- Concise end-of-feature verification checklist confirming sp-feature-delivery phases shipped, CI passed, and the branch is cleaned up on main. -->

# Feature Delivery Completion Checklist

Run this checklist at the end of every `sp-feature-delivery` slice, in order. Do **not** consider the feature "done" until every box is `[x]`. If any step fails, return to the failing phase before moving on.

## 1. Plan Tasks Complete

- [ ] Every in-scope checklist item from the active `docs/plans/stage_<n>_*.md` is implemented.
- [ ] Both `spec-reviewer` and `quality-reviewer` returned `verdict: pass` for each item.
- [ ] Local gates green: lint, typecheck, unit, integration, affected E2E.
- [ ] No `[ ]` items remain in the active slice (deferred items moved out-of-scope with a note).

## 2. Master Checklist Updated

- [ ] In `docs/plans/00_master_checklist.md`, every completed item is flipped `[ ]` → `[x]`.
- [ ] Stage status updated (`Not Started` → `In Progress` → `Completed`) to match reality.
- [ ] Stage-level exit criteria boxes ticked where satisfied.
- [ ] Inline notes added next to any item whose scope deviated from the plan.
- [ ] Edits committed on the slice branch (not on `main`).

## 3. PR Created and Submitted

- [ ] One slice = one PR. No bundling unless the user authorized it in Phase 2.
- [ ] Branch follows naming: `feat/` | `fix/` | `chore/` + `stage-<n>-<scope>`.
- [ ] PR opened via `git-commit-push-pr` / `new-branch-and-pr` skill, or `gh pr create` fallback.
- [ ] PR description references: stage + slice, checklist items closed, test evidence, screenshots/logs if UI.
- [ ] PR is targeted at `main` (or the repo's default branch) and is **not draft** unless the user requested draft.

## 4. E2E Tests Added to CI/CD (if applicable)

Skip only if the slice is documentation-only or has zero observable behavior change.

- [ ] New behavior covered by a `@feature`-tagged E2E spec.
- [ ] Critical existing flows touched by this slice covered by `@regression-core`.
- [ ] Shared modules/routes? Widened E2E tags accordingly.
- [ ] `.github/workflows/ci.yml` and `e2e.yml` exist and reference the new specs (no orphaned tests).
- [ ] Failure artifacts (trace / video / report) upload step is present in the workflow.
- [ ] New specs run green locally before pushing.

## 5. CI/CD Passing on the PR

- [ ] All required GitHub Actions checks have completed (no `pending` / `queued`).
- [ ] Every required check is **green**. No skipped checks counted as passing.
- [ ] If any check failed:
  - [ ] Read the failing job logs.
  - [ ] Patch the cause on the same slice branch (do **not** open a new PR for the fix).
  - [ ] Push the patch; wait for CI to re-run.
  - [ ] Repeat until all checks pass.
- [ ] Final CI run reflects the latest commit on the PR head, not a stale SHA.

## 6. Branch Cleanup and Return to Main

Only after CI is fully green and the PR is merged.

- [ ] PR merged into `main` (squash / merge / rebase per repo convention).
- [ ] Local `main` updated: `git checkout main && git pull --ff-only origin main`.
- [ ] Confirm the slice's commits are present on `main` (`git log --oneline | head`).
- [ ] Delete the local slice branch: `git branch -d <branch>`.
- [ ] Delete the remote slice branch: `git push origin --delete <branch>` (skip if auto-deleted by GitHub).
- [ ] If a worktree was used: `git worktree remove <path>` and `git worktree prune`.
- [ ] Final `git status` shows clean tree on `main`.
- [ ] Report final state to the user using the **Progress Report Format** in `SKILL.md`.

## Done Criteria

The feature is considered delivered **only** when:

1. All six sections above are fully checked.
2. The orchestrator is back on `main` with a clean working tree.
3. The master checklist accurately reflects shipped state.

If any item is unchecked, the feature is **not done** — surface the gap to the user before claiming completion.
