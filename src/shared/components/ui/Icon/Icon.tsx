/**
 * @fileoverview Icon Component (Solid.js)
 * @version 2.1.0 - 공통 아이콘 컨테이너
 */

import type { ComponentChildren, JSXElement } from '../../../external/vendors';

export interface IconProps {
  /**
   * 아이콘 크기 (width, height)
   * CSS 변수 또는 em 단위를 사용하여 상대적 크기 지원
   * @default CSS 변수 --xeg-icon-size (1.5em)
   */
  size?: number | string;

  /**
   * CSS 클래스명
   */
  className?: string;

  /**
   * 아이콘의 SVG 경로들 (path, line, circle 등)
   */
  children?: ComponentChildren;

  /**
   * 접근성을 위한 아이콘 설명
   * 제공되면 role="img"가 설정됨
   */
  'aria-label'?: string;

  /**
   * 기타 SVG 속성들
   */
  [key: string]: unknown;
}

/**
 * SVG 아이콘 컨테이너 컴포넌트
 * CSS 변수 기반으로 일관된 디자인 시스템 지원
 *
 * @example
 * ```tsx
 * // 기본 아이콘 (CSS 변수 크기 사용)
 * <Icon aria-label="닫기">
 *   <path stroke="none" d="M0 0h24v24H0z" fill="none" />
 *   <path d="M18 6l-12 12" />
 *   <path d="M6 6l12 12" />
 * </Icon>
 *
 * // 커스텀 크기 (숫자 또는 CSS 값)
 * <Icon size={16}>
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 *
 * // CSS 변수를 통한 크기 조정
 * <Icon size="var(--xeg-icon-size-lg)">
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 * ```
 */
export function Icon({
  size = 'var(--xeg-icon-size)',
  className = '',
  children,
  'aria-label': ariaLabel,
  ...otherProps
}: IconProps): JSXElement {
  const accessibilityProps: Record<string, string> = {};
  if (ariaLabel) {
    accessibilityProps.role = 'img';
    accessibilityProps['aria-label'] = ariaLabel;
  } else {
    accessibilityProps['aria-hidden'] = 'true';
  }

  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={sizeValue}
      height={sizeValue}
      viewBox='0 0 24 24'
      fill='none'
      stroke='var(--xeg-icon-color, currentColor)'
      stroke-width='var(--xeg-icon-stroke-width)'
      stroke-linecap='round'
      stroke-linejoin='round'
      class={className}
      {...accessibilityProps}
      {...otherProps}
    >
      {children}
    </svg>
  );
}
