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
   * @default 24
   */
  size?: number;

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
 *
 * @example
 * ```tsx
 * // 닫기 아이콘
 * <Icon aria-label="닫기">
 *   <path stroke="none" d="M0 0h24v24H0z" fill="none" />
 *   <path d="M18 6l-12 12" />
 *   <path d="M6 6l12 12" />
 * </Icon>
 *
 * // 커스텀 크기
 * <Icon size={16}>
 *   <path d="M7 4v16l13-8z" />
 * </Icon>
 * ```
 */
export function Icon({
  size = 24,
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

  return h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round' as const,
      'stroke-linejoin': 'round' as const,
      className,
      ...accessibilityProps,
      ...otherProps,
    } as Record<string, unknown>,
    children
  );
}
