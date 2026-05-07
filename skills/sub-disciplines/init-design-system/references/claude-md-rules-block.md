---
title: Design System Rules Block Template
purpose: Verbatim rules block that init-design-system appends to the project rules file (CLAUDE.md or AGENTS.md). The design-system-stage-writer pulls from this template, fills in the token catalog path and project-specific code patterns, then appends it.
---

# Design System Rules Block Template

The `init-design-system` skill appends the block below to the project rules file (the file may be named `CLAUDE.md`, `AGENTS.md`, or an equivalent — the skill detects which is present). This file is the authoritative source for that block's content and structure.

## How the design-system-stage-writer uses this template

1. The skill reads this file after all token artifacts have been written.
2. It fills in the `Token catalog` path (always `docs/design-system.md`) and populates the "Project-specific code patterns" subsection with only the code-pattern answers the user provided in Step 4.
3. If a code-pattern question was skipped or answered with "None yet" / "No data tables" / "No data-dense UI", that pattern is **omitted entirely** — do not add placeholder text.
4. The completed block is appended to the project rules file. Existing content is never overwritten.
5. A horizontal rule (`---`) is inserted before the block if the rules file already has content, to create a clear visual separator.

---

## Rules Block (append verbatim, then fill placeholders)

```markdown
## Design System Rules (enforced by CI)

Token catalog: `docs/design-system.md`. Every styling decision references tokens.

### Allowed
- Tailwind semantic utilities mapped to tokens
- shadcn/ui primitives (use tokens internally)
- Arbitrary values ONLY when referencing a token: `w-[var(--container-md)]`

### Forbidden
- Raw color utilities (`bg-red-500`, `text-blue-600`, etc.)
- Hex/RGB/HSL/OKLCH literals in className or style
- Inline `style={{}}` with hardcoded values
- New CSS files outside globals.css
- Hardcoded font-family values; use `font-sans/serif/mono/display`

### When you need a new token
1. Add to `docs/design-system.md` and `globals.css`
2. Reference via Tailwind config; never inline
3. Update this catalog

### Project-specific code patterns
> Captured during the design system gate. These are project preferences, not universal rules.
> Examples (only present if applicable to the project): variant system library to use, status indicator visual pattern, numeric column treatment, icon library, etc.
```

---

## Placeholder Reference

When the skill fills in this template, it replaces the "Project-specific code patterns" section body with the user's actual answers. The result looks like the example below — only the answered questions appear, formatted as a definition list:

```markdown
### Project-specific code patterns
> Captured during the design system gate. These are project preferences, not universal rules.

- **Variant library:** CVA (class-variance-authority)
- **Status indicators:** Soft pill badges
- **Icon library:** Lucide
```

If no code-pattern questions were answered, the subsection heading and its blockquote description are kept, but no bullet list is added — this signals to future agents that the patterns are intentionally deferred, not forgotten.

---

## Formatting Rules for the Appended Block

1. **Checkbox syntax:** use `[ ]` only — never `- [ ]`.
2. **No platform-specific bare references:** write "project rules file" rather than "cursor rules" or "claude rules."
3. **No model version pinning** in any content derived from this template.
4. **No hardcoded values** in the token catalog path — always `docs/design-system.md`.
5. **Append only:** the skill must never overwrite or truncate the existing rules file.
