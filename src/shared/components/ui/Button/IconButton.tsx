/**
 * @fileoverview IconButton - Solid.js version
 * @description Thin wrapper over Button for icon-only actions
 */

import { mergeProps, splitProps, type Component, type JSX } from 'solid-js';
import { Button, type ButtonProps } from './Button';

// IconButton 사이즈 맵 (TDD: icon-button.size-map)
// 중앙에서 허용되는 사이즈 키를 관리하여 테스트로 일관성 가드
export const ICON_BUTTON_SIZES: ReadonlyArray<'sm' | 'md' | 'lg' | 'toolbar'> = [
  'sm',
  'md',
  'lg',
  'toolbar',
] as const;

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'children'> {
  readonly children: JSX.Element; // Icon-only 버튼이지만 icon children은 필수
  readonly size?: 'sm' | 'md' | 'lg' | 'toolbar';
}

export const IconButton: Component<IconButtonProps> = props => {
  // mergeProps로 기본값 설정
  const merged = mergeProps({ size: 'md' as const }, props);

  // splitProps로 size를 분리
  const [local, rest] = splitProps(merged, ['size']);

  // UI Button의 size는 'sm' | 'md' | 'lg' | 'toolbar' 모두 지원
  const safeSize: 'sm' | 'md' | 'lg' | 'toolbar' =
    local.size === 'sm' || local.size === 'md' || local.size === 'lg' || local.size === 'toolbar'
      ? local.size
      : 'md';

  // UI Button에 variant='icon', iconOnly=true 전달
  return <Button size={safeSize} variant='icon' iconOnly={true} {...rest} />;
};
