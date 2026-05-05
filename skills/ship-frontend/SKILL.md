---
name: ship-frontend
description: End-to-end frontend feature delivery via specialized subagent pipeline. Handles type:frontend stages. Composes from shadcn blocks before crafting custom; ensures all UI states; visual review against design system before PR.
user-invocable: true
triggers: ["/stagecoach:ship-frontend", "/ship-frontend", "frontend stage", "deliver frontend slice"]
---

<!-- skills/ship-frontend/SKILL.md -->
<!-- Orchestrator skill for type:frontend stages. Runs a 6-subagent pipeline: UX pattern selection → layout → block composition → (conditional) custom component crafting → UI state coverage → visual review. Shared agents (discovery, spec-reviewer, quality-reviewer, ci-cd-guardrails) are sourced from ship-feature. -->

# ship-frontend

End-to-end frontend feature delivery for stages where `type: frontend`. The orchestrator (running on **sonnet**) reads the active stage plan, dispatches a specialized pipeline of subagents, and gates the PR on a passing visual review.

This skill does **not** replace `ship-feature` for backend or full-stack stages. It is invoked only when the stage frontmatter contains `type: frontend`.

---

## Shared Agents (from ship-feature)

The following agents live in `skills/ship-feature/agents/` and are reused verbatim — do not recreate them here:

| Agent | File | Purpose |
| --- | --- | --- |
| discovery | [skills/ship-feature/agents/discovery.md](../ship-feature/agents/discovery.md) | Codebase + GitNexus recon |
| spec-reviewer | [skills/ship-feature/agents/spec-reviewer.md](../ship-feature/agents/spec-reviewer.md) | Spec compliance review |
| quality-reviewer | [skills/ship-feature/agents/quality-reviewer.md](../ship-feature/agents/quality-reviewer.md) | Lint, types, test coverage |
| ci-cd-guardrails | [skills/ship-feature/agents/ci-cd-guardrails.md](../ship-feature/agents/ci-cd-guardrails.md) | CI/CD safety pass |

Read each file before dispatching; never inline its prompt.

---

## Skill-Specific Agents

All six agents live in `skills/ship-frontend/agents/`. Read each file before dispatching.

| Phase | Agent file | Model | Mode |
| --- | --- | --- | --- |
| 2 | [agents/modern-ux-expert.md](agents/modern-ux-expert.md) | `sonnet` | write |
| 3 | [agents/layout-architect.md](agents/layout-architect.md) | `sonnet` | write |
| 4 | [agents/block-composer.md](agents/block-composer.md) | `sonnet` | write |
| 4 (conditional) | [agents/component-crafter.md](agents/component-crafter.md) | `sonnet` | write |
| 5 | [agents/state-illustrator.md](agents/state-illustrator.md) | `sonnet` | write |
| 6 | [agents/visual-reviewer.md](agents/visual-reviewer.md) | `sonnet` | readonly |

---

## MCP Registry

MCP availability is read from `stagecoach.config.json` (the `mcps` block) and the project rules file (cursor or claude rules file). Config wins on conflict. NOT discovered fresh on each call. Check for these entries before dispatching agents that need them:

| MCP | Used by | Status check |
| --- | --- | --- |
| shadcn MCP | block-composer, component-crafter, layout-architect | Required for block composition |
| Magic MCP (21st.dev) | modern-ux-expert | Optional — enables component inspiration |
| Figma MCP | layout-architect, component-crafter | Optional — use if designs exist |
| Chrome DevTools MCP (`chrome-devtools-mcp`) | visual-reviewer | Recommended — enables DOM/console/network introspection |

If a required MCP is missing, surface it to the user before continuing. Do not proceed with block composition if shadcn MCP is unavailable — fall back to direct shadcn CLI commands.

## Project Config (optional)

Honor these `stagecoach.config.json` keys when present (see [`skills/setup/references/stagecoach-config-schema.md`](../setup/references/stagecoach-config-schema.md)):

