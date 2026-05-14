<!-- commands/setup-environment.md -->
<!-- Slash command that loads the setup-environment skill. Sub-skill of /deliver-stage; auto-dispatched on type:env-setup stages. -->

---
description: Sub-skill of /bytheslice:deliver-stage. Scans .env.example files, generates a manual setup checklist for external services (Supabase, Stripe, Resend, etc.), waits for user confirmation, and verifies all keys are populated before allowing CI runs or feature work. Auto-dispatched by /deliver-stage on type:env-setup stages; invoke directly to re-verify env state.
---

# /setup-environment

Load and follow the [`setup-environment`](../skills/sub-disciplines/setup-environment/SKILL.md) skill.

**Sub-skill of `/bytheslice:deliver-stage`.** This skill is normally dispatched automatically when `deliver-stage` encounters a `type: env-setup` stage. Run it directly only when you need to re-verify environment state outside the normal stage loop.

The skill is a human-in-the-loop gate that ensures all required environment variables are populated before CI runs or feature work begins:

1. Scans every `.env.example` file in the repo and catalogues every required environment variable.
2. Maps variables to known external services (Supabase, Stripe, Resend, Clerk, Auth0, etc.) and groups them.
3. Detects GitHub Actions secrets referenced in CI workflows.
4. Generates a manual setup checklist with provisioning links and waits for user confirmation.
5. Verifies (via the `env-verifier` subagent) that every required key is present and non-placeholder in `.env.local`.

## Preconditions

- Stage 1 (design system) and Stage 2 (CI/CD scaffold) are complete (`deliver-stage` handles ordering automatically).
- `.env.example` files exist listing all required variables.

## When to use this command

Use `/setup-environment` directly as an escape hatch — for example, when you've added new external services mid-flight and want to re-run the gate. The everyday entry point is `/bytheslice:deliver-stage`, which runs this sub-skill automatically when the next pending stage has `type: env-setup`.
