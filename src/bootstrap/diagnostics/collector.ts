/**
 * @fileoverview Bootstrap diagnostics collector
 */

import { logger } from '@shared/logging';
import { detectEnvironment } from '@shared/external/userscript';
import { checkAllServices } from './service-scan';
import { logBootstrapSummary, logEnvironmentInfo } from './logger';
import type { BootstrapResult, BootstrapResultOverrides } from './types';

const BROWSER_CONSOLE_WARNING = '⚠️ Plain browser console - limited functionality';

type EnvironmentInfo = ReturnType<typeof detectEnvironment>;

type DiagnosticsCollectorDeps = {
  detectEnvironment: typeof detectEnvironment;
  checkAllServices: typeof checkAllServices;
  logEnvironmentInfo: typeof logEnvironmentInfo;
  logBootstrapSummary: typeof logBootstrapSummary;
  now: () => Date;
};

const isProdBuild = (): boolean => import.meta.env.PROD === true;

const defaultCollectorDeps: DiagnosticsCollectorDeps = Object.freeze({
  detectEnvironment,
  checkAllServices,
  logEnvironmentInfo,
  logBootstrapSummary,
  now: () => new Date(),
});

const createSnapshotFactory = (
  deps: DiagnosticsCollectorDeps
): ((overrides?: BootstrapResultOverrides) => BootstrapResult) => {
  return (overrides: BootstrapResultOverrides = {}): BootstrapResult => ({
    success: true,
    environment: 'unknown',
    timestamp: deps.now().toISOString(),
    services: [],
    warnings: [],
    errors: [],
    ...overrides,
  });
};

const browserWarnings = (environment: EnvironmentInfo): string[] =>
  environment.isBrowserConsole ? [BROWSER_CONSOLE_WARNING] : [];

const createFailureSnapshot = (
  createSnapshot: (overrides?: BootstrapResultOverrides) => BootstrapResult,
  error: unknown
): BootstrapResult =>
  createSnapshot({
    success: false,
    errors: [normalizeError(error)],
  });

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || 'Unknown diagnostics error';
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return 'Unknown diagnostics error';
}

export const createDiagnosticsCollector = (overrides: Partial<DiagnosticsCollectorDeps> = {}) => {
  const deps: DiagnosticsCollectorDeps = {
    ...defaultCollectorDeps,
    ...overrides,
  };

  const createSnapshot = createSnapshotFactory(deps);

  const collect = async (): Promise<BootstrapResult> => {
    if (isProdBuild()) {
      return createSnapshot();
    }

    try {
      const environment = deps.detectEnvironment();
      deps.logEnvironmentInfo(environment);

      const snapshot = createSnapshot({
        environment: environment.environment,
        warnings: browserWarnings(environment),
      });

      const services = await deps.checkAllServices();
      const enrichedSnapshot: BootstrapResult = {
        ...snapshot,
        services,
      };

      deps.logBootstrapSummary(enrichedSnapshot);

      return enrichedSnapshot;
    } catch (error) {
      logger.error('[bootstrap] Bootstrap diagnostics error:', error);
      return createFailureSnapshot(createSnapshot, error);
    }
  };

  return Object.freeze({
    collect,
    createSnapshot,
  });
};

const defaultCollector = createDiagnosticsCollector();

export async function getBootstrapDiagnostics(): Promise<BootstrapResult> {
  return defaultCollector.collect();
}

export type DiagnosticsCollector = ReturnType<typeof createDiagnosticsCollector>;
