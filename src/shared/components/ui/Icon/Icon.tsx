/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview 재사용 가능한 Icon 컴포넌트
 * lucide-preact 아이콘을 일관된 방식으로 사용하기 위한 래퍼 컴포넌트
 */

import { getPreact, type VNode } from '@shared/external/vendors';
import type { LucideProps } from 'lucide-preact';

/**
 * Icon 컴포넌트 Props
 * LucideProps를 확장하여 아이콘 컴포넌트를 받는 icon prop 추가
 */
export interface IconProps extends LucideProps {
  /** 렌더링할 Lucide 아이콘 컴포넌트 */
  icon: unknown;
}

/**
 * Lucide 아이콘을 일관된 스타일로 렌더링하는 컴포넌트
 *
 * @example
 * ```tsx
 * import { Download } from 'lucide-preact';
 * import { Icon } from '@shared/components/ui/Icon/Icon';
 *
 * // 기본 사용
 * <Icon icon={Download} />
 *
 * // 커스텀 속성 사용
 * <Icon icon={Download} size={24} color="blue" className="my-icon" />
 * ```
 */
export function Icon({
  icon,
  size = 20,
  color = 'currentColor',
  className = '',
  strokeWidth = 2,
  ...otherProps
}: IconProps): VNode {
  const { h } = getPreact();

  // 타입 안전성을 유지하면서도 외부 라이브러리 타입에 직접 의존하지 않도록 unknown 캐스팅을 사용
  const create = h as unknown as (type: unknown, props: unknown) => VNode;
  const props: Record<string, unknown> = {
    size,
    color,
    className,
    strokeWidth,
    ...otherProps,
  };
  return create(icon as unknown, props);
}
