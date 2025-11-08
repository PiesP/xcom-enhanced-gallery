/**
 * @fileoverview Service Bridge - Low-Level Registry Access
 * @version 1.0.0 - Generic access functions for registry
 * @phase 402: Enhanced documentation for bridge pattern
 *
 * Provides low-level generic access to CoreService registry. Internal to
 * container module; features should use service-accessors.ts instead.
 *
 * **Internal Only**: Features must use service-accessors.ts typed getters
 *
 * **Design Pattern**: Bridge pattern hiding CoreService complexity
 * **Architecture Role**: Internal infrastructure (not features-facing)
 * **Access Methods**: Generic get/tryGet/register (type-unsafe)
 * **Recommended**: Use this only when named accessors insufficient
 *
 * **Bridge vs Accessors**:
 * | Accessor            | Bridge                    | Context           |
 * |---------------------|---------------------------|-------------------|
 * | `getThemeService()` | `bridgeGetService<T>(key)`| Type-safe vs generic |
 * | Named (convenience) | Manual `SERVICE_KEYS`    | Recommended vs internal |
 * | Features layer      | Container infrastructure | Public vs private |
 *
 * **Architecture**:
 * Features → Service Accessors (named) → Service Bridge (generic) → CoreService
 *
 * @related [Service Accessors](./service-accessors.ts), [CoreServiceRegistry](./core-service-registry.ts)
 */
import { CoreService } from '../services/core';
import type { BaseService } from '../types/core/base-service.types';

// ============================================================================
// Generic Service Access (Low-level, type-unsafe registry access)
// ============================================================================

/**
 * Get service via generic registry access (throws if not found).
 *
 * **Use Case**: When named accessor unavailable or type needs hiding
 * **Recommended**: Use service-accessors.ts typed getters instead
 *
 * @template T - Service type (unchecked at compile time)
 * @param key - Service key from SERVICE_KEYS
 * @returns Service instance
 * @throws CoreService throws if service not registered
 *
 * @internal Infrastructure layer only
 *
 * @deprecated Use service-accessors typed getters
 * @example
 * // ❌ Avoid (generic, manual key management)
 * const logger = bridgeGetService<ILogger>(SERVICE_KEYS.LOGGER);
 *
 * // ✅ Use instead (type-safe, convenient)
 * const logger = getLogger();
 */
export function bridgeGetService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

/**
 * Get service via generic registry access (returns null if not found).
 *
 * **Use Case**: Non-throwing alternative for optional services
 * **Recommended**: Use service-accessors.ts typed getters instead
 *
 * @template T - Service type (unchecked at compile time)
 * @param key - Service key from SERVICE_KEYS
 * @returns Service instance or null if not found
 *
 * @internal Infrastructure layer only
 * @deprecated Use service-accessors typed getters
 */
export function bridgeTryGet<T>(key: string): T | null {
  return CoreService.getInstance().tryGet<T>(key);
}

/**
 * Register service via generic registry access.
 *
 * **Use Case**: Manual service registration (usually unnecessary)
 * **Recommended**: Use service-accessors.ts registration helpers instead
 *
 * @template T - Service type
 * @param key - Service key from SERVICE_KEYS
 * @param instance - Service instance to register
 *
 * @internal Infrastructure layer only
 * @deprecated Use service-accessors registration helpers
 */
export function bridgeRegister<T>(key: string, instance: T): void {
  CoreService.getInstance().register<T>(key, instance);
}

// ============================================================================
// BaseService Bridge (Framework service access)
// ============================================================================

/**
 * Register BaseService in CoreService registry.
 *
 * **BaseServices**: Typically ThemeService, LanguageService
 * **Lifecycle**: Services have initialize() and destroy() methods
 * **Note**: Phase 414 - AnimationService removed (optional feature)
 *
 * @param key - Service key (SERVICE_KEYS.THEME, LANGUAGE, etc.)
 * @param service - BaseService instance to register
 *
 * @internal Infrastructure layer only
 */
export function bridgeRegisterBaseService(key: string, service: BaseService): void {
  CoreService.getInstance().registerBaseService(key, service);
}

/**
 * Get BaseService (throws if not found).
 *
 * @param key - Service key (typically SERVICE_KEYS.ANIMATION, THEME, LANGUAGE)
 * @returns BaseService instance
 * @throws CoreService throws if service not registered
 *
 * @internal Infrastructure layer only
 */
export function bridgeGetBaseService(key: string): BaseService {
  return CoreService.getInstance().getBaseService(key);
}

/**
 * Get BaseService safely (returns null if not found).
 *
 * @param key - Service key (typically SERVICE_KEYS.ANIMATION, THEME, LANGUAGE)
 * @returns BaseService instance or null if not found
 *
 * @internal Infrastructure layer only
 */
export function bridgeTryGetBaseService(key: string): BaseService | null {
  return CoreService.getInstance().tryGetBaseService(key);
}

/**
 * Initialize single BaseService.
 *
 * @param key - Service key (typically SERVICE_KEYS.ANIMATION, THEME, LANGUAGE)
 * @returns Promise resolving when service initialized
 *
 * @internal Infrastructure layer only
 */
export async function bridgeInitializeBaseService(key: string): Promise<void> {
  return CoreService.getInstance().initializeBaseService(key);
}

/**
 * Initialize all BaseServices in dependency order.
 *
 * **Initialization Order**: ANIMATION → THEME → LANGUAGE
 * **Respects Dependencies**: Ensures base services initialize before features
 *
 * @param keys - Optional specific keys to initialize (defaults to all)
 * @returns Promise resolving when all specified services initialized
 *
 * @internal Infrastructure layer only
 *
 * @example
 * // Initialize all base services
 * await bridgeInitializeAllBaseServices();
 *
 * // Initialize specific services
 * await bridgeInitializeAllBaseServices([SERVICE_KEYS.THEME, SERVICE_KEYS.LANGUAGE]);
 */
export async function bridgeInitializeAllBaseServices(keys?: string[]): Promise<void> {
  return CoreService.getInstance().initializeAllBaseServices(keys);
}
