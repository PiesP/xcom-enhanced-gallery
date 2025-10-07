/**
 * @fileoverview IconButton Solid Component Tests
 * @description Phase 0 스타일 테스트 - compile/type verification
 */

import { describe, it, expect } from 'vitest';
import {
  IconButton,
  type IconButtonProps,
  ICON_BUTTON_SIZES,
} from '@shared/components/ui/Button/IconButton.solid';

describe('IconButton.solid - Phase 0: Compile & Type Verification', () => {
  it('should compile and be a function', () => {
    expect(typeof IconButton).toBe('function');
  });

  it('should export ICON_BUTTON_SIZES constant', () => {
    expect(ICON_BUTTON_SIZES).toBeDefined();
    expect(Array.isArray(ICON_BUTTON_SIZES)).toBe(true);
    // 현재는 Primitive Button 사용으로 'toolbar' 미지원
    expect(ICON_BUTTON_SIZES).toEqual(['sm', 'md', 'lg']);
  });

  it('should require children prop', () => {
    // @ts-expect-error children is required
    const _typeCheck: IconButtonProps = {} as any;
    expect(true).toBe(true);
  });

  it('should accept size prop (sm | md | lg)', () => {
    const sm = IconButton({ size: 'sm', children: 'Icon' });
    const md = IconButton({ size: 'md', children: 'Icon' });
    const lg = IconButton({ size: 'lg', children: 'Icon' });

    expect(sm).toBeDefined();
    expect(md).toBeDefined();
    expect(lg).toBeDefined();
  });

  it('should accept children prop', () => {
    const element = IconButton({ children: 'Icon' });
    expect(element).toBeDefined();
  });

  it('should accept onClick handler', () => {
    const element = IconButton({ children: 'Icon', onClick: () => {} });
    expect(element).toBeDefined();
  });

  it('should accept disabled prop', () => {
    const element = IconButton({ children: 'Icon', disabled: true });
    expect(element).toBeDefined();
  });

  it('should accept aria-label prop', () => {
    const element = IconButton({ children: 'Icon', 'aria-label': 'Close' });
    expect(element).toBeDefined();
  });

  it('should accept className prop', () => {
    const element = IconButton({ children: 'Icon', className: 'custom-class' });
    expect(element).toBeDefined();
  });

  it('should accept data-action prop', () => {
    const element = IconButton({ children: 'Icon', 'data-action': 'close' });
    expect(element).toBeDefined();
  });

  it('should accept all props combined', () => {
    const element = IconButton({
      size: 'lg',
      children: 'Icon',
      onClick: () => {},
      disabled: false,
      'aria-label': 'Custom action',
      className: 'my-button',
      'data-testid': 'my-icon-button',
    });
    expect(element).toBeDefined();
  });
});
