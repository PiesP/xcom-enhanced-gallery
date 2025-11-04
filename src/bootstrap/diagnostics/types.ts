/**
 * @fileoverview Bootstrap Diagnostics Types
 * @description Phase 347.1: Circular dependency 해결을 위한 타입 분리
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
