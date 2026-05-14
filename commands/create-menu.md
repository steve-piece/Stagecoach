<!-- commands/write-prd.md -->
<!-- Slash command shim that loads the prd-generator skill to generate a complete PRD from a free-form project brief. -->

---
description: Generate a complete PRD (Product Requirements Document) from a free-form project brief. Use when the user provides a project description and wants a structured PRD, says "create a PRD", "write a PRD", "generate a PRD", "build a PRD", or "document requirements". Follows the Phased PRD Template v2 with 8 sections (0–7). References bundled defaults for tech stack, architecture, and delivery conventions.
---

# /write-prd

Load and follow the [`write-prd`](../skills/write-prd/SKILL.md) skill.

The skill generates a complete, canonical PRD from a free-form project brief:

1. Enters plan mode to resolve ambiguity (tech stack, architecture, delivery conventions) before writing any content.
2. Fills all 8 sections (0–7) of the Phased PRD Template v2 using the project brief and any uploaded specs or brand assets.
3. Applies bundled defaults (tech stack, architecture, delivery conventions) unless the user explicitly overrides them.
4. Invokes the `prd-reviewer` subagent as a final quality gate before handing the document back.

## When to use this command

Use `/write-prd` when you have a project description (however rough) and want a structured, implementation-ready PRD. The skill handles ambiguity resolution internally — you do not need a polished brief.

For converting a completed PRD into phased implementation plans, use `/plan-phases`.
