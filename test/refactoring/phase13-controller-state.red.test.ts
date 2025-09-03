// @vitest-environment jsdom
/**
 * Phase13 RED: GalleryController 확장 상태/메트릭 일원화 요구사항
 * 목표 (이 테스트가 GREEN 되려면):
 * 1) GalleryController.getState() 신규 API 제공 (diagnostics 축약 형태)
 *    - { open: boolean, count: number, index: number, initialized: boolean }
 * 2) open() 호출 시 lastOpenAt(ms), openCount 누적 메트릭을 노출 (getState().metrics)
 * 3) close() 후 open=false 즉시 반영
 * 현재 스캐폴드는 getDiagnostics()만 제공 → 본 테스트 실패 예상.
 */
import { describe, it, expect } from 'vitest';
import { GalleryController } from '@/features/gallery/GalleryController';

// 테스트용 더미 미디어
const media = [
  { id: 'm1', url: 'https://example.com/1.jpg', type: 'image' },
  { id: 'm2', url: 'https://example.com/2.jpg', type: 'image' },
] as any;

// 플래그 강제 ON
(globalThis as any).__XEG_FORCE_FLAGS__ = {
  ...(globalThis as any).__XEG_FORCE_FLAGS__,
  FEATURE_GALLERY_CONTROLLER: true,
};

describe('Phase13 RED: GalleryController state facade', () => {
  it('getState() 기본 구조 및 open/close 메트릭을 제공해야 함', async () => {
    const c = new GalleryController();
    // initialize 호출 없이 open → 내부 initialize 동기 반영
    expect(typeof c.getState).toBe('function');
    const s0 = c.getState();
    // RED 기대: 구조 미구현 → undefined 이거나 누락된 키로 실패
    expect(s0).toBeDefined();
    expect(s0.open).toBe(false);
    expect(s0.count).toBe(0);
    expect(s0.index).toBe(0);
    expect(typeof s0.initialized).toBe('boolean');
    // 메트릭 객체 존재
    expect(s0.metrics).toBeDefined();
    expect(s0.metrics.openCount).toBe(0);

    await c.open(media, 1);
    const s1 = c.getState();
    expect(s1.open).toBe(true);
    expect(s1.count).toBe(media.length);
    expect(s1.index).toBe(1);
    expect(s1.metrics.openCount).toBe(1);
    expect(typeof s1.metrics.lastOpenAt).toBe('number');

    c.close();
    const s2 = c.getState();
    expect(s2.open).toBe(false);
  });
});
