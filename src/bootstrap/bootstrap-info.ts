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
 */

/**
 * Service availability information - Phase 314-5
 */
export interface ServiceAvailabilityInfo {
  name: string;
  available: boolean;
  message: string;
}

/**
 * Bootstrap result summary - Phase 314-5
 */
export interface BootstrapResult {
  success: boolean;
  environment: string;
  timestamp: string;
  services: ServiceAvailabilityInfo[];
  warnings: string[];
  errors: string[];
}

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
