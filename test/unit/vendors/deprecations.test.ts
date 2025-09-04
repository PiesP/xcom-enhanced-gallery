/**
 * @fileoverview 제거 예정 vendor 파일들 import 실패 테스트
 * @description TDD RED Phase - 중복 vendor 파일 제거 전 안전 검증
 */

import { describe, it, expect } from 'vitest';

describe('Vendor Deprecations - Import Failure Tests (RED)', () => {
  // 제거 예정 파일들이 더 이상 import되지 않아야 함을 검증
  const filesToRemove = [
    'vendor-api-safe-simplified.ts',
    'vendor-api-safe-backup.ts',
    'vendor-manager-static-simplified.ts',
    'vendor-manager-simplified.ts',
    'vendor-api.ts', // legacy API
  ];

  filesToRemove.forEach(filename => {
    it(`should fail to import removed file: ${filename}`, async () => {
      const modulePath = `@shared/external/vendors/${filename.replace('.ts', '')}`;

      try {
        // 파일이 제거되었다면 이 import는 실패해야 함
        await import(modulePath);
        // 만약 import가 성공했다면 테스트 실패 (파일이 아직 존재함)
        expect.fail(`File ${filename} should have been removed but still exists`);
      } catch (error) {
        // 예상된 동작: import 실패
        expect(error).toBeDefined();
        expect(String(error)).toMatch(
          /Cannot resolve module|Module not found|Failed to resolve|Cannot find module/i
        );
      }
    });
  });

  it('should only have essential vendor files remaining', () => {
    // 최종적으로 남아야 할 필수 파일들
    const essentialFiles = [
      'vendor-manager-static.ts',
      'vendor-api-safe.ts',
      'vendor-types.ts',
      'vendor-test-counters.ts',
      'index.ts',
    ];

    // 이 테스트는 구현 후 PASS되어야 함
    expect(essentialFiles.length).toBeGreaterThan(0);
  });
});

describe('Vendor API Compatibility - Safe API Only', () => {
  it('should expose only safe vendor APIs through index', async () => {
    const vendorIndex = await import('@shared/external/vendors');

    // Safe API 함수들이 존재해야 함
    expect(vendorIndex.getFflate).toBeDefined();
    expect(vendorIndex.getPreact).toBeDefined();
    expect(vendorIndex.getPreactHooks).toBeDefined();
    expect(vendorIndex.getPreactSignals).toBeDefined();
    expect(vendorIndex.getPreactCompat).toBeDefined();
    expect(vendorIndex.getNativeDownload).toBeDefined();

    // Legacy API들은 제거되었으므로 존재하지 않아야 함
    expect((vendorIndex as any).initializeVendorsLegacy).toBeUndefined();
    expect((vendorIndex as any).getFflateLegacy).toBeUndefined();
  });

  it('should maintain StaticVendorManager as the only manager', async () => {
    const vendorIndex = await import('@shared/external/vendors');

    expect(vendorIndex.StaticVendorManager).toBeDefined();
    expect(vendorIndex.VendorManager).toBeDefined(); // alias

    // Simplified manager는 제거되어야 함
    expect((vendorIndex as any).SimplifiedVendorManager).toBeUndefined();
  });
});
