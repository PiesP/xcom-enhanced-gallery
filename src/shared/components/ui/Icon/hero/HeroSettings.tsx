import { getSolid } from '@shared/external/vendors';
const { mergeProps, splitProps } = getSolid();
import { getSolidWeb } from '@shared/external/vendors';
const { Dynamic } = getSolidWeb();
import type { Component } from '@shared/external/vendors';

/**
 * @fileoverview HeroSettings Icon Component (Solid.js)
 * @version 1.0.0 - Solid.js Hero Settings Icon Adapter
 */

import { Icon, type IconProps } from '../Icon';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';

export function HeroSettings(props: IconProps): ReturnType<Component> {
  const { Cog6ToothIcon } = getHeroiconsOutline();
  const merged = mergeProps({ size: 'var(--xeg-icon-size)' as string | number }, props);
  const [local, others] = splitProps(merged, ['size']);
  const sizeValue = () => (typeof local.size === 'number' ? `${local.size}px` : local.size);

  return (
    <Icon size={local.size} {...others}>
      <Dynamic
        component={Cog6ToothIcon}
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
