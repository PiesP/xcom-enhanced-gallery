/**
 * MediaCounter 진행률 바 테스트
 * Epic: UX-GALLERY-FEEDBACK-001, Phase 2-1
 *
 * 목적: 전체 미디어 수 대비 현재 위치를 시각적으로 표시하는 진행률 바 검증
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { getSolidCore } from '@shared/external/vendors';
import { MediaCounter } from '@shared/components/ui/MediaCounter/MediaCounter';

describe('MediaCounter - 진행률 바', () => {
  const { createRoot } = getSolidCore();

  describe('진행률 바 렌더링', () => {
    it('기본적으로 진행률 바를 렌더링해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='media-counter' />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();

        dispose();
      });
    });

    it('showProgress=false일 때 진행률 바를 렌더링하지 않아야 한다', () => {
      createRoot(dispose => {
        render(() => (
          <MediaCounter current={5} total={10} showProgress={false} data-testid='media-counter' />
        ));

        const progressBar = screen.queryByRole('progressbar');
        expect(progressBar).not.toBeInTheDocument();

        dispose();
      });
    });

    it('진행률 바에 올바른 ARIA 속성을 설정해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={3} total={10} data-testid='media-counter' />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '30');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '10');
        expect(progressBar).toHaveAttribute('aria-valuetext', '30% (3/10)');

        dispose();
      });
    });
  });

  describe('진행률 계산', () => {
    it('50% 진행 시 progressFill이 50% 너비를 가져야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='media-counter' />);

        const progressFill = document.querySelector('[class*="progressFill"]') as HTMLElement;
        expect(progressFill).toBeInTheDocument();
        expect(progressFill?.style.width).toBe('50%');

        dispose();
      });
    });

    it('100% 진행 시 progressFill이 100% 너비를 가져야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={10} total={10} data-testid='media-counter' />);

        const progressFill = document.querySelector('[class*="progressFill"]') as HTMLElement;
        expect(progressFill?.style.width).toBe('100%');

        dispose();
      });
    });

    it('첫 번째 아이템일 때 progressFill이 10% 너비를 가져야 한다 (1/10)', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={1} total={10} data-testid='media-counter' />);

        const progressFill = document.querySelector('[class*="progressFill"]') as HTMLElement;
        expect(progressFill?.style.width).toBe('10%');

        dispose();
      });
    });

    it('total이 0일 때 0% 진행률을 표시해야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={0} total={0} data-testid='media-counter' />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '0');

        dispose();
      });
    });
  });

  describe('레이아웃 통합', () => {
    it('stacked 레이아웃에서 진행률 바가 카운터 아래에 위치해야 한다', () => {
      createRoot(dispose => {
        render(() => (
          <MediaCounter current={5} total={10} layout='stacked' data-testid='media-counter' />
        ));

        const wrapper = screen.getByTestId('media-counter');
        expect(wrapper).toHaveAttribute('data-layout', 'stacked');

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();

        dispose();
      });
    });

    it('inline 레이아웃에서 진행률 바가 카운터 옆에 위치해야 한다', () => {
      createRoot(dispose => {
        render(() => (
          <MediaCounter current={5} total={10} layout='inline' data-testid='media-counter' />
        ));

        const wrapper = screen.getByTestId('media-counter');
        expect(wrapper).toHaveAttribute('data-layout', 'inline');

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();

        dispose();
      });
    });
  });

  describe('경계값 테스트', () => {
    it('current > total일 때 100%로 제한되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={15} total={10} data-testid='media-counter' />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');

        const progressFill = document.querySelector('[class*="progressFill"]') as HTMLElement;
        expect(progressFill?.style.width).toBe('100%');

        dispose();
      });
    });

    it('current가 음수일 때 0%로 제한되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={-1} total={10} data-testid='media-counter' />);

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '0');

        const progressFill = document.querySelector('[class*="progressFill"]') as HTMLElement;
        expect(progressFill?.style.width).toBe('0%');

        dispose();
      });
    });
  });

  describe('접근성', () => {
    it('aria-live="polite" 속성이 카운터에 설정되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='media-counter' />);

        const counter = screen.getByLabelText('미디어 위치');
        const liveRegion = counter.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();

        dispose();
      });
    });

    it('role="group"과 aria-label이 설정되어야 한다', () => {
      createRoot(dispose => {
        render(() => <MediaCounter current={5} total={10} data-testid='media-counter' />);

        const wrapper = screen.getByRole('group', { name: '미디어 위치' });
        expect(wrapper).toBeInTheDocument();

        dispose();
      });
    });
  });
});
