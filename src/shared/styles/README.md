# Shared Styles

This directory contains the design-token CSS and shared style utilities used by the project.
It is intentionally **token-first** and optimized for predictable theming.

## Structure

```text
src/shared/styles/
├─ design-tokens.primitive.css   # Layer 1: base tokens (color, spacing, size)
├─ design-tokens.semantic.css    # Layer 2: semantic tokens (role-based)
├─ design-tokens.component.css   # Layer 3: component tokens (UI-specific)
├─ isolated-gallery.css          # Base isolation styles for the gallery root
├─ tokens/                       # Token-related CSS (e.g., animation)
└─ utilities/                    # Shared utility CSS (layout, helpers)
```

## Rules

### Token-first

Use tokens for colors, spacing, and sizing.

```css
.button {
  color: var(--xeg-fg);
  background: var(--xeg-bg);
  padding: var(--xeg-space-2);
}
```

Avoid hardcoded values:

```css
/* ❌ Avoid */
.button {
  color: #fff;
  background: #000;
  padding: 8px;
}
```

### Prefer CSS Modules

Component styles should usually be scoped with CSS Modules (`*.module.css`).

### Do not use `!important`

`!important` makes overrides brittle and should not be used.

### Units and color space

- Use `rem`/`em` for sizing and spacing
- Use `oklch()` for colors (via tokens)

## Token layers

1. **Primitive** (`design-tokens.primitive.css`): raw values (colors, spacing, radii)
2. **Semantic** (`design-tokens.semantic.css`): role-based mappings (foreground, surface, error)
3. **Component** (`design-tokens.component.css`): component-level specializations

## How tokens are loaded

These CSS files should be imported from `src/styles/globals.ts`.

```ts
import "@shared/styles/design-tokens.primitive.css";
import "@shared/styles/design-tokens.semantic.css";
import "@shared/styles/design-tokens.component.css";
```

## Adding a token

1. Add a primitive token to `design-tokens.primitive.css`.
2. Map it (if needed) in `design-tokens.semantic.css`.
3. Optionally expose component-specific variables in `design-tokens.component.css`.

Example:

```css
/* 1) Primitive */
:root {
  --color-info: oklch(60% 0.15 200deg);
}

/* 2) Semantic */
:root {
  --xeg-color-info: var(--color-info);
}
```

## Notes

- Avoid reading computed styles at runtime. Prefer composing `var(--xeg-*)` values in CSS.
- If you really need autocomplete in TypeScript, create a local map in the component/module where it is used.
- Gallery utility classes like `.xeg-glass-surface` are defined in feature styles (see `src/features/gallery/styles/gallery-global.css`).

---

Last updated: 2025-12-16
