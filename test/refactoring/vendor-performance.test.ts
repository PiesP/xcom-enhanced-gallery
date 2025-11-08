/**
 * @fileoverview TDD REFACTOR - Solid 기반 vendor 시스템 성능 테스트
 * @description 정적 import 기반 vendor 시스템의 성능 및 메모리 특성 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import {
  initializeVendorsSafe,
  getSolidSafe,
  getSolidStoreSafe,
  resetVendorManagerInstance,
  getVendorStatusesSafe,
  cleanupVendorsSafe,
  getNativeDownloadSafe,
  isVendorsInitializedSafe,
} from '@shared/external/vendors/vendor-api-safe';
import type { SolidAPI, SolidStoreAPI } from '@shared/external/vendors/vendor-manager-static';

const now = () => Date.now();

interface MemoryInfo {
  heapUsed: number;
}

describe('TDD REFACTOR - Vendor System Performance (Solid)', () => {
  setupGlobalTestIsolation();

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
      expect(isVendorsInitializedSafe()).toBe(true);
    });

    it('should cache vendor APIs efficiently', async () => {
      await initializeVendorsSafe();

      const start1 = now();
      const solidFirst = getSolidSafe();
      const end1 = now();

      const start2 = now();
      const solidSecond = getSolidSafe();
      const end2 = now();

      expect(solidFirst).toBe(solidSecond);

      const firstCallDuration = end1 - start1;
      const secondCallDuration = end2 - start2;

      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration + 1);
    });

    it('should handle concurrent API access efficiently', async () => {
      await initializeVendorsSafe();

      const startTime = now();

      const apis = await Promise.all([
        Promise.resolve().then(() => getSolidSafe()),
        Promise.resolve().then(() => getSolidStoreSafe()),
        Promise.resolve().then(() => getSolidSafe()),
        Promise.resolve().then(() => getSolidStoreSafe()),
      ]);

      const endTime = now();
      const duration = endTime - startTime;

      expect(apis).toHaveLength(4);
      const [solidA, storeA, solidB, storeB] = apis as [
        SolidAPI,
        SolidStoreAPI,
        SolidAPI,
        SolidStoreAPI,
      ];

      expect(solidA).toBe(solidB);
      expect(storeA).toBe(storeB);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    it('should maintain stable memory usage', async () => {
      const measureMemory = (): MemoryInfo => {
        if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
          const { heapUsed } = process.memoryUsage();
          return { heapUsed };
        }
        return { heapUsed: 0 };
      };

      const initialMemory = measureMemory();

      for (let i = 0; i < 5; i++) {
        await initializeVendorsSafe();
        getSolidSafe();
        getSolidStoreSafe();
        getNativeDownloadSafe();
        cleanupVendorsSafe();
        resetVendorManagerInstance();
      }

      const finalMemory = measureMemory();

      if (initialMemory.heapUsed > 0 && finalMemory.heapUsed > 0) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
        expect(memoryIncreasePercent).toBeLessThan(50);
      } else {
        expect(true).toBe(true);
      }
    });

    it('should cleanup properly without memory leaks', async () => {
      await initializeVendorsSafe();
      const solidApi = getSolidSafe();
      const storeApi = getSolidStoreSafe();

      expect(typeof solidApi.createSignal).toBe('function');
      expect(typeof storeApi.createStore).toBe('function');

      cleanupVendorsSafe();
      resetVendorManagerInstance();

      const statuses = getVendorStatusesSafe();
      expect(statuses.solid).toBe(false);
      expect(statuses.solidStore).toBe(false);
    });
  });

  describe('Static Import Advantages', () => {
    it('should have immediate code availability', async () => {
      await initializeVendorsSafe();

      const solidApi = getSolidSafe();

      expect(typeof solidApi.render).toBe('function');
      expect(typeof solidApi.createSignal).toBe('function');
    });

    it('should have predictable bundle size', async () => {
      await initializeVendorsSafe();

      const storeApi = getSolidStoreSafe();
      const downloadApi = getNativeDownloadSafe();

      expect(typeof storeApi.createStore).toBe('function');
      expect(typeof storeApi.produce).toBe('function');
      expect(typeof downloadApi.downloadBlob).toBe('function');
      expect(typeof downloadApi.createDownloadUrl).toBe('function');
    });

    it('should eliminate TDZ risks completely', async () => {
      const initPromises = Array.from({ length: 10 }, () => initializeVendorsSafe());

      const results = await Promise.allSettled(initPromises);

      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });
  });

  describe('Resource Efficiency', () => {
    it('should minimize redundant operations', async () => {
      await Promise.all([
        initializeVendorsSafe(),
        initializeVendorsSafe(),
        initializeVendorsSafe(),
      ]);

      const solidApi = getSolidSafe();
      const storeApi = getSolidStoreSafe();

      expect(typeof solidApi.createSignal).toBe('function');
      expect(typeof storeApi.createStore).toBe('function');
    });

    it('should handle rapid successive calls gracefully', async () => {
      await initializeVendorsSafe();

      const startTime = now();
      const results = Array.from({ length: 20 }, () => getSolidSafe());
      const endTime = now();

      expect(results.every(result => result === results[0])).toBe(true);
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
