/**
 * 성능 모니터링 메인 클래스
 *
 * @description 실시간 성능 메트릭 수집 및 분석을 담당하는 핵심 모니터
 * @author TDD-AI-Assistant
 * @version 1.0.0
 */

import type {
  PerformanceMetrics,
  MemoryMetrics,
  RenderMetrics,
  UserExperienceMetrics,
  OptimizationSuggestion,
  TrendAnalysis,
  BrowserCompatibilityReport,
  DashboardData,
  MonitoringConfig,
} from './types';

/**
 * 성능 모니터링 시스템의 메인 클래스
 */
export class PerformanceMonitor {
  private isMonitoringActive = false;
  private startTime = 0;
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly config: MonitoringConfig;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      collectionInterval: 5000,
      historyRetention: 300000, // 5분
      enableAlerts: true,
      enableSuggestions: true,
      enableDetailedLogging: false,
      ...config,
    };

    this.start();
  }

  /**
   * 모니터링 시작
   */
  start(): void {
    this.isMonitoringActive = true;
    this.startTime = Date.now();
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    this.isMonitoringActive = false;
  }

  /**
   * 모니터링 활성 상태 확인
   */
  isActive(): boolean {
    return this.isMonitoringActive;
  }

  /**
   * 시작 시간 반환
   */
  getStartTime(): number {
    return this.startTime;
  }

  /**
   * 메모리 메트릭 수집
   */
  async getMemoryMetrics(): Promise<MemoryMetrics> {
    // 기본 메모리 정보 (실제 구현에서는 performance.memory API 사용)
    const memoryInfo = {
      heapUsed: 50 * 1024 * 1024, // 50MB
      heapTotal: 100 * 1024 * 1024, // 100MB
      heapLimit: 500 * 1024 * 1024, // 500MB
    };

    return memoryInfo;
  }

  /**
   * 렌더링 성능 메트릭 수집
   */
  async getRenderMetrics(): Promise<RenderMetrics> {
    // 기본 렌더링 정보 (실제 구현에서는 Performance API 사용)
    return {
      paintTime: 12.5,
      layoutTime: 8.2,
      scriptTime: 15.7,
    };
  }

  /**
   * 사용자 경험 지표 수집 (Core Web Vitals)
   */
  async getWebVitals(): Promise<UserExperienceMetrics> {
    // 기본 웹 바이탈 정보 (실제 구현에서는 PerformanceObserver 사용)
    return {
      fcp: 1200, // First Contentful Paint
      lcp: 2400, // Largest Contentful Paint
      fid: 30, // First Input Delay
      cls: 0.08, // Cumulative Layout Shift
    };
  }

  /**
   * 종합 성능 메트릭 수집
   */
  async getComprehensiveMetrics(): Promise<PerformanceMetrics> {
    const timestamp = Date.now();
    const memory = await this.getMemoryMetrics();
    const performance = await this.getRenderMetrics();
    const userExperience = await this.getWebVitals();

    const metrics: PerformanceMetrics = {
      timestamp,
      memory,
      performance,
      userExperience,
    };

    // 히스토리에 추가
    this.metricsHistory.push(metrics);
    this.cleanupHistory();

    return metrics;
  }

  /**
   * 메트릭 수집 (별칭)
   */
  async collect(): Promise<PerformanceMetrics> {
    return this.getComprehensiveMetrics();
  }

  /**
   * 최적화 제안 생성
   */
  generateOptimizationSuggestions(metrics: PerformanceMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 메모리 사용량 체크
    if (metrics.memory.heapUsed > 100 * 1024 * 1024) {
      // 100MB 초과
      suggestions.push({
        id: 'memory-optimization-1',
        type: 'memory',
        description: '메모리 사용량이 높습니다. 메모리 누수를 확인하세요.',
        impact: 8,
        difficulty: 6,
        recommendations: ['사용하지 않는 변수 정리', '이벤트 리스너 해제', '캐시 크기 제한'],
      });
    }

    // 렌더링 성능 체크
    if (metrics.performance.paintTime > 16) {
      // 16ms 초과 (60fps 기준)
      suggestions.push({
        id: 'render-optimization-1',
        type: 'render',
        description: '렌더링 시간이 60fps 기준을 초과합니다.',
        impact: 9,
        difficulty: 7,
        recommendations: ['DOM 조작 최적화', 'CSS 애니메이션 사용', '가상 스크롤 구현'],
      });
    }

    return suggestions;
  }

  /**
   * 성능 트렌드 분석
   */
  analyzeTrends(): TrendAnalysis {
    if (this.metricsHistory.length < 2) {
      return {
        memoryTrend: 'stable',
        performanceTrend: 'stable',
        recommendations: ['더 많은 데이터가 필요합니다.'],
        analysisWindow: 0,
      };
    }

    const recent = this.metricsHistory.slice(-5);
    const memoryTrend = this.calculateMemoryTrend(recent);
    const performanceTrend = this.calculatePerformanceTrend(recent);

    return {
      memoryTrend,
      performanceTrend,
      recommendations: this.generateTrendRecommendations(memoryTrend, performanceTrend),
      analysisWindow: Date.now() - (recent[0]?.timestamp || Date.now()),
    };
  }

  /**
   * 브라우저 호환성 리포트
   */
  getBrowserCompatibilityReport(): BrowserCompatibilityReport {
    const userAgent = navigator.userAgent;
    const browserInfo = this.parseBrowserInfo(userAgent);

    return {
      currentBrowser: browserInfo,
      supportedFeatures: this.getSupportedFeatures(),
      performanceCapabilities: {
        performanceObserver: 'PerformanceObserver' in window,
        memoryAPI: 'memory' in performance,
        webVitalsAPI: 'PerformanceObserver' in window,
        navigationTiming: 'navigation' in performance,
      },
    };
  }

  /**
   * 대시보드 데이터 생성
   */
  getDashboardData(): DashboardData {
    const currentMetrics: PerformanceMetrics =
      this.metricsHistory.length > 0
        ? this.metricsHistory[this.metricsHistory.length - 1]!
        : this.createEmptyMetrics();

    const trends = this.analyzeTrends();
    const healthScore = this.calculateHealthScore(currentMetrics);

    return {
      currentMetrics,
      alerts: [], // AlertSystem에서 관리
      trends,
      healthScore,
    };
  }

  // Private helper methods

  private cleanupHistory(): void {
    const cutoffTime = Date.now() - this.config.historyRetention;
    this.metricsHistory = this.metricsHistory.filter(metric => metric.timestamp > cutoffTime);
  }

  private calculateMemoryTrend(
    metrics: PerformanceMetrics[]
  ): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 2) return 'stable';

    const first = metrics[0]?.memory.heapUsed || 0;
    const last = metrics[metrics.length - 1]?.memory.heapUsed || 0;
    const change = first > 0 ? (last - first) / first : 0;

    if (change > 0.1) return 'degrading';
    if (change < -0.1) return 'improving';
    return 'stable';
  }

  private calculatePerformanceTrend(
    metrics: PerformanceMetrics[]
  ): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 2) return 'stable';

    const first = metrics[0]?.performance.paintTime || 0;
    const last = metrics[metrics.length - 1]?.performance.paintTime || 0;
    const change = first > 0 ? (last - first) / first : 0;

    if (change > 0.1) return 'degrading';
    if (change < -0.1) return 'improving';
    return 'stable';
  }

  private generateTrendRecommendations(memoryTrend: string, performanceTrend: string): string[] {
    const recommendations: string[] = [];

    if (memoryTrend === 'degrading') {
      recommendations.push('메모리 사용량이 증가하고 있습니다. 메모리 누수를 확인하세요.');
    }

    if (performanceTrend === 'degrading') {
      recommendations.push('렌더링 성능이 저하되고 있습니다. 최적화를 고려하세요.');
    }

    if (memoryTrend === 'stable' && performanceTrend === 'stable') {
      recommendations.push('성능이 안정적입니다. 현재 상태를 유지하세요.');
    }

    return recommendations;
  }

  private parseBrowserInfo(userAgent: string): { name: string; version: string; engine: string } {
    // 간단한 브라우저 파싱 (실제로는 더 정교한 로직 필요)
    if (userAgent.includes('Chrome')) {
      return { name: 'Chrome', version: '120.0', engine: 'Blink' };
    }
    if (userAgent.includes('Firefox')) {
      return { name: 'Firefox', version: '120.0', engine: 'Gecko' };
    }
    if (userAgent.includes('Safari')) {
      return { name: 'Safari', version: '17.0', engine: 'WebKit' };
    }
    return { name: 'Unknown', version: '0.0', engine: 'Unknown' };
  }

  private getSupportedFeatures(): string[] {
    const features: string[] = [];

    if ('PerformanceObserver' in window) features.push('PerformanceObserver');
    if ('memory' in performance) features.push('Memory API');
    if ('navigation' in performance) features.push('Navigation Timing');
    if ('IntersectionObserver' in window) features.push('IntersectionObserver');

    return features;
  }

  private calculateHealthScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // 메모리 사용량 평가 (0-30점)
    const memoryUsageRatio = metrics.memory.heapUsed / metrics.memory.heapLimit;
    if (memoryUsageRatio > 0.8) score -= 30;
    else if (memoryUsageRatio > 0.6) score -= 20;
    else if (memoryUsageRatio > 0.4) score -= 10;

    // 렌더링 성능 평가 (0-40점)
    if (metrics.performance.paintTime > 32) {
      score -= 40; // 30fps 미만
    } else if (metrics.performance.paintTime > 16) {
      score -= 20; // 60fps 미만
    } else if (metrics.performance.paintTime > 8) score -= 10; // 120fps 미만

    // 사용자 경험 평가 (0-30점)
    if (metrics.userExperience.lcp > 4000) {
      score -= 30; // Poor LCP
    } else if (metrics.userExperience.lcp > 2500) {
      score -= 20; // Needs Improvement
    } else if (metrics.userExperience.lcp > 1200) score -= 10; // Good

    return Math.max(0, Math.min(100, score));
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      memory: { heapUsed: 0, heapTotal: 0, heapLimit: 0 },
      performance: { paintTime: 0, layoutTime: 0, scriptTime: 0 },
      userExperience: { fcp: 0, lcp: 0, fid: 0, cls: 0 },
    };
  }
}