- `mcps.*` — supersedes the project rules file's MCP section
- `visualReview.tools` — ordered priority list for visual-reviewer (overrides the hardcoded `claude-in-chrome > chrome-devtools-mcp > playwright > vizzly` default)
- `visualReview.vizzly: false` — disable Vizzly entirely (skips it even if it's in the `tools` list)
- `modelTiers.<agent>` — overrides the agent file's `model:` for THIS run

---

## Orchestration Flow

```
Phase 1 — Reconnaissance (parallel)
  discovery (haiku, ship-feature)

Phase 2 — UX Strategy
  modern-ux-expert (sonnet)
    → outputs: docs/ux-spec-<slice>.md

Phase 3 — Layout Shell
  layout-architect (sonnet)
    → outputs: route files, layout components, breakpoint plan

Phase 4 — Component Assembly (sequential, conditional)
  block-composer (sonnet)           ← ALWAYS runs first
    → if 100% coverage: skip component-crafter
    → if gaps reported: fire component-crafter
  component-crafter (sonnet)        ← ONLY if block-composer reports gaps

Phase 5 — State Coverage
  state-illustrator (sonnet)
    → ensures every interactive surface has: loading, empty, error, success

Phase 6 — Visual Review (loops on fail)
  visual-reviewer (sonnet, vision)
    → pass: continue to Phase 7
    → fail: loop back to the agent identified as the source of the issue

Phase 7 — Quality Gates (parallel, from ship-feature)
  spec-reviewer (sonnet)
  quality-reviewer (sonnet)
  ci-cd-guardrails (haiku)
```

**Hard rule:** `block-composer` MUST run and report before `component-crafter` is considered. Never skip block composition.

**Visual review loop cap:** maximum 2 retry loops. If visual review still fails after 2 loops, surface as HITL `creative_direction`.

---

## Workflow

### Phase 0 — Orientation

1. Read `docs/plans/00_master_checklist.md`.
2. Identify the active `type: frontend` stage — the first stage with status `Not Started` or `In Progress`, unless the user named one.
3. Read the full stage plan: `docs/plans/stage_<N>_*.md`.
4. Read the project rules file (cursor or claude rules file) — extract:
   - Which MCPs are installed (shadcn, Magic, Figma, Chrome DevTools)
   - Design system token file locations (`docs/design-system.md`, `app/globals.css`)
   - Any project-specific code patterns (variant library, icon library, etc.)
5. Confirm git state: `git status --short`, `git rev-parse --abbrev-ref HEAD`.
6. Enter **Plan Mode** before dispatching any subagent.

### Phase 1 — Reconnaissance

Read `skills/ship-feature/agents/discovery.md`, then dispatch the discovery subagent. Pass:
- Stage number N
- Path to stage plan
- Project rules file path

Wait for the discovery report before proceeding.

### Phase 2 — UX Strategy

Read `agents/modern-ux-expert.md`, then dispatch it. Pass:
- The PRD slice section (functional requirements for this stage)
- Path to `docs/design-system.md`
- Discovery report (touched modules, blast radius)

Wait for `docs/ux-spec-<slice>.md` to be written before proceeding.

### Phase 3 — Layout Shell

Read `agents/layout-architect.md`, then dispatch it. Pass:
- `docs/ux-spec-<slice>.md`
- Existing app shell structure (from discovery report)
- MCP availability (Figma MCP if installed)

Wait for layout artifacts before proceeding.

### Phase 4 — Component Assembly

**Step 4a — Block Composer (always first):**

Read `agents/block-composer.md`, then dispatch it. Pass:
- `docs/ux-spec-<slice>.md`
- Layout plan output from Phase 3
- MCP availability (shadcn MCP)

Inspect the block-composer return:
- If `ui_coverage_percent: 100` → skip Step 4b entirely.
- If `ui_coverage_percent < 100` → proceed to Step 4b with the `gaps` list.

**Step 4b — Component Crafter (conditional):**

Only if block-composer reported gaps. Read `agents/component-crafter.md`, then dispatch it. Pass:
- `gaps` list from block-composer
- Path to `docs/design-system.md` (token reference)
- MCP availability (shadcn MCP for primitives, Figma MCP if installed)

### Phase 5 — State Coverage

Read `agents/state-illustrator.md`, then dispatch it. Pass:
- All component and route files written in Phases 3–4
- Stage plan's user-facing surfaces list

### Phase 6 — Visual Review

Read `agents/visual-reviewer.md`, then dispatch it. Pass:
- All built files from Phases 3–5
- Path to `docs/design-system.md`
- Path to `docs/ux-spec-<slice>.md`
- MCP availability (Chrome DevTools MCP if installed)

On `verdict: fail`:
- Identify which agent in Phases 3–5 caused the issue (per the critique list).
- Re-dispatch that agent with the critique as additional input.
- Re-dispatch visual-reviewer after the fix.
- Cap at 2 retry loops. On third failure → `needs_human: true`, `hitl_category: creative_direction`.

On `verdict: pass`: continue to Phase 7.

### Phase 7 — Quality Gates (parallel)

Read all three agent files, then dispatch in a single batch:

1. `skills/ship-feature/agents/spec-reviewer.md`
2. `skills/ship-feature/agents/quality-reviewer.md`
3. `skills/ship-feature/agents/ci-cd-guardrails.md`

If any returns `verdict: fail` with severity `blocker`, send back to the implementer (use layout-architect, block-composer, component-crafter, or state-illustrator as appropriate) and re-run the failing reviewer.

### Phase 8 — PR Creation

Only after all Phase 7 reviewers return `verdict: pass`:
1. Update `docs/plans/00_master_checklist.md` — mark this stage complete.
2. Surface the `gh pr create` command for the user to run. Never open the PR autonomously.

---

## Sub-Agent Return Contract

Every agent in this skill MUST return the following YAML block at the end of its response:

```yaml
status: complete | failed | needs_human
summary: <one paragraph>
artifacts: [<paths created or modified>]
needs_human: false | true
hitl_category: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
hitl_question: null | "<plain-language question>"
hitl_context: null | "<what triggered this>"
```

Sub-agents NEVER call `ask_user_input_v0`. They bubble up `needs_human: true` and a `hitl_question`. Only the orchestrator (or a standalone skill at end-of-turn) prompts the user.

HITL category for this skill: `creative_direction` (subjective design tradeoffs — e.g., layout patterns, component choices, visual review failures after 2 loops).

---

## Completion Checklist

Embed this checklist in the stage's PR description and in `docs/plans/00_master_checklist.md` under the relevant stage section. Checkbox format: `[ ]` (no leading dash).

### Pre-Implementation
[ ] Active stage plan read in full (`docs/plans/stage_<N>_*.md`)
[ ] Project rules file read — MCP availability and design tokens confirmed
[ ] Discovery subagent completed — touched modules and blast radius known
[ ] Plan Mode entered before any dispatch

### UX Strategy
[ ] `docs/ux-spec-<slice>.md` written by modern-ux-expert
[ ] UX spec includes 2–3 best-in-class references
[ ] Chosen UX pattern documented with rationale

### Layout
[ ] Route files created or updated
[ ] Layout components written (shell-level only)
[ ] Breakpoint plan documented

### Component Assembly
[ ] Block-composer ran BEFORE component-crafter (hard rule)
[ ] Block-composer report includes `ui_coverage_percent` and `blocks_used`
[ ] If coverage < 100%: component-crafter ran and produced token-only components
[ ] No raw color/font/spacing values in any output — tokens only

### State Coverage
[ ] Every interactive surface has: loading skeleton, empty state, error state, success confirmation

### Visual Review
[ ] Visual reviewer ran against all four viewports (375, 768, 1280, 1920)
[ ] `verdict: pass` returned
[ ] Brand fidelity confirmed
[ ] Hierarchy clarity confirmed
[ ] Spacing rhythm confirmed
[ ] Contrast WCAG AA minimum confirmed
[ ] Keyboard navigation confirmed
[ ] Focus visible confirmed
[ ] `prefers-reduced-motion` respected
[ ] Dark-mode parity confirmed (if applicable)

### Quality Gates
[ ] Spec-reviewer: `verdict: pass`
[ ] Quality-reviewer: `verdict: pass`
[ ] CI/CD guardrails: `verdict: pass`
[ ] All CI gates green (lint, typecheck, unit, integration, E2E)

### PR
[ ] Master checklist updated
[ ] `gh pr create` command surfaced to user (not run autonomously)
