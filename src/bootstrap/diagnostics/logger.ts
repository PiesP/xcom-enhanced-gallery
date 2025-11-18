/**
 * @fileoverview Bootstrap diagnostics logging helpers
 */

import { createScopedLogger } from '@shared/logging';
import type { Logger } from '@shared/logging';
import type { BootstrapResult, DiagnosticsEnvironmentInfo } from './types';

type DiagnosticsLogLevel = 'debug' | 'info' | 'warn' | 'error';

const SERVICE_STATUS_ICON = Object.freeze({
  available: '✅',
  unavailable: '⚠️',
});

const SUMMARY_ICON = Object.freeze({
  success: '✅',
  failure: '❌',
});

const WARNING_ICON = '⚠️';
const ERROR_ICON = '❌';

let scopedDiagnosticsLogger: Logger | null = null;

const getDiagnosticsLogger = (): Logger => {
  if (!scopedDiagnosticsLogger) {
    scopedDiagnosticsLogger = createScopedLogger('BootstrapDiagnostics');
  }

  return scopedDiagnosticsLogger;
};

const formatServiceStatus = (service: BootstrapResult['services'][number]): string => {
  const icon = service.available ? SERVICE_STATUS_ICON.available : SERVICE_STATUS_ICON.unavailable;
  return `${icon} ${service.name}: ${service.message}`;
};

const summarizeServices = (
  result: BootstrapResult
): Readonly<{ available: number; total: number }> => {
  const total = result.services.length;
  const available = result.services.reduce(
    (count, service) => (service.available ? count + 1 : count),
    0
  );

  return Object.freeze({ available, total });
};

const summaryHeading = (result: BootstrapResult): string => {
  const statusIcon = result.success ? SUMMARY_ICON.success : SUMMARY_ICON.failure;
  const metrics = summarizeServices(result);
  return `${statusIcon} Bootstrap summary • ${result.environment} • Services ${metrics.available}/${metrics.total}`;
};

const logCollection = (
  logger: Logger,
  entries: readonly string[],
  level: DiagnosticsLogLevel,
  prefix: string
): void => {
  if (!entries.length) {
    return;
  }

  for (const entry of entries) {
    logger[level](`${prefix} ${entry}`);
  }
};

const formatGMApiList = (apis: readonly string[]): string =>
  apis.length ? apis.join(', ') : 'none';

type EnvironmentLogEntry = {
  level: DiagnosticsLogLevel;
  matches: (env: DiagnosticsEnvironmentInfo) => boolean;
  message: (env: DiagnosticsEnvironmentInfo) => string;
};

const environmentLogEntries: readonly EnvironmentLogEntry[] = [
  {
    level: 'debug',
    matches: env => env.isUserscriptEnvironment,
    message: env =>
      `Tampermonkey environment detected • GM APIs: ${formatGMApiList(env.availableGMAPIs)}`,
  },
  {
    level: 'debug',
    matches: env => env.isTestEnvironment,
    message: () => 'Test environment detected • using mock implementations',
  },
  {
    level: 'debug',
    matches: env => env.isBrowserExtension,
    message: () => 'Browser extension environment detected',
  },
  {
    level: 'warn',
    matches: env => env.isBrowserConsole,
    message: () => 'Plain browser console environment detected',
  },
];

type DiagnosticsLoggerApi = Readonly<{
  getLogger: () => Logger;
  logSummary: (result: BootstrapResult) => void;
  logEnvironment: (environment: DiagnosticsEnvironmentInfo) => void;
}>;

const createDiagnosticsLogger = (): DiagnosticsLoggerApi => {
  const getLogger = getDiagnosticsLogger;

  const logSummary = (result: BootstrapResult): void => {
    const logger = getLogger();
    logger.info(summaryHeading(result));

    for (const service of result.services) {
      logger.debug(formatServiceStatus(service));
    }

    logCollection(logger, result.warnings, 'warn', WARNING_ICON);
    logCollection(logger, result.errors, 'error', ERROR_ICON);
  };

  const logEnvironment = (environment: DiagnosticsEnvironmentInfo): void => {
    const handler = environmentLogEntries.find(entry => entry.matches(environment));
    const logger = getLogger();

    if (!handler) {
      logger.debug(`Environment detected: ${environment.environment}`);
      return;
    }

    logger[handler.level](handler.message(environment));
  };

  return Object.freeze({
    getLogger,
    logSummary,
    logEnvironment,
  });
};

export const diagnosticsLogger = createDiagnosticsLogger();

export function logBootstrapSummary(result: BootstrapResult): void {
  diagnosticsLogger.logSummary(result);
}

export function logEnvironmentInfo(environment: DiagnosticsEnvironmentInfo): void {
  diagnosticsLogger.logEnvironment(environment);
}
