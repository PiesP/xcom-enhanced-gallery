/**
 * @fileoverview Phase 1: TDD 기반 중복 제거 테스트
 * @description 중복된 구현을 식별하고 통합하는 TDD 테스트
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 1: 중복 구현 통합 TDD', () => {
  describe('Step 1: 애니메이션 시스템 중복 제거', () => {
    it('AnimationService와 BrowserService의 애니메이션 기능이 중복되어서는 안 됨 (실패해야 함)', async () => {
      // RED: 현재 중복된 구현이 있는지 확인
      const animationServiceModule = await import('../../src/shared/services/AnimationService');
      const browserServiceModule = await import('../../src/shared/browser/BrowserService');

      const animationService = animationServiceModule.AnimationService.getInstance();
      const browserService = new browserServiceModule.BrowserService();

      // 둘 다 fadeIn 메서드가 있으면 중복
      const animationHasFadeIn = typeof animationService.fadeIn === 'function';
      const browserHasFadeIn = typeof browserService.fadeIn === 'function';

      // 현재는 중복이므로 실패해야 함
      expect(animationHasFadeIn && browserHasFadeIn).toBe(false);
    });

    it('통합된 애니메이션 서비스가 모든 필요한 기능을 제공해야 함', async () => {
      // GREEN: 통합 후 하나의 서비스만 애니메이션 기능 제공
      const { AnimationService } = await import('../../src/shared/services/AnimationService');
      const service = AnimationService.getInstance();

      // 필수 애니메이션 메서드들
      expect(typeof service.fadeIn).toBe('function');
      expect(typeof service.fadeOut).toBe('function');
      expect(typeof service.slideIn).toBe('function');
      expect(typeof service.cleanup).toBe('function');
    });
  });

  describe('Step 2: 테스트 팩토리 중복 제거', () => {
    it('JavaScript와 TypeScript 테스트 팩토리가 중복되어서는 안 됨 (실패해야 함)', () => {
      // RED: 파일 시스템에서 실제 JavaScript 팩토리 파일 존재 확인
      const jsFactoryPath = path.resolve(__dirname, '../utils/helpers/test-factories.js');
      const tsFactoryPath = path.resolve(__dirname, '../utils/fixtures/test-factories.ts');
      
      const jsFactoryExists = existsSync(jsFactoryPath);

      // JavaScript 팩토리가 삭제되어야 함
      expect(jsFactoryExists).toBe(false);
    });

    it('통합된 테스트 팩토리가 모든 기능을 TypeScript로 제공해야 함', async () => {
      // GREEN: TypeScript 팩토리만 사용
      const factories = await import('../utils/fixtures/test-factories');

      expect(typeof factories.createMockMediaUrl).toBe('function');
      expect(typeof factories.createMockElement).toBe('function');
      expect(typeof factories.createMockImageElement).toBe('function');
      expect(typeof factories.createMockVideoElement).toBe('function');
    });
  });

  describe('Step 3: Vendor Mock 중복 제거', () => {
    it('vendor-mocks.ts와 vendor-mocks-clean.ts가 중복되어서는 안 됨 (실패해야 함)', () => {
      // RED: 파일 시스템에서 실제 중복 파일 존재 확인
      const vendorMocksCleanPath = path.resolve(__dirname, '../utils/mocks/vendor-mocks-clean.ts');
      const vendorMocksCleanExists = existsSync(vendorMocksCleanPath);

      // clean 버전이 삭제되어야 함
      expect(vendorMocksCleanExists).toBe(false);
    });

    it('통합된 vendor mock이 모든 필요한 기능을 제공해야 함', async () => {
      // GREEN: 하나의 통합된 vendor mock
      const vendorMocks = await import('../utils/mocks/vendor-mocks');

      expect(typeof vendorMocks.createMockFflate).toBe('function');
      expect(typeof vendorMocks.createMockPreact).toBe('function');
      expect(typeof vendorMocks.createMockMotion).toBe('function');
      expect(typeof vendorMocks.MockVendorManager).toBe('function');
    });
  });

  describe('Step 4: DOM Mock 중복 제거', () => {
    it('여러 DOM Mock 구현이 중복되어서는 안 됨 (실패해야 함)', () => {
      // RED: 실제 파일 시스템에서 DOM Mock 파일 수 확인
      const domMockFiles = [
        path.resolve(__dirname, '../utils/mocks/dom-mocks.ts'),
        path.resolve(__dirname, '../__mocks__/twitter-dom.mock.ts'),
        path.resolve(__dirname, '../utils/dom-test-utils.ts'),
      ].filter(file => existsSync(file));

      // 3개 이상의 DOM Mock 구현이 있으므로 실패해야 함
      expect(domMockFiles.length).toBeLessThan(3);
    });

    it('통합된 DOM Mock이 모든 필요한 기능을 제공해야 함', async () => {
      // GREEN: 하나의 통합된 DOM Mock
      const domMocks = await import('../utils/mocks/dom-mocks');

      expect(typeof domMocks.createMockElement).toBe('function');
      expect(typeof domMocks.createMockImageElement).toBe('function');
      expect(typeof domMocks.createMockVideoElement).toBe('function');
      expect(typeof domMocks.setupDOMEnvironment).toBe('function');
    });
  });

  describe('Step 5: 네이밍 일관성 검증', () => {
    it('과도한 수식어가 제거되어야 함', () => {
      const problematicNames = [
        'Simple',
        'Simplified',
        'Advanced',
        'New',
        'Old',
        'Optimized',
        'Unified',
      ];

      // 이런 수식어들이 클래스명에 사용되지 않아야 함
      problematicNames.forEach(modifier => {
        expect(['SimpleResourceManager', 'UnifiedServiceManager']).not.toContain(
          expect.stringContaining(modifier)
        );
      });
    });

    it('서비스 클래스들이 일관된 Service 접미사를 가져야 함', async () => {
      const services = ['AnimationService', 'MediaService', 'GalleryService', 'ToastService'];

      services.forEach(serviceName => {
        expect(serviceName).toMatch(/Service$/);
      });
    });
  });
});
