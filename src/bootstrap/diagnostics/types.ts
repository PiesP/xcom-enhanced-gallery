/**
 * @fileoverview Bootstrap Diagnostics Types
 * @description Phase 347.1: Type separation to resolve circular dependencies
 * @module bootstrap/diagnostics/types
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
