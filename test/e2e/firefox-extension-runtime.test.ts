// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { createContext, Script } from 'node:vm';
import { By, until } from 'selenium-webdriver';
import * as firefox from 'selenium-webdriver/firefox.js';
import { FIREFOX_EXTENSION_DIR, MOCK_GALLERY_HTML } from './fixtures/artifacts.ts';

const TEST_TIMEOUT_MS = 120_000;
const WAIT_TIMEOUT_MS = 20_000;
const GENERATED_BACKGROUND_PATH = join(FIREFOX_EXTENSION_DIR, 'background.js');
const DOWNLOAD_TRACKING_STORAGE_KEY = 'xeg.download-tracking.v1';

type DownloadState = 'complete' | 'in_progress' | 'interrupted';

type DownloadChangedListener = (delta: {
  id: number;
  state?: DownloadState | { current: DownloadState };
}) => void;

type MessageListener = (
  message: unknown,
  sender: { id: string },
  sendResponse: (response?: unknown) => void
) => boolean | undefined;

type StoredDownloadRecord = {
  cancellationRequested: boolean;
  cancellationRequestedAt?: number;
  downloadId?: number;
};

type GeneratedBackgroundOptions = {
  cancel: (downloadId: number) => Promise<void>;
  download: (options: {
    filename?: string;
    headers?: Array<{ name: string; value: string }>;
    saveAs?: boolean;
    url: string;
  }) => Promise<number>;
  search: (query: { id: number }) => Promise<Array<{ error?: string; id: number; state: DownloadState }>>;
  storage: Map<string, unknown>;
};

type GeneratedBackgroundHarness = {
  cancelCalls: number[];
  emitDownloadChanged: (delta: Parameters<DownloadChangedListener>[0]) => void;
  notificationCalls: Array<{
    id: string;
    options: { iconUrl: string; imageUrl?: string; message: string; title: string; type: string };
  }>;
  sendMessage: (message: unknown) => Promise<unknown>;
};

function copyStorageValue<T>(value: T): T {
  return structuredClone(value);
}

function createGeneratedBackgroundHarness(
  options: GeneratedBackgroundOptions
): GeneratedBackgroundHarness {
  const cancelCalls: number[] = [];
  const downloadChangedListeners = new Set<DownloadChangedListener>();
  const notificationCalls: GeneratedBackgroundHarness['notificationCalls'] = [];
  let messageListener: MessageListener | undefined;

  const browser = {
    runtime: {
      id: 'xcom-enhanced-gallery@piesp.dev',
      onInstalled: { addListener: () => undefined, removeListener: () => undefined },
      onMessage: {
        addListener: (listener: MessageListener) => {
          messageListener = listener;
        },
        removeListener: () => undefined,
      },
      onStartup: { addListener: () => undefined, removeListener: () => undefined },
      onSuspend: { addListener: () => undefined, removeListener: () => undefined },
    },
    downloads: {
      cancel: async (downloadId: number) => {
        cancelCalls.push(downloadId);
        await options.cancel(downloadId);
      },
      download: options.download,
      onChanged: {
        addListener: (listener: DownloadChangedListener) => {
          downloadChangedListeners.add(listener);
        },
        removeListener: (listener: DownloadChangedListener) => {
          downloadChangedListeners.delete(listener);
        },
      },
      search: options.search,
    },
    notifications: {
      create: async (
        id: string,
        notificationOptions: GeneratedBackgroundHarness['notificationCalls'][number]['options']
      ) => {
        notificationCalls.push({ id, options: copyStorageValue(notificationOptions) });
        return id;
      },
    },
    storage: {
      local: {
        get: async (keys: string | string[] | null) => {
          if (keys === null) return Object.fromEntries(options.storage.entries());
          const requested = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(
            requested
              .filter((key) => options.storage.has(key))
              .map((key) => [key, copyStorageValue(options.storage.get(key))])
          );
        },
        remove: async (keys: string | string[]) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) options.storage.delete(key);
        },
        set: async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) {
            options.storage.set(key, copyStorageValue(value));
          }
        },
      },
    },
  };

  const context = createContext({
    Error,
    URL,
    browser,
    clearTimeout,
    console,
    setTimeout,
    structuredClone,
  });
  new Script(readFileSync(GENERATED_BACKGROUND_PATH, 'utf8'), {
    filename: GENERATED_BACKGROUND_PATH,
  }).runInContext(context);
  if (!messageListener) throw new Error('Generated Firefox background did not register onMessage');

  return {
    cancelCalls,
    emitDownloadChanged: (delta) => {
      for (const listener of [...downloadChangedListeners]) listener(delta);
    },
    notificationCalls,
    sendMessage: (message) =>
      new Promise((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) reject(new Error('Generated Firefox background did not respond'));
        }, 5_000);
        const sendResponse = (response?: unknown): void => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(copyStorageValue(response));
        };
        const keepChannelOpen = messageListener?.(
          message,
          { id: 'xcom-enhanced-gallery@piesp.dev' },
          sendResponse
        );
        if (keepChannelOpen !== true && !settled) sendResponse(undefined);
      }),
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
} {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    reject = rejectPromise;
    resolve = resolvePromise;
  });
  return { promise, reject, resolve };
}

