import type { VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';
import { Icon, type IconProps } from '../Icon';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';

/**
 * Heroicons 기반 ChevronLeft 어댑터
 * - 내부 Icon 래퍼를 사용해 디자인 토큰과 aria 규칙을 일관 적용합니다.
 */
type IconLike = (props: Record<string, unknown>) => VNode | null;

export function HeroChevronLeft(props: IconProps): VNode {
  const { h } = getPreact();
  const { ChevronLeftIcon } = getHeroiconsOutline();
  const { size = 'var(--xeg-icon-size)', className, 'aria-label': ariaLabel } = props;

  const iconProps: IconProps = { size };
  if (className !== undefined) iconProps.className = className;
  if (ariaLabel !== undefined) iconProps['aria-label'] = ariaLabel;

  return h(
    Icon,
    iconProps,
    h(ChevronLeftIcon as unknown as IconLike, {
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      // stroke 기반 아이콘이므로 fill은 none, 색상은 Icon 래퍼의 stroke 토큰을 사용
      fill: 'none',
      stroke: 'var(--xeg-icon-color, currentColor)',
      strokeWidth: 'var(--xeg-icon-stroke-width)',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    })
  );
}
