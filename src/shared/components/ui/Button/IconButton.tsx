/**
 * @file IconButton - Unified Button wrapper for icon-only actions (Solid.js)
 */
import type { ComponentChildren, JSXElement } from '../../../external/vendors';
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

export function IconButton({ size = 'md', ...props }: IconButtonProps): JSXElement {
  const safeSize: IconButtonProps['size'] = ICON_BUTTON_SIZES.includes(
    size as 'sm' | 'md' | 'lg' | 'toolbar'
  )
    ? size
    : 'md';

  return <Button {...props} variant='icon' size={safeSize} iconOnly />;
}

export default IconButton;