function readStoredDownload(
  storage: Map<string, unknown>,
  requestId: string
): StoredDownloadRecord | undefined {
  const records = storage.get(DOWNLOAD_TRACKING_STORAGE_KEY) as
    | Record<string, StoredDownloadRecord>
    | undefined;
  return records?.[requestId];
}

async function waitForCondition(
  condition: () => boolean,
  failureMessage: string
): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (condition()) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error(failureMessage);
}

let driver: firefox.Driver | undefined;
let server: Server | undefined;
let certificateDirectory: string | undefined;
let extensionDirectory: string | undefined;

after(async () => {
  let cleanupError: unknown;
  try {
    if (driver) await driver.quit();
  } catch (error) {
    cleanupError = error;
  }
  try {
    if (server) {
      await new Promise<void>((resolve, reject) =>
        server?.close((error) => (error ? reject(error) : resolve()))
      );
    }
  } catch (error) {
    cleanupError ??= error;
  }
  try {
    if (certificateDirectory) rmSync(certificateDirectory, { recursive: true, force: true });
    if (extensionDirectory) rmSync(extensionDirectory, { recursive: true, force: true });
  } catch (error) {
    cleanupError ??= error;
  }
  if (cleanupError) throw cleanupError;
});

function createRuntimeTestExtension(): string {
  extensionDirectory = mkdtempSync(join(tmpdir(), 'xeg-firefox-extension-'));
  cpSync(FIREFOX_EXTENSION_DIR, extensionDirectory, { recursive: true });
  const manifestPath = join(extensionDirectory, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    content_scripts?: Array<{ js?: string[] }>;
  };
  const contentScript = manifest.content_scripts?.[0];
  if (!contentScript?.js) throw new Error('Firefox manifest has no content script entry');
  contentScript.js.push('runtime-smoke.js');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(extensionDirectory, 'runtime-smoke.js'),
    `browser.runtime.sendMessage({ type: 'NOT_A_REAL_MESSAGE', payload: {} }).then((response) => {
  document.documentElement.setAttribute('data-xeg-firefox-background', JSON.stringify(response));
});\n`
  );
  return extensionDirectory;
}

function createCertificate(): { cert: Buffer; key: Buffer } {
  certificateDirectory = mkdtempSync(join(tmpdir(), 'xeg-firefox-cert-'));
  const certPath = join(certificateDirectory, 'cert.pem');
  const keyPath = join(certificateDirectory, 'key.pem');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      keyPath,
      '-out',
      certPath,
      '-days',
      '1',
      '-subj',
      '/CN=x.com',
      '-addext',
      'subjectAltName=DNS:x.com',
    ],
    { stdio: 'ignore' }
  );
  return { cert: readFileSync(certPath), key: readFileSync(keyPath) };
}

