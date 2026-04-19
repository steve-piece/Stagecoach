# Default Project Setup

The canonical Madewell stack. Apply these unless a PRD explicitly overrides in section 0.1.

---

## Foundation

| Layer | Default |
| --- | --- |
| Architecture | Turborepo monorepo |
| Package Management | pnpm |
| Deployment | Vercel |
| Version Control | GitHub (feature branches + PRs to `main`) |
| Issue Tracking | Linear |
| Node Runtime | Node.js LTS |

---

## Core Dependencies

- Next.js (App Router)
- React
- TypeScript (strict mode)
- Turborepo
- Tailwind CSS
- Class Variance Authority
- Framer Motion
- Lucide Icons
- Shadcn UI
- Zod
- Supabase JS client

## Dev Dependencies

- ESLint
- Prettier
- Husky (pre-commit hooks)
- Vitest (unit testing)
- Playwright (end-to-end testing)

---

## 3rd Party Services

| Service | Purpose |
| --- | --- |
| Supabase | Database (PostgreSQL), auth, storage, edge functions, RLS |
| Stripe | Payments, subscriptions, Connect for marketplaces |
| Resend | Transactional and auth email (with React Email components) |
| Vercel | App hosting, preview deployments, edge runtime |

---

## Optional / Project-Specific

Include only when the PRD calls for them.

| Service | When to Use |
| --- | --- |
| Vercel AI SDK | Any LLM or generative AI feature |
| Vercel AI Gateway | Routing and observability for multi-model LLM calls |
| Twilio | SMS, OTP, voice |
| Storybook | Custom UI component libraries |
| E2B | Sandboxed agent execution in MicroVMs |

---

## Environment Variable Conventions

### Supabase (current naming, post-rename)

| Variable | Format | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | Project URL, client + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `sb_publishable_xxx` | Client-side publishable key (replaces legacy anon key) |
| `SUPABASE_SECRET_KEY` | `sb_secret_xxx` | Server-side secret key (replaces legacy service role key) |

The legacy JWT-based `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are being phased out. Use the new naming for all new projects.

### Stripe

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server-side API calls |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |

### Resend

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Email send authentication |
| `RESEND_FROM_EMAIL` | Default from address |

### Vercel AI Gateway

| Variable | Purpose |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Gateway authentication |

---

## Architecture Conventions

- All database tables have RLS policies enabled before launch
- Server actions for mutations, API routes only when serving external clients
- Shared packages in monorepo for `ui`, `db`, `config`, `utils`
- Apps live under `apps/`, packages under `packages/`
- Migrations managed via Supabase CLI, committed to repo
- Environment files: `.env.local` (dev), Vercel project envs (preview/staging/prod)

## Testing Conventions

- Vitest for unit and integration tests, colocated next to source files
- Playwright for end-to-end flows, in `e2e/` directory at app root
- Coverage gate in CI for changed files
- Pre-commit hook runs lint + type check + affected unit tests

## CI/CD Conventions

- GitHub Actions for CI (lint, type check, test, build)
- Vercel for CD (preview per PR, production on merge to `main`)
- Required PR checks before merge: passing CI, at least 1 review
- Database migrations run manually via Supabase CLI before deploy

## UX Defaults

- Mobile-first responsive design
- WCAG 2.1 AA accessibility minimum
- All interactive elements have loading, empty, and error states
- Toast notifications via Shadcn UI sonner component
- Forms validated client-side with Zod and server-side with Zod
