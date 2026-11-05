// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** Diagnostic-only instrumentation for one task-owned installed Chrome download. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import type { BrowserContext, CDPSession, Page, Worker } from '@playwright/test';
import { COMPACT_FIXTURE_URL } from './install-preparation.ts';
import { readExactDownloadFile } from './download-memory.ts';

declare const chrome: {
  runtime: {
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: {
      addListener(
        listener: (message: unknown, sender: { id?: string; tab?: { id?: number } }) => void
      ): void;
      removeListener(
        listener: (message: unknown, sender: { id?: string; tab?: { id?: number } }) => void
      ): void;
    };
  };
  downloads: {
    download(options: unknown): Promise<number>;
    search(query: { id: number }): Promise<
      Array<{
        id: number;
        url: string;
        finalUrl?: string;
        filename: string;
        state: string;
        mime?: string;
        byExtensionId?: string;
        byExtensionName?: string;
      }>
    >;
  };
  storage: { local: { get(key: string): Promise<Record<string, unknown>> } };
  tabs: { query(query: { url: string }): Promise<Array<{ id?: number; url?: string }>> };
};

const TRACKING_KEY = 'xeg.download-tracking.v1';
const MAX_EVENTS = 4;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const CONTENT_KEY = '__xegFilenameCorrelation482V1';

// These CDP functions are static. The marker and fixture URL cross as structured arguments.
const CONTENT_INSTALL_FUNCTION = `function(config) {
  if (Object.prototype.hasOwnProperty.call(globalThis, '__xegFilenameCorrelation482V1')) {
    return { installed: false, reason: 'preexisting' };
  }
  if (typeof config?.marker !== 'string' || config?.maxEvents !== 4 || typeof config?.expectedUrl !== 'string') {
    return { installed: false, reason: 'invalid-config' };
  }
  globalThis.__xegFilenameCorrelation482V1 = {
    marker: config.marker, expectedUrl: config.expectedUrl, maxEvents: config.maxEvents, events: []
  };
  return { installed: true };
}`;
const CONTENT_LOGPOINT_CONDITION = `(() => {
  const state = globalThis.__xegFilenameCorrelation482V1;
  if (!state ||
      (media?.downloadSource?.url ?? media?.originalUrl ?? media?.url) !== state.expectedUrl ||
      typeof media?.id !== 'string' || !media.id || typeof filename !== 'string' || !filename) return false;
  if (state.events.length < state.maxEvents) state.events.push({
    id: media.id.slice(0, 128), type: media.type, url: String(media.url).slice(0, 256),
    originalUrl: media.originalUrl?.slice(0, 256),
    downloadSource: media.downloadSource ? {
      url: media.downloadSource.url.slice(0, 256), quality: media.downloadSource.quality,
      provenance: media.downloadSource.provenance
    } : undefined,
    filename: media.filename?.slice(0, 256), attachmentOrdinal: media.attachmentOrdinal,
    attachmentSourceKey: media.attachmentSourceKey?.slice(0, 128),
    tweetUsername: media.tweetUsername?.slice(0, 128), tweetId: media.tweetId?.slice(0, 128),
    quotedUsername: media.quotedUsername?.slice(0, 128),
    quotedTweetId: media.quotedTweetId?.slice(0, 128), sourceLocation: media.sourceLocation,
    generatedFilename: filename.slice(0, 256)
  });
  return false;
})()`;
const CONTENT_CAPTURE_FUNCTION = `function(marker) {
  const state = globalThis.__xegFilenameCorrelation482V1;
  return state?.marker === marker ? { matched: true, events: state.events } : { matched: false, events: [] };
}`;
const CONTENT_REMOVE_FUNCTION = `function(marker) {
  const state = globalThis.__xegFilenameCorrelation482V1;
  if (!state) return { matched: false, existed: false, removed: true };
  if (state.marker !== marker) return { matched: false, existed: true, removed: false };
  const removed = delete globalThis.__xegFilenameCorrelation482V1;
  return { matched: true, existed: true,
    removed: removed && !Object.prototype.hasOwnProperty.call(globalThis, '__xegFilenameCorrelation482V1') };
}`;

type WorkerTrace = {
  marker: string;
  requests: Array<{
    requestId?: string | undefined;
    filename?: string | undefined;
    url: string;
    senderTabId?: number | undefined;
    mode?: string | undefined;
  }>;
  native: Array<{
    url: string;
    filename?: string;
    saveAs?: boolean;
    downloadId?: number;
    error?: string;
  }>;
  overflow: boolean;
  wrapperIntact: boolean;
  selectedApi: 'browser' | 'chrome';
};

