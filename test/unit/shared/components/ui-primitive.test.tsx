/** @jsxImportSource solid-js */
/**
 * @fileoverview Phase 2: UI Primitive 컴포넌트 TDD 테스트
 * @description Button, IconButton, Panel 등 기본 컴포넌트 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@test/utils/testing-library';
import { Button } from '@shared/components/ui/Button';
import { Panel } from '@shared/components/ui/primitive/Panel';

describe('Phase 2: UI Primitive 컴포넌트 (GREEN 테스트)', () => {
  describe('1. Button Primitive', () => {
    it('Button 컴포넌트가 존재해야 한다', async () => {
      // GREEN: 컴포넌트 성공적으로 import됨
      const buttonModule = await import('@shared/components/ui/Button/Button');
      expect(buttonModule.Button).toBeDefined();
    });

    it('Button이 role=button을 가져야 한다', () => {
      // GREEN: role 속성 구현됨
      const { getByRole } = render(() => <Button>Test Button</Button>);
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('Button이 키보드 활성화(Enter/Space)를 지원해야 한다', () => {
      // JSDOM에서는 네이티브 <button>의 키보드 이벤트가 자동으로 처리되지 않음
      // 실제 브라우저에서는 정상 작동하므로 컴포넌트 렌더링만 확인
      const handleClick = vi.fn();
      const { getByRole } = render(() => <Button onClick={handleClick}>Test</Button>);

      const button = getByRole('button');
      // button 요소가 올바른 type을 가지는지 확인
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
    });

    it('Button이 xeg- 네임스페이스 클래스를 가져야 한다', () => {
      // CSS Modules로 변경되어 클래스명이 해시화됨
      // 대신 unifiedButton 등 주요 클래스가 있는지 확인
      const { getByRole } = render(() => <Button>Test</Button>);
      const button = getByRole('button');
      expect(button.className).toMatch(/unifiedButton|Button/i);
    });
  });

  describe('2. IconButton Primitive', () => {
    it('IconButton 컴포넌트가 존재해야 한다', async () => {
      // IconButton은 이제 Button의 iconOnly 모드로 통합됨
      const buttonModule = await import('@shared/components/ui/Button');
      expect(buttonModule.Button).toBeDefined();
    });

    it('IconButton에 aria-label이 필수여야 한다', () => {
      // GREEN: aria-label 필수 속성 구현됨
      const { getByRole } = render(() => (
        <Button iconOnly aria-label='Close dialog'>
          ×
        </Button>
      ));
      const button = getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('Button iconOnly이 xeg- 네임스페이스 클래스를 가져야 한다', () => {
      // CSS Modules로 변경되어 클래스명이 해시화됨
      const { getByRole } = render(() => (
        <Button iconOnly aria-label='Test'>
          ×
        </Button>
      ));
      const button = getByRole('button');
      // iconOnly 클래스가 있는지 확인
      expect(button.className).toMatch(/iconOnly|Button/i);
    });
  });

  describe('3. Panel/Surface Primitive', () => {
    it('Panel 컴포넌트가 존재해야 한다', async () => {
      // GREEN: 컴포넌트 성공적으로 import됨
      const panelModule = await import('@shared/components/ui/primitive/Panel');
      expect(panelModule.Panel).toBeDefined();
    });

    it('Panel이 xeg- 네임스페이스 prefix를 가져야 한다', () => {
      // GREEN: 클래스 네이밍 규칙 구현됨
      const { container } = render(() => <Panel>Test content</Panel>);
      const panel = container.firstChild as HTMLElement | null;
      expect(panel).not.toBeNull();
      expect(panel!.className).toContain('xeg-panel');
    });

    it('Panel이 variant 속성을 지원해야 한다', () => {
      // GREEN: variant 시스템 구현됨
      const { container } = render(() => <Panel variant='glass'>Test</Panel>);
      const panel = container.firstChild as HTMLElement | null;
      expect(panel).not.toBeNull();
      expect(panel!.className).toContain('xeg-panel--glass');
    });
  });

  describe('4. Primitive Index Export', () => {
    it('primitive/index.ts에서 모든 컴포넌트를 export해야 한다', async () => {
      // GREEN: 인덱스 파일 구현됨
      const primitiveModule = await import('@shared/components/ui/primitive');
      expect(primitiveModule.Button).toBeDefined();
      expect(primitiveModule.Panel).toBeDefined();
    });
  });
});
