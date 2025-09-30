/**
 * @fileoverview [UX-001][Phase A][RED] 툴바 아이콘 즉시 렌더링 테스트
 *
 * 목표: preloadCommonIcons() await 후 갤러리 첫 기동 시
 *       툴바 아이콘이 placeholder 없이 즉시 표시되어야 함
 *
 * RED 조건:
 * - 현재 main.ts에서 preloadCommonIcons()를 호출하지 않음
 * - LazyIcon은 첫 렌더 시 getLoadedIconSync()가 null 반환 → placeholder 표시
 *
 * GREEN 조건:
 * - main.ts의 initializeInfrastructure()에서 await preloadCommonIcons() 추가
 * - 갤러리 렌더링 전에 CORE 아이콘이 _globalLoaded에 캐시됨
 * - 첫 렌더 시 LazyIcon이 동기적으로 아이콘 컴포넌트를 반환받아 즉시 표시
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getIconRegistry,
  resetIconRegistry,
  preloadCommonIcons,
  CORE_ICONS,
} from '@shared/services/iconRegistry';

describe('[UX-001][Phase A] 툴바 아이콘 즉시 렌더링', () => {
  beforeEach(() => {
    resetIconRegistry();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RED: 현재 동작 검증', () => {
    it('preloadCommonIcons 호출 전에는 CORE 아이콘이 동기 조회 불가능', () => {
      // Given: registry 초기화 직후
      const registry = getIconRegistry();

      // When: CORE 아이콘 동기 조회
      const chevronLeft = registry.getLoadedIconSync('ChevronLeft');
      const chevronRight = registry.getLoadedIconSync('ChevronRight');
      const download = registry.getLoadedIconSync('Download');

      // Then: 모두 null 반환 (아직 로드되지 않음)
      expect(chevronLeft).toBeNull();
      expect(chevronRight).toBeNull();
      expect(download).toBeNull();
    });
  });

  describe('GREEN: 목표 동작 정의', () => {
    it('preloadCommonIcons 호출 후에는 모든 CORE 아이콘이 동기 조회 가능', async () => {
      // Given: preloadCommonIcons 실행
      await preloadCommonIcons();

      // When: 모든 CORE 아이콘 동기 조회
      const registry = getIconRegistry();
      const missing = CORE_ICONS.filter(name => !registry.getLoadedIconSync(name));

      // Then: 모든 CORE 아이콘이 즉시 반환됨
      expect(missing).toEqual([]);
    });

    it('preloadCommonIcons는 50ms 이내에 완료되어야 함', async () => {
      // Given: 타이머 시작
      const startTime = globalThis.performance.now();

      // When: preloadCommonIcons 실행
      await preloadCommonIcons();

      // Then: 50ms 이내 완료
      const duration = globalThis.performance.now() - startTime;
      expect(duration).toBeLessThan(50);
    }, 100); // 테스트 타임아웃 100ms

    it('중복 호출 시 캐시된 아이콘을 재사용하여 즉시 완료', async () => {
      // Given: 첫 번째 preload 완료
      await preloadCommonIcons();

      // When: 두 번째 preload 실행 및 타이밍 측정
      const startTime = globalThis.performance.now();
      await preloadCommonIcons();
      const duration = globalThis.performance.now() - startTime;

      // Then: 캐시 덕분에 10ms 이내 완료 (비동기 로드 생략)
      expect(duration).toBeLessThan(10);
    }, 50);
  });

  describe('통합: main.ts 초기화 시나리오', () => {
    it('앱 시작 시 initializeInfrastructure에서 preload 완료 후 갤러리 렌더링', async () => {
      // Given: 앱 초기화 시퀀스 시뮬레이션
      resetIconRegistry();

      // When: initializeInfrastructure 단계 (목표 구현)
      await preloadCommonIcons(); // <-- main.ts에 추가할 코드

      // 이후 갤러리 렌더링 시작 (LazyIcon 컴포넌트 생성)
      const registry = getIconRegistry();
      const toolbarIcons = ['ChevronLeft', 'ChevronRight', 'Download', 'Settings', 'Close'];

      // Then: 모든 툴바 아이콘이 동기 조회 가능 (placeholder 불필요)
      toolbarIcons.forEach(iconName => {
        const component = registry.getLoadedIconSync(iconName);
        expect(component).not.toBeNull();
        expect(typeof component).toBe('function');
      });
    });
  });

  describe('성능: 기동 시간 영향 평가', () => {
    it('전체 앱 초기화 시간에 미치는 영향을 측정', async () => {
      // Given: 앱 초기화 시퀀스
      const metrics: Record<string, number> = {};

      // When: 각 단계별 시간 측정
      let start = globalThis.performance.now();
      resetIconRegistry();
      metrics.reset = globalThis.performance.now() - start;

      start = globalThis.performance.now();
      await preloadCommonIcons();
      metrics.preload = globalThis.performance.now() - start;

      // Then: preload가 50ms 이내 (전체 기동 시간의 합리적 비용)
      expect(metrics.preload).toBeLessThan(50);

      // 로그 출력 (디버깅용, console.log는 테스트 환경에서 허용)
      globalThis.console.log('[UX-001][Phase A] 초기화 시간 측정:', {
        reset: `${metrics.reset.toFixed(2)}ms`,
        preload: `${metrics.preload.toFixed(2)}ms`,
        total: `${(metrics.reset + metrics.preload).toFixed(2)}ms`,
      });
    }, 150);
  });

  describe('회귀 방지: 캐시 안정성', () => {
    it('preload 후 resetIconRegistry 호출 시 캐시가 초기화되어야 함', async () => {
      // Given: preload 완료
      await preloadCommonIcons();
      const registry = getIconRegistry();

      // Verify: 캐시 존재 확인
      expect(registry.getLoadedIconSync('ChevronLeft')).not.toBeNull();

      // When: registry 리셋
      resetIconRegistry();
      const freshRegistry = getIconRegistry();

      // Then: 캐시가 비워져서 null 반환
      expect(freshRegistry.getLoadedIconSync('ChevronLeft')).toBeNull();
    });
  });
});
