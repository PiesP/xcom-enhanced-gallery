/**
 * @fileoverview UIOptimizer - UI/UX 성능 최적화 관리자
 * @description 사용자 경험을 위한 성능 최적화 및 반응성 개선
 * - 지연 로딩 최적화
 * - 애니메이션 성능
 * - 메모리 사용량 최적화
 * - 반응형 최적화
 */

/**
 * 성능 메트릭 인터페이스
 */
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  interactionLatency: number;
  scrollPerformance: number;
  imageLoadTime: number;
}

/**
 * 최적화 설정 인터페이스
 */
export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableVirtualScrolling: boolean;
  enableMemoryOptimization: boolean;
  enableAnimationOptimization: boolean;
  performanceTarget: 'performance' | 'quality' | 'balanced';
}

/**
 * UI/UX 성능 최적화 관리자
 */
export class UIOptimizer {
  private config: OptimizationConfig;
  private performanceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;
  private metrics: PerformanceMetrics;
  private readonly memoryCleanupTasks: Set<() => void>;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableVirtualScrolling: false,
      enableMemoryOptimization: true,
      enableAnimationOptimization: true,
      performanceTarget: 'balanced',
      ...config,
    };

    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      interactionLatency: 0,
      scrollPerformance: 0,
      imageLoadTime: 0,
    };

    this.memoryCleanupTasks = new Set();
    this.initializePerformanceMonitoring();
  }

  /**
   * 성능 모니터링 초기화
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver(entries => {
      entries.getEntries().forEach(entry => {
        switch (entry.entryType) {
          case 'measure':
            if (entry.name.includes('render')) {
              this.metrics.renderTime = entry.duration;
            }
            break;
          case 'navigation':
            // 네비게이션 성능 추적
            break;
          default:
            break;
        }
      });
    });

    try {
      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  /**
   * 지연 로딩 최적화
   */
  enableLazyLoading(container: HTMLElement): void {
    if (!this.config.enableLazyLoading || !window.IntersectionObserver) return;

    const images = container.querySelectorAll('img[data-src], [data-lazy]');

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            this.loadLazyElement(target);
            this.intersectionObserver?.unobserve(target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    images.forEach(img => {
      this.intersectionObserver?.observe(img);
    });
  }

  /**
   * 지연 로딩 요소 로드
   */
  private loadLazyElement(element: HTMLImageElement): void {
    const startTime = performance.now();

    if (element.dataset.src) {
      element.src = element.dataset.src;
      delete element.dataset.src;
    }

    element.onload = () => {
      const loadTime = performance.now() - startTime;
      this.metrics.imageLoadTime = loadTime;
      element.classList.add('xeg-loaded');

      // 이미지 최적화 적용
      if (this.config.enableImageOptimization) {
        this.optimizeImage(element);
      }
    };

    element.onerror = () => {
      element.classList.add('xeg-error');
      console.warn('Image failed to load:', element.src);
    };
  }

  /**
   * 이미지 최적화
   */
  private optimizeImage(img: HTMLImageElement): void {
    // 레티나 디스플레이 고려
    const pixelRatio = window.devicePixelRatio || 1;
    const container = img.parentElement;

    if (container) {
      const containerWidth = container.offsetWidth;
      const optimizedWidth = Math.ceil(containerWidth * pixelRatio);

      // 이미지 크기가 컨테이너보다 훨씬 클 때만 최적화
      if (img.naturalWidth > optimizedWidth * 1.5) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    }

    // 이미지 압축 품질 조정
    if (this.config.performanceTarget === 'performance') {
      img.style.imageRendering = 'optimizeSpeed';
    } else if (this.config.performanceTarget === 'quality') {
      img.style.imageRendering = 'optimizeQuality';
    }
  }

  /**
   * 스크롤 성능 최적화
   */
  optimizeScrollPerformance(container: HTMLElement): void {
    let ticking = false;
    let lastScrollTime = 0;

    const scrollHandler = () => {
      const currentTime = performance.now();
      this.metrics.scrollPerformance = currentTime - lastScrollTime;
      lastScrollTime = currentTime;

      if (!ticking) {
        requestAnimationFrame(() => {
          // 스크롤 관련 업데이트 처리
          this.updateVisibleElements(container);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', scrollHandler, { passive: true });

    // 정리 함수 등록
    this.memoryCleanupTasks.add(() => {
      container.removeEventListener('scroll', scrollHandler);
    });
  }

  /**
   * 보이는 요소만 업데이트 (가상 스크롤링 기초)
   */
  private updateVisibleElements(container: HTMLElement): void {
    if (!this.config.enableVirtualScrolling) return;

    const rect = container.getBoundingClientRect();
    const elements = container.querySelectorAll('[data-virtual-item]');

    elements.forEach(element => {
      const elementRect = element.getBoundingClientRect();
      const isVisible = elementRect.bottom >= rect.top && elementRect.top <= rect.bottom;

      if (isVisible) {
        element.classList.add('xeg-visible');
        element.classList.remove('xeg-hidden');
      } else {
        element.classList.add('xeg-hidden');
        element.classList.remove('xeg-visible');
      }
    });
  }

  /**
   * 애니메이션 성능 최적화
   */
  optimizeAnimations(container: HTMLElement): void {
    if (!this.config.enableAnimationOptimization) return;

    // prefers-reduced-motion 고려
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      container.classList.add('xeg-reduced-motion');
      return;
    }

    // GPU 가속 활성화
    const animatedElements = container.querySelectorAll('[data-animate]');
    animatedElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.willChange = 'transform, opacity';
      htmlElement.style.transform = 'translateZ(0)'; // GPU 레이어 강제 생성
    });

    // 애니메이션 정리 함수 등록
    this.memoryCleanupTasks.add(() => {
      animatedElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.willChange = 'auto';
        htmlElement.style.transform = '';
      });
    });
  }

  /**
   * 메모리 사용량 모니터링 및 최적화
   */
  optimizeMemoryUsage(): void {
    if (!this.config.enableMemoryOptimization) return;

    // 메모리 사용량 측정 (가능한 경우)
    if ('memory' in performance) {
      const memInfo = (
        performance as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
      ).memory;
      this.metrics = {
        ...this.metrics,
        memoryUsage: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit,
      };
    }

    // 메모리 정리 실행
    this.runMemoryCleanup();

    // 주기적 메모리 정리 (5분마다)
    const cleanupInterval = setInterval(
      () => {
        this.runMemoryCleanup();
      },
      5 * 60 * 1000
    );

    this.memoryCleanupTasks.add(() => {
      clearInterval(cleanupInterval);
    });
  }

  /**
   * 메모리 정리 실행
   */
  private runMemoryCleanup(): void {
    // 미사용 이미지 정리
    const images = document.querySelectorAll('img[data-cleanup]');
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.offsetParent === null) {
        // 화면에 표시되지 않는 이미지
        imgElement.src = '';
        imgElement.removeAttribute('data-cleanup');
      }
    });

    // 미사용 이벤트 리스너 정리
    this.memoryCleanupTasks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
  }

  /**
   * 반응형 최적화
   */
  optimizeResponsiveDesign(container: HTMLElement): void {
    const updateLayout = () => {
      const width = container.offsetWidth;

      // 브레이크포인트별 최적화
      if (width < 768) {
        container.classList.add('xeg-mobile');
        container.classList.remove('xeg-tablet', 'xeg-desktop');
        this.applyMobileOptimizations(container);
      } else if (width < 1024) {
        container.classList.add('xeg-tablet');
        container.classList.remove('xeg-mobile', 'xeg-desktop');
        this.applyTabletOptimizations(container);
      } else {
        container.classList.add('xeg-desktop');
        container.classList.remove('xeg-mobile', 'xeg-tablet');
        this.applyDesktopOptimizations(container);
      }
    };

    // 초기 레이아웃 설정
    updateLayout();

    // 리사이즈 이벤트 최적화 (디바운싱)
    let resizeTimeout: number;
    const resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(updateLayout, 150);
    };

    window.addEventListener('resize', resizeHandler);

    this.memoryCleanupTasks.add(() => {
      window.removeEventListener('resize', resizeHandler);
      clearTimeout(resizeTimeout);
    });
  }

  /**
   * 모바일 최적화
   */
  private applyMobileOptimizations(container: HTMLElement): void {
    // 터치 최적화
    container.style.touchAction = 'manipulation';

    // 이미지 품질 조정 (모바일에서는 성능 우선)
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      img.style.imageRendering = 'optimizeSpeed';
    });
  }

  /**
   * 태블릿 최적화
   */
  private applyTabletOptimizations(container: HTMLElement): void {
    // 균형잡힌 설정
    container.style.touchAction = 'auto';
  }

  /**
   * 데스크탑 최적화
   */
  private applyDesktopOptimizations(container: HTMLElement): void {
    // 품질 우선 설정
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      img.style.imageRendering = 'optimizeQuality';
    });
  }

  /**
   * 성능 메트릭 반환
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 정리 메서드
   */
  cleanup(): void {
    this.performanceObserver?.disconnect();
    this.intersectionObserver?.disconnect();

    this.memoryCleanupTasks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });

    this.memoryCleanupTasks.clear();
  }
}

/**
 * 전역 UI 최적화 관리자
 */
let globalUIOptimizer: UIOptimizer | null = null;

/**
 * UI 최적화 관리자 반환
 */
export function getUIOptimizer(): UIOptimizer {
  if (!globalUIOptimizer) {
    globalUIOptimizer = new UIOptimizer();
  }
  return globalUIOptimizer;
}

/**
 * UI 최적화 초기화
 */
export function initializeUIOptimizer(config?: Partial<OptimizationConfig>): UIOptimizer {
  globalUIOptimizer = new UIOptimizer(config);
  return globalUIOptimizer;
}
