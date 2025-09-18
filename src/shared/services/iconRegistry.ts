import type { VNode } from '@shared/external/vendors';
// CORE 아이콘 관리 통합 (기존 core-icons.ts 제거)
// - 분리 파일은 orphan 상태 + 타입 중복 정의로 유지 비용 증가
// - IconName 내 코어 아이콘은 preloadCommonIcons에서 재사용되므로 단일 소스로 유지
// - isCoreIcon/CORE_ICONS를 여기서 export하여 기존 테스트(icon-bundle-guard, icon-preload-contract) 경로 대체

export type IconName =
  | 'Download'
  | 'Settings'
  | 'X'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'ZoomIn'
  | 'ArrowAutofitWidth'
  | 'ArrowAutofitHeight'
  | 'ArrowsMaximize'
  | 'FileZip'
  | (string & {});

// 단일 소스 CORE 아이콘 목록 (ICN-R5)
export const CORE_ICONS: readonly IconName[] = [
  'Download',
  'Settings',
  'X',
  'ChevronLeft',
  'ChevronRight',
  'ZoomIn',
  'ArrowAutofitWidth',
  'ArrowAutofitHeight',
  'ArrowsMaximize',
  'FileZip',
];

export function isCoreIcon(name: string): boolean {
  return (CORE_ICONS as readonly string[]).includes(name);
}

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

// Declarative import 맵 (ICN-R5)
const ICON_IMPORTS: Record<string, () => Promise<IconComponent>> = {
  Download: () =>
    import('@shared/components/ui/Icon/hero/HeroDownload.tsx').then(
      m => m.HeroDownload as unknown as IconComponent
    ),
  Settings: () =>
    import('@shared/components/ui/Icon/hero/HeroSettings.tsx').then(
      m => m.HeroSettings as unknown as IconComponent
    ),
  X: () =>
    import('@shared/components/ui/Icon/hero/HeroX.tsx').then(
      m => m.HeroX as unknown as IconComponent
    ),
  ChevronLeft: () =>
    import('@shared/components/ui/Icon/hero/HeroChevronLeft.tsx').then(
      m => m.HeroChevronLeft as unknown as IconComponent
    ),
  ChevronRight: () =>
    import('@shared/components/ui/Icon/hero/HeroChevronRight.tsx').then(
      m => m.HeroChevronRight as unknown as IconComponent
    ),
  ZoomIn: () =>
    import('@shared/components/ui/Icon/hero/HeroZoomIn.tsx').then(
      m => m.HeroZoomIn as unknown as IconComponent
    ),
  ArrowAutofitWidth: () =>
    import('@shared/components/ui/Icon/hero/HeroArrowAutofitWidth.tsx').then(
      m => m.HeroArrowAutofitWidth as unknown as IconComponent
    ),
  ArrowAutofitHeight: () =>
    import('@shared/components/ui/Icon/hero/HeroArrowAutofitHeight.tsx').then(
      m => m.HeroArrowAutofitHeight as unknown as IconComponent
    ),
  ArrowsMaximize: () =>
    import('@shared/components/ui/Icon/hero/HeroArrowsMaximize.tsx').then(
      m => m.HeroArrowsMaximize as unknown as IconComponent
    ),
  FileZip: () =>
    import('@shared/components/ui/Icon/hero/HeroFileZip.tsx').then(
      m => m.HeroFileZip as unknown as IconComponent
    ),
};

function dynamicImport(name: IconName): Promise<IconComponent> {
  const loader = ICON_IMPORTS[name];
  if (loader) return loader();
  if (_fallback) return Promise.resolve(_fallback);
  return Promise.reject(new Error(`Icon not found: ${name}`));
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
  // CORE 아이콘 확장: 모든 툴바 상호작용 아이콘 동기 렌더 체감 향상
  const toLoad = CORE_ICONS.filter(n => !registry.getLoadedIconSync(n as IconName));
  if (toLoad.length === 0) return;
  const components = await Promise.all(toLoad.map(n => registry.loadIcon(n as IconName)));
  components.forEach((comp, idx) => {
    const name = toLoad[idx] as IconName;
    if (comp) {
      _globalLoaded.set(name, comp as IconComponent);
    }
  });
}

export { ICON_IMPORTS };

export { type IconComponent };
