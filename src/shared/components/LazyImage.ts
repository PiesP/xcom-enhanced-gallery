/**
 * 지연 로딩 이미지 컴포넌트
 * 성능 최적화를 위한 이미지 레이지 로딩 구현
 */

export interface LazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  fadeInDuration?: number;
  placeholderColor?: string;
  errorRetryCount?: number;
  errorRetryDelay?: number;
}

export interface LazyImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  retryCount: number;
  src: string | null;
  placeholder: string | null;
}

/**
 * 지연 로딩 이미지 클래스
 */
export class LazyImage {
  private readonly options: Required<LazyImageOptions>;
  private readonly element: HTMLImageElement;
  private readonly state: LazyImageState;
  private observer: IntersectionObserver | null = null;
  private retryTimer: number | null = null;

  constructor(element: HTMLImageElement, options: Partial<LazyImageOptions> = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      fadeInDuration: 300,
      placeholderColor: '#f0f0f0',
      errorRetryCount: 3,
      errorRetryDelay: 1000,
      ...options,
    };

    this.element = element;
    this.state = {
      isLoading: false,
      isLoaded: false,
      hasError: false,
      retryCount: 0,
      src: element.dataset.src || null,
      placeholder: element.dataset.placeholder || null,
    };

    this.initialize();
  }

  /**
   * 초기화
   */
  private initialize(): void {
    this.setupPlaceholder();
    this.createObserver();
    this.observeElement();
  }

  /**
   * 플레이스홀더 설정
   */
  private setupPlaceholder(): void {
    if (this.state.placeholder) {
      this.element.src = this.state.placeholder;
    } else {
      this.createPlaceholder();
    }

    this.element.style.backgroundColor = this.options.placeholderColor;
    this.element.style.transition = `opacity ${this.options.fadeInDuration}ms ease-in-out`;
  }

  /**
   * 기본 플레이스홀더 생성
   */
  private createPlaceholder(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    canvas.width = 100;
    canvas.height = 100;

    ctx.fillStyle = this.options.placeholderColor;
    ctx.fillRect(0, 0, 100, 100);

    this.element.src = canvas.toDataURL();
  }

  /**
   * Intersection Observer 생성
   */
  private createObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // 폴백: 즉시 로드
      this.loadImage();
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.state.isLoaded && !this.state.isLoading) {
            this.loadImage();
          }
        });
      },
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );
  }

  /**
   * 요소 관찰 시작
   */
  private observeElement(): void {
    if (this.observer) {
      this.observer.observe(this.element);
    }
  }

  /**
   * 이미지 로드
   */
  private loadImage(): void {
    if (!this.state.src || this.state.isLoading) {
      return;
    }

    this.state.isLoading = true;
    this.state.hasError = false;

    const img = new Image();

    img.onload = () => {
      this.onImageLoad(img.src);
    };

    img.onerror = () => {
      this.onImageError();
    };

    img.src = this.state.src;
  }

  /**
   * 이미지 로드 성공 처리
   */
  private onImageLoad(src: string): void {
    this.element.style.opacity = '0';

    setTimeout(() => {
      this.element.src = src;
      this.element.style.opacity = '1';

      this.state.isLoading = false;
      this.state.isLoaded = true;
      this.state.hasError = false;

      this.cleanup();
    }, 50);
  }

  /**
   * 이미지 로드 실패 처리
   */
  private onImageError(): void {
    this.state.isLoading = false;
    this.state.hasError = true;
    this.state.retryCount++;

    if (this.state.retryCount < this.options.errorRetryCount) {
      this.scheduleRetry();
    } else {
      this.showErrorPlaceholder();
    }
  }

  /**
   * 재시도 스케줄링
   */
  private scheduleRetry(): void {
    this.retryTimer = window.setTimeout(() => {
      this.loadImage();
    }, this.options.errorRetryDelay);
  }

  /**
   * 에러 플레이스홀더 표시
   */
  private showErrorPlaceholder(): void {
    this.element.style.opacity = '0.5';
    this.element.alt = 'Failed to load image';
  }

  /**
   * 상태 반환
   */
  getState(): Readonly<LazyImageState> {
    return { ...this.state };
  }

  /**
   * 강제 로드
   */
  forceLoad(): void {
    if (!this.state.isLoaded && !this.state.isLoading) {
      this.loadImage();
    }
  }

  /**
   * 재시도
   */
  retry(): void {
    if (this.state.hasError) {
      this.state.retryCount = 0;
      this.state.hasError = false;
      this.loadImage();
    }
  }

  /**
   * 정리
   */
  private cleanup(): void {
    if (this.observer) {
      this.observer.unobserve(this.element);
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * 인스턴스 해제
   */
  dispose(): void {
    this.cleanup();
    this.element.style.transition = '';
    this.element.style.backgroundColor = '';
  }
}

/**
 * 지연 로딩 관리자
 */
export class LazyImageManager {
  private readonly instances = new Map<HTMLImageElement, LazyImage>();

  /**
   * 이미지 요소 등록
   */
  register(element: HTMLImageElement, options?: Partial<LazyImageOptions>): LazyImage {
    if (this.instances.has(element)) {
      return this.instances.get(element)!;
    }

    const instance = new LazyImage(element, options);
    this.instances.set(element, instance);
    return instance;
  }

  /**
   * 이미지 요소 등록 해제
   */
  unregister(element: HTMLImageElement): void {
    const instance = this.instances.get(element);
    if (instance) {
      instance.dispose();
      this.instances.delete(element);
    }
  }

  /**
   * 모든 이미지 강제 로드
   */
  loadAll(): void {
    this.instances.forEach(instance => {
      instance.forceLoad();
    });
  }

  /**
   * 실패한 이미지 재시도
   */
  retryFailed(): void {
    this.instances.forEach(instance => {
      if (instance.getState().hasError) {
        instance.retry();
      }
    });
  }

  /**
   * 통계 정보 반환
   */
  getStats(): {
    total: number;
    loaded: number;
    loading: number;
    failed: number;
  } {
    const stats = {
      total: this.instances.size,
      loaded: 0,
      loading: 0,
      failed: 0,
    };

    this.instances.forEach(instance => {
      const state = instance.getState();
      if (state.isLoaded) stats.loaded++;
      else if (state.isLoading) stats.loading++;
      else if (state.hasError) stats.failed++;
    });

    return stats;
  }

  /**
   * 모든 인스턴스 정리
   */
  dispose(): void {
    this.instances.forEach(instance => {
      instance.dispose();
    });
    this.instances.clear();
  }
}

/**
 * 글로벌 지연 로딩 관리자
 */
export const globalLazyImageManager = new LazyImageManager();

/**
 * 이미지 요소에 지연 로딩 적용
 */
export function enableLazyLoading(
  element: HTMLImageElement,
  options?: Partial<LazyImageOptions>
): LazyImage {
  return globalLazyImageManager.register(element, options);
}

/**
 * DOM에서 data-src 속성을 가진 모든 이미지에 지연 로딩 적용
 */
export function enableLazyLoadingForAll(
  container: Element = document.body,
  options?: Partial<LazyImageOptions>
): LazyImage[] {
  const images = container.querySelectorAll('img[data-src]') as NodeListOf<HTMLImageElement>;
  const instances: LazyImage[] = [];

  images.forEach(img => {
    instances.push(enableLazyLoading(img, options));
  });

  return instances;
}
