<!-- commands/init-design-system.md -->
<!-- Slash command that loads the init-design-system skill. Sub-skill of /deliver-stage; auto-dispatched on type:design-system stages. -->

---
description: Sub-skill of /bytheslice:deliver-stage. Bootstraps the project design system. Validates Claude Design bundle if present, otherwise expands brand brief. Outputs globals.css, Tailwind config, design-system.md, and design-system rules in project rules file. Auto-dispatched by /deliver-stage on type:design-system stages; invoke directly to re-run the design-system foundation manually.
---

# /init-design-system

Load and follow the [`init-design-system`](../skills/sub-disciplines/init-design-system/SKILL.md) skill.

**Sub-skill of `/bytheslice:deliver-stage`.** This skill is normally dispatched automatically when `deliver-stage` encounters a `type: design-system` stage. Run it directly only when you need to re-validate or re-generate the design-system foundation outside the normal stage loop.

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

Use `/init-design-system` directly only as an escape hatch — for example, if your design tokens drifted and you want a clean re-validation pass. The everyday entry point is `/bytheslice:deliver-stage`, which runs this sub-skill automatically when the next pending stage has `type: design-system`.
