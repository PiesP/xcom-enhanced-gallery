/**
 * @fileoverview ToolbarShell Component Barrel Export
 * @description Complete export of semantic toolbar shell wrapper with types
 *
 * @architecture
 * ## Component Purpose
 * ToolbarShell is a **semantic wrapper component** that provides common toolbar layout,
 * styling, and semantic properties. It abstracts away styling concerns and provides
 * a clean API for wrapping toolbar content.
 *
 * ## Component Role
 * The ToolbarShell serves as a container for:
 * - Main application toolbars (Toolbar component)
 * - Floating action menus
 * - Expandable toolbars
 * - Custom toolbar-like UI patterns
 *
 * ## Semantic Design
 * Rather than exposing CSS directly, ToolbarShell uses **semantic props** that
 * map to meaningful visual concepts:
 * - **elevation**: Visual hierarchy in layered UIs
 * - **surfaceVariant**: Background treatment (modern glass, accessible solid, etc.)
 * - **position**: Layout strategy (modal, sticky, inline)
 *
 * ## Usage Patterns
 *
 * ### Basic Wrapper
 * ```typescript
 * import { ToolbarShell, Toolbar } from '@shared/components/ui';
 *
 * // Wrap main toolbar with semantic props
 * <ToolbarShell>
 *   <Toolbar currentIndex={0} totalCount={5} onClose={() => {}} />
 * </ToolbarShell>
 * ```
 *
 * ### Custom Elevation & Surface
 * ```typescript
 * <ToolbarShell
 *   elevation="high"
 *   surfaceVariant="glass"
 *   aria-label="Gallery toolbar"
 * >
 *   <Toolbar {...props} />
 * </ToolbarShell>
 * ```
 *
 * ### Sticky Header
 * ```typescript
 * <ToolbarShell
 *   position="sticky"
 *   surfaceVariant="solid"
 *   className="gallery-header"
 * >
 *   <div class="header-content">...</div>
 * </ToolbarShell>
 * ```
 *
 * ### Floating Modal
 * ```typescript
 * <ToolbarShell
 *   position="fixed"
 *   elevation="high"
 *   surfaceVariant="glass"
 * >
 *   <QuickActionsMenu />
 * </ToolbarShell>
 * ```
 *
 * ## Props Interface
 * See {@link ToolbarShellProps} for complete documentation:
 * - **children**: Content to wrap (required)
 * - **elevation**: 'low' | 'medium' | 'high' (default: 'medium')
 * - **surfaceVariant**: 'glass' | 'solid' | 'overlay' (default: 'glass')
 * - **position**: 'fixed' | 'sticky' | 'relative' (default: 'fixed')
 * - **className**: Additional CSS classes
 * - **data-testid**: Testing ID
 * - **aria-label**: Accessibility label (default: 'Toolbar')
 *
 * ## Semantic Variants Explained
 *
 * ### Elevation Levels
 * Controls visual hierarchy via z-index stacking:
 * - **low**: Base layer (z-index: --xeg-layer-toolbar)
 *   - Use for standard toolbars in normal document flow
 *   - Lowest z-index for layering
 * - **medium**: Default level (z-index + 1)
 *   - Use for primary application toolbars
 *   - Recommended for most use cases
 * - **high**: Modal/overlay level (z-index + 2)
 *   - Use for floating actions, modals, overlays
 *   - Above all regular content
 *
 * ### Surface Variants
 * Defines background treatment and visual effect:
 * - **glass**: Glassmorphism with backdrop-filter
 *   - Modern appearance with blurred background
 *   - Requires browser support (Safari 9+, Firefox 103+)
 *   - Best for: Modern UI, overlays, floating toolbars
 * - **solid**: Flat solid background
 *   - Better accessibility (high contrast)
 *   - Lower GPU pressure (no backdrop-filter)
 *   - Best for: Accessible designs, performance-critical
 * - **overlay**: Semi-transparent overlay
 *   - Bridges glass and solid
 *   - Slightly transparent with solid surface
 *   - Best for: Custom backgrounds, blended appearance
 *
 * ### Positioning Strategies
 * Determines how component interacts with document flow:
 * - **fixed**: Modal positioning (centered 50%/50%)
 *   - Detached from document flow
 *   - Stays visible during scroll
 *   - Best for: Modal dialogs, floating actions, attention-grabbing
 * - **sticky**: Header/footer positioning
 *   - Adheres to top at 1rem offset
 *   - Scrolls with page, then sticks
 *   - Best for: Persistent headers, navigation
 * - **relative**: Inline positioning
 *   - Participates in document flow
 *   - No special positioning applied
 *   - Best for: Regular toolbar in layout
 *
 * ### Mobile Responsive Behavior
 * At 768px (48rem) breakpoint:
 * - Border radius reduced (lg → md)
 * - Fixed positioning adjusted (bottom instead of center)
 * - Better mobile UX with bottom-anchored toolbars
 *
 * ## Accessibility Features
 * - **role='toolbar'**: Semantic HTML for screen readers
 * - **aria-label**: Customizable accessibility label
 * - **focus-within outline**: Visible keyboard navigation indicator
 * - **High contrast support**: Color scheme respects user preferences
 * - **Reduced motion**: Respects prefers-reduced-motion via design tokens
 *
 * ## Styling System
 * - **CSS Modules**: Scoped styles prevent global pollution
 * - **Design Tokens**: oklch() colors, shadow levels, layer indices
 * - **Responsive Design**: Mobile-first with 768px breakpoint
 * - **Dark Mode**: Automatic via semantic layer tokens
 * - **Transitions**: Smooth color/shadow changes using token durations
 *
 * ## Performance Considerations
 * - **Lightweight**: No internal state, pure presentation
 * - **No Reactivity**: Static wrapper (no Solid.js signals)
 * - **GPU Acceleration**: Transform used for fixed positioning
 * - **Semantic Tokens**: Theme changes without CSS recompilation
 * - **CSS Modules**: No style conflicts with other components
 *
 * ## Design System Integration
 * Uses these design tokens from semantic layer:
 * - **Colors**: --xeg-bg-toolbar, --xeg-toolbar-panel-border
 * - **Shadows**: --xeg-shadow-md (elevation effect)
 * - **Layers**: --xeg-layer-toolbar (z-index base)
 * - **Sizing**: --xeg-radius-lg, --xeg-radius-md
 * - **Motion**: --xeg-duration-fast, --xeg-ease-standard
 * - **Focus**: --xeg-focus-ring, --xeg-focus-ring-offset
 *
 * ## Component Variants Summary
 *
 * | Variant | Use Case | Elevation | Surface | Position |
 * |---------|----------|-----------|---------|----------|
 * | Main Toolbar | Primary UI | medium | glass | fixed |
 * | Sticky Header | Navigation | low | solid | sticky |
 * | Modal Dialog | Focus-grabbing | high | glass | fixed |
 * | Quick Actions | Floating menu | high | solid | fixed |
 * | Inline Controls | Document flow | low | solid | relative |
 *
 * ## Testing
 * - **Unit Tests**: Prop combinations (3 elevation × 3 surface × 3 position)
 * - **A11y Tests**: Focus outline, role attribute, aria-label
 * - **E2E Tests**: Positioning, visibility in different viewports
 * - **Browser Tests**: Backdrop-filter support, CSS grid integration
 *
 * ## Known Limitations & TODOs
 * - **Custom Positioning**: Currently uses preset positions only (Phase X: CSS-in-JS positioning)
 * - **Animation Customization**: Uses token-based durations (Phase X: Custom easing functions)
 * - **Responsive Breakpoints**: Single breakpoint at 768px (Phase X: Multi-breakpoint system)
 * - **Theme Extension**: Custom themes require Design token modification (Phase X: CSS variable injection)
 *
 * @dependencies
 * - Solid.js: ComponentChildren, JSXElement types
 * - CSS: ToolbarShell.module.css (semantic styling)
 * - Design Tokens: All --xeg-* color, shadow, layer, and timing tokens
 *
 * @changelog
 * - **Phase 396**: Complete English documentation (100%)
 * - **Phase 254**: Semantic layer token integration for transitions
 * - **Phase 54.1**: Dark mode colors delegated to semantic layer
 *
 * @internal
 * This is an internal UI component. For public use, import from '@shared/components/ui'.
 */

export { ToolbarShell, ToolbarShell as default } from './ToolbarShell';
export type { ToolbarShellProps } from './ToolbarShell';
