<!-- commands/ship-feature.md -->
<!-- Slash command shim that loads the ship-feature skill to orchestrate phased feature delivery via a parallel-subagent pipeline. -->

---
description: Orchestrate phased feature delivery from docs/plans/ using a parallel-subagent pipeline (discovery, checklist curation, implementation, spec + quality review, ci-cd-guardrails) with branching, CI/E2E gates, and live master-checklist updates. Use when the user runs /ship-feature, says "deliver the next stage", "execute the plan", "ship stage N", "work the checklist", or "implement docs/plans".
---

# /ship-feature

Load and follow the [`ship-feature`](../skills/ship-feature/SKILL.md) skill.

The skill orchestrates a single phased-plan stage end-to-end via six standalone subagents:

1. **Discovery** — reads the stage file and identifies all work items, dependencies, and acceptance criteria.
2. **Checklist curation** — trims and orders the checklist to the minimum viable scope for the stage.
3. **Implementation** — writes production code on a feature branch, runs CI and E2E gates.
4. **Spec review** — verifies the implementation matches the stage file requirements.
5. **Quality review** — runs linting, type checks, and test coverage checks.
6. **CI/CD guardrails** — verifies CI infrastructure is intact and E2E coverage is adequate before opening the PR.

## Preconditions

- Stages 1–3 (design system, CI/CD, env setup) are complete.
- Working tree is clean on `main`.

## When to use this command

Use `/ship-feature` to deliver a single non-frontend stage. For frontend stages, use `/ship-frontend`. For fully autonomous multi-stage delivery, use `/run-pipeline`.
