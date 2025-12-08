/**
 * @fileoverview Isolated gallery global style system
 * @description Import only isolated styles that don't affect Twitter page
 *
 * Import Order (Critical for CSS cascade):
 * 1. Layer declaration (establishes cascade priority)
 * 2. Design tokens (3-tier hierarchy)
 * 3. Base reset styles
 * 4. Utility classes
 * 5. Feature-specific styles
 */

// 1. CSS Layer order declaration - MUST be first
import '@shared/styles/layers.css';

// 2. Design tokens (3-tier hierarchy)
import '@shared/styles/design-tokens.primitive.css'; // Tier 1: Base values (colors, sizes)
import '@shared/styles/design-tokens.semantic.css'; // Tier 2: Role-based tokens
import '@shared/styles/design-tokens.component.css'; // Tier 3: Component-specific tokens

// 3. Design tokens - Animation system
import '@shared/styles/tokens/animation.css';

// 4. Browser style reset (applied only inside gallery container)
import '@shared/styles/base/reset.css';

// 5. Utility classes: Layout/spacing/sizing
import '@shared/styles/utilities/layout.css';

// 6. Utility classes: @keyframes definition + animation utility classes
import '@shared/styles/utilities/animations.css';

// 7. Isolated gallery styles
import '@shared/styles/isolated-gallery.css';
