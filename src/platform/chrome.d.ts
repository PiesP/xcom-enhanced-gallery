// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Chrome extension global type declarations.
 *
 * Provides type safety for chrome.* APIs used in MV3 extension mode.
 */

// biome-ignore lint/complexity/noUselessEmptyExport: needed to make this a module for global augmentation
export {};

declare global {
  // eslint-disable-next-line no-var
  var chrome: ChromeRuntime;
}

// ── Type exports for use in platform adapters ────────────────────────────────

export interface ChromeRuntime {
  readonly id?: string;
  runtime: ChromeRuntimeCore;
  storage: ChromeStorageModule;
  alarms: ChromeAlarmsModule;
  downloads: ChromeDownloadsModule;
  notifications: ChromeNotificationsModule;
}

export interface ChromeRuntimeCore {
  id?: string;
  lastError?: { message: string };
  onMessage: ChromeEvent<
    (message: unknown, sender: unknown, sendResponse: ChromeSendResponse) => void
  >;
  onInstalled: ChromeEvent<(details: ChromeInstalledDetails) => void>;
  sendMessage(
    extensionId: string | undefined,
    message: unknown,
    ...rest: unknown[]
  ): Promise<unknown>;
  sendMessage(message: unknown, ...rest: unknown[]): Promise<unknown>;
}

export interface ChromeInstalledDetails {
  reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
  previousVersion?: string;
  id?: string;
}

export type ChromeSendResponse = (response?: unknown) => void;

export interface ChromeStorageModule {
  local: ChromeStorageArea;
}

export interface ChromeStorageArea {
  get(keys: string | string[] | null, ...rest: unknown[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>, ...rest: unknown[]): Promise<void>;
  remove(keys: string | string[], ...rest: unknown[]): Promise<void>;
  getKeys(...rest: unknown[]): Promise<string[]>;
}

export interface ChromeDownloadsModule {
  download(options: ChromeDownloadOptions): Promise<number>;
  onChanged: ChromeEvent<(delta: ChromeDownloadDelta) => void>;
}

export interface ChromeDownloadOptions {
  url: string;
  filename?: string;
  saveAs?: boolean;
  headers?: Array<{ name: string; value: string }>;
  method?: 'GET' | 'POST';
  body?: string;
}

export interface ChromeDownloadDelta {
  id: number;
  url?:
    | string
    | {
        previous: string;
        current: string;
      };
  filename?:
    | string
    | {
        previous: string;
        current: string;
      };
  state?:
    | string
    | {
        previous: string;
        current: string;
      };
  error?:
    | string
    | {
        previous: string;
        current: string;
      };
}

export interface ChromeNotificationsModule {
  create(id: string, options: ChromeNotificationOptions, callback?: () => void): Promise<string>;
}

export interface ChromeNotificationOptions {
  type: 'basic';
  iconUrl?: string;
  title: string;
  message: string;
  priority?: number;
}

export interface ChromeAlarmsModule {
  create(name: string, alarmInfo: ChromeAlarmCreateInfo): void;
  clear(name: string): Promise<boolean>;
  onAlarm: ChromeEvent<(alarm: ChromeAlarm) => void>;
}

export interface ChromeAlarmCreateInfo {
  delayInMinutes?: number;
  periodInMinutes?: number;
}

export interface ChromeAlarm {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

export interface ChromeEvent<T> {
  addListener(callback: T): void;
  removeListener(callback: T): void;
}
