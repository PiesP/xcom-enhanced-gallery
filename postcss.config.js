/**
 * @fileoverview PostCSS 설정 - OKLCH 색상 시스템 지원
 */

import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';

/** @type {import('postcss').Config} */
const config = {
  plugins: [
    // CSS Custom Properties (CSS 변수) 처리
    postcssCustomProperties({
      preserve: true, // 원본 CSS 변수 유지
    }),

    // 브라우저 호환성을 위한 자동 접두사
    autoprefixer({
      overrideBrowserslist: ['>= 0.5%', 'last 2 major versions', 'Firefox ESR', 'not dead'],
    }),
  ],
};

export default config;
