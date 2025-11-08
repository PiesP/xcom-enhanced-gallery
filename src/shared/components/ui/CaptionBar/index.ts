/**
 * @fileoverview Caption Bar Styles Barrel Export
 * @version 1.0.0 - Phase 393: Glassmorphism caption display styling
 * @description Central export for caption bar CSS modules and documentation
 * @module shared/components/ui/CaptionBar
 *
 * **Caption Bar Architecture** (Phase 385+):
 * Bottom-aligned overlay caption display for tweet text with glassmorphism design.
 * Provides expandable caption display with smooth animations and accessibility features.
 *
 * **CSS Modules Provided**:
 * - CaptionBar.module.css: Glassmorphism styling for caption display
 *   - `.captionBar`: Main container (collapsed/expanded states)
 *   - `.textContent`: Text area with scrolling in expanded state
 *   - `.toggleButton`: Expand/collapse button with visual feedback
 *   - `.toggleIcon`: Icon that rotates on state change
 *   - Theme variants: Dark mode, high contrast support
 *   - Responsive: Mobile-optimized sizing
 *
 * **Design System Integration**:
 * - Fully integrated with xeg-* design tokens
 * - Colors: Dynamic via design system (light/dark theme)
 * - Spacing: em-based units for scalability
 * - Animation: Smooth transitions with design tokens
 * - Accessibility: Focus ring, high contrast, WCAG 2.1 AA
 *
 * **Visual Hierarchy**:
 * 1. `.captionBar` - Container (glassmorphism background)
 *    - position: absolute - Overlay at bottom
 *    - z-index: --xeg-z-overlay - Above main content
 *    - backdrop-filter: blur(0.75rem) - Frosted glass effect
 *
 * 2. `.textContent` - Text area (collapsed/expanded)
 *    - Collapsed: Single line with ellipsis
 *    - Expanded: Scrollable multi-line content
 *    - Custom scrollbar styling (thin, themed)
 *
 * 3. `.toggleButton` - Control button (centered)
 *    - Expand/collapse trigger
 *    - Hover feedback, focus ring, active scale
 *    - Icon rotation indicator (180deg on expand)
 *
 * **State Management**:
 * - data-expanded='true'|'false': Controls max-height and overflow
 * - data-theme='dark'|'light': Theme variant selection
 * - .highContrast: CSS class for high contrast mode (last rule)
 *
 * **Animation Strategy**:
 * - Collapsed: max-height 4em (~64px, 1 line + controls)
 * - Expanded: max-height 16em (~256px, multi-line scrollable)
 * - Transition: Normal duration (0.2s typical) for smooth effect
 * - Icon: Rotates 180deg on expansion (visual indicator)
 * - Button: Shrinks on active (scale 0.95)
 *
 * **Glassmorphism Design**:
 * - Semi-transparent background (10-20% opacity typical)
 * - Backdrop blur effect (0.75rem = 12px)
 * - Creates frosted glass appearance
 * - Works with light/dark themes
 * - Accessible in high contrast mode (border added)
 *
 * **Scrollbar Customization**:
 * - Standard (Firefox): scrollbar-width: thin, scrollbar-color
 * - WebKit (Chrome/Safari): ::-webkit-scrollbar* pseudo-elements
 * - Track: Transparent (blends with background)
 * - Thumb: Neutral color with hover darkening
 * - Radius: Rounded corners for modern look
 *
 * **Responsive Behavior**:
 * - Desktop: Full font size (0.875em ≈ 14px)
 * - Mobile (≤48em/768px): Reduced font size (0.8125em ≈ 13px)
 * - Typography: em-based scaling with container
 * - Layout: Maintains flex structure across sizes
 * - Touch: Larger button area on mobile (em-based sizing)
 *
 * **Accessibility** (WCAG 2.1 AA):
 * - Semantic: Button element for toggle
 * - Focus: :focus-visible with outline ring
 * - High contrast: Dedicated mode with strong borders/colors
 * - Motion: Respects prefers-reduced-motion (via tokens)
 * - Color: 4.5:1 minimum contrast via tokens
 * - Keyboard: Tab to toggle, Enter/Space to activate
 * - Screen readers: Semantic HTML, ARIA-compatible structure
 *
 * **Browser Compatibility**:
 * - Flexbox: Full support (all modern browsers)
 * - Backdrop-filter: Chrome 76+, Firefox 103+, Safari 9+
 * - Scrollbar styling: scrollbar-width (Firefox), ::-webkit-* (Chromium)
 * - CSS Variables: Full support (IE 11 not supported)
 * - Transform: GPU-accelerated (rotate, scale)
 *
 * **Performance**:
 * - CSS Modules: Scoped class names (no conflicts)
 * - Transitions: Only on interactive elements (button/icon)
 * - Transform: GPU-accelerated (rotate, scale, no reflow)
 * - Backdrop-filter: Optimized blur distance (0.75rem)
 * - Flex: Efficient layout with no JavaScript overhead
 *
 * **Testing Considerations**:
 * - Visual: Collapsed/expanded states, scrolling behavior
 * - Accessibility: Focus management, keyboard navigation
 * - Theme: Light/dark mode, high contrast appearance
 * - Responsive: Mobile/tablet/desktop layouts
 * - Animation: Smooth transitions, no jank
 *
 * **Phase History**:
 * - Phase 385: Initial caption bar styling with glassmorphism
 * - Phase 393: Full English documentation, index.ts creation
 *
 * **Component Usage Pattern** (Typical):
 * ```tsx
 * import styles from '@shared/components/ui/CaptionBar/CaptionBar.module.css';
 *
 * export function CaptionBar({ caption, expanded, onToggle }) {
 *   return (
 *     <div class={styles.captionBar} data-expanded={expanded}>
 *       <div class={styles.textContent} data-expanded={expanded}>
 *         {caption}
 *       </div>
 *       <button
 *         class={styles.toggleButton}
 *         onClick={onToggle}
 *         aria-label={expanded ? 'Collapse' : 'Expand'}
 *       >
 *         <span class={styles.toggleIcon} data-expanded={expanded}>
 *           ▼
 *         </span>
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * **Related Components**:
 * - Gallery: Uses CaptionBar for tweet text display (overlay)
 * - Toolbar: Positioned above caption bar (z-index ordering)
 * - ModalShell: Similar overlay pattern (stacking context)
 * - SettingsModal: Same backdrop-filter technique
 *
 * **Design Token System**:
 * - All colors dynamic via design tokens
 * - No hardcoded hex/rgb values
 * - Light/dark theme: Automatic switching
 * - High contrast mode: Via browser preference
 * - Responsive: rem-based sizing (font, spacing)
 *
 * **Future Enhancements**:
 * - Animation timing customization (reduced motion support)
 * - Nested scrolling optimization (iOS compatibility)
 * - Keyboard shortcuts (expand/collapse via key)
 * - Virtual scrolling for very long captions (performance)
 *
 * @see {@link ./CaptionBar.module.css} - CSS module styles
 * @see {@link ../../../styles} - Design token definitions
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter - Backdrop filter docs
 * @see https://www.w3.org/WAI/tutorials/images/textual/ - Accessible images guide
 */

// This barrel export exists for documentation purposes.
// Import CaptionBar.module.css directly in components that use it.
//
// Example:
// import styles from '@shared/components/ui/CaptionBar/CaptionBar.module.css';
//
// The CSS module is used by Gallery and media display components.
