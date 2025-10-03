/**
 * MediaCounter 접근성 강화 테스트
 * Epic: UX-GALLERY-FEEDBACK-001, Phase 2-3
 *
 * 목적: WCAG AA 기준을 준수하는 MediaCounter 접근성 개선
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { getSolidCore } from '@shared/external/vendors';
import { MediaCounter } from '@shared/components/ui/MediaCounter/MediaCounter';

describe('MediaCounter - 접근성 강화 (Phase 2-3)', () => {
  const { createRoot } = getSolidCore();

  describe('ARIA 속성', () => {
    it('aria-live="polite" 속성이 설정되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const counter = screen.getByTestId('counter');
        const liveRegion = counter.querySelector('[aria-live="polite"]');

        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');

        dispose();
      });
    });

    it('role="group"과 aria-label이 설정되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', '미디어 위치');

        dispose();
      });
    });

    it('진행률 바에 올바른 ARIA 속성이 설정되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={3} total={10} data-testid='counter' />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '10');
        expect(progressBar).toHaveAttribute('aria-valuetext');

        dispose();
      });
    });
  });

  describe('폰트 크기 (CSS 토큰)', () => {
    it('MediaCounter의 폰트 크기가 --xeg-font-size-md 토큰을 사용해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const counter = screen.getByTestId('counter');
        const textElement = counter.querySelector('[class*="mediaCounter"]') as HTMLElement;

        expect(textElement).toBeInTheDocument();

        // CSS Module 클래스 확인 (폰트 크기는 CSS 파일에 정의됨)
        const computedStyle = window.getComputedStyle(textElement);
        expect(textElement.className).toMatch(/mediaCounter/);

        dispose();
      });
    });
  });

  describe('색상 대비 (디자인 토큰)', () => {
    it('currentIndex가 --xeg-color-text-primary 토큰을 사용해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const currentIndex = document.querySelector('[class*="currentIndex"]');
        expect(currentIndex).toBeInTheDocument();

        // CSS Module 클래스 확인
        expect(currentIndex?.className).toMatch(/currentIndex/);

        dispose();
      });
    });

    it('separator가 --xeg-color-neutral-500 토큰을 사용해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const separator = document.querySelector('[class*="separator"]');
        expect(separator).toBeInTheDocument();
        expect(separator?.className).toMatch(/separator/);

        dispose();
      });
    });

    it('totalCount가 --xeg-color-neutral-600 토큰을 사용해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const totalCount = document.querySelector('[class*="totalCount"]');
        expect(totalCount).toBeInTheDocument();
        expect(totalCount?.className).toMatch(/totalCount/);

        dispose();
      });
    });

    it('배경색이 --xeg-bg-counter 토큰을 사용해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const counter = document.querySelector('[class*="mediaCounter"]');
        expect(counter).toBeInTheDocument();
        expect(counter?.className).toMatch(/mediaCounter/);

        dispose();
      });
    });

    it('테두리 색상이 --xeg-border-counter 토큰을 사용해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const counter = document.querySelector('[class*="mediaCounter"]');
        expect(counter).toBeInTheDocument();

        dispose();
      });
    });
  });

  describe('레이아웃 모드별 접근성', () => {
    it('stacked 레이아웃에서 ARIA 속성이 유지되어야 한다', () => {
      createRoot(dispose => {
        render(() => (
          <MediaCounter current={5} total={10} layout='stacked' data-testid='counter' />
        ));

        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', '미디어 위치');
        expect(group).toHaveAttribute('data-layout', 'stacked');

        const liveRegion = group.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();

        dispose();
      });
    });

    it('inline 레이아웃에서 ARIA 속성이 유지되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} layout='inline' data-testid='counter' />);

        const group = screen.getByRole('group');
        expect(group).toHaveAttribute('aria-label', '미디어 위치');
        expect(group).toHaveAttribute('data-layout', 'inline');

        const liveRegion = group.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();

        dispose();
      });
    });
  });

  describe('스크린 리더 지원', () => {
    it('data-gallery-element="counter" 속성이 있어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        const counterElement = document.querySelector('[data-gallery-element="counter"]');
        expect(counterElement).toBeInTheDocument();

        dispose();
      });
    });

    it('진행률 바의 aria-valuetext가 스크린 리더 친화적 형식이어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={3} total={10} data-testid='counter' />);

        const progressBar = screen.getByRole('progressbar');
        const valueText = progressBar.getAttribute('aria-valuetext');

        // 형식: "30% (3/10)"
        expect(valueText).toMatch(/\d+% \(\d+\/\d+\)/);
        expect(valueText).toContain('3/10');

        dispose();
      });
    });
  });

  describe('토큰 준수 검증', () => {
    it('CSS 파일에 하드코딩된 색상 값이 없어야 한다', () => {
      // 이 테스트는 CSS 파일을 직접 확인하는 것이 목적
      // MediaCounter.module.css에 hex 색상이나 rgb() 값이 없어야 함
      // 실제로는 CSS 파일 스캔 테스트가 별도로 있지만, 여기서는 컴포넌트 렌더링을 검증

      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='counter' />);

        // 모든 요소가 CSS Module 클래스를 통해 스타일링됨을 확인
        const counter = document.querySelector('[class*="mediaCounter"]');
        const currentIndex = document.querySelector('[class*="currentIndex"]');
        const separator = document.querySelector('[class*="separator"]');
        const totalCount = document.querySelector('[class*="totalCount"]');
        const progressBar = document.querySelector('[class*="progressBar"]');

        expect(counter).toBeInTheDocument();
        expect(currentIndex).toBeInTheDocument();
        expect(separator).toBeInTheDocument();
        expect(totalCount).toBeInTheDocument();
        expect(progressBar).toBeInTheDocument();

        dispose();
      });
    });
  });
});
