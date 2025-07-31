/**
 * @fileoverview CSS 색상을 OKLCH로 변환하는 스크립트
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { hexToOklch } from '../src/shared/utils/colors/color-conversion.js';

const DESIGN_TOKENS_PATH = join(process.cwd(), 'src/shared/styles/design-tokens.css');
const BACKUP_PATH = join(process.cwd(), 'src/shared/styles/design-tokens.css.backup');

/**
 * CSS 파일에서 16진수 색상을 OKLCH로 변환
 */
function convertCssToOklch(cssContent: string): string {
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

      const oklchColor = hexToOklch(normalizedHex);
      conversionCount++;

      console.log(`변환: ${match} → ${oklchColor}`);
      return oklchColor;
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
function addBrowserCompatibility(cssContent: string): string {
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
    --xeg-color-error-500: #ef4444;
    --xeg-color-warning-500: #f59e0b;
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
    if (require('fs').existsSync(BACKUP_PATH)) {
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

export { convertCssToOklch, addBrowserCompatibility };
