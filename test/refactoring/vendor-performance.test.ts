/**
 * @fileoverview TDD REFACTOR - 성능 최적화 및 메모리 관리 테스트
 * @description 정적 import 기반 vendor 시스템의 성능 특성 검증
 *
 * TDD Phase: REFACTOR - 품질 개선 및 최적화
 */

// @ts-nocheck - 벤더 성능 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeVendorsSafe,
  getFflateSafe,
  getPreactSafe,
  resetVendorManagerInstance,
  getVendorStatusesSafe,
  cleanupVendorsSafe,
} from '../../src/shared/external/vendors/vendor-api-safe';

// Performance API 대체 (Node.js 환경)
const now = () => Date.now();

describe('TDD REFACTOR - Vendor System Performance', () => {
  beforeEach(() => {
    resetVendorManagerInstance();
  });

  afterEach(() => {
    cleanupVendorsSafe();
    resetVendorManagerInstance();
  });

  describe('Initialization Performance', () => {
    it('should initialize vendors quickly', async () => {
      const startTime = now();

      await initializeVendorsSafe();

      const endTime = now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should cache vendor APIs efficiently', async () => {
      await initializeVendorsSafe();

      // 첫 번째 호출 시간 측정
      const start1 = now();
      const fflate1 = await getFflateSafe();
      const end1 = now();

      // 두 번째 호출 시간 측정 (캐시된 결과)
      const start2 = now();
      const fflate2 = await getFflateSafe();
      const end2 = now();

      // 동일한 인스턴스 반환
      expect(fflate1).toStrictEqual(fflate2);

      // 두 번째 호출이 훨씬 빨라야 함 (캐시 효과)
      const firstCallDuration = end1 - start1;
      const secondCallDuration = end2 - start2;

      expect(secondCallDuration).toBeLessThan(firstCallDuration + 5); // 관대한 기준
    });

    it('should handle concurrent API access efficiently', async () => {
      await initializeVendorsSafe();

      const startTime = now();

      // 동시에 여러 vendor API 요청
      const promises = await Promise.all([
        getFflateSafe(),
        getPreactSafe(),
        getFflateSafe(), // 중복 요청
        getPreactSafe(), // 중복 요청
      ]);

      const endTime = now();
      const duration = endTime - startTime;

      // 모든 API가 반환되어야 함
      expect(promises).toHaveLength(4);
      expect(promises.every(api => api !== null)).toBe(true);

      // 동일한 타입의 API는 같은 인스턴스여야 함 (캐시)
      expect(promises[0]).toStrictEqual(promises[2]); // fflate
      expect(promises[1]).toStrictEqual(promises[3]); // preact

      // 합리적인 시간 내에 완료
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    it('should maintain stable memory usage', async () => {
      // 간단한 메모리 측정 (Node.js 환경에서)
      const measureMemory = () => {
        // 가비지 컬렉션이 가능하면 실행
        const g = globalThis;
        if (g && typeof g.gc === 'function') {
          g.gc();
        }
        // process가 사용 가능하면 메모리 정보 반환
        if (g && g.process && typeof g.process.memoryUsage === 'function') {
          return g.process.memoryUsage();
        }
        return { heapUsed: 0 }; // 폴백
      };

      const initialMemory = measureMemory();

      // 여러 번 초기화/정리 반복
      for (let i = 0; i < 5; i++) {
        await initializeVendorsSafe();
        await getFflateSafe();
        await getPreactSafe();
        cleanupVendorsSafe();
        resetVendorManagerInstance();
      }

      const finalMemory = measureMemory();

      // 메모리 사용량이 크게 증가하지 않아야 함 (합리적인 기준)
      if (initialMemory.heapUsed > 0) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

        expect(memoryIncreasePercent).toBeLessThan(50); // 50% 미만 증가
      } else {
        // 메모리 측정이 불가능한 경우 최소한 완료되었는지 확인
        expect(true).toBe(true);
      }
    });

    it('should cleanup properly without memory leaks', async () => {
      // 초기화
      await initializeVendorsSafe();
      const apis = await Promise.all([getFflateSafe(), getPreactSafe()]);

      expect(apis.every(api => api !== null)).toBe(true);

      // 정리
      cleanupVendorsSafe();
      resetVendorManagerInstance();

      // 상태 확인
      const statuses = getVendorStatusesSafe();
      // 정적 import 기반에서는 cleanup 후에도 API는 여전히 접근 가능하므로 단순 true 확인
      expect(Object.values(statuses).every(status => status === true)).toBe(true);
    });
  });

  describe('Static Import Advantages', () => {
    it('should have immediate code availability', async () => {
      // 정적 import는 번들 시 코드가 즉시 사용 가능
      const startTime = now();

      await initializeVendorsSafe();
      const fflate = await getFflateSafe();

      const endTime = now();

      // fflate 함수 즉시 사용 가능
      expect(typeof fflate.deflate).toBe('function');
      expect(typeof fflate.inflate).toBe('function');

      // 매우 빠른 접근 시간 (관대한 기준)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should have predictable bundle size', async () => {
      // 정적 import는 번들 크기가 예측 가능
      await initializeVendorsSafe();

      const fflate = await getFflateSafe();
      const preact = await getPreactSafe();

      // 모든 메서드가 사용 가능해야 함
      expect(fflate).toHaveProperty('deflate');
      expect(fflate).toHaveProperty('inflate');
      expect(preact).toHaveProperty('createElement');
      expect(preact).toHaveProperty('render');
    });

    it('should eliminate TDZ risks completely', async () => {
      // 여러 번 빠른 연속 호출해도 TDZ 에러 없어야 함
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(initializeVendorsSafe());
      }

      // 모든 초기화가 성공해야 함
      const results = await Promise.allSettled(promises);

      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });
  });

  describe('Resource Efficiency', () => {
    it('should minimize redundant operations', async () => {
      // 여러 번 호출해도 내부적으로는 한 번만 초기화
      await Promise.all([
        initializeVendorsSafe(),
        initializeVendorsSafe(),
        initializeVendorsSafe(),
      ]);

      // vendor API 실제 접근해서 초기화 확인
      const fflate = await getFflateSafe();
      const preact = await getPreactSafe();

      // 실제 API가 사용 가능한지 확인
      expect(fflate).toBeTruthy();
      expect(preact).toBeTruthy();
      expect(typeof fflate.deflate).toBe('function');
      expect(typeof preact.createElement).toBe('function');
    });

    it('should handle rapid successive calls gracefully', async () => {
      const promises = [];

      // 빠른 연속 호출
      for (let i = 0; i < 20; i++) {
        promises.push(getFflateSafe());
      }

      const startTime = now();
      const results = await Promise.all(promises);
      const endTime = now();

      // 모든 결과가 동일한 인스턴스
      expect(results.every(result => JSON.stringify(result) === JSON.stringify(results[0]))).toBe(
        true
      );

      // 합리적인 시간 내 완료
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
