/**
 * TDD(RED): 툴바에 설정 버튼이 표시되고 클릭 시 toggleSettings가 호출된다
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';

// 갤러리 상태를 최소로 모킹해 컴포넌트가 렌더링되도록 한다
const toggleSettingsSpy = vi.fn();
vi.mock('@shared/state/signals/gallery.signals', async () => {
  const mod = await vi.importActual<any>('@shared/state/signals/gallery.signals');
  return {
    ...mod,
    galleryState: {
      value: { mediaItems: [{ id: '1', url: 'u' }], currentIndex: 0, isLoading: false },
      subscribe: (_: unknown) => {
        void _;
        return () => {};
      },
    },
    navigateToItem: () => {},
    toggleSettings: toggleSettingsSpy,
  };
});

// vendors.getPreact를 패치하여 h 함수를 제공 (테스트 환경의 preact mock은 createElement만 노출)
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

describe('[TDD][RED] Toolbar Settings Button opens Settings Modal', () => {
  it('툴바에 설정 버튼이 있고, 클릭 시 toggleSettings(true)가 호출된다', async () => {
    const { VerticalGalleryView } = await import(
      '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const { getByRole } = render(
      (
        <VerticalGalleryView
          onClose={() => {}}
          onPrevious={() => {}}
          onNext={() => {}}
          onDownloadCurrent={() => {}}
          onDownloadAll={() => {}}
        />
      ) as any
    );

    const settingsButton = getByRole('button', { name: '설정 열기' });
    fireEvent.click(settingsButton);

    expect(toggleSettingsSpy).toHaveBeenCalledTimes(1);
    expect(toggleSettingsSpy).toHaveBeenCalledWith(true);
  });
});
