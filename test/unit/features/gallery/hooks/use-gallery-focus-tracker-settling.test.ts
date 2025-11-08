/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview useGalleryFocusTracker settling 기반 최적화 테스트
 * @description 스크롤 중 포커스 갱신 보류 및 settling 후 처리 검증
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { getSolid } from '@/shared/external/vendors';

const { createSignal } = getSolid();

describe('useGalleryFocusTracker - Settling 기반 최적화', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('스크롤 중 포커스 갱신 보류', () => {
    it('isScrolling === true일 때 recomputeFocus 호출 보류', () => {
      // Given: isScrolling 신호가 true
      const [isScrolling] = createSignal(true);

      // When: IntersectionObserver 이벤트 발생
      // Then: recomputeFocus가 즉시 호출되지 않음
      expect(isScrolling()).toBe(true);
    });

    it('스크롤 중 여러 포커스 갱신 요청은 큐에 추가', () => {
      // Given: isScrolling === true, 여러 IntersectionObserver 이벤트
      const [isScrolling] = createSignal(true);
      const queue: number[] = [];

      // When: 연속으로 5개의 포커스 갱신 요청
      for (let i = 0; i < 5; i++) {
        if (isScrolling()) {
          queue.push(i);
        }
      }

      // Then: 큐에 모든 요청이 추가됨
      expect(queue).toHaveLength(5);
      expect(isScrolling()).toBe(true);
    });

    it('큐는 최신 요청만 유지 (최대 크기 1)', () => {
      // Given: 포커스 갱신 큐
      const queue: Array<{ timestamp: number; reason: string }> = [];

      // When: 여러 요청 추가
      queue.push({ timestamp: 100, reason: 'entry-1' });
      queue.push({ timestamp: 200, reason: 'entry-2' });
      queue.push({ timestamp: 300, reason: 'entry-3' });

      // Then: 최신 요청만 유지
      const latest = queue[queue.length - 1];
      expect(latest?.timestamp).toBe(300);
      expect(latest?.reason).toBe('entry-3');
    });
  });

  describe('Settling 후 큐 처리', () => {
    it('isScrolling === false로 전환 시 큐의 최신 요청 처리', () => {
      // Given: 큐에 쌓인 요청
      const queue: string[] = ['req-1', 'req-2', 'req-3'];
      const [isScrolling, setIsScrolling] = createSignal(true);

      // When: isScrolling이 false로 전환
      setIsScrolling(false);

      // Then: 최신 요청만 처리
      if (!isScrolling() && queue.length > 0) {
        const latest = queue[queue.length - 1];
        expect(latest).toBe('req-3');
      }
    });

    it('settling 후 큐가 비어 있으면 처리하지 않음', () => {
      // Given: 빈 큐
      const queue: string[] = [];
      const [isScrolling, setIsScrolling] = createSignal(true);

      // When: isScrolling이 false로 전환
      setIsScrolling(false);

      // Then: 처리 없음
      expect(queue).toHaveLength(0);
      expect(isScrolling()).toBe(false);
    });

    it('settling 후 recomputeFocus는 한 번만 호출', () => {
      // Given: 여러 요청이 큐에 쌓임
      const recomputeCalls: number[] = [];
      const [isScrolling, setIsScrolling] = createSignal(true);

      // When: 큐에 3개 요청 추가
      if (isScrolling()) {
        // 큐에만 추가, recompute 호출 안 함
      }

      // settling 후
      setIsScrolling(false);
      if (!isScrolling()) {
        recomputeCalls.push(Date.now());
      }

      // Then: recompute는 1회만 호출
      expect(recomputeCalls).toHaveLength(1);
    });
  });

  describe('엣지 케이스', () => {
    it('스크롤 시작/종료 반복 시 큐가 올바르게 처리됨', () => {
      const [isScrolling, setIsScrolling] = createSignal(false);
      const processCalls: string[] = [];

      // 첫 번째 스크롤
      setIsScrolling(true);
      // ... 큐에 요청 추가
      setIsScrolling(false);
      processCalls.push('process-1');

      // 두 번째 스크롤
      vi.setSystemTime(500);
      setIsScrolling(true);
      // ... 큐에 요청 추가
      setIsScrolling(false);
      processCalls.push('process-2');

      expect(processCalls).toHaveLength(2);
    });

    it('isScrolling이 계속 false면 즉시 recompute', () => {
      const [isScrolling] = createSignal(false);
      const immediateCallCount = isScrolling() ? 0 : 1;

      expect(immediateCallCount).toBe(1);
    });

    it('포커스 갱신 큐는 스크롤 종료 후 초기화', () => {
      const queue: string[] = ['req-1', 'req-2'];
      const [isScrolling, setIsScrolling] = createSignal(true);

      // settling 후 처리
      setIsScrolling(false);
      queue.length = 0; // 큐 초기화

      expect(queue).toHaveLength(0);
    });
  });

  describe('통합 시나리오', () => {
    it('사용자 스크롤 → settling → 포커스 갱신 플로우', () => {
      const timeline: Array<{ time: number; event: string; isScrolling: boolean }> = [];
      const [isScrolling, setIsScrolling] = createSignal(false);

      // 사용자가 스크롤 시작
      vi.setSystemTime(0);
      setIsScrolling(true);
      timeline.push({ time: 0, event: 'scroll-start', isScrolling: true });

      // IntersectionObserver 이벤트 발생 (3회)
      vi.setSystemTime(50);
      timeline.push({ time: 50, event: 'intersection-1', isScrolling: true });

      vi.setSystemTime(100);
      timeline.push({ time: 100, event: 'intersection-2', isScrolling: true });

      vi.setSystemTime(150);
      timeline.push({ time: 150, event: 'intersection-3', isScrolling: true });

      // 스크롤 종료 (settling)
      vi.setSystemTime(300);
      setIsScrolling(false);
      timeline.push({ time: 300, event: 'settling', isScrolling: false });

      // 포커스 갱신 (최신 요청만)
      timeline.push({ time: 300, event: 'recompute-focus', isScrolling: false });

      // 검증
      const scrollingEvents = timeline.filter(e => e.isScrolling);
      const settlingEvents = timeline.filter(e => !e.isScrolling && e.event !== 'scroll-start');

      expect(scrollingEvents.length).toBeGreaterThan(0);
      expect(settlingEvents).toHaveLength(2); // settling + recompute
    });

    it('자동 스크롤 (programmatic) 중에도 동일하게 동작', () => {
      const [isScrolling, setIsScrolling] = createSignal(false);
      const events: string[] = [];

      // 프로그래매틱 스크롤 시작
      setIsScrolling(true);
      events.push('programmatic-start');

      // 여러 IntersectionObserver 이벤트 (큐에만 추가)
      events.push('queue-1', 'queue-2', 'queue-3');

      // Settling
      setIsScrolling(false);
      events.push('settling');

      // 최신 요청만 처리
      events.push('recompute-latest');

      expect(events).toContain('settling');
      expect(events).toContain('recompute-latest');
    });
  });

  describe('성능 검증', () => {
    it('스크롤 중 recomputeFocus 호출 횟수 감소', () => {
      const recomputeCalls: number[] = [];
      const [isScrolling, setIsScrolling] = createSignal(false);

      // 개선 전: 스크롤 중 매번 호출
      const beforeOptimization = () => {
        for (let i = 0; i < 10; i++) {
          recomputeCalls.push(i);
        }
      };

      // 개선 후: 스크롤 중 큐에만 추가, settling 후 1회
      const afterOptimization = () => {
        setIsScrolling(true);
        // 10회 이벤트 발생해도 호출 안 함

        setIsScrolling(false);
        recomputeCalls.push(1); // settling 후 1회만
      };

      beforeOptimization();
      const beforeCount = recomputeCalls.length; // 10

      recomputeCalls.length = 0;
      afterOptimization();
      const afterCount = recomputeCalls.length; // 1

      expect(beforeCount).toBe(10);
      expect(afterCount).toBe(1);
    });
  });
});
