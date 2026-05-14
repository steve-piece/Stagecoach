<!-- commands/walk-platform.md -->
<!-- Slash command that loads the walk-platform skill: on-demand cross-cutting visual walkthrough of a running web app. Complements (does not replace) deliver-stage's per-slice visual-reviewer. -->

---
description: Cross-cutting visual walkthrough of a running web app. Discovers every route, drives a live browser through them, captures screenshots and console output, and surfaces a ranked report of what's broken, mocked, stubbed, or empty across the whole product. Run before UAT, before a demo, or after a batch of `/ship-pr` runs to catch silent regressions on surfaces nobody touched. Read-only. Different from `deliver-stage`'s per-slice visual-reviewer (Phase 4.7) — that gates ONE slice against spec; this walks EVERY route to find drift between claimed and real.
argument-hint: [optional — scope hints like "marketplace only", "skip /host-resources", or a specific app name]
---

# /walk-platform

Load and follow the [`walk-platform`](../skills/walk-platform/SKILL.md) skill.

`/deliver-stage`'s frontend pipeline already runs a sophisticated per-slice visual reviewer (Phase 4.7) — that's the right gate when shipping one slice. `/walk-platform` is a different shape: a cross-cutting, on-demand walkthrough of the *whole running app* to catch what per-slice review can't.

The workflow:

1. **Pre-flight** — detect framework(s), dev-server command, available browser MCP.
2. **Boot** — start the dev server in background, poll until ready (90s cap).
3. **Walk** — dispatch the `platform-walker` sub-agent, which discovers every route, drives the browser through them, screenshots each one, detects mock-data leaks via code reads, and validates dynamic routes against bogus ids.
4. **Cleanup** — kill the dev server, close browser sessions.
5. **Report** — surface the ranked top-N gaps + paths to the full report and screenshot directory.

Use this when:
- Preparing for UAT
- Preparing for a demo
- A batch of slices just shipped and you want to verify nothing else broke
- Master checklist and runtime reality might have drifted

Not the right tool for per-slice spec compliance — that's `visual-reviewer` inside `/deliver-stage`.

$ARGUMENTS
