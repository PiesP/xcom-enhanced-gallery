/**
 * @fileoverview UI Component Constants
 * @description Central location for all UI component size, variant, and type constants.
 * Extracted from StandardProps (Phase 45-388) for maintainability and reusability.
 * @version 2.0.0
 *
 * @architecture
 * ## Constants System
 * All UI components use these constants to ensure consistency across the library.
 * Extracted to a single file to avoid duplication and enable centralized updates.
 *
 * **Three Main Categories**:
 * 1. **Size Constants**: Button/component sizing (sm, md, lg, xl)
 * 2. **Variant Constants**: Color and style variants (primary, secondary, danger)
 * 3. **Type Constants**: Notification types (success, error, warning, info)
 *
 * ## Design System Integration
 * Each constant maps to semantic design tokens via CSS custom properties:
 * - Sizes map to `--xeg-size-*` tokens (small, medium, large)
 * - Variants map to `--xeg-color-*` tokens (semantic colors)
 * - Types map to notification colors (success green, error red, etc.)
 *
 * ## Type Safety
 * All constants use `as const` assertion for:
 * - Literal type inference (not just 'string')
 * - IDE autocomplete support
 * - Type-safe component props
 * - Exhaustiveness checking in conditional logic
 *
 * ## Maintenance
 * - **Add**: New size/variant/type → Update corresponding constant
 * - **Deprecate**: Use TypeScript deprecated comment for breaking changes
 * - **Validate**: Unit tests ensure all values are used
 *
 * @module shared/components/ui/constants
 * @see {@link ../} - UI component barrel export
 */

/**
 * @constant DEFAULT_SIZES
 * @type {const}
 * @description Component size variants mapping short codes to full names
 *
 * **Semantics**:
 * - `sm` (small): Compact size for dense layouts
 *   - Button: Small padding, small text
 *   - Icon: 16px-24px viewport
 *   - Toolbar: Reduced spacing, collapsed controls
 *
 * - `md` (medium): Default size, optimal for usability
 *   - Button: Standard padding, standard text (default)
 *   - Icon: 24px-32px viewport (default)
 *   - Toolbar: Standard spacing, full controls (recommended)
 *
 * - `lg` (large): Prominent size for emphasis
 *   - Button: Large padding, large text
 *   - Icon: 32px-48px viewport
 *   - Toolbar: Expanded spacing, prominent controls
 *
 * - `xl` (extra-large): Extra prominent for CTAs
 *   - Button: Extra padding, extra large text (rare)
 *   - Icon: 48px-64px viewport (rare)
 *   - Toolbar: Maximum spacing (very rare)
 *
 * **Design Tokens**:
 * Maps to `--xeg-size-sm/md/lg/xl` CSS custom properties via component CSS modules.
 * Each token adjusts:
 * - Padding: Inner spacing
 * - Font-size: Text sizing
 * - Icon viewport: Viewbox scaling
 * - Border-radius: Rounding (often size-proportional)
 *
 * **Type Safety Example**:
 * ```typescript
 * type ButtonSize = keyof typeof DEFAULT_SIZES; // 'sm' | 'md' | 'lg' | 'xl'
 * const size: ButtonSize = 'md'; // ✅ TypeScript accepts
 * const bad: ButtonSize = 'xs'; // ❌ TypeScript error
 * ```
 *
 * @example
 * Button component size:
 * ```jsx
 * <Button size={DEFAULT_SIZES.md}>Click me</Button>
 * // Or with type alias
 * const size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
 * <Button size={size}>Click me</Button>
 * ```
 *
 * @example
 * Icon component size:
 * ```jsx
 * <Icon name="download" size={DEFAULT_SIZES.lg} />
 * // Renders: 32px-48px viewbox
 * ```
 */
export const DEFAULT_SIZES = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'extra-large',
} as const;

