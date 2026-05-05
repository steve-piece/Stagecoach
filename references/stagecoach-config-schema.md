# Stagecoach Config Schema

`stagecoach.config.json` is an **optional** per-project file at the root of the user's project (NOT inside the plugin). It declaratively overrides plugin defaults so users don't have to fork the plugin to personalize behavior.

## File location

```
<user-project-root>/stagecoach.config.json
```

If the file is absent, the plugin uses its built-in defaults (see [`references/model-tier-guide.md`](./model-tier-guide.md) for model defaults). All keys are optional — a config file with `{}` is valid and equivalent to no config.

## Format

JSON-with-comments (JSONC dialect — same as `tsconfig.json`). The plugin parses comments and trailing commas. The `.json` extension is conventional even though the content allows comments.

## Precedence (top wins)

1. **Environment variables** — machine-level
   - `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`
   - `CLAUDE_CODE_SUBAGENT_MODEL` (force-override of all subagent models)
2. **`stagecoach.config.json`** — per-project, version-controlled with the project
3. **Project rules file** (`CLAUDE.md` or `AGENTS.md`) — per-project conventions captured during elicitation
4. **Plugin spec defaults** — fallback when nothing else is set

When two sources disagree, the higher-precedence source wins. The orchestrator logs the resolved values at session start so the user knows what's in effect.

## Schema

```jsonc
{
  // Override per-agent model tier. Falls back to plugin defaults
  // documented in references/model-tier-guide.md.
  // Use the alias names: "haiku", "sonnet", "opus".
  "modelTiers": {
    "implementer": "opus",
    "qualityReviewer": "opus",
    "specReviewer": "sonnet",
    "discovery": "haiku",
    "ciCdGuardrails": "sonnet",
    "checklistCurator": "sonnet",
    "stageRunner": "opus",
    "prReviewer": "sonnet",
    "modernUxExpert": "sonnet",
    "layoutArchitect": "sonnet",
    "blockComposer": "sonnet",
    "componentCrafter": "sonnet",
    "stateIllustrator": "sonnet",
    "visualReviewer": "sonnet",
    "tokenExpander": "opus",
    "bundleValidator": "sonnet",
    "compliancePreCheck": "sonnet",
    "envVerifier": "haiku",
    "prdReviewer": "sonnet",
    "phasedPlanWriter": "sonnet",
    "designSystemStageWriter": "sonnet",
    "ciCdScaffoldStageWriter": "sonnet",
    "envSetupStageWriter": "sonnet",
    "dbSchemaStageWriter": "sonnet",
    "masterChecklistSynthesizer": "sonnet",
    "retrospectiveReviewer": "opus"
  },

  // Per-stage shape preferences for prd-to-phased-plans + sp-feature-delivery.
  "stages": {
    "maxTasksPerStage": 6,            // hard cap per stage; default 6
    "targetFeatureStages": "20-30"    // splitter aims for this band; "10-15" or "30-40" also reasonable
  },

  // Which MCPs the project has installed. Read by sp-frontend-design,
  // sp-feature-delivery, sp-design-system-gate.
  // If the project rules file ALSO declares MCPs, this config wins.
  "mcps": {
    "shadcn": true,
    "magic": false,
    "figma": false,
    "chromeDevTools": true,
    "supabase": false,
    "gitnexus": true
  },

  // Visual review tooling for sp-frontend-design's visual-reviewer.
  // The "tools" array is an ORDERED priority list — the agent uses
  // the first available one. Defaults match the plugin's hardcoded
  // priority: claude-in-chrome > chrome-devtools-mcp > playwright > vizzly.
  "visualReview": {
    "tools": ["claude-in-chrome", "chrome-devtools-mcp", "playwright", "vizzly"],
    "vizzly": false   // disable Vizzly entirely (e.g., no account / cost concerns)
  },

  // Add project-specific HITL categories beyond the four built-in
  // (prd_ambiguity, external_credentials, destructive_operation, creative_direction).
  // Sub-agents that want to escalate use these category names; the orchestrator
  // surfaces the right prompt to the user.
  "hitl": {
    "additionalCategories": [
      // { "name": "legal_review", "promptHint": "Legal sign-off needed before this lands." }
    ]
  },

  // External rule-file imports (matches prd-to-phased-plans elicitation Q9).
  // When non-empty, prd-to-phased-plans skips Q9 and uses these directly.
  "rules": {
    "imports": [
      // "https://github.com/your-org/agentic-rules/blob/main/monorepo-nextjs/CLAUDE.md"
    ]
  },

  // Bootstrap defaults — used by /stagecoach:bootstrap when present.
  // If absent, bootstrap asks via plan-mode questions.
  "bootstrap": {
    "variant": "single-app",          // "single-app" | "monorepo"
    "stack": "nextjs",                // "nextjs" only in v2.1; more later
    "roadmapFile": "ROADMAP.local.md" // pass null to skip creating the roadmap file
  }
}
```

## Keys

### `modelTiers`

Maps agent name → tier alias. Agent names use camelCase (e.g. `qualityReviewer`, `ciCdGuardrails`). Values must be one of `"haiku" | "sonnet" | "opus"`. Unknown agent names are ignored (with a one-line warning at session start).

Why use this instead of the env vars: env vars override the tier *globally* (every agent typed `opus` becomes the same model). Config overrides individual agent assignments. They compose — env vars handle the alias resolution, the config picks which alias each agent uses.

### `stages.maxTasksPerStage`

Default `6`. Lower = more, smaller stages. Upper bound `8` (above this stages won't fit in a single fresh Claude session reliably).

### `stages.targetFeatureStages`

Default `"20-30"`. The phased-plan splitter aims for a stage count in this band by tuning the split granularity. Smaller number = larger slices.

### `mcps`

Boolean per known MCP. The plugin reads this AND the project rules file's MCP section; the config wins on conflict. Use `true` to declare an MCP available, `false` to declare it unavailable (so the agents won't try to call it).

### `visualReview`

`tools` is an ordered priority list. The visual-reviewer agent walks the list and uses the first tool that's available in the current environment. `vizzly: false` skips Vizzly even if it's in the `tools` list.

### `hitl.additionalCategories`

Each entry is `{ name: string, promptHint: string }`. Sub-agents that want to escalate set `hitl_category` to the `name` value; the orchestrator translates the `promptHint` into a user prompt.

### `rules.imports`

URLs to external rule files (the same shape as elicitation Q9). When this array is non-empty, `prd-to-phased-plans` skips Q9 entirely and uses these imports instead — useful for re-running the planner without re-prompting.

### `bootstrap`

Defaults for `/stagecoach:bootstrap`. When present, bootstrap skips its plan-mode question gate and uses these values directly. Useful for repeatable scaffolding (CI / templates).

## How the plugin reads this file

At session start, every Stagecoach skill checks for `stagecoach.config.json` at the project root, parses it as JSONC, and merges it with the precedence above. The orchestrator (`/stagecoach:orchestrator`) logs the resolved settings in its first message so the user sees what's in effect.

If the file is malformed JSON, the plugin halts with an HITL prompt asking the user to fix it (HITL category: `prd_ambiguity` — closest fit). It does NOT fall through to defaults silently — silent fallthrough on a config error would surprise users.

## Forking is still allowed

If the config doesn't expose enough knobs, fork the plugin. But please open an issue first describing what you wanted to override — most reasonable knobs should live in this schema.
