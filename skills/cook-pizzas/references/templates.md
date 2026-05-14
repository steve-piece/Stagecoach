# Plan Document Templates

## Stage Frontmatter Template

Every stage file produced by `cook-pizzas` must begin with this YAML frontmatter. See `references/stage-frontmatter-contract.md` for full field definitions.

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

## Master Checklist Template

```markdown
<!-- docs/plans/00_master_checklist.md -->
<!-- Master checklist tracking all stages and completion criteria -->

# [Project Name] — Master Checklist

[One-sentence description of the project.]

---

## Prep — run once before any feature work

These are run-once standalone skills the user invokes directly. `/sell-slice` checks every box below before accepting any feature stage. Each foundation skill flips its own checkbox on completion when invoked in sequential mode.

[ ] Display case built       — run `/bytheslice:set-display-case` (design system, tokens, /library route)
[ ] Quality line installed   — run `/bytheslice:final-quality-check` (CI/CD, E2E, design-system-compliance, visual-regression)
[ ] Shop open                — run `/bytheslice:open-the-shop` (env vars, external service credentials)
[ ] DB schema foundation     — run `/bytheslice:sell-slice` on `stage_4_db_schema_foundation.md` (only if backend in scope)

---

## Stage N — [Stage Name]
**Type:** [type] | **MVP:** Yes | No | **Depends on:** Stages [list]
**Linear milestone:** [id or —]

Completion criteria:
[ ] [criterion from frontmatter]
[ ] tests_passing
[ ] PR reviewer pass
[ ] All tests added and passing
[ ] Full CI green (visual regression + design-system-compliance + db-schema-drift if applicable)
[ ] HITL items resolved (only if hitl_required: true)

---

<!-- Repeat for all feature stages (5..N typical) -->

## MVP Summary

| Stage | Name | Type | Status |
|-------|------|------|--------|
| 4 | DB Schema Foundation (conditional) | db-schema | [ ] |

## Phase 2 (Post-Launch)

| Stage | Name | Type | Status |
|-------|------|------|--------|
| N | [Stage Name] | [type] | [ ] |
```

## Feature Stage Plan Template (stages 5+)

```markdown
---
stage: N
name: "Stage Name"
type: frontend | backend | full-stack | infrastructure
slice: vertical
mvp: true | false
depends_on: [<prior_stage_ints>]
estimated_tasks: <1-6>
hitl_required: false | true
hitl_reason: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
linear_milestone: null | "<id>"
completion_criteria:
  - tests_passing
  - route_renders_without_error
  - visual_review_passed
---

<!-- docs/plans/stage_N_short_name.md -->
<!-- Stage N: [Brief semantic description for search] -->

# Stage N — [Stage Name]

**Goal:** [One sentence describing the deliverable.]

**Architecture:** [How this stage fits into the overall system. 2-4 sentences.]

**Tech stack:**
- [Framework / library]
- [Relevant tool]

**Dependencies from prior stages:**
- Stage X: [package / table / component / env var assumed to exist]

---

## Tasks

### Task 1: [Task Title]

**Files:**
- Create: `path/to/new-file.ts`
- Modify: `path/to/existing-file.ts`

**Step 1: [Step description]**

[Explanation of what to do.]

\`\`\`ts
// path/to/file.ts
// Full implementation — no pseudo-code, no // TODO
\`\`\`

**Step 2: [Step description]**

\`\`\`bash
pnpm test
\`\`\`

**Commit:**
\`\`\`bash
git commit -m "feat: [description]"
\`\`\`

---

### Task 2: [Task Title]

[Same structure as Task 1]

---

**Exit criteria:**
- `pnpm test` passes
- Route `/path` renders without errors
- [Other testable, binary condition]
```

## Canned Stage Templates

The four foundation stage templates live in `references/canned-stages/`. Do not duplicate them here — reference them directly:

- `references/canned-stages/stage-1-design-system-gate.md`
- `references/canned-stages/stage-2-ci-cd-scaffold.md`
- `references/canned-stages/stage-3-env-setup-gate.md`
- `references/canned-stages/stage-4-db-schema-foundation.md`
- `references/canned-stages/auth-dev-mode-switcher-task.md` (injected into auth-tagged stages)

## Naming Conventions

- Master checklist: `00_master_checklist.md`
- Stage plans: `stage_N_short_name.md` where `short_name` is lowercase with underscores
- Stage numbers are sequential starting at 1
- All files go in `docs/plans/`
- Auth-tagged stages: name contains `auth`, `login`, `session`, `rbac`, or `permission`

## Header Comment Convention

Every generated plan file starts with two HTML comment lines:
1. Relative file path
2. Brief description optimized for semantic search

```markdown
<!-- docs/plans/stage_5_user_auth_shell.md -->
<!-- Stage 5: auth shell — sign-in/sign-up routes, layout, loading and error states -->
```

## Checkbox format rule

Always use `[ ]` — no leading dash. Never write `- [ ]`.

Correct: `[ ] task description`
Incorrect: `- [ ] task description`
