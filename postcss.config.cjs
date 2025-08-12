/**
 * @fileoverview PostCSS 설정 - OKLCH 색상 시스템 지원 + CSS 최적화 (PurgeCSS는 opt-in)
 */

const autoprefixer = require('autoprefixer');
const postcssCustomProperties = require('postcss-custom-properties');

// 함수 형태의 설정으로 파일별 컨텍스트 활용
module.exports = ctx => {
  const isBuildWithPurge = process.env.BUILD_WITH_PURGECSS === '1';
  const file = ctx && ctx.file ? ctx.file : undefined;
  const fileName = file && (file.basename || file);
  const isCssModule = !!(fileName && /\.module\.css$/i.test(String(fileName)));

  const plugins = [
    // CSS Custom Properties (CSS 변수) 처리 (원본 유지)
    postcssCustomProperties({ preserve: true }),
    // 브라우저 접두사
    autoprefixer({
      overrideBrowserslist: ['>= 0.5%', 'last 2 major versions', 'Firefox ESR', 'not dead'],
    }),
  ];

  // PurgeCSS는 명시적으로 요청됐고, CSS Modules가 아닌 글로벌 CSS에만 적용
  if (isBuildWithPurge && !isCssModule) {
    try {
      let purgeFactory = require('@fullhuman/postcss-purgecss');
      purgeFactory = purgeFactory && purgeFactory.default ? purgeFactory.default : purgeFactory;

      plugins.push(
        purgeFactory({
          content: ['./src/**/*.{ts,tsx,js,jsx,html}', './index.html'],
          rejected: false,
          defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
          safelist: {
            standard: [
              /^xeg-/,
              /^toast/,
              /^toolbar/,
              /^gallery/,
              /^settings/,
              /^modal/,
              /^button/,
              /^overlay/,
              /^vertical/,
              'body',
              'html',
            ],
            deep: [
              /data-/,
              /aria-/,
              /:root/,
              /--xeg-/,
              /:hover/,
              /:focus/,
              /:active/,
              /:disabled/,
              /:checked/,
              /:before/,
              /:after/,
            ],
          },
          keyframes: false,
          variables: false,
        })
      );
    } catch (error) {
      console.warn('[PostCSS] PurgeCSS 로드 실패:', error && error.message ? error.message : error);
    }
  }

  return { plugins };
};
