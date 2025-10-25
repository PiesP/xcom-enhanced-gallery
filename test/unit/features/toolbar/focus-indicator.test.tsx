/**
 * @description Toolbar 포커스 표시기 회귀 테스트
 * @note 접근성 큐가 올바르게 렌더링되는지 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, h } from '../../utils/testing-library';

interface ToolbarOverrides {
  readonly currentIndex?: number;
  readonly totalCount?: number;
  readonly focusedIndex?: number | null;
}

const createToolbarProps = (overrides: ToolbarOverrides = {}) => ({
  currentIndex: overrides.currentIndex ?? 0,
  focusedIndex: overrides.focusedIndex ?? overrides.currentIndex ?? 0,
  totalCount: overrides.totalCount ?? 5,
  isDownloading: false,
  disabled: false,
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

describe('Toolbar focus indicator (preview removed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render the legacy focus preview container', async () => {
    const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

    const previewProps = {
      ...createToolbarProps(),
      focusPreview: {
        src: 'https://cdn.example.com/thumb.jpg',
        alt: 'Focused media preview',
        label: 'Preview 1/5',
      },
    } as Record<string, unknown>;

    const { container } = render(h(Toolbar as any, previewProps));
    expect(container.querySelector('[data-gallery-element="focus-preview"]')).toBeNull();
  });

  it('keeps the counter aria-live region without the preview', async () => {
    const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

    const { container } = render(h(Toolbar, createToolbarProps()));

    const counter = container.querySelector('[data-gallery-element="counter"]');
    expect(counter).not.toBeNull();
    expect(counter?.getAttribute('aria-live')).toBe('polite');
    expect(counter?.textContent?.replace(/\s+/g, '')).toBe('1/5');
  });
});
