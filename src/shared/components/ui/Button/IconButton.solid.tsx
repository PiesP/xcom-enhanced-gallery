/**
 * @fileoverview IconButton - Solid.js version
 * @description Thin wrapper over Button for icon-only actions
 */

import { mergeProps, splitProps, type Component, type JSX } from 'solid-js';
import { Button, type ButtonProps } from '../primitive/Button.solid';

// IconButton 사이즈 맵 (TDD: icon-button.size-map)
// 중앙에서 허용되는 사이즈 키를 관리하여 테스트로 일관성 가드
// 주의: 현재는 Primitive Button 사용으로 'toolbar' 미지원
// TODO: UI Button.solid.tsx 완성 후 'toolbar' 추가
export const ICON_BUTTON_SIZES: ReadonlyArray<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'] as const;

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'children'> {
  readonly children: JSX.Element; // Primitive Button의 children은 required
  readonly size?: 'sm' | 'md' | 'lg';
}

export const IconButton: Component<IconButtonProps> = props => {
  // mergeProps로 기본값 설정
  const merged = mergeProps({ size: 'md' as const }, props);

  // splitProps로 size를 분리
  const [local, rest] = splitProps(merged, ['size']);

  // Primitive Button의 size는 'sm' | 'md' | 'lg'만 지원
  const safeSize: 'sm' | 'md' | 'lg' =
    local.size === 'sm' || local.size === 'md' || local.size === 'lg' ? local.size : 'md';

  // Button 컴포넌트에 variant='primary' 전달
  // 현재는 Primitive Button 사용 (나중에 UI Button으로 교체 예정)
  return (
    <Button
      size={safeSize}
      variant='primary' // Primitive Button은 variant='icon' 미지원
      data-icon-only={true} // iconOnly는 data 속성으로 표시
      {...rest}
    />
  );
};
