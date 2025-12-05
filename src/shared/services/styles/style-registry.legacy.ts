/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Legacy StyleRegistry Class Wrapper
 * @description Provides backward compatibility for code using the StyleRegistry class
 * @version 4.0.0 - Legacy wrapper for functional refactor
 * @deprecated Use functional exports from '@shared/services/styles' instead
 */

import {
  clearStyleMap,
  getStyleElement,
  hasStyle,
  registerStyle,
  removeStyle,
  type RegistrationResult,
  type StyleRegistrationOptions,
} from './style-utils';

/**
 * Legacy StyleRegistry class wrapper.
 * @deprecated Use functional exports from '@shared/services/styles' instead:
 * - `registerStyle()` for registering styles
 * - `removeStyle()` for removing styles
 * - `hasStyle()` for checking if a style exists
 * - `getStyleElement()` for getting a style element
 */
export class StyleRegistry {
  private static _instance: StyleRegistry | null = null;

  /**
   * Allows tests to reset the singleton via direct assignment.
   * Setting to null/undefined also clears the style map.
   */
  static get instance(): StyleRegistry | null {
    return StyleRegistry._instance;
  }

  static set instance(value: StyleRegistry | null) {
    StyleRegistry._instance = value;
    if (value == null) {
      clearStyleMap();
    }
  }

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): StyleRegistry {
    if (!StyleRegistry._instance) {
      StyleRegistry._instance = new StyleRegistry();
    }
    return StyleRegistry._instance;
  }

  /**
   * @deprecated Use `registerStyle()` function instead
   */
  public registerStyle(options: StyleRegistrationOptions): RegistrationResult | null {
    return registerStyle(options);
  }

  /**
   * @deprecated Use `removeStyle()` function instead
   */
  public removeStyle(id: string): void {
    removeStyle(id);
  }

  /**
   * @deprecated Use `hasStyle()` function instead
   */
  public hasStyle(id: string): boolean {
    return hasStyle(id);
  }

  /**
   * @deprecated Use `getStyleElement()` function instead
   */
  public getStyleElement(id: string): HTMLStyleElement | null {
    return getStyleElement(id);
  }

  /**
   * Reset the singleton instance for testing.
   * @internal
   */
  static resetInstance(): void {
    StyleRegistry._instance = null;
    clearStyleMap();
  }
}

/**
 * Get the StyleRegistry singleton instance.
 * @deprecated Use functional exports from '@shared/services/styles' instead
 */
export function getStyleRegistry(): StyleRegistry {
  return StyleRegistry.getInstance();
}
