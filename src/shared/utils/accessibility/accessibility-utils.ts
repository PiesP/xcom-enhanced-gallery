/**
 * @fileoverview Accessibility Utilities
 * @description 접근성 관련 유틸리티 함수들 (WCAG 대비 비율 계산 등)
 */

/**
 * 안전한 숫자 파싱
 */
function safeParseInt(value: string | undefined, radix: number): number {
  if (!value) return 0;
  const parsed = parseInt(value, radix);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 상대 휘도를 계산합니다.
 * WCAG 2.1 기준을 따릅니다.
 *
 * @param r - 빨간색 값 (0-255)
 * @param g - 녹색 값 (0-255)
 * @param b - 파란색 값 (0-255)
 * @returns 상대 휘도 값 (0-1)
 *
 * @example
 * ```typescript
 * const luminance = getRelativeLuminance(255, 255, 255); // 1 (흰색)
 * const darkLuminance = getRelativeLuminance(0, 0, 0);   // 0 (검정색)
 * ```
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rNorm, gNorm, bNorm] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * (rNorm ?? 0) + 0.7152 * (gNorm ?? 0) + 0.0722 * (bNorm ?? 0);
}

/**
 * CSS 색상 문자열에서 RGB 값을 추출합니다.
 *
 * @param color - CSS 색상 문자열 (rgb, rgba, hex 형식 지원)
 * @returns RGB 값 배열 [r, g, b] 또는 null (파싱 실패 시)
 *
 * @example
 * ```typescript
 * const rgb1 = parseColor('rgb(255, 0, 0)');        // [255, 0, 0]
 * const rgb2 = parseColor('rgba(0, 255, 0, 0.5)');  // [0, 255, 0]
 * const rgb3 = parseColor('#0000ff');               // [0, 0, 255]
 * ```
 */
export function parseColor(color: string): [number, number, number] | null {
  // RGB/RGBA 형식
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      safeParseInt(rgbMatch[1], 10),
      safeParseInt(rgbMatch[2], 10),
      safeParseInt(rgbMatch[3], 10),
    ];
  }

  // HEX 형식
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      safeParseInt(hexMatch[1], 16),
      safeParseInt(hexMatch[2], 16),
      safeParseInt(hexMatch[3], 16),
    ];
  }

  // 3자리 HEX 형식
  const shortHexMatch = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return [
      safeParseInt((shortHexMatch[1] ?? '') + (shortHexMatch[1] ?? ''), 16),
      safeParseInt((shortHexMatch[2] ?? '') + (shortHexMatch[2] ?? ''), 16),
      safeParseInt((shortHexMatch[3] ?? '') + (shortHexMatch[3] ?? ''), 16),
    ];
  }

  // 기본 색상명
  const namedColors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    transparent: [255, 255, 255], // 투명은 흰색으로 처리
  };

  const lowerColor = color.toLowerCase();
  return namedColors[lowerColor] || null;
}

/**
 * 두 색상 간의 대비 비율을 계산합니다.
 * WCAG 2.1 기준을 따릅니다.
 *
 * @param foreground - 전경색 (CSS 색상 문자열)
 * @param background - 배경색 (CSS 색상 문자열)
 * @returns 대비 비율 (1:1 ~ 21:1)
 *
 * @example
 * ```typescript
 * const ratio1 = calculateContrastRatio('black', 'white');     // 21
 * const ratio2 = calculateContrastRatio('#000000', '#ffffff'); // 21
 * const ratio3 = calculateContrastRatio('rgb(0,0,0)', 'rgb(255,255,255)'); // 21
 * ```
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) {
    return 1; // 파싱 실패 시 최소 대비
  }

  const fgLuminance = getRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
  const bgLuminance = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA 기준 (4.5:1)을 만족하는지 확인합니다.
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns WCAG AA 기준 만족 여부
 *
 * @example
 * ```typescript
 * const isAccessible = meetsWCAGAA('black', 'white'); // true
 * const isNotAccessible = meetsWCAGAA('#ccc', 'white'); // false
 * ```
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 4.5;
}

/**
 * WCAG AAA 기준 (7:1)을 만족하는지 확인합니다.
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns WCAG AAA 기준 만족 여부
 *
 * @example
 * ```typescript
 * const isAAA = meetsWCAGAAA('black', 'white'); // true
 * const isNotAAA = meetsWCAGAAA('#666', 'white'); // false
 * ```
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 7;
}

/**
 * 주어진 요소의 실제 배경색을 감지합니다.
 * 투명한 배경의 경우 부모 요소까지 검사합니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns 실제 배경색 (CSS 색상 문자열)
 */
