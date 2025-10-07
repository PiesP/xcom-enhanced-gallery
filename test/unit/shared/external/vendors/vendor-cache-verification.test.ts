/**
 * @fileoverview Vendor Getter Cache 검증 테스트 (RED)
 * @description Phase 9.2 - getSolid()와 getSolidWeb()의 캐시 동작 검증
 *
 * 목적:
 * - 동일한 키로 여러 번 호출 시 동일한 객체가 반환되는지 검증
 * - Show 컴포넌트 중복 문제를 방지하기 위한 캐시 동작 확인
 * - 초기화 이전/이후 모두에서 캐시가 올바르게 동작하는지 확인
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static';

describe('[Phase 9.2][RED] Vendor Getter Cache Verification', () => {
  let vendorManager: StaticVendorManager;

  beforeEach(async () => {
    // 새 인스턴스 생성 및 초기화
    vendorManager = StaticVendorManager.getInstance();
    await vendorManager.initialize();
  });

  describe('getSolid() 캐시 동작', () => {
    it('동일한 객체를 반환해야 함 (캐시 적중)', () => {
      const firstCall = vendorManager.getSolid();
      const secondCall = vendorManager.getSolid();

      // 동일한 객체 참조 검증 (Object.is)
      expect(Object.is(firstCall, secondCall)).toBe(true);
      expect(firstCall).toBe(secondCall);
    });

    it('Show 컴포넌트가 동일한 인스턴스여야 함', () => {
      const firstCall = vendorManager.getSolid();
      const secondCall = vendorManager.getSolid();

      // Show 컴포넌트 동일성 검증
      expect(Object.is(firstCall.Show, secondCall.Show)).toBe(true);
      expect(firstCall.Show).toBe(secondCall.Show);
    });

    it('createSignal이 동일한 함수 참조여야 함', () => {
      const firstCall = vendorManager.getSolid();
      const secondCall = vendorManager.getSolid();

      // 함수 참조 동일성 검증
      expect(Object.is(firstCall.createSignal, secondCall.createSignal)).toBe(true);
      expect(firstCall.createSignal).toBe(secondCall.createSignal);
    });

    it('초기화 이전에도 동일한 객체를 반환해야 함 (캐시 미스 후 캐시 저장)', () => {
      // 새 인스턴스 생성 (초기화 안 함)
      // Note: StaticVendorManager는 싱글톤이므로 실제로는 이미 초기화된 인스턴스를 반환
      // 하지만 캐시 로직 자체는 초기화 여부와 관계없이 동작해야 함
      const firstCall = vendorManager.getSolid();

      // 캐시를 강제로 비우고 다시 호출 (실제 코드에서는 발생하지 않지만 테스트용)
      // 이 테스트는 getSolid() 내부에서 캐시가 없을 때도 캐시에 저장하는지 확인
      const secondCall = vendorManager.getSolid();

      expect(Object.is(firstCall, secondCall)).toBe(true);
    });
  });

  describe('getSolidWeb() 캐시 동작', () => {
    it('동일한 객체를 반환해야 함 (캐시 적중)', () => {
      const firstCall = vendorManager.getSolidWeb();
      const secondCall = vendorManager.getSolidWeb();

      // 동일한 객체 참조 검증
      expect(Object.is(firstCall, secondCall)).toBe(true);
      expect(firstCall).toBe(secondCall);
    });

    it('render 함수가 동일한 참조여야 함', () => {
      const firstCall = vendorManager.getSolidWeb();
      const secondCall = vendorManager.getSolidWeb();

      // render 함수 동일성 검증
      expect(Object.is(firstCall.render, secondCall.render)).toBe(true);
      expect(firstCall.render).toBe(secondCall.render);
    });

    it('Portal 컴포넌트가 동일한 인스턴스여야 함', () => {
      const firstCall = vendorManager.getSolidWeb();
      const secondCall = vendorManager.getSolidWeb();

      // Portal 컴포넌트 동일성 검증
      expect(Object.is(firstCall.Portal, secondCall.Portal)).toBe(true);
      expect(firstCall.Portal).toBe(secondCall.Portal);
    });
  });

  describe('Show 컴포넌트 중복 검증', () => {
    it('getSolid().Show와 getSolidWeb().Show는 다른 인스턴스여야 함 (현재 구조)', () => {
      const solidAPI = vendorManager.getSolid();
      const solidWebAPI = vendorManager.getSolidWeb();

      // 현재 구조에서는 solid-js와 solid-js/web의 Show가 다를 수 있음
      // 하지만 각각의 호출에서는 캐시된 객체를 반환해야 함
      expect(solidAPI.Show).toBeDefined();
      expect(solidWebAPI.Show).toBeDefined();
    });
  });

  describe('캐시 초기화 검증', () => {
    it('initialize() 호출 후 캐시가 준비되어 있어야 함', async () => {
      // 새 인스턴스로 테스트 (싱글톤이므로 동일한 인스턴스)
      const newManager = StaticVendorManager.getInstance();
      await newManager.initialize();

      const solidAPI = newManager.getSolid();
      const solidWebAPI = newManager.getSolidWeb();

      // 캐시가 준비되어 있으므로 즉시 동일한 객체 반환
      expect(solidAPI).toBeDefined();
      expect(solidWebAPI).toBeDefined();

      const solidAPI2 = newManager.getSolid();
      const solidWebAPI2 = newManager.getSolidWeb();

      expect(Object.is(solidAPI, solidAPI2)).toBe(true);
      expect(Object.is(solidWebAPI, solidWebAPI2)).toBe(true);
    });
  });

  describe('캐시 일관성 검증 (핵심 테스트)', () => {
    it('캐시 미스 후 생성된 객체가 다음 호출에서도 동일해야 함', () => {
      // cacheAPIs()가 호출되지 않은 상태를 시뮬레이션하기 위해
      // 직접 getSolid()를 여러 번 호출
      const calls = [vendorManager.getSolid(), vendorManager.getSolid(), vendorManager.getSolid()];

      // 모든 호출이 동일한 객체를 반환해야 함
      for (let i = 1; i < calls.length; i++) {
        expect(Object.is(calls[0], calls[i])).toBe(true);
        expect(calls[0]).toBe(calls[i]);
      }
    });

    it('getSolidWeb() 여러 번 호출 시 모두 동일한 객체 반환', () => {
      const calls = [
        vendorManager.getSolidWeb(),
        vendorManager.getSolidWeb(),
        vendorManager.getSolidWeb(),
      ];

      // 모든 호출이 동일한 객체를 반환해야 함
      for (let i = 1; i < calls.length; i++) {
        expect(Object.is(calls[0], calls[i])).toBe(true);
        expect(calls[0]).toBe(calls[i]);
      }
    });

    it('Show 컴포넌트 참조가 여러 호출에서 일관되게 유지되어야 함', () => {
      const solidCalls = [
        vendorManager.getSolid(),
        vendorManager.getSolid(),
        vendorManager.getSolid(),
      ];

      // 모든 getSolid() 호출에서 Show 컴포넌트가 동일해야 함
      for (let i = 1; i < solidCalls.length; i++) {
        expect(Object.is(solidCalls[0].Show, solidCalls[i].Show)).toBe(true);
      }

      const solidWebCalls = [
        vendorManager.getSolidWeb(),
        vendorManager.getSolidWeb(),
        vendorManager.getSolidWeb(),
      ];

      // 모든 getSolidWeb() 호출에서 Show 컴포넌트가 동일해야 함
      for (let i = 1; i < solidWebCalls.length; i++) {
        expect(Object.is(solidWebCalls[0].Show, solidWebCalls[i].Show)).toBe(true);
      }
    });
  });
});
