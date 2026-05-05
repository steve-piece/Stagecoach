<!-- commands/add-feature.md -->
<!-- Slash command shim that loads the add-feature skill — bolts new features onto an existing Stagecoach project after the original PRD-to-app run is complete. Auto-detects whether the project is Stagecoach-built, just-an-existing-app (redirects to setup), or no-project-on-disk (redirects to setup for bootstrap). -->

---
description: Bolt new features onto an existing project mid-flight. Auto-detects whether the project was built with Stagecoach (has docs/plans/), wasn't (existing app, needs setup first), or doesn't exist yet (needs bootstrap). For Stagecoach projects, runs complexity assessment, writes new stage files via phased-plan-writer (extending the master checklist), and hands off to /stagecoach:ship-feature for delivery. Use after the original PRD-to-app run is complete and you want to add a feature without rewriting the whole plan.
---

# /add-feature

Load and follow the [`add-feature`](../skills/add-feature/SKILL.md) skill.

The skill auto-detects which path applies:

- **Path A — Stagecoach-built project.** `docs/plans/00_master_checklist.md` exists. Runs complexity assessment via the `complexity-assessor` subagent, writes new stage files in incremental mode via `phased-plan-writer` (continuing the existing stage numbering), updates the master checklist, and hands off to `/stagecoach:ship-feature` (single new stage) or `/stagecoach:run-pipeline` (multiple new stages) for delivery — both of which will exercise the full CI gate.
- **Path B — Existing app, not Stagecoach-built.** `package.json` exists but no `docs/plans/`. Bubbles up an HITL recommending `/stagecoach:setup` first (which now includes a Step 3 CI/CD baseline check for non-Stagecoach apps).
- **Path C — No project on disk.** Neither marker present. Bubbles up an HITL recommending `/stagecoach:setup` for full bootstrap.

## When to use this command

Use `/stagecoach:add-feature` after `/stagecoach:run-pipeline` has shipped the original plan and you have one or more additional features to bolt on. Each new feature is assessed for complexity (single-stage or multi-stage), the proposed breakdown is surfaced for your authorization, and the new stage files are written into `docs/plans/` with stage numbers continuing from where the original plan left off. Delivery then happens through the same `ship-feature` pipeline as the original work, so the new stages get the full CI gate (`@feature` + `@regression-core` + `@visual` + design-system-compliance + db-schema-drift if applicable).

For NEW project creation (no existing app), use `/stagecoach:setup` instead. For the FIRST set of features against a brand-new PRD, use `/stagecoach:write-prd` then `/stagecoach:plan-phases`.
