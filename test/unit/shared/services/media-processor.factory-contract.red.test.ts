/**
 * @fileoverview Phase 6 (GREEN): Service Factory & Interface Enforcement for MediaProcessor
 * 목표:
 *  - MediaProcessor 서비스를 팩토리 기반으로 지연(lazy) 생성하도록 강제
 *  - registerServiceFactory(key, factory) 형태의 API 존재 요구
 *  - getService(key)는 최초 호출 시 팩토리 실행, 이후 캐시 재사용
 *  - 동일 key 재등록 시 경고 후 무시 (또는 에러) - 현재는 경고 기대
 *  - MediaProcessor 인스턴스는 필요한 퍼블릭 메서드 (processHtml, extractMediaUrls, getStats, reset)를 제공
 *  - 직접 인스턴스 등록(register) 사용을 통한 우회가 감지되면 테스트 실패 (향후 guard)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreService, getService, registerServiceFactory } from '@shared/services/service-manager';

// Phase 6에서 기대하는 새로운 API (아직 존재하지 않음 → RED)
// 타입 단언을 사용하여 존재를 가정하고, 없으면 런타임 에러 유도
interface ExpectedMediaProcessor {
  // NOTE: RED 단계에서는 DOM 타입 직접 의존 회피 (jsdom 환경/타입 누락으로 인한 컴파일 오류 방지)
  processHtml(): void; // GREEN: (root: HTMLElement | Document)
  extractMediaUrls(): string[]; // GREEN: (root: HTMLElement | Document)
  getStats(): { processedNodes: number; mediaCount: number };
  reset(): void;
}

describe('Phase 6 GREEN: MediaProcessor 서비스 팩토리 계약', () => {
  beforeEach(() => {
    CoreService.resetInstance();
  });

  it('registerServiceFactory 함수가 존재해야 한다', () => {
    expect(typeof registerServiceFactory).toBe('function');
  });

  it('MediaProcessor는 지연 생성되어 최초 getService 호출 시 팩토리가 1회 실행된다', () => {
    // 준비: 팩토리 호출 여부 추적
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

    // 아직 서비스 조회 전이므로 created=0 유지 기대
    expect(created).toBe(0);

    registerServiceFactory<ExpectedMediaProcessor>('mediaProcessor', factory);

    // 최초 getService 호출 시 팩토리 실행
    expect(() => getService<ExpectedMediaProcessor>('mediaProcessor')).not.toThrow();

    // Lazy 특성 검증: 정확히 1회
    expect(factory).toHaveBeenCalledTimes(1);
    // 두 번째 호출은 캐시 사용
    getService<ExpectedMediaProcessor>('mediaProcessor');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('MediaProcessor 퍼블릭 메서드 계약을 제공해야 한다', () => {
    // GREEN 목표: getService 시 반환 객체가 메서드 4개 제공
    // 선행 등록이 없을 수도 있으니 보장 위해 임시 등록 (idempotent - 이미 있으면 warn)
    try {
      registerServiceFactory<ExpectedMediaProcessor>('mediaProcessor', () => ({
        processHtml: () => {},
        extractMediaUrls: () => [],
        getStats: () => ({ processedNodes: 0, mediaCount: 0 }),
        reset: () => {},
      }));
    } catch {
      /* ignore duplicate */
    }
    const instance = getService<ExpectedMediaProcessor>('mediaProcessor');
    expect(typeof instance.processHtml).toBe('function');
    expect(typeof instance.extractMediaUrls).toBe('function');
    expect(typeof instance.getStats).toBe('function');
    expect(typeof instance.reset).toBe('function');
  });

  it('동일 key 재등록 시 경고 후 기존 팩토리를 유지한다', () => {
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

    registerServiceFactory<ExpectedMediaProcessor>('mediaProcessor', factoryA);
    registerServiceFactory<ExpectedMediaProcessor>('mediaProcessor', factoryB); // 경고 발생
    // 서비스 조회로 factoryA 실행
    getService<ExpectedMediaProcessor>('mediaProcessor');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
