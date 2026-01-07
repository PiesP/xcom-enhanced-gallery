/**
 * @fileoverview Build mode configuration for development and production.
 *
 * Defines CSS optimization, source map, and class naming patterns per build mode.
 * Used by Vite plugins to configure PostCSS behavior and module identifier naming.
 */

import type { BuildModeConfig } from './types';

/**
 * Build mode configuration presets.
 *
 * - **development**: Full source maps, uncompressed CSS, readable class names (debug-friendly)
 * - **production**: No source maps, optimized CSS, minimal class names (bundle-size optimized)
 */
const BUILD_MODE_CONFIGS: Record<'development' | 'production', BuildModeConfig> = {
  development: {
    cssCompress: false,
    cssRemoveComments: false,
    cssVariableShortening: false,
    cssPruneUnusedCustomProperties: false,
    cssValueMinify: false,
    cssClassNamePattern: '[name]__[local]__[hash:base64:5]',
    sourceMap: true as const,
  },
  production: {
    cssCompress: true,
    cssRemoveComments: true,
    cssVariableShortening: true,
    cssPruneUnusedCustomProperties: true,
    cssValueMinify: true,
    // Bundle-size optimization: keep the hashed CSS Module names extremely short.
    // Note: Code should never depend on this prefix (CSS Modules exports are used instead).
    cssClassNamePattern: 'xg-[hash:base64:4]',
    sourceMap: false as const,
  },
};

/**
 * Retrieves the build mode configuration.
 *
 * Maps the Vite build mode to a preset configuration object.
 * Defaults to production config for any unrecognized mode string.
 *
 * @param mode - Vite build mode string ('development', 'production', or other)
 * @returns Configuration object for CSS optimization, source maps, and class naming
 * @see BuildModeConfig for configuration property details
 */
export function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}