type CleanupOutcome = {
  contentGlobal: 'not-installed' | 'absent' | 'removed' | 'foreign-preserved' | 'failed';
  workerListener: 'not-installed' | 'removed' | 'failed';
  nativeWrapper: 'not-installed' | 'restored' | 'failed';
  breakpoint: 'not-installed' | 'removed' | 'failed';
  debuggerSession: 'not-attached' | 'detached' | 'failed';
};
type FailureStage =
  | 'setup'
  | 'action'
  | 'page-identity'
  | 'content-capture'
  | 'content-cleanup'
  | 'worker-capture'
  | 'identity-correlation'
  | 'file-inspection'
  | 'name-comparison'
  | 'retention'
  | 'worker-cleanup'
  | 'breakpoint-cleanup'
  | 'debugger-cleanup'
  | 'receipt-write';

type SourceLocation = { lineNumber: number; expectedSourceSha256: string };

/** Find the sole executable line immediately after filename generation in this function. */
export function resolveFilenameCaptureLine(source: string): SourceLocation {
  const lines = source.split(/\r?\n/);
  const matches: number[] = [];
  let inside = false;
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (/^\s*(?:async\s+)?function downloadSingleFile\(/.test(lines[index] ?? '')) {
      inside = true;
    } else if (inside && /^\s*(?:async\s+)?function \w+\(/.test(lines[index] ?? '')) {
      inside = false;
    }
    if (
      inside &&
      /^\s*const filename = generateMediaFilename\(media, \{ nowMs: Date\.now\(\) \}\);\s*$/.test(
        lines[index] ?? ''
      )
    ) {
      assert(
        /^\s*if \(options\.blob\)/.test(lines[index + 1] ?? ''),
        'Filename capture must execute immediately after generation'
      );
      matches.push(index + 1);
    }
  }
  assert.equal(matches.length, 1, 'Expected one unminified downloadSingleFile filename site');
  return { lineNumber: matches[0]!, expectedSourceSha256: sha256(Buffer.from(source)) };
}

export function verifyFilenameCorrelation(input: {
  requests: WorkerTrace['requests'];
  native: WorkerTrace['native'];
  tracking: Record<string, unknown>;
  expectedUrl: string;
  extensionId: string;
  expectedOwnerTabId: number;
  nativeItem: { id: number; url: string; byExtensionId?: string };
}): { requestId: string; downloadId: number; ownerTabId: number; urlHash: string } {
  const requests = input.requests.filter((item) => item.url === input.expectedUrl);
  const native = input.native.filter((item) => item.url === input.expectedUrl);
  assert.equal(requests.length, 1, 'Expected one observed direct DOWNLOAD_REQUEST');
  assert.equal(native.length, 1, 'Expected one observed native download call');
  const request = requests[0]!;
  const call = native[0]!;
  assert.equal(request.mode, 'direct', 'Observed request was not a direct download');
  assert(
    typeof request.requestId === 'string' && request.requestId.length > 0,
    'Observed request has no request ID'
  );
  assert(Number.isSafeInteger(request.senderTabId), 'Observed request has no owner tab ID');
  assert.equal(
    request.senderTabId,
    input.expectedOwnerTabId,
    'Observed request came from a different tab'
  );
  assert(Number.isSafeInteger(call.downloadId), 'Native call returned no download ID');
  assert.equal(input.nativeItem.id, call.downloadId, 'Native item ID differs from observed call');
  assert.equal(input.nativeItem.byExtensionId, input.extensionId, 'Native initiator differs');
  assert.equal(input.nativeItem.url, input.expectedUrl, 'Native item URL differs');
  const record = input.tracking[request.requestId];
  assert(
    record && typeof record === 'object' && !Array.isArray(record),
    'Request tracking record missing'
  );
  const tracked = record as Record<string, unknown>;
  const urlHash = sha256(Buffer.from(input.expectedUrl));
  assert.equal(tracked.route, 'direct', 'Tracked route differs');
  assert.equal(tracked.downloadId, call.downloadId, 'Tracked native ID differs');
  assert.equal(tracked.ownerTabId, request.senderTabId, 'Tracked owner differs');
  assert.equal(tracked.urlHash, urlHash, 'Tracked URL hash differs');
  return {
    requestId: request.requestId,
    downloadId: call.downloadId!,
    ownerTabId: request.senderTabId!,
    urlHash,
  };
}

/** Name comparison is independent of ownership; divergence remains an observation. */
export function compareObservedFilenames(input: {
  generated: unknown;
  requested: unknown;
  nativeOption: unknown;
  finalBasename: unknown;
}): {
  generatedEqualsRequest: boolean;
  requestEqualsNativeOption: boolean;
  nativeOptionEqualsFinal: boolean;
} {
  for (const [label, value] of Object.entries(input)) {
    assert(typeof value === 'string' && value.length > 0, `${label} filename missing`);
  }
  return {
    generatedEqualsRequest: input.generated === input.requested,
    requestEqualsNativeOption: input.requested === input.nativeOption,
    nativeOptionEqualsFinal: input.nativeOption === input.finalBasename,
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
function bounded(value: unknown, limit = 256): string | undefined {
  return typeof value === 'string' ? value.slice(0, limit) : undefined;
}
const SAFE_MESSAGES = new Set([
  'Observed request has no filename',
  'Native option has no filename',
  'Observed request came from a different tab',
  'Native initiator differs',
  'Native item URL differs',
  'Tracked native ID differs',
  'Tracked owner differs',
  'Tracked URL hash differs',
  'Expected one selected MediaInfo logpoint hit',
  'Expected one observed direct DOWNLOAD_REQUEST',
  'Expected one observed native download call',
  'Native saved bytes differ',
  'Native file escaped owned downloads directory',
  'Native file exceeded inspection bound',
  'Native file is not a regular file',
  'Worker observer identity or event bound failed',
  'Native method restoration identity failed',
  'Executed content script differs from installed artifact',
  'Filename logpoint did not bind to executed script',
  'Target fixture tab identity is ambiguous',
  'Target document changed during diagnostic action',
  'Target page navigated during diagnostic action',
]);
function safeError(
  error: unknown,
  stage: FailureStage
): { stage: FailureStage; name: string; message?: string } {
  const name =
    error instanceof Error && /^(?:AssertionError|Error|TypeError|TimeoutError)$/.test(error.name)
      ? error.name
      : 'Error';
  const firstLine = error instanceof Error ? error.message.split(/\r?\n/u, 1)[0] : undefined;
  const message =
    error instanceof Error
      ? firstLine && SAFE_MESSAGES.has(firstLine)
        ? firstLine
        : error.name === 'AssertionError' &&
            error.message.startsWith('Expected values to be strictly equal:')
          ? 'Strict equality assertion failed'
          : error.name === 'AssertionError' && error.message.endsWith(' saved bytes differ')
            ? 'Saved bytes differ'
            : undefined
      : undefined;
  return { stage, name, ...(message ? { message } : {}) };
}
function assertOwnedFixtureUrl(url: string): void {
  assert.equal(
    url,
    'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=orig',
    'Diagnostic source must be the exact owned B1 fixture'
  );
}
async function waitFor<T>(get: () => T | undefined, label: string): Promise<T> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = get();
    if (result !== undefined) {
      return result;
    }
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`${label} was not observed`);
}
async function waitForAsync<T>(get: () => Promise<T | undefined>, label: string): Promise<T> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await get();
    if (result !== undefined) {
      return result;
    }
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`${label} was not observed`);
}
function recordFromRemote(
  result: { exceptionDetails?: unknown; result?: { value?: unknown } },
  label: string
): unknown {
  assert(!result.exceptionDetails, `${label} failed in content realm`);
  return result.result?.value;
}

