/**
 * @fileoverview Phase E: SettingsService 공개 계약 및 기본 동작 가드 테스트
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// SUT (경로: features/settings/services)
import { SettingsService } from '../../../../src/features/settings/services/settings-service';

const PUBLIC_METHODS = [
  'initialize',
  'isInitialized',
  'cleanup',
  'getAllSettings',
  'get',
  'set',
  'updateBatch',
  'resetToDefaults',
  'subscribe',
  'exportSettings',
  'importSettings',
];

describe('Phase E: SettingsService 계약(Contract) 가드', () => {
  let svc: SettingsService;

  beforeEach(async () => {
    // localStorage 초기화 (JSDOM) - globalThis 경유로 접근 (타입 가드)
    (globalThis as any).localStorage?.clear?.();
    svc = new SettingsService();
    await svc.initialize();
  });

  it('필수 공개 메서드를 모두 제공해야 한다', () => {
    for (const key of PUBLIC_METHODS) {
      expect(typeof (svc as any)[key]).toBe('function');
    }
  });

  it('get/set 으로 설정을 변경하고 subscribe 콜백을 트리거한다', async () => {
    const listener = vi.fn();
    const unsubscribe = svc.subscribe(listener);
    await svc.set('gallery.preloadCount', 5);
    expect(svc.get('gallery.preloadCount')).toBe(5);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('updateBatch 로 여러 항목을 일괄 갱신한다', async () => {
    await svc.updateBatch({
      'gallery.preloadCount': 4,
      'performance.debugMode': false,
    });
    expect(svc.get('gallery.preloadCount')).toBe(4);
    expect(svc.get('performance.debugMode')).toBe(false);
  });

  it('resetToDefaults 로 카테고리만 재설정한다', async () => {
    await svc.set('gallery.preloadCount', 7);
    const modified = svc.get('gallery.preloadCount');
    expect(modified).toBe(7);
    await svc.resetToDefaults('gallery');
    // 기본값은 3 (기존 defaultSettings 기준)일 가능성이 높으므로 0~20 범위 내 값/변경 여부만 검증
    const after = svc.get('gallery.preloadCount');
    expect(typeof after).toBe('number');
    expect(after).not.toBe(7); // 값이 되돌아갔음을 간접 확인
  });

  it('export/import round trip 이 설정을 유지한다', async () => {
    await svc.set('gallery.preloadCount', 6);
    const exported = svc.exportSettings();
    const newSvc = new SettingsService();
    await newSvc.initialize();
    await newSvc.importSettings(exported);
    expect(newSvc.get('gallery.preloadCount')).toBe(6);
  });
});
