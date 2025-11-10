/**
 * @fileoverview Bootstrap diagnostics collector
 */

import { logger } from '@shared/logging';
import { detectEnvironment } from '@shared/external/userscript';
import { checkAllServices } from './service-scan';
import { logBootstrapSummary, logEnvironmentInfo } from './logger';
import type { BootstrapResult } from './types';

const BROWSER_CONSOLE_WARNING = '⚠️ Plain browser console - limited functionality';

function createEmptySnapshot(): BootstrapResult {
  return {
    success: true,
    environment: 'unknown',
    timestamp: new Date().toISOString(),
    services: [],
    warnings: [],
    errors: [],
  };
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return 'Unknown diagnostics error';
}

export async function getBootstrapDiagnostics(): Promise<BootstrapResult> {
  const snapshot = createEmptySnapshot();

  if (import.meta.env.PROD) {
    return snapshot;
  }

  try {
    const environment = detectEnvironment();
    snapshot.environment = environment.environment;

    logEnvironmentInfo(environment);

    if (environment.isBrowserConsole) {
      snapshot.warnings.push(BROWSER_CONSOLE_WARNING);
    }

    snapshot.services = await checkAllServices();

    logBootstrapSummary(snapshot);
  } catch (error) {
    const message = normalizeError(error);
    snapshot.errors.push(message);
    snapshot.success = false;
    logger.error('[bootstrap] Bootstrap diagnostics error:', error);
  }

  return snapshot;
}
