<!-- commands/sell-slice.md -->
<!-- Slash command that loads the sell-slice skill: the everyday delivery loop. Pizza-shop framing: pull one pie off the rack, run it through the line, slice and serve to one customer. -->

---
description: Sell a customer their slice — the everyday delivery loop. Reads the master checklist, picks the next Not-Started stage, dispatches the right pipeline by stage type (frontend / backend / full-stack / db-schema), runs spec/quality review, basic checks (lint/type/build), and a type-aware aggregating test review (dev server + browser UAT for frontend; CI gates only for backend), then commits the slice locally. Hands off to /box-it-up for shipping. Use when the user runs /sell-slice, says "sell a slice", "deliver the next stage", "ship stage N", "work the checklist", or "execute docs/plans".
---

# /sell-slice

Load and follow the [`sell-slice`](../skills/sell-slice/SKILL.md) skill.

`deliver-stage` is the everyday delivery loop in ByTheSlice v3. It replaces both `ship-feature` and `ship-frontend` from v2 — one command, one stage at a time, automatic routing by stage `type:`.

The skill drives a single stage end-to-end:

1. **Orientation** — reads the master checklist, identifies the active stage, and reads its frontmatter.
2. **Reconnaissance** — discovery + checklist-curator + rules-loader run in parallel.
3. **Build plan + user authorization.**
4. **Branch / worktree setup.**
5. **Stage-type routing** — dispatches to the right sub-pipeline:
   - `design-system` → `init-design-system` sub-skill
   - `ci-cd` → `scaffold-ci-cd` sub-skill
   - `env-setup` → `setup-environment` sub-skill
   - `frontend` → internal frontend pipeline (UX → layout → blocks → components → states → visual review)
   - `backend` / `full-stack` / `db-schema` → internal implementer + spec/quality review
6. **Per-item spec + quality review** (loops until pass).
7. **Basic checks** — lint, typecheck, build (with fix-attempter / debug-instrumenter loop).
8. **Aggregating test review** — type-aware depth (full browser UAT for frontend; reduced CI-only for backend; minimal for foundation stages).
9. **CI/CD guardrails** — gates PR open.
10. **Stage closeout** — master checklist update, PR open, CI green, merge, branch cleanup.

## Preconditions

- `docs/plans/00_master_checklist.md` exists.
- Clean git working tree on `main`, OR explicit user OK to proceed dirty.

## When to use this command

Run `/deliver-stage` over and over until your master checklist is fully `[x]`. For multi-stage autonomous delivery (experimental), see `/run-pipeline`. To bolt new features onto an existing master checklist, see `/add-feature` (it feeds into `deliver-stage`).
