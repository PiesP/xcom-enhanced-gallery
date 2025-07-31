/**
 * @fileoverview CSS 색상을 OKLCH로 변환하는 스크립트
 */

const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

const DESIGN_TOKENS_PATH = join(process.cwd(), 'src/shared/styles/design-tokens.css');
const BACKUP_PATH = join(process.cwd(), 'src/shared/styles/design-tokens.css.backup');

/**
 * 간단한 16진수 → OKLCH 변환 (주요 색상만)
 */
function hexToOklchSimple(hex) {
  // 주요 색상들의 사전 정의된 OKLCH 값
  const colorMap = {
    '#3b82f6': 'oklch(0.678 0.182 252.2)', // primary-500
    '#2563eb': 'oklch(0.623 0.210 252.8)', // primary-600
    '#1d4ed8': 'oklch(0.567 0.243 253.4)', // primary-700

    '#f5f5f5': 'oklch(0.970 0.002 206.2)', // neutral-100
    '#737373': 'oklch(0.598 0.006 286.3)', // neutral-500
    '#404040': 'oklch(0.378 0.005 286.3)', // neutral-700
    '#171717': 'oklch(0.234 0.006 277.8)', // neutral-900

    '#22c55e': 'oklch(0.725 0.170 142.5)', // success-500
    '#ef4444': 'oklch(0.628 0.257 27.3)', // error-500
    '#f59e0b': 'oklch(0.761 0.160 70.7)', // warning-500
    '#166534': 'oklch(0.456 0.133 145.2)', // success-800
    '#14532d': 'oklch(0.398 0.118 146.8)', // success-900
    '#052e16': 'oklch(0.241 0.077 150.0)', // success-950

    // Warning Orange 팔레트
    '#fffbeb': 'oklch(0.988 0.029 86.7)', // warning-50
    '#fef3c7': 'oklch(0.967 0.069 86.0)', // warning-100
    '#fde68a': 'oklch(0.928 0.108 85.4)', // warning-200
    '#fcd34d': 'oklch(0.878 0.142 82.8)', // warning-300
    '#fbbf24': 'oklch(0.825 0.151 78.2)', // warning-400
    '#d97706': 'oklch(0.685 0.156 65.8)', // warning-600
    '#b45309': 'oklch(0.576 0.149 58.8)', // warning-700
    '#92400e': 'oklch(0.489 0.142 52.4)', // warning-800
    '#78350f': 'oklch(0.427 0.133 47.7)', // warning-900
    '#451a03': 'oklch(0.273 0.104 40.9)', // warning-950

    // Error Red 팔레트
    '#fef2f2': 'oklch(0.971 0.013 17.4)', // error-50
    '#fee2e2': 'oklch(0.943 0.031 15.6)', // error-100
    '#fecaca': 'oklch(0.905 0.055 13.6)', // error-200
    '#fca5a5': 'oklch(0.852 0.089 12.0)', // error-300
    '#f87171': 'oklch(0.787 0.150 17.0)', // error-400
    '#dc2626': 'oklch(0.568 0.228 25.3)', // error-600
    '#b91c1c': 'oklch(0.498 0.208 25.9)', // error-700
    '#991b1b': 'oklch(0.447 0.190 26.2)', // error-800
    '#7f1d1d': 'oklch(0.402 0.172 26.5)', // error-900
    '#450a0a': 'oklch(0.261 0.119 26.8)', // error-950
  };

  return colorMap[hex.toLowerCase()] || hex;
}

/**
 * CSS 파일에서 16진수 색상을 OKLCH로 변환
 */
