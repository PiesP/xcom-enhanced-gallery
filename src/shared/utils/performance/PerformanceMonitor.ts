/**
 * 성능 모니터링 유틸리티
 * 애플리케이션 성능 지표 수집 및 분석
 * Phase 8: 통합 회귀 + 성능 가드용 확장
 */

// 타입 확장
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface ResourceEntry extends PerformanceEntry {
  transferSize: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

export interface PerformanceMetrics {
  // 로딩 성능
  domContentLoaded: number;
  fullyLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;

  // 상호작용 성능
  firstInputDelay: number;
  cumulativeLayoutShift: number;

  // 메모리 사용량
  usedJSHeapSize: number;
  totalJSHeapSize: number;

  // 네트워크
  networkRequests: number;
  totalRequestSize: number;

  // 갤러리 특화 메트릭
  imageLoadTime: number;
  thumbnailLoadTime: number;
  filterPerformance: number;
  scrollPerformance: number;

  // Phase 8: 갤러리 특화 성능 지표
  galleryRenderTime: number;
  virtualScrollPerformance: number;
  memoryUsage: number;
  domNodeCount: number;
  activeVideoCount: number;
  scrollResponseTime: number;
}

export interface PerformanceThresholds {
  domContentLoaded: number;
  fullyLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  imageLoadTime: number;
}

/**
 * 성능 모니터 클래스
 */
export class PerformanceMonitor {
  private readonly metrics: Partial<PerformanceMetrics> = {};
  private readonly observers: PerformanceObserver[] = [];
  private readonly thresholds: PerformanceThresholds;
  private startTime: number = 0;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      domContentLoaded: 1500,
      fullyLoaded: 3000,
      firstContentfulPaint: 1000,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      memoryUsage: 50 * 1024 * 1024, // 50MB
      imageLoadTime: 2000,
      ...thresholds,
    };

    this.initialize();
  }

  /**
   * 모니터링 초기화
   */
  private initialize(): void {
    this.startTime = performance.now();
    this.setupPerformanceObservers();
    this.measureNavigationTiming();
    this.measureMemoryUsage();
  }

  /**
   * Performance Observer 설정
   */
  private setupPerformanceObservers(): void {
    // Core Web Vitals 관찰
    if ('PerformanceObserver' in window) {
      this.observeWebVitals();
      this.observeResourceTiming();
    }
  }

  /**
   * Core Web Vitals 관찰
   */
  private observeWebVitals(): void {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      });
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch {
      // 지원하지 않는 브라우저
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch {
      // 지원하지 않는 브라우저
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          this.metrics.firstInputDelay = fidEntry.processingStart - entry.startTime;
        }
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch {
      // 지원하지 않는 브라우저
    }

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver(list => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach(entry => {
        const layoutEntry = entry as LayoutShiftEntry;
        if (!layoutEntry.hadRecentInput) {
          clsValue += layoutEntry.value;
        }
      });
      this.metrics.cumulativeLayoutShift = clsValue;
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch {
      // 지원하지 않는 브라우저
    }
  }

  /**
   * 리소스 타이밍 관찰
   */
  private observeResourceTiming(): void {
    const resourceObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      let requestCount = 0;
      let totalSize = 0;

      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          requestCount++;
          const resourceEntry = entry as ResourceEntry;
          totalSize += resourceEntry.transferSize || 0;
        }
      });

      this.metrics.networkRequests = (this.metrics.networkRequests || 0) + requestCount;
      this.metrics.totalRequestSize = (this.metrics.totalRequestSize || 0) + totalSize;
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch {
      // 지원하지 않는 브라우저
    }
  }

  /**
   * 네비게이션 타이밍 측정
   */
  private measureNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const loadStart = navigation.loadEventStart || navigation.fetchStart;
        const domStart = navigation.domContentLoadedEventStart || navigation.fetchStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - domStart;
        this.metrics.fullyLoaded = navigation.loadEventEnd - loadStart;
      }
    }
  }

  /**
   * 메모리 사용량 측정
   */
  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as { memory: MemoryInfo }).memory;
      this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
      this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
    }
  }

  /**
   * 이미지 로딩 성능 측정
   */
  measureImageLoadTime(imageUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const img = new Image();

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        this.metrics.imageLoadTime = loadTime;
        resolve(loadTime);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };

      img.src = imageUrl;
    });
  }

  /**
   * 썸네일 로딩 성능 측정
   */
  measureThumbnailLoadTime(urls: string[]): Promise<number> {
    const startTime = performance.now();
    const promises = urls.map(url => this.measureImageLoadTime(url).catch(() => 0));

    return Promise.all(promises).then(() => {
      const totalTime = performance.now() - startTime;
      this.metrics.thumbnailLoadTime = totalTime;
      return totalTime;
    });
  }

  /**
   * 필터 성능 측정
   */
  measureFilterPerformance<T>(filterFn: () => T): T {
    const startTime = performance.now();
    const result = filterFn();
    const endTime = performance.now();

    this.metrics.filterPerformance = endTime - startTime;
    return result;
  }

  /**
   * 스크롤 성능 측정
   */
  measureScrollPerformance(): void {
    // SR 리팩토링 플래그 활성 시 ScrollCoordinator 기반으로 전환
    try {
      const { FEATURE_SCROLL_REFACTORED } = require('@/constants');
      if (FEATURE_SCROLL_REFACTORED) {
        const { getScrollCoordinator } = require('@shared/scroll');
        const coord = getScrollCoordinator();
        coord.attach();
        let lastY = coord.position.value.y;
        let lastTime = performance.now();
        let samples = 0;
        let accum = 0;
        const unsubscribe = coord.subscribe(snap => {
          const now = performance.now();
          const dy = Math.abs(snap.y - lastY);
          if (dy > 0) {
            accum += now - lastTime; // 프레임 간격 누적
            samples++;
            lastY = snap.y;
            lastTime = now;
          }
        });
        setTimeout(() => {
          unsubscribe();
          if (samples > 0) {
            this.metrics.scrollPerformance = accum / samples;
          }
        }, 10000);
        return;
      }
    } catch {
      // require 실패 시 레거시 경로 진행
    }
    let lastScrollTime = 0;
    let frameCount = 0;
    let totalTime = 0;

    const measureFrame = () => {
      const currentTime = performance.now();
      if (lastScrollTime > 0) {
        totalTime += currentTime - lastScrollTime;
        frameCount++;
      }
      lastScrollTime = currentTime;
    };

    const scrollHandler = () => {
      requestAnimationFrame(measureFrame);
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });

    // 10초 후 측정 중단
    setTimeout(() => {
      window.removeEventListener('scroll', scrollHandler);
      if (frameCount > 0) {
        this.metrics.scrollPerformance = totalTime / frameCount;
      }
    }, 10000);
  }

  /**
   * 현재 메트릭 반환
   */
  getMetrics(): Readonly<Partial<PerformanceMetrics>> {
    return { ...this.metrics };
  }

  /**
   * 성능 점수 계산
   */
  calculatePerformanceScore(): number {
    let score = 100;
    const metrics = this.metrics;

    // 각 메트릭에 대한 점수 감점
    if (
      metrics.firstContentfulPaint &&
      metrics.firstContentfulPaint > this.thresholds.firstContentfulPaint
    ) {
      score -= 10;
    }

    if (
      metrics.largestContentfulPaint &&
      metrics.largestContentfulPaint > this.thresholds.largestContentfulPaint
    ) {
      score -= 15;
    }

    if (metrics.firstInputDelay && metrics.firstInputDelay > this.thresholds.firstInputDelay) {
      score -= 10;
    }

    if (
      metrics.cumulativeLayoutShift &&
      metrics.cumulativeLayoutShift > this.thresholds.cumulativeLayoutShift
    ) {
      score -= 15;
    }

    if (metrics.domContentLoaded && metrics.domContentLoaded > this.thresholds.domContentLoaded) {
      score -= 10;
    }

    if (metrics.usedJSHeapSize && metrics.usedJSHeapSize > this.thresholds.memoryUsage) {
      score -= 10;
    }

    if (metrics.imageLoadTime && metrics.imageLoadTime > this.thresholds.imageLoadTime) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * 성능 보고서 생성
   */
  generateReport(): {
    score: number;
    metrics: Partial<PerformanceMetrics>;
    warnings: string[];
    recommendations: string[];
  } {
    const score = this.calculatePerformanceScore();
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 경고 및 권장사항 생성
    if (
      this.metrics.firstContentfulPaint &&
      this.metrics.firstContentfulPaint > this.thresholds.firstContentfulPaint
    ) {
      warnings.push('First Contentful Paint is slow');
      recommendations.push('Optimize critical rendering path');
    }

    if (
      this.metrics.largestContentfulPaint &&
      this.metrics.largestContentfulPaint > this.thresholds.largestContentfulPaint
    ) {
      warnings.push('Largest Contentful Paint is slow');
      recommendations.push('Optimize large images and resources');
    }

    if (this.metrics.usedJSHeapSize && this.metrics.usedJSHeapSize > this.thresholds.memoryUsage) {
      warnings.push('High memory usage detected');
      recommendations.push('Check for memory leaks and optimize data structures');
    }

    return {
      score,
      metrics: this.metrics,
      warnings,
      recommendations,
    };
  }

  /**
   * 모니터링 중단
   */
  dispose(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.length = 0;
  }

  /**
   * 메모리 정리 (dispose의 별칭)
   */
  cleanup(): void {
    this.dispose();
  }
}

/**
 * 글로벌 성능 모니터
 */
let globalPerformanceMonitor: PerformanceMonitor | null = null;

/**
 * 글로벌 성능 모니터 초기화
 */
export function initializePerformanceMonitor(
  thresholds?: Partial<PerformanceThresholds>
): PerformanceMonitor {
  if (globalPerformanceMonitor) {
    globalPerformanceMonitor.dispose();
  }

  globalPerformanceMonitor = new PerformanceMonitor(thresholds);
  return globalPerformanceMonitor;
}

/**
 * 글로벌 성능 모니터 반환
 */
export function getPerformanceMonitor(): PerformanceMonitor | null {
  return globalPerformanceMonitor;
}

/**
 * 성능 모니터링 정리
 */
export function cleanupPerformanceMonitor(): void {
  if (globalPerformanceMonitor) {
    globalPerformanceMonitor.dispose();
    globalPerformanceMonitor = null;
  }
}
