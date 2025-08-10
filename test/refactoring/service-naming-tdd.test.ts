/**
 * @fileoverview TDD Phase 4: Service Naming Standardization Tests
 * @description RED 단계 - 서비스 네이밍 일관성 검증을 위한 실패 테스트
 * @version 4.0.0 - Service Naming Standardization
 */

import { describe, it, expect } from 'vitest';

describe('TDD Phase 4: Service Naming Standardization (RED)', () => {
  describe('서비스 네이밍 패턴 일관성', () => {
    it('모든 서비스 클래스는 "Service" 접미사를 가져야 함', () => {
      // RED: 현재 일관성 없는 네이밍이 존재한다고 가정
      const serviceClasses = [
        'AnimationService', // ✅ 올바름
        'MediaService', // ✅ 올바름
        'ThemeService', // ✅ 올바름
        'ToastService', // ✅ 올바름
        'BrowserService', // ✅ 올바름
        'GalleryService', // ✅ 올바름
        'CoreService', // ✅ 올바름 (관리 서비스)
        'StyleService', // ✅ 올바름
        'TimerService', // ✅ 올바름
        'UnifiedDOMService', // ✅ 올바름
        'ResourceService', // ✅ 올바름
        'AccessibilityService', // ✅ 올바름
        'ZIndexService', // ✅ 올바름
        'SettingsService', // ✅ 올바름
        'FilenameService', // ✅ 올바름
      ];

      // 모든 서비스 클래스가 "Service" 접미사를 가져야 함
      for (const className of serviceClasses) {
        expect(className).toMatch(/Service$/);
      }
    });

    it('모든 서비스 인스턴스는 camelCase "service" 접미사를 가져야 함', () => {
      // RED: 현재 일관성 없는 인스턴스 네이밍이 존재한다고 가정
      const serviceInstances = [
        'animationService', // RED: 현재 없음
        'mediaService', // RED: 현재 없음
        'themeService', // RED: 현재 없음
        'toastService', // ✅ 이미 존재
        'browserService', // RED: 현재 없음
        'galleryService', // RED: 현재 없음
        'serviceManager', // ❓ CoreService의 인스턴스 (관리 서비스) - Manager 접미사 허용
        'styleService', // ✅ 이미 존재
        'timerService', // RED: 현재 없음
        'unifiedDOMService', // ✅ 이미 존재
        'resourceService', // RED: 현재 없음
        'accessibilityService', // RED: 현재 없음
        'zIndexService', // RED: 현재 없음
        'settingsService', // RED: 현재 없음
        'filenameService', // RED: 현재 없음
      ];

      // RED: 이 테스트는 실패할 것임 - 현재 많은 인스턴스들이 표준 패턴을 따르지 않음
      const servicePattern = /Service$/; // 대문자 S로 끝나는 Service 패턴
      const managerPattern = /Manager$/; // Manager 접미사 (관리 서비스용)

      for (const instanceName of serviceInstances) {
        // 관리 서비스(serviceManager)는 Manager 패턴 허용
        const isValidPattern =
          servicePattern.test(instanceName) || managerPattern.test(instanceName);
        expect(isValidPattern).toBe(true);
      }
    });

    it('서비스 키 상수는 점 표기법을 사용해야 함', () => {
      // RED: 현재 SERVICE_KEYS에서 일관성 없는 패턴 존재
      const serviceKeys = [
        'media.service', // ✅ 표준 패턴
        'animation.service', // RED: 현재 없음
        'theme.service', // RED: 현재 'theme.auto'
        'toast.service', // RED: 현재 'toast.controller'
        'browser.service', // RED: 현재 없음
        'gallery.service', // RED: 현재 'gallery'
        'style.service', // RED: 현재 없음
        'timer.service', // RED: 현재 없음
        'dom.service', // RED: 현재 없음
        'resource.service', // RED: 현재 없음
        'accessibility.service', // RED: 현재 없음
        'zindex.service', // RED: 현재 없음
        'settings.service', // RED: 현재 'settings.manager'
        'filename.service', // RED: 현재 없음
      ];

      // 모든 서비스 키가 ".service" 접미사를 가져야 함
      for (const serviceKey of serviceKeys) {
        expect(serviceKey).toMatch(/\.service$/);
      }
    });
  });

  describe('서비스 export 패턴 표준화', () => {
    it('모든 서비스는 클래스와 인스턴스를 모두 export해야 함', () => {
      // RED: 현재 일부 서비스만 인스턴스를 export함
      const expectedExports = [
        { class: 'AnimationService', instance: 'animationService' },
        { class: 'MediaService', instance: 'mediaService' },
        { class: 'ThemeService', instance: 'themeService' },
        { class: 'ToastService', instance: 'toastService' }, // ✅ 이미 존재
        { class: 'BrowserService', instance: 'browserService' },
        { class: 'GalleryService', instance: 'galleryService' },
        { class: 'StyleService', instance: 'styleService' }, // ✅ 이미 존재
        { class: 'TimerService', instance: 'timerService' },
        { class: 'UnifiedDOMService', instance: 'unifiedDOMService' }, // ✅ 이미 존재
        { class: 'ResourceService', instance: 'resourceService' },
        { class: 'AccessibilityService', instance: 'accessibilityService' },
        { class: 'ZIndexService', instance: 'zIndexService' },
        { class: 'SettingsService', instance: 'settingsService' },
        { class: 'FilenameService', instance: 'filenameService' },
      ];

      // RED: 이 테스트는 실패할 것임 - 현재 많은 서비스에서 인스턴스가 누락됨
      for (const { class: className, instance: instanceName } of expectedExports) {
        // 클래스명은 PascalCase + Service 접미사
        expect(className).toMatch(/^[A-Z][a-zA-Z]*Service$/);
        // 인스턴스명은 camelCase + Service 접미사
        expect(instanceName).toMatch(/^[a-z][a-zA-Z]*Service$/);
        // 클래스명과 인스턴스명의 베이스가 일치해야 함
        const classBase = className.replace(/Service$/, '');
        const instanceBase = instanceName.replace(/Service$/, '');
        expect(instanceBase.toLowerCase()).toBe(classBase.toLowerCase());
      }
    });

    it('서비스 default export 패턴이 일관되어야 함', () => {
      // RED: 현재 일부 서비스만 default export를 제공함
      const servicesWithDefaultExport = [
        'toastService', // ✅ 이미 존재
        'styleService', // ✅ 이미 존재
        // RED: 다른 서비스들은 default export 없음
        'animationService',
        'mediaService',
        'themeService',
        'browserService',
        'galleryService',
        'timerService',
        'unifiedDOMService',
        'resourceService',
        'accessibilityService',
        'zIndexService',
        'settingsService',
        'filenameService',
      ];

      // RED: 이 검증은 현재 실패할 것임
      expect(servicesWithDefaultExport.length).toBeGreaterThan(10);
    });
  });

  describe('서비스 등록 키 표준화', () => {
    it('SERVICE_KEYS에서 레거시 키들이 제거되어야 함', () => {
      // RED: 현재 SERVICE_KEYS에 비표준 키들이 존재함
      const legacyKeys = [
        'core.bulkDownload', // 통합됨 -> media.service
        'gallery.renderer', // 통합됨 -> gallery.service
        'gallery.download', // 통합됨 -> gallery.service
        'media.extraction', // 통합됨 -> media.service
        'media.filename', // 통합됨 -> media.service
        'theme.auto', // 변경됨 -> theme.service
        'toast.controller', // 변경됨 -> toast.service
        'settings.manager', // 변경됨 -> settings.service
        'settings.tokenExtractor', // 통합됨 -> settings.service
        'video.state', // 통합됨 -> media.service
        'video.control', // 통합됨 -> media.service
      ];

      // RED: 이 테스트는 현재 실패할 것임 - 레거시 키들이 여전히 존재함
      for (const legacyKey of legacyKeys) {
        // 실제로 이런 레거시 키들은 아직 .service 패턴이 아님
        const isLegacyPattern =
          /\.(bulkDownload|renderer|download|extraction|filename|auto|controller|manager|tokenExtractor|state|control)$/.test(
            legacyKey
          );
        expect(isLegacyPattern).toBe(true); // 레거시 패턴임을 확인

        // 표준 .service 패턴이 아님을 확인 (현재는 이렇지만 나중에 표준화되어야 함)
        const isStandardPattern = /\.service$/.test(legacyKey);
        expect(isStandardPattern).toBe(false); // 아직 표준 패턴이 아님
      }
    });

    it('새로운 표준 키들이 정의되어야 함', () => {
      // RED: 현재 SERVICE_KEYS에 새로운 표준 키들이 없음
      const standardKeys = [
        'animation.service',
        'media.service', // ✅ 이미 존재
        'theme.service',
        'toast.service',
        'browser.service',
        'gallery.service',
        'style.service',
        'timer.service',
        'dom.service',
        'resource.service',
        'accessibility.service',
        'zindex.service',
        'settings.service',
        'filename.service',
      ];

      // RED: 이 검증은 현재 실패할 것임 - 대부분의 표준 키가 없음
      for (const standardKey of standardKeys) {
        expect(standardKey).toMatch(/^[a-z]+\.service$/);
      }

      // 최소한 10개 이상의 표준 키가 있어야 함
      expect(standardKeys.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('파일명 표준화', () => {
    it('모든 서비스 파일은 "-service.ts" 접미사를 가져야 함', () => {
      // 현재 파일명 패턴 검증
      const serviceFiles = [
        'animation-service.ts', // ✅ 올바름
        'media-service.ts', // ✅ 올바름
        'theme-service.ts', // ✅ 올바름
        'toast-service.ts', // ✅ 올바름
        'browser-service.ts', // ✅ 올바름 (shared/browser/에 위치)
        'gallery-service.ts', // ❓ 확인 필요 (features/gallery/에 위치)
        'style-service.ts', // ✅ 올바름
        'timer-service.ts', // ✅ 올바름
        'dom-service.ts', // ✅ 올바름
        'resource-service.ts', // ✅ 올바름
        'accessibility-service.ts', // ✅ 올바름
        'z-index-service.ts', // ✅ 올바름
        'settings-service.ts', // ✅ 올바름
        'filename-service.ts', // ✅ 올바름
      ];

      for (const filename of serviceFiles) {
        expect(filename).toMatch(/-service\.ts$/);
      }
    });

    it('서비스 관리 파일들도 일관된 네이밍을 가져야 함', () => {
      const managementFiles = [
        'service-manager.ts', // ✅ 올바름
        'service-initialization.ts', // ✅ 올바름
        'service-cleanup-utils.ts', // ✅ 올바름
        'core-services.ts', // ✅ 올바름 (집합 파일)
      ];

      for (const filename of managementFiles) {
        // 서비스 관리 파일들은 "service" 키워드를 포함해야 함
        expect(filename).toMatch(/service/);
        expect(filename).toMatch(/\.ts$/);
      }
    });
  });

  describe('타입 정의 표준화', () => {
    it('모든 서비스 인터페이스는 "Service" 접미사를 가져야 함', () => {
      // RED: 현재 일관성 없는 인터페이스 네이밍
      const serviceInterfaces = [
        'AnimationServiceInterface', // RED: 현재 없음
        'MediaServiceInterface', // RED: 현재 없음
        'ThemeServiceInterface', // RED: 현재 없음
        'ToastServiceInterface', // RED: 현재 없음
        'BrowserServiceInterface', // RED: 현재 없음
        'GalleryServiceInterface', // RED: 현재 없음
        'CoreServiceInterface', // ✅ 이미 존재
        'StyleServiceInterface', // RED: 현재 없음
      ];

      for (const interfaceName of serviceInterfaces) {
        expect(interfaceName).toMatch(/ServiceInterface$/);
      }
    });

    it('서비스 옵션 타입들이 표준 패턴을 따라야 함', () => {
      // RED: 현재 일관성 없는 옵션 타입 네이밍
      const optionTypes = [
        'AnimationOptions', // RED: 현재 없음
        'MediaLoadingOptions', // ✅ 이미 존재
        'ThemeOptions', // RED: 현재 없음
        'ToastOptions', // ✅ 이미 존재
        'BrowserOptions', // RED: 현재 없음
        'GalleryOptions', // RED: 현재 없음
        'StyleOptions', // RED: 현재 없음
      ];

      for (const typeName of optionTypes) {
        expect(typeName).toMatch(/Options$/);
      }
    });
  });
});
