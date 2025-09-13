import type { VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';
import { Icon, type IconProps } from '../Icon';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';

type IconLike = (props: Record<string, unknown>) => VNode | null;

/** Heroicons 기반 ZoomIn(MagnifyingGlassPlus) 어댑터 */
export function HeroZoomIn(props: IconProps): VNode {
  const { h } = getPreact();
  const { MagnifyingGlassPlusIcon } = getHeroiconsOutline() as unknown as Record<string, IconLike>;
  const { size = 'var(--xeg-icon-size)', className, 'aria-label': ariaLabel } = props;

  const iconProps: IconProps = { size };
  if (className !== undefined) iconProps.className = className;
  if (ariaLabel !== undefined) iconProps['aria-label'] = ariaLabel;

  return h(
    Icon,
    iconProps,
    h(MagnifyingGlassPlusIcon as unknown as IconLike, {
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
