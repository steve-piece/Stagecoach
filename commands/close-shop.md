<!-- commands/close-shop.md -->
<!-- Slash command that loads the close-shop skill to review recent stage executions and draft plugin improvements. Pizza-shop framing: bookends /setup-shop — after-service retro. -->

---
description: EXPERIMENTAL. After-service retro. Reviews recent stage executions, identifies friction patterns, drafts PRs to the plugin repo for improvements. Bookends /setup-shop. Defaults to plugin path ~/bytheslice; override via BYTHESLICE_PLUGIN_PATH env var.
---

# /close-shop

Load and follow the [`close-shop`](../skills/close-shop/SKILL.md) skill.

The skill reviews recent phased-plan executions and surfaces systemic friction patterns:

1. Asks which scope to review: last N stages, last project, or a specific skill.
2. Reads stage execution logs, master checklists, and PR histories to identify recurring friction points.
3. Synthesizes patterns across stages and proposes concrete improvements to plugin skills or references.
4. Drafts one or more PRs to the plugin repo (`~/bytheslice` by default, or the path in `BYTHESLICE_PLUGIN_PATH`) for human review.

## Configuration

- Plugin path defaults to `~/bytheslice`.
- Override by setting `BYTHESLICE_PLUGIN_PATH` in your environment.

## When to use this command

Use `/review-pipeline` after completing a project or a significant batch of stages when you want to improve the workflow based on real execution data. This command is **experimental** — it drafts PRs for your review; it does not merge anything automatically.