async function installWorkerObserver(
  worker: Worker,
  marker: string,
  expectedUrl: string,
  extensionId: string
): Promise<void> {
  await worker.evaluate(
    ({ marker: key, expectedUrl: target, extensionId: owner }) => {
      type Request = {
        type?: string;
        payload?: { url?: string; filename?: string; requestId?: string; mode?: string };
      };
      type Call = { url?: string; filename?: string; saveAs?: boolean };
      const store = globalThis as typeof globalThis & Record<string, unknown>;
      const browserApi = (globalThis as typeof globalThis & { browser?: typeof chrome }).browser;
      const api = browserApi ?? chrome;
      if (store[key]) {
        throw new Error('Filename observer already installed');
      }
      const requests: WorkerTrace['requests'] = [];
      const native: WorkerTrace['native'] = [];
      const state = {
        marker: key,
        requests,
        native,
        overflow: false,
        original: api.downloads.download,
        wrapper: null as typeof chrome.downloads.download | null,
        listener: null as
          | ((message: unknown, sender: { id?: string; tab?: { id?: number } }) => void)
          | null,
      };
      const clip = (value: unknown, limit = 256): string | undefined =>
        typeof value === 'string' ? value.slice(0, limit) : undefined;
      state.listener = (message, sender) => {
        const item = message as Request | null;
        if (
          sender.id !== owner ||
          item?.type !== 'DOWNLOAD_REQUEST' ||
          item.payload?.url !== target
        ) {
          return;
        }
        if (requests.length === 4) {
          state.overflow = true;
          return;
        }
        requests.push({
          url: target,
          requestId: clip(item.payload.requestId, 128),
          filename: clip(item.payload.filename),
          mode: clip(item.payload.mode, 32),
          senderTabId: sender.tab?.id,
        });
      };
      state.wrapper = function (this: unknown, ...args: unknown[]): Promise<number> {
        const options = args[0] as Call | undefined;
        const observed = options?.url === target;
        const entry = observed
          ? ({
              url: target,
              filename: clip(options.filename),
              saveAs: options.saveAs,
            } as WorkerTrace['native'][number])
          : null;
        if (entry) {
          if (native.length === 4) {
            state.overflow = true;
          } else {
            native.push(entry);
          }
        }
        // Return the original promise unchanged; the observer must never retry or rename.
        const result = Reflect.apply(state.original, this, args) as Promise<number>;
        if (entry) {
          void Promise.resolve(result).then(
            (id) => {
              entry.downloadId = id;
            },
            () => {
              entry.error = 'native-rejected';
            }
          );
        }
        return result;
      };
      store[key] = state;
      try {
        api.runtime.onMessage.addListener(state.listener);
        api.downloads.download = state.wrapper;
      } catch (error) {
        api.runtime.onMessage.removeListener(state.listener);
        if (api.downloads.download === state.wrapper) {
          api.downloads.download = state.original;
        }
        delete store[key];
        throw error;
      }
    },
    { marker, expectedUrl, extensionId }
  );
}

