/**
 * @fileoverview Icon Component Tests
 * @version 1.0.0 - TDD 기반 Tabler Icons 시스템
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@test/utils/testing-library';
import h from 'solid-js/h';
import { Icon } from '@shared/components/ui/Icon/Icon';

describe('Icon Component', () => {
  beforeEach(() => {
    // 각 테스트 전 정리
  });

  afterEach(() => {
    cleanup();
  });

  describe('기본 렌더링', () => {
    it('Tabler Icons 표준 형태로 SVG가 렌더링되어야 함', () => {
      const { container } = render(
        h(Icon, {}, [
          h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
          h('path', { d: 'M18 6l-12 12' }),
          h('path', { d: 'M6 6l12 12' }),
        ])
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      // TDD 개선 후 CSS 변수 사용
      expect(svg?.getAttribute('width')).toBe('var(--xeg-icon-size)');
      expect(svg?.getAttribute('height')).toBe('var(--xeg-icon-size)');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.getAttribute('fill')).toBe('none');
      expect(svg?.getAttribute('stroke')).toBe('var(--xeg-icon-color, currentColor)');
      expect(svg?.getAttribute('stroke-width')).toBe('var(--xeg-icon-stroke-width)');
      expect(svg?.getAttribute('stroke-linecap')).toBe('round');
      expect(svg?.getAttribute('stroke-linejoin')).toBe('round');
    });

    it('children으로 전달된 아이콘 경로들이 렌더링되어야 함', () => {
      const { container } = render(
        h(Icon, {}, [
          h('path', { stroke: 'none', d: 'M0 0h24v24H0z', fill: 'none' }),
          h('path', { d: 'M18 6l-12 12' }),
          h('path', { d: 'M6 6l12 12' }),
        ])
      );

      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(3);

      const first = paths.item(0);
      const second = paths.item(1);
      const third = paths.item(2);

      expect(first?.getAttribute('d')).toBe('M0 0h24v24H0z');
      expect(second?.getAttribute('d')).toBe('M18 6l-12 12');
      expect(third?.getAttribute('d')).toBe('M6 6l12 12');
    });
  });

  describe('Props 처리', () => {
    it('size prop이 올바르게 적용되어야 함', () => {
      const { container } = render(h(Icon, { size: 16 }, [h('path', { d: 'M18 6l-12 12' })]));

      const svg = container.querySelector('svg');
      // TDD 개선 후 size prop이 픽셀 단위로 처리됨
      expect(svg?.getAttribute('width')).toBe('16px');
      expect(svg?.getAttribute('height')).toBe('16px');
    });

    it('기본 size는 CSS 변수를 사용해야 함', () => {
      const { container } = render(h(Icon, {}, [h('path', { d: 'M18 6l-12 12' })]));

      const svg = container.querySelector('svg');
      // TDD 개선 후 기본값은 CSS 변수 사용
      expect(svg?.getAttribute('width')).toBe('var(--xeg-icon-size)');
      expect(svg?.getAttribute('height')).toBe('var(--xeg-icon-size)');
    });

    it('className이 올바르게 전달되어야 함', () => {
      const { container } = render(
        h(Icon, { className: 'custom-icon' }, [h('path', { d: 'M18 6l-12 12' })])
      );

      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('custom-icon')).toBe(true);
    });

    it('추가 props가 SVG에 전달되어야 함', () => {
      const { container } = render(
        h(
          Icon,
          {
            'aria-label': '닫기 아이콘',
            'data-testid': 'close-icon',
          },
          [h('path', { d: 'M18 6l-12 12' })]
        )
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toBe('닫기 아이콘');
      expect(svg?.getAttribute('data-testid')).toBe('close-icon');
    });
  });

  describe('접근성', () => {
    it('aria-label이 제공되면 role="img"가 설정되어야 함', () => {
      const { container } = render(
        h(Icon, { 'aria-label': '다운로드' }, [h('path', { d: 'M18 6l-12 12' })])
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
    });

    it('aria-label이 없으면 aria-hidden="true"가 설정되어야 함', () => {
      const { container } = render(h(Icon, {}, [h('path', { d: 'M18 6l-12 12' })]));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('타입 안전성', () => {
    it('children이 없으면 에러를 던지지 않아야 함', () => {
      expect(() => {
        render(h(Icon, {}));
      }).not.toThrow();
    });

    it('빈 children을 허용해야 함', () => {
      const { container } = render(h(Icon, {}, null));
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });
});
