<!-- commands/review-pipeline.md -->
<!-- Slash command shim that loads the review-pipeline skill to review recent stage executions and draft plugin improvements. -->

---
description: EXPERIMENTAL. Reviews recent stage executions, identifies friction patterns, drafts PRs to the plugin repo for improvements. Defaults to plugin path ~/phased-dev-workflow; override via PHASED_DEV_PLUGIN_PATH env var.
---

# /review-pipeline

Load and follow the [`review-pipeline`](../skills/review-pipeline/SKILL.md) skill.

The skill reviews recent phased-plan executions and surfaces systemic friction patterns:

1. Asks which scope to review: last N stages, last project, or a specific skill.
2. Reads stage execution logs, master checklists, and PR histories to identify recurring friction points.
3. Synthesizes patterns across stages and proposes concrete improvements to plugin skills or references.
4. Drafts one or more PRs to the plugin repo (`~/phased-dev-workflow` by default, or the path in `PHASED_DEV_PLUGIN_PATH`) for human review.

## Configuration

- Plugin path defaults to `~/phased-dev-workflow`.
- Override by setting `PHASED_DEV_PLUGIN_PATH` in your environment.

## When to use this command

Use `/review-pipeline` after completing a project or a significant batch of stages when you want to improve the workflow based on real execution data. This command is **experimental** — it drafts PRs for your review; it does not merge anything automatically.
