<!-- commands/set-display-case.md -->
<!-- Slash command that loads the set-display-case skill. Daily-prep skill; run before /sell-slice. Also invocable standalone on any project. -->

---
description: Build the display case the pies will sit in. Bootstraps the project design system — validates Claude Design bundle if present, otherwise expands brand brief. Outputs globals.css, Tailwind config, design-system.md, and design-system rules in the project rules file. Also scaffolds the operator-only /library preview route. Run once before /sell-slice (part of the foundation prep phase); also invocable standalone to bolt a design system onto any project.
---

# /set-display-case

Load and follow the [`set-display-case`](../skills/set-display-case/SKILL.md) skill.

**Sub-skill of `/bytheslice:sell-slice`.** This skill is normally dispatched automatically when `sell-slice` encounters a `type: design-system` stage. Run it directly only when you need to re-validate or re-generate the design-system foundation outside the normal stage loop.

The skill validates or generates a complete design system before any feature work begins:

1. Detects mode — bundle-first (Claude Design export provided) or brief-first (brand description only).
2. Validates token completeness via `compliance-pre-check`. Refuses to complete until every required token category is satisfied.
3. Writes `app/globals.css`, `tailwind.config.ts`, and `docs/design-system.md`.
4. Captures project-specific code patterns (variant library, status indicators, icon library, etc.).
5. Appends the design-system rules block to the project rules file.

## Preconditions

- A brand brief or Claude Design bundle is available (or defaults are acceptable).
- Project rules file path known (CLAUDE.md or AGENTS.md).

## When to use this command

Use `/set-display-case` directly only as an escape hatch — for example, if your design tokens drifted and you want a clean re-validation pass. The everyday entry point is `/bytheslice:sell-slice`, which runs this sub-skill automatically when the next pending stage has `type: design-system`.
