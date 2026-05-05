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
| **write-prd** | prd-reviewer | `sonnet` | medium | — |
| **plan-phases** | ci-cd-scaffold-stage-writer | `sonnet` | medium | — |
| **plan-phases** | db-schema-stage-writer | `sonnet` | medium | — |
| **plan-phases** | design-system-stage-writer | `sonnet` | medium | — |
| **plan-phases** | env-setup-stage-writer | `sonnet` | medium | — |
| **plan-phases** | master-checklist-synthesizer | `sonnet` | medium | — |
| **plan-phases** | phased-plan-writer | `sonnet` | medium | — |
| **init-design-system** | bundle-validator | `sonnet` | medium | — |
| **init-design-system** | compliance-pre-check | `sonnet` | medium | — |
| **init-design-system** | token-expander | `opus` | high | — |
| **setup-environment** | env-verifier | `haiku` | low | — |
| **ship-feature** | checklist-curator | `sonnet` | medium | yes |
| **ship-feature** | ci-cd-guardrails | `sonnet` | medium | yes |
| **ship-feature** | discovery | `haiku` | medium | yes |
| **ship-feature** | implementer | `opus` | xhigh | — |
| **ship-feature** | quality-reviewer | `opus` | high | yes |
| **ship-feature** | spec-reviewer | `sonnet` | medium | yes |
| **ship-frontend** | block-composer | `sonnet` | medium | — |
| **ship-frontend** | component-crafter | `sonnet` | medium | — |
| **ship-frontend** | layout-architect | `sonnet` | medium | — |
| **ship-frontend** | modern-ux-expert | `sonnet` | medium | — |
| **ship-frontend** | state-illustrator | `sonnet` | medium | — |
| **ship-frontend** | visual-reviewer | `sonnet` | medium | yes |
| **add-feature** | complexity-assessor | `sonnet` | medium | yes |
| **add-feature** | phased-plan-writer (incremental mode) | `sonnet` | medium | — |
| **run-pipeline** | pr-reviewer | `sonnet` | medium | yes |
| **run-pipeline** | stage-runner | `opus` | high | — |
| **review-pipeline** | retrospective-reviewer | `opus` | high | — |

> **Note on `review-pipeline`:** The `retrospective-reviewer` agent is experimental. Its model and effort assignments are fixed as documented above.

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
- The `token-expander` in `init-design-system` runs at deep tier (`opus/high`) because brand token expansion is a genuinely creative act; the output constrains the entire visual system.
- The `stage-runner` in `run-pipeline` runs at deep tier (`opus/high`) because it coordinates full stage execution and must reason across multiple agent outputs.
