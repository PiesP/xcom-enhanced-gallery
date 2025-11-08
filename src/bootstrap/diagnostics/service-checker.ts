/**
 * @fileoverview Service Availability Checker
 * @description Phase 347: Service availability check logic separation
 * @module bootstrap/diagnostics/service-checker
 */

import type { ServiceAvailabilityInfo } from './types';

type AvailabilityFormatter = (available: boolean) => string;

const gmScope = globalThis as Record<string, unknown>;

function makeBinaryMessage(label: string): AvailabilityFormatter {
  return available => (available ? `${label} detected` : `${label} unavailable`);
}

const gmApiAvailable = (api: 'GM_download' | 'GM_setValue'): boolean =>
  typeof gmScope[api] === 'function';

const notificationUnavailableMessage = 'Notification provider unavailable';

export async function checkHttpService(): Promise<ServiceAvailabilityInfo> {
  const available = typeof fetch === 'function';
  return {
    name: 'HttpRequestService',
    available,
    message: makeBinaryMessage('Native fetch API')(available),
  };
}

export async function checkNotificationService(): Promise<ServiceAvailabilityInfo> {
  try {
    const { NotificationService } = await import('../../shared/services');
    const notificationService = NotificationService.getInstance();
    const provider = await notificationService.getNotificationProvider();
    return {
      name: 'NotificationService',
      available: provider.available,
      message: provider.available
        ? `Notification provider: ${provider.provider}`
        : notificationUnavailableMessage,
    };
  } catch {
    return {
      name: 'NotificationService',
      available: false,
      message: notificationUnavailableMessage,
    };
  }
}

export async function checkDownloadService(): Promise<ServiceAvailabilityInfo> {
  const available = gmApiAvailable('GM_download');
  return {
    name: 'DownloadService',
    available,
    message: makeBinaryMessage('GM_download')(available),
  };
}

export async function checkPersistentStorage(): Promise<ServiceAvailabilityInfo> {
  const available = gmApiAvailable('GM_setValue');
  return {
    name: 'PersistentStorage',
    available,
    message: makeBinaryMessage('GM_setValue')(available),
  };
}

const serviceChecks: Array<{
  name: ServiceAvailabilityInfo['name'];
  run: () => Promise<ServiceAvailabilityInfo>;
}> = [
  { name: 'HttpRequestService', run: checkHttpService },
  { name: 'NotificationService', run: checkNotificationService },
  { name: 'DownloadService', run: checkDownloadService },
  { name: 'PersistentStorage', run: checkPersistentStorage },
];

export async function checkAllServices(): Promise<ServiceAvailabilityInfo[]> {
  const results = await Promise.all(
    serviceChecks.map(async service => {
      try {
        return await service.run();
      } catch {
        return {
          name: service.name,
          available: false,
          message: 'Unable to determine availability',
        } satisfies ServiceAvailabilityInfo;
      }
    })
  );

  return results;
}