export function detectActualBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const bgColor = style.backgroundColor;

    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      return bgColor;
    }

    current = current.parentElement;
  }

  return 'rgb(255, 255, 255)'; // 기본값: 흰색
}

/**
 * 밝은 배경인지 어두운 배경인지 감지합니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns true면 밝은 배경, false면 어두운 배경
 */
export function detectLightBackground(element: HTMLElement): boolean {
  const bgColor = detectActualBackgroundColor(element);
  const rgb = parseColor(bgColor);

  if (!rgb) return true; // 기본값: 밝은 배경

  const luminance = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
  return luminance > 0.5;
}

/**
 * 키보드 탐색 지원
 * WCAG 2.1.1 Keyboard
 */
export function enableKeyboardNavigation(container: HTMLElement): void {
  container.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const focusableElements = container.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });
}

/**
 * 스크린 리더용 텍스트 추가
 * WCAG 4.1.2 Screen Reader Support
 */
export function addScreenReaderText(element: HTMLElement, text: string): void {
  const srText = document.createElement('span');
  srText.className = 'sr-only';
  srText.textContent = text;
  srText.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  element.appendChild(srText);
}

/**
 * ARIA 레이블 설정
 * WCAG 4.1.2 Name, Role, Value
 */
export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

/**
 * ARIA 역할 설정
 * WCAG 4.1.2 Name, Role, Value
 */
export function setAriaRole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}

/**
 * 포커스 관리
 * WCAG 2.4.7 Focus Visible
 */
export function manageFocus(element: HTMLElement): void {
  element.setAttribute('tabindex', '0');
  element.focus();
}

/**
 * 라이브 영역 설정
 * WCAG 4.1.3 Status Messages
 */
export function setAriaLive(
  element: HTMLElement,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  element.setAttribute('aria-live', politeness);
}

/**
 * 대조비 검증
 * WCAG 1.4.3 Contrast (Minimum)
 */
export function validateContrast(foreground: string, background: string): boolean {
  const contrastRatio = calculateContrastRatio(foreground, background);
  return contrastRatio >= 4.5; // WCAG AA 기준
}

/**
 * 키보드 접근성 검증
 * WCAG 2.1.1 Keyboard
 */
export function validateKeyboardAccess(element: HTMLElement): boolean {
  return element.tabIndex >= 0 || element.getAttribute('tabindex') === '0';
}

/**
 * 스크린 리더 호환성 검증
 * WCAG 4.1.2 Screen Reader Compatible
 */
export function validateScreenReaderSupport(element: HTMLElement): boolean {
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
  const hasRole = element.hasAttribute('role');

  return hasAriaLabel || hasAriaDescribedBy || hasRole;
}

/**
 * 네비게이션 랜드마크 설정
 * WCAG 2.4.1 Bypass Blocks
 */
export function createNavigationLandmark(element: HTMLElement, type = 'navigation'): void {
  element.setAttribute('role', type);
  element.setAttribute('aria-label', `${type} 영역`);
}

/**
 * 라이브 영역 공지
 * WCAG 4.1.3 Status Messages
 */
export function announceLiveMessage(message: string, politeness = 'polite'): void {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', politeness);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.cssText =
    'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';

  document.body.appendChild(liveRegion);
  liveRegion.textContent = message;

  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
}

