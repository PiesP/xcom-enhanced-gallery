# Shared Styles

> Design-token CSS and shared style utilities for the X.com Enhanced Gallery userscript
> **Target Audience**: UI developers and AI coding agents

This directory implements a **token-first** architecture optimized for predictable theming and maintainability.

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Token Layers](#token-layers)
3. [Styling Rules](#styling-rules)
4. [How Tokens Are Loaded](#how-tokens-are-loaded)
5. [Adding a Token](#adding-a-token)
6. [Best Practices](#best-practices)

---

## Directory Structure

```
src/shared/styles/
├─ design-tokens.primitive.css   # Layer 1: base tokens (color, spacing, size)
├─ design-tokens.semantic.css    # Layer 2: semantic tokens (role-based)
├─ design-tokens.component.css   # Layer 3: component tokens (UI-specific)
├─ isolated-gallery.css          # Base isolation styles for the gallery root
├─ tokens/                       # Token-related CSS (e.g., animation)
└─ utilities/                    # Shared utility CSS (layout, helpers)
```

---

## Token Layers

1. **Primitive** (`design-tokens.primitive.css`): Raw values (colors, spacing, radii)
2. **Semantic** (`design-tokens.semantic.css`): Role-based mappings (foreground, surface, error)
3. **Component** (`design-tokens.component.css`): Component-level specializations

---

## Styling Rules

### 1. Token-First

Always use design tokens for colors, spacing, and sizing.

**✅ GOOD:**

```css
.button {
  color: var(--xeg-fg);
  background: var(--xeg-bg);
  padding: var(--xeg-space-2);
}
```

**❌ BAD:**

```css
.button {
  color: #fff;
  background: #000;
  padding: 8px;
}
```

**Rationale**: Hardcoded values break theming consistency and make maintenance harder.

### 2. Prefer CSS Modules

**✅ GOOD:**

```
src/shared/components/Button/Button.module.css
src/features/gallery/components/VerticalImageItem.module.css
```

### 3. Do Not Use `!important`

`!important` makes overrides brittle and prevents proper style composition.

**✅ GOOD:** Use proper CSS specificity or CSS Modules
**❌ BAD:**

```css
.button {
  color: #fff !important; /* Avoid */
}
```

### 4. Units and Color Space

- **Sizing and spacing**: Use `rem` or `em` (never hardcoded `px`)
- **Colors**: Use `oklch()` color space (via tokens only)

**✅ GOOD:**

```css
padding: var(--xeg-space-2); /* rem via token */
color: var(--xeg-fg); /* oklch() via token */
```

---

## How Tokens Are Loaded

These CSS files should be imported from [src/styles/globals.ts](../../styles/globals.ts):

```typescript
import "@shared/styles/design-tokens.primitive.css";
import "@shared/styles/design-tokens.semantic.css";
import "@shared/styles/design-tokens.component.css";
```

---

## Adding a Token

Follow this three-step process:

1. **Add a primitive token** to `design-tokens.primitive.css` with a raw value
2. **Map it** (if needed) in `design-tokens.semantic.css` with semantic naming
3. **Optionally expose** component-specific variables in `design-tokens.component.css`

### Example

**Step 1: Primitive token**

```css
:root {
  --color-info: oklch(60% 0.15 200deg);
}
```

**Step 2: Semantic token**

```css
:root {
  --xeg-color-info: var(--color-info);
}
```

**Step 3 (optional): Component-level token**

```css
:root {
  --xeg-info-bg: var(--xeg-color-info);
}
```

---

## Best Practices

### Avoid Reading Computed Styles at Runtime

Prefer composing `var(--xeg-*)` values in CSS. Reading computed styles requires DOM queries and is slower.

**✅ GOOD:**

```css
.button {
  color: var(--xeg-fg);
}
```

**❌ BAD:**

```typescript
const color = window.getComputedStyle(element).color; // Avoid at runtime
```

### Local TypeScript Maps for Autocomplete

If you need TypeScript autocomplete for tokens in a component, create a local map in that component/module:

**Example:**

```typescript
// src/features/gallery/components/MyComponent.tsx
const TOKEN_MAP = {
  fg: "--xeg-fg",
  bg: "--xeg-bg",
  space2: "--xeg-space-2",
} as const;
```

### Feature-Level Styles

Gallery utility classes like `.xeg-glass-surface` are defined in feature-level CSS. See [src/features/gallery/styles/gallery-global.css](../../features/gallery/styles/gallery-global.css).

---

## Related Files

- [design-tokens.primitive.css](./design-tokens.primitive.css) – Base token values
- [design-tokens.semantic.css](./design-tokens.semantic.css) – Role-based token mappings
- [design-tokens.component.css](./design-tokens.component.css) – Component-specific tokens
- [src/styles/globals.ts](../../styles/globals.ts) – Token import entry point
- [src/features/gallery/styles/gallery-global.css](../../features/gallery/styles/gallery-global.css) – Feature-level utilities

---

**Last updated**: 2025-12-16
