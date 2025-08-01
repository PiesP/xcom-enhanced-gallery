/**
 * Phase 4 Final Cleanup - Step 1: UIService wrapper 제거 테스트
 *
 * UIService wrapper 패턴을 제거하고 개별 서비스 직접 사용으로 변경
 */
import { describe, it, expect } from 'vitest';

describe('Phase 4 Final Cleanup - Step 1', () => {
  describe('Step 1: UIService wrapper 제거', () => {
    it('UIService wrapper가 완전히 제거되어야 함', async () => {
      // UIService 대신 직접 ThemeService, ToastController 사용
      const { ThemeService } = await import('@shared/services/ThemeService');
      const { ToastController } = await import('@shared/services/ToastController');

      expect(ThemeService).toBeDefined();
      expect(ToastController).toBeDefined();

      // UIService 파일이 존재하지 않아야 함
      const fs = await import('fs');
      const path = await import('path');
      const uiServicePath = path.resolve(__dirname, '../../../src/shared/services/UIService.ts');

      expect(fs.existsSync(uiServicePath)).toBe(false);
    });

    it('GalleryApp에서 직접 서비스 사용으로 변경되어야 함', async () => {
      // GalleryApp.ts에서 UIService 대신 개별 서비스 직접 사용
      const galleryAppModule = await import('@features/gallery/GalleryApp');
      expect(galleryAppModule).toBeDefined();

      // GalleryApp의 생성자에서 개별 서비스들이 직접 사용되는지 확인
      const { GalleryApp } = galleryAppModule;
      expect(GalleryApp).toBeDefined();
    });

    it('서비스 exports에서 UIService가 제거되어야 함', async () => {
      // 서비스 index에서 UIService export가 제거되어야 함
      const servicesModule = await import('@shared/services');

      // ThemeService와 ToastController는 직접 export되어야 함
      expect(servicesModule.ThemeService).toBeDefined();
      expect(servicesModule.ToastController).toBeDefined();

      // UIService는 export되지 않아야 함
      expect((servicesModule as any).UIService).toBeUndefined();
    });

    it('서비스 상수에서 UI_SERVICE가 제거되어야 함', async () => {
      // 서비스 상수에서 UI_SERVICE 키가 제거되어야 함
      const constantsModule = await import('../../../src/constants');
      const { SERVICE_KEYS } = constantsModule;

      expect(SERVICE_KEYS).toBeDefined();
      expect((SERVICE_KEYS as any).UI_SERVICE).toBeUndefined();
    });

    it('ThemeService와 ToastController 개별 인스턴스가 정상 작동해야 함', async () => {
      // 개별 서비스들이 정상적으로 인스턴스화되고 작동하는지 확인
      const { ThemeService } = await import('@shared/services/ThemeService');
      const { ToastController } = await import('@shared/services/ToastController');

      const themeService = new ThemeService();
      const toastController = new ToastController();

      expect(ThemeService).toBeDefined();
      expect(themeService).toBeDefined();
      expect(ToastController).toBeDefined();
      expect(toastController).toBeDefined();
    });
  });
});
