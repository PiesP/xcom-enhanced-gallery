/**
 * @file IconButton - Thin wrapper over Unified Button for icon-only actions
 */
import type { ComponentChildren, VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';
import { Button } from './Button';
import type { ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'iconOnly' | 'children'> {
  readonly children?: ComponentChildren;
}

export function IconButton({ size = 'md', ...props }: IconButtonProps): VNode {
  const { h } = getPreact();
  return h(Button as unknown as (p: ButtonProps) => VNode, {
    ...props,
    variant: 'icon',
    size,
    iconOnly: true,
  });
}

export default IconButton;
