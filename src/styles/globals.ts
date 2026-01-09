/**
 * Isolated gallery global style system.
 * Loads only isolated styles in CSS cascade priority order.
 * Order: layers → tokens → reset → utilities → component styles.
 */

// CSS layer order (must be first)
import '@shared/styles/layers.css';

// Design tokens: primitive → semantic → component
import '@shared/styles/design-tokens.primitive.css';
import '@shared/styles/design-tokens.semantic.css';
import '@shared/styles/design-tokens.component.css';

// Browser reset (gallery-scoped)
import '@shared/styles/base/reset.css';

// Utilities: layout, spacing, sizing, animations
import '@shared/styles/utilities/layout.css';
import '@shared/styles/utilities/animations.css';

// Gallery component styles
import '@shared/styles/isolated-gallery.css';
