---
title: tailwind.config.ts Template
purpose: Structural template for the tailwind.config.ts output artifact. Binds CSS custom properties from globals.css into Tailwind's theme so semantic utilities work correctly.
---

# tailwind.config.ts Template

This template wires the CSS custom properties defined in `globals.css` into Tailwind's theme extension system. The result is that Tailwind semantic utilities like `bg-background`, `text-foreground`, `border-border`, `ring-ring`, `font-sans`, `rounded-sm`, etc. all resolve through the token system.

**Target path:** `tailwind.config.ts` at the project root (or per-app root in a monorepo).

---

## Template

```typescript
import type { Config } from "tailwindcss";
// Import Tailwind plugins at the top using ESM — never CommonJS:
// import tailwindAnimate from "tailwindcss-animate";
// import typography from "@tailwindcss/typography";

const config: Config = {
  // Use 'class' strategy so dark mode is toggled by adding .dark to <html>.
  // Update if the project uses a different dark mode strategy.
  darkMode: "class",

  content: [
    // Adjust globs to match the project structure.
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // Add monorepo package paths here if applicable:
    // "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // -----------------------------------------------------------------------
      // Colors — bind CSS custom properties from globals.css
      // Add only the tokens that exist in :root / .dark in globals.css.
      // -----------------------------------------------------------------------
      colors: {
        // Surface colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // Brand colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Semantic colors
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Include optional semantic colors only if defined in globals.css:
        // success: {
        //   DEFAULT: "hsl(var(--success))",
        //   foreground: "hsl(var(--success-foreground))",
        // },
        // warning: {
        //   DEFAULT: "hsl(var(--warning))",
        //   foreground: "hsl(var(--warning-foreground))",
        // },
        // info: {
        //   DEFAULT: "hsl(var(--info))",
        //   foreground: "hsl(var(--info-foreground))",
        // },
        // Neutrals
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Charts
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Sidebar (include only if sidebar tokens are defined in globals.css)
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: {
            DEFAULT: "hsl(var(--sidebar-primary))",
            foreground: "hsl(var(--sidebar-primary-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--sidebar-accent))",
            foreground: "hsl(var(--sidebar-accent-foreground))",
          },
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      // -----------------------------------------------------------------------
      // Border radius — bind CSS custom properties from globals.css
      // -----------------------------------------------------------------------
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
        full: "var(--radius-full)",
      },

      // -----------------------------------------------------------------------
      // Font families — bind CSS custom properties from globals.css
      // -----------------------------------------------------------------------
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Include optional families only if defined in globals.css:
        // display: ["var(--font-display)", "var(--font-sans)"],
        // logo: ["var(--font-logo)"],
      },

      // -----------------------------------------------------------------------
      // Box shadows — bind CSS custom properties from globals.css
      // -----------------------------------------------------------------------
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },

      // -----------------------------------------------------------------------
      // Motion — transition duration and timing
      // Include this block only if motion tokens are NOT defined as CSS custom
      // properties in globals.css. If they are in globals.css, reference them
      // as arbitrary values instead: `duration-[var(--duration-fast)]`.
      // Document the approach in docs/design-system.md under "Motion Decision."
      // -----------------------------------------------------------------------
      // transitionDuration: {
      //   fast: "150ms",
      //   normal: "250ms",
      //   slow: "450ms",
      // },
      // transitionTimingFunction: {
      //   DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      //   in: "cubic-bezier(0.4, 0, 1, 1)",
      //   out: "cubic-bezier(0, 0, 0.2, 1)",
      //   spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      // },

      // -----------------------------------------------------------------------
      // Type scale (if using size tokens — Option A from token-checklist.md)
      // If using semantic tokens (Option B) or Tailwind's default scale,
      // remove this block and note the decision in docs/design-system.md.
      // -----------------------------------------------------------------------
      // fontSize: {
      //   xs:   ["var(--text-xs)",   { lineHeight: "var(--leading-tight)" }],
      //   sm:   ["var(--text-sm)",   { lineHeight: "var(--leading-normal)" }],
      //   base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
      //   lg:   ["var(--text-lg)",   { lineHeight: "var(--leading-relaxed)" }],
      //   xl:   ["var(--text-xl)",   { lineHeight: "var(--leading-relaxed)" }],
      // },
    },
  },

  plugins: [
    // Add Tailwind plugins used by the project here.
    // Import plugins at the top of the file using ESM syntax:
    //   import tailwindAnimate from "tailwindcss-animate";
    //   import typography from "@tailwindcss/typography";
    // Then reference them here: tailwindAnimate, typography
  ],
};

export default config;
```

---

## Rules for Filling This Template

1. **Color format consistency**: if globals.css uses OKLCH instead of HSL, update the `hsl()` wrappers to `oklch()` throughout. Match whichever format the project's token values use.
2. **Remove commented-out sections**: once you decide whether to include optional sections (sidebar, semantic colors, motion, type scale), remove the comments for choices not taken. Leave clean code.
3. **Monorepo paths**: in a Turborepo monorepo, extend the `content` array to include paths from shared `packages/ui` or similar.
4. **Plugin list**: populate the `plugins` array based on the project's package.json. Do not add plugins not installed in the project.
5. **Arbitrary value compatibility**: the token system is compatible with Tailwind arbitrary values — `w-[var(--container-md)]` is the correct pattern for custom container widths. Document any project-specific container tokens in `docs/design-system.md`.
