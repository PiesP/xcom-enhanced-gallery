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

function dynamicImport(name: IconName): Promise<IconComponent> {
  switch (name) {
    case 'Download':
      return import('@shared/components/ui/Icon/icons/Download.tsx').then(
        m => m.Download as IconComponent
      );
    case 'Settings':
      return import('@shared/components/ui/Icon/icons/Settings.tsx').then(
        m => m.Settings as IconComponent
      );
    case 'X':
      return import('@shared/components/ui/Icon/icons/X.tsx').then(m => m.X as IconComponent);
    case 'ChevronLeft':
      return import('@shared/components/ui/Icon/icons/ChevronLeft.tsx').then(
        m => m.ChevronLeft as IconComponent
      );
    case 'ChevronRight':
      return import('@shared/components/ui/Icon/icons/ChevronRight.tsx').then(
        m => m.ChevronRight as IconComponent
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

      const promise = dynamicImport(name)
        .then(component => {
          _loadingMap.delete(name);
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
}

export async function preloadCommonIcons(): Promise<void> {
  const registry = getIconRegistry();
  await Promise.all([
    registry.loadIcon('Download'),
    registry.loadIcon('Settings'),
    registry.loadIcon('X'),
    registry.loadIcon('ChevronLeft'),
  ]);
}

export { type IconComponent };
