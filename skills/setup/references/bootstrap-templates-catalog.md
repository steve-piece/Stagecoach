# Bootstrap Templates Catalog

The `bootstrap` skill (Stage 0) wraps official scaffolders rather than bundling its own templates. This document records which scaffolders are used and why, so the choice is explicit and reproducible.

## Currently supported (v2.1)

### Single-app

```bash
pnpm dlx create-next-app@latest <name> \
  --typescript \
  --app \
  --tailwind \
  --turbopack \
  --eslint \
  --import-alias "@/*" \
  --use-pnpm
```

**Why this exact invocation:**
- `--typescript` — the rest of Stagecoach assumes TypeScript everywhere
- `--app` — App Router (Stagecoach's frontend skill is App-Router-shaped)
- `--tailwind` — design-system gate emits Tailwind config; CSS-in-JS would require a different design-system gate variant
- `--turbopack` — current Next.js default; matches what the skill would expect
- `--eslint` — required by the design-system-compliance CI job (`eslint-plugin-tailwindcss` config additions live there)
- `--import-alias "@/*"` — matches the import-alias convention all Stagecoach skill examples assume
- `--use-pnpm` — pnpm is the default package manager Stagecoach assumes

### Monorepo

```bash
pnpm dlx create-turbo@latest <name> --example basic
```

**Why `--example basic`:**
- Two starter apps + one shared package — minimal but realistic structure
- Lets the user `pnpm add` more apps as needed without committing to a complex example layout
- Stagecoach's phased-plan-writer assumes the `apps/*` and `packages/*` shape from this template

After `create-turbo` runs, the user typically removes the example apps (`apps/web`, `apps/docs`) and adds their own via `pnpm dlx create-next-app apps/<name>` — flag this in the next-step pointer.

## Out of scope for v2.1

- **Astro** — would need its own design-system-gate path (different Tailwind setup), different test runner, different deploy story
- **Remix** — similar — different routing primitives, different middleware story
- **Vite + React** — viable but Stagecoach's frontend skills assume Next.js conventions (Server Components, Server Actions, etc.)
- **Plain Node API** — would need a complete frontend-design skill replacement (no UI work)
- **Python / Django / Rails / etc.** — out of scope; this is a JS/TS plugin

## How to extend

If you want to add a stack, the contract is:
1. Add a new `Q3 — Stack` option to `skills/setup/SKILL.md`'s plan-mode gate.
2. Add the scaffold invocation to Phase 2.
3. Verify the downstream skills (`init-design-system`, `scaffold-ci-cd`, `deliver-stage` (incl. frontend pipeline)) work with the new stack — many will not without per-stack adapters.

In practice this is a much larger change than just adding a scaffold command. Adding a non-Next.js stack to Stagecoach is a v3 conversation, not a v2.x patch.

## Future scaffolders we might wrap

- `pnpm create vite@latest` (would require a separate Stagecoach Vite path)
- `pnpm dlx create-astro@latest` (separate Astro path)
- Custom internal-template scaffolders (per-org templates that include design-system + auth wired up)
