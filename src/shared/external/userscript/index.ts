/**
 * Userscript API Layer - Tampermonkey access and environment detection
 *
 * **Purpose**: Safe getter for GM_* API (Phase 309+ Service Layer preferred)
 * **Principle**: Use barrel exports only, forbid direct imports of internal files
 * **Architecture**: Provide getter functions, recommend using Service Layer for actual use
 *
 * **Internal Implementation (not exposed)**:
 * - adapter.ts: GM_* API getter wrapper
 * - environment-detector.ts: Environment detection and validation
 *
 * **Usage Priority** (recommended order):
 * 1. **Service Layer** (highest priority) - PersistentStorage, NotificationService, DownloadService, etc.
 * 2. **Getter** (advanced/testing) - getUserscript(), detectEnvironment()
 * 3. **Direct GM_* call** (forbidden) ❌
 *
 * **Pattern**:
 * ```typescript
 * // ✅ Recommended: Use Service Layer
 * import { PersistentStorage } from '@shared/services';
 * const storage = PersistentStorage.getInstance();
 * await storage.set('key', value);
 *
 * // ⚠️ Advanced/Testing: Use getter (only when needed)
 * import { getUserscript, detectEnvironment } from '@shared/external/userscript';
 * const us = getUserscript();
 * const env = detectEnvironment();
 *
 * // ❌ Forbidden: Direct GM call
 * GM_setValue('key', value); // Never!
 * ```
 *
 * **Why Service Layer**:
 * - Type safety: Generic-based API
 * - Error handling: Consistent error management
 * - Testability: Mock services for testing
 * - Performance: Caching and optimization
 *
 * **Related Documentation**:
 * - {@link ../README.md} - Parent directory guide
 * - {@link ../../docs/ARCHITECTURE.md} - Phase 309+ Service Layer
 * - {@link ../../services/} - Service implementations
 * - {@link ../../docs/CODING_GUIDELINES.md} - Forbidden patterns
 *
 * @version 3.0.0 - Phase 370: Service Layer priority clarification & forbidden pattern emphasis
 * @fileoverview Userscript API layer (barrel export policy compliance)
 * @see ../../docs/ARCHITECTURE.md - Tampermonkey Service Layer
 */

// ====================================
// 1. Environment detection (public)
// ====================================

/**
 * **Environment Detection**: Detailed information about current execution environment
 *
 * @example
 * ```typescript
 * import { detectEnvironment } from '@shared/external/userscript';
 * const env = detectEnvironment();
 * console.log(env.isGMAvailable); // true/false
 * console.log(env.environmentType); // 'userscript' | 'browser' | 'test'
 * ```
 */
export { detectEnvironment, type EnvironmentInfo } from './environment-detector';

/**
 * **GM API Availability Check**: Check if GM_* API is available in current environment
 *
 * @example
 * ```typescript
 * import { isGMAPIAvailable } from '@shared/external/userscript';
 * if (isGMAPIAvailable()) {
 *   // GM_* API is available
 * }
 * ```
 */
export { isGMAPIAvailable } from './environment-detector';

/**
 * **Environment Description**: Detailed text description of current environment
 *
 * @example
 * ```typescript
 * import { getEnvironmentDescription } from '@shared/external/userscript';
 * console.log(getEnvironmentDescription());
 * // Example: "Userscript (Tampermonkey 5.4.0, Chrome 120)"
 * ```
 */
export { getEnvironmentDescription } from './environment-detector';

// ====================================
// 2. Userscript Getter (advanced/testing only)
// ====================================

/**
 * 🔧 **Userscript Getter** (advanced/testing only, @internal)
 *
 * **Use Service Layer for general purposes.**
 * This getter is only for special situations (advanced testing, debugging).
 *
 * **Normal Flow**:
 * - Storage: Use PersistentStorage.getInstance() ✅
 * - Direct access via this getter: ❌
 *
 * **Usage**: Testing and environment detection only
 *
 * @internal Advanced/testing only
 * @example
 * ```typescript
 * import { getUserscript } from '@shared/external/userscript';
 *
 * // Testing: Direct check of GM_* API (very rare case)
 * const us = getUserscript();
 * const available = !!us?.GM_notification;
 * ```
 *
 * @see PersistentStorage - Recommended service for storage
 * @see NotificationService - Recommended service for notifications
 * @see DownloadService - Recommended service for downloads
 */
export { getUserscript, type UserscriptAPI, type UserscriptManager } from './adapter';