function convertCssToOklch(cssContent) {
  let convertedContent = cssContent;
  let conversionCount = 0;

  // 16진수 색상 패턴 매칭 (#ffffff, #fff 형태)
  const hexPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

  convertedContent = convertedContent.replace(hexPattern, match => {
    try {
      // 3자리 16진수를 6자리로 확장
      let normalizedHex = match;
      if (match.length === 4) {
        // #fff
        const hex = match.slice(1);
        normalizedHex = `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
      }

      const oklchColor = hexToOklchSimple(normalizedHex);

      if (oklchColor !== normalizedHex) {
        conversionCount++;
        console.log(`변환: ${match} → ${oklchColor}`);
        return oklchColor;
      }

      return match;
    } catch (error) {
      console.warn(`변환 실패: ${match}`, error);
      return match; // 변환 실패 시 원본 유지
    }
  });

  // 변환 통계 주석 추가
  const header = `/**
 * @fileoverview 통합 디자인 토큰 CSS (OKLCH 색상 시스템)
 * 총 ${conversionCount}개의 색상이 OKLCH로 변환되었습니다.
 * 생성일: ${new Date().toISOString()}
 */

`;

  // 기존 헤더 제거하고 새 헤더 추가
  convertedContent = convertedContent.replace(/^\/\*\*[\s\S]*?\*\/\s*\n/, '');
  convertedContent = header + convertedContent;

  return convertedContent;
}

/**
 * 변환된 CSS에 브라우저 호환성 코드 추가
 */
function addBrowserCompatibility(cssContent) {
  // @supports 규칙을 사용한 점진적 향상
  const supportsBlock = `
/* 브라우저 호환성을 위한 OKLCH 지원 감지 */
@supports not (color: oklch(0 0 0)) {
  :root {
    /* OKLCH를 지원하지 않는 브라우저용 RGB 폴백 */
    --xeg-color-primary-500: #3b82f6;
    --xeg-color-primary-600: #2563eb;
    --xeg-color-primary-700: #1d4ed8;
    
    --xeg-color-neutral-100: #f5f5f5;
    --xeg-color-neutral-500: #737373;
    --xeg-color-neutral-700: #404040;
    --xeg-color-neutral-900: #171717;
    
    --xeg-color-success-500: #22c55e;
    --xeg-color-success-800: #166534;
    --xeg-color-success-900: #14532d;
    --xeg-color-success-950: #052e16;
    --xeg-color-error-500: #ef4444;
    --xeg-color-warning-500: #f59e0b;
    
    /* Warning Orange 폴백 */
    --xeg-color-warning-50: #fffbeb;
    --xeg-color-warning-100: #fef3c7;
    --xeg-color-warning-200: #fde68a;
    --xeg-color-warning-300: #fcd34d;
    --xeg-color-warning-400: #fbbf24;
    --xeg-color-warning-600: #d97706;
    --xeg-color-warning-700: #b45309;
    --xeg-color-warning-800: #92400e;
    --xeg-color-warning-900: #78350f;
    --xeg-color-warning-950: #451a03;
    
    /* Error Red 폴백 */
    --xeg-color-error-50: #fef2f2;
    --xeg-color-error-100: #fee2e2;
    --xeg-color-error-200: #fecaca;
    --xeg-color-error-300: #fca5a5;
    --xeg-color-error-400: #f87171;
    --xeg-color-error-600: #dc2626;
    --xeg-color-error-700: #b91c1c;
    --xeg-color-error-800: #991b1b;
    --xeg-color-error-900: #7f1d1d;
    --xeg-color-error-950: #450a0a;
  }
}
`;

  return cssContent + supportsBlock;
}

/**
 * 메인 변환 함수
 */
function main() {
  try {
    console.log('🎨 CSS 색상을 OKLCH로 변환 시작...');

    // 원본 파일 읽기
    const originalContent = readFileSync(DESIGN_TOKENS_PATH, 'utf8');

    // 백업 생성
    writeFileSync(BACKUP_PATH, originalContent);
    console.log(`✅ 백업 생성: ${BACKUP_PATH}`);

    // OKLCH로 변환
    let convertedContent = convertCssToOklch(originalContent);

    // 브라우저 호환성 코드 추가
    convertedContent = addBrowserCompatibility(convertedContent);

    // 변환된 파일 저장
    writeFileSync(DESIGN_TOKENS_PATH, convertedContent);

    console.log('✅ 색상 변환 완료!');
    console.log(`📁 변환된 파일: ${DESIGN_TOKENS_PATH}`);
    console.log(`📁 백업 파일: ${BACKUP_PATH}`);

    // 변환 결과 검증
    const oklchCount = (convertedContent.match(/oklch\(/g) || []).length;
    console.log(`🎯 총 ${oklchCount}개의 OKLCH 색상이 생성되었습니다.`);
  } catch (error) {
    console.error('❌ 색상 변환 실패:', error);

    // 오류 발생 시 백업에서 복원
    if (existsSync(BACKUP_PATH)) {
      const backupContent = readFileSync(BACKUP_PATH, 'utf8');
      writeFileSync(DESIGN_TOKENS_PATH, backupContent);
      console.log('🔄 백업에서 원본 파일 복원');
    }

    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { convertCssToOklch, addBrowserCompatibility };
