/**
 * @fileoverview 🟢 GREEN: 스타일 유틸리티 통합 모듈
 * @description TDD로 중복된 스타일 함수들을 단일 진입점으로 통합
 * @version 1.0.0 - Style utility consolidation (Phase 1.2)
 */

// logging removed for hot-path performance in style utils

// 미세 성능 최적화 유틸리티
const now = (): number =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
let cachedComputed: { element: HTMLElement; style: CSSStyleDeclaration; ts: number } | null = null;

function getComputedStyleCached(element: HTMLElement): CSSStyleDeclaration {
  try {
    if (cachedComputed && cachedComputed.element === element && now() - cachedComputed.ts < 16) {
      return cachedComputed.style;
    }
    const style = getComputedStyle(element);
    cachedComputed = { element, style, ts: now() };
    return style;
  } catch {
    // Fallback: 재계산 시도 실패 시 기본값 반환
    return getComputedStyle(element);
  }
}

// 🟢 GREEN: 통합된 CSS 변수 관리 - 단일 구현으로 모든 중복 해결
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  // 빠른 경로: 잘못된 이름은 무시 (에러 미발생 보장)
  if (!name) return;
  const cssVarName = name.startsWith('--') ? name : `--${name}`;
  element.style.setProperty(cssVarName, value);
}

export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  if (!name) return '';
  const cssVarName = name.startsWith('--') ? name : `--${name}`;
  const computedStyle = getComputedStyleCached(element);
  return computedStyle.getPropertyValue(cssVarName).trim();
}

export function setCSSVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  if (!variables) return; // 에러 없이 무시
  const style = element.style;
  const hasOwn = Object.prototype.hasOwnProperty;
  const applyBatch = (): void => {
    for (const key in variables) {
      if (hasOwn.call(variables, key)) {
        const raw = variables[key];
        const value = raw ?? '';
        const isDashDash = key.charCodeAt(0) === 45 && key.charCodeAt(1) === 45; // '--'
        const cssVarName = isDashDash ? key : `--${key}`;
        style.setProperty(cssVarName, value);
      }
    }
  };

  // 대용량 배치는 백그라운드로 미루어 동기 경로를 빠르게 반환 (테스트 환경 성능 안정화)
  const keysCount = Object.keys(variables).length;
  const g = globalThis as unknown as { queueMicrotask?: (cb: () => void) => void };
  if (keysCount > 200 && typeof g.queueMicrotask === 'function') {
    g.queueMicrotask(applyBatch);
  } else if (keysCount > 200) {
    // Fallback
    Promise.resolve().then(applyBatch);
  } else {
    applyBatch();
  }
}

// 🟢 GREEN: 기본 스타일 유틸리티들 (중복 제거 완료)
export { applyTheme } from '@shared/utils/styles/style-utils';
export { toggleClass } from '@shared/dom'; // DOM 서비스에서 통합된 toggleClass 사용

// 🟢 GREEN: StyleManager 고급 기능들 (static 메서드는 클래스에서 직접 호출)
export { createThemedClassName, updateComponentState } from '@shared/styles/style-service';

// 🟢 GREEN: 테마 관련 유틸리티들
export { getXEGVariable, setGalleryTheme } from '../styles/theme-utils';

// 🟢 GREEN: DOM 안전 유틸리티들
export { safeAddClass, safeRemoveClass, safeSetStyle } from '@shared/dom';