async function readWorkerObserver(worker: Worker, marker: string): Promise<WorkerTrace> {
  return worker.evaluate((key) => {
    const state = (globalThis as typeof globalThis & Record<string, unknown>)[key] as
      | {
          marker: string;
          requests: WorkerTrace['requests'];
          native: WorkerTrace['native'];
          overflow: boolean;
          wrapper: typeof chrome.downloads.download;
          original: typeof chrome.downloads.download;
        }
      | undefined;
    if (!state) {
      throw new Error('Filename observer missing after worker restart');
    }
    const browserApi = (globalThis as typeof globalThis & { browser?: typeof chrome }).browser;
    const api = browserApi ?? chrome;
    return {
      marker: state.marker,
      requests: structuredClone(state.requests),
      native: structuredClone(state.native),
      overflow: state.overflow,
      wrapperIntact: api.downloads.download === state.wrapper,
      selectedApi: browserApi ? 'browser' : 'chrome',
    };
  }, marker);
}

async function disposeWorkerObserver(
  worker: Worker,
  marker: string
): Promise<{ listenerRemoved: boolean; wrapperRestored: boolean }> {
  return worker.evaluate((key) => {
    const store = globalThis as typeof globalThis & Record<string, unknown>;
    const state = store[key] as
      | {
          original: typeof chrome.downloads.download;
          wrapper: typeof chrome.downloads.download;
          listener: (message: unknown, sender: { id?: string; tab?: { id?: number } }) => void;
        }
      | undefined;
    if (!state) {
      throw new Error('Filename observer lost on worker restart');
    }
    const browserApi = (globalThis as typeof globalThis & { browser?: typeof chrome }).browser;
    const api = browserApi ?? chrome;
    let listenerRemoved = false;
    let wrapperRestored = false;
    try {
      api.runtime.onMessage.removeListener(state.listener);
      listenerRemoved = true;
    } catch {
      // A separate method restoration is still required.
    }
    if (api.downloads.download === state.wrapper) {
      try {
        api.downloads.download = state.original;
        wrapperRestored = api.downloads.download === state.original;
      } catch {
        // Report the failed identity check to the caller.
      }
    }
    if (listenerRemoved && wrapperRestored) {
      delete store[key];
    }
    return { listenerRemoved, wrapperRestored };
  }, marker);
}

