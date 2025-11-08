/**
 * @fileoverview Icon Registry - Dynamic Loading and Caching System
 * @description Dynamic icon loading registry with caching and fallback support.
 * Implements lazy loading pattern for Heroicons adapted to Solid.js.
 * @version 2.0.0 - Phase 387: Moved from services to components/ui/Icon, enhanced documentation
 * @module shared/components/ui/Icon
 *
 * **Architecture**:
 * - Lazy loading: Icons loaded on-demand via dynamic imports
 * - Caching: WeakMap-based cache for component instances (Phase 309+)
 * - Fallback: Optional fallback component for load failures
 * - Debug info: Loading state tracking for diagnostics
 *
 * **Usage**:
 * ```typescript
 * import { getIconRegistry, preloadCommonIcons } from '@shared/components/ui/Icon/icon-registry';
 *
 * // Get registry
 * const registry = getIconRegistry();
 *
 * // Load icon dynamically
 * const HeroDownload = await registry.loadIcon('Download');
 *
 * // Preload common icons
 * await preloadCommonIcons();
 * ```
 *
 * **Registry Methods**:
 * - `loadIcon(name)`: Load icon component asynchronously
 * - `isLoading(name)`: Check if icon is currently loading
 * - `setFallbackIcon(component)`: Set fallback for load failures
 * - `getCachedIcon(cacheKey, name)`: Retrieve cached icon instance
 * - `setCachedIcon(cacheKey, name, component)`: Cache icon instance
 * - `clearCache(cacheKey)`: Clear cache for specific key
 * - `clearAllCaches()`: Clear all caches (WeakMap reset)
 * - `getDebugInfo()`: Get loading state and statistics
 *
 * **Performance Considerations**:
 * - WeakMap allows automatic garbage collection (Phase 309+)
 * - Deduplication prevents duplicate loading (Map-based dedup)
 * - Fallback prevents cascade failures
 * - Dynamic imports enable tree-shaking
 */

import type { JSXElement } from '@shared/external/vendors';
import type { IconProps } from './Icon';

/**
 * Supported icon names (extensible with `string & {}`)
 * Maps to Heroicons components in ./hero/ directory
 */
export type IconName =
  | 'Download'
  | 'Settings'
  | 'X'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'ArrowDownTray'
  | 'ArrowDownOnSquareStack'
  | 'ArrowSmallLeft'
  | 'ArrowSmallRight'
  | 'ArrowLeftOnRectangle'
  | 'ChatBubbleLeftRight'
  | 'Cog6Tooth'
  | 'ArrowsPointingIn'
  | 'ArrowsRightLeft'
  | 'ArrowsUpDown'
  | 'ArrowsPointingOut'
  | (string & {});

/**
 * Icon component type signature
 * All icon components follow this pattern (props -> JSXElement)
 */
type IconComponent = (props: IconProps) => JSXElement;

/**
 * Icon Registry Interface - Public API for icon management
 *
 * @description Manages dynamic loading, caching, and fallback for icons
 */
export interface IconRegistry {
  /**
   * Load icon component asynchronously
   * Deduplicates concurrent loads (same promise returned)
   *
   * @param {IconName} name - Icon name to load
   * @returns {Promise<IconComponent>} Loaded component or fallback
   * @throws {Error} If icon not found and no fallback set
   */
  loadIcon: (name: IconName) => Promise<IconComponent>;

  /**
   * Check if icon is currently loading
   *
   * @param {IconName} name - Icon name to check
   * @returns {boolean} true if loading in progress
   */
  isLoading: (name: IconName) => boolean;

  /**
   * Set fallback component for load failures
   *
   * @param {IconComponent} component - Fallback component
   * @returns {void}
   */
  setFallbackIcon: (component: IconComponent) => void;

  /**
   * Retrieve cached icon from WeakMap cache
   * WeakMap allows automatic garbage collection
   *
   * @param {object} cacheKey - Cache key (object reference)
   * @param {IconName} name - Icon name
   * @returns {IconComponent | null} Cached component or null
   */
  getCachedIcon: (cacheKey: object, name: IconName) => IconComponent | null;

  /**
   * Store icon in WeakMap cache
   *
   * @param {object} cacheKey - Cache key (object reference)
   * @param {IconName} name - Icon name
   * @param {IconComponent} component - Component to cache
   * @returns {void}
   */
  setCachedIcon: (cacheKey: object, name: IconName, component: IconComponent) => void;

  /**
   * Clear cache for specific key
   *
   * @param {object} cacheKey - Cache key to clear
   * @returns {void}
   */
  clearCache: (cacheKey: object) => void;

  /**
   * Clear all caches (WeakMap reset)
   * Triggers garbage collection for all cached icons
   *
   * @returns {void}
   */
  clearAllCaches: () => void;

  /**
   * Get debug information about loading state
   * Useful for diagnostics and performance monitoring
   *
   * @returns {Object} Debug info with loadingCount and icon names
   */
  getDebugInfo: () => { loadingCount: number; loadingIcons: string[] };
}

// ============================================================================
// Internal State Management
// ============================================================================

/** Singleton registry instance */
let _registry: IconRegistry | null = null;

/** Fallback component for load failures */
let _fallback: IconComponent | null = null;

/** Loading promise map for deduplication (prevents duplicate loads) */
const _loadingMap = new Map<IconName, Promise<IconComponent>>();

/** WeakMap-based cache for component instances (Phase 309+) */
let _caches: WeakMap<object, Map<IconName, IconComponent>> = new WeakMap();

