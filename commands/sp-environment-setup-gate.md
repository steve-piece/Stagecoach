<!-- commands/sp-environment-setup-gate.md -->
<!-- Slash command shim that loads the sp-environment-setup-gate skill to run the Stage 3 environment setup gate. -->

---
description: Stage 3 gate. Scans .env.example files, generates manual setup checklist for external services (Supabase, Stripe, Resend, etc.), waits for user confirmation, verifies all keys populated before allowing CI runs or feature work.
---

# /sp-environment-setup-gate

Load and follow the [`sp-environment-setup-gate`](../skills/sp-environment-setup-gate/SKILL.md) skill.

The skill runs canned Stage 3 of every project — a human-in-the-loop gate that ensures all required environment variables are populated before CI runs or feature work begins:

1. Scans all `.env.example` files in the repo and identifies every required environment variable.
2. Groups variables by external service (Supabase, Stripe, Resend, etc.) and generates a manual setup checklist.
3. Pauses and waits for the user to confirm all external accounts are created and all keys are populated in `.env.local`.
4. Verifies that every required key is present and non-empty before clearing the gate.

## Preconditions

- Stage 1 (design system) and Stage 2 (CI/CD scaffold) are complete.
- `.env.example` files exist listing all required variables.

## When to use this command

Use `/sp-environment-setup-gate` to run Stage 3 manually. The orchestrator (`/the-orchestrator`) invokes this automatically. No CI runs or feature work should begin until this gate clears.
