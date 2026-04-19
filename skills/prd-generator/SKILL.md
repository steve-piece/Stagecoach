---
name: prd-generator
description: Generate a complete PRD (Product Requirements Document) from a free-form project brief. Use when the user provides a project description and wants a structured PRD, says "create a PRD", "write a PRD", "generate a PRD", "build a PRD", or "document requirements". Follows the Madewell PRD Template v1 with 7 top-level sections (0–6) and a phased implementation plan. References bundled defaults for tech stack, architecture, and delivery conventions.
---

# PRD Generator

Generate a complete, canonical PRD from a free-form project brief.

## Inputs

Collect before generating:

1. **Project brief** (required) — free-form description of the product: what it does, who it's for, why it exists.
2. **Explicit overrides** (optional) — deliberate divergences from the default stack, architecture, or conventions.
3. **Scope signals** (optional) — MVP vs full, known phases, key personas, required integrations.

If the brief is present but specifics are missing, infer from [references/project-defaults.md](references/project-defaults.md). Do not ask for information that can be reasonably inferred from context.

If critical ambiguities remain after inference (auth model, multi-tenancy, domain name, known external APIs), ask **at most 3 focused questions** before generating.

## Reference Files

Read both before filling any section:

| File | Used For |
| --- | --- |
| [references/prd-template-v1.md](references/prd-template-v1.md) | Section structure, headings, and prompts |
| [references/project-defaults.md](references/project-defaults.md) | Default tech stack, services, and conventions (sections 0, 4, 5) |

## Brief Mapping Heuristic

When parsing the project brief, extract these signals first and route them to the right sections:

| Signal in Brief | Routes To |
| --- | --- |
| Nouns (objects, records, things users interact with) | 4.3 Data Model entities |
| Verbs (what users do) | 2.4 Functional Requirements |
| "For [audience]" or "[role] who needs..." | 1.3 Personas |
| "So that [outcome]" or "to [achieve X]" | 1.2 Success Metrics |
| "Without [thing]" or "instead of [alternative]" | 1.4 Non Goals |
| "Connects to [service]" or "uses [provider]" | 5.1 External Integrations |
| "Must [perform/scale/comply]" | 2.5 Non Functional Requirements |
| Time references ("first," "later," "eventually") | 6.2 Phases |

Run this pass first, then fill sections.

## Generation Workflow

1. Read both reference files.
2. Apply the Brief Mapping Heuristic above to extract signals.
3. Map the project brief to each template section.
4. For every section not addressed by the brief:
   - Apply defaults from `project-defaults.md` where applicable (tech stack, infra, integrations).
   - Mark unknown specifics with the tagged TBD convention (see below) rather than inventing them.
   - When inferring, mark inline: `[Inferred: reasoning]`.
5. Fill **section 6.5 (Phased Implementation Plan)** with phase tables (see Phase Table Format below).
6. Fill **section 6.6 (Linear Implementation Mapping)** with workspace/team, project/label naming per phase, and issue creation rules from the 6.5 tables.
7. **Run the Consistency Check** (see below) before writing the file.
8. Write the complete PRD as a single markdown file.
9. End the response with a summary of what's **confirmed**, **assumed**, and **blocked**.

## Tagged TBD Convention

Not all gaps are equal. Use these tags so downstream readers know what's urgent:

| Tag | Meaning | Example |
| --- | --- | --- |
| `[TBD-BLOCKER]` | Must be resolved before Phase 1 work begins | `[TBD-BLOCKER] auth model: SSO vs email/password` |
| `[TBD-ASSUMPTION]` | Working assumption documented, validate during design | `[TBD-ASSUMPTION] users will tolerate email-only login for MVP` |
| `[TBD-DEFER]` | Can be resolved later in the project lifecycle | `[TBD-DEFER] localization scope, English only at launch` |
| `[Inferred: reason]` | Filled in based on context, flag for review | `[Inferred: B2B SaaS based on "team workspace" language]` |

## Phase Table Format

Each phase in section 6.5 uses this expanded format:

```markdown
#### Phase N: Name

| Feature / Work Item | Priority | Dependencies | Acceptance Criteria | Effort | Owner Role | Notes |
| --- | --- | --- | --- | --- | --- | --- |
|  | P0/P1/P2 |  |  | S/M/L |  |  |
```

**Column rules:**
- **Priority**: P0 (must ship in this phase), P1 (should ship), P2 (nice to have)
- **Dependencies**: Other rows or external systems blocking this work
- **Acceptance Criteria**: Binary, testable definition of done. Drives the gate.
- **Effort**: S (≤ 1 day), M (2-5 days), L (1-2 weeks). Anything bigger gets split.
- **Owner Role**: FE / BE / Full-stack / Design / DevOps

