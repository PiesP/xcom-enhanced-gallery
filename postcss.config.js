/**
 * @fileoverview PostCSS 설정 - OKLCH 색상 시스템 지원
 */

import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssOKLCHFunction from '@csstools/postcss-oklab-function';
import cssnano from 'cssnano';

/** @type {import('postcss').Config} */
const isProd = process.env.NODE_ENV === 'production';

const config = {
  plugins: [
    // OKLCH 색상 폴백 자동 생성 (구형 브라우저 지원)
    postcssOKLCHFunction({
      preserve: !isProd, // dev에선 유지, prod에선 수치형으로 방출
      enableProgressiveCustomProperties: true, // CSS 변수 내부도 변환
    }),
    // CSS 변수 폴백 생성 (IE11 부분 지원)
    postcssCustomProperties({ preserve: true }),
    // 벤더 프리픽스 자동 추가
    autoprefixer({
      overrideBrowserslist: ['>= 0.5%', 'last 2 major versions', 'Firefox ESR', 'not dead'],
    }),
    // 프로덕션 압축
    ...(isProd ? [cssnano({ preset: 'default' })] : []),
  ],
};

export default config;
