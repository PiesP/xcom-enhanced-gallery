/**
 * @fileoverview Panel Primitive Solid Component Tests
 * @description Phase 0 스타일 테스트 - compile/type verification
 */

import { describe, it, expect } from 'vitest';
import { Panel } from '@shared/components/ui/primitive/Panel';

describe('Panel.solid - Phase 0: Compile & Type Verification', () => {
  it('should compile and be a function', () => {
    expect(typeof Panel).toBe('function');
  });

  it('should accept no props (children required)', () => {
    // @ts-expect-error children is required
    const _ = Panel({});
    expect(true).toBe(true);
  });

  it('should accept only children prop', () => {
    const element = Panel({ children: 'Panel content' });
    expect(element).toBeDefined();
  });

  it('should accept className prop', () => {
    const element = Panel({
      children: 'Content',
      className: 'custom-panel',
    });
    expect(element).toBeDefined();
  });

  it('should accept variant prop (default | elevated | glass)', () => {
    const defaultPanel = Panel({ children: 'Default', variant: 'default' });
    const elevated = Panel({ children: 'Elevated', variant: 'elevated' });
    const glass = Panel({ children: 'Glass', variant: 'glass' });

    expect(defaultPanel).toBeDefined();
    expect(elevated).toBeDefined();
    expect(glass).toBeDefined();
  });

  it('should accept padding prop', () => {
    const withPadding = Panel({ children: 'Padded', padding: true });
    const noPadding = Panel({ children: 'No padding', padding: false });

    expect(withPadding).toBeDefined();
    expect(noPadding).toBeDefined();
  });

  it('should accept all props combined', () => {
    const element = Panel({
      children: 'Full Props',
      className: 'custom-panel-class',
      variant: 'elevated',
      padding: true,
    });
    expect(element).toBeDefined();
  });

  it('should accept JSX children', () => {
    const element = Panel({
      children: <div>Nested content</div>,
    });
    expect(element).toBeDefined();
  });

  it('should accept multiple children', () => {
    const element = Panel({
      children: [<p>First paragraph</p>, <p>Second paragraph</p>],
    });
    expect(element).toBeDefined();
  });
});
