export default {
  plugins: {
    '@csstools/postcss-oklab-function': { preserve: true },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'default',
              {
                // Merge duplicate rules
                mergeRules: true,
                // Merge longhand properties into shorthand
                mergeLonghand: true,
                // Minify selectors where possible
                minifySelectors: true,
                // Minify font values
                minifyFontValues: true,
                // Normalize unicode range descriptors
                normalizeUnicode: true,
                // Reduce CSS calc expressions
                calc: true,
                // Convert color values to shortest form
                colormin: true,
                // Reduce border-radius values
                reduceIdents: false, // Preserve animation names
                // Discard duplicate rules
                discardDuplicates: true,
                // Discard empty rules
                discardEmpty: true,
                // Discard comments
                discardComments: { removeAll: true },
              },
            ],
          },
        }
      : {}),
  },
};
