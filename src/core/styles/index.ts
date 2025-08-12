/**
 * @fileoverview Core 스타일 - 아키텍처 호환성 보장
 * @description Infrastructure 레이어만 사용하여 아키텍처 규칙 준수
 * @version 4.0.0 - 완전히 분리된 core 구현
 */

// 아키텍처 호환성: Core는 infrastructure만 의존
// GlassmorphismIntensity 타입 제거됨 (deprecated)

/**
 * Core 레이어용 기본 CSS 유틸리티 (infrastructure 레벨)
 */
export function combineClasses(...classes: (string | null | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Core 레이어용 기본 CSS 변수 설정 (infrastructure 레벨)
 */
export function setCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
}

/**
 * Core 레이어용 기본 CSS 변수 가져오기 (infrastructure 레벨)
 */
export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  const computedStyle = getComputedStyle(element);
  return computedStyle.getPropertyValue(name.startsWith('--') ? name : `--${name}`).trim();
}

/**
 * Core 레이어용 컴포넌트 상태 업데이트 (infrastructure 레벨)
 */
export function updateComponentState(
  element: HTMLElement,
  state: Record<string, boolean | string>
): void {
  Object.entries(state).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      element.classList.toggle(`is-${key}`, value);
    } else {
      setCSSVariable(`component-${key}`, value, element);
    }
  });
}

// 🟢 GREEN: glassmorphism 함수들 제거 완료 (TDD Phase 3)
// setGlassmorphism, applyGlassmorphism 함수들이 더 이상 필요하지 않음

// 🟢 GREEN: CoreStyleManager 제거 완료 (TDD Phase 2)
// 모든 기능이 개별 함수로 마이그레이션됨