**Gate criteria for this phase:**
A binary, testable paragraph. "Auth works" is not a gate. "User can sign up via email, verify via Resend link, log in, and reach the dashboard on a production preview URL with no console errors" is a gate.

## Quality Bar by Section

Sections that don't meet this bar should be flagged with `[TBD-BLOCKER]` or expanded.

| Section | Minimum Bar |
| --- | --- |
| 1.1 Background | At least 3 sentences, names the problem and the cost of not solving it |
| 1.2 Success Metrics | At least 3 KPIs, each with baseline + target + measurement method |
| 1.3 Personas | Each persona has name, role, primary JTBD, and at least 1 pain point |
| 1.4 Non Goals | At least 2 explicit exclusions with rationale |
| 2.1 In Scope | Each feature has a one-line user value statement |
| 2.4 Functional Requirements | Each requirement has trigger, behavior, and at least 1 edge case |
| 2.5 Non Functional Requirements | Concrete numeric targets where possible (latency, uptime, etc.) |
| 3.3 Key Screens | Each screen lists all 4 states (empty, loading, populated, error) |
| 4.3 Data Model | Every entity has fields, types, and relationships |
| 5.1 Integrations | Each integration has purpose, provider, failure mode |
| 5.3 Telemetry | Every KPI in 1.2 has a corresponding event |
| 6.3 Domains & Secrets | All env vars listed match integrations in 5.1 |
| 6.5 Phases | Every phase has a binary, testable gate |

## Consistency Check

Before writing the file, verify:

- [ ] Every in-scope feature in **2.1** appears in at least one phase in **6.5**
- [ ] Every KPI in **1.2** has a corresponding telemetry event in **5.3**
- [ ] Every external integration in **5.1** has env vars listed in **6.3**
- [ ] Every persona in **1.3** has at least one journey in **2.3**
- [ ] Every entity in **4.3** is referenced by at least one functional requirement in **2.4**
- [ ] Every phase in **6.5** ladders up to objectives in **1.2**
- [ ] No orphan dependencies in **6.5** (every dependency is either a prior row or a documented external system)

If any check fails, fix the gap before writing the file or explicitly flag it with a tagged TBD.

## Output

- **File**: `docs/prd-[project-slug].md`, or `docs/prd.md` if no slug is obvious.
- **Header**: Two lines at top, (1) relative path, (2) one-line semantic description.
- **Structure**: Follow [references/prd-template-v1.md](references/prd-template-v1.md) exactly. All sections 0–6 and all subsections must be present, even if sparse. Never omit a section.
- **Section 0** must open with this verbatim note:
  > Unless explicitly overridden in this document, use the **Madewell Default Project Setup** for all tech stack, architecture, testing, CI/CD, and coding standards.
- **Section 0.1 (Overrides)**: If the project diverges from defaults, include a structured override table:

  ```markdown
  ### 0.1 Overrides from Default Setup

  | Default | Override | Reason |
  | --- | --- | --- |
  |  |  |  |
  ```

  If no overrides, write "None. Project follows Madewell defaults."

## Handling Missing Information

| Situation | Action |
| --- | --- |
| Tech stack not specified | Apply full defaults from `project-defaults.md` |
| Integrations not mentioned | List defaults (Supabase, Stripe, Resend); mark optional ones `[TBD-DEFER]` |
| Data model not described | Enumerate entities implied by the brief; mark attributes `[TBD-ASSUMPTION]` |
| Personas vague | Draft 1–2 personas from context; mark with `[Inferred: ...]` |
| Phases not given | Propose a 3–4 phase breakdown based on scope |
| Domain/DNS unknown | Mark `[TBD-BLOCKER]` if pre-launch, `[TBD-DEFER]` otherwise |
| Auth model unspecified | Default to Supabase Auth with email/password + magic link, flag as `[TBD-ASSUMPTION]` |
| Multi-tenancy unclear | Ask before generating, this affects RLS schema |
| Overrides from defaults | Document explicitly in section 0.1 |

## Response Summary Format

After writing the PRD file, end the response with:

```markdown
## PRD Generation Summary

**Confirmed** (from brief or defaults):
- ...

**Assumed** (inferred or working assumptions):
- ...

**Blocked** (TBD-BLOCKER items needing input):
- ...
```

## Downstream Skills

This skill produces a PRD file. It does not chain automatically.

Once the PRD is confirmed by the user:
- **`prd-to-phased-plans`** — decomposes section 6.5 into a master checklist and per-stage implementation files under `docs/plans/`.
- **`sp-feature-delivery`** command — executes each stage from those plan files.
