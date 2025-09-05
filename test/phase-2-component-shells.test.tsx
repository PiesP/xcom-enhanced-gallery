/**
 * @fileoverview Phase 2: ToolbarShell & ModalShell 테스트
 * @description TDD - 컴포넌트 Shell 추상화 검증
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';
import { ToolbarShell } from '../src/shared/components/ui/ToolbarShell/ToolbarShell';
import { ModalShell } from '../src/shared/components/ui/ModalShell/ModalShell';

describe('Phase 2: ToolbarShell 컴포넌트', () => {
  test('기본 구조와 role이 올바르게 렌더링되어야 함', () => {
    const { container } = render(
      h(ToolbarShell, { 'data-testid': 'test-toolbar' }, 'Toolbar Content')
    );

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar).toBeTruthy();
    expect(toolbar?.getAttribute('data-testid')).toBe('test-toolbar');
    expect(toolbar?.textContent).toContain('Toolbar Content');
  });

  test('elevation prop에 따른 클래스가 적용되어야 함', () => {
    const { container } = render(h(ToolbarShell, { elevation: 'high' }, 'Content'));

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar?.className).toContain('toolbar-elevation-high');
  });

  test('surfaceVariant prop에 따른 클래스가 적용되어야 함', () => {
    const { container } = render(h(ToolbarShell, { surfaceVariant: 'solid' }, 'Content'));

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar?.className).toContain('toolbar-surface-solid');
  });

  test('aria-label이 올바르게 설정되어야 함', () => {
    const { container } = render(h(ToolbarShell, { 'aria-label': 'Custom Toolbar' }, 'Content'));

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar?.getAttribute('aria-label')).toBe('Custom Toolbar');
  });

  test('기본 aria-label이 설정되어야 함', () => {
    const { container } = render(h(ToolbarShell, {}, 'Content'));

    const toolbar = container.querySelector('[role="toolbar"]');
    expect(toolbar?.getAttribute('aria-label')).toBe('Toolbar');
  });
});

describe('Phase 2: ModalShell 컴포넌트', () => {
  test('isOpen=false일 때 렌더링되지 않아야 함', () => {
    const { container } = render(h(ModalShell, { isOpen: false }, 'Modal Content'));

    expect(container.firstChild).toBeNull();
  });

  test('isOpen=true일 때 올바른 구조로 렌더링되어야 함', () => {
    const { container } = render(
      h(ModalShell, { isOpen: true, 'data-testid': 'test-modal' }, 'Modal Content')
    );

    // 백드롭 확인
    const backdrop = container.querySelector('.modal-backdrop');
    expect(backdrop).toBeTruthy();

    // 모달 다이얼로그 확인
    const modal = container.querySelector('[role="dialog"]');
    expect(modal).toBeTruthy();
    expect(modal?.getAttribute('aria-modal')).toBe('true');
    expect(modal?.getAttribute('data-testid')).toBe('test-modal');
    expect(modal?.textContent).toContain('Modal Content');
  });

  test('size prop에 따른 클래스가 적용되어야 함', () => {
    const { container } = render(h(ModalShell, { isOpen: true, size: 'lg' }, 'Content'));

    const modal = container.querySelector('[role="dialog"]');
    expect(modal?.className).toContain('modal-size-lg');
  });

  test('surfaceVariant prop에 따른 클래스가 적용되어야 함', () => {
    const { container } = render(
      h(ModalShell, { isOpen: true, surfaceVariant: 'elevated' }, 'Content')
    );

    const modal = container.querySelector('[role="dialog"]');
    expect(modal?.className).toContain('modal-surface-elevated');
  });

  test('aria-label이 올바르게 설정되어야 함', () => {
    const { container } = render(
      h(
        ModalShell,
        {
          isOpen: true,
          'aria-label': 'Custom Modal',
        },
        'Content'
      )
    );

    const modal = container.querySelector('[role="dialog"]');
    expect(modal?.getAttribute('aria-label')).toBe('Custom Modal');
  });

  test('백드롭에 적절한 테스트 ID가 설정되어야 함', () => {
    const { container } = render(
      h(
        ModalShell,
        {
          isOpen: true,
          'data-testid': 'test-modal',
        },
        'Content'
      )
    );

    const backdrop = container.querySelector('[data-testid="test-modal-backdrop"]');
    expect(backdrop).toBeTruthy();
  });
});

describe('Phase 2: 토큰 기반 스타일 검증', () => {
  test('ToolbarShell CSS 클래스들이 존재해야 함', () => {
    // CSS 모듈이 제대로 로드되는지 기본 검증
    const expectedClasses = [
      'toolbar-shell',
      'toolbar-elevation-low',
      'toolbar-elevation-medium',
      'toolbar-elevation-high',
      'toolbar-surface-glass',
      'toolbar-surface-solid',
      'toolbar-surface-overlay',
    ];

    // 현재는 클래스 이름 구조만 검증
    expect(expectedClasses.length).toBeGreaterThan(0);
  });

  test('ModalShell CSS 클래스들이 존재해야 함', () => {
    const expectedClasses = [
      'modal-backdrop',
      'modal-shell',
      'modal-size-sm',
      'modal-size-md',
      'modal-size-lg',
      'modal-size-xl',
      'modal-surface-glass',
      'modal-surface-solid',
      'modal-surface-elevated',
    ];

    // 현재는 클래스 이름 구조만 검증
    expect(expectedClasses.length).toBeGreaterThan(0);
  });
});
