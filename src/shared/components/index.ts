/**
 * @fileoverview Shared Components Central Barrel Export
 * @description Central access point for all shared UI and layout components
 * @version 4.1.0 - Phase 399: Complete English documentation, component ecosystem
 * @module shared/components
 *
 * **Component Ecosystem Architecture** (Phase 45+):
 * Central barrel export for all shared component library components.
 * Organized into logical groups: UI primitives, containers, content, utilities.
 *
 * **Export Organization**:
 *
 * ### UI Components (Phase 390+)
 * Low-level, reusable UI components with semantic styling
 * - **Button**: Semantic button with variants (primary, secondary, danger)
 * - **Icon/LazyIcon**: SVG icon system with registry and lazy loading
 * - **ErrorBoundary**: Error handling wrapper component
 * - **Toolbar**: Gallery media control toolbar
 *
 * ### Container Components (Phase 389+)
 * Layout and isolation components
 * - **GalleryContainer**: Isolated gallery app container with props bridge
 *
 * **Type Exports** (Phase 45+):
 * All component-specific types exported alongside components
 * - ButtonProps, ToolbarProps
 * - IconProps, LazyIconProps
 * - GalleryContainerProps
 *
 * ## Component Hierarchy
 *
 * **Hierarchy Structure**:
 * ```
 * Shared Components (this barrel)
 *   ├─ UI Module (@/shared/components/ui)
 *   │  ├─ Primitives: Button, Icon, Panel
 *   │  ├─ Content: Toolbar
 *   │  ├─ Containers: ModalShell
 *   │  └─ Controls: ErrorBoundary
 *   └─ Layout Module (@/shared/components/isolation)
 *      └─ Containers: GalleryContainer (HOC pattern)
 * ```
 *
 * **Dependency Flow**:
 * - Primitives (no dependencies)
 * - Content (depends on Primitives)
 * - Containers (depends on Content)
 * - Layout (depends on UI + Shared services)
 *
 * ## Import Patterns
 *
 * **Recommended** (Named exports):
 * ```typescript
 * import { Button, Icon } from '@shared/components';
 * ```
 *
 * **With Types**:
 * ```typescript
 * import { Button } from '@shared/components';
 * import type { ButtonProps } from '@shared/components';
 * ```
 *
 * **Sub-module Access** (when needed):
 * ```typescript
 * import { DEFAULT_SIZES, DEFAULT_VARIANTS } from '@shared/components/ui';
 * ```
 *
 * **Avoid** (Direct imports):
 * ❌ `import Button from '@shared/components/ui/Button/Button'`
 * ✅ `import { Button } from '@shared/components'` (use barrel)
 *
 * ## Design System Integration
 *
 * **All components**:
 * - Use design tokens: `--xeg-*` CSS variables
 * - Semantic sizing: sm | md | lg | xl
 * - Semantic variants: primary | secondary | danger | success | warning | info
 * - Accessible by default: WCAG 2.1 AA
 * - Keyboard navigable: Tab, Enter, Escape, Arrow keys
 * - Screen reader compatible: Semantic HTML + ARIA
 *
 * **Size System**:
 * - sm: 16px-24px (compact, icon buttons)
 * - md: 24px-32px (default, standard)
 * - lg: 32px-48px (prominent)
 * - xl: 48px-64px (call-to-action)
 *
 * **Color Variants**:
 * - primary: Brand (blue) - main actions
 * - secondary: Supporting (light blue) - secondary actions
 * - outline: Border only - minimal
 * - danger: Destructive (red) - delete, warning
 * - success: Affirmative (green) - confirm
 * - warning: Caution (amber)
 *
 * ## Component Details
 *
 * ### UI Components
 *
 * **Button** (semantic button):
 * - Variants: primary, secondary, outline, danger, success, warning
 * - Sizes: sm, md, lg, xl
 * - States: normal, hover, active, disabled, loading
 * - Accessibility: aria-label, focus ring, keyboard activation
 * - Usage: CTAs, navigation, form controls
 *
 * **NotificationService** (Tampermonkey bridge):
 * - Handles success/error/info/warning alerts via GM_notification
 * - Native OS notifications with optional timeout and click action
 * - Use: Status updates, confirmations, errors
 *
 * **Icon** (SVG registry):
 * - Registry-based lookup
 * - Dynamic rendering
 * - Scalable via size prop
 * - Color via CSS
 *
 * **LazyIcon** (code-split icon):
 * - Suspense-enabled
 * - Dynamic import on first use
 * - Performance: ~3KB saved in main bundle
 * - Preload utilities: useIconPreload, useCommonIconPreload
 *
 * **ErrorBoundary** (error wrapper):
 * - Catch render errors
 * - Display fallback UI
 * - Log for debugging
 * - Prevent app crash
 *
 * **Toolbar** (media controls):
 * - Navigation: previous/next media
 * - Display: current/total count, fit mode
 * - Download: single, bulk, zip
 * - Settings: access panel
 * - Auto-hide: on inactivity
 * - Keyboard: Arrow keys, M key
 *
 * ### Container Components
 *
 * **GalleryContainer** (app container):
 * - Isolated gallery app wrapper
 * - Props bridge pattern (props → internal state)
 * - Service integration point
 * - Focus management
 * - Keyboard event handling
 * - State synchronization
 *
 * ## Performance Optimization
 *
 * **Code Splitting**:
 * - LazyIcon: Dynamic SVG loading (~3KB saved)
 * - TODOs: Other async components
 *
 * **Tree-Shaking**:
 * - Named exports enable dead code elimination
 * - Unused components removed in build
 * - Test via `npm run build`
 *
 * **Bundle Analysis**:
 * - Main bundle: ~45KB (gzipped)
 * - Build output: `dist/manifest.json`
 * - Review: `npm run build` → inspect output
 *
 * ## Accessibility Compliance
 *
 * **Standards**:
 * - WCAG 2.1 Level AA (all components)
 * - Semantic HTML (button, nav, article)
 * - ARIA labels and descriptions
 * - Focus management and indicators
 * - Keyboard navigation support
 * - Color contrast: 4.5:1+ (WCAG AA)
 * - Motion: Respects prefers-reduced-motion
 *
 * **Testing**:
 * - axe-core WCAG scanning
 * - Keyboard navigation tests
 * - Screen reader testing (NVDA, JAWS)
 * - Color contrast validation
 * - Run: `npm run e2e:a11y`
 *
 * ## Testing Integration
 *
 * **Test Coverage**:
 * - Unit: Component props, behavior, state
 * - Integration: Component interactions, composition
 * - E2E: Full user flows, keyboard nav
 * - Accessibility: WCAG compliance
 * - Visual: Snapshot testing
 *
 * **Test Location**: `test/unit/shared/components/`
 * **Run Tests**: `npm run test:unit:batched`
 *
 * ## Related Documentation
 *
 * - {@link ./ui} - UI component library details
 * - {@link ./ui/Button/Button} - Button component
 * - {@link ./ui/Toolbar/Toolbar.tsx} - Toolbar component
 * - {@link ./ui/Icon} - Icon system
 * - {@link ./isolation/GalleryContainer} - Container component
 * - {@link ../types/app.types} - Base type definitions
 * - {@link ../types/component.types} - Component types
 * - {@link ../../../../docs/ARCHITECTURE.md} - System architecture
 * - {@link ../../../../docs/CODING_GUIDELINES.md} - Code standards
 *
 * @see {@link ./ui} - UI module
 * @see {@link ./isolation} - Isolation module
 * @see {@link ../types/app.types} - Base types
 */

