# Madewell Dev Workflow

A Cursor skills plugin for PRD-driven development: generate requirements documents, decompose them into phased implementation plans, and enforce CI/CD quality gates throughout delivery.

## Installation

### Cursor (Plugin Marketplace)

```text
/add-plugin madewell-dev-workflow
```

Or search for "madewell-dev-workflow" in the Cursor plugin marketplace.

### Manual

Clone this repo and symlink or copy the contents into your project's `.cursor/` directory:

```bash
git clone https://github.com/steve-piece/madewell-dev-workflow.git
```

## Workflow

```
Project brief
     |
     v
[prd-generator]          ← skill: generates PRD from brief + defaults
     |
     v
docs/prd-<slug>.md       ← user reviews and confirms
     |
     v
[prd-to-phased-plans]    ← skill: decomposes PRD into staged plans
     |                     dispatches [phased-plan-writer] subagents in parallel,
     |                     one per stage
     v
docs/plans/              ← master checklist + per-stage plan files
     |
     v
/sp-feature-delivery     ← command: executes stages with branching + subagents
     |
     v
/sp-ci-cd-guardrails     ← command: verifies E2E coverage per feature
```

## Skills

### prd-generator

Generate a complete PRD from a free-form project brief. Accepts optional overrides to the default tech stack and conventions. Outputs a single markdown file with all 7 sections (0-6) including a phased implementation plan and Linear mapping.

**Triggers:** "create a PRD", "write a PRD", "generate a PRD", "document requirements"

**Bundled references:**
- `references/prd-template-v1.md` &mdash; canonical section structure
- `references/project-defaults.md` &mdash; default tech stack, services, conventions

### prd-to-phased-plans

Decompose a PRD into a master checklist and per-stage implementation files. Groups features into dependency-ordered stages, marks each as MVP or Phase 2, and generates `docs/plans/` with actionable task breakdowns.

**Triggers:** "break this into phases", "create a development plan", "staged plan", "phased approach"

**Bundled references:**
- `references/templates.md` &mdash; master checklist and stage plan templates

**Dispatched subagents:**
- [`phased-plan-writer`](agents/phased-plan-writer.md) &mdash; one invocation per stage, in parallel; writes the full `docs/plans/stage_N_*.md` file from the orchestrator-supplied scope, dependencies, and project rules

## Agents

### phased-plan-writer

Stage-plan author dispatched by the `prd-to-phased-plans` skill. Receives stage metadata, scope, source excerpts, prior-stage dependencies, and applicable `.cursor/rules/*.mdc` paths from the orchestrator and produces a complete, implementation-ready `docs/plans/stage_N_<short_name>.md` file matching the canonical template. Returns a structured summary (`path`, `stage`, `tasks_count`, `dependencies_used`, `unresolved`) so the orchestrator can resolve gaps before implementation begins. One subagent per stage; the orchestrator runs them in parallel.

## Commands

### /scaffold-ci-cd

Bootstrap production-grade CI/CD and E2E infrastructure in a new repository. Creates:

- Playwright E2E suites (`@feature` and `@regression-core`)
- GitHub Actions workflows (`ci.yml`, `e2e.yml`, `e2e-coverage.yml`)
- Husky `pre-push` hook enforcing local quality gates
- PR template with E2E attestation checklist
- Branch protection provisioning script (`scripts/setup-branch-protection.sh`)

### /sp-feature-delivery

Execute phased implementation work from `docs/plans/`. Reads the master checklist, determines the active stage, and orchestrates subagent-driven delivery with branching, review gates, and checklist tracking.

### /sp-ci-cd-guardrails

Post-feature safety pass. Verifies CI/CD infrastructure is present, confirms E2E tests were added for changed behavior, and ensures no existing workflow gates were weakened.

## Rules

### prd-ci-cd-checklist

Always-apply rule enforcing strict CI/CD controls during phased plan delivery: checklist updates before and after integration runs, merge gating on all test suites, artifact upload requirements, and one-slice-per-PR discipline.

## Default Tech Stack

Unless overridden, PRDs reference the Madewell Default Project Setup:

| Category | Default |
|---|---|
| Architecture | Turborepo monorepo |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Vercel |
| Payments | Stripe |
| Email | Resend |
| Issue Tracking | Linear |
| Version Control | GitHub |

## License

MIT