/**
 * 대체 텍스트 검증
 * WCAG 1.1.1 Non-text Content
 */
export function validateAltTextQuality(altText: string, imageType = 'informative'): boolean {
  if (imageType === 'decorative') {
    return altText === '';
  }

  return altText.length > 0 && altText.length <= 125;
}

/**
 * 포커스 트랩 설정
 * WCAG 2.4.3 Focus Order
 */
export function createFocusTrap(container: HTMLElement): void {
  const focusableElements = container.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  container.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });
}

/**
 * 아토믹 업데이트 설정
 * WCAG 4.1.3 Status Messages
 */
export function setAriaAtomic(element: HTMLElement, atomic = true): void {
  element.setAttribute('aria-atomic', atomic.toString());
}

/**
 * 설명 텍스트 연결
 * WCAG 3.3.2 Labels or Instructions
 */
export function setAriaDescription(element: HTMLElement, descriptionId: string): void {
  element.setAttribute('aria-describedby', descriptionId);
}

/**
 * 대조비 분석 도구
 * WCAG 1.4.3 Contrast Analysis
 */
export function analyzeContrast(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const foreground = styles.color;
  const background = styles.backgroundColor;

  return calculateContrastRatio(foreground, background);
}

/**
 * 휘도 계산
 * WCAG 1.4.3 Luminance Calculation
 */
export function calculateLuminance(rgb: number[]): number {
  return getRelativeLuminance(rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0);
}

/**
 * 네비게이션 구조 검증
 * WCAG 2.4.1 Navigation Structure
 */
export function validateNavigationStructure(container: HTMLElement): boolean {
  const landmarks = container.querySelectorAll('[role="navigation"], nav');
  return landmarks.length > 0;
}

/**
 * 라이브 영역 초기화
 * WCAG 4.1.3 Live Region Initialization
 */
export function initializeLiveRegion(element: HTMLElement): void {
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'false');
}

/**
 * 키보드 트랩 해제
 * WCAG 2.1.2 No Keyboard Trap
 */
export function releaseKeyboardTrap(container: HTMLElement): void {
  container.removeAttribute('tabindex');
  const focusableElements = container.querySelectorAll('[tabindex]');
  focusableElements.forEach(el => {
    if (el.getAttribute('tabindex') === '0') {
      el.removeAttribute('tabindex');
    }
  });
}

/**
 * 스크린 리더 알림
 * WCAG 4.1.2 Screen Reader Notification
 */
export function notifyScreenReader(message: string): void {
  announceLiveMessage(message, 'assertive');
}

/**
 * 레이블 연결
 * WCAG 3.3.2 Label Association
 */
export function associateLabel(inputElement: HTMLElement, labelElement: HTMLElement): void {
  const labelId = labelElement.id || `label-${Date.now()}`;
  labelElement.id = labelId;
  inputElement.setAttribute('aria-labelledby', labelId);
}

/**
 * 포커스 표시 강화
 * WCAG 2.4.7 Focus Visible Enhancement
 */
export function enhanceFocusVisibility(element: HTMLElement): void {
  // CSS 변수를 통한 동적 스타일 적용
  element.style.outline = 'var(--xeg-focus-outline)';
  element.style.outlineOffset = 'var(--xeg-focus-ring-offset)';

  // CSS 변수가 없는 경우를 위한 폴백
  if (!element.style.outline.includes('var(')) {
    element.style.outline = '2px solid #005fcc';
    element.style.outlineOffset = '2px';
  }
}

/**
 * 대조 비율 테스트
 * WCAG 1.4.3 Contrast Ratio Testing
 */
export function testContrastRatio(foreground: string, background: string): boolean {
  return validateContrast(foreground, background);
}

/**
 * WCAG Level 검증 함수들
 */
export function isWCAGAACompliant(ratio: number): boolean {
  return ratio >= 4.5;
}

export function isWCAGAAACompliant(ratio: number): boolean {
  return ratio >= 7;
}

