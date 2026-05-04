# Architecture Conventions Reference

Opinion-free baseline that the phased-plan elicitation injects into your project rules file. Your own conventions (naming, type system, internal organization, server-action patterns, etc.) are layered on top via the rule files you import in elicitation Q9, plus any project-specific rules captured by the design system gate.

## Universal web standards (always apply)

> Non-negotiable. Rooted in WCAG / semantic HTML / browser standards.

[ ] Every interactive element has a visible focus ring
[ ] Hit targets: 24px minimum desktop, 44px minimum mobile
[ ] Respect `prefers-reduced-motion` on every transition
[ ] Icon-only buttons have descriptive `aria-label`
[ ] Use `<a>` / `<Link>` for navigation; never `<button>` for navigation
[ ] Display validation errors inline next to the field that failed
[ ] On submit failure, auto-focus the first errored field
[ ] Loading buttons retain their label and show a spinner; disable until response completes
[ ] Confirm destructive actions OR provide an Undo affordance — never delete on a single unguarded click
[ ] Warn users of unsaved changes before navigating away from a dirty form
[ ] Back / Forward navigation restores scroll position
[ ] Skeleton loaders mirror the final content layout to prevent CLS

## Performance facts (always apply)

> Measurable, framework-agnostic.

[ ] Animate `transform` and `opacity` only; never layout-triggering properties (`top`, `left`, `width`, `height`)
[ ] Avoid CLS-causing patterns: late-loading hero images without dimensions, late-injected ads, fonts without `font-display`

## Project structure (one variant chosen during elicitation)

### Variant A — Single app

Selected when the project scope is one app (typically marketing-only or a small standalone SaaS).

```
<project-root>/
├── app/                        (or src/app/)
│   └── ...                     (internal organization is up to you)
├── public/
├── package.json
└── (config files)
```

> How the inside of `app/` is organized (route-based, feature-based, layered) is NOT prescribed by this file. Import your own rules in elicitation Q9.

### Variant B — Monorepo

Selected when the project scope includes more than one deployable app, OR shared code across multiple deployment targets.

```
<project-root>/
├── apps/
│   └── <app-name>/             (each app's internal structure is up to you)
├── packages/
│   └── <package-name>/         (shared code: types, utils, ui, env, db client, etc.)
├── package.json
├── turbo.json                  (if Turborepo)
├── pnpm-workspace.yaml         (if pnpm; or yarn/npm equivalent)
└── (config files)
```

Structural-only rules:

[ ] Apps depend on packages; packages do not depend on apps
[ ] No circular dependencies between packages
[ ] Env vars live per-app in `.env.local`; never read or modify them programmatically — refer to `.env.example`
[ ] Workspace tooling configured: each new package registered in the workspace manifest before use

> Internal app organization, package contents, and code conventions come from the rule files you import in elicitation Q9.

## Security baseline — Supabase (only if elicitation indicates Supabase)

> Bypassing these creates real vulnerabilities. These are not preferences.

[ ] Service-role keys are never exposed to Client Components, browser code, or any bundle that ships to the browser
[ ] Every table accessed by user-scoped clients has at least one RLS policy; default-deny when no policy exists
[ ] Database functions invoked by user-scoped clients use `SECURITY DEFINER` with `SET search_path = ''` and fully qualified schema names
[ ] Non-public views use `security_invoker = on` so RLS is enforced through the invoking user's permissions
[ ] Database calls happen on the server only; never directly from Client Components

> Patterns like declarative schema, `COMMENT ON` for MCP context, `select()` column discipline, `.single()` vs `.maybeSingle()`, etc. are good practices but are NOT in this file — they come in via elicitation Q9 (rule files you import per project) or the design system gate where applicable.

## Framework-version syntactic facts

> Only what is *syntactically required* by a framework version. Recommendations live in your imported rule files.

### Next.js 16+ (only if elicitation Q (framework) indicates Next.js 16+)

[ ] `params`, `searchParams`, `cookies()`, `headers()` return promises and must be awaited
[ ] Parallel routes require a `default.tsx` for every slot; return `null` or `notFound()`

### React 19+ (only if elicitation indicates React 19+)

[ ] `ref` is passed as a standard prop; `forwardRef` is no longer required
[ ] `<Context value={}>` is used directly as a provider

## Auth-tagged stages (always apply when auth is in scope)

[ ] Auth-related stages MUST include the dev-mode user switcher (see `references/canned-stages/auth-dev-mode-switcher-task.md`)

## How elicitation injects this into the project rules file

The `prd-to-phased-plans` elicitation phase reads:
- "Single-app or monorepo?" → picks Variant A or B
- "Database in scope? Which?" → conditionally appends Supabase security baseline
- "Framework version?" → conditionally appends syntactic facts

It then:

1. Concatenates: universal web standards + performance facts + chosen structure variant + applicable security baseline + applicable framework facts
2. Writes the result into the project rules file (CLAUDE.md or AGENTS.md) under `## Architecture Conventions (baseline)`
3. Below that, appends `## Architecture Conventions (project-specific)` populated from:
   - Rule files imported via elicitation Q9 (user's own preferences)
   - Any code-pattern rules emitted by the design system gate (e.g., variant systems, status badge patterns)
4. The phased-plan-writer references both sections when writing each stage
