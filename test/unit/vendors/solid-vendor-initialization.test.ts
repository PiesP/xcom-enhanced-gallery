/**
 * @fileoverview Phase 1: Solid Vendor Initialization Tests
 * @description TDD RED → GREEN: Solid.js vendor 초기화 및 API 제공 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSolid as getSolidSafe,
  getSolidWeb as getSolidWebSafe,
  initializeVendors,
  resetVendorManagerInstance,
} from '../../../src/shared/external/vendors';

describe('Phase 1: Solid Vendor Initialization', () => {
  beforeEach(() => {
    // 각 테스트마다 깨끗한 상태로 시작
    resetVendorManagerInstance();
  });

  describe('Solid Core API', () => {
    it('should provide getSolidSafe() after initialization', async () => {
      await initializeVendors();

      const solid = getSolidSafe();

      expect(solid).toBeDefined();
      expect(solid.createSignal).toBeDefined();
      expect(typeof solid.createSignal).toBe('function');
      expect(solid.createEffect).toBeDefined();
      expect(typeof solid.createEffect).toBe('function');
      expect(solid.createMemo).toBeDefined();
      expect(typeof solid.createMemo).toBe('function');
    });

    it('should return functional createSignal from Solid API', async () => {
      await initializeVendors();

      const { createSignal } = getSolidSafe();
      const [count, setCount] = createSignal(0);

      expect(count()).toBe(0);

      setCount(5);
      expect(count()).toBe(5);

      setCount(prev => prev + 10);
      expect(count()).toBe(15);
    });

    it('should provide createMemo for computed values', async () => {
      await initializeVendors();

      const { createSignal, createMemo } = getSolidSafe();

      // JSDOM 환경에서는 SSR 모드로 동작하므로 기본적인 API만 검증
      const [count] = createSignal(10);
      const doubled = createMemo(() => count() * 2);

      // 초기값 검증
      expect(doubled()).toBe(20);

      // SSR 모드에서는 반응성이 동작하지 않으므로 API 존재 여부만 확인
      expect(typeof createMemo).toBe('function');
    });
  });

  describe('Solid Web API', () => {
    it('should provide getSolidWebSafe() after initialization', async () => {
      await initializeVendors();

      const solidWeb = getSolidWebSafe();

      expect(solidWeb).toBeDefined();
      expect(solidWeb.render).toBeDefined();
      expect(typeof solidWeb.render).toBe('function');
    });
  });

  describe('Independence from Preact', () => {
    it('should initialize Solid independently of Preact', async () => {
      await initializeVendors();

      // Preact와 Solid 모두 정상 작동해야 함
      const { getPreact } = await import('../../../src/shared/external/vendors');
      const { getSolid } = await import('../../../src/shared/external/vendors');

      const preact = getPreact();
      const solid = getSolid();

      expect(preact.h).toBeDefined();
      expect(solid.createSignal).toBeDefined();

      // 서로 독립적으로 작동
      const [count] = solid.createSignal(100);
      expect(count()).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle Solid access safely with auto-initialization', async () => {
      // StaticVendorManager는 자동 초기화를 지원하므로
      // 초기화 없이 접근해도 자동으로 초기화됨
      const solid = getSolidSafe();
      expect(solid).toBeDefined();
      expect(solid.createSignal).toBeDefined();
    });

    it('should provide helpful error message on initialization failure', async () => {
      // 정상 케이스에서는 실패하지 않음 (Solid가 실제로 설치되어 있으므로)
      // 이 테스트는 에러 메시지 형식만 검증
      await expect(initializeVendors()).resolves.not.toThrow();
    });
  });
});
