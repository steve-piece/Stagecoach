# Changelog

All notable changes to **Stagecoach** are recorded here. The format is loosely [Keep a Changelog](https://keepachangelog.com/), and the project follows semver.

---

## [2.2.1] — 2026-05-05

### Changed
- **GitHub repo renamed** from `steve-piece/phased-dev-workflow` to `steve-piece/stagecoach`. GitHub redirects the old URL, but every plugin manifest, README, and skill reference now points to the canonical new URL.
- **Default plugin path renamed** from `~/phased-dev-workflow` to `~/stagecoach` (used by `/stagecoach:review-pipeline` to locate the plugin repo for retrospective PRs). If you kept your local clone at `~/phased-dev-workflow`, set the env var override below.
- **Env var renamed:** `PHASED_DEV_PLUGIN_PATH` → `STAGECOACH_PLUGIN_PATH`. Used to override the default plugin path for `review-pipeline`. Set in your shell rc:
  ```sh
  export STAGECOACH_PLUGIN_PATH="$HOME/wherever/your/clone/lives"
  ```
- **`package.json` `name`** renamed `phased-dev-workflow` → `stagecoach` for consistency with the plugin manifest and repo.

### Migration
If you renamed your local clone to `~/stagecoach`, no env var needed. If you kept it at `~/phased-dev-workflow` (or anywhere else), add `STAGECOACH_PLUGIN_PATH` to your shell rc with the absolute path. The old `PHASED_DEV_PLUGIN_PATH` env var is no longer read.

---

## [2.2.0] — 2026-05-05

### Added
- **`/stagecoach:add-feature`** — bolt new features onto an existing project after the original PRD-to-app run is complete. Auto-detects whether the project is Stagecoach-built (`docs/plans/00_master_checklist.md` present), an existing app needing setup first, or a fresh folder needing bootstrap. For Stagecoach projects, runs the `complexity-assessor` subagent (single-stage vs multi-stage), surfaces the proposed breakdown for authorization, then dispatches `phased-plan-writer` in incremental mode to write the new stage files. Hands off to `/stagecoach:ship-feature` or `/stagecoach:run-pipeline` for delivery.
- **`phased-plan-writer` incremental mode** — same agent now operates in two modes: `plan-phases` mode (original PRD run, stages 5+) or `incremental` mode (any stage number, complexity-assessor output as primary input, no PRD context required).
- **Setup Step 3 — CI/CD Baseline Check** — Flow B and Flow C now check the four CI/CD baseline markers (`ci.yml`, `design-system-compliance.yml`, husky `pre-push`, PR template) and offer to scaffold via `/stagecoach:scaffold-ci-cd` if missing. Makes Stagecoach viable for non-PRD-to-app workflows.

### Changed
- **Skills renamed to verb-first scheme** (with `sp-` prefix dropped):
  - `prd-generator` → `write-prd`
  - `prd-to-phased-plans` → `plan-phases`
  - `sp-design-system-gate` → `init-design-system`
  - `sp-environment-setup-gate` → `setup-environment`
  - `sp-ci-cd-scaffold` → `scaffold-ci-cd`
  - `sp-frontend-design` → `ship-frontend`
  - `sp-feature-delivery` → `ship-feature`
  - `the-orchestrator` → `run-pipeline`
  - `phased-dev-retrospective` → `review-pipeline`
- **`bootstrap` skill folded into the new `setup` umbrella.** Standalone `bootstrap` skill removed; functionality is now Step 1 of `/stagecoach:setup`. Auto-detects whether you're starting fresh (Flow B) or in an existing project (Flow C).
- **First-time-install flow added to `setup`.** Flow A creates `~/.stagecoach/defaults.json` so future projects can opt in to your machine-wide defaults via a single Group 1 question instead of re-answering the per-section setup questions.
- **References relocated.** `references/model-tier-guide.md`, `references/stagecoach-config-schema.md`, and the root-level `stagecoach.config.example.json` all moved to `skills/setup/references/`.

### Migration
If you have local docs or scripts referencing the old paths or skill names, update them. Per-project `stagecoach.config.json` files from v2.1 don't need changes — the schema is unchanged. If you have a Stagecoach project that already shipped its plan, run `/stagecoach:add-feature` to extend it.

---

## [2.1.0] — 2026-05-04

### Added
- **`bootstrap` skill (Stage 0)** — optional on-ramp that scaffolds a new Next.js single-app or Turborepo monorepo, drops in `stagecoach.config.json`, and creates a gitignored `ROADMAP.local.md`. *(Folded into the `setup` umbrella in 2.2.0.)*
- **`stagecoach.config.json` personalization layer** — optional per-project file at the project root; overrides plugin defaults declaratively (model tiers, stage shape, MCPs, visual-review tooling, HITL categories, external rule imports).

### Changed
- **`sc-` prefix removed from slash commands.** When the plugin is published to the marketplace, commands are auto-namespaced under `stagecoach:` (e.g., `/stagecoach:write-prd`). The bare form (`/write-prd`) also works in local dev.

---

## [2.0.0] — 2026-05-04

### Added
- **`init-design-system`** (formerly `sp-design-system-gate`) — Stage 1 design-system gate. Bundle-first or brief-first.
- **`setup-environment`** (formerly `sp-environment-setup-gate`) — Stage 3 env-setup gate. Scans `.env.example`, generates manual provisioning checklist, env-verifier sub-agent confirms keys without logging values.
- **`ship-frontend`** (formerly `sp-frontend-design`) — type:frontend pipeline. 6 sub-agents: modern-ux-expert → layout-architect → block-composer (mandatory first) → component-crafter (conditional) → state-illustrator → visual-reviewer. Hardcoded visual-review tooling priority (Claude in Chrome > Chrome DevTools MCP > Playwright > Vizzly).
- **`review-pipeline`** (formerly `phased-dev-retrospective`, experimental) — cross-stage friction detection.
- **HITL bubbling architecture** — sub-agents NEVER prompt the user directly. They return structured `needs_human` fields with category + question. The orchestrator is the only surface that calls `ask_user_input_v0`.
- **Model alias system** — `haiku`, `sonnet`, `opus` aliases everywhere (no version pins). Per-tier overrides via `ANTHROPIC_DEFAULT_*_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL` env vars.
- **Embedded completion checklists** inside each SKILL.md (separate `*-checklist.md` reference files removed for cross-platform compatibility).
- **Opinion-free architecture-conventions baseline** at `skills/plan-phases/references/architecture-conventions.md` — only universal web standards, performance facts, conditional security baselines, conditional framework-version syntactic facts, structural project variants. NO naming conventions, type-vs-interface, internal organization rules — those come from the user via plan-phases elicitation Q9.
- **Stage routing in run-pipeline** — orchestrator reads each stage file's `type:` frontmatter and dispatches to the correct skill.
- **Plugin manifest renamed to `stagecoach`**, version bumped to `2.0.0`.

### Changed
- **Stage 1 is now the design-system gate** (was CI/CD scaffold in v1). CI/CD scaffold is now Stage 2.
- **20–30 vertical-slice feature stages** is the new target (was loose in v1).
- **6-task hard cap per stage**, completable in one fresh agent session.
- **Linear is now optional** — gathered via question gate in `plan-phases`, not in the main flow.

### Removed
- `skill-mcp-scout` sub-agent — MCPs are now defined in the phased plan and read from the project rules file.
- All hardcoded model version references in skill / agent files.
- `cursor`-specific and `claude`-specific bare references throughout — replaced with generic "project rules file" or inline "(cursor or claude rules file)".

### Migration from v1

If you have an existing v1 project:

[ ] Re-run `/stagecoach:plan-phases` against your existing PRD to regenerate stage files with v2 frontmatter.
[ ] If you had already completed v1 Stage 1 (CI/CD scaffold), mark `stage_2_ci_cd_scaffold.md` as completed in the master checklist before running the orchestrator.
[ ] If your project does not need a design system, you can stub Stage 1 by completing `stage_1_design_system_gate.md` manually with a minimal token set.
[ ] Update any custom sub-agents to return the standard HITL fields (`needs_human`, `hitl_category`, `hitl_question`, `hitl_context`) instead of prompting the user directly.

---

## [1.0.0] — 2026-04

Initial release. PRD generation, phased planning, and CI/CD hardening skills.
