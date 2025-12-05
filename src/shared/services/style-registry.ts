/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Style Registry Re-export
 * @description Re-exports from styles/ module for backward compatibility
 * @version 4.0.0 - Functional refactor
 * @deprecated Import from '@shared/services/styles' instead
 */

// Re-export everything from the new modular location
export {
  // Functional API (recommended)
  clearStyleMap,
  getRegisteredStyleCount,
  getStyleElement,
  hasStyle,
  registerStyle,
  removeStyle,
  // Types
  type RegistrationResult,
  type StyleRegistrationOptions,
  // Legacy class wrapper
  getStyleRegistry,
  StyleRegistry,
} from '@shared/services/styles';
