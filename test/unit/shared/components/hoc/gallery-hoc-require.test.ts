/**
 * @fileoverview Phase 238 회귀 방지 테스트 - GalleryHOC require 제거
 * @description require() 없이도 HOC가 정상 동작하는지 검증
 */

import { describe, it, expect } from 'vitest';

describe('Phase 238: GalleryHOC require 제거 (회귀 방지)', () => {
  it('should import GalleryHOC without require errors', async () => {
    // GalleryHOC 모듈 import
    const { withGallery } = await import('@shared/components/hoc/GalleryHOC');

    // require 에러가 발생하지 않고 정상 import되어야 함
    expect(withGallery).toBeDefined();
    expect(typeof withGallery).toBe('function');
  });

  it('should import ComponentStandards statically without require', async () => {
    // ComponentStandards가 static import로 로드되는지 확인
    const { ComponentStandards } = await import('@shared/utils/component-utils');

    expect(ComponentStandards).toBeDefined();
    expect(ComponentStandards.createClassName).toBeDefined();
    expect(typeof ComponentStandards.createClassName).toBe('function');
  });

  it('should create HOC-wrapped component without require errors', async () => {
    const { withGallery } = await import('@shared/components/hoc/GalleryHOC');

    // 간단한 더미 컴포넌트
    const DummyComponent = (props: { message: string }) => {
      return `Dummy: ${props.message}`;
    };

    // HOC 적용 시 require 에러 없이 래핑되어야 함
    const WrappedComponent = withGallery(DummyComponent, {
      type: 'container',
      className: 'test-class',
    });

    expect(WrappedComponent).toBeDefined();
    expect(typeof WrappedComponent).toBe('function');
  });

  it('should handle HOC options without CommonJS require', async () => {
    const { withGallery } = await import('@shared/components/hoc/GalleryHOC');

    const DummyComponent = () => 'Test';

    // 다양한 옵션으로 HOC 생성 시 require 에러 없어야 함
    const testCases = [
      { type: 'container' as const },
      { type: 'item' as const, className: 'custom' },
      { type: 'control' as const, events: { stopPropagation: true } },
      { type: 'overlay' as const },
      { type: 'viewer' as const },
    ];

    testCases.forEach(options => {
      const wrapped = withGallery(DummyComponent, options);
      expect(wrapped).toBeDefined();
      expect(typeof wrapped).toBe('function');
    });
  });
});
