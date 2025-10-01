/**
 * @fileoverview Settings snapshot helper (Solid-only)
 * @description Collects Solid settings state for Stage D verification tests.
 */

import { registerSettingsManager } from '@shared/container/service-accessors';
import { bridgeResetServices } from '@shared/container/service-bridge';
import type { ISettingsService } from '@shared/container/AppContainer';
import { LanguageService } from '@shared/services/LanguageService';
import { renderSolidSettingsPanel } from './renderSolidSettingsPanel';

interface WaitForOptions {
  readonly timeoutMs?: number;
  readonly intervalMs?: number;
}

async function waitFor<T>(
  callback: () => T | Promise<T>,
  { timeoutMs = 2000, intervalMs = 16 }: WaitForOptions = {}
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('waitFor timed out without resolving the condition');
}

interface SettingsSnapshot {
  readonly isOpen: boolean;
  readonly labels: {
    readonly theme: string;
    readonly language: string;
    readonly downloadToast: string;
  };
  readonly values: {
    readonly theme: string;
    readonly language: string;
    readonly showProgressToast: boolean;
  };
}

export interface SettingsSnapshotOptions {
  readonly theme: 'auto' | 'light' | 'dark';
  readonly language: 'auto' | 'ko' | 'en' | 'ja';
  readonly showProgressToast: boolean;
}

export type SettingsParitySnapshotOptions = SettingsSnapshotOptions;

const SOLID_TEST_ID = 'solid-settings-parity';

/**
 * Public API — return Solid settings snapshot for verification.
 */
export async function createSolidSettingsSnapshot(
  options: SettingsSnapshotOptions
): Promise<SettingsSnapshot> {
  const restoreServices = registerSettingsServiceStub({
    'download.showProgressToast': options.showProgressToast,
  });

  try {
    return await captureSolidSnapshot(options);
  } finally {
    restoreServices();
  }
}

async function captureSolidSnapshot(options: SettingsSnapshotOptions): Promise<SettingsSnapshot> {
  const host = document.createElement('div');
  document.body.appendChild(host);

  const panelInstance = renderSolidSettingsPanel({
    container: host,
    defaultOpen: true,
    position: 'toolbar-below',
    testId: SOLID_TEST_ID,
    onClose: () => {
      /* noop for parity capture */
    },
  });

  try {
    const panel = await waitFor(() => {
      const node = host.querySelector(`[data-testid="${SOLID_TEST_ID}"]`);
      if (!node) {
        throw new Error('Solid settings panel not ready');
      }
      return node as HTMLElement;
    });

    applySolidSettings(panel, options);

    await waitFor(() => {
      const themeSelect = panel.querySelector(
        '#xeg-solid-settings-theme'
      ) as HTMLSelectElement | null;
      const languageSelect = panel.querySelector(
        '#xeg-solid-settings-language'
      ) as HTMLSelectElement | null;
      const toastToggle = panel.querySelector(
        '#xeg-solid-settings-progress-toast'
      ) as HTMLInputElement | null;
      if (!themeSelect || !languageSelect || !toastToggle) {
        throw new Error('Solid settings controls missing');
      }
      if (themeSelect.value !== options.theme) {
        throw new Error('Solid theme not applied yet');
      }
      if (languageSelect.value !== options.language) {
        throw new Error('Solid language not applied yet');
      }
      if (toastToggle.checked !== options.showProgressToast) {
        throw new Error('Solid toast preference not applied yet');
      }
    });

    const expectedLabels = getExpectedLabels(options.language);

    await waitFor(() => {
      const themeLabel = getLabelText(panel, 'xeg-solid-settings-theme');
      const languageLabel = getLabelText(panel, 'xeg-solid-settings-language');
      const toastLabel = getLabelText(panel, 'xeg-solid-settings-progress-toast');
      if (themeLabel !== expectedLabels.theme) {
        throw new Error('Solid theme label not localized yet');
      }
      if (languageLabel !== expectedLabels.language) {
        throw new Error('Solid language label not localized yet');
      }
      if (toastLabel !== expectedLabels.downloadToast) {
        throw new Error('Solid download toast label not localized yet');
      }
    });

    return extractSolidSnapshot(panel);
  } finally {
    try {
      panelInstance.dispose();
    } catch {
      /* ignore disposal errors */
    }
    host.remove();
  }
}

