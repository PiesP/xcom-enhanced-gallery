/**
 * @fileoverview HeroDownload Icon Component (Solid.js)
 * @version 1.0.0 - Solid.js Hero Download Icon Adapter
 */

import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps, type Component } from 'solid-js';
import { Icon, type IconProps } from '../Icon';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';

export function HeroDownload(props: IconProps): ReturnType<Component> {
  const { ArrowDownTrayIcon } = getHeroiconsOutline();
  const merged = mergeProps({ size: 'var(--xeg-icon-size)' as string | number }, props);
  const [local, others] = splitProps(merged, ['size']);
  const sizeValue = () => (typeof local.size === 'number' ? `${local.size}px` : local.size);

  return (
    <Icon size={local.size} {...others}>
      <Dynamic
        component={ArrowDownTrayIcon as any}
        width={sizeValue()}
        height={sizeValue()}
        fill='none'
        stroke='var(--xeg-icon-color, currentColor)'
        strokeWidth='var(--xeg-icon-stroke-width)'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Icon>
  );
}
