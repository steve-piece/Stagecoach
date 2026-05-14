<!-- commands/plan-phases.md -->
<!-- Slash command shim that loads the prd-to-phased-plans skill to decompose a finalized PRD into phased development plans. -->

---
description: Decompose a finalized PRD into phased development plans — design-system stage, CI/CD scaffold, env-setup gate, optional DB schema foundation, 20-30 vertical-slice feature stages, a master checklist, and a populated project rules file. Use when the user has a completed PRD and wants an implementation-ready plan. Also use when the user says "break this into phases", "create a development plan", or "phased approach".
---

# /plan-phases

Load and follow the [`plan-phases`](../skills/plan-phases/SKILL.md) skill.

The skill transforms a finalized PRD into a complete, ordered set of implementation stages:

1. Reads the PRD and identifies all features, constraints, and technical requirements.
2. Produces canned stage files for design-system gate, CI/CD scaffold, env-setup gate, and (conditionally) DB schema foundation.
3. Generates 20–30 vertical-slice feature stages, each as a standalone `docs/plans/stage_N_*.md` file.
4. Writes `docs/plans/00_master_checklist.md` as the authoritative progress tracker.
5. Populates the project rules file with conventions derived from the PRD.

## Preconditions

- A finalized PRD exists (output of `/write-prd` or equivalent). Raw briefs, specs, and questionnaires feed `/write-prd` first.

## When to use this command

Use `/plan-phases` once you have a completed PRD and are ready to produce the full implementation plan. The output is the input for `/bytheslice:deliver-stage` (everyday loop, run once per slice) or `/bytheslice:run-pipeline` (experimental autonomous multi-stage delivery).
