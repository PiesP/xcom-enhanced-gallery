/**
 * @fileoverview ModalShell Solid Component Tests
 * @description Phase 0 스타일 테스트 - compile/type verification
 */

import { describe, it, expect } from 'vitest';
import { ModalShell, type ModalShellProps } from '@shared/components/ui/ModalShell/ModalShell';

describe('ModalShell.solid - Phase 0: Compile & Type Verification', () => {
  it('should compile and be a function', () => {
    expect(typeof ModalShell).toBe('function');
  });

  it('should require isOpen prop', () => {
    // @ts-expect-error isOpen is required
    const _ = ModalShell({});
    expect(true).toBe(true);
  });

  it('should accept basic props (isOpen, children)', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test content',
    });
    expect(element).toBeDefined();
  });

  it('should accept onClose handler', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test',
      onClose: () => {},
    });
    expect(element).toBeDefined();
  });

  it('should accept size variants (sm | md | lg | xl)', () => {
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

    sizes.forEach(size => {
      const element = ModalShell({
        isOpen: true,
        children: 'Test',
        size,
      });
      expect(element).toBeDefined();
    });
  });

  it('should accept surfaceVariant (glass | solid | elevated)', () => {
    const variants: Array<'glass' | 'solid' | 'elevated'> = ['glass', 'solid', 'elevated'];

    variants.forEach(surfaceVariant => {
      const element = ModalShell({
        isOpen: true,
        children: 'Test',
        surfaceVariant,
      });
      expect(element).toBeDefined();
    });
  });

  it('should accept closeOnBackdropClick prop', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test',
      closeOnBackdropClick: false,
    });
    expect(element).toBeDefined();
  });

  it('should accept closeOnEscape prop', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test',
      closeOnEscape: false,
    });
    expect(element).toBeDefined();
  });

  it('should accept className prop', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test',
      className: 'custom-modal',
    });
    expect(element).toBeDefined();
  });

  it('should accept data-testid prop', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test',
      'data-testid': 'test-modal',
    });
    expect(element).toBeDefined();
  });

  it('should accept aria-label prop', () => {
    const element = ModalShell({
      isOpen: true,
      children: 'Test',
      'aria-label': 'Test modal dialog',
    });
    expect(element).toBeDefined();
  });

  it('should accept all props combined', () => {
    const element: ReturnType<typeof ModalShell> = ModalShell({
      isOpen: true,
      children: 'Test content',
      onClose: () => {},
      size: 'lg',
      surfaceVariant: 'glass',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      className: 'custom-class',
      'data-testid': 'modal-test',
      'aria-label': 'Settings dialog',
    });
    expect(element).toBeDefined();
  });

  it('should handle isOpen=false state', () => {
    const element = ModalShell({
      isOpen: false,
      children: 'Hidden content',
    });
    expect(element).toBeDefined();
  });
});
