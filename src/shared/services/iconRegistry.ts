import type { VNode } from '@shared/external/vendors';
import { getXegIconComponent } from '@shared/components/ui/Icon/icons/index.ts';
import type { XegIconComponentName } from '@shared/components/ui/Icon/icons/index.ts';
// CORE 아이콘 관리 통합 (기존 core-icons.ts 제거)
// - 분리 파일은 orphan 상태 + 타입 중복 정의로 유지 비용 증가
// - IconName 내 코어 아이콘은 preloadCommonIcons에서 재사용되므로 단일 소스로 유지
// - isCoreIcon/CORE_ICONS를 여기서 export하여 기존 테스트(icon-bundle-guard, icon-preload-contract) 경로 대체

export type IconName = XegIconComponentName | (string & {});

// 단일 소스 CORE 아이콘 목록 (ICN-R5)
export const CORE_ICONS: readonly XegIconComponentName[] = [
  'Download',
  'Settings',
  'Close',
  'ChevronLeft',
  'ChevronRight',
  'ZoomIn',
  'ArrowAutofitWidth',
  'ArrowAutofitHeight',
  'ArrowsMaximize',
  'FileZip',
] as const;

export function isCoreIcon(name: string): boolean {
  return (CORE_ICONS as readonly string[]).includes(name);
}

type IconComponent = (props?: Record<string, unknown>) => VNode | unknown;

function resolveXegIconComponent(name: XegIconComponentName): IconComponent {
  return getXegIconComponent(name) as unknown as IconComponent;
}

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
const ICON_IMPORTS = {
  Download: () => Promise.resolve(resolveXegIconComponent('Download')),
  Settings: () => Promise.resolve(resolveXegIconComponent('Settings')),
  Close: () => Promise.resolve(resolveXegIconComponent('Close')),
  ChevronLeft: () => Promise.resolve(resolveXegIconComponent('ChevronLeft')),
  ChevronRight: () => Promise.resolve(resolveXegIconComponent('ChevronRight')),
  ZoomIn: () => Promise.resolve(resolveXegIconComponent('ZoomIn')),
  ArrowAutofitWidth: () => Promise.resolve(resolveXegIconComponent('ArrowAutofitWidth')),
  ArrowAutofitHeight: () => Promise.resolve(resolveXegIconComponent('ArrowAutofitHeight')),
  ArrowsMaximize: () => Promise.resolve(resolveXegIconComponent('ArrowsMaximize')),
  FileZip: () => Promise.resolve(resolveXegIconComponent('FileZip')),
} as const satisfies Record<XegIconComponentName, () => Promise<IconComponent>>;

function isXegIconComponentName(name: IconName): name is XegIconComponentName {
  return Object.prototype.hasOwnProperty.call(ICON_IMPORTS, name);
}

function dynamicImport(name: IconName): Promise<IconComponent> {
  if (isXegIconComponentName(name)) {
    const loader = ICON_IMPORTS[name];
    return loader();
  }
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
