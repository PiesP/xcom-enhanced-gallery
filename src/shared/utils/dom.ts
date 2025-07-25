/**
 * @fileoverview 통합 DOM 유틸리티
 * @version 3.0.0 - Phase 3: 파일 통합
 *
 * 모든 DOM 관련 유틸리티를 하나로 통합:
 * - dom-utils.ts (DOM 조작)
 * - css-selector-validator.ts (CSS 선택자)
 * - core-utils.ts (접근성)
 */

// ================================
// DOM 조작 및 쿼리
// ================================

/**
 * 갤러리 내부 요소인지 확인
 */
export function isInsideGallery(element: HTMLElement | null): boolean {
  if (!element) return false;

  const gallerySelectors = [
    '.xeg-gallery-container',
    '[data-gallery-element]',
    '#xeg-gallery-root',
    '.vertical-gallery-view',
    '[data-xeg-gallery-container]',
    '[data-xeg-gallery]',
    '.xeg-vertical-gallery',
    '[data-xeg-role="gallery"]',
  ];

  return gallerySelectors.some(selector => {
    try {
      return element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * 갤러리 컨테이너인지 확인
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  return (
    element.classList.contains('xeg-gallery-container') ||
    element.hasAttribute('data-xeg-gallery-container') ||
    element.id === 'xeg-gallery-root'
  );
}

/**
 * 갤러리 내부 이벤트인지 확인
 */
export function isGalleryInternalEvent(event: MouseEvent): boolean {
  const target = event.target as HTMLElement | null;
  return isInsideGallery(target);
}

/**
 * 갤러리 이벤트를 차단해야 하는지 확인
 */
export function shouldBlockGalleryEvent(event: MouseEvent): boolean {
  return isGalleryInternalEvent(event);
}

/**
 * 안전한 querySelector
 */
export function safeQuerySelector<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T | null {
  try {
    return parent.querySelector<T>(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * 안전한 querySelectorAll
 */
export function safeQuerySelectorAll<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T[] {
  try {
    return Array.from(parent.querySelectorAll<T>(selector));
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return [];
  }
}

/**
 * IntersectionObserver 생성
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('IntersectionObserver not supported');
    return null;
  }

  try {
    return new IntersectionObserver(callback, options);
  } catch (error) {
    console.error('Failed to create IntersectionObserver:', error);
    return null;
  }
}

/**
 * MutationObserver 생성
 */
export function createMutationObserver(
  callback: MutationCallback,
  _options?: MutationObserverInit
): MutationObserver | null {
  if (typeof MutationObserver === 'undefined') {
    console.warn('MutationObserver not supported');
    return null;
  }

  try {
    return new MutationObserver(callback);
  } catch (error) {
    console.error('Failed to create MutationObserver:', error);
    return null;
  }
}

/**
 * 안전한 속성 값 가져오기
 */
export function safeGetAttribute(element: Element | null, attribute: string): string | null {
  try {
    return element?.getAttribute(attribute) ?? null;
  } catch {
    return null;
  }
}

/**
 * 안전한 속성 설정
 */
export function safeSetAttribute(
  element: Element | null,
  attribute: string,
  value: string
): boolean {
  try {
    element?.setAttribute(attribute, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 안전한 클래스 추가
 */
export function safeAddClass(element: Element | null, className: string): boolean {
  try {
    element?.classList.add(className);
    return true;
  } catch {
    return false;
  }
}

/**
 * 안전한 클래스 제거
 */
export function safeRemoveClass(element: Element | null, className: string): boolean {
  try {
    element?.classList.remove(className);
    return true;
  } catch {
    return false;
  }
}

/**
 * 안전한 스타일 설정
 */
export function safeSetStyle(
  element: HTMLElement | null,
  property: string,
  value: string
): boolean {
  try {
    if (element?.style) {
      element.style.setProperty(property, value);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 안전한 요소 제거
 */
export function safeRemoveElement(element: Element | null): boolean {
  try {
    element?.remove();
    return true;
  } catch {
    return false;
  }
}

/**
 * 안전한 이벤트 리스너 추가
 */
export function safeAddEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): boolean {
  try {
    element?.addEventListener(type, listener, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * 안전한 이벤트 리스너 제거
 */
export function safeRemoveEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | null,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): boolean {
  try {
    element?.removeEventListener(type, listener, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * 요소가 DOM에 연결되어 있는지 확인
 */
export function isElementConnected(element: Element | null): boolean {
  return element?.isConnected ?? false;
}

/**
 * 안전한 getBoundingClientRect
 */
export function safeGetBoundingClientRect(element: Element | null): DOMRect | null {
  try {
    return element?.getBoundingClientRect() ?? null;
  } catch {
    return null;
  }
}

// ================================
// CSS 선택자 검증
// ================================

/**
 * CSS 선택자 유효성 검증
 */
export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * 속성 선택자 파싱
 */
export function parseAttributeSelector(selector: string): {
  attribute: string;
  operator: string;
  value: string;
} | null {
  const attributePattern = /\[([^=~|^$*]+)([*^$~|]?=)"?([^"]+)"?\]/;
  const match = selector.match(attributePattern);

  if (!match?.[1] || !match?.[3]) {
    return null;
  }

  return {
    attribute: match[1].trim(),
    operator: match[2] || '=',
    value: match[3].trim(),
  };
}

/**
 * 첫 번째 매칭 선택자 찾기
 */
export function findFirstMatchingSelector(
  selectors: string[],
  testElement: Element
): string | null {
  for (const selector of selectors) {
    if (isValidCSSSelector(selector) && testElement.matches(selector)) {
      return selector;
    }
  }
  return null;
}

/**
 * 선택자 복잡도 측정
 */
export function calculateSelectorComplexity(selector: string): number {
  let complexity = 0;

  // 기본 요소 선택자
  complexity += (selector.match(/^\w+/) || []).length;

  // ID 선택자
  complexity += (selector.match(/#\w+/g) || []).length * 100;

  // 클래스 선택자
  complexity += (selector.match(/\.\w+/g) || []).length * 10;

  // 속성 선택자
  complexity += (selector.match(/\[[^\]]+\]/g) || []).length * 10;

  // 가상 선택자
  complexity += (selector.match(/:[^:][^,\s]*/g) || []).length * 10;

  // 결합자
  complexity += (selector.match(/[>+~]/g) || []).length * 1;

  return complexity;
}

/**
 * 성능 문제가 있는 선택자인지 확인
 */
export function hasPerformanceIssues(selector: string): boolean {
  // 복잡도가 너무 높음
  if (calculateSelectorComplexity(selector) > 1000) {
    return true;
  }

  // 문제가 될 수 있는 패턴들
  const problematicPatterns = [
    /\*/, // 전체 선택자
    /^\s*>/, // 시작이 자식 결합자
    /\[\w*\*=/, // 와일드카드 속성 선택자
  ];

  return problematicPatterns.some(pattern => pattern.test(selector));
}

// ================================
// 접근성 유틸리티 (WCAG 2.1 기준)
// ================================

/**
 * 상대 휘도 계산
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const normalizeComponent = (c: number): number => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rNorm = normalizeComponent(r);
  const gNorm = normalizeComponent(g);
  const bNorm = normalizeComponent(b);

  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm;
}

/**
 * 색상 파싱
 */
export function parseColor(color: string): [number, number, number] | null {
  // RGB 형식 파싱
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch?.[1] && rgbMatch?.[2] && rgbMatch?.[3]) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }

  // HEX 형식 파싱
  const hexMatch = color.match(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/);
  if (hexMatch?.[1]) {
    const hex = hexMatch[1];
    const fullHex =
      hex.length === 3
        ? hex
            .split('')
            .map(c => c + c)
            .join('')
        : hex;
    return [
      parseInt(fullHex.substr(0, 2), 16),
      parseInt(fullHex.substr(2, 2), 16),
      parseInt(fullHex.substr(4, 2), 16),
    ];
  }

  return null;
}

/**
 * 대비율 계산
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fgColor = parseColor(foreground);
  const bgColor = parseColor(background);

  if (!fgColor || !bgColor) {
    return 0;
  }

  const fgLuminance = getRelativeLuminance(fgColor[0], fgColor[1], fgColor[2]);
  const bgLuminance = getRelativeLuminance(bgColor[0], bgColor[1], bgColor[2]);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA 기준 만족 여부 (4.5:1)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 4.5;
}

/**
 * WCAG AAA 기준 만족 여부 (7:1)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 7;
}

/**
 * 실제 배경색 감지
 */
export function detectActualBackgroundColor(element: Element): string {
  let currentElement: Element | null = element;

  while (currentElement) {
    const style = window.getComputedStyle(currentElement);
    const bgColor = style.backgroundColor;

    // 투명하지 않은 배경색을 찾으면 반환
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      return bgColor;
    }

    currentElement = currentElement.parentElement;
  }

  // 기본 배경색 (흰색)
  return 'rgb(255, 255, 255)';
}

/**
 * 밝은 배경인지 감지
 */
export function detectLightBackground(element: Element): boolean {
  const bgColor = detectActualBackgroundColor(element);
  const parsed = parseColor(bgColor);

  if (!parsed) {
    return true; // 기본적으로 밝은 배경으로 가정
  }

  const luminance = getRelativeLuminance(parsed[0], parsed[1], parsed[2]);
  return luminance > 0.5;
}