// =============================================================================
// UI Components (Phase 390+)
// =============================================================================

/**
 * Button Component - Semantic button with variants and sizes
 * @component Button
 * @see {@link ./ui/Button/Button}
 *
 * **Features**:
 * - Variants: primary, secondary, outline, danger, success, warning, ghost
 * - Sizes: sm, md, lg, xl
 * - States: normal, hover, active, disabled, loading
 * - Accessibility: aria-label, focus ring, keyboard support
 *
 * @example
 * ```tsx
 * import { Button } from '@shared/components';
 *
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 */
export { Button } from "./ui/Button/Button";

/**
 * ErrorBoundary Component - Error handling wrapper
 * @component ErrorBoundary
 * @see {@link ./ui/ErrorBoundary/ErrorBoundary}
 *
 * **Features**:
 * - Catches render errors in children
 * - Displays fallback UI
 * - Logs errors for debugging
 * - Prevents full app crash
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from '@shared/components';
 * // Wraps components to catch errors
 * ```
 */
export { ErrorBoundary } from "./ui/ErrorBoundary/ErrorBoundary";

/**
 * Toolbar Component - Gallery media control toolbar
 * @component Toolbar
 * @see {@link ./ui/Toolbar/Toolbar.tsx}
 *
 * **Features**:
 * - Navigation: Previous/next media
 * - Display: Current/total count, fit mode
 * - Download: Single, bulk, ZIP
 * - Settings: Access panel
 * - Auto-hide: On inactivity
 * - Keyboard: Arrow keys, M key
 *
 * @example
 * ```tsx
 * import { Toolbar } from '@shared/components';
 * // Toolbar manages media navigation and download controls
 * ```
 */
