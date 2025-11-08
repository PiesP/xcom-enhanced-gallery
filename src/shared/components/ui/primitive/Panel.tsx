/**
 * @fileoverview Primitive Panel Component
 * @version 1.1.0 - Phase 390: Full English documentation, comprehensive JSDoc
 * @description Semantic surface/container element with design token integration
 * @module shared/components/ui/primitive/Panel
 *
 * **Panel Primitive Architecture**:
 * Low-level surface component for grouping related content with:
 * - Semantic variants (default, elevated, glass)
 * - Optional padding via design tokens
 * - CSS Module-based styling (no inline styles)
 * - Composition support for layouts and containers
 *
 * **Part of Primitive Component System**:
 * - Phase 390: Foundational UI building blocks
 * - Design System: CSS token-based styling
 * - Layout: Flexbox support for content arrangement
 * - Reusability: Used by modals, dialogs, cards, sidebars
 *
 * **Core Features**:
 * 1. **Variants**: default (standard), elevated (raised), glass (frosted)
 * 2. **Padding**: Optional padding controlled by design tokens
 * 3. **Composition**: Flexible children, className merging
 * 4. **Semantics**: Uses div with configurable styling
 * 5. **Design Tokens**: Full CSS variable integration
 *
 * **Design System Integration**:
 * - Colors: --panel-bg, --color-bg-elevated, --glass-bg (variants)
 * - Borders: --panel-border, --border-width-thin
 * - Shadows: --panel-shadow, --shadow-md, --glass-shadow
 * - Radius: --panel-radius for border-radius consistency
 * - Spacing: --panel-padding for padding (when enabled)
 * - Effects: --glass-backdrop-filter for frosted glass variant
 *
 * **Usage Patterns**:
 * ```tsx
 * // Basic panel (default variant with padding)
 * import { Panel } from '@shared/components/ui/primitive';
 *
 * <Panel>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Panel>
 *
 * // Elevated surface (for emphasis)
 * <Panel variant='elevated'>
 *   <strong>Important information</strong>
 * </Panel>
 *
 * // Glass effect (overlay/modal background)
 * <Panel variant='glass' padding={false}>
 *   <ModalContent />
 * </Panel>
 *
 * // Custom styling with className
 * <Panel
 *   className='custom-panel'
 *   variant='default'
 *   padding={true}
 * >
 *   <div>Custom panel content</div>
 * </Panel>
 * ```
 *
 * **Variant Details**:
 * - **default**: Standard appearance with panel border and shadow
 *   - Background: --panel-bg (usually light/surface color)
 *   - Border: --panel-border (subtle outline)
 *   - Shadow: --panel-shadow (small depth)
 *   - Use: Cards, content boxes, general containers
 *
 * - **elevated**: Raised surface for emphasis
 *   - Background: --color-bg-elevated (higher visual weight)
 *   - Border: Adjusted elevation border
 *   - Shadow: --shadow-md (more prominent depth)
 *   - Use: Important sections, emphasis boxes, highlights
 *
 * - **glass**: Frosted glass effect for overlays
 *   - Background: --glass-bg (semi-transparent)
 *   - Blur: --glass-backdrop-filter (frosted effect)
 *   - Border: --glass-border (subtle separation)
 *   - Shadow: --glass-shadow (minimal, for definition)
 *   - Use: Modal backdrops, overlay panels, translucent surfaces
 *
 * **Padding System**:
 * - padding=true (default): Applies --panel-padding to all sides
 * - padding=false: No padding, content edges flush with border
 * - Useful for: Padding-less images/videos, custom layouts
 *
 * **Layout Patterns**:
 * - Card: Panel with padding (default) for simple content
 * - Stack: Multiple panels with gaps for vertical layouts
 * - Grid: Panels in CSS Grid for responsive layouts
 * - Overlay: Panel with variant='glass' for modal backdrops
 *
 * **Performance**:
 * - Memo: className memoized on variant/padding changes
 * - CSS: All styling via CSS Modules (no inline styles)
 * - Memory: No subscriptions or event listeners (static component)
 * - DOM: Single div element (minimal overhead)
 *
 * **Accessibility**:
 * - Semantic: Uses div (container), no implicit roles
 * - Nesting: Safe for containing interactive elements
 * - Structure: Works with screen readers (passive container)
 * - ARIA: Can accept aria-label for labeled containers
 *
 * @see {@link ./Panel.css} - Component styling
 * @see {@link ../../../styles/} - Design token system
 */

import type { JSX } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import './Panel.css';

const { createMemo, splitProps } = getSolid();

/**
 * Primitive Panel Props
 *
 * **Configuration**:
 * - Content: children (rendered as panel content)
 * - Styling: class/className (merged with computed classes)
 * - Semantics: variant (visual appearance), padding (spacing)
 * - HTML: Any div attributes supported via spread
 *
 * @description Props for semantic panel/surface element
 *
 * **Extends HTML Div**:
 * All native div attributes supported except children and class
 * (which have custom handling for composition)
 *
 * @example
 * ```tsx
 * const props: PanelProps = {
 *   children: <CardContent />,
 *   variant: 'elevated',
 *   padding: true,
 *   className: 'custom-card',
 *   'aria-label': 'Content Card',
 * };
 * ```
 */
