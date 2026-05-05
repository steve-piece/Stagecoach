<!-- commands/frontend-design.md -->
<!-- Slash command shim that loads the sp-frontend-design skill for end-to-end frontend feature delivery via a specialized subagent pipeline. -->

---
description: End-to-end frontend feature delivery via specialized subagent pipeline. Handles type:frontend stages. Composes from shadcn blocks before crafting custom; ensures all UI states; visual review against design system before PR.
---

# /frontend-design

Load and follow the [`sp-frontend-design`](../skills/sp-frontend-design/SKILL.md) skill.

The skill delivers frontend feature stages via a specialized subagent pipeline:

1. Reads the current `type: frontend` stage file from `docs/plans/`.
2. Dispatches specialized subagents in sequence: modern-ux-expert, layout-architect, block-composer, component-crafter, state-illustrator, and visual-reviewer.
3. Composes UI from shadcn blocks before crafting any custom components.
4. Ensures all UI states (loading, error, empty, populated) are implemented.
5. Runs a visual review against the design system before opening a PR.
6. Updates the master checklist on completion.

## Preconditions

- Stages 1–3 (design system, CI/CD, env setup) are complete.
- The current stage file has `type: frontend`.
- Working tree is clean on `main`.

## When to use this command

Use `/frontend-design` to deliver a frontend stage manually. The orchestrator (`/orchestrator`) routes `type: frontend` stages to this skill automatically.
