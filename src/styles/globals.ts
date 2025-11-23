/**
 * @fileoverview Isolated gallery global style system (v5.1.0)
 * @description Import only isolated styles that don't affect Twitter page
 * @version 5.1.0 - Phase 352: CSS @import removal for bundler optimization
 * @see Phase 352: CSS import chain optimization (reduced network requests, improved HMR)
 */

// Design tokens (3-tier hierarchy) - Bundler optimization via direct import instead of CSS @import
// Phase 352: Removed design-tokens.css intermediate layer → Direct import
import "@shared/styles/design-tokens.primitive.css"; // Tier 1: Base values (colors, sizes)
import "@shared/styles/design-tokens.semantic.css"; // Tier 2: Role-based tokens
import "@shared/styles/design-tokens.component.css"; // Tier 3: Component-specific tokens

// Design tokens - Animation system (Duration/Easing/Delay CSS variables)
import "@shared/styles/tokens/animation.css";

// Browser style reset (applied only inside gallery container)
import "@shared/styles/base/reset.css";

// Utility classes: Layout/spacing/sizing (lightweight, em/token-based)
import "@shared/styles/utilities/layout.css";

// Utility classes: @keyframes definition + animation utility classes
import "@shared/styles/utilities/animations.css";

// Isolated gallery styles (no impact on Twitter page)
import "@shared/styles/isolated-gallery.css";