export function isWCAGLargeTextAACompliant(ratio: number): boolean {
  return ratio >= 3;
}

export function isWCAGLargeTextAAACompliant(ratio: number): boolean {
  return ratio >= 4.5;
}

/**
 * WCAG 표준 레이블 설정 함수들
 */
export function setAccessibleName(element: HTMLElement, name: string): void {
  element.setAttribute('aria-label', name);
}

export function setAccessibleDescription(element: HTMLElement, description: string): void {
  element.setAttribute('aria-describedby', description);
}

export function setAccessibleExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setAccessiblePressed(element: HTMLElement, pressed: boolean): void {
  element.setAttribute('aria-pressed', pressed.toString());
}

export function setAccessibleSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString());
}

export function setAccessibleChecked(element: HTMLElement, checked: boolean): void {
  element.setAttribute('aria-checked', checked.toString());
}

export function setAccessibleHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', hidden.toString());
}

export function setAccessibleDisabled(element: HTMLElement, disabled: boolean): void {
  element.setAttribute('aria-disabled', disabled.toString());
}

export function setAccessibleRequired(element: HTMLElement, required: boolean): void {
  element.setAttribute('aria-required', required.toString());
}

export function setAccessibleInvalid(element: HTMLElement, invalid: boolean): void {
  element.setAttribute('aria-invalid', invalid.toString());
}

/**
 * WCAG 색상 대비 검증 표준 함수들
 */
export function validateColorContrast(
  foreground: string,
  background: string
): {
  ratio: number;
  isAACompliant: boolean;
  isAAACompliant: boolean;
  isLargeTextAACompliant: boolean;
  isLargeTextAAACompliant: boolean;
} {
  const ratio = calculateContrastRatio(foreground, background);
  return {
    ratio,
    isAACompliant: isWCAGAACompliant(ratio),
    isAAACompliant: isWCAGAAACompliant(ratio),
    isLargeTextAACompliant: isWCAGLargeTextAACompliant(ratio),
    isLargeTextAAACompliant: isWCAGLargeTextAAACompliant(ratio),
  };
}

/**
 * WCAG 키보드 네비게이션 표준 함수들
 */
export function enableWCAGKeyboardNavigation(element: HTMLElement): void {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }

  element.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      element.click();
    }
  });
}

export function disableKeyboardNavigation(element: HTMLElement): void {
  element.setAttribute('tabindex', '-1');
}

export function isFocusable(element: HTMLElement): boolean {
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null) {
    return parseInt(tabindex) >= 0;
  }

  const focusableElements = ['input', 'button', 'select', 'textarea', 'a'];
  return focusableElements.includes(element.tagName.toLowerCase());
}

/**
 * WCAG 구조적 마크업 표준 함수들
 */
export function setLandmarkRole(element: HTMLElement, role: string): void {
  const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'region'];
  if (landmarkRoles.includes(role)) {
    element.setAttribute('role', role);
  }
}

export function setHeadingLevel(element: HTMLElement, level: number): void {
  if (level >= 1 && level <= 6) {
    element.setAttribute('aria-level', level.toString());
    if (element.tagName.toLowerCase() !== `h${level}`) {
      element.setAttribute('role', 'heading');
    }
  }
}

export function isValidHeadingStructure(container: HTMLElement): boolean {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
  let previousLevel = 0;

  for (const heading of Array.from(headings)) {
    const tagMatch = heading.tagName.match(/^H(\d)$/);
    const ariaLevel = heading.getAttribute('aria-level');
    const level = tagMatch ? parseInt(tagMatch[1] ?? '1') : ariaLevel ? parseInt(ariaLevel) : 1;

    if (level > previousLevel + 1) {
      return false; // 레벨이 건너뛰어졌음
    }
    previousLevel = level;
  }

  return true;
}

/**
 * 추가 WCAG 표준 용어 함수들
 */
export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}

export function announceUrgentToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}

export function setARIALabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

