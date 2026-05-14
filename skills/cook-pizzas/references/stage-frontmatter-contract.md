# Stage Frontmatter Contract

Every stage plan file produced by `cook-pizzas` (and consumed by `run-the-day`) must begin with this YAML frontmatter block. All fields are mandatory. No omissions, no extras.

## Template

```yaml
---
stage: <int>
name: "<Title Case>"
type: design-system | ci-cd | env-setup | db-schema | frontend | backend | full-stack | infrastructure
slice: vertical | horizontal
mvp: true | false
depends_on: [<stage_ints>]
estimated_tasks: <int, 1-6>
hitl_required: false | true
hitl_reason: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
linear_milestone: null | "<id>"
completion_criteria:
  - tests_passing
  - <other criteria specific to stage type>
---
```

## Field definitions

| Field | Type | Description |
|-------|------|-------------|
| `stage` | integer | Stage number, sequential from 1 |
| `name` | string | Human-readable stage name in Title Case |
| `type` | enum | See type table below |
| `slice` | enum | `horizontal` for foundation stages (1-4), `vertical` for feature stages (5+) |
| `mvp` | boolean | `true` if this stage ships before launch; `false` if post-launch Phase 2 |
| `depends_on` | int[] | Stage numbers that must complete before this stage begins. Use `[]` for stage 1. |
| `estimated_tasks` | integer | Number of tasks in the stage plan, 1-6 (never exceed 6) |
| `hitl_required` | boolean | `true` if this stage cannot proceed without human input |
| `hitl_reason` | enum or null | Required when `hitl_required: true`. One of the four HITL categories. |
| `linear_milestone` | string or null | Linear milestone ID if project uses Linear tracking (from Q2). `null` otherwise. |
| `completion_criteria` | string[] | Testable, binary conditions. Always include `tests_passing`. |

## Type values

| Value | When to use |
|-------|-------------|
| `design-system` | Stage 1 — design system gate |
| `ci-cd` | Stage 2 — CI/CD scaffold |
| `env-setup` | Stage 3 — environment setup gate |
| `db-schema` | Stage 4 — database schema foundation |
| `frontend` | Feature stages that are UI-only (no backend data layer in this stage) |
| `backend` | Feature stages that are API/server-only |
| `full-stack` | Feature stages that include UI + data layer together |
| `infrastructure` | Non-feature work: observability, rate limiting, caching setup, etc. |

## HITL reason values

| Value | Trigger |
|-------|---------|
| `prd_ambiguity` | PRD contains a conflict, gap, or drift that requires human decision |
| `external_credentials` | Stage requires secrets, OAuth setup, or 3rd-party account configuration |
| `destructive_operation` | Stage involves schema migration on real data, prod deploys, or hard deletes |
| `creative_direction` | Stage requires a subjective brand or copy decision |

## Canned stage defaults

| Stage | `type` | `slice` | `mvp` | `depends_on` | `hitl_required` |
|-------|--------|---------|-------|--------------|-----------------|
| 1 (design-system-gate) | `design-system` | `horizontal` | `true` | `[]` | `false` |
| 2 (ci-cd-scaffold) | `ci-cd` | `horizontal` | `true` | `[1]` | `false` |
| 3 (env-setup-gate) | `env-setup` | `horizontal` | `true` | `[1, 2]` | `true` / `external_credentials` |
| 4 (db-schema-foundation) | `db-schema` | `horizontal` | `true` | `[1, 2, 3]` | `false` |

## Completion criteria conventions

Every stage must include `tests_passing`. Common additional criteria by type:

- `design-system`: `token_files_committed`, `design_system_compliance_check_passing`, `storybook_builds`
- `ci-cd`: `ci_workflow_green_on_main`, `e2e_suite_passing`, `branch_protection_configured`
- `env-setup`: `all_env_vars_populated`, `local_dev_boots`, `services_reachable`
- `db-schema`: `migration_applied`, `types_generated`, `rls_policies_verified` (Supabase only)
- `frontend` / `full-stack`: `tests_passing`, `route_renders_without_error`, `visual_review_passed`
- `backend`: `tests_passing`, `api_contract_verified`

## Cross-skill linking

This contract is referenced by:
- `skills/cook-pizzas/agents/` — all stage writer agents
- `skills/run-the-day/SKILL.md` — for stage routing by `type`
- `skills/sell-slice/SKILL.md` — receives stage frontmatter as execution context
