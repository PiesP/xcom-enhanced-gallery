/**
 * @file IconButton - Thin wrapper over Unified Button for icon-only actions
 */

import type { JSX } from 'solid-js';
import { LazyIcon } from '@shared/components/LazyIcon';
import type { IconName } from '@shared/services/iconRegistry';
import { Button, type ButtonProps } from './Button';

export const ICON_BUTTON_SIZES: ReadonlyArray<'sm' | 'md' | 'lg' | 'toolbar'> = [
  'sm',
  'md',
  'lg',
  'toolbar',
] as const;

export interface IconButtonProps
  extends Omit<ButtonProps, 'variant' | 'iconOnly' | 'children' | 'size'> {
  readonly iconName?: IconName;
  readonly children?: JSX.Element | JSX.Element[] | string | number | boolean | null;
  readonly size?: (typeof ICON_BUTTON_SIZES)[number];
}

export const IconButton = (props: IconButtonProps): JSX.Element => {
  const normalizedSize: (typeof ICON_BUTTON_SIZES)[number] =
    typeof props.size === 'string' &&
    ICON_BUTTON_SIZES.includes(props.size as (typeof ICON_BUTTON_SIZES)[number])
      ? (props.size as (typeof ICON_BUTTON_SIZES)[number])
      : 'md';

  const { iconName, children, ...rest } = props;
  const content = iconName ? <LazyIcon name={iconName} /> : children;

  const buttonProps = {
    ...(rest as ButtonProps),
    variant: 'icon' as const,
    size: normalizedSize,
    iconOnly: true,
  } satisfies ButtonProps;

  return <Button {...buttonProps}>{content}</Button>;
};

export default IconButton;
