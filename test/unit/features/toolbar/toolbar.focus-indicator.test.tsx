/**
 * Toolbar focus indicator data attribute tests (UI-FCS-02)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, h } from '@test/utils/testing-library';

const setFitModeMock = vi.fn();

vi.mock('@shared/external/vendors', async () => {
  const actualVendors = await vi.importActual<typeof import('@shared/external/vendors')>(
    '@shared/external/vendors'
  );

  return {
    ...actualVendors,
    getSolid: vi.fn(() => actualVendors.getSolid()),
    getSolidStore: vi.fn(() => actualVendors.getSolidStore()),
    initializeVendors: vi.fn(() => Promise.resolve()),
    isVendorsInitialized: vi.fn(() => true),
  };
});

vi.mock('@shared/hooks', async () => {
  const actual = await vi.importActual<typeof import('@shared/hooks')>('@shared/hooks');

  return {
    ...actual,
    useToolbarState: vi.fn(() => [
      {
        isDownloading: false,
        isLoading: false,
        hasError: false,
        currentFitMode: 'original',
        needsHighContrast: false,
      },
      {
        setDownloading: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        setHighContrast: vi.fn(),
        setFitMode: setFitModeMock,
        resetState: vi.fn(),
      },
    ]),
  };
});

vi.mock('@shared/utils/performance/performance-utils', async () => {
  const actual = await vi.importActual<
    typeof import('@shared/utils/performance/performance-utils')
  >('@shared/utils/performance/performance-utils');
  return {
    ...actual,
    throttleScroll: (fn: unknown) => fn,
  };
});

vi.mock('@shared/services/EventManager', () => {
  class MockEventManager {
    static getInstance(): MockEventManager {
      return new MockEventManager();
    }

    addListener(): number {
      return 0;
    }

    removeListener(): void {
      /* noop */
    }
  }

  return { EventManager: MockEventManager };
});

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';

const mkProps = (overrides: Partial<Parameters<typeof Toolbar>[0]> = {}) => ({
  currentIndex: 1,
  totalCount: 5,
  focusedIndex: 2,
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
  ...overrides,
});

describe('Toolbar focus indicator data attributes (UI-FCS-02)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    setFitModeMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('노출된 포커스 인덱스와 현재 인덱스를 data 속성으로 제공한다', () => {
    render(h(Toolbar as any, mkProps()));

    const toolbar = screen.getByRole('toolbar');
    const counter = toolbar.querySelector('[data-gallery-element="counter"]') as HTMLElement;

    expect(toolbar).toHaveAttribute('data-focused-index', '2');
    expect(toolbar).toHaveAttribute('data-current-index', '1');
    expect(counter).not.toBeNull();
    expect(counter?.getAttribute('data-focused-index')).toBe('2');
    expect(counter?.getAttribute('data-current-index')).toBe('1');
  });

  it('focusedIndex가 null이면 currentIndex로 폴백한다', () => {
    render(h(Toolbar as any, mkProps({ focusedIndex: null, currentIndex: 3 })));

    const toolbar = screen.getByRole('toolbar');
    const counter = toolbar.querySelector('[data-gallery-element="counter"]') as HTMLElement;

    expect(toolbar).toHaveAttribute('data-focused-index', '3');
    expect(toolbar).toHaveAttribute('data-current-index', '3');
    expect(counter?.getAttribute('data-focused-index')).toBe('3');
    expect(counter?.getAttribute('data-current-index')).toBe('3');
  });

  it('focusedIndex가 범위를 벗어나면 currentIndex로 정규화한다', () => {
    render(h(Toolbar as any, mkProps({ focusedIndex: 10, currentIndex: 4, totalCount: 5 })));

    const toolbar = screen.getByRole('toolbar');
    const counter = toolbar.querySelector('[data-gallery-element="counter"]') as HTMLElement;

    expect(toolbar).toHaveAttribute('data-focused-index', '4');
    expect(counter?.getAttribute('data-focused-index')).toBe('4');
  });

  it('currentFitMode prop 동기화 시 상태 업데이트를 트리거한다', () => {
    render(h(Toolbar as any, mkProps({ currentFitMode: 'fitWidth' })));

    expect(setFitModeMock).toHaveBeenCalledWith('fitWidth');
  });
});
