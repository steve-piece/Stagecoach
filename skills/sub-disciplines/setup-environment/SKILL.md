<!-- skills/sub-disciplines/setup-environment/SKILL.md -->
<!-- Sub-skill of /stagecoach:deliver-stage. Orchestrator-only: dispatches env-scanner, github-secrets-scanner, checklist-generator, and env-verifier to gate the project on a fully populated environment before feature work or CI runs. -->

---
name: setup-environment
description: Scan environment requirements and verify all external service credentials are populated. Auto-dispatched on env-setup stages.
user-invocable: true
triggers: ["/stagecoach:setup-environment", "/setup-environment", "env setup", "env-setup stage"]
---

# Environment Setup Gate (sub-skill of `/deliver-stage`)

Ensures all external services are provisioned and every `.env.local` file is fully populated before feature stages or CI gates begin. Running feature work with missing or placeholder keys causes cascading failures that are hard to diagnose; this gate catches them early.

## Subagent Roster

Each agent lives in its own file under `./agents/`. Read the file before dispatching.

| Phase | Agent file | Model | Effort | Mode |
|-------|-----------|-------|--------|------|
| 0 | [agents/env-scanner.md](agents/env-scanner.md) | haiku | low | readonly |
| 2 | [agents/github-secrets-scanner.md](agents/github-secrets-scanner.md) | haiku | low | readonly |
| 3 | [agents/checklist-generator.md](agents/checklist-generator.md) | haiku | low | readonly |
| 5 | [agents/env-verifier.md](agents/env-verifier.md) | haiku | low | readonly |

## Reference Files

| File | Purpose |
| --- | --- |
| [references/known-services-catalog.md](references/known-services-catalog.md) | Maps key prefixes → service + provisioning console URL. checklist-generator reads this. |
| [references/env-checklist-template.md](references/env-checklist-template.md) | Structural pattern for the user-facing checklist. |

## When to Use

- `/deliver-stage` reaches a `type: env-setup` stage in the master checklist (auto-dispatch).
- User runs `/setup-environment` directly as an escape hatch.
- User says "env setup", "set up environment", "populate env vars", or "provision services".
- After CI/CD scaffold is complete (`scaffold-ci-cd`) and before the first feature stage.

## Inputs and Preconditions

- Repository exists with at least one `apps/` or `packages/` directory.
- `scaffold-ci-cd` (Stage 2) has completed: `.github/workflows/` exists.
- Clean git working tree on `main`, OR explicit user OK to proceed dirty.

If no `.env.example` files are found at all, stop and tell the user — this likely means the apps were not scaffolded yet. Recommend completing Stage 2 first.

## Workflow

### Phase 0 — Scan

Dispatch `env-scanner`. Receives the workspace root; returns the unique key list per `.env.example`.

### Phase 1 — Service Detection

Wait for `env-scanner` output. The `checklist-generator` (Phase 3) handles the catalog cross-reference — no separate detection step needed in this skill.

### Phase 2 — GitHub Secrets Detection

Dispatch `github-secrets-scanner` with `env-scanner`'s output. Returns the unique secret name list with workflow references.

This skill cannot verify GitHub secrets directly (no read access to org secrets); it records the user's verbal confirmation only.

### Phase 3 — Checklist Generation

Dispatch `checklist-generator` with both scanner outputs and the path to the known-services catalog. Returns the rendered markdown checklist.

Display the checklist to the user in full. Include direct links to provisioning consoles from the catalog.

### Phase 4 — Wait for Confirmation

After displaying the checklist, ask the user to confirm when they have completed all steps.

**Always provide a recommended answer in available options** when prompting.

**HITL bubble-up rule:** if the user signals they cannot access a required service (no account, blocked by billing, etc.), set `needs_human: true` with `hitl_category: external_credentials` and surface the specific service and key as `hitl_question`.

When the user confirms "done", proceed to Phase 5.

### Phase 5 — Verification

Dispatch `env-verifier`. The verifier:
- Confirms a `.env.local` exists alongside every `.env.example`
- Confirms every key from `.env.example` is present in `.env.local` with a non-empty, non-placeholder value
- Returns a structured result

**If verification passes (`status: pass`):** proceed to Phase 6 — stage complete.

**If verification fails (`status: fail`):** display a targeted report (missing files, missing keys, placeholder values per file). Then return to Phase 4 and wait for the user to fix and re-confirm. Loop until `status: pass`.

### Phase 6 — Closeout

1. Record confirmation that all `.env.local` files pass verification.
2. Record user's verbal confirmation that GitHub secrets are set (if any were listed in Phase 2).
3. Mark the stage complete in `docs/plans/00_master_checklist.md`.
4. Walk the [Completion Checklist](#completion-checklist) below and confirm every box is `[x]`.
5. Report to the user: which services were set up, which files were verified, and the total key count.

## Completion Checklist

Walk this checklist at the end of every run. The stage is not "done" until all items are checked.

[ ] All `.env.example` files in the repo have been scanned and all keys catalogued
[ ] All detected services are represented in the manual checklist displayed to the user
[ ] GitHub Secrets section was generated (or confirmed empty if no CI secrets needed)
[ ] User confirmed all provisioning steps are complete
[ ] `env-verifier` subagent returned `status: pass` with zero `missing_files`, zero `missing_keys_per_file`, and zero `placeholder_keys`
[ ] User confirmed GitHub repository secrets are set (or confirmed none are required)
[ ] If invoked as a `type: env-setup` stage by `deliver-stage`, the master-checklist row is flipped to `Completed`

## Hard Constraints

- **Never read, log, or display actual secret values.** The `env-verifier` only checks existence and placeholder patterns — it never surfaces real values. This skill must not work around that constraint.
- **Never write `.env.local` files.** Population is the user's manual action. This skill generates checklists and verifies — it does not provision.
- **Never skip the verification loop.** Even if the user says "I've done everything", `env-verifier` must run before the stage is marked complete.
- **Sub-skill contract.** When invoked as a `type: env-setup` stage by `deliver-stage`, this skill is the entire stage. After completion, mark the stage `Completed` in `docs/plans/00_master_checklist.md`.
- **Subagent prompts live in `./agents/*.md`.** This SKILL.md is workflow only — never inline subagent prompts here.

## Sub-agent Return Contract

When this skill is invoked as a sub-skill by `deliver-stage`, return:

```yaml
status: complete | failed | needs_human
summary: <one paragraph describing what services were detected, which files were verified, and the final verification outcome>
artifacts: [docs/plans/00_master_checklist.md]
needs_human: false | true
hitl_category: null | "external_credentials"
hitl_question: null | "<which service the user cannot access and why>"
hitl_context: null | "<what triggered this — e.g., user reported no access to Stripe billing>"
```
