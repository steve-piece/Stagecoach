<!-- commands/scaffold-ci-cd.md -->
<!-- Slash command that loads the scaffold-ci-cd skill. Sub-skill of /deliver-stage; auto-dispatched on type:ci-cd stages. -->

---
description: Sub-skill of /bytheslice:deliver-stage. Wires the production-grade CI/CD + E2E + design-system-compliance + visual-regression baseline on a dedicated chore/scaffold-ci-cd branch. Auto-dispatched by /deliver-stage on type:ci-cd stages; invoke directly to re-scaffold or repair CI when the baseline drifts. Use when the user says "scaffold ci/cd", "set up CI", "bootstrap quality gates", or runs /scaffold-ci-cd.
---

# /scaffold-ci-cd

Load and follow the [`scaffold-ci-cd`](../skills/sub-disciplines/scaffold-ci-cd/SKILL.md) skill.

**Sub-skill of `/bytheslice:deliver-stage`.** This skill is normally dispatched automatically when `deliver-stage` encounters a `type: ci-cd` stage. Run it directly only when you need to re-scaffold or repair the CI/CD baseline outside the normal stage loop.

The skill bootstraps the CI/CD and E2E baseline that every later feature slice depends on:

1. Creates a dedicated `chore/scaffold-ci-cd` branch.
2. Installs and configures Playwright with `@feature`, `@regression-core`, and `@visual` tag suites.
3. Writes GitHub Actions workflows: `ci.yml`, `e2e.yml`, `e2e-coverage.yml`, `design-system-compliance.yml`, and (conditional) `db-schema-drift.yml`.
4. Configures Husky pre-push hooks and a PR template.
5. Writes ESLint + Stylelint config additions for design-system enforcement.
6. Provides a branch-protection setup script.
7. Opens a PR to `main` and verifies all checks pass before returning.

## Preconditions

- Working tree is clean on `main`.
- `gh` CLI is installed and authenticated.
- Stage 1 (design system gate) is complete (deliver-stage handles ordering automatically).

## When to use this command

Use `/scaffold-ci-cd` directly as an escape hatch — for example, when CI has drifted and you want to re-establish the baseline outside the normal phased flow. The everyday entry point is `/bytheslice:deliver-stage`, which runs this sub-skill automatically when the next pending stage has `type: ci-cd`. This skill writes infrastructure, not product code.
