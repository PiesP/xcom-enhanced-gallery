/**
 * @fileoverview Service availability scanning utilities
 */

import { NotificationService } from '@shared/services';
import type { ServiceAvailabilityInfo } from './types';

type GMApiName = 'GM_download' | 'GM_setValue';

type ServiceCheckRunner = () => Promise<ServiceAvailabilityInfo>;

type ServicePipelineEntry = Readonly<{
  name: ServiceAvailabilityInfo['name'];
  run: ServiceCheckRunner;
}>;

const notificationUnavailableMessage = 'Notification provider unavailable';

const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

const hasGMApi = (api: GMApiName): boolean =>
  isFunction((globalThis as Record<string, unknown>)[api]);

const createBinaryMessage = (label: string, available: boolean): string =>
  available ? `${label} detected` : `${label} unavailable`;

const normalizeFailureMessage = (reason: unknown): string => {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  if (typeof reason === 'string' && reason.trim().length > 0) {
    return reason;
  }

  return 'Unable to determine availability';
};

export async function checkHttpService(): Promise<ServiceAvailabilityInfo> {
  const available = typeof fetch === 'function';
  return {
    name: 'HttpRequestService',
    available,
    message: createBinaryMessage('Native fetch API', available),
  } satisfies ServiceAvailabilityInfo;
}

export async function checkNotificationService(): Promise<ServiceAvailabilityInfo> {
  try {
    const notificationService = NotificationService.getInstance();
    const provider = await notificationService.getNotificationProvider();

    if (provider.available) {
      return {
        name: 'NotificationService',
        available: true,
        message: `Notification provider: ${provider.provider}`,
      } satisfies ServiceAvailabilityInfo;
    }

    return {
      name: 'NotificationService',
      available: false,
      message: notificationUnavailableMessage,
    } satisfies ServiceAvailabilityInfo;
  } catch (error) {
    return {
      name: 'NotificationService',
      available: false,
      message: normalizeFailureMessage(error),
    } satisfies ServiceAvailabilityInfo;
  }
}

export async function checkDownloadService(): Promise<ServiceAvailabilityInfo> {
  const available = hasGMApi('GM_download');
  return {
    name: 'DownloadService',
    available,
    message: createBinaryMessage('GM_download', available),
  } satisfies ServiceAvailabilityInfo;
}

export async function checkPersistentStorage(): Promise<ServiceAvailabilityInfo> {
  const available = hasGMApi('GM_setValue');
  return {
    name: 'PersistentStorage',
    available,
    message: createBinaryMessage('GM_setValue', available),
  } satisfies ServiceAvailabilityInfo;
}

const SERVICE_PIPELINE: ServicePipelineEntry[] = [
  { name: 'HttpRequestService', run: checkHttpService },
  { name: 'NotificationService', run: checkNotificationService },
  { name: 'DownloadService', run: checkDownloadService },
  { name: 'PersistentStorage', run: checkPersistentStorage },
];

export async function checkAllServices(): Promise<ServiceAvailabilityInfo[]> {
  const outcomes = await Promise.allSettled(SERVICE_PIPELINE.map(entry => entry.run()));

  return outcomes.map((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      return outcome.value;
    }

    const fallbackName = SERVICE_PIPELINE[index]?.name ?? 'UnknownService';

    return {
      name: fallbackName,
      available: false,
      message: normalizeFailureMessage(outcome.reason),
    } satisfies ServiceAvailabilityInfo;
  });
}
