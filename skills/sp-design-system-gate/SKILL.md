---
name: sp-design-system-gate
description: Bootstrap the project design system as Stage 1. Validates Claude Design bundle if present, otherwise expands brand brief. Outputs globals.css, Tailwind config, design-system.md, and design-system rules in project rules file. Required before any UI work.
user-invocable: true
triggers: ["/stagecoach:design-system-gate", "/design-system-gate", "scaffold design system", "stage 1 design"]
---

# sp-design-system-gate

Canned Stage 1 of every project. Validate or generate a complete design system before any feature work. Outputs canonical token files and writes design-system rules into the project rules file.

This skill is required before any UI feature stage begins. No feature work may start until the token completeness gate passes.

---

## Reference Files

Read all of these before beginning:

| File | Purpose |
| --- | --- |
| [references/token-checklist.md](references/token-checklist.md) | Canonical token categories — gate blocks until all satisfied |
| [references/globals-css-template.md](references/globals-css-template.md) | Template for `app/globals.css` output |
| [references/tailwind-config-template.md](references/tailwind-config-template.md) | Template for `tailwind.config.ts` output |
| [references/design-system-md-template.md](references/design-system-md-template.md) | Template for `docs/design-system.md` output |
| [references/claude-md-rules-block.md](references/claude-md-rules-block.md) | Rules block to append to the project rules file |

---

## Project Config (optional)

Honor these `stagecoach.config.json` keys when present (see [`references/stagecoach-config-schema.md`](../../references/stagecoach-config-schema.md)):

- `mcps.shadcn`, `mcps.figma`, `mcps.magic` — declarative MCP availability for the bundle-validator and token-expander agents
- `modelTiers.tokenExpander`, `modelTiers.bundleValidator`, `modelTiers.compliancePreCheck` — override agent model tiers for THIS run

---

## Two Input Modes

### Mode A — Bundle-First (preferred)

The user has run a Claude Design session at `claude.ai/design` and provides a design bundle folder. Reference example: `https://github.com/steve-piece/Modern-Refactor-Design-System`.

**Detection:** Look for one of these indicators:
- A folder path the user provides containing CSS variables, a Tailwind config, or a design token JSON
- A GitHub URL pointing to a design system export
- Explicit statement that a Claude Design session was completed

**Flow:**
1. Read the bundle folder (dispatch `agents/bundle-validator.md`)
2. Validate token completeness (dispatch `agents/compliance-pre-check.md`)
3. If gaps found: report missing categories → prompt user to fill them via `ask_user_input_v0`
4. Canonicalize file paths and write output artifacts
5. Capture project-specific code patterns (Step 4 below)
6. Append rules block to project rules file
7. Copy bundle into `docs/design-bundle/` as audit trail

### Mode B — Brief-First (fallback)

No bundle provided. Skill generates the token system from a brand brief.

**Detection:** No bundle folder, no design export — only a brand description, colors, or a quick brief.

**Flow:**
1. Collect brand brief from user if not already in context (via `ask_user_input_v0`)
2. Dispatch `agents/token-expander.md` (opus, high effort) to generate a complete token system
3. Surface the generated token system to the user for approval via `ask_user_input_v0`
4. If user requests changes: apply them and re-surface (cap at 2 rounds; third round → HITL `creative_direction`)
5. Dispatch `agents/compliance-pre-check.md` to verify completeness on the approved tokens
6. Write output artifacts from approved token set
7. Capture project-specific code patterns (Step 4 below)
8. Append rules block to project rules file

---

## Step 1 — Detect Mode and Gather Inputs

Determine which mode applies from context. If ambiguous, ask:

> "Do you have a Claude Design export or existing design bundle to validate? Or should I generate the token system from a brand brief?"

Collect:
- **Bundle path** (Mode A) OR **brand brief** (Mode B) — required
- **Project rules file path** — CLAUDE.md or AGENTS.md (from `prd-to-phased-plans` Q12, or ask)
- **App structure** — `app/globals.css` or `src/app/globals.css` (detect from project, or ask)
- **App shell?** — does the project include a sidebar/nav shell? (determines whether sidebar tokens are required)

---

## Step 2 — Token Validation Gate

Dispatch `agents/compliance-pre-check.md` after collecting or generating tokens.

The gate **refuses to complete** until every required token category from `references/token-checklist.md` is satisfied. No partial passes.

If any category is missing:
- Report which categories are absent with their required token names
- In Mode A: prompt the user to provide the missing values
- In Mode B: loop `token-expander` for the missing categories (counts toward the 2-round cap)

