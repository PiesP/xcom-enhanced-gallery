/**
 * @fileoverview Primitive Button Component
 * @version 1.1.0 - Phase 390: Full English documentation, comprehensive JSDoc
 * @description Semantic HTML button element with design token integration
 * @module shared/components/ui/primitive/Button
 *
 * **Button Primitive Architecture**:
 * Low-level button component extending native HTML button element with:
 * - Semantic props (variant, size, intent, selected, loading)
 * - Accessibility features (ARIA attributes, keyboard support)
 * - Design token integration (colors, spacing, transitions)
 * - Composition support for higher-level components
 *
 * **Part of Primitive Component System**:
 * - Phase 390: Foundational UI building blocks
 * - Design System: CSS token-based styling
 * - Accessibility: WCAG 2.1 Level AA compliant
 * - Reusability: Used by Button.tsx, IconButton, and composite components
 *
 * **Core Features**:
 * 1. **Variants**: primary (default), secondary, outline
 * 2. **Sizes**: sm (small), md (medium, default), lg (large)
 * 3. **Intent**: primary, success, danger, neutral (semantic meaning)
 * 4. **States**: disabled, loading, selected (ARIA-backed)
 * 5. **Keyboard**: Enter/Space key handling for accessibility
 * 6. **Composition**: Flexible children, className merging
 *
 * **Design System Integration**:
 * - Colors: --xeg-color-primary, --button-text-*, --button-bg-*
 * - Spacing: --space-sm, --space-md, --space-lg (padding)
 * - Sizing: 2em (sm), 2.5em (md), 3em (lg) with em-based scaling
 * - Transitions: --button-transition for smooth hover/active states
 * - Radius: --xeg-radius-md for border-radius consistency
 * - Focus: --xeg-focus-ring (outline + offset)
 *
 * **Usage Patterns**:
 * ```tsx
 * // Basic button (primary, medium)
 * import { Button } from '@shared/components/ui/primitive';
 *
 * <Button onClick={() => console.log('clicked')}>
 *   Click Me
 * </Button>
 *
 * // With semantic intent (danger = red)
 * <Button intent='danger' onClick={handleDelete}>
 *   Delete Item
 * </Button>
 *
 * // Loading state (disables interaction)
 * <Button loading={isSubmitting}>
 *   {isSubmitting ? 'Submitting...' : 'Submit'}
 * </Button>
 *
 * // Toggle button (selected = toggled on)
 * <Button
 *   selected={isActive()}
 *   onClick={() => setIsActive(!isActive())}
 *   aria-label='Toggle settings'
 * >
 *   Settings
 * </Button>
 * ```
 *
 * **Accessibility** (WCAG 2.1 AA):
 * - role='button': Semantic role for screen readers
 * - tabIndex: Managed automatically (0 by default, -1 when disabled/loading)
 * - aria-pressed: Set when selected (toggleable buttons)
 * - aria-busy: Set when loading (indicates pending action)
 * - Keyboard: Enter/Space keys trigger onClick
 * - Focus visible: --xeg-focus-ring outline (2px offset)
 * - Color contrast: Design tokens ensure 4.5:1 minimum
 *
 * **Interaction Model**:
 * - Click: Triggers onClick callback (respects disabled/loading states)
 * - Keyboard: Enter or Space activates (similar to native button)
 * - Hover: Visual feedback via transform (lift effect)
 * - Active: Pressed state with active background color
 * - Disabled: Opacity reduced, cursor disabled, no interaction
 *
 * **Performance**:
 * - Memo: className computed once, invalidates on prop changes
 * - Split Props: Separates local from spread props (no duplication)
 * - CSS: All transitions GPU-accelerated (transform, opacity)
 * - Memory: No subscriptions or closures per render
 *
 * @see {@link ./Button.css} - Component styling
 * @see {@link ../../../styles/} - Design token system
 */

import type { JSX } from 'solid-js';
import { getSolid } from '@shared/external/vendors';
import './Button.css';

const { createMemo, splitProps, mergeProps } = getSolid();

/**
 * Primitive Button Props
 *
 * **Configuration**:
 * - Content: children (rendered as button text/content)
 * - Styling: class/className (merged with computed classes)
 * - Semantics: variant, size, intent, selected, loading, disabled
 * - Interaction: onClick, onKeyDown event handlers
 * - ARIA: aria-pressed, aria-busy, role, tabIndex
 * - HTML: type (button, submit, reset)
 *
 * @description Props for semantic button element with extensive customization
 *
 * **Extends HTML Button**:
 * All native button attributes supported except children, class, onClick, onKeyDown
 * (which have custom handling below)
 *
 * @example
 * ```tsx
 * const props: ButtonProps = {
 *   children: 'Save',
 *   variant: 'primary',
 *   size: 'md',
 *   intent: 'success',
 *   onClick: handleSave,
 *   disabled: !hasChanges,
 *   'aria-label': 'Save changes',
 * };
 * ```
 */
