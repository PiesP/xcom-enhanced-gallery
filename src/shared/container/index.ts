/**
 * @fileoverview Container Module - Public API Barrel Export
 * @version 1.0.0 - Service container public interface
 * @phase 402: Enhanced documentation and access patterns
 *
 * Exports all public APIs for service container. Routes requests to appropriate
 * sub-modules (service-accessors, harness, bridge).
 *
 * **Three Layers of Access**:
 *
 * 1. **High-Level (Recommended for Features)**:
 *    - Service accessors: getToastManager(), getThemeService()
 *    - Named exports prevent direct registry access
 *
 * 2. **Low-Level (Internal Only)**:
 *    - Service bridge: bridgeGetService(), bridgeRegister()
 *    - Direct registry manipulation
 *    - Only for infrastructure code
 *
 * 3. **Test Support (Test Suites Only)**:
 *    - Test harness: createTestHarness()
 *    - Service mocking and isolation
 *    - Not available in runtime
 *
 * **Design Philosophy**:
 * - Facades hide implementation complexity
 * - Named accessors prevent string-based service lookups
 * - Features use high-level API (maximum safety)
 * - Tests use harness (controlled environment)
 * - Infrastructure uses bridge (when necessary)
 *
 * **Access Pattern Decision Tree**:
 * ```
 * Need service? (Features code)
 *   └─ Named method available? → Use it (getToastManager)
 *
 * Need registry access? (Infrastructure code)
 *   ├─ Registering? → Use bridgeRegister
 *   └─ Retrieving? → Use bridgeGetService or bridgeTryGet
 *
 * Writing tests?
 *   └─ Always use createTestHarness()
 * ```
 *
 * **Module Structure**:
 * - service-accessors.ts: Named getter functions (public API)
 * - service-bridge.ts: Low-level registry bridge (internal)
 * - harness.ts: Test harness factory (test only)
 *
 * **Common Mistakes**:
 * ❌ Direct import: const { SERVICE_KEYS } from '@shared/container'
 * ✅ Use accessor: const toast = getToastManager()
 *
 * ❌ Runtime harness: import { createTestHarness } in production
 * ✅ Tree-shake: Only in test setup/teardown
 *
 * ❌ Registry lookup: bridgeGetService('my-service-key')
 * ✅ Named accessor: getMyService() already defined
 *
 * **Related Modules**:
 * - [Service Accessors](./service-accessors.ts) - Named getters
 * - [Test Harness](./harness.ts) - Test support
 * - [Service Bridge](./service-bridge.ts) - Low-level bridge
 * - [@shared/services](../services/README.md) - Service implementations
 *
 * @author X.com Enhanced Gallery | Phase 402 Optimization
 */
// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: High-Level Service Accessors (Recommended for Features Layer)
// ─────────────────────────────────────────────────────────────────────────────
// Named functions prevent string-based lookups. Type-safe and explicit.
// Encourages features layer to use these instead of direct registry access.
export {
  // Service Getters
  getToastManager,
  getThemeService,
  getMediaFilenameService,
  getMediaServiceFromContainer,
  getGalleryRenderer,
  // Service Registrations
  registerGalleryRenderer,
  registerSettingsManager,
  registerTwitterTokenExtractor,
  tryGetSettingsManager,
  // BaseService
  initializeBaseServices,
  registerBaseService,
  registerCoreBaseServices,
  // Warmup
  warmupCriticalServices,
  warmupNonCriticalServices,
} from './service-accessors';
// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2: Low-Level Service Bridge (Internal Infrastructure Only)
// ─────────────────────────────────────────────────────────────────────────────
// Generic functions for direct registry manipulation. Use only when named
// accessors insufficient. Primarily for service initialization and testing.
export {
  // Generic Service Bridge
  bridgeGetService,
  bridgeTryGet,
  bridgeRegister,
  // BaseService Bridge
  bridgeRegisterBaseService,
  bridgeGetBaseService,
  bridgeTryGetBaseService,
  bridgeInitializeBaseService,
  bridgeInitializeAllBaseServices,
} from './service-bridge';
// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3: Test Support (Test Suites Only)
// ─────────────────────────────────────────────────────────────────────────────
// Test harness for isolated service initialization and mocking. Never use in
// production code - tree-shaking will remove if properly configured.
export { createTestHarness, TestHarness } from './harness';
