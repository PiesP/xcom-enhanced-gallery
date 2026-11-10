// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createContext, runInContext, type Context } from 'node:vm';
import type { BrowserContext, Page, Worker } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { COMPACT_FIXTURE_URL } from './install-preparation.ts';
import { withFilenameCorrelation } from './filename-correlation.ts';

const url = 'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=orig';
const pageUrl = `${COMPACT_FIXTURE_URL}?compact=evidence`;
const extensionId = 'installed-extension';
const tabId = 42;
const downloadId = 7;
const bytes = Buffer.from([0, 1, 2, 254, 255, 10]);
const requestedName = 'requested.jpg';
const nativeName = 'native.jpg';
const source = `async function downloadSingleFile(media, options = {}) {
  const filename = generateMediaFilename(media, { nowMs: Date.now() });
  if (options.blob) return filename;
}\n`;
const sha256 = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');

type Fixture = Awaited<ReturnType<typeof fixture>>;

function evaluateInRealm<T>(realm: Context, callback: (...args: never[]) => T, arg?: unknown): T {
  // Execute serialized Playwright callbacks in an isolated realm with the fixture APIs.
  (realm as Record<string, unknown>).__testArg = arg;
  try {
    return runInContext(`(${callback.toString()})(globalThis.__testArg)`, realm) as T;
  } finally {
    delete (realm as Record<string, unknown>).__testArg;
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'xeg-filename-evidence-'));
  const output = join(root, 'output');
  const downloads = join(root, 'downloads');
  const savedPath = join(downloads, nativeName);
  await Promise.all([mkdir(join(root, 'dist-extension')), mkdir(output), mkdir(downloads)]);
  await Promise.all([
    writeFile(join(root, 'dist-extension/content.js'), source),
    writeFile(savedPath, bytes),
  ]);

  const listeners = new Set<(message: unknown, sender: unknown) => void>();
  const originalDownload = async (_options?: unknown) => downloadId;
  const workerChrome = {
    runtime: {
      id: extensionId,
      onMessage: {
        addListener: (listener: (message: unknown, sender: unknown) => void) =>
          listeners.add(listener),
        removeListener: (listener: (message: unknown, sender: unknown) => void) =>
          listeners.delete(listener),
      },
    },
    downloads: { download: originalDownload },
  };
  const workerRealm = createContext({ chrome: workerChrome, structuredClone, URL, Date, Promise });
  const extensionRealm = createContext({
    chrome: {
      tabs: { query: async () => [{ id: tabId, url: pageUrl }] },
      runtime: { sendMessage: async () => ({ success: false, error: 'Unknown message type' }) },
      downloads: {
        search: async () => [
          {
            id: downloadId,
            url,
            filename: savedPath,
            state: 'complete',
            byExtensionId: extensionId,
          },
        ],
      },
      storage: {
        local: {
          get: async () => ({
            'xeg.download-tracking.v1': {
              request: {
                route: 'direct',
                downloadId,
                ownerTabId: tabId,
                urlHash: sha256(url),
                requestedFilename: requestedName,
              },
            },
          }),
        },
      },
    },
  });
  const contentRealm = createContext({ URL });
  const cdpSessions: Array<{ detachError?: Error }> = [];
  const worker = {
    url: () => `chrome-extension://${extensionId}/background.js`,
    evaluate: async (callback: (...args: never[]) => unknown, arg?: unknown) =>
      evaluateInRealm(workerRealm, callback, arg),
  } as unknown as Worker;
  const browser = {
    newBrowserCDPSession: async () => ({
      send: async () => ({ product: 'Chrome/1', revision: 'test', protocolVersion: '1.3' }),
      detach: async () => {},
    }),
  };
  const context = {
    newCDPSession: async () => {
      const handlers = new Map<string, (event: unknown) => void>();
      const state: { detachError?: Error } = {};
      cdpSessions.push(state);
      return {
        on: (event: string, handler: (event: unknown) => void) => handlers.set(event, handler),
        send: async (method: string, params?: Record<string, unknown>) => {
          if (method === 'Page.getFrameTree') {
            return { frameTree: { frame: { id: 'frame' } } };
          }
          if (method === 'Runtime.enable') {
            handlers.get('Runtime.executionContextCreated')?.({
              context: {
                id: 1,
                origin: `chrome-extension://${extensionId}`,
                auxData: { frameId: 'frame', isDefault: false },
              },
            });
            return {};
          }
          if (method === 'Debugger.enable') {
            handlers.get('Debugger.scriptParsed')?.({
              scriptId: 'script',
              url: `chrome-extension://${extensionId}/content.js`,
            });
            return {};
          }
          if (method === 'Debugger.getScriptSource') {
            return { scriptSource: source };
          }
          if (method === 'Debugger.setBreakpointByUrl') {
            return {
              breakpointId: 'breakpoint',
              locations: [{ scriptId: 'script', lineNumber: 2 }],
            };
          }
          if (method === 'Debugger.removeBreakpoint') {
            return {};
          }
          if (method === 'Runtime.callFunctionOn') {
            const declaration = params?.functionDeclaration;
            assert.equal(typeof declaration, 'string');
            const arguments_ = params?.arguments as Array<{ value: unknown }>;
            (contentRealm as Record<string, unknown>).__testArg = arguments_[0]?.value;
            try {
              return {
                result: {
                  value: runInContext(`(${declaration})(globalThis.__testArg)`, contentRealm),
                },
              };
            } finally {
              delete (contentRealm as Record<string, unknown>).__testArg;
            }
          }
          throw new Error(`Unexpected CDP method: ${method}`);
        },
        detach: async () => {
          if (state.detachError) {
            throw state.detachError;
          }
        },
      };
    },
    serviceWorkers: () => [worker],
    browser: () => browser,
  } as unknown as BrowserContext;
  const page = {
    context: () => context,
    url: () => pageUrl,
    evaluate: async () => 12345,
  } as unknown as Page;
  const extensionPage = {
    context: () => context,
    evaluate: async (callback: (...args: never[]) => unknown, arg?: unknown) =>
      evaluateInRealm(extensionRealm, callback, arg),
  } as unknown as Page;

  async function observe() {
    const state = Object.entries(contentRealm as Record<string, unknown>).find(([key]) =>
      key.startsWith('__xegFilenameCorrelation482V1')
    )?.[1] as { events: unknown[] } | undefined;
    assert(state, 'Content observer was installed');
    state.events.push({
      id: 'media-1',
      type: 'image',
      url,
      originalUrl: url,
      generatedFilename: requestedName,
    });
    for (const listener of listeners) {
      listener(
        {
          type: 'DOWNLOAD_REQUEST',
          payload: { url, filename: requestedName, requestId: 'request', mode: 'direct' },
        },
        { id: extensionId, tab: { id: tabId } }
      );
    }
    await workerChrome.downloads.download({ url, filename: nativeName } as never);
    await Promise.resolve();
    return 'action-result';
  }
  const options = {
    context,
    page,
    extensionPage,
    extensionId,
    root,
    output,
    downloads,
    expectedUrl: url,
    expectedBytes: bytes,
    action: observe,
  };
  return {
    root,
    output,
    downloads,
    options,
    cdpSessions,
    workerChrome,
    originalDownload,
    listeners,
    retained: join(output, `filename-correlation-xeg-alone-${downloadId}.bin`),
    receipt: join(output, 'filename-correlation-xeg-alone.json'),
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

async function withFixture(run: (item: Fixture) => Promise<void>) {
  const item = await fixture();
  try {
    await run(item);
  } finally {
    await item.dispose();
  }
}

describe('filename correlation retained evidence', () => {
  it('writes inspected bytes and a newline-terminated receipt with complete cleanup', async () => {
    await withFixture(async (item) => {
      expect(await withFilenameCorrelation(item.options)).toBe('action-result');
      expect(await readFile(item.retained)).toEqual(bytes);
      const serialized = await readFile(item.receipt, 'utf8');
      expect(serialized.endsWith('\n')).toBe(true);
      const receipt = JSON.parse(serialized) as Record<string, unknown>;
      expect(receipt).toMatchObject({
        status: 'captured',
        observationComplete: true,
        cleanupComplete: true,
        expectedSha256: sha256(bytes),
        savedFile: {
          size: bytes.length,
          sha256: sha256(bytes),
          matchesExpectedBytes: true,
          retainedFile: 'filename-correlation-xeg-alone-7.bin',
        },
        cleanupOutcome: {
          contentGlobal: 'removed',
          workerListener: 'removed',
          nativeWrapper: 'restored',
          breakpoint: 'removed',
          debuggerSession: 'detached',
        },
        errors: [],
      });
      expect(item.workerChrome.downloads.download).toBe(item.originalDownload);
      expect(item.listeners.size).toBe(0);
      if (process.platform !== 'win32') {
        for (const path of [item.retained, item.receipt]) {
          expect((await lstat(path)).mode & 0o077).toBe(0);
        }
      }
    });
  });

  it.each(['retained', 'receipt'] as const)(
    'preserves an existing %s destination and reports exclusive-create failure',
    async (site) => {
      await withFixture(async (item) => {
        const path = item[site];
        const sentinel = Buffer.from('existing evidence must survive');
        await writeFile(path, sentinel);
        await expect(withFilenameCorrelation(item.options)).rejects.toMatchObject({
          code: 'EEXIST',
        });
        expect(await readFile(path)).toEqual(sentinel);
        if (site === 'receipt') {
          expect(await readFile(item.retained)).toEqual(bytes);
        }
      });
    }
  );

  it.for(['retained', 'receipt'] as const)(
    'does not follow an existing %s destination symlink',
    async (site, { skip }) => {
      await withFixture(async (item) => {
        const target = join(item.root, 'outside.bin');
        const sentinel = Buffer.from('outside target');
        await writeFile(target, sentinel);
        try {
          await symlink(target, item[site]);
        } catch (error) {
          if (process.platform === 'win32' && (error as NodeJS.ErrnoException).code === 'EPERM') {
            skip('Creating file symlinks requires an available Windows capability');
          }
          throw error;
        }
        await expect(withFilenameCorrelation(item.options)).rejects.toMatchObject({
          code: 'EEXIST',
        });
        expect((await lstat(item[site])).isSymbolicLink()).toBe(true);
        expect(await readFile(target)).toEqual(sentinel);
      });
    }
  );

  it('keeps action and cleanup failures in order when receipt creation also fails', async () => {
    await withFixture(async (item) => {
      const sentinel = Buffer.from('older receipt');
      await writeFile(item.receipt, sentinel);
      const actionError = new Error('action failed');
      const cleanupError = new Error('detach failed');
      const options = {
        ...item.options,
        action: async () => {
          await item.options.action();
          item.cdpSessions.at(-1)!.detachError = cleanupError;
          throw actionError;
        },
      };
      try {
        await withFilenameCorrelation(options);
        assert.fail('Expected aggregate failure');
      } catch (error) {
        assert(error instanceof AggregateError);
        expect(error.errors).toHaveLength(3);
        expect(error.errors[0]).toBe(actionError);
        expect(error.errors[1]).toBe(cleanupError);
        expect(error.errors[2]).toMatchObject({ code: 'EEXIST' });
      }
      expect(await readFile(item.receipt)).toEqual(sentinel);
      expect(await readFile(item.retained)).toEqual(bytes);
    });
  });

  it('rejects a stale receipt even when a later observation succeeds', async () => {
    await withFixture(async (item) => {
      expect(await withFilenameCorrelation(item.options)).toBe('action-result');
      const prior = await readFile(item.receipt);
      await rm(item.retained);
      await expect(withFilenameCorrelation(item.options)).rejects.toMatchObject({ code: 'EEXIST' });
      expect(await readFile(item.receipt)).toEqual(prior);
      expect(await readFile(item.retained)).toEqual(bytes);
    });
  });
});