async function startFixtureServer(): Promise<number> {
  const credentials = createCertificate();
  server = createServer(credentials, (_request, response) => {
    const address = server?.address();
    if (!address || typeof address === 'string') {
      response.writeHead(500);
      response.end();
      return;
    }
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'",
    });
    response.end(MOCK_GALLERY_HTML);
  });
  await new Promise<void>((resolve, reject) => {
    server?.once('error', reject);
    server?.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server has no TCP port');
  return address.port;
}

test('generated Firefox background applies one persisted pre-ID cancellation after allocation', async () => {
  const storage = new Map<string, unknown>();
  const allocation = deferred<number>();
  let downloadState: DownloadState = 'in_progress';
  const harness = createGeneratedBackgroundHarness({
    storage,
    download: () => allocation.promise,
    cancel: async () => {
      downloadState = 'interrupted';
    },
    search: async ({ id }) => [
      {
        id,
        state: downloadState,
        ...(downloadState === 'interrupted' ? { error: 'USER_CANCELED' } : {}),
      },
    ],
  });
  const requestId = 'generated-cancel-before-id-resolves';

  const downloadResponse = harness.sendMessage({
    type: 'DOWNLOAD_REQUEST',
    payload: {
      url: 'https://pbs.twimg.com/media/generated-runtime.jpg',
      filename: 'generated-runtime.jpg',
      requestId,
    },
  });
  await waitForCondition(
    () => readStoredDownload(storage, requestId)?.cancellationRequested === false,
    'Generated background did not persist the pending request'
  );

  await assert.doesNotReject(async () => {
    assert.deepEqual(
      await harness.sendMessage({
        type: 'DOWNLOAD_CANCEL_REQUEST',
        payload: { requestId },
      }),
      { success: true }
    );
  });
  const pendingCancellation = readStoredDownload(storage, requestId);
  assert.equal(pendingCancellation?.cancellationRequested, true);
  assert.equal(typeof pendingCancellation?.cancellationRequestedAt, 'number');
  assert.equal(pendingCancellation?.downloadId, undefined);

  allocation.resolve(71);
  const response = (await downloadResponse) as { error?: string; success?: boolean };
  assert.equal(response.success, false);
  assert.match(response.error ?? '', /Download interrupted: USER_CANCELED/);
  assert.deepEqual(harness.cancelCalls, [71]);
  assert.equal(readStoredDownload(storage, requestId), undefined);

  harness.emitDownloadChanged({ id: 71, state: { current: 'interrupted' } });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(harness.cancelCalls, [71]);
  assert.equal(readStoredDownload(storage, requestId), undefined);
});

test('generated Firefox background removes a rejected pre-ID allocation without latent cancellation', async () => {
  const storage = new Map<string, unknown>();
  const firstAllocation = deferred<number>();
  let allocationAttempt = 0;
  const harness = createGeneratedBackgroundHarness({
    storage,
    download: async () => {
      allocationAttempt += 1;
      return allocationAttempt === 1 ? firstAllocation.promise : 72;
    },
    cancel: async () => undefined,
    search: async ({ id }) => [{ id, state: 'complete' }],
  });
  const requestId = 'generated-cancel-before-id-rejects';
  const request = {
    type: 'DOWNLOAD_REQUEST',
    payload: {
      url: 'https://pbs.twimg.com/media/generated-retry.jpg',
      filename: 'generated-retry.jpg',
      requestId,
    },
  };

  const rejectedAllocationResponse = harness.sendMessage(request);
  await waitForCondition(
    () => readStoredDownload(storage, requestId)?.cancellationRequested === false,
    'Generated background did not persist the pending request'
  );
  assert.deepEqual(
    await harness.sendMessage({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: { requestId },
    }),
    { success: true }
  );
  firstAllocation.reject(new Error('download ID unavailable'));

  assert.deepEqual(await rejectedAllocationResponse, {
    success: false,
    error: 'download ID unavailable',
  });
  assert.equal(readStoredDownload(storage, requestId), undefined);
  assert.deepEqual(harness.cancelCalls, []);

  assert.deepEqual(await harness.sendMessage(request), { success: true });
  assert.equal(readStoredDownload(storage, requestId), undefined);
  assert.deepEqual(harness.cancelCalls, []);
});

test('generated Firefox background restores cancellation ownership and ignores late terminal events', async () => {
  const storage = new Map<string, unknown>();
  let firstSearch = true;
  const firstWorker = createGeneratedBackgroundHarness({
    storage,
    download: async () => 88,
    cancel: async () => undefined,
    search: async ({ id }) => {
      if (firstSearch) {
        firstSearch = false;
        throw new Error('download state temporarily unavailable');
      }
      return [{ id, state: 'in_progress' }];
    },
  });
  const requestId = 'generated-restart-cancellation';

  assert.deepEqual(
    await firstWorker.sendMessage({
      type: 'DOWNLOAD_REQUEST',
      payload: {
        url: 'https://pbs.twimg.com/media/generated-restart.jpg',
        filename: 'generated-restart.jpg',
        requestId,
      },
    }),
    {
      success: false,
      error: 'Failed to inspect download 88: download state temporarily unavailable',
      data: { requestId, terminal: false },
    }
  );
  assert.deepEqual(
    await firstWorker.sendMessage({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: { requestId },
    }),
    { success: true }
  );
  const persistedCancellation = readStoredDownload(storage, requestId);
  assert.equal(
    persistedCancellation?.downloadId,
    88,
    'The first worker must persist download ownership'
  );
  assert.equal(persistedCancellation?.cancellationRequested, true);
  assert.equal(typeof persistedCancellation?.cancellationRequestedAt, 'number');

  const siblingRequestId = 'generated-restart-sibling-terminal';
  const persistedRecords = storage.get(DOWNLOAD_TRACKING_STORAGE_KEY) as Record<
    string,
    StoredDownloadRecord
  >;
  storage.set(DOWNLOAD_TRACKING_STORAGE_KEY, {
    ...persistedRecords,
    [siblingRequestId]: {
      downloadId: 89,
      cancellationRequested: true,
      cancellationRequestedAt: Date.now(),
    },
  });

  let emitRestoredTerminal: GeneratedBackgroundHarness['emitDownloadChanged'] | undefined;
  let firstRestoredSearch = true;
  const restartedWorker = createGeneratedBackgroundHarness({
    storage,
    download: async () => {
      throw new Error('restart must not allocate another download');
    },
    cancel: async (downloadId) => {
      emitRestoredTerminal?.({ id: downloadId, state: 'interrupted' });
    },
    search: async ({ id }) => {
      if (firstRestoredSearch) {
        firstRestoredSearch = false;
        emitRestoredTerminal?.({ id: 89, state: 'interrupted' });
        return [{ id, state: 'in_progress' }];
      }
      throw new Error('restored download lookup unavailable');
    },
  });
  emitRestoredTerminal = restartedWorker.emitDownloadChanged;
  await waitForCondition(
    () =>
      readStoredDownload(storage, requestId) === undefined &&
      readStoredDownload(storage, siblingRequestId) === undefined,
    'Restarted generated background did not clean terminal cancellation state'
  );

  assert.deepEqual(restartedWorker.cancelCalls, [88]);
  restartedWorker.emitDownloadChanged({ id: 88, state: 'interrupted' });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(restartedWorker.cancelCalls, [88]);
  assert.equal(readStoredDownload(storage, requestId), undefined);
  assert.equal(readStoredDownload(storage, siblingRequestId), undefined);

  assert.deepEqual(
    await restartedWorker.sendMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        id: 'generated-restart-notification',
        title: 'Download cancelled',
        message: 'The generated Firefox background is still responsive.',
      },
    }),
    { success: true }
  );
  assert.deepEqual(restartedWorker.notificationCalls, [
    {
      id: 'generated-restart-notification',
      options: {
        type: 'basic',
        title: 'Download cancelled',
        message: 'The generated Firefox background is still responsive.',
        iconUrl: 'icons/icon-128x128.png',
      },
    },
  ]);
});

