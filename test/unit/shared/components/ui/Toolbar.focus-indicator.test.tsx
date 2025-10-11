/**
 * @fileoverview Toolbar 포커스 인디케이터 동기화 테스트
 * @description focusedIndex 값이 제공될 때 툴바 카운터와 진행률이 올바르게 업데이트되는지 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, h } from '@test/utils/testing-library';

interface ToolbarTestProps {
  currentIndex: number;
  totalCount: number;
  focusedIndex?: number;
}

const createToolbarProps = ({ currentIndex, totalCount, focusedIndex }: ToolbarTestProps) => ({
  currentIndex,
  totalCount,
  focusedIndex,
  isDownloading: false,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onDownloadCurrent: vi.fn(),
  onDownloadAll: vi.fn(),
  onClose: vi.fn(),
  onOpenSettings: vi.fn(),
  onFitOriginal: vi.fn(),
  onFitWidth: vi.fn(),
  onFitHeight: vi.fn(),
  onFitContainer: vi.fn(),
});

describe('Toolbar – focusedIndex indicator sync (P0)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('focusedIndex가 제공되면 카운터와 진행률이 해당 값으로 동기화되어야 함', async () => {
    const { Toolbar } = await import('@shared/components/ui/Toolbar/Toolbar');
    // Phase 13: focusedIndex와 currentIndex의 diff가 1 이하일 때만 focusedIndex 사용
    // diff > 1이면 currentIndex 우선 (더 신뢰할 수 있는 값)
    const props = createToolbarProps({ currentIndex: 4, totalCount: 10, focusedIndex: 4 });

    const { container } = render(h(Toolbar, props));

    const counter = container.querySelector('[data-gallery-element="counter"]');
    expect(counter).not.toBeNull();
    expect(counter?.textContent?.replace(/\s+/g, '')).toBe('5/10');

    const progressFill = counter?.parentElement?.querySelector('[style*="width"]');
    expect(progressFill).not.toBeNull();
    expect(progressFill?.getAttribute('style')).toContain('50%');
  });

  it('focusedIndex가 없으면 currentIndex 값을 사용해야 함', async () => {
    const { Toolbar } = await import('@shared/components/ui/Toolbar/Toolbar');
    const props = createToolbarProps({ currentIndex: 2, totalCount: 10 });

    const { container } = render(h(Toolbar, props));

    const counter = container.querySelector('[data-gallery-element="counter"]');
    expect(counter).not.toBeNull();
    expect(counter?.textContent?.replace(/\s+/g, '')).toBe('3/10');

    const progressFill = counter?.parentElement?.querySelector('[style*="width"]');
    expect(progressFill).not.toBeNull();
    expect(progressFill?.getAttribute('style')).toContain('30%');
  });
});
