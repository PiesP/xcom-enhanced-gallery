/**
 * @fileoverview Logger Import Consistency Test - TDD 기반 Import 경로 통일
 * @description logger import 경로 불일치로 인한 undefined 오류 방지
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('🔴 RED Phase: Logger Import 경로 일관성 보장', () => {
  beforeEach(() => {
    // 각 테스트마다 모듈 캐시 초기화
    vi.resetModules();
  });

  it('모든 logger import 경로가 동일한 인스턴스를 반환해야 한다', async () => {
    // 다양한 import 경로로 logger 가져오기
    const logger1 = (await import('@shared/logging')).logger;
    const logger2 = (await import('@shared/logging/logger')).logger;
    const logger3 = (await import('@/shared/logging')).logger;

    // 모든 logger가 동일한 인스턴스여야 함
    expect(logger1).toBe(logger2);
    expect(logger2).toBe(logger3);
    expect(logger1).toBe(logger3);
  });

  it('logger.debug가 모든 import 경로에서 함수여야 한다', async () => {
    const paths = ['@shared/logging', '@shared/logging/logger', '@/shared/logging'];

    for (const path of paths) {
      const { logger } = await import(path);
      expect(typeof logger.debug).toBe('function');
      expect(logger.debug).not.toBeUndefined();
    }
  });

  it('VerticalGalleryView에서 사용하는 logger가 안전해야 한다', async () => {
    // VerticalGalleryView와 동일한 방식으로 import
    const { logger } = await import('@/shared/logging');

    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');

    // debug 호출이 안전해야 함
    expect(() => {
      logger.debug('Test debug message', { test: 'data' });
    }).not.toThrow();
  });

  it('갤러리 컴포넌트에서 logger undefined 오류가 발생하지 않아야 한다', async () => {
    // 갤러리에서 실제로 사용되는 패턴 테스트
    const { logger } = await import('@/shared/logging');

    const galleryState = { items: [], currentIndex: 0, isOpen: true };

    // 실제 사용 패턴 시뮬레이션
    expect(() => {
      logger.debug('VerticalGalleryView: Rendering with state', {
        mediaCount: galleryState.items.length,
        currentIndex: galleryState.currentIndex,
        isOpen: galleryState.isOpen,
      });
    }).not.toThrow();
  });

  it('모든 파일에서 사용되는 logger import 패턴이 일관되어야 한다', async () => {
    // 기본 import 패턴 테스트 (간소화)
    const { logger: logger1 } = await import('@shared/logging');
    const { logger: logger2 } = await import('@shared/logging/logger');

    // 모든 logger가 필요한 메서드를 가져야 함
    expect(typeof logger1.debug).toBe('function');
    expect(typeof logger1.info).toBe('function');
    expect(typeof logger1.warn).toBe('function');
    expect(typeof logger1.error).toBe('function');

    expect(typeof logger2.debug).toBe('function');
    expect(typeof logger2.info).toBe('function');
    expect(typeof logger2.warn).toBe('function');
    expect(typeof logger2.error).toBe('function');
  });
});