export function setARIADescribedBy(element: HTMLElement, id: string): void {
  element.setAttribute('aria-describedby', id);
}

export function setARIALabelledBy(element: HTMLElement, id: string): void {
  element.setAttribute('aria-labelledby', id);
}

export function setARIAExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', expanded.toString());
}

export function setARIAPressed(element: HTMLElement, pressed: boolean): void {
  element.setAttribute('aria-pressed', pressed.toString());
}

export function setARIASelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', selected.toString());
}

export function setARIAChecked(element: HTMLElement, checked: boolean): void {
  element.setAttribute('aria-checked', checked.toString());
}

export function setARIAHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', hidden.toString());
}

export function setARIADisabled(element: HTMLElement, disabled: boolean): void {
  element.setAttribute('aria-disabled', disabled.toString());
}

export function setARIARequired(element: HTMLElement, required: boolean): void {
  element.setAttribute('aria-required', required.toString());
}

export function setARIAInvalid(element: HTMLElement, invalid: boolean): void {
  element.setAttribute('aria-invalid', invalid.toString());
}

export function setARIARole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}

export function setARIALive(
  element: HTMLElement,
  politeness: 'off' | 'polite' | 'assertive'
): void {
  element.setAttribute('aria-live', politeness);
}

export function setARIAAtomic(element: HTMLElement, atomic: boolean): void {
  element.setAttribute('aria-atomic', atomic.toString());
}

export function setARIABusy(element: HTMLElement, busy: boolean): void {
  element.setAttribute('aria-busy', busy.toString());
}

export function setARIAControls(element: HTMLElement, controls: string): void {
  element.setAttribute('aria-controls', controls);
}

export function setARIAOwns(element: HTMLElement, owns: string): void {
  element.setAttribute('aria-owns', owns);
}

export function setARIAFlowTo(element: HTMLElement, flowto: string): void {
  element.setAttribute('aria-flowto', flowto);
}

export function setARIADropEffect(element: HTMLElement, effect: string): void {
  element.setAttribute('aria-dropeffect', effect);
}

export function setARIAGrabbed(element: HTMLElement, grabbed: boolean): void {
  element.setAttribute('aria-grabbed', grabbed.toString());
}

export function setARIAHasPopup(element: HTMLElement, haspopup: boolean | string): void {
  element.setAttribute('aria-haspopup', haspopup.toString());
}

export function setARIALevel(element: HTMLElement, level: number): void {
  element.setAttribute('aria-level', level.toString());
}

export function setARIAMultiline(element: HTMLElement, multiline: boolean): void {
  element.setAttribute('aria-multiline', multiline.toString());
}

export function setARIAMultiselectable(element: HTMLElement, multiselectable: boolean): void {
  element.setAttribute('aria-multiselectable', multiselectable.toString());
}

export function setARIAOrientation(
  element: HTMLElement,
  orientation: 'horizontal' | 'vertical'
): void {
  element.setAttribute('aria-orientation', orientation);
}

export function setARIAReadonly(element: HTMLElement, readonly: boolean): void {
  element.setAttribute('aria-readonly', readonly.toString());
}

export function setARIARelevant(element: HTMLElement, relevant: string): void {
  element.setAttribute('aria-relevant', relevant);
}

export function setARIASort(element: HTMLElement, sort: string): void {
  element.setAttribute('aria-sort', sort);
}

export function setARIAValuemax(element: HTMLElement, valuemax: number): void {
  element.setAttribute('aria-valuemax', valuemax.toString());
}

export function setARIAValuemin(element: HTMLElement, valuemin: number): void {
  element.setAttribute('aria-valuemin', valuemin.toString());
}

export function setARIAValuenow(element: HTMLElement, valuenow: number): void {
  element.setAttribute('aria-valuenow', valuenow.toString());
}

export function setARIAValuetext(element: HTMLElement, valuetext: string): void {
  element.setAttribute('aria-valuetext', valuetext);
}
