/**
 * @fileoverview Icon Registry Service for Lazy Icon Loading
 *
 * 아이콘을 필요할 때만 동적으로 로드하여 번들 크기를 최적화합니다.
 * WeakMap을 사용한 캐싱으로 메모리 효율성을 보장합니다.
 */

// 타입 정의 (vendor getters 사용)
type ComponentType<P = Record<string, unknown>> = (props: P) => unknown;

/**
 * 아이콘 컴포넌트 타입 정의
 */
export type IconComponent = ComponentType<{
  size?: number | string;
  stroke?: number;
  color?: string;
  className?: string;
}>;

/**
 * 아이콘 로딩 상태
 */
export type IconLoadingState =
  | { status: 'loading' }
  | { status: 'loaded'; component: IconComponent }
  | { status: 'error'; error: Error };

/**
 * 아이콘 이름 타입 (자주 사용되는 아이콘들)
 */
export type IconName =
  | 'Download'
  | 'Settings'
  | 'X'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'ArrowsMaximize'
  | 'ZoomIn'
  | 'FileZip';

/**
 * 아이콘 캐시 타입
 */
type IconCache = WeakMap<object, Map<IconName, IconComponent>>;

/**
 * 아이콘 로딩 Promise 캐시
 */
type LoadingCache = Map<IconName, Promise<IconComponent>>;

/**
 * 아이콘 레지스트리 클래스
 *
 * 특징:
 * - 지연 로딩으로 번들 크기 최적화
 * - WeakMap 캐싱으로 메모리 누수 방지
 * - Promise 캐싱으로 중복 요청 방지
 * - 에러 처리 및 fallback 지원
 */
export class IconRegistry {
  private cache: IconCache;
  private readonly loadingCache: LoadingCache;
  private fallbackIcon: IconComponent | null = null;

  constructor() {
    this.cache = new WeakMap();
    this.loadingCache = new Map();
  }

  /**
   * Fallback 아이콘 설정
   */
  setFallbackIcon(icon: IconComponent): void {
    this.fallbackIcon = icon;
  }

  /**
   * 아이콘을 지연 로딩합니다
   */
  async loadIcon(name: IconName): Promise<IconComponent> {
    // 로딩 중인 요청이 있다면 재사용
    const loadingPromise = this.loadingCache.get(name);
    if (loadingPromise) {
      return loadingPromise;
    }

    // 새로운 로딩 Promise 생성
    const promise = this.loadIconInternal(name);
    this.loadingCache.set(name, promise);

    try {
      const component = await promise;
      // 성공 시 로딩 캐시에서 제거
      this.loadingCache.delete(name);
      return component;
    } catch (error) {
      // 실패 시에도 로딩 캐시에서 제거
      this.loadingCache.delete(name);
      throw error;
    }
  }

  /**
   * 실제 아이콘 로딩 구현
   */
  private async loadIconInternal(name: IconName): Promise<IconComponent> {
    try {
      // 기존 아이콘 컴포넌트에서 동적 import
      const module = await import(`../components/ui/Icon/icons/${name}.js`);
      const IconComponent = module[name] as IconComponent;

      if (!IconComponent) {
        throw new Error(`Icon "${name}" not found in ui/Icon/icons`);
      }

      return IconComponent;
    } catch (error) {
      console.error(`Failed to load icon "${name}":`, error);

      // Fallback 아이콘이 있다면 반환
      if (this.fallbackIcon) {
        return this.fallbackIcon;
      }

      throw error;
    }
  }

  /**
   * 캐시된 아이콘 가져오기 (동기적)
   */
  getCachedIcon(cacheKey: object, name: IconName): IconComponent | null {
    const componentCache = this.cache.get(cacheKey);
    return componentCache?.get(name) || null;
  }

  /**
   * 아이콘을 캐시에 저장
   */
  setCachedIcon(cacheKey: object, name: IconName, component: IconComponent): void {
    let componentCache = this.cache.get(cacheKey);
    if (!componentCache) {
      componentCache = new Map();
      this.cache.set(cacheKey, componentCache);
    }
    componentCache.set(name, component);
  }

  /**
   * 특정 캐시 키의 모든 아이콘 제거
   */
  clearCache(cacheKey: object): void {
    this.cache.delete(cacheKey);
  }

  /**
   * 모든 캐시 제거
   */
  clearAllCaches(): void {
    // WeakMap과 Map 모두 clear
    this.cache = new WeakMap();
    this.loadingCache.clear();
  }

  /**
   * 로딩 상태 확인
   */
  isLoading(name: IconName): boolean {
    return this.loadingCache.has(name);
  }

  /**
   * 디버그 정보 가져오기
   */
  getDebugInfo(): {
    loadingCount: number;
    loadingIcons: IconName[];
  } {
    return {
      loadingCount: this.loadingCache.size,
      loadingIcons: Array.from(this.loadingCache.keys()),
    };
  }
}

/**
 * 전역 아이콘 레지스트리 인스턴스
 */
let globalIconRegistry: IconRegistry | null = null;

/**
 * 전역 아이콘 레지스트리 가져오기
 */
export function getIconRegistry(): IconRegistry {
  if (!globalIconRegistry) {
    globalIconRegistry = new IconRegistry();
  }
  return globalIconRegistry;
}

/**
 * 테스트용 레지스트리 재설정
 */
export function resetIconRegistry(): void {
  globalIconRegistry = null;
}

/**
 * 아이콘 프리로딩 유틸리티
 * 자주 사용되는 아이콘들을 미리 로드합니다
 */
export async function preloadCommonIcons(): Promise<void> {
  const registry = getIconRegistry();
  const commonIcons: IconName[] = ['Download', 'Settings', 'X', 'ChevronLeft'];

  // 병렬로 로드
  await Promise.allSettled(commonIcons.map(iconName => registry.loadIcon(iconName)));
}
