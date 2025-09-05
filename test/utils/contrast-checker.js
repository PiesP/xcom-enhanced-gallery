/**
 * @fileoverview 접근성 대비 체크 유틸리티
 * @description OKLCH 색상값에서 명도 대비비를 자동 계산
 */

/**
 * OKLCH 색상 문자열에서 lightness 값 추출
 */
export function extractLightness(oklchString) {
  const match = oklchString.match(/oklch\(\s*([0-9.]+)/);
  if (!match) {
    throw new Error(`Invalid OKLCH format: ${oklchString}`);
  }
  return parseFloat(match[1]);
}

/**
 * Lightness 값에서 상대 명도 계산 (간단한 근사)
 * OKLCH의 L값은 이미 0-1 범위의 상대 명도를 나타냄
 */
export function lightnessToRelativeLuminance(lightness) {
  // OKLCH의 L값은 이미 인지 명도를 반영하므로 직접 사용
  return lightness;
}

/**
 * 두 색상 간의 대비비 계산
 * @param {string} color1 OKLCH 색상 문자열
 * @param {string} color2 OKLCH 색상 문자열
 * @returns {{ratio: number, level: string, passes: boolean}}
 */
export function calculateContrastRatio(color1, color2) {
  const l1 = extractLightness(color1);
  const l2 = extractLightness(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  // WCAG 대비비 공식: (L1 + 0.05) / (L2 + 0.05)
  const ratio = (lighter + 0.05) / (darker + 0.05);

  let level;
  let passes;

  if (ratio >= 7) {
    level = 'AAA';
    passes = true;
  } else if (ratio >= 4.5) {
    level = 'AA';
    passes = true;
  } else {
    level = 'FAIL';
    passes = false;
  }

  return { ratio, level, passes };
}

/**
 * 다중 색상 조합 대비 체크
 * @param {string} component 컴포넌트 이름
 * @param {Array} colorCombinations 색상 조합 배열
 * @returns {{component: string, combinations: Array}}
 */
export function checkComponentContrast(component, colorCombinations) {
  const combinations = colorCombinations.map(combo => ({
    ...combo,
    result: calculateContrastRatio(combo.foreground, combo.background),
  }));

  return {
    component,
    combinations,
  };
}

/**
 * 테스트용 색상 조합 생성기
 */
export const testColorCombinations = {
  toolbar: [
    {
      name: 'toolbar-text-on-background',
      foreground: 'oklch(0.9 0.005 286.3)', // 밝은 텍스트
      background: 'oklch(0.234 0.006 277.8)', // 어두운 배경
    },
    {
      name: 'toolbar-button-text',
      foreground: 'oklch(0.95 0.002 206.2)', // 흰색 텍스트
      background: 'oklch(0.676 0.151 237.8)', // 파란 버튼
    },
  ],
  modal: [
    {
      name: 'modal-text-on-background',
      foreground: 'oklch(0.234 0.006 277.8)', // 어두운 텍스트
      background: 'oklch(0.97 0.002 206.2)', // 밝은 배경
    },
    {
      name: 'modal-primary-button',
      foreground: 'oklch(0.97 0.002 206.2)', // 흰색 텍스트
      background: 'oklch(0.676 0.151 237.8)', // 파란 버튼
    },
  ],
  toast: [
    {
      name: 'info-toast-text',
      foreground: 'oklch(0.676 0.151 237.8)', // 파란 텍스트
      background: 'oklch(0.95 0.05 237.8)', // 밝은 파란 배경
    },
    {
      name: 'error-toast-text',
      foreground: 'oklch(0.628 0.257 27.3)', // 빨간 텍스트
      background: 'oklch(0.971 0.013 17.4)', // 밝은 빨간 배경
    },
  ],
};
