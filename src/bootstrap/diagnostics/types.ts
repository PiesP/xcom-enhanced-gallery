/**
 * @fileoverview Bootstrap Diagnostics Types
 * @description Phase 347.1: Type separation to resolve circular dependencies
 * @module bootstrap/diagnostics/types
 */

export type DiagnosticsMessage = string;
export type DiagnosticsMessages = DiagnosticsMessage[];
export type DiagnosticsTimestamp = string;
export type KnownBootstrapServiceName =
  | 'HttpRequestService'
  | 'NotificationService'
  | 'DownloadService'
  | 'PersistentStorage';

/**
 * Service availability information - Phase 314-5
 */
export type ServiceAvailabilityInfo<Name extends string = string> = Readonly<{
  name: Name;
  available: boolean;
  message: string;
}>;

/**
 * Bootstrap result summary - Phase 314-5
 */
export type BootstrapResult = {
  success: boolean;
  environment: string;
  timestamp: DiagnosticsTimestamp;
  services: ServiceAvailabilityInfo[];
  warnings: DiagnosticsMessages;
  errors: DiagnosticsMessages;
};

export type BootstrapResultOverrides = Partial<BootstrapResult>;

export type ServiceCheckRunner<Name extends string = string> = () => Promise<
  ServiceAvailabilityInfo<Name>
>;

export type DiagnosticsEnvironmentInfo = Readonly<{
  environment: string;
  isUserscriptEnvironment: boolean;
  isTestEnvironment: boolean;
  isBrowserExtension: boolean;
  isBrowserConsole: boolean;
  availableGMAPIs: readonly string[];
}>;
