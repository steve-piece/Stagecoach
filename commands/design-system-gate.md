<!-- commands/design-system-gate.md -->
<!-- Slash command shim that loads the sp-design-system-gate skill to bootstrap the project design system as Stage 1. -->

---
description: Bootstrap the project design system as Stage 1. Validates Claude Design bundle if present, otherwise expands brand brief. Outputs globals.css, Tailwind config, design-system.md, and design-system rules in project rules file. Required before any UI work.
---

# /design-system-gate

Load and follow the [`sp-design-system-gate`](../skills/sp-design-system-gate/SKILL.md) skill.

The skill runs canned Stage 1 of every project — validate or generate a complete design system before any feature work begins:

1. Checks for an uploaded Claude Design bundle. If present, validates and extracts tokens. If absent, expands the brand brief using defaults.
2. Outputs canonical token files: `globals.css`, Tailwind config, and `design-system.md`.
3. Writes design-system rules into the project rules file so every subsequent stage inherits them.
4. Opens a PR to `main` and verifies it passes CI before returning.

## Preconditions

- Working tree is clean on `main`.
- A brand brief or Claude Design bundle is available (or defaults are acceptable).

## When to use this command

Use `/design-system-gate` to run Stage 1 manually. The orchestrator (`/orchestrator`) invokes this automatically when driving a full plan. No UI feature work should begin until this gate completes.