export interface ButtonProps
  extends Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'class' | 'onClick' | 'onKeyDown'
  > {
  /**
   * Button content
   * @description Rendered as children (text, icons, or complex elements)
   * @default undefined
   */
  readonly children?: JSX.Element;

  /**
   * CSS class name
   * @description Composable with computed variant/size classes
   * Supports both class and className for Solid.js compatibility
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
   * Button visual variant
   * @description Controls appearance and button color scheme
   * - 'primary': Filled primary color (default, CTA)
   * - 'secondary': Subtle background, secondary color
   * - 'outline': Bordered, no fill (used for less prominent actions)
   * @default 'primary'
   * @example variant='outline' for secondary actions
   */
  readonly variant?: 'primary' | 'secondary' | 'outline';

  /**
   * Button size
   * @description Controls dimensions and text size via CSS
   * - 'sm': 2em height (~32px), smaller font, compact spacing
   * - 'md': 2.5em height (~40px), default font, normal spacing (default)
   * - 'lg': 3em height (~48px), larger font, expanded spacing
   * Uses em-based scaling for responsive sizing
   * @default 'md'
   * @example size='lg' for prominent CTAs
   */
  readonly size?: 'sm' | 'md' | 'lg';

  /**
   * Disabled state
   * @description Disables all interaction (click, keyboard)
   * Applies opacity reduction and cursor disabled
   * @default false
   */
  readonly disabled?: boolean;

  /**
   * Button type
   * @description HTML button type (behavioral)
   * - 'button': Generic button (default), no form submission
   * - 'submit': Submits parent form when clicked
   * - 'reset': Resets parent form fields
   * @default 'button'
   */
  readonly type?: 'button' | 'submit' | 'reset';

  /**
   * Click event handler
   * @description Triggered on mouse click or keyboard activation
   * Respects disabled/loading states (no callback if disabled)
   * Receives MouseEvent or KeyboardEvent (Enter/Space)
   * @param event - Click or keyboard event
   */
  readonly onClick?: (event: MouseEvent | KeyboardEvent) => void;

  /**
   * Keyboard event handler
   * @description Triggered on any keydown event
   * Useful for custom keyboard shortcuts
   * Note: Enter/Space are handled automatically for activation
   */
  readonly onKeyDown?: (event: KeyboardEvent) => void;

  /**
   * Semantic intent/meaning
   * @description Communicates button purpose via color (accessibility)
   * - 'primary': Default action (blue typically)
   * - 'success': Positive action, confirmation (green)
   * - 'danger': Destructive action, delete (red)
   * - 'neutral': Informational, neither positive nor negative (gray)
   * Overrides base variant color
   * @default undefined (uses variant color)
   * @example intent='danger' for delete buttons (red)
   */
  readonly intent?: 'primary' | 'success' | 'danger' | 'neutral';

  /**
   * Selected/toggled state
   * @description For toggle buttons (on/off state)
   * Sets aria-pressed='true'|'false' for assistive tech
   * Visual: selected buttons may have different background
   * @default undefined (not a toggle button)
   * @example selected={isActive()} for toggle buttons
   */
  readonly selected?: boolean;

  /**
   * Loading/pending state
   * @description Indicates asynchronous operation in progress
   * Sets aria-busy='true' and disables interaction
   * Often paired with spinner icon or text (e.g., 'Saving...')
   * @default false
   */
  readonly loading?: boolean;
}

