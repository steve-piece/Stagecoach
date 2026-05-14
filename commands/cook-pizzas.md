<!-- commands/cook-pizzas.md -->
<!-- Slash command that loads the cook-pizzas skill — decompose a finalized PRD into a master checklist of vertical-slice feature stages. Pizza-shop framing: cook every pre-made pie for the display case. -->

---
description: Cook the pre-made pies before the shop opens. Decompose a finalized PRD into phased development plans — 20-30 vertical-slice feature stages, a master checklist, a top "Prep" section pointing at the foundation skills (/set-display-case, /final-quality-check, /open-the-shop), and a populated project rules file. Use when the user has a completed PRD and wants an implementation-ready plan. Also use when the user says "break this into phases", "create a development plan", or "phased approach".
---

# /cook-pizzas

Load and follow the [`cook-pizzas`](../skills/cook-pizzas/SKILL.md) skill.

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
