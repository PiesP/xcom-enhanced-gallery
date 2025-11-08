/**
 * @fileoverview Primitive UI Components Barrel Export
 * @version 1.1.0 - Phase 390: Enhanced documentation, component catalog
 * @description Public API for low-level UI primitive components
 * @module shared/components/ui/primitive
 *
 * **Primitive Component System** (Phase 390):
 * Foundational UI building blocks extending native HTML elements with:
 * - Design token integration (colors, spacing, typography)
 * - Semantic props (variant, size, intent, selected, loading)
 * - Accessibility features (ARIA attributes, keyboard support)
 * - Reusability (composed by higher-level components)
 *
 * **Architecture**:
 * - Layer 1: HTML elements (button, div)
 * - Layer 2: Primitives (Button, Panel) - this module
 * - Layer 3: Components (Button.tsx, ModalShell) - higher-level
 * - Layer 4: Features (Gallery, Settings, Toolbar) - business logic
 *
 * **Primitive Components** (2 components):
 * 1. **Button**: Semantic button element
 *    - Variants: primary (default), secondary, outline
 *    - Sizes: sm, md (default), lg
 *    - Intent: primary, success, danger, neutral
 *    - States: disabled, loading, selected
 *
 * 2. **Panel**: Semantic surface/container element
 *    - Variants: default, elevated, glass
 *    - Padding: optional via design tokens
 *    - Composition: flexible children, className merging
 *
 * **Design System Integration**:
 * - Colors: --xeg-color-*, --button-*, --panel-* tokens
 * - Spacing: --space-xs, --space-sm, --space-md, --space-lg
 * - Typography: --font-size-*, font-weight tokens
 * - Shadows: --panel-shadow, --shadow-md, --glass-shadow
 * - Radius: --xeg-radius-md, --xeg-radius-sm
 * - Transitions: --button-transition, --xeg-duration-*
 * - Opacity: --xeg-opacity-disabled
 *
 * **Usage Patterns**:
 * ```typescript
 * // Static import
 * import { Button, Panel } from '@shared/components/ui/primitive';
 * import type { ButtonProps, PanelProps } from '@shared/components/ui/primitive';
 *
 * // Component usage
 * <Button onClick={handleClick}>Save</Button>
 * <Panel variant='elevated'>
 *   <h2>Title</h2>
 *   <p>Content</p>
 * </Panel>
 * ```
 *
 * **Accessibility** (WCAG 2.1 AA):
 * - Semantic HTML: Native button, div elements
 * - ARIA: aria-pressed (selected), aria-busy (loading), role='button'
 * - Keyboard: Enter/Space for button activation
 * - Focus: Visible focus ring with --xeg-focus-ring
 * - Contrast: Design tokens ensure 4.5:1 minimum
 * - Screen readers: Native browser support
 *
 * **Performance**:
 * - GPU accelerated: transform, opacity animations only
 * - CSS Modules: Scoped styling, no naming conflicts
 * - Solid.js: Memo, splitProps for efficient rendering
 * - Memory: No subscriptions, minimal DOM overhead
 * - Bundle: Tree-shaking friendly (modular design)
 *
 * **Composition Examples**:
 * - IconButton: Button + Icon (from icon system)
 * - Card: Panel with padding and content layout
 * - Dialog: ModalShell (uses Panel internally)
 * - Toolbar: Multiple buttons in a Panel container
 *
 * **Integration Points**:
 * - Components/ui/Button (higher-level button wrapper)
 * - Components/ui/ModalShell (uses Panel styling)
 * - Components/ui/Icon (composes with Button)
 * - Features/* (gallery, settings, toolbar)
 *
 * **CSS Modules**:
 * - Button.css: 150+ lines (base, variants, sizes, states)
 * - Panel.css: 100+ lines (variants, padding, effects)
 * - Design token: All colors/shadows from root tokens
 *
 * @see {@link ./Button.tsx} - Button component implementation
 * @see {@link ./Button.css} - Button styling
 * @see {@link ./Panel.tsx} - Panel component implementation
 * @see {@link ./Panel.css} - Panel styling
 * @see {@link ../../../styles/} - Design token system
 */

export { Button, type ButtonProps } from './Button';
export { Panel, type PanelProps } from './Panel';
