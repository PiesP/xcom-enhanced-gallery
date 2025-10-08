/**
 * @fileoverview Button Primitive Solid Component Tests
 * @description Phase 0 스타일 테스트 - compile/type verification
 */

import { describe, it, expect } from 'vitest';
import { Button } from '@shared/components/ui/primitive/Button';

describe('Button.solid - Phase 0: Compile & Type Verification', () => {
  it('should compile and be a function', () => {
    expect(typeof Button).toBe('function');
  });

  it('should accept no props (children required)', () => {
    // @ts-expect-error children is required
    const _ = Button({});
    expect(true).toBe(true);
  });

  it('should accept only children prop', () => {
    const element = Button({ children: 'Click me' });
    expect(element).toBeDefined();
  });

  it('should accept variant prop (primary | secondary | outline)', () => {
    const primary = Button({ children: 'Primary', variant: 'primary' });
    const secondary = Button({ children: 'Secondary', variant: 'secondary' });
    const outline = Button({ children: 'Outline', variant: 'outline' });

    expect(primary).toBeDefined();
    expect(secondary).toBeDefined();
    expect(outline).toBeDefined();
  });

  it('should accept size prop (sm | md | lg)', () => {
    const small = Button({ children: 'Small', size: 'sm' });
    const medium = Button({ children: 'Medium', size: 'md' });
    const large = Button({ children: 'Large', size: 'lg' });

    expect(small).toBeDefined();
    expect(medium).toBeDefined();
    expect(large).toBeDefined();
  });

  it('should accept className prop', () => {
    const element = Button({ children: 'Button', className: 'custom-class' });
    expect(element).toBeDefined();
  });

  it('should accept disabled prop', () => {
    const enabled = Button({ children: 'Enabled', disabled: false });
    const disabled = Button({ children: 'Disabled', disabled: true });

    expect(enabled).toBeDefined();
    expect(disabled).toBeDefined();
  });

  it('should accept type prop (button | submit | reset)', () => {
    const button = Button({ children: 'Button', type: 'button' });
    const submit = Button({ children: 'Submit', type: 'submit' });
    const reset = Button({ children: 'Reset', type: 'reset' });

    expect(button).toBeDefined();
    expect(submit).toBeDefined();
    expect(reset).toBeDefined();
  });

  it('should accept onClick handler', () => {
    const element = Button({
      children: 'Click',
      onClick: () => {},
    });
    expect(element).toBeDefined();
  });

  it('should accept onKeyDown handler', () => {
    const element = Button({
      children: 'Press',
      onKeyDown: () => {},
    });
    expect(element).toBeDefined();
  });

  it('should accept aria-label prop', () => {
    const element = Button({
      children: 'Icon',
      'aria-label': 'Close modal',
    });
    expect(element).toBeDefined();
  });

  it('should accept data-action prop', () => {
    const element = Button({
      children: 'Action',
      'data-action': 'download',
    });
    expect(element).toBeDefined();
  });

  it('should accept intent prop (primary | success | danger | neutral)', () => {
    const primary = Button({ children: 'Primary', intent: 'primary' });
    const success = Button({ children: 'Success', intent: 'success' });
    const danger = Button({ children: 'Danger', intent: 'danger' });
    const neutral = Button({ children: 'Neutral', intent: 'neutral' });

    expect(primary).toBeDefined();
    expect(success).toBeDefined();
    expect(danger).toBeDefined();
    expect(neutral).toBeDefined();
  });

  it('should accept selected prop', () => {
    const selected = Button({ children: 'Selected', selected: true });
    const notSelected = Button({ children: 'Not Selected', selected: false });

    expect(selected).toBeDefined();
    expect(notSelected).toBeDefined();
  });

  it('should accept loading prop', () => {
    const loading = Button({ children: 'Loading', loading: true });
    const notLoading = Button({ children: 'Ready', loading: false });

    expect(loading).toBeDefined();
    expect(notLoading).toBeDefined();
  });

  it('should accept all props combined', () => {
    const element = Button({
      children: 'Full Props',
      className: 'custom-button',
      variant: 'primary',
      size: 'lg',
      disabled: false,
      type: 'submit',
      onClick: () => {},
      onKeyDown: () => {},
      'aria-label': 'Submit form',
      'data-action': 'submit',
      intent: 'success',
      selected: true,
      loading: false,
    });
    expect(element).toBeDefined();
  });
});
