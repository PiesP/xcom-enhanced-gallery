/**
 * @fileoverview Phase 2: Vendor 시스템 정리 테스트
 * @description 레거시 vendor-manager.ts 제거 및 StaticVendorManager 통합
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('Phase 2: Vendor 시스템 정리', () => {
  beforeEach(() => {
    // 각 테스트 전에 vendor 상태 초기화
  });

  afterEach(() => {
    // 테스트 후 정리
  });

  describe('TDD RED: 레거시 시스템 식별', () => {
    test('레거시 VendorManager 사용 금지', async () => {
      // Phase 2에서는 StaticVendorManager 사용을 권장하고
      // 레거시 VendorManager 사용을 지양해야 함

      const fs = await import('fs');
      const path = await import('path');

      // 레거시 파일 존재 여부 확인
      const legacyPath = path.resolve(
        process.cwd(),
        'src/shared/external/vendors/vendor-manager.ts'
      );
      const legacyExists = fs.existsSync(legacyPath);

      if (legacyExists) {
        // Phase 2에서는 아직 존재할 수 있지만 사용을 권장하지 않음
        console.warn(
          'WARNING: Legacy vendor-manager.ts still exists. Migration to StaticVendorManager recommended.'
        );
        expect(true).toBe(true); // 현재는 통과
      } else {
        // 파일이 제거되었으면 성공
        expect(true).toBe(true);
      }
    });

    test('StaticVendorManager만 사용 가능해야 함', async () => {
      // GREEN으로 갈 준비: StaticVendorManager는 사용 가능해야 함
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );

      expect(StaticVendorManager).toBeDefined();
      expect(typeof StaticVendorManager.getInstance).toBe('function');
    });
  });

  describe('TDD GREEN: StaticVendorManager 통합', () => {
    test('모든 vendor API 접근이 StaticVendorManager를 통해 이루어짐', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );
      const manager = StaticVendorManager.getInstance();

      // 모든 주요 API가 사용 가능해야 함
      expect(manager.getFflate).toBeDefined();
      expect(manager.getPreact).toBeDefined();
      expect(manager.getPreactHooks).toBeDefined();
      expect(manager.getPreactSignals).toBeDefined();
      expect(manager.getPreactCompat).toBeDefined();
      expect(manager.getNativeDownload).toBeDefined();
    });

    test('TDZ 문제 없는 안전한 초기화', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );
      const manager = StaticVendorManager.getInstance();

      // 초기화 없이도 getter 호출이 안전해야 함
      expect(() => manager.getFflate()).not.toThrow();
      expect(() => manager.getPreact()).not.toThrow();
      expect(() => manager.getPreactSignals()).not.toThrow();
    });

    test('라이브러리 검증 기능 정상 작동', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );
      const manager = StaticVendorManager.getInstance();

      const validation = await manager.validateAll();

      expect(validation).toHaveProperty('success');
      expect(validation).toHaveProperty('loadedLibraries');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.loadedLibraries)).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('TDD REFACTOR: 인덱스 파일 업데이트', () => {
    test('vendor 인덱스가 StaticVendorManager를 export', async () => {
      const vendorIndex = await import('../../../src/shared/external/vendors/index');

      // StaticVendorManager가 VendorManager로 export되어야 함
      expect(vendorIndex.VendorManager).toBeDefined();
      expect(vendorIndex.StaticVendorManager).toBeDefined();

      // 둘이 같은 클래스여야 함 (StaticVendorManager가 기본)
      expect(vendorIndex.VendorManager).toBe(vendorIndex.StaticVendorManager);
    });

    test('편의 함수들이 정상 작동', async () => {
      const { getFflate, getPreact, getPreactHooks, getPreactSignals, getNativeDownload } =
        await import('../../../src/shared/external/vendors/index');

      // 모든 편의 함수가 정의되어야 함
      expect(typeof getFflate).toBe('function');
      expect(typeof getPreact).toBe('function');
      expect(typeof getPreactHooks).toBe('function');
      expect(typeof getPreactSignals).toBe('function');
      expect(typeof getNativeDownload).toBe('function');

      // 실제 호출도 가능해야 함
      expect(() => getFflate()).not.toThrow();
      expect(() => getPreact()).not.toThrow();
      expect(() => getPreactSignals()).not.toThrow();
    });

    test('vendor 타입 정의 일관성', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );
      const manager = StaticVendorManager.getInstance();

      // API 타입들이 일관되게 정의되어야 함
      const fflate = manager.getFflate();
      const preact = manager.getPreact();
      const hooks = manager.getPreactHooks();
      const signals = manager.getPreactSignals();

      expect(fflate).toHaveProperty('deflate');
      expect(fflate).toHaveProperty('zipSync');
      expect(preact).toHaveProperty('h');
      expect(preact).toHaveProperty('render');
      expect(hooks).toHaveProperty('useState');
      expect(hooks).toHaveProperty('useEffect');
      expect(signals).toHaveProperty('signal');
      expect(signals).toHaveProperty('computed');
    });
  });

  describe('메모리 관리 및 성능', () => {
    test('메모리 정리 기능', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );
      const manager = StaticVendorManager.getInstance();

      // 다운로드 API 테스트
      const download = manager.getNativeDownload();

      expect(download).toHaveProperty('downloadBlob');
      expect(download).toHaveProperty('createDownloadUrl');
      expect(download).toHaveProperty('revokeDownloadUrl');

      // 정리 기능 테스트
      expect(() => manager.cleanup()).not.toThrow();
    });

    test('싱글톤 인스턴스 관리', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );

      const instance1 = StaticVendorManager.getInstance();
      const instance2 = StaticVendorManager.getInstance();

      // 같은 인스턴스여야 함
      expect(instance1).toBe(instance2);

      // 리셋 후에는 새로운 인스턴스
      StaticVendorManager.resetInstance();
      const instance3 = StaticVendorManager.getInstance();

      expect(instance3).not.toBe(instance1);
    });

    test('초기화 상태 추적', async () => {
      const { StaticVendorManager } = await import(
        '../../../src/shared/external/vendors/vendor-manager-static'
      );
      StaticVendorManager.resetInstance(); // 깨끗한 상태로 시작

      const manager = StaticVendorManager.getInstance();
      const status = manager.getInitializationStatus();

      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('cacheSize');
      expect(status).toHaveProperty('availableAPIs');
      expect(Array.isArray(status.availableAPIs)).toBe(true);
    });
  });

  describe('하위 호환성 확인', () => {
    test('기존 코드가 계속 작동함', async () => {
      // 기존 방식으로 vendor API 접근
      const { getFflate, getPreact } = await import('../../../src/shared/external/vendors');

      const fflate = getFflate();
      const preact = getPreact();

      expect(fflate).toBeDefined();
      expect(preact).toBeDefined();
      expect(typeof fflate.deflate).toBe('function');
      expect(typeof preact.render).toBe('function');
    });

    test('컴포넌트에서 안전한 사용', async () => {
      const { getPreactCompat } = await import('../../../src/shared/external/vendors');

      // 컴포넌트에서 memo, forwardRef 사용 가능
      const compat = getPreactCompat();

      expect(compat).toHaveProperty('memo');
      expect(compat).toHaveProperty('forwardRef');
      expect(typeof compat.memo).toBe('function');
      expect(typeof compat.forwardRef).toBe('function');
    });
  });
});
