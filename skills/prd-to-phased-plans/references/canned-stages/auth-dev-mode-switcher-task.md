# Auth Dev-Mode User Switcher — Required Task Snippet

This task is injected into any stage detected as auth-tagged by `phased-plan-writer`.

**Detection signals (any one is sufficient):**
- Stage name contains: `auth`, `login`, `session`, `rbac`, `permission`
- Stage type is `frontend` or `full-stack` AND PRD Section 2 mentions auth flows
- PRD Section 2 has a feature labeled `[auth]`

---

## Task: Development-mode user switcher banner

[ ] **Development-mode user switcher banner**

Component renders ONLY when `process.env.NODE_ENV === 'development'`

**Files to create:**
- `components/dev/user-switcher-banner.tsx` — the banner component
- `actions/dev/dev-switch-user.ts` — dev-only Server Action (only registered in dev)

**Specification:**
- Fixed position, top of viewport, dismissible (reappears on refresh)
- Shows: current user email + role + tenant (if multi-tenant)
- Dropdown lists all seeded test users from `db/seed/users.ts` (or equivalent seed file)
- Click on user → calls dev-only auth helper to switch session
- Dev-only auth helper guarded with `if (process.env.NODE_ENV !== 'development') throw new Error('Dev-only')`
- Server Action: `actions/dev/dev-switch-user.ts` — in `actions/dev/` directory, only imported conditionally
- Component: `components/dev/user-switcher-banner.tsx`
- Mounted in root layout, conditionally rendered:
  ```tsx
  {process.env.NODE_ENV === 'development' && <UserSwitcherBanner />}
  ```

**Tests:**
- E2E test: verifies banner appears in dev build (`NODE_ENV=development`)
- E2E test: verifies banner does NOT appear in production build (`NODE_ENV=production`)

**Commit:** `dev: add user switcher banner for RBAC testing in local development`

---

> **Why this is required:** Constantly re-logging or manually switching users to test RBAC flows during development is the single largest friction point in auth-heavy projects. This component eliminates it with no production footprint.
