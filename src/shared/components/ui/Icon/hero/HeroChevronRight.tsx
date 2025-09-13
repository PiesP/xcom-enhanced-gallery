import type { VNode } from '../../../../external/vendors';
import { getPreact } from '../../../../external/vendors';
import { Icon, type IconProps } from '../Icon';
import { getHeroiconsOutline } from '../../../../external/vendors/heroicons-react';

type IconLike = (props: Record<string, unknown>) => VNode | null;

export function HeroChevronRight(props: IconProps): VNode {
  const { h } = getPreact();
  const { ChevronRightIcon } = getHeroiconsOutline();
  const { size = 'var(--xeg-icon-size)', className, 'aria-label': ariaLabel } = props;

  const iconProps: IconProps = { size };
  if (className !== undefined) iconProps.className = className;
  if (ariaLabel !== undefined) iconProps['aria-label'] = ariaLabel;

  return h(
    Icon,
    iconProps,
    h(ChevronRightIcon as unknown as IconLike, {
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      fill: 'none',
      stroke: 'var(--xeg-icon-color, currentColor)',
      strokeWidth: 'var(--xeg-icon-stroke-width)',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    })
  );
}
