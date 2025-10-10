/**
 * @fileoverview Button Primitive Enhancement Tests (TDD Phase T1)
 * @description Button primitive에 intent, selected, loading 상태 추가 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/testing-library';
import { h } from 'preact';
import { Button } from '@shared/components/ui/primitive/Button';

describe('Button Primitive - 확장 기능 (Phase T1)', () => {
  describe('Intent 지원', () => {
    it('intent="primary" 클래스가 적용된다', () => {
      render(h(Button, { intent: 'primary' }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--primary');
    });

    it('intent="success" 클래스가 적용된다', () => {
      render(h(Button, { intent: 'success' }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--success');
    });

    it('intent="danger" 클래스가 적용된다', () => {
      render(h(Button, { intent: 'danger' }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--danger');
    });

    it('intent="neutral" 클래스가 적용된다', () => {
      render(h(Button, { intent: 'neutral' }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--neutral');
    });
  });

  describe('Selected 상태', () => {
    it('selected=true일 때 선택 클래스가 적용된다', () => {
      render(h(Button, { selected: true }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--selected');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('selected=false일 때 선택 클래스가 없다', () => {
      render(h(Button, { selected: false }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('xeg-button--selected');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Loading 상태', () => {
    it('loading=true일 때 로딩 클래스가 적용된다', () => {
      render(h(Button, { loading: true }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--loading');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('loading=true일 때 클릭이 비활성화된다', () => {
      const onClick = vi.fn();
      render(h(Button, { loading: true, onClick }, 'Test Button'));

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('기존 기능 유지', () => {
    it('variant prop이 여전히 작동한다', () => {
      render(h(Button, { variant: 'secondary' }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--secondary');
    });

    it('size prop이 여전히 작동한다', () => {
      render(h(Button, { size: 'lg' }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--lg');
    });

    it('키보드 접근성이 유지된다', () => {
      const onClick = vi.fn();
      render(h(Button, { onClick }, 'Test Button'));

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('조합 상태', () => {
    it('intent와 selected가 함께 적용된다', () => {
      render(h(Button, { intent: 'primary', selected: true }, 'Test Button'));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--primary');
      expect(button).toHaveClass('xeg-button--selected');
    });

    it('모든 상태가 조합될 수 있다', () => {
      render(
        h(
          Button,
          {
            intent: 'success',
            selected: true,
            loading: false,
            size: 'lg',
            variant: 'primary',
          },
          'Test Button'
        )
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('xeg-button--success');
      expect(button).toHaveClass('xeg-button--selected');
      expect(button).toHaveClass('xeg-button--lg');
      expect(button).toHaveClass('xeg-button--primary');
    });
  });
});