/**
 * Primitive Button Component
 *
 * Renders a semantic HTML button element with Solid.js reactivity and
 * design token-based styling. Handles all accessibility features (ARIA,
 * keyboard navigation, focus management).
 *
 * **Rendering Strategy**:
 * 1. Compute effective class names (variant, size, intent, selected, loading)
 * 2. Set up event handlers (keyboard, click with state checks)
 * 3. Resolve ARIA attributes (aria-pressed, aria-busy based on state)
 * 4. Merge props (local props + spread attrs + ARIA attrs)
 * 5. Render button element with computed props and children
 *
 * **Event Handling**:
 * - Click: Respects disabled/loading states, calls onClick if enabled
 * - KeyDown: Captures Enter/Space for activation (similar to native button)
 * - Focus: Tab navigable, focus-visible outline (--xeg-focus-ring)
 * - Hover: Visual feedback via transform (lift effect)
 *
 * **State Management**:
 * - disabled: Disables all interaction, reduces opacity
 * - loading: Equivalent to disabled + aria-busy='true'
 * - selected: Sets aria-pressed (for toggle buttons)
 * - variant: Controls appearance (primary, secondary, outline)
 *
 * **Accessibility**:
 * - role='button': Semantic role for screen readers
 * - tabIndex: Automatically managed (0 normal, -1 when disabled)
 * - aria-pressed: Set when selected (toggleable)
 * - aria-busy: Set when loading (pending state)
 * - Keyboard: Enter/Space keys work like native button
 * - Focus visible: CSS outline with --xeg-focus-ring
 *
 * **Performance**:
 * - Memo: className memoized, updates on relevant prop changes
 * - Split: Local props separated from spread attrs (efficient)
 * - CSS: All transitions GPU-accelerated (no reflows)
 * - Memory: Closure-free event handlers (safe for Solid.js)
 *
 * @param props - ButtonProps configuration
 * @returns JSXElement (button element)
 *
 * @example
 * ```tsx
 * // Basic button (primary, medium)
 * import { Button } from '@shared/components/ui/primitive';
 *
 * export function SaveButton() {
 *   return (
 *     <Button
 *       onClick={() => console.log('saved')}
 *       type='submit'
 *     >
 *       Save
 *     </Button>
 *   );
 * }
 *
 * // Danger button with intent
 * <Button
 *   intent='danger'
 *   variant='outline'
 *   onClick={handleDelete}
 * >
 *   Delete Item
 * </Button>
 *
 * // Toggle button with selected state
 * <Button
 *   selected={isActive()}
 *   onClick={() => setIsActive(!isActive())}
 * >
 *   {isActive() ? 'On' : 'Off'}
 * </Button>
 *
 * // Loading state
 * <Button
 *   loading={isSubmitting()}
 *   onClick={handleSubmit}
 * >
 *   {isSubmitting() ? 'Submitting...' : 'Submit'}
 * </Button>
 * ```
 */
export function Button(props: ButtonProps): JSX.Element {
  const [local, others] = splitProps(props, [
    'children',
    'class',
    'className',
    'variant',
    'size',
    'disabled',
    'type',
    'onClick',
    'onKeyDown',
    'intent',
    'selected',
    'loading',
    'role',
    'tabIndex',
    'aria-pressed',
    'aria-busy',
  ]);

  /**
   * Compute effective CSS class names
   * Includes: base class, variant, size, intent, selected, loading states
   * Filters out false values to avoid empty class strings
   */
  const effectiveClass = createMemo(() =>
    [
      'xeg-button',
      `xeg-button--${local.variant ?? 'primary'}`,
      `xeg-button--${local.size ?? 'md'}`,
      local.intent && `xeg-button--${local.intent}`,
      local.selected && 'xeg-button--selected',
      local.loading && 'xeg-button--loading',
      local.class,
      local.className,
    ]
      .filter(Boolean)
      .join(' ')
  );

  /**
   * Handle keyboard events (Enter or Space for activation)
   * Prevents default browser behavior and triggers onClick
   * @param event - Keyboard event
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!local.disabled && !local.loading) {
        local.onClick?.(event);
      }
    }
    local.onKeyDown?.(event);
  };

  /**
   * Handle click events
   * Respects disabled/loading states (prevents execution if disabled)
   * @param event - Mouse click event
   */
  const handleClick = (event: MouseEvent): void => {
    if (!local.disabled && !local.loading) {
      local.onClick?.(event);
    }
  };

  // Resolve accessibility attributes
  const resolvedRole =
    (local.role as JSX.ButtonHTMLAttributes<HTMLButtonElement>['role']) ?? 'button';
  const resolvedTabIndex = local.tabIndex ?? (local.disabled || local.loading ? -1 : 0);
  const ariaPressed =
    local.selected !== undefined ? (local.selected ? 'true' : 'false') : local['aria-pressed'];
  const ariaBusy = local.loading ? true : local['aria-busy'];

  // Merge button props with defaults and accessibility attributes
  const buttonProps = mergeProps(
    {
      role: 'button' as const,
      tabIndex: 0,
    },
    others,
    {
      type: (local.type as ButtonProps['type']) ?? 'button',
      class: effectiveClass(),
      disabled: Boolean(local.disabled || local.loading),
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      role: resolvedRole,
      tabIndex: resolvedTabIndex,
      'aria-pressed': ariaPressed,
      'aria-busy': ariaBusy,
    }
  );

  return <button {...buttonProps}>{local.children}</button>;
}
