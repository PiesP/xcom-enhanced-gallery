/**
 * TDD(RED): Toolbar 카운터 title에 진행 퍼센트 표시
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/preact';

vi.mock('@shared/external/vendors', async () => {
  const actual = await vi.importActual<any>('@shared/external/vendors');
  const preact = await vi.importActual<any>('preact');
  return {
    ...actual,
    getPreact: () => ({
      ...(preact.default ?? preact),
      h: (...args: any[]) => preact.createElement?.(...args),
    }),
  };
});

describe('[TDD][RED] Toolbar counter title shows percentage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('현재/전체로부터 퍼센트(정수 %)를 title로 노출한다', async () => {
    const { Toolbar } = await import('@shared/components/ui/Toolbar/Toolbar');
    const { getPreact } = await import('@shared/external/vendors');
    const { h } = getPreact() as any;

    const { container } = render(
      h(Toolbar as any, {
        currentIndex: 4, // 5번째 항목
        totalCount: 12,
        onPrevious: () => {},
        onNext: () => {},
        onClose: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        'data-testid': 'toolbar-root',
      })
    );

    const counter = container.querySelector('[data-gallery-element="counter"]') as HTMLElement;
    const title = counter.getAttribute('title') || '';

    // (현재: 5) / 12 = 41.66... → 42%
    expect(title).toContain('42%');
  });
});
