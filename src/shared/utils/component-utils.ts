/**
 * @fileoverview 컴포넌트 공용 유틸리티
 * @description Phase 2-3A: StandardProps에서 분리된 공용 유틸 함수
 * @version 1.0.0
 */

import type { BaseComponentProps } from '../types/app.types';

/**
 * 표준 클래스명 생성
 */
export function createClassName(...classes: (string | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 표준 ARIA 속성 생성
 */
export function createAriaProps(
  props: Partial<BaseComponentProps>
): Record<string, string | boolean | number | undefined> {
  const ariaProps: Record<string, string | boolean | number | undefined> = {};

  if (props['aria-label']) ariaProps['aria-label'] = props['aria-label'];
  if (props['aria-describedby']) ariaProps['aria-describedby'] = props['aria-describedby'];
  if (props['aria-expanded'] !== undefined) ariaProps['aria-expanded'] = props['aria-expanded'];
  if (props['aria-hidden'] !== undefined) ariaProps['aria-hidden'] = props['aria-hidden'];
  if (props['aria-disabled']) ariaProps['aria-disabled'] = props['aria-disabled'];
  if (props['aria-busy']) ariaProps['aria-busy'] = props['aria-busy'];
  if (props['aria-pressed']) ariaProps['aria-pressed'] = props['aria-pressed'];
  if (props['aria-haspopup']) ariaProps['aria-haspopup'] = props['aria-haspopup'];
  if (props.role) ariaProps.role = props.role;
  if (props.tabIndex !== undefined) ariaProps.tabIndex = props.tabIndex;

  return ariaProps;
}

/**
 * 표준 테스트 속성 생성
 */
export function createTestProps(testId?: string): Record<string, string | undefined> {
  return testId ? { 'data-testid': testId } : {};
}

/**
 * Props 병합 유틸리티
 */
export function mergeProps<T extends BaseComponentProps>(
  baseProps: T,
  overrideProps: Partial<T>
): T {
  // 클래스명 병합
  const mergedClassName = createClassName(baseProps.className, overrideProps.className);

  // 이벤트 핸들러 병합
  const mergedEventHandlers: Partial<T> = {};

  // 공통 이벤트 핸들러들
  const eventHandlers = [
    'onClick',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onMouseEnter',
    'onMouseLeave',
  ] as const;

  eventHandlers.forEach(handler => {
    const baseHandler = baseProps[handler as keyof T] as unknown;
    const overrideHandler = overrideProps[handler as keyof T] as unknown;

    if (typeof baseHandler === 'function' && typeof overrideHandler === 'function') {
      mergedEventHandlers[handler as keyof T] = ((event: Event) => {
        (baseHandler as (event: Event) => void)(event);
        (overrideHandler as (event: Event) => void)(event);
      }) as T[keyof T];
    } else {
      mergedEventHandlers[handler as keyof T] = (overrideHandler || baseHandler) as T[keyof T];
    }
  });

  return {
    ...baseProps,
    ...overrideProps,
    ...mergedEventHandlers,
    className: mergedClassName || undefined,
  };
}
