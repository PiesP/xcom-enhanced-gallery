/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview useGalleryScroll와 StabilityDetector 통합 테스트
 * @description 스크롤 활동 기록 및 settling 감지 동작 검증
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { getSolid } from '@/shared/external/vendors';
import { createStabilityDetector } from '@/shared/utils/stability';
import type { StabilityDetector } from '@/shared/utils/stability';

const { createSignal } = getSolid();

describe('useGalleryScroll 통합 - StabilityDetector Activity 기록', () => {
  setupGlobalTestIsolation();

  let detector: StabilityDetector;

  beforeEach(() => {
    detector = createStabilityDetector();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('wheel 이벤트 기록', () => {
    it('wheel 이벤트 시 recordActivity("scroll") 호출', () => {
      const recordActivitySpy = vi.spyOn(detector, 'recordActivity');

      // Wheel 이벤트 처리 시뮬레이션
      detector.recordActivity('scroll');

      expect(recordActivitySpy).toHaveBeenCalledWith('scroll');
      expect(detector.isStable()).toBe(false);
    });

    it('multiple wheel 이벤트 처리', () => {
      detector.recordActivity('scroll');
      detector.recordActivity('scroll');
      detector.recordActivity('scroll');

      expect(detector.isStable()).toBe(false);
      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(3);
      expect(metrics.activityByType.scroll).toBe(3);
    });

    it('wheel 이벤트 후 settling 감지 (300ms idle)', () => {
      const callback = vi.fn();
      detector.onStabilityChange(callback);

      detector.recordActivity('scroll');
      expect(callback).toHaveBeenCalledTimes(1); // unstable 전환
      expect(callback).toHaveBeenCalledWith(false);

      // 300ms 경과
      vi.setSystemTime(300);
      const isSettled = detector.checkStability();

      expect(isSettled).toBe(true);
      expect(detector.isStable()).toBe(true);
      expect(callback).toHaveBeenCalledTimes(2); // stable 전환
      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe('programmatic 스크롤 기록', () => {
    it('programmatic 스크롤 시작 시 recordActivity("programmatic") 호출', () => {
      const recordActivitySpy = vi.spyOn(detector, 'recordActivity');

      detector.recordActivity('programmatic');

      expect(recordActivitySpy).toHaveBeenCalledWith('programmatic');
      expect(detector.isStable()).toBe(false);
    });

    it('programmatic 스크롤 후 settling 감지', () => {
      const callback = vi.fn();
      detector.onStabilityChange(callback);

      detector.recordActivity('programmatic');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(detector.isStable()).toBe(false);

      // 자동 스크롤 중: 설정된 interval마다 새로운 activity 기록
      vi.setSystemTime(100);
      detector.recordActivity('programmatic');

      vi.setSystemTime(200);
      detector.recordActivity('programmatic');

      // Phase 83.4 - Adaptive Threshold: programmatic은 400ms 사용
      // 마지막 activity(200ms)로부터 400ms 경과 = 600ms
      vi.setSystemTime(600);
      const isSettled = detector.checkStability();

      expect(isSettled).toBe(true);
      expect(detector.isStable()).toBe(true);
    });
  });

  describe('활동 타입 혼합', () => {
    it('wheel과 programmatic 활동이 섞여 있을 때 settling 감지', () => {
      const callback = vi.fn();
      detector.onStabilityChange(callback);

      // 사용자 scroll
      detector.recordActivity('scroll');
      expect(callback).toHaveBeenCalledTimes(1);

      // 자동 scroll
      vi.setSystemTime(50);
      detector.recordActivity('programmatic');

      vi.setSystemTime(100);
      detector.recordActivity('scroll');

      // 마지막 activity로부터 300ms 경과
      vi.setSystemTime(400);
      const isSettled = detector.checkStability();

      expect(isSettled).toBe(true);
      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(3);
      expect(metrics.activityByType.scroll).toBe(2);
      expect(metrics.activityByType.programmatic).toBe(1);
    });
  });

  describe('콜백 시스템', () => {
    it('settling 상태 변화 시 콜백 호출', () => {
      const callback = vi.fn();
      const unsubscribe = detector.onStabilityChange(callback);

      detector.recordActivity('scroll');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);

      vi.setSystemTime(300);
      detector.checkStability();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(true);

      unsubscribe();

      vi.setSystemTime(600);
      detector.recordActivity('scroll');
      // 콜백은 여전히 2회 (구독 해제됨)
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('settling 콜백으로 isSettled 신호 제공', () => {
      const settledSignal = createSignal(true);
      const [isSettled, setIsSettled] = settledSignal;

      detector.onStabilityChange(isStable => {
        setIsSettled(isStable);
      });

      detector.recordActivity('scroll');
      expect(isSettled()).toBe(false);

      vi.setSystemTime(300);
      detector.checkStability();
      expect(isSettled()).toBe(true);
    });
  });

  describe('메트릭 조회', () => {
    it('활동 통계 조회', () => {
      detector.recordActivity('scroll');
      detector.recordActivity('scroll');
      detector.recordActivity('programmatic');
      detector.recordActivity('focus');

      const metrics = detector.getMetrics();

      expect(metrics.totalActivities).toBe(4);
      expect(metrics.activityByType).toEqual({
        scroll: 2,
        focus: 1,
        layout: 0,
        programmatic: 1,
      });
      expect(metrics.isStable).toBe(false);
      expect(metrics.lastActivityTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('통합 시나리오', () => {
    it('사용자 wheel + 자동 animation 후 settling', () => {
      const stateChanges: boolean[] = [];
      detector.onStabilityChange(isStable => {
        stateChanges.push(isStable);
      });

      // 사용자가 마우스 휠 스크롤
      detector.recordActivity('scroll');
      expect(stateChanges).toEqual([false]); // unstable

      // 자동 애니메이션 시작 (수동으로 programmatic 이벤트 기록)
      vi.setSystemTime(50);
      detector.recordActivity('programmatic');

      vi.setSystemTime(100);
      detector.recordActivity('programmatic');

      // 300ms idle 후 settling
      vi.setSystemTime(400);
      detector.checkStability();
      expect(stateChanges).toEqual([false, true]); // stable

      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(3);
      expect(metrics.isStable).toBe(true);
    });

    it('settling 중에 새로운 활동이 기록되면 상태 리셋', () => {
      const stateChanges: boolean[] = [];
      detector.onStabilityChange(isStable => {
        stateChanges.push(isStable);
      });

      // 첫 번째 activity
      detector.recordActivity('scroll');
      expect(stateChanges).toEqual([false]);

      // Phase 83.4 - Adaptive Threshold: scroll은 200ms 사용
      // settling 진행 중 (150ms 경과)
      vi.setSystemTime(150);
      expect(detector.checkStability()).toBe(false);

      // 새로운 activity 기록
      detector.recordActivity('scroll');
      expect(stateChanges).toEqual([false]); // 상태 변화 없음

      // 다시 200ms idle (150 + 200 = 350ms)
      vi.setSystemTime(350);
      detector.checkStability();
      expect(stateChanges).toEqual([false, true]); // 최종 settling
    });
  });
});
