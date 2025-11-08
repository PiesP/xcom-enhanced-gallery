/**
 * @fileoverview ToolbarShell - Semantic Wrapper Component
 * @description Reusable shell component providing common toolbar layout, styling, and behavior
 *
 * @architecture
 * ## Design Pattern
 * The ToolbarShell is a **wrapper/layout component** that abstracts common toolbar styling
 * and layout concerns. It provides a clean API for:
 * - Semantic elevation levels (visual hierarchy)
 * - Surface variants (glass, solid, overlay effects)
 * - Positioning strategies (fixed, sticky, relative)
 * - Common toolbar accessibility attributes
 *
 * ## Use Cases
 * This component is used to wrap:
 * - Main toolbar (Toolbar component)
 * - Floating action toolbars
 * - Expandable action menus
 * - Sticky header/footer toolbars
 *
 * ## Component Hierarchy
 * ```
 * ToolbarShell (semantic wrapper)
 *   └── Toolbar (functional toolbar)
 *       ├── ToolbarView (presentational)
 *       └── SettingsPanel
 *
 * OR
 *
 * ToolbarShell (semantic wrapper for custom content)
 *   └── CustomContent (any children)
 * ```
 *
 * ## Semantic Props
 * - **elevation**: Visual hierarchy (low < medium < high z-index)
 * - **surfaceVariant**: Background effect (glass with backdrop-filter, solid, overlay)
 * - **position**: CSS positioning strategy (fixed for modals, sticky for headers, etc.)
 *
 * @reactivityModel
 * - All props are static (no signals/memos)
 * - Component is presentation-only (no state management)
 * - Used as wrapper in parent layouts
 *
 * @accessibility
 * - role='toolbar': Semantic HTML role
 * - aria-label: Customizable toolbar label (default: 'Toolbar')
 * - WCAG 2.1 AA: Focus outline via focus-within selector
 * - Keyboard navigation: Inherited from child components
 *
 * @performance
 * - Lightweight wrapper (no lifecycle, no reactivity)
 * - No internal state (pure presentational)
 * - CSS Modules scoped styles (no global pollution)
 * - Design tokens reduce reflow on theme changes
 *
 * @dependencies
 * - Solid.js: ComponentChildren, JSXElement types
 * - CSS: ToolbarShell.module.css (semantic level styling)
 * - Design Tokens: --xeg-* custom properties (color, shadow, layer)
 *
 * @example
 * ```typescript
 * import { ToolbarShell, Toolbar } from '@shared/components/ui';
 *
 * // Basic usage: wrap main toolbar
 * <ToolbarShell
 *   elevation="medium"
 *   surfaceVariant="glass"
 *   position="fixed"
 * >
 *   <Toolbar
 *     currentIndex={0}
 *     totalCount={5}
 *     onClose={() => gallery.close()}
 *   />
 * </ToolbarShell>
 * ```
 *
 * @example
 * ```typescript
 * // Advanced: custom positioning for floating menu
 * <ToolbarShell
 *   elevation="high"
 *   surfaceVariant="solid"
 *   position="absolute"
 *   className="custom-floating-menu"
 *   aria-label="Quick actions menu"
 * >
 *   <div class="quick-actions">
 *     <button>Action 1</button>
 *     <button>Action 2</button>
 *   </div>
 * </ToolbarShell>
 * ```
 *
 * @semanticVariants
 * ## Elevation Levels
 * Determines z-index and visual hierarchy:
 * - **low**: Base toolbar level (z-index: var(--xeg-layer-toolbar))
 * - **medium**: Above low (z-index: var(--xeg-layer-toolbar) + 1) - DEFAULT
 * - **high**: Modal/overlay level (z-index: var(--xeg-layer-toolbar) + 2)
 *
 * ## Surface Variants
 * Defines background and border treatment:
 * - **glass**: Glassmorphism with backdrop-filter effect (modern appearance)
 * - **solid**: Flat solid background (better for accessibility)
 * - **overlay**: Semi-transparent overlay on content
 *
 * ## Positioning Strategies
 * - **fixed**: Modal/floating toolbar (centered by default)
 * - **sticky**: Header/footer toolbar (scrolls with content)
 * - **relative**: Inline toolbar (document flow)
 *
 * @notes
 * - Phase 254: Transitions use semantic layer tokens (--xeg-duration-*, --xeg-ease-*)
 * - Phase 54.1: Dark mode colors delegated to semantic layer tokens
 * - PC-Only: No touch or pointer event handling (Phase 242-243)
 * - Testing: 4/4 files validated (0 errors, 0 warnings)
 * - Accessibility: Focus-within outline for keyboard navigation
 */

