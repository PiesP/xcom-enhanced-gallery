/**
 * @fileoverview Bootstrap Information & Diagnostics - Phase 314-5, Phase 347
 * @description Service availability check, bootstrap result reporting,
 *              environment-aware initialization strategy
 * @module bootstrap/bootstrap-info
 *
 * Phase 347: Re-exports from diagnostics/ modules
 * - service-checker.ts: Service availability checks
 * - bootstrap-logger.ts: Logging utilities
 * - bootstrap-reporter.ts: Diagnostics aggregation
 *
 * Phase 347.1: Type definitions moved to diagnostics/types.ts to resolve circular dependency
 */

// Phase 347.1: Re-export types from diagnostics/types
export type { ServiceAvailabilityInfo, BootstrapResult } from './diagnostics/types';

// Phase 347: Re-export from diagnostics modules
export {
  checkHttpService,
  checkNotificationService,
  checkDownloadService,
  checkPersistentStorage,
  checkAllServices as checkServiceAvailability,
} from './diagnostics/service-checker';

export { logBootstrapSummary, logEnvironmentInfo } from './diagnostics/bootstrap-logger';

export { getBootstrapDiagnostics } from './diagnostics/bootstrap-reporter';