Do not proceed to artifact writing until `compliance-pre-check` returns `status: pass`.

---

## Step 3 — Write Output Artifacts

Once the gate passes, write these files in the target project:

| Artifact | Path | Notes |
| --- | --- | --- |
| CSS token file | `app/globals.css` or `src/app/globals.css` | Per detected project structure |
| Tailwind config | `tailwind.config.ts` | Token bindings; extends theme |
| Design system doc | `docs/design-system.md` | Canonical human-readable reference |
| Bundle audit trail | `docs/design-bundle/` | Mode A only — copy of the Claude Design export |

Use the templates in `references/` as the structural basis. Fill in project-specific values.

---

## Step 4 — Capture Project-Specific Code Patterns

Prompt the user for these visual code patterns using `ask_user_input_v0`. Ask only if relevant to the project type (e.g., skip numeric column treatment for a marketing site). Present as `single_select` where possible.

**Q-A — Variant library**
> "Which variant utility library will you use for component variants?"
> single_select: ["CVA (class-variance-authority)", "tv (tailwind-variants)", "None — plain className logic"]

**Q-B — Status indicator pattern**
> "How should status/state indicators look throughout the UI?"
> single_select: ["Soft pill badges", "Outlined badges", "Icon-only indicators", "None yet — decide per component"]

**Q-C — Numeric column treatment** (skip for marketing sites)
> "How should numbers in data tables be rendered?"
> single_select: ["tabular-nums (fixed-width, aligned)", "Proportional (default)", "No data tables in this project"]

**Q-D — Icon library**
> "Which icon library?"
> single_select: ["Lucide", "Phosphor", "Radix Icons", "Heroicons", "Custom / project-specific"]

**Q-E — Default text size for data-dense UI** (skip for marketing sites)
> "What default text size for data-dense views (tables, sidebars, forms)?"
> single_select: ["text-sm (14px)", "text-base (16px)", "No data-dense UI in this project"]

**Rules for code-pattern capture:**
- If the user answers "None yet", "No data tables", "No data-dense UI", or an equivalent non-answer: **omit that entry from the rules block entirely**. Do not invent defaults.
- Only the explicitly chosen patterns are written into the "Project-specific code patterns" subsection.

---

## Step 5 — Append Rules Block to Project Rules File

Read `references/claude-md-rules-block.md` as the template. Fill in:
- Token catalog path: `docs/design-system.md`
- Project-specific code patterns from Step 4 (only the answered ones)

Append the completed block to the project rules file (CLAUDE.md or AGENTS.md). Do not overwrite existing content — append only.

---

## Step 6 — Return Contract

After all artifacts are written and the rules block is appended, return:

```yaml
status: complete | failed | needs_human
summary: <one paragraph — mode used, token categories validated, artifacts written, rules block appended>
artifacts:
  - <path to globals.css written>
  - <path to tailwind.config.ts written>
  - docs/design-system.md
  - docs/design-bundle/ (Mode A only)
  - <path to project rules file updated>
needs_human: false | true
hitl_category: null | "prd_ambiguity" | "external_credentials" | "destructive_operation" | "creative_direction"
hitl_question: null | "<plain-language question if blocked>"
hitl_context: null | "<what triggered this>"
```

**HITL triggers for this skill:**
- Token completeness cannot be resolved after 2 rounds (Mode B) → `creative_direction`
- User provides conflicting brand direction → `creative_direction`
- Bundle path does not exist or cannot be read → `needs_human: true`, `hitl_category: prd_ambiguity`

This skill does NOT call `ask_user_input_v0` for HITL resolution — it bubbles up the structured contract and the orchestrator (or standalone skill at end-of-turn) prompts the user.

---

## Completion Checklist

[ ] Input mode determined (bundle-first or brief-first)
[ ] Bundle validated OR token system generated and user-approved
[ ] `compliance-pre-check` returned `status: pass` for all token categories
[ ] Sidebar tokens included if project has an app shell
[ ] Dark mode tokens defined for every color token
[ ] `app/globals.css` (or `src/app/globals.css`) written with all token definitions
[ ] `tailwind.config.ts` written with token bindings
[ ] `docs/design-system.md` written with canonical token reference
[ ] `docs/design-bundle/` populated (Mode A only)
[ ] Project-specific code patterns captured (only non-null answers written)
[ ] Design-system rules block appended to project rules file (CLAUDE.md or AGENTS.md)
[ ] No `- [ ]` checkbox syntax used in any output file — only `[ ]`
[ ] No platform-specific bare references ("cursor rules", "claude rules") in any output
[ ] Return contract YAML emitted