export async function withFilenameCorrelation<T>(options: {
  context: BrowserContext;
  page: Page;
  extensionPage: Page;
  extensionId: string;
  root: string;
  output: string;
  downloads: string;
  expectedUrl: string;
  expectedBytes: Uint8Array;
  action: () => Promise<T>;
  label?: 'xeg-alone' | 'passive' | 'passive-undefined' | 'active-suggestion';
}): Promise<T> {
  const {
    context,
    page,
    extensionPage,
    extensionId,
    root,
    output,
    downloads,
    expectedUrl,
    expectedBytes,
    action,
  } = options;
  const receipt: Record<string, unknown> = {
    status: 'incomplete',
    diagnosticOnly: true,
    contentKey: CONTENT_KEY,
    label: options.label ?? 'xeg-alone',
    expectedUrl,
    expectedBytes: expectedBytes.length,
    expectedSha256: sha256(expectedBytes),
    source: null,
    selectedMedia: null,
    generatedFilename: null,
    request: null,
    nativeCall: null,
    tracked: null,
    nativeItem: null,
    savedFile: null,
    actionOutcome: { status: 'not-run' },
    observationComplete: false,
    cleanupOutcome: {
      contentGlobal: 'not-installed',
      workerListener: 'not-installed',
      nativeWrapper: 'not-installed',
      breakpoint: 'not-installed',
      debuggerSession: 'not-attached',
    } satisfies CleanupOutcome,
    errors: [],
  };
  const cleanup = receipt.cleanupOutcome as CleanupOutcome;
  const errors: Error[] = [];
  const stageErrors: Array<ReturnType<typeof safeError>> = [];
  const addError = (stage: FailureStage, error: unknown): void => {
    errors.push(error instanceof Error ? error : new Error(String(error)));
    stageErrors.push(safeError(error, stage));
  };
  let result!: T;
  let cdp: CDPSession | undefined;
  let worker: Worker | undefined;
  let workerInstalled = false;
  let breakpointId: string | undefined;
  let contentRealmId: number | undefined;
  let contentInstallAttempted = false;
  let contentOwned = false;
  let targetTabId: number | undefined;
  let targetPageUrl: string | undefined;
  let targetTimeOrigin: number | undefined;
  let nativeSavedPath: string | undefined;
  let actionStarted = false;
  let selectedVerified = false;
  let identityVerified = false;
  let fileVerified = false;
  const marker = `__xegFilenameCorrelation_${randomUUID()}`;
  try {
    assertOwnedFixtureUrl(expectedUrl);
    assert.equal(page.context(), context, 'Target page is outside the installed context');
    assert.equal(
      extensionPage.context(),
      context,
      'Extension page is outside the installed context'
    );
    targetPageUrl = page.url();
    assert(
      targetPageUrl.startsWith(`${COMPACT_FIXTURE_URL}?compact=`),
      'Target page is not the owned compact fixture'
    );
    const targetIds = await extensionPage.evaluate(async (url) => {
      const tabs = await chrome.tabs.query({ url: 'https://x.com/*' });
      return tabs.filter((tab) => tab.url === url).map((tab) => tab.id);
    }, targetPageUrl);
    assert.equal(targetIds.length, 1, 'Target fixture tab identity is ambiguous');
    assert(Number.isSafeInteger(targetIds[0]), 'Target fixture tab has no ID');
    targetTabId = targetIds[0]!;
    targetTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    receipt.target = { tabId: targetTabId, fixturePath: new URL(targetPageUrl).pathname };
    assert(
      expectedBytes.length > 0 && expectedBytes.length <= MAX_FILE_BYTES,
      'Expected fixture body is outside diagnostic bound'
    );
    const source = await readFile(resolve(root, 'dist-extension/content.js'), 'utf8');
    const location = resolveFilenameCaptureLine(source);
    receipt.source = {
      url: `chrome-extension://${extensionId}/content.js`,
      artifactSha256: location.expectedSourceSha256,
      executedSha256: null,
      line: location.lineNumber + 1,
    };
    cdp = await context.newCDPSession(page);
    cleanup.debuggerSession = 'failed';
    const scripts: Array<{ scriptId: string; url: string }> = [];
    const realms: Array<{
      id: number;
      origin: string;
      auxData?: { frameId?: string; isDefault?: boolean };
    }> = [];
    cdp.on('Debugger.scriptParsed', (event: { scriptId: string; url: string }) => {
      if (
        event.url === `chrome-extension://${extensionId}/content.js` &&
        scripts.length < MAX_EVENTS
      ) {
        scripts.push(event);
      }
    });
    cdp.on(
      'Runtime.executionContextCreated',
      (event: {
        context: {
          id: number;
          origin: string;
          auxData?: { frameId?: string; isDefault?: boolean };
        };
      }) => {
        if (realms.length < 64) {
          realms.push(event.context);
        }
      }
    );
    const { frameTree } = await cdp.send('Page.getFrameTree');
    await cdp.send('Runtime.enable');
    await cdp.send('Debugger.enable');
    const script = await waitFor(() => scripts[0], 'Installed content script');
    assert.equal(scripts.length, 1, 'Installed content script identity is ambiguous');
    const executed = await cdp.send('Debugger.getScriptSource', { scriptId: script.scriptId });
    const executedSha256 = sha256(Buffer.from(executed.scriptSource));
    (receipt.source as Record<string, unknown>).executedSha256 = executedSha256;
    assert.equal(
      executedSha256,
      location.expectedSourceSha256,
      'Executed content script differs from installed artifact'
    );
    const realm = await waitFor(() => {
      const matches = realms.filter(
        (item) =>
          (item.origin === `chrome-extension://${extensionId}` ||
            item.origin === `chrome-extension://${extensionId}/`) &&
          item.auxData?.frameId === frameTree.frame.id &&
          item.auxData.isDefault === false
      );
      assert(matches.length <= 1, 'Installed content realm is ambiguous');
      return matches[0];
    }, 'Installed content realm');
    contentRealmId = realm.id;
    cleanup.contentGlobal = 'failed';
    contentInstallAttempted = true;
    const installed = await cdp.send('Runtime.callFunctionOn', {
      executionContextId: contentRealmId,
      functionDeclaration: CONTENT_INSTALL_FUNCTION,
      arguments: [{ value: { marker, expectedUrl, maxEvents: MAX_EVENTS } }],
      returnByValue: true,
    });
    const installState = recordFromRemote(installed, 'Content observer install') as {
      installed?: boolean;
      reason?: string;
    };
    if (installState?.reason === 'preexisting') {
      cleanup.contentGlobal = 'foreign-preserved';
    }
    assert.equal(installState?.installed, true, 'Content observer slot was unavailable');
    contentOwned = true;
    const breakpoint = await cdp.send('Debugger.setBreakpointByUrl', {
      url: script.url,
      lineNumber: location.lineNumber,
      condition: CONTENT_LOGPOINT_CONDITION,
    });
    breakpointId = breakpoint.breakpointId;
    cleanup.breakpoint = 'failed';
    assert(
      breakpoint.locations?.some(
        (item: { scriptId: string; lineNumber: number }) =>
          item.scriptId === script.scriptId && item.lineNumber === location.lineNumber
      ),
      'Filename logpoint did not bind to executed script'
    );
    const wake = await extensionPage.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'NOT_A_REAL_MESSAGE' })
    );
    assert(
      wake && typeof wake === 'object' && !Array.isArray(wake),
      'Background wake response missing'
    );
    const wakeReply = wake as { success?: unknown; error?: unknown };
    assert.equal(wakeReply.success, false, 'Background wake response unexpectedly succeeded');
    assert.equal(wakeReply.error, 'Unknown message type', 'Background wake response changed');
    const workers = await waitFor(() => {
      const matching = context
        .serviceWorkers()
        .filter((item) => item.url() === `chrome-extension://${extensionId}/background.js`);
      assert(matching.length <= 1, 'Installed background worker identity is ambiguous');
      return matching.length === 1 ? matching : undefined;
    }, 'Installed background worker');
    assert.equal(workers.length, 1, 'Expected one exact installed background worker');
    worker = workers[0]!;
    workerInstalled = true;
    cleanup.workerListener = 'failed';
    cleanup.nativeWrapper = 'failed';
    await installWorkerObserver(worker, marker, expectedUrl, extensionId);
    actionStarted = true;
    result = await action();
    receipt.actionOutcome = { status: 'passed' };
  } catch (error) {
    addError(actionStarted ? 'action' : 'setup', error);
    if (actionStarted) {
      receipt.actionOutcome = { status: 'failed', error: safeError(error, 'action') };
    }
  } finally {
    // A failed product assertion can coexist with complete diagnostic observation.
    let pageIdentityVerified = false;
    if (actionStarted && targetPageUrl !== undefined && targetTimeOrigin !== undefined) {
      try {
        assert.equal(page.url(), targetPageUrl, 'Target page navigated during diagnostic action');
        assert.equal(
          await page.evaluate(() => performance.timeOrigin),
          targetTimeOrigin,
          'Target document changed during diagnostic action'
        );
        pageIdentityVerified = true;
      } catch (error) {
        addError('page-identity', error);
      }
    }
    if (cdp && contentRealmId !== undefined) {
      if (actionStarted && breakpointId && contentOwned) {
        try {
          const capture = await cdp.send('Runtime.callFunctionOn', {
            executionContextId: contentRealmId,
            functionDeclaration: CONTENT_CAPTURE_FUNCTION,
            arguments: [{ value: marker }],
            returnByValue: true,
          });
          const captured = recordFromRemote(capture, 'Filename logpoint') as {
            matched?: boolean;
            events?: unknown;
          };
          assert.equal(captured?.matched, true, 'Content observer marker changed');
          const selected = captured.events;
          assert(
            Array.isArray(selected) && selected.length === 1,
            'Expected one selected MediaInfo logpoint hit'
          );
          const item = selected[0] as Record<string, unknown>;
          receipt.selectedMedia = Object.fromEntries(
            Object.entries(item).filter(([key]) => key !== 'generatedFilename')
          );
          receipt.generatedFilename = bounded(item.generatedFilename);
          assert(
            typeof receipt.generatedFilename === 'string' && receipt.generatedFilename.length > 0,
            'Generated filename missing'
          );
          selectedVerified = true;
        } catch (error) {
          addError('content-capture', error);
        }
      }
      if (contentInstallAttempted) {
        try {
          const removed = await cdp.send('Runtime.callFunctionOn', {
            executionContextId: contentRealmId,
            functionDeclaration: CONTENT_REMOVE_FUNCTION,
            arguments: [{ value: marker }],
            returnByValue: true,
          });
          const state = recordFromRemote(removed, 'Content observer cleanup') as {
            matched?: boolean;
            existed?: boolean;
            removed?: boolean;
          };
          if (state?.existed && !state.matched) {
            cleanup.contentGlobal = 'foreign-preserved';
            assert.equal(contentOwned, false, 'Content observer marker changed before cleanup');
          } else {
            assert(state?.removed === true, 'Content observer global removal failed');
            cleanup.contentGlobal = state.existed ? 'removed' : 'absent';
          }
        } catch (error) {
          if (cleanup.contentGlobal !== 'foreign-preserved') {
            cleanup.contentGlobal = 'failed';
          }
          addError('content-cleanup', error);
        }
      }
    }
    let trace: WorkerTrace | undefined;
    if (worker && workerInstalled) {
      try {
        trace = await readWorkerObserver(worker, marker);
        receipt.request = trace.requests;
        receipt.nativeCall = trace.native;
        receipt.workerApi = trace.selectedApi;
        assert(
          trace.wrapperIntact && !trace.overflow,
          'Worker observer identity or event bound failed'
        );
      } catch (error) {
        addError('worker-capture', error);
        trace = undefined;
      }
    }
    if (trace && targetTabId !== undefined) {
      const nativeId = trace.native.length === 1 ? trace.native[0]?.downloadId : undefined;
      if (Number.isSafeInteger(nativeId)) {
        try {
          const observed = await extensionPage.evaluate(
            (id) => chrome.downloads.search({ id }),
            nativeId!
          );
          assert.equal(observed.length, 1, 'Observed native ID has no unique DownloadItem');
          const item = observed[0]!;
          nativeSavedPath = item.filename;
          receipt.nativeItem = {
            id: item.id,
            byExtensionId: item.byExtensionId,
            byExtensionName: item.byExtensionName,
            basename: basename(item.filename),
            state: item.state,
            url: item.url,
            finalUrl: item.finalUrl,
            mime: item.mime,
          };
          const requestId = trace.requests.length === 1 ? trace.requests[0]?.requestId : undefined;
          assert(
            typeof requestId === 'string' && requestId.length > 0,
            'Observed request has no request ID'
          );
          const record = await waitForAsync(async () => {
            const matching = await extensionPage.evaluate(
              async ({ key, id }) => {
                const stored = await chrome.storage.local.get(key);
                const rows = stored[key];
                if (!rows || typeof rows !== 'object' || Array.isArray(rows)) {
                  return null;
                }
                return (rows as Record<string, unknown>)[id] ?? null;
              },
              { key: TRACKING_KEY, id: requestId }
            );
            if (!matching || typeof matching !== 'object' || Array.isArray(matching)) {
              return undefined;
            }
            const row = matching as Record<string, unknown>;
            return typeof row.downloadId === 'number' &&
              typeof row.ownerTabId === 'number' &&
              typeof row.urlHash === 'string'
              ? row
              : undefined;
          }, 'Persisted direct download binding');
          receipt.tracked = verifyFilenameCorrelation({
            requests: trace.requests,
            native: trace.native,
            tracking: { [requestId]: record },
            expectedUrl,
            extensionId,
            expectedOwnerTabId: targetTabId,
            nativeItem: item,
          });
          identityVerified = true;
        } catch (error) {
          addError('identity-correlation', error);
        }
      } else {
        addError('identity-correlation', new Error('Observed native call returned no ID'));
      }
    }
    if (identityVerified && receipt.nativeItem && trace && nativeSavedPath) {
      try {
        const nativeItem = receipt.nativeItem as { state: string; id: number };
        assert.equal(nativeItem.state, 'complete', 'Observed native download was not complete');
        const savedPath = nativeSavedPath;
        assert(isAbsolute(savedPath), 'Native file path is not absolute');
        const ownedRoot = await realpath(downloads);
        const ownedFile = await realpath(savedPath);
        const inside = relative(ownedRoot, ownedFile);
        assert(
          inside &&
            inside !== '..' &&
            !inside.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) &&
            !isAbsolute(inside),
          'Native file escaped owned downloads directory'
        );
        const { bytes } = await readExactDownloadFile(savedPath, expectedBytes.length);
        const size = bytes.length;
        receipt.savedFile = {
          basename: basename(savedPath),
          size,
          sha256: sha256(bytes),
          matchesExpectedBytes: Buffer.from(bytes).equals(Buffer.from(expectedBytes)),
        };
        fileVerified = true;
        const retainedName = `filename-correlation-${options.label ?? 'xeg-alone'}-${nativeItem.id}.bin`;
        try {
          const retainedFile = resolve(output, retainedName);
          await writeFile(retainedFile, bytes, { flag: 'wx' });
          const retained = await readExactDownloadFile(retainedFile, bytes.length);
          assert(
            sha256(retained.bytes) === sha256(bytes),
            'Retained native file differs from inspected file'
          );
          receipt.savedFile = {
            ...(receipt.savedFile as Record<string, unknown>),
            retainedFile: retainedName,
          };
        } catch (error) {
          addError('retention', error);
        }
      } catch (error) {
        addError('file-inspection', error);
      }
    }
    let namesVerified = false;
    if (identityVerified && trace && receipt.nativeItem) {
      try {
        receipt.nameComparison = compareObservedFilenames({
          generated: receipt.generatedFilename,
          requested: trace.requests[0]?.filename,
          nativeOption: trace.native[0]?.filename,
          finalBasename: (receipt.nativeItem as { basename: string }).basename,
        });
        namesVerified = true;
      } catch (error) {
        addError('name-comparison', error);
      }
    }
    if (worker && workerInstalled) {
      try {
        const restored = await disposeWorkerObserver(worker, marker);
        cleanup.workerListener = restored.listenerRemoved ? 'removed' : 'failed';
        cleanup.nativeWrapper = restored.wrapperRestored ? 'restored' : 'failed';
        assert(
          restored.listenerRemoved && restored.wrapperRestored,
          'Worker observer restoration failed'
        );
      } catch (error) {
        cleanup.workerListener = 'failed';
        cleanup.nativeWrapper = 'failed';
        addError('worker-cleanup', error);
      }
    }
    if (cdp) {
      if (breakpointId) {
        try {
          await cdp.send('Debugger.removeBreakpoint', { breakpointId });
          cleanup.breakpoint = 'removed';
        } catch (error) {
          cleanup.breakpoint = 'failed';
          addError('breakpoint-cleanup', error);
        }
      }
      try {
        await cdp.detach();
        cleanup.debuggerSession = 'detached';
      } catch (error) {
        cleanup.debuggerSession = 'failed';
        addError('debugger-cleanup', error);
      }
    }
    receipt.observationComplete =
      pageIdentityVerified && selectedVerified && identityVerified && fileVerified && namesVerified;
    receipt.cleanupComplete =
      ['absent', 'removed', 'not-installed'].includes(cleanup.contentGlobal) &&
      ['removed', 'not-installed'].includes(cleanup.workerListener) &&
      ['restored', 'not-installed'].includes(cleanup.nativeWrapper) &&
      ['removed', 'not-installed'].includes(cleanup.breakpoint) &&
      ['detached', 'not-attached'].includes(cleanup.debuggerSession);
    receipt.status = receipt.observationComplete ? 'captured' : 'incomplete';
    receipt.errors = stageErrors;
    try {
      await writeFile(
        resolve(output, `filename-correlation-${options.label ?? 'xeg-alone'}.json`),
        `${JSON.stringify(receipt, null, 2)}\n`
      );
    } catch (error) {
      addError('receipt-write', error);
    }
  }
  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Filename diagnostic or cleanup failed');
  }
  return result;
}
