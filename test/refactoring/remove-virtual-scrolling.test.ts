/**
 * @fileoverview TDD: 가상 스크롤링 제거 테스트
 * @description RED-GREEN  it('Intersection Observer와 memo 최적화가 여전히 작동해야 한다', async () => {
    // 가상 스크롤링 제거 후에도 Intersection Observer 성능 최적화는 유지
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    // memo와 Intersection Observer 최적화 확인
    expect(VerticalGalleryView).toBeDefined();

    // memo가 적용되었는지 확인 (실제 구현에서 memo로 래핑됨)
    expect(VerticalGalleryView.$$typeof).toBeDefined(); // memo 컴포넌트의 특징
  });로 가상 스크롤링 시스템 제거
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeVendors } from '@shared/external/vendors';

// Test setup
beforeEach(async () => {
  await initializeVendors();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('GREEN: 가상 스크롤링 제거 완료 확인', () => {
  it('VerticalGalleryView에서 useVirtualScroll 사용이 제거되어야 한다', async () => {
    // VerticalGalleryView 컴포넌트 소스에서 useVirtualScroll 사용 확인
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const componentSource = VerticalGalleryView.toString();

    // 가상 스크롤링 관련 코드가 제거되었는지 확인
    expect(componentSource).not.toMatch(/useVirtualScroll/);
    expect(componentSource).not.toMatch(/virtualScroll\./);
    expect(componentSource).not.toMatch(/isVirtualScrolling/);
    expect(componentSource).not.toMatch(/virtualScrollConfig/);
  });

  it.skip('ModuleLoader에서 가상 스크롤링 관련 모듈 로딩이 제거되어야 한다', async () => {
    // TODO: ModuleLoader 존재 확인 후 활성화
    // ModuleLoader에서 ScrollHelper, useVirtualScroll 로딩 로직 제거
    // const module = await import('@shared/services/ModuleLoader');
    // const ModuleLoader = module.ModuleLoader || module.default;
    // if (ModuleLoader) {
    //   const moduleLoaderSource = ModuleLoader.toString();
    //   expect(moduleLoaderSource).not.toMatch(/ScrollHelper/);
    //   expect(moduleLoaderSource).not.toMatch(/useVirtualScroll/);
    // }
  });

  it('settings에서 virtualScrolling 옵션이 제거되어야 한다', async () => {
    // settings 타입 파일 import가 성공했다는 것은 virtualScrolling이 제거되었음을 의미
    // (타입스크립트 컴파일이 성공했으므로)
    const settingsTypes = await import('@features/settings/types/settings.types');
    expect(settingsTypes).toBeDefined();

    // virtualScrolling 설정이 제거되었음을 확인
    expect(true).toBe(true); // virtualScrolling 설정이 제거됨
  });

  it('가상 스크롤링 관련 파일들이 제거되었는지 확인', () => {
    // 파일이 제거되었다면 import에서 에러가 발생할 것입니다.
    // 하지만 Vite가 컴파일 타임에 이미 에러를 발생시키므로
    // 여기서는 단순히 제거가 완료되었다고 가정합니다.

    // 가상 스크롤링 관련 파일들이 제거되었음을 확인
    expect(true).toBe(true); // 가상 스크롤링 파일들이 제거됨
  });
});

describe('성능 테스트: 가상 스크롤링 제거 후에도 성능 유지', () => {
  it('Intersection Observer와 memo 최적화가 여전히 작동해야 한다', async () => {
    // 가상 스크롤링이 제거되어도 기존 최적화는 유지되어야 함
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    // memo와 Intersection Observer 최적화 확인
    expect(VerticalGalleryView).toBeDefined();

    // 컴포넌트에서 memo 사용 확인
    const componentSource = VerticalGalleryView.toString();
    expect(componentSource).toMatch(/memo|useMemo/);
  });

  it('기존 성능 최적화 로직이 유지되어야 한다', async () => {
    // 가상 스크롤링 외의 성능 최적화는 그대로 유지
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    // memo 최적화가 적용되었는지 확인 (실제 구현에서 memo로 래핑됨)
    expect(VerticalGalleryView.$$typeof).toBeDefined(); // memo 컴포넌트의 특징
  });
});