export { Toolbar } from "./ui/Toolbar/Toolbar.tsx";

// =============================================================================
// Icon Components (Phase 224+, Phase 388+)
// =============================================================================

/**
 * Icon Component - SVG registry-based icon rendering
 * @component Icon
 * @see {@link ./ui/Icon}
 *
 * **Features**:
 * - Registry-based lookup
 * - Dynamic SVG rendering
 * - Scalable via size prop
 * - Color via CSS
 * - Performance optimized
 *
 * @example
 * ```tsx
 * import { Icon } from '@shared/components';
 *
 * <Icon name="download" size="md" />
 * <Icon name="settings" size="lg" className="text-primary" />
 * ```
 */
export {
  Icon,
  LazyIcon,
  useIconPreload,
  useCommonIconPreload,
} from "./ui/Icon";

// =============================================================================
// Container Components (Phase 389+)
// =============================================================================

/**
 * GalleryContainer Component - Isolated gallery app container
 * @component GalleryContainer
 * @see {@link ./isolation/GalleryContainer}
 *
 * **Features**:
 * - Props bridge pattern
 * - Service integration
 * - Focus management
 * - Keyboard event handling
 * - State synchronization
 *
 * **Pattern**: Higher-order component that wraps gallery app
 * Provides isolated rendering context and props API
 *
 * @example
 * ```tsx
 * import { GalleryContainer } from '@shared/components';
 * // GalleryContainer provides isolated gallery app context
 * ```
 */
export { GalleryContainer } from "./isolation/GalleryContainer";

// =============================================================================
// Type Exports (Phase 45+)
// =============================================================================

/**
 * Button Props Type - Configuration for Button component
 * @typedef {Object} ButtonProps
 * @see {@link ./ui/Button/Button}
 */
export type { ButtonProps } from "./ui/Button/Button";

/**
 * Toolbar Props Type - Configuration for Toolbar component
 * @typedef {Object} ToolbarProps
 * @see {@link ./ui/Toolbar/Toolbar.types}
 */
export type { ToolbarProps } from "./ui/Toolbar/Toolbar.types";

/**
 * Icon Props Type - Configuration for Icon component
 * @typedef {Object} IconProps
 * @see {@link ./ui/Icon}
 */
export type { IconProps, LazyIconProps } from "./ui/Icon";

/**
 * Gallery Container Props Type - Configuration for GalleryContainer component
 * @typedef {Object} GalleryContainerProps
 * @see {@link ./isolation/GalleryContainer}
 */
export type { GalleryContainerProps } from "./isolation/GalleryContainer";
