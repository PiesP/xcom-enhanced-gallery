/**
 * @fileoverview Isolated gallery global style system
 * @description Import only isolated styles that don't affect Twitter page
 */

// Design tokens (3-tier hierarchy)
import '@shared/styles/design-tokens.primitive.css'; // Tier 1: Base values (colors, sizes)
import '@shared/styles/design-tokens.semantic.css'; // Tier 2: Role-based tokens
import '@shared/styles/design-tokens.component.css'; // Tier 3: Component-specific tokens

// Design tokens - Animation system
import '@shared/styles/tokens/animation.css';

// Browser style reset (applied only inside gallery container)
import '@shared/styles/base/reset.css';

// Utility classes: Layout/spacing/sizing
import '@shared/styles/utilities/layout.css';

// Utility classes: @keyframes definition + animation utility classes
import '@shared/styles/utilities/animations.css';

// Isolated gallery styles
import '@shared/styles/isolated-gallery.css';
