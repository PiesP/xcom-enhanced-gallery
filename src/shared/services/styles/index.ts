/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Style Services Module Entry Point
 * @description Re-exports functional API and provides legacy class compatibility
 * @version 4.0.0 - Functional refactor
 */

// Legacy class compatibility layer
export { getStyleRegistry, StyleRegistry } from './style-registry.legacy';
// Primary exports - Pure functions (recommended)
export {
  clearStyleMap,
  getRegisteredStyleCount,
  getStyleElement,
  hasStyle,
  // Types
  type RegistrationResult,
  registerStyle,
  removeStyle,
  type StyleRegistrationOptions,
} from './style-utils';
