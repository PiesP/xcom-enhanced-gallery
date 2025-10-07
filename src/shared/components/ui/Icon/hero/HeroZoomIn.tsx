/**
 * @fileoverview HeroZoomIn Icon Component (Solid.js)
 * @version 1.0.0 - Solid.js Hero ZoomIn Icon Adapter
 */

import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps, type Component } from 'solid-js';
import { Icon, type IconProps } from '../Icon';
import { getHeroiconsOutline } from '@shared/external/vendors/heroicons-react';

export function HeroZoomIn(props: IconProps): ReturnType<Component> {
  const { MagnifyingGlassPlusIcon } = getHeroiconsOutline();
  const merged = mergeProps({ size: 'var(--xeg-icon-size)' as string | number }, props);
  const [local, others] = splitProps(merged, ['size']);
  const sizeValue = () => (typeof local.size === 'number' ? `${local.size}px` : local.size);

  return (
    <Icon size={local.size} {...others}>
      <Dynamic
        component={MagnifyingGlassPlusIcon}
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
