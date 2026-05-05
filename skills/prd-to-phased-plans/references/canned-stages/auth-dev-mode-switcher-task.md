# Auth Dev-Mode User Switcher — Required Task Snippet

This task is injected into any stage detected as auth-tagged by `phased-plan-writer`.

**Detection signals (any one is sufficient):**
- Stage name contains: `auth`, `login`, `session`, `rbac`, `permission`
- Stage type is `frontend` or `full-stack` AND PRD Section 2 mentions auth flows
- PRD Section 2 has a feature labeled `[auth]`

---

## Task to inject verbatim

[ ] **Development-mode user switcher banner**
    - Component renders ONLY when `process.env.NODE_ENV === 'development'`
    - Fixed position, top of viewport, dismissible (reappears on refresh)
    - Shows: current user email + role + tenant (if multi-tenant)
    - Dropdown lists all seeded test users from `db/seed/users.ts` (or equivalent)
    - Click on user → calls dev-only auth helper to switch session
    - Dev-only auth helper guarded with `if (process.env.NODE_ENV !== 'development') throw`
    - Server Action: `dev-switch-user.ts` in `actions/dev/` (only registered in dev)
    - Component: `components/dev/user-switcher-banner.tsx`
    - Mounted in root layout, conditionally rendered
    - Test: e2e test that verifies banner appears in dev, NOT in prod build

---

## Extended implementation notes

When expanding the above task into a full stage task block, include:

**Files to create:**
- `components/dev/user-switcher-banner.tsx` — the banner component
- `actions/dev/dev-switch-user.ts` — dev-only action (only imported conditionally)

**Implementation constraints:**
- Banner is mounted in root layout with `{process.env.NODE_ENV === 'development' && <UserSwitcherBanner />}`
- Dev-only auth helper throws `new Error('Dev-only')` when called outside development
- Seed file path defaults to `db/seed/users.ts`; adapt to project's actual seed location

**Commit:** `dev: add user switcher banner for RBAC testing in local development`

---

> **Why this is required:** Constantly re-logging or manually switching users to test RBAC flows during development is the single largest friction point in auth-heavy projects. This component eliminates it with no production footprint.
