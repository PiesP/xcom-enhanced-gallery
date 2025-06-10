// Copyright (c) 2024 X.com Enhanced Gallery
// Licensed under MIT License

module.exports = {
  plugins: [
    require('cssnano')({
      preset: [
        'default',
        {
          cssDeclarationSorter: false,
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyParams: true,
          minifyFontValues: true,
          reduceIdents: false,
          zindex: false,
        },
      ],
    }),
  ],
};
