/**
 * @fileoverview DOM + CSS 선택자 유틸리티 통합
 * @description dom-utils.ts와 selector-utils.ts를 통합한 단일 모듈
 * @version 1.0.0 - Phase 1 Consolidation
 */

// ================================
// 갤러리 요소 감지 (dom-utils)
// ================================

const GALLERY_SELECTORS = [
  '[data-gallery-container]',
  '.gallery-container',
  '.xeg-gallery-container',
  '[data-gallery]',
  '.xeg-toolbar',
  '.xeg-button',
  '.gallery-controls',
  '.gallery-toolbar',
  '.gallery-header',
  '.gallery-footer',
  '.gallery-content',
  '.gallery-item',
  '.media-viewer',
  '.xeg-toast-container',
  '.xeg-toast',
  '.toast-container',
  '.notification',
] as const;

export function isInsideGallery(element: HTMLElement | null): boolean {
  if (!element) return false;
  return GALLERY_SELECTORS.some(sel => element.closest(sel));
}

export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;
  return GALLERY_SELECTORS.some(sel => element.matches(sel));
}

export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target as HTMLElement;
  return isInsideGallery(target);
}

export function shouldBlockGalleryEvent(event: Event): boolean {
  return isGalleryInternalEvent(event);
}

// ================================
// 안전한 DOM 접근/조작 - DOMService 통합 완료
// ================================

// DOM 조작 함수들은 @shared/dom/DOMService로 완전 통합됨
// 하위 호환성을 위한 re-export만 유지

import { querySelector, querySelectorAll } from '@shared/dom/unified-dom-service';

// 기본 DOM 선택 함수들 - UnifiedDOMService로 위임
export { querySelector, querySelectorAll } from '@shared/dom/unified-dom-service';

// 기본 DOM 선택 함수들 - DOMService로 위임
export function safeQuerySelector<T extends Element = Element>(
  selectorOrRoot: string | ParentNode,
  selector?: string
): T | null {
  try {
    // 1개 파라미터: document에서 검색
    if (typeof selectorOrRoot === 'string') {
      return querySelector<T>(selectorOrRoot);
    }
    // 2개 파라미터: 지정된 root에서 검색
    if (selector) {
      return selectorOrRoot.querySelector(selector) as T | null;
    }
    return null;
  } catch {
    return null;
  }
}

export function safeQuerySelectorAll<T extends Element = Element>(
  selectorOrRoot: string | ParentNode,
  selector?: string
): T[] {
  try {
    // 1개 파라미터: document에서 검색
    if (typeof selectorOrRoot === 'string') {
      return Array.from(querySelectorAll<T>(selectorOrRoot));
    }
    // 2개 파라미터: 지정된 root에서 검색
    if (selector) {
      return Array.from(selectorOrRoot.querySelectorAll(selector)) as T[];
    }
    return [];
  } catch {
    return [];
  }
}

// 단순 유틸리티 함수들 - 유지
export function safeGetAttribute(el: Element | null, attr: string): string | null {
  try {
    return el?.getAttribute(attr) ?? null;
  } catch {
    // Ignore errors and return null for safety
    return null;
  }
}

// DOM 조작 함수들은 @shared/dom/DOMService로 통합됨
// export function safeAddClass() => DOMService.addClass()
// export function safeRemoveClass() => DOMService.removeClass()
// export function safeSetStyle() => DOMService.setStyle()
// export function safeRemoveElement() => DOMService.removeElement()

export function safeSetAttribute(el: Element | null, attr: string, value: string): void {
  try {
    el?.setAttribute(attr, value);
  } catch {
    // Ignore errors for safety
  }
}

// 이벤트 리스너 함수들은 DOMService로 통합됨

export function isElementConnected(el: Element | null): boolean {
  try {
    return !!el && (el.isConnected ?? document.body.contains(el));
  } catch {
    return false;
  }
}

export function safeGetBoundingClientRect(el: Element | null): DOMRect | null {
  try {
    return el?.getBoundingClientRect() ?? null;
  } catch {
    return null;
  }
}

// ================================
// CSS 선택자 유틸리티 (selector-utils)
// ================================

