/**
 * @fileoverview PostCSS 설정 - OKLCH 색상 시스템 지원
 */

/* global process */
import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import cssnano from 'cssnano';

/** @type {import('postcss').Config} */
const isProd = process.env.NODE_ENV === 'production';

const config = {
  plugins: [
    postcssCustomProperties({ preserve: true }),
    autoprefixer({
      overrideBrowserslist: ['>= 0.5%', 'last 2 major versions', 'Firefox ESR', 'not dead'],
    }),
    ...(isProd ? [cssnano({ preset: 'default' })] : []),
  ],
};

export default config;
