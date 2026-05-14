<!-- MIGRATION-v4.md -->
<!-- v4.0.0 rename manifest — produced by Commit 1 of the pizza-shop migration. Deleted after merge. Lives at repo root because docs/ is gitignored. -->

# v4.0.0 — Pizza-Shop Rename Manifest

This file is a **review artifact**, produced before any file actually moves. It lets a reviewer verify "every file that needs to change has been found" before commits 2–8 touch disk. It is deleted after the migration PR merges.

---

## 1. Skill renames (12)

| Today (path) | New (path) | Move type |
|---|---|---|
| `skills/setup/` | `skills/setup-shop/` | rename |
| `skills/write-prd/` | `skills/create-menu/` | rename |
| `skills/plan-phases/` | `skills/cook-pizzas/` | rename |
| `skills/sub-disciplines/init-design-system/` | `skills/set-display-case/` | **promote + rename** |
| `skills/sub-disciplines/scaffold-ci-cd/` | `skills/final-quality-check/` | **promote + rename** |
| `skills/sub-disciplines/setup-environment/` | `skills/open-the-shop/` | **promote + rename** |
| `skills/deliver-stage/` | `skills/sell-slice/` | rename |
| `skills/ship-pr/` | `skills/box-it-up/` | rename |
| `skills/add-feature/` | `skills/special-order/` | rename |
| `skills/run-pipeline/` | `skills/run-the-day/` | rename |
| `skills/walk-platform/` | `skills/inspect-display/` | rename |
| `skills/review-pipeline/` | `skills/close-shop/` | rename |

After commit 2: `skills/sub-disciplines/` is empty and will be deleted.

## 2. Command file renames (12)

| Today | New |
|---|---|
| `commands/setup.md` | `commands/setup-shop.md` |
| `commands/write-prd.md` | `commands/create-menu.md` |
| `commands/plan-phases.md` | `commands/cook-pizzas.md` |
| `commands/init-design-system.md` | `commands/set-display-case.md` |
| `commands/scaffold-ci-cd.md` | `commands/final-quality-check.md` |
| `commands/setup-environment.md` | `commands/open-the-shop.md` |
| `commands/deliver-stage.md` | `commands/sell-slice.md` |
| `commands/ship-pr.md` | `commands/box-it-up.md` |
| `commands/add-feature.md` | `commands/special-order.md` |
| `commands/run-pipeline.md` | `commands/run-the-day.md` |
| `commands/walk-platform.md` | `commands/inspect-display.md` |
| `commands/review-pipeline.md` | `commands/close-shop.md` |

## 3. Sub-skill artifact preservation

Verified current layout:

```
skills/sub-disciplines/
├── init-design-system/    (agents/4, references/5)
├── scaffold-ci-cd/        (agents/8, references/2)
└── setup-environment/     (agents/4, references/2)
```

`git mv` of each entire subdirectory preserves every nested file's git history. Commit 2 runs three `git mv` operations that promote these one level up while also renaming the leaf directory.

## 4. Files mentioning old names (top 30, by mention count)

These get touched in commits 3 and 4. All cross-references rewritten to the new names; old slash-command phrases preserved in `triggers:` arrays for one release cycle.

| Mentions | File | Notes |
|---:|---|---|
| 42 | `CHANGELOG.md` | **historical** — do not rewrite past entries; only ADD v4.0.0 entry |
| 35 | `README.md` | full refresh: Menu table, Mermaid, FAQ, tagline |
| 31 | `skills/setup/references/model-tier-guide.md` | model-tier mapping references every agent path — heavy edit |
| 26 | `skills/sub-disciplines/scaffold-ci-cd/SKILL.md` | `→ skills/final-quality-check/SKILL.md` |
| 26 | `skills/add-feature/SKILL.md` | `→ skills/special-order/SKILL.md` |
| 25 | `skills/run-pipeline/SKILL.md` | `→ skills/run-the-day/SKILL.md` |
| 24 | `skills/deliver-stage/SKILL.md` | `→ skills/sell-slice/SKILL.md` |
| 20 | `skills/walk-platform/SKILL.md` | `→ skills/inspect-display/SKILL.md` |
| 19 | `skills/walk-platform/references/integration-points.md` | references run-pipeline + ship-pr |
| 17 | `skills/setup/SKILL.md` | `→ skills/setup-shop/SKILL.md` |
| 17 | `skills/run-pipeline/agents/stage-runner.md` | invokes `/bytheslice:deliver-stage` |
| 15 | `commands/run-pipeline.md` | `→ commands/run-the-day.md` |
| 14 | `skills/setup/references/bytheslice-config-schema.md` | config schema field names |
| 13 | `skills/ship-pr/SKILL.md` | `→ skills/box-it-up/SKILL.md` |
| 12 | `skills/sub-disciplines/setup-environment/SKILL.md` | `→ skills/open-the-shop/SKILL.md` |
| 12 | `skills/review-pipeline/SKILL.md` | `→ skills/close-shop/SKILL.md` |
| 11 | `skills/plan-phases/agents/phased-plan-writer.md` | `→ skills/cook-pizzas/agents/` |
| 10 | `skills/write-prd/agents/prd-reviewer.md` | `→ skills/create-menu/agents/` |
| 10 | `commands/deliver-stage.md` | `→ commands/sell-slice.md` |
| 9 | `commands/ship-pr.md`, `commands/scaffold-ci-cd.md` | renamed |
| 8 | `skills/deliver-stage/agents/frontend/library-entry-writer.md` | references `/deliver-stage` Phase 4.5 |
| 8 | `commands/setup-environment.md`, `commands/add-feature.md` | renamed |
| 7 | `skills/sub-disciplines/init-design-system/SKILL.md` | `→ skills/set-display-case/SKILL.md` |
| 7 | `skills/plan-phases/references/canned-stages/stage-2-ci-cd-scaffold.md` | canned stage references ci-cd-scaffold-stage-writer |
| 7 | `skills/plan-phases/agents/rules-assembler.md`, `commands/walk-platform.md`, `commands/init-design-system.md` | renamed / renamed / renamed |
| 6 | `skills/write-prd/agents/brief-analyzer.md`, `skills/review-pipeline/agents/retrospective-reviewer.md`, `skills/review-pipeline/agents/proposal-drafter.md`, `skills/add-feature/agents/complexity-assessor.md` | |
| 5 | five files in promoted-skills' agents + commands | |
| 4 | `skills/write-prd/SKILL.md` | `→ skills/create-menu/SKILL.md` |

