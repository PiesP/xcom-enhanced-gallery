// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Consolidated platform adapter singletons.
 *
 * Provides lazy singleton adapter factories for all platform abstractions
 * (storage, download, HTTP request, notification) that dispatch between
 * MV3 extension and userscript (GM) implementations.
 *
 * Previously split across adapter-factory.ts + 4 wrapper files, consolidated
 * here to eliminate over-engineering.
 */
import { getUserscript } from '@shared/external/userscript/adapter';
import { IS_MV3 } from './detect';
import { GMHttpRequestAdapter } from './gm-http-request-adapter';
import { GMNotificationAdapter } from './gm-notification-adapter';
import { GMStorageAdapter } from './gm-storage-adapter';
import { MV3DownloadAdapter } from './mv3-download-adapters';
import { MV3HttpRequestAdapter } from './mv3-http-request-adapters';
import { MV3NotificationAdapter } from './mv3-notification-adapters';
import { MV3StorageAdapter } from './mv3-storage-adapters';
import type {
  DownloadAdapter,
  HttpRequestAdapter,
  NotificationAdapter,
  StorageAdapter,
} from './types';

/**
 * Create a lazy singleton adapter that dispatches between MV3 and userscript.
 * Memoizes the instance on first call.
 */
function createAdapter<T>(mv3Factory: () => T, gmFactory: () => T): () => T {
  let instance: T | null = null;
  return () => {
    if (!instance) {
      instance = IS_MV3 ? mv3Factory() : gmFactory();
    }
    return instance;
  };
}

/**
 * Returns the singleton storage adapter for the current platform.
 * - MV3 extension: chrome.storage.local
 * - Userscript: GM_getValue/GM_setValue
 */
export const getStorageAdapter: () => StorageAdapter = createAdapter(
  () => new MV3StorageAdapter(),
  () => new GMStorageAdapter()
);

/**
 * Returns the singleton download adapter for the current platform.
 * - MV3 extension: MV3DownloadAdapter (chrome.downloads via background SW)
 * - Userscript: GM_download directly
 */
export const getDownloadAdapter = createAdapter<DownloadAdapter>(
  () => new MV3DownloadAdapter(),
  () => {
    const api = getUserscript();
    return {
      download: (url: string, filename: string) => api.download(url, filename),
      downloadBlob: (blob: Blob, filename: string) => api.downloadBlob(blob, filename),
      needsBlobFallback: () => false,
    };
  }
);

/**
 * Returns the singleton HTTP request adapter for the current platform.
 * - MV3 extension: fetch-based
 * - Userscript: GM_xmlhttpRequest
 */
export const getHttpRequestAdapter: () => HttpRequestAdapter = createAdapter(
  () => new MV3HttpRequestAdapter(),
  () => new GMHttpRequestAdapter()
);

/**
 * Returns the singleton notification adapter for the current platform.
 * - MV3 extension: chrome.notifications
 * - Userscript: GM_notification
 */
export const getNotificationAdapter: () => NotificationAdapter = createAdapter(
  () => new MV3NotificationAdapter(),
  () => new GMNotificationAdapter()
);
