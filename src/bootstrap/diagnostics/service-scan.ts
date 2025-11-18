/**
 * @fileoverview Service availability scanning utilities
 */

import { NotificationService } from '@shared/services';
import type {
  KnownBootstrapServiceName,
  ServiceAvailabilityInfo,
  ServiceCheckRunner,
} from './types';

type ServiceName = KnownBootstrapServiceName;
type GMApiName = 'GM_download' | 'GM_setValue';

type ServiceCheckDefinition<Name extends ServiceName = ServiceName> = Readonly<{
  name: Name;
  run: ServiceCheckRunner<Name>;
}>;

const NOTIFICATION_UNAVAILABLE_MESSAGE = 'Notification provider unavailable';
const userscriptScope = globalThis as Record<string, unknown>;

const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

const hasGMApi = (api: GMApiName): boolean => isFunction(userscriptScope[api]);

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

const createGMServiceCheck = <Name extends ServiceName>(
  serviceName: Name,
  api: GMApiName
): ServiceCheckRunner<Name> => {
  return async () => {
    const available = hasGMApi(api);
    return {
      name: serviceName,
      available,
      message: createBinaryMessage(api, available),
    } satisfies ServiceAvailabilityInfo<Name>;
  };
};

export const checkHttpService: ServiceCheckRunner<'HttpRequestService'> = async () => {
  const available = typeof fetch === 'function';
  return {
    name: 'HttpRequestService',
    available,
    message: createBinaryMessage('Native fetch API', available),
  } satisfies ServiceAvailabilityInfo<'HttpRequestService'>;
};

export const checkNotificationService: ServiceCheckRunner<'NotificationService'> = async () => {
  try {
    const notificationService = NotificationService.getInstance();
    const provider = await notificationService.getNotificationProvider();

    if (provider.available) {
      return {
        name: 'NotificationService',
        available: true,
        message: `Notification provider: ${provider.provider}`,
      } satisfies ServiceAvailabilityInfo<'NotificationService'>;
    }

    return {
      name: 'NotificationService',
      available: false,
      message: NOTIFICATION_UNAVAILABLE_MESSAGE,
    } satisfies ServiceAvailabilityInfo<'NotificationService'>;
  } catch (error) {
    return {
      name: 'NotificationService',
      available: false,
      message: normalizeFailureMessage(error),
    } satisfies ServiceAvailabilityInfo<'NotificationService'>;
  }
};

export const checkDownloadService: ServiceCheckRunner<'DownloadService'> = createGMServiceCheck(
  'DownloadService',
  'GM_download'
);

export const checkPersistentStorage: ServiceCheckRunner<'PersistentStorage'> = createGMServiceCheck(
  'PersistentStorage',
  'GM_setValue'
);
const SERVICE_PIPELINE: readonly ServiceCheckDefinition[] = Object.freeze([
  { name: 'HttpRequestService', run: checkHttpService },
  { name: 'NotificationService', run: checkNotificationService },
  { name: 'DownloadService', run: checkDownloadService },
  { name: 'PersistentStorage', run: checkPersistentStorage },
]);

export async function checkAllServices(): Promise<ServiceAvailabilityInfo[]> {
  return Promise.all(SERVICE_PIPELINE.map(definition => executeServiceCheck(definition)));
}

const executeServiceCheck = async <Name extends ServiceName>(
  definition: ServiceCheckDefinition<Name>
): Promise<ServiceAvailabilityInfo<Name>> => {
  try {
    return await definition.run();
  } catch (error) {
    return {
      name: definition.name,
      available: false,
      message: normalizeFailureMessage(error),
    } satisfies ServiceAvailabilityInfo<Name>;
  }
};
