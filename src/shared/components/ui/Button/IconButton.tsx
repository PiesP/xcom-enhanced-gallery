/**
 * @file IconButton - Thin wrapper over Unified Button for icon-only actions
 */
import type { ComponentChildren, VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';
import { Button } from './Button';
import type { ButtonProps } from './Button';

// IconButton 사이즈 맵 (TDD: icon-button.size-map)
// 중앙에서 허용되는 사이즈 키를 관리하여 테스트로 일관성 가드
export const ICON_BUTTON_SIZES: ReadonlyArray<'sm' | 'md' | 'lg' | 'toolbar'> = [
  'sm',
  'md',
  'lg',
  'toolbar',
] as const;

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'iconOnly' | 'children'> {
  readonly children?: ComponentChildren;
}

export function IconButton({ size = 'md', ...props }: IconButtonProps): VNode {
  // 방어적: 허용되지 않은 값이 들어오면 기본 md 사용
  const safeSize: IconButtonProps['size'] = ICON_BUTTON_SIZES.includes(
    size as 'sm' | 'md' | 'lg' | 'toolbar'
  )
    ? size
    : 'md';
  const { h } = getPreact();
  return h(Button as unknown as (p: ButtonProps) => VNode, {
    ...props,
    variant: 'icon',
    size: safeSize,
    iconOnly: true,
  });
}

export default IconButton;
