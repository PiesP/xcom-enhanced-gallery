/**
 * @fileoverview Service Manager wrapper (compatibility maintenance)
 * @description Re-export of new core module exports
 * @version 2.0.0 - Phase C: Complete Service Manager separation (delegation pattern)
 * @version 2.1.0 - Phase 354: File Naming Normalization (core-service-manager.ts)
 *
 * ⚠️ Actual implementation moved to src/shared/services/core/core-service-manager.ts
 * All exports are re-exported from this file for compatibility.
 *
 * Phase 354: Renamed service-manager.ts → core-service-manager.ts to avoid naming conflicts
 */

export {
  CoreService,
  serviceManager,
  getService,
  registerServiceFactory,
} from './core/core-service-manager';
