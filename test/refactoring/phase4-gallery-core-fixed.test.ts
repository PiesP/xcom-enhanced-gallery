/**
 * @fileoverview TDD Phase 4.1 - 갤러리 핵심 로직 분리 테스트
 * @description GalleryApp에서 핵심 비즈니스 로직을 GalleryCore로 분리
 */

import { describe, expect, it } from 'vitest';
import { MEDIA_TYPES } from '@shared/constants/media.constants';
import type { MediaInfo } from '@shared/types/media.types';

// 테스트용 미디어 데이터 헬퍼
const createTestMedia = (
  id: string,
  url: string,
  type: MediaInfo['type'] = 'image'
): MediaInfo => ({
  id,
  url,
  type,
  originalUrl: url,
  alt: `Test ${id}`,
  filename: url.split('/').pop() || url,
});

// TDD Phase 4.1: 갤러리 핵심 로직 분리
describe.skip('GalleryCore - TDD Phase 4.1', () => {
  // RED 단계: 실패하는 테스트부터 작성

  describe('핵심 비즈니스 로직', () => {
    it('미디어 리스트를 받아서 갤러리를 초기화할 수 있어야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
      ];

      // When: 갤러리를 초기화
      core.initialize(mediaList);

      // Then: 미디어 개수가 올바르게 설정되어야 함
      expect(core.getMediaCount()).toBe(2);
      expect(core.getMediaItems()).toEqual(mediaList);
    });

    it('현재 인덱스를 설정하고 조회할 수 있어야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
        createTestMedia('test3', 'test3.jpg'),
      ];

      core.initialize(mediaList);

      // When: 현재 인덱스 설정
      core.setCurrentIndex(1);

      // Then: 현재 인덱스가 올바르게 설정되어야 함
      expect(core.getCurrentIndex()).toBe(1);
      expect(core.getCurrentMediaItem()).toEqual(mediaList[1]);
    });

    it('인덱스 범위를 벗어나면 유효한 범위로 조정되어야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
      ];

      core.initialize(mediaList);

      // When: 범위를 벗어나는 인덱스 설정
      core.setCurrentIndex(-1);
      expect(core.getCurrentIndex()).toBe(0);

      core.setCurrentIndex(5);
      expect(core.getCurrentIndex()).toBe(1); // 마지막 인덱스
    });
  });

  describe('네비게이션 로직', () => {
    it('다음 미디어로 이동할 수 있어야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
        createTestMedia('test3', 'test3.jpg'),
      ];

      core.initialize(mediaList);
      core.setCurrentIndex(0);

      // When: 다음으로 이동
      const success = core.navigateNext();

      // Then: 다음 인덱스로 이동되어야 함
      expect(success).toBe(true);
      expect(core.getCurrentIndex()).toBe(1);
    });

    it('이전 미디어로 이동할 수 있어야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
        createTestMedia('test3', 'test3.jpg'),
      ];

      core.initialize(mediaList);
      core.setCurrentIndex(2);

      // When: 이전으로 이동
      const success = core.navigatePrevious();

      // Then: 이전 인덱스로 이동되어야 함
      expect(success).toBe(true);
      expect(core.getCurrentIndex()).toBe(1);
    });

    it('마지막에서 다음으로 이동하면 실패해야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
      ];

      core.initialize(mediaList);
      core.setCurrentIndex(1); // 마지막 인덱스

      // When: 다음으로 이동 시도
      const success = core.navigateNext();

      // Then: 이동 실패하고 인덱스 유지
      expect(success).toBe(false);
      expect(core.getCurrentIndex()).toBe(1);
    });

    it('첫 번째에서 이전으로 이동하면 실패해야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
      ];

      core.initialize(mediaList);
      core.setCurrentIndex(0); // 첫 번째 인덱스

      // When: 이전으로 이동 시도
      const success = core.navigatePrevious();

      // Then: 이동 실패하고 인덱스 유지
      expect(success).toBe(false);
      expect(core.getCurrentIndex()).toBe(0);
    });
  });

  describe('상태 검증', () => {
    it('초기화되지 않은 상태에서는 오류를 반환해야 한다', async () => {
      // Given: 초기화되지 않은 GalleryCore
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();

      // When & Then: 초기화되지 않은 상태에서 접근 시 오류
      expect(() => core.getCurrentIndex()).toThrow('Gallery not initialized');
      expect(() => core.getMediaCount()).toThrow('Gallery not initialized');
      expect(() => core.navigateNext()).toThrow('Gallery not initialized');
      expect(() => core.navigatePrevious()).toThrow('Gallery not initialized');
    });

    it('빈 미디어 리스트로 초기화하면 오류를 반환해야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();

      // When & Then: 빈 미디어 리스트로 초기화 시 오류
      expect(() => core.initialize([])).toThrow('Media list cannot be empty');
    });

    it('초기화 상태를 확인할 수 있어야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();

      // When: 초기화 전후 상태 확인
      expect(core.isInitialized()).toBe(false);

      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.jpg'),
      ];

      core.initialize(mediaList);
      expect(core.isInitialized()).toBe(true);
    });
  });

  describe('타입 안전성', () => {
    it('모든 미디어 아이템이 올바른 타입을 가져야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [
        createTestMedia('test1', 'test1.jpg'),
        createTestMedia('test2', 'test2.mp4', 'video'),
      ];

      core.initialize(mediaList);

      // Then: 타입 안전성 확인
      const items = core.getMediaItems();
      expect(items).toHaveLength(2);
      expect(items[0].type).toBe('image');
      expect(items[1].type).toBe('video');
      expect(core.validateMediaTypes()).toBe(true);
    });
  });

  describe('상수 간 일관성', () => {
    it('GalleryCore가 분리된 상수를 올바르게 사용해야 한다', async () => {
      // Given: GalleryCore 인스턴스
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = [createTestMedia('test1', 'test1.jpg')];

      core.initialize(mediaList);

      // Then: 상수 사용이 일관성 있어야 함
      const currentItem = core.getCurrentMediaItem();
      expect(currentItem.type).toBe(MEDIA_TYPES.IMAGE);
      expect(core.usesConstants()).toBe(true);
    });
  });

  describe('성능 테스트', () => {
    it('대량의 미디어 아이템을 효율적으로 처리해야 한다', async () => {
      // Given: GalleryCore 인스턴스와 대량의 미디어
      const { GalleryCore } = await import('@features/gallery/core/GalleryCore');

      const core = new GalleryCore();
      const mediaList = Array.from({ length: 1000 }, (_, i) =>
        createTestMedia(`test${i}`, `test${i}.jpg`)
      );

      // When: 대량 데이터 초기화 및 조작
      const startTime = Date.now();

      core.initialize(mediaList);
      expect(core.getMediaCount()).toBe(1000);

      // 여러 네비게이션 테스트
      for (let i = 0; i < 100; i++) {
        core.navigateNext();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Then: 성능 기준 충족 (100ms 이내)
      expect(duration).toBeLessThan(100);
      expect(core.getCurrentIndex()).toBe(100);
    });
  });
});