test(
  'installs the Firefox extension and exercises content and background runtimes',
  { timeout: TEST_TIMEOUT_MS },
  async () => {
    const port = await startFixtureServer();
    const options = new firefox.Options()
      .addArguments('-headless')
      .setPreference('network.dns.localDomains', 'x.com');
    options.setAcceptInsecureCerts(true);

    const firefoxDriver = firefox.Driver.createSession(options);
    driver = firefoxDriver;
    const addonId = await firefoxDriver.installAddon(createRuntimeTestExtension(), true);
    assert.equal(addonId, 'xcom-enhanced-gallery@piesp.dev');

    await firefoxDriver.get(`https://x.com:${port}/testuser/status/1234567890123456789`);
    await firefoxDriver.wait(
      async () =>
        (await firefoxDriver.executeScript(
          "return document.documentElement.getAttribute('data-xeg-gallery-ready')"
        )) === 'true',
      WAIT_TIMEOUT_MS,
      'Firefox content script did not initialize the gallery'
    );

    const firstPhoto = await firefoxDriver.findElement(By.css('[data-testid="tweetPhoto"] img'));
    await firstPhoto.click();
    const gallery = await firefoxDriver.wait(
      until.elementLocated(By.css('[data-xeg-gallery-container]')),
      WAIT_TIMEOUT_MS
    );
    assert.equal(await gallery.isDisplayed(), true);

    const backgroundResponse = await firefoxDriver.wait(
      async () => {
        const value = await firefoxDriver.executeScript<string | null>(
          "return document.documentElement.getAttribute('data-xeg-firefox-background')"
        );
        return value ? (JSON.parse(value) as { error?: string; success?: boolean }) : false;
      },
      WAIT_TIMEOUT_MS,
      'Firefox background runtime did not answer the content-script probe'
    );
    assert.deepEqual(backgroundResponse, { success: false, error: 'Unknown message type' });
  }
);
