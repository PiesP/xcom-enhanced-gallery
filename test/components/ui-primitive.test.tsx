/**
 * @fileoverview Phase 2: UI Primitive 컴포넌트 TDD 테스트
 * @description Button, IconButton, Panel 등 기본 컴포넌트 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Button, IconButton, Panel } from '@shared/components/ui/primitive';

describe('Phase 2: UI Primitive 컴포넌트 (GREEN 테스트)', () => {
  describe('1. Button Primitive', () => {
    it('Button 컴포넌트가 존재해야 한다', async () => {
      // GREEN: 컴포넌트 성공적으로 import됨
      const buttonModule = await import('@shared/components/ui/primitive/Button');
      expect(buttonModule.Button).toBeDefined();
    });

    it('Button이 role=button을 가져야 한다', () => {
      // GREEN: role 속성 구현됨
      const { getByRole } = render(<Button>Test Button</Button>);
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('Button이 키보드 활성화(Enter/Space)를 지원해야 한다', () => {
      // GREEN: 키보드 핸들러 구현됨
      const handleClick = vi.fn();
      const { getByRole } = render(<Button onClick={handleClick}>Test</Button>);

      const button = getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('Button이 xeg- 네임스페이스 클래스를 가져야 한다', () => {
      // GREEN: 클래스 네이밍 규칙 구현됨
      const { getByRole } = render(<Button>Test</Button>);
      const button = getByRole('button');
      expect(button.className).toContain('xeg-button');
    });
  });

  describe('2. IconButton Primitive', () => {
    it('IconButton 컴포넌트가 존재해야 한다', async () => {
      // GREEN: 컴포넌트 성공적으로 import됨
      const iconButtonModule = await import('@shared/components/ui/primitive/IconButton');
      expect(iconButtonModule.IconButton).toBeDefined();
    });

    it('IconButton에 aria-label이 필수여야 한다', () => {
      // GREEN: aria-label 필수 속성 구현됨
      const { getByRole } = render(<IconButton aria-label='Close dialog'>×</IconButton>);
      const button = getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('IconButton이 xeg- 네임스페이스 클래스를 가져야 한다', () => {
      // GREEN: 클래스 네이밍 규칙 구현됨
      const { getByRole } = render(<IconButton aria-label='Test'>×</IconButton>);
      const button = getByRole('button');
      expect(button.className).toContain('xeg-icon-button');
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
      const { container } = render(<Panel>Test content</Panel>);
      const panel = container.firstChild;
      expect(panel.className).toContain('xeg-panel');
    });

    it('Panel이 variant 속성을 지원해야 한다', () => {
      // GREEN: variant 시스템 구현됨
      const { container } = render(<Panel variant='glass'>Test</Panel>);
      const panel = container.firstChild;
      expect(panel.className).toContain('xeg-panel--glass');
    });
  });

  describe('4. Primitive Index Export', () => {
    it('primitive/index.ts에서 모든 컴포넌트를 export해야 한다', async () => {
      // GREEN: 인덱스 파일 구현됨
      const primitiveModule = await import('@shared/components/ui/primitive');
      expect(primitiveModule.Button).toBeDefined();
      expect(primitiveModule.IconButton).toBeDefined();
      expect(primitiveModule.Panel).toBeDefined();
    });
  });
});
