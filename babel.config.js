/**
 * Babel configuration for Vitest + Solid.js
 * Ensures Solid JSX transform is used in test files
 */
module.exports = {
  presets: [
    [
      'babel-preset-solid',
      {
        generate: 'dom',
        hydratable: false,
      },
    ],
  ],
};