export interface PanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class'> {
  /**
   * Panel content
   * @description Rendered as children (any JSX content)
   * @default undefined
   */
  readonly children?: JSX.Element;

  /**
   * CSS class name
   * @description Composable with computed variant/padding classes
   * Supports Solid.js className convention
   * @default undefined
   */
  readonly className?: string;

  /**
   * Solid.js class attribute
   * @description Alternative to className (Solid.js standard)
   * @default undefined
   */
  readonly class?: string;

  /**
   * Panel visual variant
   * @description Controls appearance and surface styling
   * - 'default': Standard appearance (surface, subtle shadow)
   * - 'elevated': Raised surface (emphasis, more shadow)
   * - 'glass': Frosted glass effect (overlay, translucent)
   * @default 'default'
   * @example variant='elevated' for important sections
   */
  readonly variant?: 'default' | 'elevated' | 'glass';

  /**
   * Enable padding
   * @description Controls whether content has padding from edges
   * - true: Applies --panel-padding to all sides (default)
   * - false: No padding, content edges flush with border
   * Useful for images/videos that need full width
   * @default true
   * @example padding={false} for borderless images
   */
  readonly padding?: boolean;
}

/**
 * Primitive Panel Component
 *
 * Renders a semantic HTML div element styled as a surface/container with
 * design token integration. Supports multiple visual variants for different
 * use cases (standard, elevated, frosted glass).
 *
 * **Rendering Strategy**:
 * 1. Compute effective class names (variant, padding state)
 * 2. Merge with custom class names
 * 3. Spread remaining attributes onto div
 * 4. Render div with computed props and children
 *
 * **Class Composition**:
 * - Base: 'xeg-panel' (core styling)
 * - Variant: 'xeg-panel--{variant}' (appearance control)
 * - Padding: 'xeg-panel--padded' (if padding=true)
 * - Custom: class + className (user-provided classes)
 *
 * **Styling Flow**:
 * - CSS Modules: All styles defined in Panel.css
 * - Design Tokens: Colors, shadows, borders from root
 * - Responsive: Media queries in CSS (not in component)
 * - Dark Mode: Handled by semantic tokens (Phase 54.1)
 *
 * **Use Cases**:
 * - Card: Panel default with padding (most common)
 * - Dialog: Panel glass for modal backdrop
 * - Sidebar: Panel elevated for distinct section
 * - Group: Multiple panels for grouped content
 * - Custom: Panel with className for specialized styling
 *
 * **Composition**:
 * - Container: Nest any content (text, images, components)
 * - Nesting: Safe for nested panels (inner > outer shadows)
 * - Layout: Works with CSS Grid, Flexbox, standard flow
 * - Interactive: Can contain buttons, forms, links
 *
 * **Performance**:
 * - Memo: className computed once, updated on prop changes
 * - CSS: No inline styles (CSS Modules only)
 * - Memory: Single div element, no subscriptions
 * - Rendering: Solid.js reactive, minimal re-renders
 *
 * @param props - PanelProps configuration
 * @returns JSXElement (div element)
 *
 * @example
 * ```tsx
 * // Basic card panel
 * import { Panel } from '@shared/components/ui/primitive';
 *
 * export function ContentCard() {
 *   return (
 *     <Panel>
 *       <h2>Card Title</h2>
 *       <p>Card description and content</p>
 *     </Panel>
 *   );
 * }
 *
 * // Elevated panel for emphasis
 * <Panel variant='elevated'>
 *   <strong>Highlighted content</strong>
 * </Panel>
 *
 * // Glass panel for overlay
 * <Panel variant='glass' padding={false}>
 *   <img src='backdrop.jpg' />
 * </Panel>
 *
 * // Custom styled panel
 * <Panel
 *   variant='default'
 *   className='custom-card-highlight'
 *   aria-label='Featured content'
 * >
 *   <FeaturedContent />
 * </Panel>
 * ```
 */
export function Panel(props: PanelProps): JSX.Element {
  const [local, others] = splitProps(props, [
    'children',
    'className',
    'class',
    'variant',
    'padding',
  ]);

  /**
   * Compute effective CSS class names
   * Includes: base class, variant, padding state, custom classes
   */
  const resolvedClass = createMemo(() => {
    const variantClass = `xeg-panel--${local.variant ?? 'default'}`;
    const paddingClass = (local.padding ?? true) ? 'xeg-panel--padded' : '';
    return ['xeg-panel', variantClass, paddingClass, local.class, local.className]
      .filter(Boolean)
      .join(' ');
  });

  return (
    <div class={resolvedClass()} {...others}>
      {local.children}
    </div>
  );
}