export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') return false;
  try {
    const testElement = document.createElement('div');
    testElement.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

export function parseAttributeSelector(selector: string): {
  attribute: string;
  operator: string;
  value: string;
} | null {
  const attributePattern = /\[([^=~|^$*]+)([*^$~|]?=)"?([^"]+)"?\]/;
  const match = selector.match(attributePattern);
  if (!match?.[1] || !match?.[3]) return null;
  return {
    attribute: match[1].trim(),
    operator: match[2] || '=',
    value: match[3].trim(),
  };
}

/**
 * 선택자 배열에서 가장 구체적인(우선순위 높은) 선택자를 찾습니다
 */
export function findFirstMatchingSelector(
  selectors: string[],
  testElement: Element
): string | null {
  for (const selector of selectors) {
    try {
      if (testElement.matches(selector)) {
        return selector;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * CSS 선택자의 복잡도를 측정합니다
 */
export function calculateSelectorComplexity(selector: string): number {
  let complexity = 0;

  // 기본 요소 선택자
  const elementMatches = selector.match(/^[a-zA-Z]+/);
  if (elementMatches) complexity += 1;

  // ID 선택자
  const idMatches = selector.match(/#[a-zA-Z0-9-_]+/g);
  if (idMatches) complexity += idMatches.length * 10;

  // 클래스 선택자
  const classMatches = selector.match(/\.[a-zA-Z0-9-_]+/g);
  if (classMatches) complexity += classMatches.length * 5;

  // 속성 선택자
  const attributeMatches = selector.match(/\[[^\]]+\]/g);
  if (attributeMatches) complexity += attributeMatches.length * 2;

  // 자식/후손 선택자
  const descendantMatches = selector.match(/[>\s+~]/g);
  if (descendantMatches) complexity += descendantMatches.length * 1;

  // 전체 선택자
  const universalMatches = selector.match(/(?<!\[[^*]*)\*(?![^[]*\])/g);
  if (universalMatches) complexity += universalMatches.length * 100;

  return complexity;
}

/**
 * 선택자가 성능상 문제가 될 수 있는지 검사합니다
 */
export function hasPerformanceIssues(selector: string): boolean {
  if (calculateSelectorComplexity(selector) > 100) {
    return true;
  }

  if (selector.includes('*') && !selector.includes('[') && !selector.includes('*=')) {
    return true;
  }

  const nestingLevel = (selector.match(/[>\s]/g) || []).length;
  if (nestingLevel > 4) {
    return true;
  }

  return false;
}

/**
 * 선택자 우선순위 계산 (CSS 명세 기준)
 */
export function calculateSelectorSpecificity(selector: string): [number, number, number, number] {
  const inline = 0;
  let ids = 0;
  let classes = 0;
  let elements = 0;

  // ID 선택자
  const idMatches = selector.match(/#[a-zA-Z0-9-_]+/g);
  if (idMatches) ids += idMatches.length;

  // 클래스, 속성, 의사 클래스 선택자
  const classMatches = selector.match(/(\.[a-zA-Z0-9-_]+|\[[^\]]+\]|:[^:][a-zA-Z0-9-()]*)/g);
  if (classMatches) classes += classMatches.length;

  // 요소 및 의사 요소 선택자
  const elementMatches = selector.match(/(^|[\s>+~])[a-zA-Z][a-zA-Z0-9-]*|::[a-zA-Z0-9-]+/g);
  if (elementMatches) {
    elements += elementMatches.filter(match => !match.startsWith('::')).length;
  }

  return [inline, ids, classes, elements];
}

/**
 * 두 선택자의 명세도를 비교합니다
 */
export function compareSelectorSpecificity(selector1: string, selector2: string): number {
  const spec1 = calculateSelectorSpecificity(selector1);
  const spec2 = calculateSelectorSpecificity(selector2);

  for (let i = 0; i < 4; i++) {
    const val1 = spec1[i] ?? 0;
    const val2 = spec2[i] ?? 0;
    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }

  return 0;
}

// ================================
// DOMBatcher 관련 export 제거됨 (deprecated)
// ================================

// ================================
// DOM Service 통합 함수들 re-export (UnifiedDOMService로 변경)
// ================================
export {
  addClass as safeAddClass,
  removeClass as safeRemoveClass,
  setStyle as safeSetStyle,
  addEventListener as safeAddEventListener,
  removeEventListener as safeRemoveEventListener,
} from '@shared/dom/unified-dom-service';
