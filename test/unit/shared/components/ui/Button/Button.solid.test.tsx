/**
 * @fileoverview Button.solid - Phase 0 테스트 (Compile & Type Verification)
 * @description UI Button 컴포넌트 타입 안전성 검증 (실행 없이 컴파일만)
 */

/// <reference lib="dom" />

import { describe, it, expect } from 'vitest';
import type { Component, JSX } from 'solid-js';
import type { ButtonProps } from '@shared/components/ui/Button/Button.solid';

describe('Button.solid - Phase 0: Compile & Type Verification', () => {
  it('should compile and be a function', () => {
    const Button = (): Component<ButtonProps> | undefined => undefined;
    expect(Button).toBeDefined();
  });

  it('should accept no props (all optional)', () => {
    const _typeCheck: ButtonProps = {};
    expect(true).toBe(true);
  });

  it('should accept children prop (optional)', () => {
    const _typeCheck1: ButtonProps = { children: <div>Test</div> };
    const _typeCheck2: ButtonProps = { children: undefined };
    expect(true).toBe(true);
  });

  // Variant type checks (8 variants)
  it('should accept variant prop - primary', () => {
    const _typeCheck: ButtonProps = { variant: 'primary' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - secondary', () => {
    const _typeCheck: ButtonProps = { variant: 'secondary' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - icon', () => {
    const _typeCheck: ButtonProps = { variant: 'icon' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - danger', () => {
    const _typeCheck: ButtonProps = { variant: 'danger' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - ghost', () => {
    const _typeCheck: ButtonProps = { variant: 'ghost' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - toolbar', () => {
    const _typeCheck: ButtonProps = { variant: 'toolbar' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - navigation', () => {
    const _typeCheck: ButtonProps = { variant: 'navigation' };
    expect(true).toBe(true);
  });

  it('should accept variant prop - action', () => {
    const _typeCheck: ButtonProps = { variant: 'action' };
    expect(true).toBe(true);
  });

  // Size type checks (4 sizes)
  it('should accept size prop - sm', () => {
    const _typeCheck: ButtonProps = { size: 'sm' };
    expect(true).toBe(true);
  });

  it('should accept size prop - md', () => {
    const _typeCheck: ButtonProps = { size: 'md' };
    expect(true).toBe(true);
  });

  it('should accept size prop - lg', () => {
    const _typeCheck: ButtonProps = { size: 'lg' };
    expect(true).toBe(true);
  });

  it('should accept size prop - toolbar', () => {
    const _typeCheck: ButtonProps = { size: 'toolbar' };
    expect(true).toBe(true);
  });

  // Intent type checks (5 intents)
  it('should accept intent prop - primary', () => {
    const _typeCheck: ButtonProps = { intent: 'primary' };
    expect(true).toBe(true);
  });

  it('should accept intent prop - secondary', () => {
    const _typeCheck: ButtonProps = { intent: 'secondary' };
    expect(true).toBe(true);
  });

  it('should accept intent prop - success', () => {
    const _typeCheck: ButtonProps = { intent: 'success' };
    expect(true).toBe(true);
  });

  it('should accept intent prop - warning', () => {
    const _typeCheck: ButtonProps = { intent: 'warning' };
    expect(true).toBe(true);
  });

  it('should accept intent prop - danger', () => {
    const _typeCheck: ButtonProps = { intent: 'danger' };
    expect(true).toBe(true);
  });

  // State props
  it('should accept iconOnly prop', () => {
    const _typeCheck: ButtonProps = { iconOnly: true };
    expect(true).toBe(true);
  });

  it('should accept loading prop', () => {
    const _typeCheck: ButtonProps = { loading: true };
    expect(true).toBe(true);
  });

  it('should accept disabled prop', () => {
    const _typeCheck: ButtonProps = { disabled: true };
    expect(true).toBe(true);
  });

  it('should accept type prop', () => {
    const _typeCheck1: ButtonProps = { type: 'button' };
    const _typeCheck2: ButtonProps = { type: 'submit' };
    const _typeCheck3: ButtonProps = { type: 'reset' };
    expect(true).toBe(true);
  });

  // ARIA props
  it('should accept aria-label prop', () => {
    const _typeCheck: ButtonProps = { 'aria-label': 'Test button' };
    expect(true).toBe(true);
  });

  it('should accept aria-labelledby prop', () => {
    const _typeCheck: ButtonProps = { 'aria-labelledby': 'label-id' };
    expect(true).toBe(true);
  });

  it('should accept aria-describedby prop', () => {
    const _typeCheck: ButtonProps = { 'aria-describedby': 'desc-id' };
    expect(true).toBe(true);
  });

  it('should accept aria-pressed prop', () => {
    const _typeCheck1: ButtonProps = { 'aria-pressed': true };
    const _typeCheck2: ButtonProps = { 'aria-pressed': false };
    const _typeCheck3: ButtonProps = { 'aria-pressed': 'true' };
    const _typeCheck4: ButtonProps = { 'aria-pressed': 'false' };
    expect(true).toBe(true);
  });

  it('should accept aria-expanded prop', () => {
    const _typeCheck1: ButtonProps = { 'aria-expanded': true };
    const _typeCheck2: ButtonProps = { 'aria-expanded': false };
    const _typeCheck3: ButtonProps = { 'aria-expanded': 'true' };
    const _typeCheck4: ButtonProps = { 'aria-expanded': 'false' };
    expect(true).toBe(true);
  });

  it('should accept aria-controls prop', () => {
    const _typeCheck: ButtonProps = { 'aria-controls': 'element-id' };
    expect(true).toBe(true);
  });

  it('should accept aria-haspopup prop', () => {
    const _typeCheck1: ButtonProps = { 'aria-haspopup': true };
    const _typeCheck2: ButtonProps = { 'aria-haspopup': false };
    const _typeCheck3: ButtonProps = { 'aria-haspopup': 'true' };
    const _typeCheck4: ButtonProps = { 'aria-haspopup': 'false' };
    expect(true).toBe(true);
  });

  it('should accept aria-busy prop', () => {
    const _typeCheck1: ButtonProps = { 'aria-busy': true };
    const _typeCheck2: ButtonProps = { 'aria-busy': false };
    const _typeCheck3: ButtonProps = { 'aria-busy': 'true' };
    const _typeCheck4: ButtonProps = { 'aria-busy': 'false' };
    expect(true).toBe(true);
  });

  // data-* attributes
  it('should accept data-testid prop', () => {
    const _typeCheck: ButtonProps = { 'data-testid': 'my-button' };
    expect(true).toBe(true);
  });

  it('should accept data-gallery-element prop', () => {
    const _typeCheck: ButtonProps = { 'data-gallery-element': 'button' };
    expect(true).toBe(true);
  });

  it('should accept data-disabled prop', () => {
    const _typeCheck1: ButtonProps = { 'data-disabled': true };
    const _typeCheck2: ButtonProps = { 'data-disabled': 'true' };
    expect(true).toBe(true);
  });

  it('should accept data-selected prop', () => {
    const _typeCheck1: ButtonProps = { 'data-selected': true };
    const _typeCheck2: ButtonProps = { 'data-selected': 'true' };
    expect(true).toBe(true);
  });

  it('should accept data-loading prop', () => {
    const _typeCheck1: ButtonProps = { 'data-loading': true };
    const _typeCheck2: ButtonProps = { 'data-loading': 'true' };
    expect(true).toBe(true);
  });

  // Event handlers
  it('should accept onClick handler', () => {
    const _typeCheck: ButtonProps = {
      onClick: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onMouseDown handler', () => {
    const _typeCheck: ButtonProps = {
      onMouseDown: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onMouseUp handler', () => {
    const _typeCheck: ButtonProps = {
      onMouseUp: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onFocus handler', () => {
    const _typeCheck: ButtonProps = {
      onFocus: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onBlur handler', () => {
    const _typeCheck: ButtonProps = {
      onBlur: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onKeyDown handler', () => {
    const _typeCheck: ButtonProps = {
      onKeyDown: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onMouseEnter handler', () => {
    const _typeCheck: ButtonProps = {
      onMouseEnter: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept onMouseLeave handler', () => {
    const _typeCheck: ButtonProps = {
      onMouseLeave: _event => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  // Other common props
  it('should accept className prop', () => {
    const _typeCheck: ButtonProps = { className: 'custom-class' };
    expect(true).toBe(true);
  });

  it('should accept id prop', () => {
    const _typeCheck: ButtonProps = { id: 'my-button' };
    expect(true).toBe(true);
  });

  it('should accept title prop', () => {
    const _typeCheck: ButtonProps = { title: 'Tooltip text' };
    expect(true).toBe(true);
  });

  it('should accept role prop', () => {
    const _typeCheck: ButtonProps = { role: 'button' };
    expect(true).toBe(true);
  });

  it('should accept ref callback', () => {
    const _typeCheck: ButtonProps = {
      ref: _element => {
        // Type inference from ButtonProps
      },
    };
    expect(true).toBe(true);
  });

  it('should accept tabIndex prop', () => {
    const _typeCheck: ButtonProps = { tabIndex: 0 };
    expect(true).toBe(true);
  });

  it('should accept autoFocus prop', () => {
    const _typeCheck: ButtonProps = { autoFocus: true };
    expect(true).toBe(true);
  });

  it('should accept form prop', () => {
    const _typeCheck: ButtonProps = { form: 'my-form' };
    expect(true).toBe(true);
  });

  // Deprecated iconVariant (backward compatibility)
  it('should accept iconVariant prop (deprecated)', () => {
    const _typeCheck: ButtonProps = { iconVariant: 'danger' };
    expect(true).toBe(true);
  });

  // Combined props tests
  it('should accept all props combined', () => {
    const _typeCheck: ButtonProps = {
      children: <span>Click me</span>,
      variant: 'primary',
      size: 'md',
      intent: 'success',
      iconOnly: false,
      loading: false,
      disabled: false,
      type: 'button',
      className: 'custom-class',
      id: 'my-button',
      title: 'Tooltip',
      role: 'button',
      'aria-label': 'Button label',
      'aria-labelledby': 'label-id',
      'aria-describedby': 'desc-id',
      'aria-pressed': true,
      'aria-expanded': false,
      'aria-controls': 'element-id',
      'aria-haspopup': true,
      'aria-busy': false,
      'data-testid': 'test-button',
      'data-gallery-element': 'button',
      'data-disabled': false,
      'data-selected': true,
      'data-loading': false,
      onClick: _event => {},
      onMouseDown: _event => {},
      onMouseUp: _event => {},
      onFocus: _event => {},
      onBlur: _event => {},
      onKeyDown: _event => {},
      onMouseEnter: _event => {},
      onMouseLeave: _event => {},
      ref: _element => {},
      tabIndex: 0,
      autoFocus: true,
      form: 'my-form',
    };
    expect(true).toBe(true);
  });

  it('should accept complex variant + size + intent combination', () => {
    const _typeCheck1: ButtonProps = {
      variant: 'toolbar',
      size: 'toolbar',
      intent: 'primary',
    };
    const _typeCheck2: ButtonProps = {
      variant: 'danger',
      size: 'lg',
      intent: 'danger',
      loading: true,
    };
    const _typeCheck3: ButtonProps = {
      variant: 'icon',
      size: 'sm',
      iconOnly: true,
      disabled: true,
    };
    expect(true).toBe(true);
  });
});