**Total: 99 files** contain at least one mention of an old skill name (excluding `.git/`, `node_modules/`, `.gitnexus/`).

## 5. Plugin manifests (must be edited by content, not by rename)

These files contain the old skill names embedded in marketing-description prose. They get rewritten in commit 8.

- `.claude-plugin/plugin.json` — `description` field
- `.claude-plugin/marketplace.json` — `plugins[0].description` field
- `.cursor-plugin/plugin.json` — `description` field
- `.cursor-plugin/marketplace.json` — `plugins[0].description` field
- `package.json` — `scripts.install:skills:dry-run` (references `--skill setup --skill deliver-stage`)
- `scripts/install/skills-config.example.json` — `skills` array lists `"setup", "deliver-stage", "ship-pr"`

`scripts/install/manifests.js` itself does NOT need editing — it walks `skills/` recursively for any directory containing a `SKILL.md`, so the layout change is transparent to the installer.

## 6. Files that mention old names but MUST NOT be rewritten

These are historical artifacts. Rewriting them would falsify the changelog / past PR descriptions.

- `CHANGELOG.md` — entries for `[3.1.0]`, `[3.0.0]`, and older. Only **ADD** a new `[4.0.0]` entry at the top.
- `docs/v2-qa-report.md` — historical QA snapshot. Leave untouched.
- `docs/v2-pr-description.md` — historical PR body. Leave untouched.
- `docs/v2.1-pr-description.md` — historical PR body. Leave untouched.

## 7. Files NOT in scope (sanity check — verified these stay)

- `/library` route and `library-entry-writer` / `library-route-scaffolder` agents — about the design-system's preview route, not skill renames. 7 mentions; all stay.
- `bytheslice.config.json` keys (e.g. `runPipeline.platformWalkEvery`, `modelTiers.implementer`, `stages.maxTasksPerStage`) — deferred to v5 with backward-compat aliases. Confirmed in plan.
- `tests/fixtures/sample-brief.md` — input sample, no skill references.

## 8. Backward-compat triggers preserved in `triggers:` arrays

Each renamed skill keeps its old slash command and trigger phrases for one release (v4.x.x):

| New skill | Triggers kept from v3 |
|---|---|
| `setup-shop` | `/bytheslice:setup`, `/setup`, "bootstrap a new project" |
| `create-menu` | `/bytheslice:write-prd`, `/write-prd`, "write a prd", "create a prd" |
| `cook-pizzas` | `/bytheslice:plan-phases`, `/plan-phases`, "plan phases", "phased plan" |
| `set-display-case` | `/bytheslice:init-design-system`, `/init-design-system` |
| `final-quality-check` | `/bytheslice:scaffold-ci-cd`, `/scaffold-ci-cd` |
| `open-the-shop` | `/bytheslice:setup-environment`, `/setup-environment` |
| `sell-slice` | `/bytheslice:deliver-stage`, `/deliver-stage`, "deliver the next stage", "ship the next slice", "work the checklist" |
| `box-it-up` | `/bytheslice:ship-pr`, `/ship-pr`, "ship the pr", "ship this slice" |
| `special-order` | `/bytheslice:add-feature`, `/add-feature`, "add a feature", "extend the app" |
| `run-the-day` | `/bytheslice:run-pipeline`, `/run-pipeline`, "run pipeline", "autonomous delivery" |
| `inspect-display` | `/bytheslice:walk-platform`, `/walk-platform` |
| `close-shop` | `/bytheslice:review-pipeline`, `/review-pipeline` |

CHANGELOG documents the deprecation window: **kept in v4.x.x, removed in v5.0.0.**

## 9. Validation plan (run before opening the PR)

1. `node ./bin/bytheslice.js install --target both --dry-run` — must report clean
2. `grep -rln 'deliver-stage\|plan-phases\|ship-pr\|write-prd\|init-design-system\|scaffold-ci-cd\|setup-environment\|add-feature\|run-pipeline\|walk-platform\|review-pipeline' skills/ commands/ README.md scripts/ .claude-plugin/ .cursor-plugin/ package.json bin/` — every remaining hit must be either (a) inside a `triggers:` array as documented backward-compat, or (b) inside a CHANGELOG/historical-doc passage
3. `npx gitnexus analyze` — reindex after the file moves so impact analysis stays meaningful
4. Manual smoke test: open the README, follow Quick Start as a brand-new user would

## 10. Open assumptions (confirm or reject before commit 2)

- **`/bytheslice:` slash-prefix kept** — every command stays under the `bytheslice` namespace (`/bytheslice:sell-slice`, etc.). The plugin name is the brand; the commands are the kitchen.
- **One backward-compat release** — old triggers fire in v4.x.x, removed in v5.0.0.
- **End-user `docs/plans/stage_N_*.md` filenames are not renamed.** Breaking change deferred; legacy stages still work via `/sell-slice`'s legacy routing.
- **`bytheslice.config.json` keys preserve their v3 names.** A future v5 migration can rename them with deprecation aliases; doing it in v4 triples scope.
