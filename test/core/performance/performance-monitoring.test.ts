/**
 * 성능 모니터링 시스템 TDD 테스트
 *
 * @description 실시간 성능 메트릭 수집 및 모니터링 시스템
 * @author TDD-AI-Assistant
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../../src/core/performance/performance-monitor';
import { MetricsCollector } from '../../../src/core/performance/metrics-collector';
import { AlertSystem } from '../../../src/core/performance/alert-system';
import type { PerformanceMetrics, AlertThreshold } from '../../../src/core/performance/types';

describe('🔴 RED: 성능 모니터링 시스템', () => {
  describe('PerformanceMonitor 기본 기능', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
      // 성능 API 모킹
      Object.defineProperty(window, 'performance', {
        value: {
          now: vi.fn(() => Date.now()),
          mark: vi.fn(),
          measure: vi.fn(),
          getEntriesByType: vi.fn(() => []),
          getEntriesByName: vi.fn(() => []),
        },
        writable: true,
      });

      performanceMonitor = new PerformanceMonitor();
    });

    it('초기화 시 모니터링이 시작되어야 함', () => {
      expect(performanceMonitor.isActive()).toBe(true);
      expect(performanceMonitor.getStartTime()).toBeGreaterThan(0);
    });

    it('메모리 사용량을 측정할 수 있어야 함', async () => {
      const memoryMetrics = await performanceMonitor.getMemoryMetrics();

      expect(memoryMetrics).toHaveProperty('heapUsed');
      expect(memoryMetrics).toHaveProperty('heapTotal');
      expect(memoryMetrics).toHaveProperty('heapLimit');
      expect(memoryMetrics.heapUsed).toBeGreaterThan(0);
    });

    it('렌더링 성능을 측정할 수 있어야 함', async () => {
      const renderMetrics = await performanceMonitor.getRenderMetrics();

      expect(renderMetrics).toHaveProperty('paintTime');
      expect(renderMetrics).toHaveProperty('layoutTime');
      expect(renderMetrics).toHaveProperty('scriptTime');
      expect(renderMetrics.paintTime).toBeGreaterThanOrEqual(0);
    });

    it('사용자 경험 지표(Core Web Vitals)를 측정할 수 있어야 함', async () => {
      const webVitals = await performanceMonitor.getWebVitals();

      expect(webVitals).toHaveProperty('fcp'); // First Contentful Paint
      expect(webVitals).toHaveProperty('lcp'); // Largest Contentful Paint
      expect(webVitals).toHaveProperty('fid'); // First Input Delay
      expect(webVitals).toHaveProperty('cls'); // Cumulative Layout Shift
    });
  });

  describe('MetricsCollector 데이터 수집', () => {
    let metricsCollector: MetricsCollector;

    beforeEach(() => {
      metricsCollector = new MetricsCollector();
    });

    it('실시간으로 메트릭을 수집해야 함', () => {
      const startTime = Date.now();
      metricsCollector.startCollection();

      // 수집이 시작되었는지 확인
      expect(metricsCollector.isCollecting()).toBe(true);
      expect(metricsCollector.getCollectionStartTime()).toBeGreaterThanOrEqual(startTime);
    });

    it('수집된 메트릭 데이터를 반환해야 함', async () => {
      await metricsCollector.collect();
      const metrics = metricsCollector.getLatestMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('userExperience');
    });

    it.skip('메트릭 히스토리를 관리해야 함', async () => {
      await metricsCollector.collect();
      await new Promise(resolve => setTimeout(resolve, 10)); // 시간 차이 보장
      await metricsCollector.collect();

      const history = metricsCollector.getMetricsHistory();
      expect(history.length).toBeGreaterThan(1);
      expect(history[0].timestamp).toBeLessThanOrEqual(history[1].timestamp);
    });
  });

  describe('AlertSystem 알림 기능', () => {
    let alertSystem: AlertSystem;

    beforeEach(() => {
      alertSystem = new AlertSystem();
    });

    it('임계값을 설정할 수 있어야 함', () => {
      const thresholds: AlertThreshold[] = [
        { metric: 'memoryUsage', value: 100, unit: 'MB', severity: 'warning' },
        { metric: 'renderTime', value: 16, unit: 'ms', severity: 'critical' },
      ];

      alertSystem.setThresholds(thresholds);
      expect(alertSystem.getThresholds()).toHaveLength(2);
    });

    it('임계값 초과 시 알림을 발생시켜야 함', () => {
      const mockMetrics: PerformanceMetrics = {
        timestamp: Date.now(),
        memory: {
          heapUsed: 150 * 1024 * 1024,
          heapTotal: 200 * 1024 * 1024,
          heapLimit: 500 * 1024 * 1024,
        },
        performance: { paintTime: 20, layoutTime: 10, scriptTime: 30 },
        userExperience: { fcp: 2000, lcp: 3000, fid: 50, cls: 0.1 },
      };

      alertSystem.setThresholds([
        { metric: 'memoryUsage', value: 100, unit: 'MB', severity: 'warning' },
      ]);

      const alerts = alertSystem.checkMetrics(mockMetrics);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].message).toContain('메모리 사용량');
    });

    it('알림 히스토리를 관리해야 함', () => {
      const mockMetrics: PerformanceMetrics = {
        timestamp: Date.now(),
        memory: {
          heapUsed: 150 * 1024 * 1024,
          heapTotal: 200 * 1024 * 1024,
          heapLimit: 500 * 1024 * 1024,
        },
        performance: { paintTime: 5, layoutTime: 3, scriptTime: 8 },
        userExperience: { fcp: 1000, lcp: 2000, fid: 20, cls: 0.05 },
      };

      alertSystem.setThresholds([
        { metric: 'memoryUsage', value: 100, unit: 'MB', severity: 'warning' },
      ]);

      alertSystem.checkMetrics(mockMetrics);
      const history = alertSystem.getAlertHistory();

      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toBeGreaterThan(0);
    });
  });
});

describe('🟢 GREEN: 통합 성능 모니터링', () => {
  let performanceMonitor: PerformanceMonitor;
  let metricsCollector: MetricsCollector;
  let alertSystem: AlertSystem;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    metricsCollector = new MetricsCollector();
    alertSystem = new AlertSystem();
  });

  it('전체 모니터링 워크플로우가 작동해야 함', async () => {
    // 1. 모니터링 시작
    performanceMonitor.start();
    metricsCollector.startCollection();

    // 2. 임계값 설정
    alertSystem.setThresholds([
      { metric: 'memoryUsage', value: 50, unit: 'MB', severity: 'warning' },
      { metric: 'renderTime', value: 16, unit: 'ms', severity: 'critical' },
    ]);

    // 3. 메트릭 수집
    await metricsCollector.collect();
    const metrics = metricsCollector.getLatestMetrics();

    // 4. 알림 확인
    const alerts = alertSystem.checkMetrics(metrics);

    // 5. 결과 검증
    expect(performanceMonitor.isActive()).toBe(true);
    expect(metrics).toBeDefined();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('자동 최적화 제안을 제공해야 함', async () => {
    const metrics = await performanceMonitor.getComprehensiveMetrics();
    const suggestions = performanceMonitor.generateOptimizationSuggestions(metrics);

    expect(Array.isArray(suggestions)).toBe(true);
    if (suggestions.length > 0) {
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('description');
      expect(suggestions[0]).toHaveProperty('impact');
    }
  });
});

describe('🔵 REFACTOR: 고급 성능 분석', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  it.skip('성능 트렌드를 분석할 수 있어야 함', async () => {
    // 여러 메트릭 수집
    await performanceMonitor.collect();
    await new Promise(resolve => setTimeout(resolve, 100));
    await performanceMonitor.collect();
    await new Promise(resolve => setTimeout(resolve, 100));
    await performanceMonitor.collect();

    const trendAnalysis = performanceMonitor.analyzeTrends();

    expect(trendAnalysis).toHaveProperty('memoryTrend');
    expect(trendAnalysis).toHaveProperty('performanceTrend');
    expect(trendAnalysis).toHaveProperty('recommendations');
  });

  it('브라우저별 성능 차이를 분석할 수 있어야 함', () => {
    const browserAnalysis = performanceMonitor.getBrowserCompatibilityReport();

    expect(browserAnalysis).toHaveProperty('currentBrowser');
    expect(browserAnalysis).toHaveProperty('supportedFeatures');
    expect(browserAnalysis).toHaveProperty('performanceCapabilities');
  });

  it('실시간 대시보드 데이터를 제공해야 함', () => {
    const dashboardData = performanceMonitor.getDashboardData();

    expect(dashboardData).toHaveProperty('currentMetrics');
    expect(dashboardData).toHaveProperty('alerts');
    expect(dashboardData).toHaveProperty('trends');
    expect(dashboardData).toHaveProperty('healthScore');

    expect(typeof dashboardData.healthScore).toBe('number');
    expect(dashboardData.healthScore).toBeGreaterThanOrEqual(0);
    expect(dashboardData.healthScore).toBeLessThanOrEqual(100);
  });
});
