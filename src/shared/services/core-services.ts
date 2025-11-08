/**
 * @fileoverview Core Services Consolidation
 * @version 1.1.0 - Phase 350: Circular dependency removal
 *
 * Consolidation of small service files
 * - ServiceRegistry (consolidated)
 * - CoreService (formerly ServiceManager) export added
 *
 * Phase 1 Step 3: Complexity reduction through file consolidation
 * Phase 2025-10-27: Logger redefinition removal (→ use @shared/logging)
 * Phase 350 (2025-11-04): ServiceDiagnostics re-export removal (prevent circular dependencies)
 */

// ================================
// Core Service Export
// ================================

// CoreService (formerly ServiceManager) - naming convention unified
export { CoreService } from './service-manager';
export { serviceManager } from './service-manager';
export { getService } from './service-manager';

// ================================
// Logger & Type Aliases
// ================================

// Use directly from @shared/logging
export { logger, type Logger } from '@shared/logging';
export type { Logger as ILogger } from '@shared/logging';

// ServiceTypeMapping removed - Phase 4 Step 4: Excessive abstraction removal
// Use direct service key types
export type ServiceKey = string;

// ================================
// Service Diagnostics
// ================================

/**
 * ServiceManager diagnostics tool
 *
 * Tool to verify ServiceManager status and service registration state
 *
 * Phase 350: Circular dependency removal
 * - ServiceDiagnostics is a development tool; import directly when needed:
 *   import { ServiceDiagnostics } from '@shared/services/service-diagnostics';
 * - Re-export removed from core-services.ts to prevent circular dependencies
 */
// export { ServiceDiagnostics } from './service-diagnostics'; // REMOVED: Circular dependency

// ================================
// Service Registry separated to different file
// See service-registry.ts
// ================================

// CoreService class removed - Phase 4 simplification

// ================================
// Service Registry (re-export)
// ================================

/**
 * Re-exports ServiceRegistry functionality
 * ServiceRegistry has been integrated into ServiceManager, and initialization is in separate file
 */
export { registerCoreServices } from './service-initialization';
