/**
 * @fileoverview Core Service Management Module (Delegation Pattern)
 * @description Exports three specialized managers (Registry, Factory, Lifecycle)
 * and the central orchestrator (CoreService) that coordinates between them.
 *
 * **Architecture**: Implements Orchestrator Pattern where CoreService delegates
 * to specialized managers for registry operations, factory management, and
 * BaseService lifecycle control. See {@link ARCHITECTURE.md} Service Layer section.
 *
 * **Phase Reference**: Phase 309 Service Layer Pattern, Phase 380 Optimization, Phase 354 Naming
 *
 * @version 2.0.0 - Service Manager Delegation Pattern (Complete Separation)
 * @version 2.1.0 - Phase 354: File Naming Normalization (core-service-manager.ts)
 * @see CoreService - Central orchestrator for all service operations
 * @see ServiceRegistry - Direct instance storage and retrieval
 * @see ServiceFactoryManager - Factory registration and caching
 * @see ServiceLifecycleManager - BaseService initialization and cleanup
 */

export {
  CoreService,
  serviceManager,
  getService,
  registerServiceFactory,
} from './core-service-manager';
