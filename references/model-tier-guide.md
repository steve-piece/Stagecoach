---
title: Model Tier Guide
version: "2.0"
---

# Model Tier Guide

The phased-dev-workflow plugin uses three model tiers across all sub-agents. Each tier maps to an Anthropic alias that auto-resolves to the latest version per provider.

| Tier | Alias | Use cases | Effort default |
|---|---|---|---|
| **Fast** | `haiku` | Read-only codebase recon, mechanical checks, file scans | low |
| **Balanced** | `sonnet` | Implementation review, judgment calls, vision tasks | medium |
| **Deep** | `opus` | Primary implementation, creative expansion, retrospective | high |

## Why these tiers

- Read-only / mechanical work is best served by the fastest model — saves tokens, completes in seconds, accuracy is parity for these tasks
- Most reviewers + vision sit in the middle — Sonnet handles them well at lower cost
- The actual writing of new code (the implementer) gets Opus — this is where dollars are best spent

## Per-agent model assignments

The table below reflects the **actual current values** in each agent file. Where an agent deviates from the spec-default table in Section 0.6, that deviation is the authoritative assignment.

| Skill | Agent | Model | Effort | Readonly |
|---|---|---|---|---|
| **prd-generator** | prd-reviewer | `sonnet` | medium | — |
| **prd-to-phased-plans** | ci-cd-scaffold-stage-writer | `sonnet` | medium | — |
| **prd-to-phased-plans** | db-schema-stage-writer | `sonnet` | medium | — |
| **prd-to-phased-plans** | design-system-stage-writer | `sonnet` | medium | — |
| **prd-to-phased-plans** | env-setup-stage-writer | `sonnet` | medium | — |
| **prd-to-phased-plans** | master-checklist-synthesizer | `sonnet` | medium | — |
| **prd-to-phased-plans** | phased-plan-writer | `sonnet` | medium | — |
| **sp-design-system-gate** | bundle-validator | `sonnet` | medium | — |
| **sp-design-system-gate** | compliance-pre-check | `sonnet` | medium | — |
| **sp-design-system-gate** | token-expander | `opus` | high | — |
| **sp-environment-setup-gate** | env-verifier | `haiku` | low | — |
| **sp-feature-delivery** | checklist-curator | `sonnet` | medium | yes |
| **sp-feature-delivery** | ci-cd-guardrails | `sonnet` | medium | yes |
| **sp-feature-delivery** | discovery | `haiku` | medium | yes |
| **sp-feature-delivery** | implementer | `opus` | xhigh | — |
| **sp-feature-delivery** | quality-reviewer | `opus` | high | yes |
| **sp-feature-delivery** | spec-reviewer | `sonnet` | medium | yes |
| **sp-frontend-design** | block-composer | `sonnet` | medium | — |
| **sp-frontend-design** | component-crafter | `sonnet` | medium | — |
| **sp-frontend-design** | layout-architect | `sonnet` | medium | — |
| **sp-frontend-design** | modern-ux-expert | `sonnet` | medium | — |
| **sp-frontend-design** | state-illustrator | `sonnet` | medium | — |
| **sp-frontend-design** | visual-reviewer | `sonnet` | medium | yes |
| **the-orchestrator** | pr-reviewer | `sonnet` | medium | yes |
| **the-orchestrator** | stage-runner | `opus` | high | — |
| **phased-dev-retrospective** | retrospective-reviewer | `opus` | high | — |

> **Note on `phased-dev-retrospective`:** This skill is being created in Wave 4.4. The `retrospective-reviewer` agent file does not yet exist on disk but is documented here because its model and effort assignments are fixed by spec.

Aliases (`haiku`, `sonnet`, `opus`) resolve to:

- **Anthropic API:** `opus` → Claude Opus 4.7, `sonnet` → Claude Sonnet 4.6, `haiku` → Claude Haiku 4.5
- **Bedrock / Vertex / Foundry:** different defaults; pin via env vars (see below)

## Overriding the tier mapping

### Option 1: project-level (recommended)

Set in your shell or project `.env`:
```
ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-7
ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-6
ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5
```
This pins your tiers to specific versions while still letting sub-agent frontmatter use aliases.

### Option 2: global override

Set:
```
CLAUDE_CODE_SUBAGENT_MODEL=<some-model>
```
This forces ALL sub-agents to a single model regardless of frontmatter. Useful for cost-control during plugin development. Disable in production runs.

### Option 3: pin in frontmatter

Edit any sub-agent file and replace `model: sonnet` with a full version string. Not recommended — defeats auto-update.

## Effort levels

Each agent declares an effort level. Effort is independent of model. Override at session level via `/effort`.

| Effort | Use when |
|---|---|
| low | Mechanical, deterministic |
| medium | Default for most agents |
| high | Creative or complex reasoning |
| xhigh | Reserved for orchestrator and implementer in xhigh-supported environments |

## Tier-assignment principles applied in this plugin

The plugin intentionally invests heavier compute on agents that PRODUCE or VERIFY output. Specifically:

- The `implementer` (the primary code writer) runs at the deepest tier with the highest effort budget. It is assigned `opus/xhigh` — above the spec default of `opus/high` — because implementation quality directly determines rework cost.
- The `quality-reviewer` (the gate that catches what the implementer missed) runs at deep tier with high effort (`opus/high`). This is a user override from the spec default of `sonnet/medium`: the reasoning is that a Sonnet reviewer applied to Opus output would miss subtle issues that only a model of equal depth can catch.
- The `ci-cd-guardrails` agent runs at balanced tier (`sonnet/medium`, NOT `haiku/low` as the spec originally assigned). The upgrade was made because subtle CI-config violations missed at this stage are expensive to debug downstream; deterministic-looking checks still require judgment about precedence and environment interaction.
- Pure scan-and-list agents (`env-verifier`, `discovery`) stay on the fast tier — judgment is cheap there.
- The `token-expander` in `sp-design-system-gate` runs at deep tier (`opus/high`) because brand token expansion is a genuinely creative act; the output constrains the entire visual system.
- The `stage-runner` in `the-orchestrator` runs at deep tier (`opus/high`) because it coordinates full stage execution and must reason across multiple agent outputs.
