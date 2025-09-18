import type { VNode } from '@shared/external/vendors';

export type IconName =
  | 'Download'
  | 'Settings'
  | 'X'
  | 'ChevronLeft'
  | 'ChevronRight'
  | (string & {});

type IconComponent = (props?: Record<string, unknown>) => VNode | unknown;

export interface IconRegistry {
  loadIcon: (name: IconName) => Promise<IconComponent>;
  /** 이미 로드된 아이콘을 동기적으로 반환 (없으면 null) */
  getLoadedIconSync: (name: IconName) => IconComponent | null;
  isLoading: (name: IconName) => boolean;
  setFallbackIcon: (component: IconComponent) => void;
  getCachedIcon: (cacheKey: object, name: IconName) => IconComponent | null;
  setCachedIcon: (cacheKey: object, name: IconName, component: IconComponent) => void;
  clearCache: (cacheKey: object) => void;
  clearAllCaches: () => void;
  getDebugInfo: () => { loadingCount: number; loadingIcons: string[] };
}

// Internal state
let _registry: IconRegistry | null = null;
let _fallback: IconComponent | null = null;
const _loadingMap = new Map<IconName, Promise<IconComponent>>();
let _caches: WeakMap<object, Map<IconName, IconComponent>> = new WeakMap();
// 전역(하이브리드 프리로드) 캐시: preloadCommonIcons가 미리 채워 즉시 동기 조회 가능
const _globalLoaded = new Map<IconName, IconComponent>();

function dynamicImport(name: IconName): Promise<IconComponent> {
  switch (name) {
    case 'Download':
      return import('@shared/components/ui/Icon/hero/HeroDownload.tsx').then(
        m => m.HeroDownload as unknown as IconComponent
      );
    case 'Settings':
      return import('@shared/components/ui/Icon/hero/HeroSettings.tsx').then(
        m => m.HeroSettings as unknown as IconComponent
      );
    case 'X':
      return import('@shared/components/ui/Icon/hero/HeroX.tsx').then(
        m => m.HeroX as unknown as IconComponent
      );
    case 'ChevronLeft':
      return import('@shared/components/ui/Icon/hero/HeroChevronLeft.tsx').then(
        m => m.HeroChevronLeft as unknown as IconComponent
      );
    case 'ChevronRight':
      return import('@shared/components/ui/Icon/hero/HeroChevronRight.tsx').then(
        m => m.HeroChevronRight as unknown as IconComponent
      );
    default:
      if (_fallback) return Promise.resolve(_fallback);
      return Promise.reject(new Error(`Icon not found: ${name}`));
  }
}

function createRegistry(): IconRegistry {
  return {
    async loadIcon(name) {
      if (_loadingMap.has(name)) return _loadingMap.get(name)!;

      // 이미 동기 로드된 경우 Promise.resolve 즉시 반환
      if (_globalLoaded.has(name)) {
        return Promise.resolve(_globalLoaded.get(name)!);
      }

      const promise = dynamicImport(name)
        .then(component => {
          _loadingMap.delete(name);
          _globalLoaded.set(name, component as IconComponent);
          return component;
        })
        .catch(err => {
          _loadingMap.delete(name);
          if (_fallback) return _fallback;
          throw err;
        });

      _loadingMap.set(name, promise);
      return promise;
    },
    getLoadedIconSync(name) {
      return _globalLoaded.get(name) ?? null;
    },
    isLoading(name) {
      return _loadingMap.has(name);
    },
    setFallbackIcon(component) {
      _fallback = component;
    },
    getCachedIcon(cacheKey, name) {
      const m = _caches.get(cacheKey);
      return m?.get(name) ?? null;
    },
    setCachedIcon(cacheKey, name, component) {
      if (!_caches.has(cacheKey)) {
        _caches.set(cacheKey, new Map());
      }
      _caches.get(cacheKey)!.set(name, component);
    },
    clearCache(cacheKey) {
      _caches.delete(cacheKey);
    },
    clearAllCaches() {
      _caches = new WeakMap();
    },
    getDebugInfo() {
      return {
        loadingCount: _loadingMap.size,
        loadingIcons: Array.from(_loadingMap.keys()).map(String),
      };
    },
  };
}

export function getIconRegistry(): IconRegistry {
  if (!_registry) _registry = createRegistry();
  return _registry;
}

export function resetIconRegistry(): void {
  _registry = null;
  _fallback = null;
  _loadingMap.clear();
  _caches = new WeakMap();
  _globalLoaded.clear();
}

export async function preloadCommonIcons(): Promise<void> {
  const registry = getIconRegistry();
  const common: IconName[] = ['Download', 'Settings', 'X', 'ChevronLeft'];
  // 이미 전역에 올라온 경우는 skip
  const toLoad = common.filter(n => !registry.getLoadedIconSync(n));
  if (toLoad.length === 0) return;
  const components = await Promise.all(toLoad.map(n => registry.loadIcon(n)));
  components.forEach((comp, idx) => {
    const name = toLoad[idx] as IconName;
    if (comp) {
      // loadIcon에서 이미 _globalLoaded에 넣었을 가능성 존재 - 재확인
      _globalLoaded.set(name, comp as IconComponent);
    }
  });
}

export { type IconComponent };