function applySolidSettings(panel: HTMLElement, options: SettingsSnapshotOptions): void {
  const themeSelect = panel.querySelector('#xeg-solid-settings-theme') as HTMLSelectElement | null;
  const languageSelect = panel.querySelector(
    '#xeg-solid-settings-language'
  ) as HTMLSelectElement | null;
  const toastToggle = panel.querySelector(
    '#xeg-solid-settings-progress-toast'
  ) as HTMLInputElement | null;

  if (!themeSelect || !languageSelect || !toastToggle) {
    throw new Error('Solid settings controls missing for application');
  }

  if (themeSelect.value !== options.theme) {
    themeSelect.value = options.theme;
    dispatchInputEvents(themeSelect);
  }

  if (languageSelect.value !== options.language) {
    languageSelect.value = options.language;
    dispatchInputEvents(languageSelect);
  }

  if (toastToggle.checked !== options.showProgressToast) {
    toastToggle.checked = options.showProgressToast;
    dispatchInputEvents(toastToggle);
  }
}

function extractSolidSnapshot(panel: HTMLElement): SettingsSnapshot {
  const themeLabel = getLabelText(panel, 'xeg-solid-settings-theme');
  const languageLabel = getLabelText(panel, 'xeg-solid-settings-language');
  const toastLabel = getLabelText(panel, 'xeg-solid-settings-progress-toast');

  const themeSelect = panel.querySelector('#xeg-solid-settings-theme') as HTMLSelectElement | null;
  const languageSelect = panel.querySelector(
    '#xeg-solid-settings-language'
  ) as HTMLSelectElement | null;
  const toastToggle = panel.querySelector(
    '#xeg-solid-settings-progress-toast'
  ) as HTMLInputElement | null;

  if (!themeSelect || !languageSelect || !toastToggle) {
    throw new Error('Solid settings controls missing during extraction');
  }

  return {
    isOpen: panel.getAttribute('data-xeg-open') === 'true',
    labels: {
      theme: themeLabel,
      language: languageLabel,
      downloadToast: toastLabel,
    },
    values: {
      theme: themeSelect.value,
      language: languageSelect.value,
      showProgressToast: toastToggle.checked,
    },
  } satisfies SettingsSnapshot;
}

function getLabelText(panel: HTMLElement, controlId: string): string {
  const label = panel.querySelector(`label[for="${controlId}"]`);
  return (label?.textContent ?? '').trim();
}

function getExpectedLabels(language: SettingsSnapshotOptions['language']): {
  readonly theme: string;
  readonly language: string;
  readonly downloadToast: string;
} {
  const service = new LanguageService();
  service.setLanguage(language);
  return {
    theme: service.getString('settings.theme'),
    language: service.getString('settings.language'),
    downloadToast: service.getString('settings.downloadProgressToast'),
  };
}

function dispatchInputEvents(element: HTMLInputElement | HTMLSelectElement): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

class InMemorySettingsService implements ISettingsService {
  private store: Map<string, unknown>;

  constructor(initialValues: Record<string, unknown>) {
    this.store = new Map(Object.entries(initialValues));
  }

  getSettings(): Record<string, unknown> {
    return Object.fromEntries(this.store);
  }

  updateSettings(settings: Record<string, unknown>): void {
    this.store = new Map(Object.entries(settings));
  }

  get<T = unknown>(key: string): T {
    return this.store.get(key) as T;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  cleanup(): void {
    this.store.clear();
  }
}

function registerSettingsServiceStub(initialValues: Record<string, unknown>): () => void {
  bridgeResetServices();
  const settingsService = new InMemorySettingsService(initialValues);
  registerSettingsManager(settingsService);
  return () => {
    settingsService.cleanup();
    bridgeResetServices();
  };
}
