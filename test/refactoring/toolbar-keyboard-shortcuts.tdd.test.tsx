/**
 * TDD(RED): Toolbar 키보드 단축키 동작
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';

// preact h 호환을 위한 vendors 패치 (테스트 환경에서 createElement만 노출되는 경우가 있어 보정)
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

describe('[TDD][RED] Toolbar keyboard shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ArrowLeft → onPrevious, ArrowRight → onNext, Escape → onClose', async () => {
    const { Toolbar } = await import('@shared/components/ui/Toolbar/Toolbar');
    const { getPreact } = await import('@shared/external/vendors');
    const { h } = getPreact() as any;

    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onClose = vi.fn();

    const { getByTestId } = render(
      h(Toolbar as any, {
        currentIndex: 1,
        totalCount: 5,
        onPrevious,
        onNext,
        onClose,
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        tabIndex: 0,
        'data-testid': 'toolbar-root',
      })
    );

    const root = getByTestId('toolbar-root');

    root.focus();
    fireEvent.keyDown(root, { key: 'ArrowLeft' });
    fireEvent.keyDown(root, { key: 'ArrowRight' });
    fireEvent.keyDown(root, { key: 'Escape' });

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('1/2/3/4 → original/fitWidth/fitHeight/fitContainer', async () => {
    const { Toolbar } = await import('@shared/components/ui/Toolbar/Toolbar');
    const { getPreact } = await import('@shared/external/vendors');
    const { h } = getPreact() as any;

    const onFitOriginal = vi.fn();
    const onFitWidth = vi.fn();
    const onFitHeight = vi.fn();
    const onFitContainer = vi.fn();

    const { getByTestId } = render(
      h(Toolbar as any, {
        currentIndex: 0,
        totalCount: 10,
        onPrevious: () => {},
        onNext: () => {},
        onClose: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onFitOriginal,
        onFitWidth,
        onFitHeight,
        onFitContainer,
        tabIndex: 0,
        'data-testid': 'toolbar-root',
      })
    );

    const root = getByTestId('toolbar-root');
    root.focus();

    fireEvent.keyDown(root, { key: '1' });
    fireEvent.keyDown(root, { key: '2' });
    fireEvent.keyDown(root, { key: '3' });
    fireEvent.keyDown(root, { key: '4' });

    expect(onFitOriginal).toHaveBeenCalledTimes(1);
    expect(onFitWidth).toHaveBeenCalledTimes(1);
    expect(onFitHeight).toHaveBeenCalledTimes(1);
    expect(onFitContainer).toHaveBeenCalledTimes(1);
  });
});
