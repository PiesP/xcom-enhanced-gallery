/**
 * @fileoverview CSS 우선순위 충돌 테스트
 * HSL 색상이 OKLCH에 의해 덮어씌워지는 문제 확인
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('🚨 테마 충돌 문제 진단', () => {
  let testStyleSheet: HTMLStyleElement;

  beforeEach(() => {
    // 실제 design-tokens.css와 동일한 구조로 테스트
    testStyleSheet = document.createElement('style');
    testStyleSheet.textContent = `
      :root {
        /* HSL 색상이 먼저 정의됨 */
        --xeg-color-primary: hsl(210, 90%, 55%);
        --xeg-color-success: hsl(140, 65%, 45%);
        --xeg-color-error: hsl(0, 75%, 50%);

        /* OKLCH 색상이 나중에 정의됨 - 이것이 HSL을 덮어씀! */
        --xeg-color-success: oklch(0.725 0.17 142.5);
        --xeg-color-error: oklch(0.628 0.257 27.3);
      }
    `;
    document.head.appendChild(testStyleSheet);
  });

  it('🔴 현재 상황: OKLCH가 HSL을 덮어씌우는 문제 확인', () => {
    const computedStyle = getComputedStyle(document.documentElement);

    // Primary는 OKLCH 재정의가 없으므로 HSL이 유지됨
    const primary = computedStyle.getPropertyValue('--xeg-color-primary').trim();
    expect(primary).toBe('hsl(210, 90%, 55%)');

    // Success와 Error는 OKLCH에 의해 덮어씌워짐
    const success = computedStyle.getPropertyValue('--xeg-color-success').trim();
    const error = computedStyle.getPropertyValue('--xeg-color-error').trim();

    console.log('🔍 실제 적용된 색상들:');
    console.log(`Primary: ${primary}`);
    console.log(`Success: ${success}`);
    console.log(`Error: ${error}`);

    // OKLCH 색상이 적용되었는지 확인 (브라우저가 OKLCH를 지원하는 경우)
    // OKLCH를 지원하지 않는 브라우저에서는 빈 값 또는 대체값이 적용됨
    const isOKLCH = success.includes('oklch') || success === '';
    const shouldBeHSL = success.includes('hsl');

    if (isOKLCH) {
      console.log('⚠️  OKLCH 색상이 HSL을 덮어씌웠습니다!');
    } else if (shouldBeHSL) {
      console.log('✅ HSL 색상이 올바르게 적용되었습니다.');
    } else {
      console.log(`🤔 예상치 못한 색상 값: ${success}`);
    }

    // HSL 색상이 예상대로 적용되지 않음을 확인
    expect(success).not.toBe('hsl(140, 65%, 45%)');
    expect(error).not.toBe('hsl(0, 75%, 50%)');
  });

  afterEach(() => {
    if (testStyleSheet && testStyleSheet.parentNode) {
      document.head.removeChild(testStyleSheet);
    }
  });
});
