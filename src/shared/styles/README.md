# Shared styles

The gallery uses explicit cascade layers, CSS Modules, and `--xeg-*` custom
properties to isolate its UI from X.com.

## Load order

`src/main.ts` imports shared styles in this order:

1. `layers.css` declares the cascade order.
2. `design-tokens.primitive.css` defines raw color, spacing, type, and timing values.
3. `design-tokens.semantic.css` maps primitives to UI roles.
4. `design-tokens.component.css` defines component-specific values and shared classes.
5. `base/reset.css` normalizes the isolated gallery root.
6. `utilities/*.css` provides shared layout and animation helpers.
7. `isolated-gallery.css` establishes the gallery boundary.

Feature and component CSS Modules load after this shared foundation.

## Rules

- Reuse an existing semantic or component token before adding a new primitive.
- Use `--xeg-*` tokens for themed, repeated, or cross-component values.
- Keep one-off geometry close to the component that owns it; pixels are allowed
  when they express a real browser or asset boundary.
- Prefer CSS Modules and `.xeg-*` namespace isolation over specificity escalation.
- Avoid `!important` unless overriding third-party page behavior is unavoidable
  and documented next to the rule.
- Preserve the layer order and the import order in `src/main.ts`.

When adding a token, define the raw value in the primitive layer, map its role
in the semantic layer, and add a component token only when multiple component
rules share that specialization.
