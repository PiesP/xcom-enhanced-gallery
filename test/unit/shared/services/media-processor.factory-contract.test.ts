/**
 * @file GREEN: MediaProcessor Service Factory Contract Test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreService, getService, registerServiceFactory } from '@shared/services/ServiceManager';

interface ExpectedMediaProcessor {
  processHtml(): void;
  extractMediaUrls(): string[];
  getStats(): { processedNodes: number; mediaCount: number };
  reset(): void;
}

describe('Phase 6 GREEN: MediaProcessor 서비스 팩토리 계약', () => {
  beforeEach(() => {
    CoreService.resetInstance();
  });

  it('registerServiceFactory 함수가 존재한다', () => {
    expect(typeof registerServiceFactory).toBe('function');
  });

  it('MediaProcessor는 지연 생성된다', () => {
    let created = 0;
    const factory = vi.fn(() => {
      created += 1;
      return {
        processHtml: vi.fn(),
        extractMediaUrls: vi.fn(() => []),
        getStats: vi.fn(() => ({ processedNodes: 0, mediaCount: 0 })),
        reset: vi.fn(),
      } satisfies ExpectedMediaProcessor;
    });

    registerServiceFactory<ExpectedMediaProcessor>('mediaProcessor', factory);
    expect(created).toBe(0);

    const instance = getService<ExpectedMediaProcessor>('mediaProcessor');
    expect(instance).toBeTruthy();
    expect(factory).toHaveBeenCalledTimes(1);

    // 다시 호출해도 팩토리 재실행 안됨
    getService<ExpectedMediaProcessor>('mediaProcessor');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('퍼블릭 메서드 계약을 제공한다', () => {
    const factory = () => ({
      processHtml() {},
      extractMediaUrls() {
        return [];
      },
      getStats() {
        return { processedNodes: 0, mediaCount: 0 };
      },
      reset() {},
    });
    registerServiceFactory('mediaProcessor', factory);

    const instance = getService<ExpectedMediaProcessor>('mediaProcessor');
    expect(typeof instance.processHtml).toBe('function');
    expect(typeof instance.extractMediaUrls).toBe('function');
    expect(typeof instance.getStats).toBe('function');
    expect(typeof instance.reset).toBe('function');
  });

  it('동일 key 재등록 시 경고 후 무시한다', () => {
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
    const factoryA = () => ({
      processHtml() {},
      extractMediaUrls() {
        return [];
      },
      getStats() {
        return { processedNodes: 0, mediaCount: 0 };
      },
      reset() {},
    });
    const factoryB = () => ({
      processHtml() {},
      extractMediaUrls() {
        return [];
      },
      getStats() {
        return { processedNodes: 0, mediaCount: 0 };
      },
      reset() {},
    });

    registerServiceFactory('mediaProcessor', factoryA);
    registerServiceFactory('mediaProcessor', factoryB); // 무시 기대

    // 첫 조회 시 factoryA만 호출
    getService<ExpectedMediaProcessor>('mediaProcessor');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
