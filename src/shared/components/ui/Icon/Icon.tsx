/**
 * @fileoverview Icon Component
 * @version 1.0.0 - Tabler Icons 기반 아이콘 시스템
 * @description
 * Tabler Icons 스타일의 범용 아이콘 컴포넌트
 * - 24x24 기본 크기
 * - stroke 기반 아이콘
 * - 접근성 지원
 * - TypeScript strict 모드 준수
 */

import { getPreact } from '@shared/external/vendors';
import type { VNode, ComponentChildren } from '@shared/external/vendors';

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
 * Tabler Icons 스타일의 아이콘 컴포넌트
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
  size = 'var(--xeg-icon-size)', // CSS 변수를 기본값으로 사용
  className = '',
  children,
  'aria-label': ariaLabel,
  ...otherProps
}: IconProps): VNode {
  const { h } = getPreact();

  // 접근성 속성 설정
  const accessibilityProps: Record<string, string> = {};
  if (ariaLabel) {
    accessibilityProps.role = 'img';
    accessibilityProps['aria-label'] = ariaLabel;
  } else {
    accessibilityProps['aria-hidden'] = 'true';
  }

  // 크기 값 처리 - 숫자인 경우 픽셀로, 문자열인 경우 그대로 사용
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: sizeValue,
      height: sizeValue,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'var(--xeg-icon-color, currentColor)',
      'stroke-width': 'var(--xeg-icon-stroke-width)',
      'stroke-linecap': 'round' as const,
      'stroke-linejoin': 'round' as const,
      className,
      ...accessibilityProps,
      ...otherProps,
    } as Record<string, unknown>,
    children
  );
}