/**
 * @constant DEFAULT_VARIANTS
 * @type {const}
 * @description Component style variants mapping short codes to semantic colors
 *
 * **Semantics** (Material Design 3 inspired):
 * - `primary`: Brand color for primary actions
 *   - Use for: Main CTA buttons, primary navigation
 *   - Color: Brand blue (from design system)
 *   - Default: Used when no variant specified
 *
 * - `secondary`: Supporting color for secondary actions
 *   - Use for: Less important actions, alternatives
 *   - Color: Secondary blue (lighter than primary)
 *   - Emphasis: Lower visual hierarchy
 *
 * - `ghost`: Transparent/outline only, minimal visual weight
 *   - Use for: Tertiary actions, links, minimal UI
 *   - Color: Border only, no background
 *   - Emphasis: Lowest visual hierarchy
 *
 * - `danger`: Red color for destructive actions
 *   - Use for: Delete, remove, archive, dangerous operations
 *   - Color: Semantic red (error color)
 *   - Warning: Requires confirmation typically
 *
 * - `success`: Green color for affirmative actions
 *   - Use for: Confirm, apply, enable, positive messages
 *   - Color: Semantic green (success color)
 *   - Feedback: Indicates successful state
 *
 * - `warning`: Amber/orange color for cautious actions
 *   - Use for: Caution, attention-needed, non-critical alerts
 *   - Color: Semantic amber (warning color)
 *   - Feedback: Indicates warning state
 *
 * **Design Tokens**:
 * Maps to semantic color tokens (auto dark mode support):
 * - `--xeg-color-primary`: Brand primary
 * - `--xeg-color-secondary`: Brand secondary
 * - `--xeg-color-danger`: Semantic red
 * - `--xeg-color-success`: Semantic green
 * - `--xeg-color-warning`: Semantic amber
 *
 * **Visual Hierarchy**:
 * primary > secondary > ghost (most prominent → least prominent)
 *
 * **Type Safety Example**:
 * ```typescript
 * type ButtonVariant = keyof typeof DEFAULT_VARIANTS;
 * // Type: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
 * const variant: ButtonVariant = 'primary'; // ✅ TypeScript accepts
 * const bad: ButtonVariant = 'info'; // ❌ TypeScript error
 * ```
 *
 * @example
 * Button with variants:
 * ```jsx
 * <Button variant={DEFAULT_VARIANTS.primary}>Save</Button>
 * <Button variant={DEFAULT_VARIANTS.danger}>Delete</Button>
 * <Button variant={DEFAULT_VARIANTS.ghost}>Skip</Button>
 * ```
 *
 * @example
 * Color scheme in different variants:
 * ```
 * primary:   Blue background + white text (high contrast)
 * secondary: Light blue background + dark text
 * ghost:     Transparent + border only (minimal)
 * danger:    Red background + white text (warning)
 * success:   Green background + white text (affirmative)
 * warning:   Amber background + white text (caution)
 * ```
 */
export const DEFAULT_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
} as const;

/**
 * @constant DEFAULT_TOAST_TYPES
 * @type {const}
 * @description Toast notification type constants mapping to semantic colors
 *
 * **Semantics** (Notification Intent):
 * - `success`: Green indicator for successful operations
 *   - Use for: Operation completed, download finished, saved successfully
 *   - Icon: Checkmark (✓)
 *   - Color: Green (semantic success)
 *   - Duration: Auto-dismiss (typical: 5-7 seconds)
 *
 * - `error`: Red indicator for failures/errors
 *   - Use for: Operation failed, error occurred, invalid input
 *   - Icon: X or exclamation mark
 *   - Color: Red (semantic danger/error)
 *   - Duration: Sticky (user must dismiss or timeout longer)
 *
 * - `warning`: Amber indicator for caution/non-critical issues
 *   - Use for: Deprecated action, resource limit near, non-critical warning
 *   - Icon: Exclamation mark
 *   - Color: Amber (semantic warning)
 *   - Duration: Auto-dismiss (typical: 7-10 seconds)
 *
 * - `info`: Blue indicator for informational messages
 *   - Use for: Informational updates, help tips, non-critical info
 *   - Icon: Info circle (i)
 *   - Color: Blue (semantic info)
 *   - Duration: Auto-dismiss (typical: 3-5 seconds)
 *
 * **Design Tokens**:
 * Maps to semantic notification colors (auto dark mode support):
 * - `--xeg-color-success`: Green (successful state)
 * - `--xeg-color-error`: Red (error state)
 * - `--xeg-color-warning`: Amber (warning state)
 * - `--xeg-color-info`: Blue (informational state)
 *
 * **User Guidance**:
 * Color choice communicates intent to users instantly:
 * - Green = Good outcome, proceed
 * - Red = Problem, needs attention
 * - Amber = Caution, be aware
 * - Blue = Information, FYI
 *
 * **Type Safety Example**:
 * ```typescript
 * type ToastType = keyof typeof DEFAULT_TOAST_TYPES;
 * // Type: 'success' | 'error' | 'warning' | 'info'
 * const type: ToastType = 'success'; // ✅ TypeScript accepts
 * const bad: ToastType = 'debug'; // ❌ TypeScript error
 * ```
 *
 * @example
 * Toast notifications:
 * ```jsx
 * // Success: Operation completed
 * notificationService.show({
 *   type: DEFAULT_TOAST_TYPES.success,
 *   message: 'Downloaded 5 images'
 * });
 *
 * // Error: Operation failed
 * notificationService.show({
 *   type: DEFAULT_TOAST_TYPES.error,
 *   message: 'Failed to download image'
 * });
 *
 * // Warning: Caution message
 * notificationService.show({
 *   type: DEFAULT_TOAST_TYPES.warning,
 *   message: 'Large file (100MB)'
 * });
 *
 * // Info: Informational
 * notificationService.show({
 *   type: DEFAULT_TOAST_TYPES.info,
 *   message: 'New version available'
 * });
 * ```
 */
export const DEFAULT_TOAST_TYPES = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  success: 'success',
} as const;