// ============================================================================
// Dynamic Import Map
// ============================================================================

/**
 * Dynamic import handler for Heroicons
 * Maps icon name to Vite dynamic import statement
 * Enables tree-shaking: unused icons excluded from bundle
 *
 * @param {IconName} name - Icon name to import
 * @returns {Promise<IconComponent>} Imported component
 * @throws {Error} If icon not found and no fallback set
 */
function dynamicImport(name: IconName): Promise<IconComponent> {
  switch (name) {
    case 'Download':
      return import('./hero/HeroDownload.tsx').then(m => m.HeroDownload);
    case 'ArrowDownTray':
      return import('./hero/HeroDownload.tsx').then(m => m.HeroDownload);
    case 'ArrowDownOnSquareStack':
      return import('./hero/HeroArrowDownOnSquareStack.tsx').then(
        m => m.HeroArrowDownOnSquareStack
      );
    case 'Settings':
      return import('./hero/HeroSettings.tsx').then(m => m.HeroSettings);
    case 'Cog6Tooth':
      return import('./hero/HeroCog6Tooth.tsx').then(m => m.HeroCog6Tooth);
    case 'X':
      return import('./hero/HeroX.tsx').then(m => m.HeroX);
    case 'ArrowLeftOnRectangle':
      return import('./hero/HeroArrowLeftOnRectangle.tsx').then(m => m.HeroArrowLeftOnRectangle);
    case 'ChevronLeft':
      return import('./hero/HeroChevronLeft.tsx').then(m => m.HeroChevronLeft);
    case 'ChevronRight':
      return import('./hero/HeroChevronRight.tsx').then(m => m.HeroChevronRight);
    case 'ArrowSmallLeft':
      return import('./hero/HeroArrowSmallLeft.tsx').then(m => m.HeroArrowSmallLeft);
    case 'ArrowSmallRight':
      return import('./hero/HeroArrowSmallRight.tsx').then(m => m.HeroArrowSmallRight);
    case 'ChatBubbleLeftRight':
      return import('./hero/HeroChatBubbleLeftRight.tsx').then(m => m.HeroChatBubbleLeftRight);
    case 'ArrowsPointingIn':
      return import('./hero/HeroArrowsPointingIn.tsx').then(m => m.HeroArrowsPointingIn);
    case 'ArrowsRightLeft':
      return import('./hero/HeroArrowsRightLeft.tsx').then(m => m.HeroArrowsRightLeft);
    case 'ArrowsUpDown':
      return import('./hero/HeroArrowsUpDown.tsx').then(m => m.HeroArrowsUpDown);
    case 'ArrowsPointingOut':
      return import('./hero/HeroArrowsPointingOut.tsx').then(m => m.HeroArrowsPointingOut);
    default:
      if (_fallback) return Promise.resolve(_fallback);
      return Promise.reject(new Error(`Icon not found: ${name}`));
  }
}

// ============================================================================
// Registry Factory
// ============================================================================

/**
 * Create new registry instance with all methods
 *
 * @returns {IconRegistry} New registry instance
 * @description Separated for testability - allows registry reset without module reload
 */
function createRegistry(): IconRegistry {
  return {
    async loadIcon(name) {
      // Deduplication: return existing promise if loading
      if (_loadingMap.has(name)) return _loadingMap.get(name)!;

      // Create loading promise
      const promise = dynamicImport(name)
        .then(component => {
          // Cleanup: remove from loading map on success
          _loadingMap.delete(name);
          return component;
        })
        .catch(err => {
          // Cleanup: remove from loading map on error
          _loadingMap.delete(name);
          // Fallback to fallback component if available
          if (_fallback) return _fallback;
          // Rethrow if no fallback
          throw err;
        });

      // Store for deduplication
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
      // WeakMap allows automatic garbage collection
      const m = _caches.get(cacheKey);
      return m?.get(name) ?? null;
    },

    setCachedIcon(cacheKey, name, component) {
      // Create nested Map if needed
      if (!_caches.has(cacheKey)) {
        _caches.set(cacheKey, new Map());
      }
      _caches.get(cacheKey)!.set(name, component);
    },

    clearCache(cacheKey) {
      _caches.delete(cacheKey);
    },

    clearAllCaches() {
      // WeakMap reset triggers garbage collection
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

// ============================================================================
// Public API
// ============================================================================

/**
 * Get or create singleton registry instance
 * Lazy initialization: registry created on first access
 *
 * @returns {IconRegistry} Singleton registry instance
 */
export function getIconRegistry(): IconRegistry {
  if (!_registry) _registry = createRegistry();
  return _registry;
}

/**
 * Reset registry to initial state
 * Useful for testing and cleanup
 * Triggers WeakMap garbage collection
 *
 * @returns {void}
 */
export function resetIconRegistry(): void {
  _registry = null;
  _fallback = null;
  _loadingMap.clear();
  _caches = new WeakMap();
}

/**
 * Preload common icons in parallel
 * Called during app initialization to warm up cache
 * Improves perceived performance for frequently used icons
 *
 * @returns {Promise<void>} Resolves when all icons loaded
 * @description Used by useCommonIconPreload() hook
 */
export async function preloadCommonIcons(): Promise<void> {
  const registry = getIconRegistry();
  await Promise.all([
    registry.loadIcon('Download'),
    registry.loadIcon('Settings'),
    registry.loadIcon('X'),
    registry.loadIcon('ChevronLeft'),
    registry.loadIcon('ChevronRight'),
  ]);
}
