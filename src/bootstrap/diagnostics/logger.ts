/**
 * @fileoverview Bootstrap diagnostics logging helpers
 */

import { logger } from '@shared/logging';
import type { BootstrapResult } from './types';

type EnvironmentSnapshot = {
  environment: string;
  isUserscriptEnvironment: boolean;
  isTestEnvironment: boolean;
  isBrowserExtension: boolean;
  isBrowserConsole: boolean;
  availableGMAPIs: string[];
};

const SERVICE_STATUS_ICON = Object.freeze({
  available: '✅',
  unavailable: '⚠️',
});

export function logBootstrapSummary(result: BootstrapResult): void {
  const totalServices = result.services.length;
  const availableServices = result.services.reduce(
    (count, service) => (service.available ? count + 1 : count),
    0
  );

  logger.info(
    `[bootstrap] Summary: ${result.environment} | Services: ${availableServices}/${totalServices} | Status: ${
      result.success ? '✅' : '❌'
    }`
  );

  for (const service of result.services) {
    const icon = service.available
      ? SERVICE_STATUS_ICON.available
      : SERVICE_STATUS_ICON.unavailable;

    logger.debug(`[bootstrap] ${icon} ${service.name}: ${service.message}`);
  }

  for (const warning of result.warnings) {
    logger.warn(`[bootstrap] ${warning}`);
  }

  for (const error of result.errors) {
    logger.error(`[bootstrap] ${error}`);
  }
}

export function logEnvironmentInfo(environment: EnvironmentSnapshot): void {
  if (environment.isUserscriptEnvironment) {
    logger.debug(
      `[bootstrap] ✅ Tampermonkey APIs available: ${environment.availableGMAPIs.join(', ')}`
    );
    return;
  }

  if (environment.isTestEnvironment) {
    logger.debug('[bootstrap] 🧪 Test environment - using mock implementations');
    return;
  }

  if (environment.isBrowserExtension) {
    logger.debug('[bootstrap] 🔌 Browser extension environment');
    return;
  }

  if (environment.isBrowserConsole) {
    logger.warn('[bootstrap] ⚠️ Plain browser console environment');
  }
}
