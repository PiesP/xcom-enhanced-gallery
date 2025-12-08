/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Style Services Module Entry Point
 * @description Re-exports functional API
 * @version 4.0.0 - Functional refactor
 */

// Primary exports - Pure functions
export {
  clearStyleMap,
  getRegisteredStyleCount,
  getStyleElement,
  hasStyle,
  registerStyle,
  // Types
  type RegistrationResult,
  removeStyle,
  type StyleRegistrationOptions,
} from './style-utils';
