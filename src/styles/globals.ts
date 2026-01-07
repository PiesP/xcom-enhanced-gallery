/**
 * Isolated gallery global style system.
 *
 * @fileoverview Loads only isolated styles that don't affect Twitter page.
 * Imports organized by CSS cascade priority (critical for correct styling).
 *
 * Import Order:
 * 1. CSS layers declaration (establishes cascade priority)
 * 2. Design tokens (3-tier: primitive → semantic → component)
 * 3. Base reset styles (scoped to gallery container)
 * 4. Utility classes (layout, spacing, sizing, animations)
 * 5. Feature-specific styles (isolated gallery)
 */

// 1. CSS Layer order declaration - MUST be first
import '@shared/styles/layers.css';

// 2. Design tokens: 3-tier hierarchy
//    Tier 1: Base values (colors, sizes, fonts)
import '@shared/styles/design-tokens.primitive.css';
//    Tier 2: Semantic/role-based tokens
import '@shared/styles/design-tokens.semantic.css';
//    Tier 3: Component-specific tokens
import '@shared/styles/design-tokens.component.css';

// 3. Browser style reset (scoped to gallery container only)
import '@shared/styles/base/reset.css';

// 4. Utility classes: Layout, spacing, sizing
import '@shared/styles/utilities/layout.css';

// 5. Utility classes: @keyframes + animation utility classes
import '@shared/styles/utilities/animations.css';

// 6. Isolated gallery component styles
import '@shared/styles/isolated-gallery.css';
