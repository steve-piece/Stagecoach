# PRD CI/CD Checklist (Required)

These rules govern how master-checklist updates, CI gates, and PR shape interact across every Stagecoach run. The orchestrator surfaces these as guardrails to every stage skill that touches CI workflows or the master checklist; sp-ci-cd-scaffold itself enforces them when scaffolding the baseline.

[ ] Before any phased-plan integration run, update `docs/plans/00_master_checklist.md` with current stage status and exact in-scope checklist items.
[ ] After any phased-plan integration run, immediately update `docs/plans/00_master_checklist.md` with completion status, notes, and verification outcomes.
[ ] CI must gate merges on: lint, typecheck, unit/integration tests, `@feature` E2E, `@regression-core` E2E, `@visual` E2E, design-system-compliance, and (if applicable) db-schema-drift.
[ ] Do not mark checklist items complete until all required local and CI gates are green for that slice.
[ ] Expand CI/E2E coverage when shared routes, components, schemas, or APIs are modified; include both changed-flow and regression-core tests.
[ ] Preserve deterministic pipelines: pinned runtime/package manager, reproducible install command, and explicit test commands in workflow steps.
[ ] Upload failure artifacts (trace/video/report/logs) for all E2E failures and treat missing artifacts as a failed run.
[ ] Any CI/CD extension must keep required checks aligned with local pre-push gates and documented in repository workflow files.
[ ] Keep one scoped checklist slice per PR whenever possible; avoid bundling unrelated stage tasks in one delivery.
[ ] If stage file instructions conflict with checklist status, stop and clarify scope before implementation.
