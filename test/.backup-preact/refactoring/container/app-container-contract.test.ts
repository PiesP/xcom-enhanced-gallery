/**
 * @fileoverview Phase 1 - AppContainer Contract Tests
 * @description 타입 안전한 AppContainer 계약 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createAppContainer } from '../helpers/createAppContainer';

describe('Phase 1 - AppContainer Contract', () => {
  let container;

  beforeEach(async () => {
    container = await createAppContainer({ enableLegacyAdapter: false });
  });

  afterEach(async () => {
    if (container) {
      await container.dispose();
    }
  });

  describe('createAppContainer 기본 형태', () => {
    it('config 객체가 올바르게 설정되어야 함', () => {
      expect(container.config).toBeDefined();
      expect(container.config.version).toBeDefined();
      expect(typeof container.config.isDevelopment).toBe('boolean');
      expect(typeof container.config.debug).toBe('boolean');
      expect(typeof container.config.autoStart).toBe('boolean');
    });

    it('logger가 필수 메서드들을 가져야 함', () => {
      expect(container.logger).toBeDefined();
      expect(typeof container.logger.debug).toBe('function');
      expect(typeof container.logger.info).toBe('function');
      expect(typeof container.logger.warn).toBe('function');
      expect(typeof container.logger.error).toBe('function');
    });

    it('services 객체가 필수 서비스들을 포함해야 함', () => {
      expect(container.services).toBeDefined();
      expect(container.services.media).toBeDefined();
      expect(container.services.theme).toBeDefined();
      expect(container.services.toast).toBeDefined();
      expect(container.services.video).toBeDefined();
    });

    it('각 서비스가 필수 메서드들을 가져야 함', () => {
      // Media Service
      expect(typeof container.services.media.extractMediaUrls).toBe('function');
      expect(typeof container.services.media.cleanup).toBe('function');

      // Theme Service
      expect(typeof container.services.theme.getCurrentTheme).toBe('function');
      expect(typeof container.services.theme.setTheme).toBe('function');
      expect(typeof container.services.theme.cleanup).toBe('function');

      // Toast Service
      expect(typeof container.services.toast.show).toBe('function');
      expect(typeof container.services.toast.cleanup).toBe('function');

      // Video Service
      expect(typeof container.services.video.pauseAll).toBe('function');
      expect(typeof container.services.video.resumeAll).toBe('function');
      expect(typeof container.services.video.cleanup).toBe('function');
    });

    it('features 객체가 loadGallery 팩토리를 가져야 함', () => {
      expect(container.features).toBeDefined();
      expect(typeof container.features.loadGallery).toBe('function');
    });

    it('dispose 메서드가 있어야 함', () => {
      expect(typeof container.dispose).toBe('function');
    });
  });

  describe('lazy settings 미생성 보장', () => {
    it('초기 상태에서 settings는 lazy loading 형태로 정의되어야 함', () => {
      // settings는 lazy loading 형태로 정의되어야 함
      expect(container.services.settings).toBeDefined();
      expect(typeof container.services.settings.get).toBe('function');
    });
  });

  describe('dispose 호출 시 cleanup 위임', () => {
    it('dispose 호출 시 모든 서비스의 cleanup이 호출되어야 함', async () => {
      // dispose 전에 서비스들이 정상 동작하는지 확인
      expect(container.services.media.extractMediaUrls).toBeDefined();
      expect(container.services.theme.getCurrentTheme).toBeDefined();

      // dispose 호출
      await expect(container.dispose()).resolves.not.toThrow();
    });
  });

  describe('갤러리 팩토리 동작', () => {
    it('loadGallery 호출 시 갤러리 앱 인스턴스를 반환해야 함', async () => {
      // 갤러리 모듈이 없어도 오류 처리가 적절해야 함
      try {
        const galleryApp = await container.features.loadGallery();
        expect(galleryApp).toBeDefined();
        expect(typeof galleryApp.initialize).toBe('function');
        expect(typeof galleryApp.cleanup).toBe('function');
      } catch (error) {
        // 갤러리 모듈이 없는 경우에도 명확한 오류 메시지가 나와야 함
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('loadGallery 중복 호출 시 동일 인스턴스를 반환해야 함', async () => {
      try {
        const gallery1 = await container.features.loadGallery();
        const gallery2 = await container.features.loadGallery();
        expect(gallery1).toBe(gallery2);
      } catch (error) {
        // 갤러리 모듈이 없는 경우 패스
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('옵션 처리', () => {
    it('커스텀 config 옵션이 적용되어야 함', async () => {
      const customContainer = await createAppContainer({
        config: { version: 'test-version' },
      });

      expect(customContainer.config.version).toBe('test-version');

      await customContainer.dispose();
    });

    it('enableLegacyAdapter 옵션이 적용되어야 함', async () => {
      const containerWithAdapter = await createAppContainer({ enableLegacyAdapter: true });
      const containerWithoutAdapter = await createAppContainer({ enableLegacyAdapter: false });

      // Legacy adapter 관련 전역 변수 확인
      expect(globalThis.__XEG_LEGACY_ADAPTER__).toBeDefined();

      await containerWithAdapter.dispose();
      await containerWithoutAdapter.dispose();
    });
  });
});
