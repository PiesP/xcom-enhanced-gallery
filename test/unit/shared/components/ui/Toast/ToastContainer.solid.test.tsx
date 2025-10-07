/**
 * @fileoverview ToastContainer Solid Component Tests
 * @description Phase 0 스타일 테스트 - compile/type verification
 */

import { describe, it, expect } from 'vitest';
import { ToastContainer } from '@shared/components/ui/Toast/ToastContainer.solid';

describe('ToastContainer.solid - Phase 0: Compile & Type Verification', () => {
  it('should compile and be a function', () => {
    expect(typeof ToastContainer).toBe('function');
  });

  it('should accept no props (all optional)', () => {
    const element = ToastContainer({});
    expect(element).toBeDefined();
  });

  it('should accept position prop (top-right | top-left | bottom-right | bottom-left)', () => {
    const positions: Array<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'> = [
      'top-right',
      'top-left',
      'bottom-right',
      'bottom-left',
    ];

    positions.forEach(position => {
      const element = ToastContainer({ position });
      expect(element).toBeDefined();
    });
  });

  it('should accept maxToasts prop', () => {
    const element = ToastContainer({ maxToasts: 3 });
    expect(element).toBeDefined();
  });

  it('should accept className prop', () => {
    const element = ToastContainer({ className: 'custom-container' });
    expect(element).toBeDefined();
  });

  it('should accept aria-label prop', () => {
    const element = ToastContainer({ 'aria-label': 'Toast notifications' });
    expect(element).toBeDefined();
  });

  it('should accept role prop', () => {
    const element = ToastContainer({ role: 'region' });
    expect(element).toBeDefined();
  });

  it('should accept data-testid prop', () => {
    const element = ToastContainer({ 'data-testid': 'toast-container' });
    expect(element).toBeDefined();
  });

  it('should accept event handlers', () => {
    const element = ToastContainer({
      onFocus: () => {},
      onBlur: () => {},
      onKeyDown: () => {},
    });
    expect(element).toBeDefined();
  });

  it('should accept all props combined', () => {
    const element = ToastContainer({
      position: 'bottom-right',
      maxToasts: 5,
      className: 'custom-container',
      'aria-label': 'Notifications',
      role: 'region',
      'data-testid': 'custom-container',
      onFocus: () => {},
      onBlur: () => {},
      onKeyDown: () => {},
    });
    expect(element).toBeDefined();
  });
});
