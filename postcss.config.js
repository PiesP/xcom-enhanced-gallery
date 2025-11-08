/**
 * @fileoverview PostCSS configuration - OKLCH color system support
 */

import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssOKLCHFunction from '@csstools/postcss-oklab-function';
import cssnano from 'cssnano';

/** @type {import('postcss').Config} */
const isProd = process.env.NODE_ENV === 'production';

const config = {
  plugins: [
    // Auto-generate OKLCH color fallback (support older browsers)
    postcssOKLCHFunction({
      preserve: !isProd, // Keep in dev, emit numeric form in prod
      enableProgressiveCustomProperties: true, // Transform inside CSS variables
    }),
    // Generate CSS variable fallback (partial IE11 support)
    postcssCustomProperties({ preserve: true }),
    // Auto-add vendor prefixes
    autoprefixer({
      overrideBrowserslist: ['>= 0.5%', 'last 2 major versions', 'Firefox ESR', 'not dead'],
    }),
    // Production compression (Phase 406: optimization)
    ...(isProd
      ? [
          cssnano({
            preset: [
              'default', // Phase 406: default preset (stable, well-tested)
              {
                discardComments: { removeAll: true }, // Phase 326.5-3A: Remove all comments (~18 KB saving)
                normalizeUnicode: false, // Disable unicode normalization (keep unicode characters as-is)
                svgo: false, // SVG optimization unnecessary (no SVG in CSS)
                // Phase 406: Optimization settings
                discardDuplicates: true, // Remove duplicate rules
                discardEmpty: true, // Remove empty rules
                mergeRules: true, // Merge similar rules
                reduceIdents: false, // Don't shorten variable names (design tokens must be preserved)
                convertValues: { length: false }, // Don't convert rem/em values (preserve design tokens)
              },
            ],
          }),
        ]
      : []),
  ],
};

export default config;