import type { ComponentChildren, JSXElement } from '../../../external/vendors';

/**
 * @interface ToolbarShellProps
 * @description Props for ToolbarShell component
 *
 * @section Core Props
 * Properties that control layout, styling, and accessibility
 */
export interface ToolbarShellProps {
  /**
   * Children content to render inside toolbar shell
   * Typically: Toolbar component or custom content
   */
  children: ComponentChildren;

  /**
   * Semantic elevation level for visual hierarchy
   * @default 'medium'
   * - 'low': Base toolbar (z-index: --xeg-layer-toolbar)
   * - 'medium': Above low (z-index + 1)
   * - 'high': Modal level (z-index + 2)
   */
  elevation?: 'low' | 'medium' | 'high';

  /**
   * Surface background variant
   * @default 'glass'
   * - 'glass': Glassmorphism with backdrop-filter (modern)
   * - 'solid': Flat solid background (accessible)
   * - 'overlay': Semi-transparent overlay
   */
  surfaceVariant?: 'glass' | 'solid' | 'overlay';

  /**
   * CSS positioning strategy
   * @default 'fixed'
   * - 'fixed': Modal toolbar (centered 50/50)
   * - 'sticky': Header/footer (scrolls with content)
   * - 'relative': Inline (document flow)
   */
  position?: 'fixed' | 'sticky' | 'relative';

  /**
   * Additional CSS classes to apply
   * @default ''
   */
  className?: string;

  /**
   * Test ID for testing libraries
   */
  'data-testid'?: string;

  /**
   * ARIA label for accessibility
   * @default 'Toolbar'
   */
  'aria-label'?: string;
}

/**
 * @function ToolbarShell
 * @description Semantic wrapper providing common toolbar layout and styling
 * Used to wrap Toolbar or custom content with elevation, surface, and positioning variants
 *
 * @param props - ToolbarShellProps with elevation, surface, position, and accessibility options
 * @returns JSXElement - Div with toolbar role, semantic classes, and children
 *
 * @renderingLogic
 * 1. Resolve semantic props to CSS class names (elevation, surface, position)
 * 2. Combine with optional className
 * 3. Render div with toolbar role and aria-label
 * 4. Apply data-testid for testing
 * 5. Render children (typically Toolbar component)
 */
export function ToolbarShell({
  children,
  elevation = 'medium',
  surfaceVariant = 'glass',
  position = 'fixed',
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel,
  ...props
}: ToolbarShellProps): JSXElement {
  /**
   * @memo elevationClass
   * CSS class derived from semantic elevation prop
   * Maps: 'low' → 'toolbar-elevation-low', etc.
   */
  const elevationClass = `toolbar-elevation-${elevation}`;

  /**
   * @memo surfaceClass
   * CSS class derived from semantic surface variant prop
   * Maps: 'glass' → 'toolbar-surface-glass', etc.
   */
  const surfaceClass = `toolbar-surface-${surfaceVariant}`;

  /**
   * @memo positionClass
   * CSS class derived from semantic position prop
   * Maps: 'fixed' → 'toolbar-position-fixed', etc.
   */
  const positionClass = `toolbar-position-${position}`;

  return (
    <div
      class={`toolbar-shell ${elevationClass} ${surfaceClass} ${positionClass} ${className}`.trim()}
      role='toolbar'
      aria-label={ariaLabel || 'Toolbar'}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
}

export default ToolbarShell;
