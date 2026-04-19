---
name: prd-to-phased-plans
description: Decompose large PRDs, specs, or requirements documents into phased development plans with a master checklist and per-stage implementation files. Use when the user has a long PRD, product spec, requirements doc, or blueprint they want broken into actionable development stages. Also use when the user says "simplify this PRD", "break this into phases", "create a development plan", "staged plan", or "phased approach".
---

# PRD to Phased Plans

Transform sprawling requirements documents into structured, implementation-ready development plans.

## Workflow

### Phase 1: Intake and Discovery

1. **Identify all source documents** in the workspace — PRDs, specs, briefs, questionnaires, API docs, visual references, etc.
2. Read every source document thoroughly. Extract:
   - Features and capabilities described
   - Technical constraints and stack requirements
   - External integrations (APIs, services, databases)
   - User roles and access patterns
   - Data models and schemas
3. **Check for project rules** at `.cursor/rules/`. If present, read all rule files — they dictate architecture, coding standards, testing, and styling preferences that must be referenced in stage plans.
4. Ask clarifying questions if critical decisions are ambiguous (e.g., auth model, deployment target, MVP vs Phase 2 scope).

### Phase 2: Stage Identification

Group features into **ordered development stages** based on dependency chains:

1. Map dependencies: which features block others?
2. Group into stages where each stage's inputs are satisfied by prior stages
3. Typical ordering pattern:
   - **Stage 1**: Project scaffolding / template setup (often owner-handled)
   - **Stage 2**: Database schema / data layer
   - **Stage 3**: Core business logic / engine packages
   - **Stage 4**: Shared UI components
   - **Stage 5-7**: Application-level features (admin, client, integrations)
   - **Stage 8+**: Enhancement features, AI pipelines, seed data
4. Mark each stage as **ship-blocking (MVP)** or **Phase 2**
5. Present the proposed stage breakdown to the user for approval before generating files

### Phase 3: Generate Master Checklist

Create `docs/plans/00_master_checklist.md` using the template in [references/templates.md](references/templates.md).

Rules:
- Every feature from the source docs must appear
- Every feature is decomposed into concrete subtasks (checkbox items)
- Each stage section shows Status and Ship-blocking designation
- Exit criteria per stage: what must be true before moving on
- Summary tables at the bottom for MVP and Phase 2

### Phase 4: Generate Stage Plans

Create one file per stage: `docs/plans/stage_N_short_name.md`.

**Dispatch the [`phased-plan-writer`](../../agents/phased-plan-writer.md) subagent — one invocation per stage, in parallel** (use the `Task` tool with `subagent_type: phased-plan-writer`). The orchestrator (this skill) is responsible for intake, stage identification, and the master checklist. The subagent is responsible for writing each individual stage file.

For each dispatch, supply the subagent with:

- **Stage metadata**: stage number, short name (snake_case), output path, one-sentence goal, ship-blocking flag
- **Scope**: features/subtasks assigned to this stage (verbatim from the master checklist) and exit criteria
- **Context**: relevant excerpts from source PRDs/specs (or absolute paths to read), tech stack, and explicit dependencies on prior stages (packages, tables, components, env vars that must already exist)
- **Project rules**: absolute paths to every applicable `.cursor/rules/*.mdc` file the subagent must read

The subagent returns a structured summary (`path`, `stage`, `tasks_count`, `dependencies_used`, `unresolved`). Resolve any `unresolved` items before moving to Phase 5.

Each stage plan follows the template in [references/templates.md](references/templates.md) and includes:

1. **Header metadata**: two-line HTML comment (relative path + semantic search description)
2. **Goal statement**: one sentence describing the stage's deliverable
3. **Architecture note**: how this stage fits into the overall system
4. **Tech stack**: frameworks, libraries, tools specific to this stage
5. **Rules reference**: if `.cursor/rules/` exist, list which rules apply and summarize key constraints
6. **Tasks**: numbered, each with:
   - Files to create/modify (explicit paths)
   - Step-by-step implementation instructions
   - Full code snippets where the implementation is non-trivial
   - Commit message suggestion per task
7. **Exit criteria**: testable conditions that prove the stage is complete

### Phase 5: Create Implementation Todos

After all plan files are generated, create `TodoWrite` entries for each stage's implementation work. Each todo should reference the stage plan file and be marked `pending`. This gives the user a trackable list they can execute sequentially or delegate to subagents.

## Key Principles

- **Dependency-ordered stages**: never reference a package, table, or component that hasn't been built in a prior stage
- **Exit criteria are testable**: "All tests pass" or "App boots locally" — not "Code looks good"
- **Code snippets are complete**: include full file contents for non-trivial implementations, not pseudo-code
- **Rules are integrated**: if the project has `.cursor/rules/`, each stage plan explicitly states which rules apply and how
- **MVP vs Phase 2 is explicit**: every feature is tagged. The master checklist summary makes the boundary clear
- **Plans are static artifacts**: once generated, plans are not edited during implementation. Implementation follows the plan; deviations are noted in todos

## Output Structure

```
docs/plans/
├── 00_master_checklist.md          # Running checklist of all features/subtasks
├── stage_1_<short_name>.md         # Per-stage implementation plans
├── stage_2_<short_name>.md
├── ...
└── stage_N_<short_name>.md
```

## Detailed Templates

See [references/templates.md](references/templates.md) for the exact markdown templates for the master checklist and stage plan files.
