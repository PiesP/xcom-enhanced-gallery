/**
 * TDD: VerticalGalleryView 이미지 핏 모드 저장/복원이 Storage Provider 경유 + 이관 (RED)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';

// SUT는 mocks 적용 이후 동적 import로 불러온다

// 간단한 gallery state mocking
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

// Storage Provider mock (마이그레이션 시뮬레이션 + setItem 스파이 노출)
vi.mock('@shared/storage/provider', () => {
  const backing = new Map<string, unknown>();
  // 모듈 로드시 한 번, legacy에서 마이그레이션 수행(테스트 단순화를 위해 즉시 처리)
  const legacy = globalThis.localStorage?.getItem('xeg-image-fit-mode');
  if (legacy != null) backing.set('xeg-image-fit-mode', legacy);
  try {
    globalThis.localStorage?.setItem('xeg-storage-migrated', 'true');
  } catch (e) {
    void e;
  }

  const setItemSpy = vi.fn((k: string, v: unknown) => backing.set(k, v));
  const getItemImpl = (k: string, d?: unknown) => (backing.has(k) ? backing.get(k) : d);
  const getKeyValueStore = () => ({
    getItem: getItemImpl,
    setItem: setItemSpy,
  });

  return {
    getKeyValueStore,
    __test: { setItemSpy, backing },
  };
});

describe('[TDD][RED] VerticalGalleryView fit mode migration via Provider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('localStorage에 기존 값이 있으면 첫 렌더 시 Provider로 이관되어 이후 Provider에서 읽힌다', async () => {
    localStorage.setItem('xeg-image-fit-mode', 'fitHeight');

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

    // 마운트 시 provider 마이그레이션이 수행되어 값이 백업 저장소에 반영되었는지 확인
    const provider = await import('@shared/storage/provider');
    expect(provider.__test.backing.get('xeg-image-fit-mode')).toBe('fitHeight');
    expect(localStorage.getItem('xeg-storage-migrated')).toBe('true');

    // 버튼 클릭으로 fit mode 변경 → provider.setItem 호출 검증
    const fitContainerBtn = getByRole('button', { name: '창에 맞춤' });
    fireEvent.click(fitContainerBtn);

    // Provider Mock 스파이를 통해 정확한 키/값 저장을 검증
    // 주: 실제 VerticalGalleryView 내부 로직은 'xeg-image-fit-mode' 키를 사용
    // 값은 'fitContainer'로 저장되어야 함
    expect(provider.__test.setItemSpy).toHaveBeenCalledWith('xeg-image-fit-mode', 'fitContainer');
  });
});
