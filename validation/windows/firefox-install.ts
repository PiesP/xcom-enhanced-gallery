// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { startExtensionNativeFixtureLoopback } from './extension-native-loopback.ts';
import { startFirefoxNativeProxy } from './firefox-native-proxy.ts';
import {
  firefoxNativeKey,
  prepareFirefoxNativeUiImages,
  runFirefoxNativeUi,
} from './firefox-native-ui.ts';
import { runNativeScrollbarTakeover } from './native-scrollbar-takeover.ts';
import { prepareNativeScrollbarPointer } from './native-pointer.ts';

const EXTENSION_ID = 'xcom-enhanced-gallery@piesp.dev';
const FIXTURE_URL = 'https://x.com/testuser/status/1234567890123456789';
const EXPERIENCE_URL = 'https://x.com/experience/status/4666000000000000002';
const ORIGINAL_URL = 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
const EXPECTED_NAME = 'testuser_1234567890123456789_0.jpg';
const DIAGNOSTIC_NAME = 'firefox-download-diagnostic.html';

export type FirefoxSession = {
  readonly context: string;
  readonly browserName: string;
  readonly browserVersion: string;
  readonly acceptInsecureCerts: boolean;
  readonly pageErrors?: Array<{ level: string; text: string; type: string }>;
  readonly pageLogs?: Array<{ level: string; text: string; type: string }>;
  subscribeLogs?(): Promise<void>;
  on(event: string, listener: (params: Record<string, unknown>) => void | Promise<void>): void;
  off(event: string, listener: (params: Record<string, unknown>) => void | Promise<void>): void;
  command(method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<unknown>;
  evaluateJson(expression: string, timeoutMs?: number): Promise<unknown>;
  navigate(url: string, options?: { wait?: string; timeoutMs?: number }): Promise<void>;
  waitFor(expression: string, description: string, timeoutMs?: number): Promise<void>;
  captureScreenshot(): Promise<Buffer>;
  installExtension(path: string): Promise<string>;
  uninstallExtension(id: string): Promise<void>;
  close(): Promise<void>;
};

export type FirefoxLauncher = {
  launch(options: {
    root: string;
    executablePath: string;
    headless: boolean;
    acceptInsecureCerts?: boolean;
    preferences?: Record<string, string | number | boolean>;
  }): Promise<FirefoxSession>;
  executablePath?: string;
};

type DownloadItem = {
  id: number;
  byExtensionId?: string;
  filename: string;
  state: string;
  url: string;
  finalUrl?: string;
  error?: string;
  bytesReceived?: number;
  totalBytes?: number;
  mime?: string;
};

type NativeTransferRecord = {
  host: string;
  path: string;
  method: string;
  status: number;
  result: string;
  bytes: number;
  sha256: string | null;
};

type FixtureNetworkEvent = {
  event:
    | 'beforeRequestSent'
    | 'provideResponse'
    | 'continueRequest'
    | 'fetchError'
    | 'responseCompleted';
  atMs: number;
  requestId: string;
  url: string;
  context?: string | null | undefined;
  userContext?: string | undefined;
  isBlocked?: boolean | undefined;
  intercepts?: string[] | undefined;
  navigation?: string | null | undefined;
  destination?: string | undefined;
  initiatorType?: string | undefined;
  status?: number | undefined;
  error?: string | undefined;
};

const MAX_NETWORK_EVENTS = 100;
const MAX_NETWORK_FIELD = 300;

function bounded(value: unknown): string | undefined {
  return typeof value === 'string' ? value.slice(0, MAX_NETWORK_FIELD) : undefined;
}

/** Converts only fixture-host BiDi traffic to a bounded path-free receipt row. */
export function fixtureNetworkEvent(
  event: FixtureNetworkEvent['event'],
  params: Record<string, unknown>,
  atMs: number
): FixtureNetworkEvent | null {
  const request = params.request;
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return null;
  }
  const data = request as Record<string, unknown>;
  if (typeof data.url !== 'string' || typeof data.request !== 'string') {
    return null;
  }
  let url: URL;
  try {
    url = new URL(data.url);
  } catch {
    return null;
  }
  if (!['x.com', 'pbs.twimg.com'].includes(url.hostname) || url.protocol !== 'https:') {
    return null;
  }
  const response = params.response;
  const responseData =
    response && typeof response === 'object' && !Array.isArray(response)
      ? (response as Record<string, unknown>)
      : undefined;
  const intercepts = Array.isArray(params.intercepts)
    ? params.intercepts
        .filter((id): id is string => typeof id === 'string')
        .slice(0, 4)
        .map((id) => id.slice(0, MAX_NETWORK_FIELD))
    : undefined;
  return {
    event,
    atMs,
    requestId: data.request.slice(0, MAX_NETWORK_FIELD),
    url: url.href.slice(0, MAX_NETWORK_FIELD),
    context: params.context === null ? null : bounded(params.context),
    userContext: bounded(params.userContext),
    isBlocked: typeof params.isBlocked === 'boolean' ? params.isBlocked : undefined,
    intercepts,
    navigation: params.navigation === null ? null : bounded(params.navigation),
    destination: bounded(data.destination),
    initiatorType: bounded(data.initiatorType),
    status: typeof responseData?.status === 'number' ? responseData.status : undefined,
    error: bounded(params.errorText),
  };
}

export function ownsBlockedIntercept(
  params: Record<string, unknown>,
  intercept: string | undefined
) {
  return (
    params.isBlocked === true &&
    typeof intercept === 'string' &&
    Array.isArray(params.intercepts) &&
    params.intercepts.includes(intercept)
  );
}

export function ownedNativeHistory(items: DownloadItem[], extensionId: string) {
  return items
    .filter(
      (item) =>
        item.byExtensionId === extensionId &&
        (item.url === ORIGINAL_URL || item.finalUrl === ORIGINAL_URL)
    )
    .slice(0, 16)
    .map((item) => ({
      id: item.id,
      state: bounded(item.state),
      error: bounded(item.error),
      url: item.url,
      finalUrl: item.finalUrl,
      basename: basename(item.filename),
      bytesReceived: item.bytesReceived,
      totalBytes: item.totalBytes,
      mime: bounded(item.mime),
    }));
}

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readBounded(handle: FileHandle, maximumBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let length = 0;
  for (;;) {
    const chunk = Buffer.alloc(Math.min(64 * 1024, maximumBytes - length + 1));
    const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
    if (bytesRead === 0) {
      break;
    }
    length += bytesRead;
    assert(length <= maximumBytes, 'Native file exceeded bounded read');
    chunks.push(chunk.subarray(0, bytesRead));
  }
  return Buffer.concat(chunks, length);
}

async function inventory(directory: string, prefix = ''): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      Object.assign(result, await inventory(path, name));
    } else {
      assert(entry.isFile(), `Firefox distribution contains a non-file: ${name}`);
      result[name] = digest(await readFile(path));
    }
  }
  return result;
}

/** Adds a diagnostic document only to a task-owned copy; every production file stays byte-identical. */
export async function prepareFirefoxInstallation(source: string, output: string) {
  const sourceInventory = await inventory(source);
  assert(sourceInventory['manifest.json'], 'Firefox production manifest missing');
  assert(!sourceInventory[DIAGNOSTIC_NAME], 'Diagnostic name already belongs to production');
  const copy = await mkdtemp(join(output, 'firefox-install-copy-'));
  await cp(source, copy, { recursive: true, force: false });
  assert.deepEqual(await inventory(copy), sourceInventory, 'Firefox production copy changed');
  await writeFile(
    join(copy, DIAGNOSTIC_NAME),
    '<!doctype html><html><meta charset="utf-8"><title>Owned Firefox download inspection</title></html>\n',
    { flag: 'wx' }
  );
  const after = await inventory(copy);
  delete after[DIAGNOSTIC_NAME];
  assert.deepEqual(after, sourceInventory, 'Diagnostic preparation changed production files');
  return {
    copy,
    sourceInventory,
    diagnosticSha256: digest(await readFile(join(copy, DIAGNOSTIC_NAME))),
  };
}

function responseBody(value: string, mime: string, request: string, binary = false) {
  return {
    request,
    statusCode: 200,
    headers: [{ name: 'content-type', value: { type: 'string', value: mime } }],
    body: { type: binary ? 'base64' : 'string', value },
  };
}

export function shouldContinueFirefoxOriginal(url: URL) {
  return url.href === ORIGINAL_URL;
}

async function installFixtureIntercept(
  session: FirefoxSession,
  html: string,
  image: Buffer,
  experience?: { html: string; images: Record<string, Buffer> }
) {
  const requests: Array<{ url: string; navigation: boolean }> = [];
  const events: FixtureNetworkEvent[] = [];
  let omittedEvents = 0;
  let completionEventsSubscribed = false;
  let completionEventsSubscriptionError: string | undefined;
  let intercept: string | undefined;
  const record = (event: FixtureNetworkEvent['event'], params: Record<string, unknown>) => {
    const row = fixtureNetworkEvent(event, params, performance.now());
    if (row) {
      if (events.length < MAX_NETWORK_EVENTS) {
        events.push(row);
      } else {
        omittedEvents += 1;
      }
    }
    return row;
  };
  const handler = async (params: Record<string, unknown>) => {
    const row = record('beforeRequestSent', params);
    if (!row) {
      return;
    }
    if (requests.length < MAX_NETWORK_EVENTS) {
      requests.push({ url: row.url, navigation: typeof params.navigation === 'string' });
    }
    if (!ownsBlockedIntercept(params, intercept)) {
      return;
    }
    const request = params.request as Record<string, unknown> | undefined;
    assert(
      request && typeof request.request === 'string' && typeof request.url === 'string',
      'Malformed intercepted request'
    );
    const id = request.request;
    const url = new URL(request.url);
    if (shouldContinueFirefoxOriginal(url)) {
      try {
        await session.command('network.continueRequest', { request: id });
        record('continueRequest', { request });
      } catch (error) {
        record('continueRequest', { request, errorText: errorText(error) });
        throw error;
      }
      return;
    }
    const provide = async (options: Record<string, unknown>) => {
      try {
        await session.command('network.provideResponse', options);
        record('provideResponse', { request, response: { status: options.statusCode } });
      } catch (error) {
        record('provideResponse', { request, errorText: errorText(error) });
        throw error;
      }
    };
    if (experience && url.href === EXPERIENCE_URL && params.navigation) {
      await provide(responseBody(experience.html, 'text/html; charset=utf-8', id));
    } else if (experience && url.hostname === 'pbs.twimg.com' && experience.images[url.pathname]) {
      await provide(
        responseBody(experience.images[url.pathname]!.toString('base64'), 'image/jpeg', id, true)
      );
    } else if (
      url.hostname === 'x.com' &&
      url.pathname === new URL(FIXTURE_URL).pathname &&
      params.navigation
    ) {
      await provide(responseBody(html, 'text/html; charset=utf-8', id));
    } else if (url.hostname === 'pbs.twimg.com' && url.pathname.startsWith('/media/GkE')) {
      await provide(responseBody(image.toString('base64'), 'image/jpeg', id, true));
    } else {
      await provide({
        request: id,
        statusCode: url.hostname === 'x.com' ? 403 : 404,
      });
    }
  };
  const fetchError = (params: Record<string, unknown>) => {
    record('fetchError', params);
  };
  const responseCompleted = (params: Record<string, unknown>) => {
    record('responseCompleted', params);
  };
  session.on('network.beforeRequestSent', handler);
  session.on('network.fetchError', fetchError);
  session.on('network.responseCompleted', responseCompleted);
  try {
    await session.command('session.subscribe', { events: ['network.beforeRequestSent'] });
    try {
      await session.command('session.subscribe', {
        events: ['network.fetchError', 'network.responseCompleted'],
      });
      completionEventsSubscribed = true;
    } catch (error) {
      completionEventsSubscriptionError = errorText(error).slice(0, MAX_NETWORK_FIELD);
    }
    const value = (await session.command('network.addIntercept', {
      phases: ['beforeRequestSent'],
      urlPatterns: [
        { type: 'pattern', protocol: 'https', hostname: 'x.com' },
        { type: 'pattern', protocol: 'https', hostname: 'pbs.twimg.com' },
      ],
    })) as { intercept?: string };
    assert(typeof value.intercept === 'string', 'Firefox omitted fixture intercept ID');
    intercept = value.intercept;
  } catch (error) {
    session.off('network.beforeRequestSent', handler);
    session.off('network.fetchError', fetchError);
    session.off('network.responseCompleted', responseCompleted);
    throw error;
  }
  return {
    requests,
    events,
    get omittedEvents() {
      return omittedEvents;
    },
    get completionEventsSubscribed() {
      return completionEventsSubscribed;
    },
    get completionEventsSubscriptionError() {
      return completionEventsSubscriptionError;
    },
    async stop() {
      session.off('network.beforeRequestSent', handler);
      session.off('network.fetchError', fetchError);
      session.off('network.responseCompleted', responseCompleted);
      await session.command('network.removeIntercept', { intercept });
    },
  };
}

async function click(session: FirefoxSession, selector: string) {
  const point = (await session.evaluateJson(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement)) throw new Error('Missing native click target');
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) throw new Error('Native click target is hidden');
    const x = Math.floor(rect.left + rect.width / 2), y = Math.floor(rect.top + rect.height / 2);
    if (!element.contains(document.elementFromPoint(x, y))) throw new Error('Native click target is obscured');
    return { x, y };
  })()`)) as { x: number; y: number };
  try {
    await session.command('input.performActions', {
      context: session.context,
      actions: [
        {
          type: 'pointer',
          id: 'xeg-firefox-pointer',
          parameters: { pointerType: 'mouse' },
          actions: [
            { type: 'pointerMove', origin: 'viewport', x: point.x, y: point.y },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ],
    });
  } finally {
    await session.command('input.releaseActions', { context: session.context });
  }
}

async function readDownloads(
  session: FirefoxSession,
  diagnosticUrl: string
): Promise<{ items: DownloadItem[]; determiningFilename: string }> {
  const created = (await session.command('browsingContext.create', { type: 'tab' })) as {
    context?: string;
  };
  assert(typeof created.context === 'string', 'Firefox omitted diagnostic tab context');
  try {
    await session.command('browsingContext.navigate', {
      context: created.context,
      url: diagnosticUrl,
      wait: 'complete',
    });
    const value = (await session.command('script.evaluate', {
      awaitPromise: true,
      expression: `Promise.resolve((async () => {
        const api = globalThis.browser?.downloads;
        if (!api) throw new Error('Extension downloads API unavailable');
        return {
          items: await api.search({}),
          determiningFilename: typeof api.onDeterminingFilename?.addListener === 'function' ? 'api-present-unverified' : 'unsupported',
        };
      })()).then(value => JSON.stringify(value))`,
      target: { context: created.context },
    })) as {
      type?: string;
      result?: { type?: string; value?: string };
      exceptionDetails?: { text?: string };
    };
    assert.equal(
      value.type,
      'success',
      `Firefox diagnostic evaluation failed: ${value.exceptionDetails?.text ?? 'unknown'}`
    );
    assert.equal(value.result?.type, 'string', 'Firefox diagnostic returned no JSON');
    return JSON.parse(value.result.value!) as {
      items: DownloadItem[];
      determiningFilename: string;
    };
  } finally {
    await session.command('browsingContext.close', { context: created.context });
  }
}

export function selectOwnedDownload(
  before: DownloadItem[],
  after: DownloadItem[],
  extensionId: string
): DownloadItem {
  const prior = new Set(before.map((item) => item.id));
  const created = after.filter((item) => !prior.has(item.id));
  assert.equal(created.length, 1, 'Expected exactly one new native download ID');
  const item = created[0]!;
  assert.equal(item.byExtensionId, extensionId, 'Native download belongs to another initiator');
  assert.equal(item.state, 'complete', `Native download incomplete: ${item.error ?? item.state}`);
  assert.equal(item.url, ORIGINAL_URL, 'Native source URL differs from selected original');
  assert.equal(item.finalUrl ?? item.url, ORIGINAL_URL, 'Native final URL differs from original');
  return item;
}

export async function readOwnedNativeBytes(
  directory: string,
  filename: string,
  maximumBytes: number
): Promise<{ filename: string; bytes: Buffer }> {
  assert(isAbsolute(filename), 'Native filename is not absolute');
  assert(Number.isSafeInteger(maximumBytes) && maximumBytes >= 0, 'Invalid native read bound');
  const lexical = relative(resolve(directory), resolve(filename));
  assert(
    lexical && !lexical.startsWith('..') && !isAbsolute(lexical),
    'Native filename escaped owned downloads'
  );
  const root = await realpath(directory);
  // Open first, then validate this handle and its current path before reading any bytes.
  const handle = await open(filename, 'r');
  try {
    const opened = await handle.stat();
    assert(opened.isFile(), 'Opened native download is not a file');
    assert(opened.size <= maximumBytes, 'Native file exceeds bounded read');
    const verifyPath = async () => {
      const file = await realpath(filename);
      const inside = relative(root, file);
      assert(
        inside && !inside.startsWith('..') && !isAbsolute(inside),
        'Native file escaped owned downloads'
      );
      const entry = await lstat(filename);
      assert(entry.isFile(), 'Native download is not a regular file');
      assert.equal(entry.dev, opened.dev, 'Native download path device changed');
      assert.equal(entry.ino, opened.ino, 'Native download path identity changed');
      const linked = await stat(file);
      assert.equal(linked.dev, opened.dev, 'Native download device changed after open');
      assert.equal(linked.ino, opened.ino, 'Native download identity changed after open');
      assert.equal(linked.size, opened.size, 'Native download size changed after open');
      assert.equal(linked.mtimeMs, opened.mtimeMs, 'Native download was modified after open');
      assert.equal(linked.ctimeMs, opened.ctimeMs, 'Native download metadata changed after open');
      return file;
    };
    const file = await verifyPath();
    const bytes = await readBounded(handle, maximumBytes);
    assert.equal(bytes.length, opened.size, 'Native file changed while read');
    assert.equal(await verifyPath(), file, 'Native download path changed during read');
    const after = await handle.stat();
    assert.equal(after.size, opened.size, 'Opened native download size changed during read');
    assert.equal(after.mtimeMs, opened.mtimeMs, 'Opened native download was modified during read');
    assert.equal(
      after.ctimeMs,
      opened.ctimeMs,
      'Opened native download metadata changed during read'
    );
    return { filename: file, bytes };
  } finally {
    await handle.close();
  }
}

export async function readOwnedNativeFile(directory: string, filename: string, expected: Buffer) {
  const { filename: file, bytes } = await readOwnedNativeBytes(
    directory,
    filename,
    expected.length
  );
  assert.equal(bytes.length, expected.length, 'Native file size differs from original');
  assert(bytes.equals(expected), 'Native file bytes differ from original');
  return { filename: file, basename: basename(file), bytes: bytes.length, sha256: digest(bytes) };
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export async function validateFirefoxSelectors(root: string) {
  const inputDirectory = join(root, 'validation/windows/inputs');
  const names = await readdir(inputDirectory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  });
  const selectors = names.filter((name) => name.endsWith('.json'));
  assert(selectors.length <= 1, 'Firefox acceptance cannot share focused selectors');
  if (selectors.length === 0) {
    return 'default';
  }
  const name = selectors[0];
  assert(
    name === 'attachment-filenames.json' || name === 'native-browser-ui.json',
    'Firefox acceptance does not implement this selector'
  );
  const scenario = name === 'native-browser-ui.json' ? 'native-browser-ui' : 'attachment-filenames';
  const selector: unknown = JSON.parse(await readFile(join(inputDirectory, name), 'utf8'));
  const scrollbarTakeover =
    scenario === 'native-browser-ui' &&
    typeof selector === 'object' &&
    selector !== null &&
    'scrollbarTakeover' in selector &&
    selector.scrollbarTakeover === true;
  assert.deepEqual(
    selector,
    { scenario, ...(scrollbarTakeover ? { scrollbarTakeover: true } : {}) },
    'Firefox focused selector has unsupported options'
  );
  return scenario;
}

export async function runFirefoxInstallation({
  root,
  output,
  headless = false,
  liveUrls = [],
  firefox,
}: {
  root: string;
  output: string;
  headless?: boolean;
  liveUrls?: unknown;
  firefox: FirefoxLauncher;
}) {
  assert(isAbsolute(root) && isAbsolute(output), 'Firefox root and output must be absolute');
  assert(typeof firefox?.launch === 'function', 'Firefox launcher is required');
  assert(
    typeof firefox.executablePath === 'string' && isAbsolute(firefox.executablePath),
    'Installed Firefox executable path is required'
  );
  assert.deepEqual(liveUrls, [], 'Firefox live original-post acceptance is not implemented');
  const selector = await validateFirefoxSelectors(root);
  const scrollbarTakeover =
    selector === 'native-browser-ui' &&
    JSON.parse(
      await readFile(join(root, 'validation/windows/inputs/native-browser-ui.json'), 'utf8')
    ).scrollbarTakeover === true;
  await mkdir(output, { recursive: true });
  const source = join(root, 'dist-extension-firefox');
  const fixture = await readFile(
    join(root, 'test/e2e/fixtures/installed-gallery-page.html'),
    'utf8'
  );
  const image = await readFile(join(root, 'test/e2e/fixtures/native-original.jpg'));
  const downloads = await mkdtemp(join(root, 'firefox-native-downloads-'));
  const sentinel = join(downloads, 'preexisting-sentinel.txt');
  const sentinelBytes = Buffer.from('preserve the preexisting task-owned sentinel\n');
  await writeFile(sentinel, sentinelBytes, { flag: 'wx' });
  const prepared = await prepareFirefoxInstallation(source, root);
  const uuid = randomUUID();
  const diagnosticUrl = `moz-extension://${uuid}/${DIAGNOSTIC_NAME}`;
  const receipt: Record<string, unknown> = {
    status: 'failed',
    browser: null,
    browserName: null,
    browserVersion: null,
    source: {
      manifestSha256: prepared.sourceInventory['manifest.json'],
      productionFiles: prepared.sourceInventory,
      diagnosticSha256: prepared.diagnosticSha256,
    },
    fixture: {
      url: FIXTURE_URL,
      pageSha256: digest(Buffer.from(fixture)),
      originalUrl: ORIGINAL_URL,
      originalSha256: digest(image),
    },
    capability: {
      onDeterminingFilename: 'unverified',
      passiveSuggestion: 'not-run',
      activeSuggestion: 'not-run',
    },
    selector,
    scenarios: [],
    live: { status: 'not-requested' },
    cleanup: {},
    errors: [],
  };
  let session: FirefoxSession | undefined;
  let extensionId: string | undefined;
  let nativeLoopback: Awaited<ReturnType<typeof startExtensionNativeFixtureLoopback>> | undefined;
  let nativeProxy: Awaited<ReturnType<typeof startFirefoxNativeProxy>> | undefined;
  let intercept: Awaited<ReturnType<typeof installFixtureIntercept>> | undefined;
  let fixtureNetwork: Awaited<ReturnType<typeof installFixtureIntercept>> | undefined;
  const errors: string[] = [];
  const cleanup = receipt.cleanup as Record<string, unknown>;
  try {
    nativeLoopback = await startExtensionNativeFixtureLoopback(
      join(root, 'validation/windows/userscript-fixture-certificate.ps1')
    );
    const unusedVideo = Buffer.from('unreachable Firefox fixture video');
    nativeLoopback.setPayloads(
      [image, image, image],
      Object.fromEntries(
        ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map((name) => [
          name,
          unusedVideo,
        ])
      )
    );
    nativeProxy = await startFirefoxNativeProxy(nativeLoopback.port);
    receipt.fixtureTransport = {
      kind: 'task-owned-connect-proxy-to-https-loopback',
      proxyPort: nativeProxy.port,
      nativePort: nativeLoopback.port,
      allowedAuthorities: ['x.com:443', 'pbs.twimg.com:443'],
      certificateSpkiSha256: nativeLoopback.spkiSha256,
      certificateScope: 'one-run-BiDi-acceptInsecureCerts',
    };
    session = await firefox.launch({
      root,
      executablePath: firefox.executablePath,
      headless,
      acceptInsecureCerts: true,
      preferences: {
        ...(scrollbarTakeover ? { 'ui.prefersReducedMotion': 0 } : {}),
        'browser.download.dir': downloads,
        'browser.download.folderList': 2,
        'browser.download.useDownloadDir': true,
        'browser.download.always_ask_before_handling_new_types': false,
        'intl.accept_languages': 'en-US,en',
        'extensions.webextensions.uuids': JSON.stringify({ [EXTENSION_ID]: uuid }),
        'network.proxy.type': 1,
        'network.proxy.http': '127.0.0.1',
        'network.proxy.http_port': nativeProxy.port,
        'network.proxy.ssl': '127.0.0.1',
        'network.proxy.ssl_port': nativeProxy.port,
        'network.proxy.no_proxies_on': '',
        'network.proxy.failover_direct': false,
      },
    });
    receipt.browser = { name: session.browserName, version: session.browserVersion };
    receipt.browserName = session.browserName;
    receipt.browserVersion = session.browserVersion;
    assert.equal(session.browserName.toLowerCase(), 'firefox', 'Unexpected browser');
    assert.equal(
      session.acceptInsecureCerts,
      true,
      'Firefox did not admit the task certificate capability'
    );
    try {
      await session.subscribeLogs?.();
      receipt.logSubscription = 'available';
    } catch (error) {
      receipt.logSubscription = `unavailable: ${errorText(error).slice(0, MAX_NETWORK_FIELD)}`;
    }
    const experience =
      selector === 'native-browser-ui'
        ? {
            html: await readFile(
              join(root, 'test/e2e/fixtures/installed-gallery-experience-page.html'),
              'utf8'
            ),
            images: await prepareFirefoxNativeUiImages(session, scrollbarTakeover),
          }
        : undefined;
    intercept = await installFixtureIntercept(session, fixture, image, experience);
    fixtureNetwork = intercept;
    extensionId = await session.installExtension(prepared.copy);
    assert.equal(extensionId, EXTENSION_ID, 'Installed Firefox extension ID mismatch');
    if (selector === 'native-browser-ui') {
      assert(experience, 'Firefox UI fixture was not prepared');
      if (scrollbarTakeover) {
        experience.html = experience.html.replace('height="900"', 'height="6000"');
      }
      receipt.fixture = {
        url: EXPERIENCE_URL,
        pageSha256: digest(Buffer.from(experience.html)),
        images: Object.fromEntries(
          Object.entries(experience.images).map(([url, bytes]) => [
            url,
            {
              bytes: bytes.length,
              sha256: digest(bytes),
            },
          ])
        ),
      };
      receipt.nativeBrowserUi = await runFirefoxNativeUi(
        session,
        EXPERIENCE_URL,
        output,
        scrollbarTakeover
          ? async () => {
              let nativePointer:
                | Awaited<ReturnType<typeof prepareNativeScrollbarPointer>>
                | undefined;
              return runNativeScrollbarTakeover(
                {
                  launchCondition:
                    'ui.prefersReducedMotion=0 in this owned temporary Firefox profile',
                  prepareInput: async () => {
                    const viewport = (await session!.evaluateJson(
                      '(() => ({ width: innerWidth, height: innerHeight }))()'
                    )) as { width: number; height: number };
                    await session!.command('browsingContext.setViewport', {
                      context: session!.context,
                      viewport: { width: 420, height: 700 },
                    });
                    try {
                      nativePointer = await prepareNativeScrollbarPointer(
                        (expression) => session!.evaluateJson(expression),
                        root,
                        'firefox.exe'
                      );
                      const ownedPointer = nativePointer;
                      return {
                        mapping: ownedPointer.mapping,
                        close: async () => {
                          try {
                            await ownedPointer.close();
                          } finally {
                            nativePointer = undefined;
                            await session!.command('browsingContext.setViewport', {
                              context: session!.context,
                              viewport,
                            });
                          }
                        },
                      };
                    } catch (error) {
                      await session!.command('browsingContext.setViewport', {
                        context: session!.context,
                        viewport,
                      });
                      throw error;
                    }
                  },
                  evaluate: (expression) => session!.evaluateJson(expression),
                  waitFor: (expression, description, timeoutMs) =>
                    session!.waitFor(expression, description, timeoutMs),
                  press: (key) => firefoxNativeKey(session!, key === 'Home' ? '\uE011' : '\uE010'),
                  wheel: async (deltaY) => {
                    const point = (await session!.evaluateJson(`(() => {
                      const items = document.querySelector('[data-gallery-element="items"]');
                      if (!(items instanceof HTMLElement)) throw new Error('Missing native scrollport');
                      const rect = items.getBoundingClientRect();
                      return { x: Math.floor(rect.left + rect.width / 2),
                        y: Math.floor(rect.top + rect.height / 2) };
                    })()`)) as { x: number; y: number };
                    try {
                      await session!.command('input.performActions', {
                        context: session!.context,
                        actions: [
                          {
                            type: 'wheel',
                            id: 'xeg-firefox-baseline-wheel',
                            actions: [
                              {
                                type: 'scroll',
                                origin: 'viewport',
                                ...point,
                                deltaX: 0,
                                deltaY,
                                duration: 200,
                              },
                            ],
                          },
                        ],
                      });
                    } finally {
                      await session!.command('input.releaseActions', { context: session!.context });
                    }
                  },
                  hover: async (at) => {
                    assert(nativePointer, 'Native pointer bridge was not prepared');
                    await nativePointer.hover(at);
                  },
                  drag: async (from, to, afterDown) => {
                    assert(nativePointer, 'Native pointer bridge was not prepared');
                    await nativePointer.drag(from, to, afterDown);
                  },
                  resize: async (width, height) => {
                    await session!.command('browsingContext.setViewport', {
                      context: session!.context,
                      viewport: { width, height },
                    });
                  },
                  screenshot: async (filename) => {
                    await writeFile(join(output, filename), await session!.captureScreenshot(), {
                      flag: 'wx',
                    });
                  },
                },
                output
              );
            }
          : undefined
      );
      assert((await readFile(sentinel)).equals(sentinelBytes), 'Preexisting sentinel changed');
      await intercept.stop();
      cleanup.fixtureIntercept = 'removed';
      intercept = undefined;
      receipt.status = 'passed';
    } else {
      let previous = await readDownloads(session, diagnosticUrl);
      const capability = receipt.capability as Record<string, unknown>;
      capability.onDeterminingFilename = previous.determiningFilename;
      if (previous.determiningFilename === 'unsupported') {
        capability.passiveSuggestion = 'unsupported';
        capability.activeSuggestion = 'unsupported';
      }
      assert.deepEqual(
        previous.items,
        [],
        'Fresh Firefox profile has preexisting download history'
      );
      for (const [index, collision] of [false, true].entries()) {
        await session.navigate(FIXTURE_URL);
        await session.waitFor(
          "document.documentElement.getAttribute('data-xeg-gallery-ready') === 'true'",
          'installed XCOM gallery bridge'
        );
        await click(session, '[data-testid="tweetPhoto"] a');
        await session.waitFor(
          "Boolean(document.querySelector('[data-xeg-gallery-container] #xeg-toolbar-counter'))",
          'gallery opening'
        );
        const selected = await session.evaluateJson(
          "document.querySelector('#xeg-toolbar-counter')?.getAttribute('data-position')"
        );
        assert.equal(selected, '1', 'Selected image differs from native source');
        const nativeMark = nativeLoopback.mark();
        await click(
          session,
          '[data-xeg-gallery-container] [data-gallery-element="toolbar"] button[aria-label="Download"]'
        );
        await session.waitFor(
          "Boolean(document.querySelector('[data-gallery-element=download-filename-notice]'))",
          'saved-name notice',
          20_000
        );
        const notice = (await session.evaluateJson(`(() => {
        const element = document.querySelector('[data-gallery-element=download-filename-notice]');
        return { name: element?.querySelector('bdi')?.textContent, conforms: element?.getAttribute('data-filename-conforms'), text: element?.textContent };
      })()`)) as { name?: string; conforms?: string; text?: string };
        assert(
          notice.name && notice.text?.includes(notice.name),
          'Saved-name notice missing observed basename'
        );
        assert.equal(notice.conforms, 'true', 'Native saved-name notice reported nonconformance');
        const beforeDismissal = await readDownloads(session, diagnosticUrl);
        const itemBeforeDismissal = selectOwnedDownload(
          previous.items,
          beforeDismissal.items,
          extensionId
        );
        const nativeBeforeDismissal = await readOwnedNativeFile(
          downloads,
          itemBeforeDismissal.filename,
          image
        );
        const noticeScreenshot = `firefox-notice-${collision ? 'collision' : 'normal'}.png`;
        const screenshotBytes = await session.captureScreenshot();
        await writeFile(join(output, noticeScreenshot), screenshotBytes, { flag: 'wx' });
        const screenshotSha256 = digest(screenshotBytes);
        await click(session, '[data-gallery-element="download-filename-notice"] button');
        assert.equal(
          await session.evaluateJson(
            "document.querySelectorAll('[data-gallery-element=download-filename-notice]').length"
          ),
          0,
          'Saved-name notice did not dismiss'
        );
        const after = await readDownloads(session, diagnosticUrl);
        assert.deepEqual(
          after.items.map((item) => item.id).sort(),
          beforeDismissal.items.map((item) => item.id).sort(),
          'Dismissing saved-name notice created another download'
        );
        const item = selectOwnedDownload(previous.items, after.items, extensionId);
        const native = await readOwnedNativeFile(downloads, item.filename, image);
        const nativeTransfers: NativeTransferRecord[] = nativeLoopback
          .since(nativeMark)
          .filter(
            (event: NativeTransferRecord) =>
              event.host === 'pbs.twimg.com' &&
              event.path === '/media/GkE1234ABCDEF.jpg' &&
              event.method === 'GET' &&
              event.status === 200 &&
              event.result === 'served'
          );
        assert.equal(nativeTransfers.length, 1, 'Expected one task HTTPS original transfer');
        assert.equal(nativeTransfers[0]?.bytes, image.length, 'Task HTTPS transfer size differs');
        assert.equal(nativeTransfers[0]?.sha256, digest(image), 'Task HTTPS transfer bytes differ');
        assert.deepEqual(
          native,
          nativeBeforeDismissal,
          'Native file changed during notice dismissal'
        );
        if (collision) {
          assert.notEqual(native.basename, EXPECTED_NAME, 'Filename collision overwrote original');
          assert.equal(
            native.basename,
            'testuser_1234567890123456789_0(1).jpg',
            'Unexpected collision name'
          );
          const first = (receipt.scenarios as Array<{ native?: { basename?: string } }>)[0]?.native;
          assert(first?.basename === EXPECTED_NAME, 'Original normal download is missing');
          const original = await readOwnedNativeFile(
            downloads,
            join(downloads, EXPECTED_NAME),
            image
          );
          assert.equal(original.basename, EXPECTED_NAME, 'Collision changed original native file');
        } else {
          assert.equal(
            native.basename,
            EXPECTED_NAME,
            'Native basename differs from owner and attachment'
          );
        }
        assert.equal(notice.name, native.basename, 'Notice differs from native saved basename');
        const retainedName = `firefox-native-${index + 1}.jpg`;
        await writeFile(join(output, retainedName), image, { flag: 'wx' });
        assert(
          (await readFile(join(output, retainedName))).equals(image),
          'Retained native copy differs'
        );
        (receipt.scenarios as unknown[]).push({
          name: collision ? 'collision' : 'normal',
          status: 'passed',
          native: {
            id: item.id,
            byExtensionId: item.byExtensionId,
            ...native,
            filename: undefined,
          },
          notice,
          noticeScreenshot,
          screenshotSha256,
          nativeTransfer: nativeTransfers[0],
          retainedName,
        });
        previous = after;
      }
      receipt.nativeBidiOriginalObserved = intercept.requests.some(
        (request) => request.url === ORIGINAL_URL
      );
      assert(
        nativeProxy.snapshot().pbsConnectedCount > 0,
        'Native original did not traverse task CONNECT proxy'
      );
      receipt.requests = intercept.requests;
      assert((await readFile(sentinel)).equals(sentinelBytes), 'Preexisting sentinel changed');
      await intercept.stop();
      cleanup.fixtureIntercept = 'removed';
      intercept = undefined;
      receipt.status = 'passed';
    }
  } catch (error) {
    errors.push(errorText(error));
    if (session) {
      const failure: Record<string, unknown> = {};
      receipt.failure = failure;
      try {
        failure.ui = await session.evaluateJson(`(() => {
          const gallery = document.querySelector('[data-xeg-gallery-container]');
          const notice = document.querySelector('[data-gallery-element=download-filename-notice]');
          const error = document.querySelector('[data-xeg-error-boundary], [role=alert]');
          return {
            galleryOpen: Boolean(gallery),
            downloadStatus: gallery?.querySelector('[data-download-status]')?.getAttribute('data-download-status') ?? null,
            noticeVisible: Boolean(notice),
            errorText: error?.textContent?.slice(0, 500) ?? null,
          };
        })()`);
      } catch (diagnosticError) {
        failure.uiError = errorText(diagnosticError)
          .replaceAll(root, '<bundle>')
          .replaceAll(output, '<output>')
          .slice(0, 300);
      }
      if (extensionId === EXTENSION_ID) {
        try {
          const history = await readDownloads(session, diagnosticUrl);
          failure.nativeHistory = ownedNativeHistory(history.items, extensionId);
          failure.nativeHistoryMatches = (failure.nativeHistory as unknown[]).length;
        } catch (diagnosticError) {
          failure.nativeHistoryError = errorText(diagnosticError)
            .replaceAll(root, '<bundle>')
            .replaceAll(output, '<output>')
            .slice(0, 300);
        }
      }
      failure.pageErrorCount = session.pageErrors?.length ?? null;
      failure.logErrorCount =
        session.pageLogs?.filter((entry) => entry.level === 'error').length ?? null;
      try {
        await writeFile(join(output, 'firefox-failure.png'), await session.captureScreenshot(), {
          flag: 'wx',
        });
      } catch (screenshotError) {
        errors.push(`failure screenshot: ${errorText(screenshotError)}`);
      }
    }
  } finally {
    if (nativeProxy && nativeLoopback) {
      (receipt.fixtureTransport as Record<string, unknown>).proxy = nativeProxy.snapshot();
      (receipt.fixtureTransport as Record<string, unknown>).https = nativeLoopback.snapshot();
    }
    if (fixtureNetwork) {
      receipt.requests = fixtureNetwork.requests;
      receipt.network = {
        events: fixtureNetwork.events,
        omittedEvents: fixtureNetwork.omittedEvents,
        completionEventsSubscribed: fixtureNetwork.completionEventsSubscribed,
        completionEventsSubscriptionError: fixtureNetwork.completionEventsSubscriptionError,
      };
    }
    if (intercept) {
      try {
        await intercept.stop();
        cleanup.fixtureIntercept = 'removed';
      } catch (error) {
        errors.push(`fixture intercept cleanup: ${errorText(error)}`);
        cleanup.fixtureIntercept = 'failed';
      }
    }
    if (session && extensionId) {
      try {
        await session.uninstallExtension(extensionId);
        cleanup.extension = 'uninstalled';
      } catch (error) {
        errors.push(`extension cleanup: ${errorText(error)}`);
        cleanup.extension = 'failed';
      }
    }
    if (session) {
      try {
        await session.close();
        cleanup.browser = 'closed';
      } catch (error) {
        errors.push(`browser cleanup: ${errorText(error)}`);
        cleanup.browser = 'failed';
      }
    }
    if (nativeProxy) {
      try {
        await nativeProxy.close();
        cleanup.nativeProxy = 'closed';
      } catch (error) {
        errors.push(`native proxy cleanup: ${errorText(error)}`);
        cleanup.nativeProxy = 'failed';
      }
    }
    if (nativeLoopback) {
      try {
        await nativeLoopback.close();
        cleanup.nativeHttps = 'closed';
      } catch (error) {
        errors.push(`native HTTPS cleanup: ${errorText(error)}`);
        cleanup.nativeHttps = 'failed';
      }
    }
    if (nativeProxy && nativeLoopback) {
      cleanup.nativeProxyAfter = nativeProxy.snapshot();
      cleanup.nativeHttpsAfter = nativeLoopback.snapshot();
    }
    try {
      assert((await readFile(sentinel)).equals(sentinelBytes));
      cleanup.sentinel = 'preserved';
    } catch (error) {
      errors.push(`sentinel check: ${errorText(error)}`);
      cleanup.sentinel = 'failed';
    }
    if (
      (!session || cleanup.browser === 'closed') &&
      (!extensionId || cleanup.extension === 'uninstalled')
    ) {
      try {
        await rm(prepared.copy, { recursive: true });
        cleanup.installCopy = 'removed';
      } catch (error) {
        errors.push(`install copy cleanup: ${errorText(error)}`);
        cleanup.installCopy = 'failed';
      }
    }
    if (!session || cleanup.browser === 'closed') {
      try {
        assert.equal(
          dirname(resolve(downloads)),
          resolve(root),
          'Native directory escaped task root'
        );
        assert(
          basename(downloads).startsWith('firefox-native-downloads-'),
          'Unexpected native directory name'
        );
        assert((await lstat(downloads)).isDirectory(), 'Native directory was replaced');
        const files = await readdir(downloads);
        assert(files.length <= 16, 'Native directory contains too many files to retain safely');
        const originals: Array<{ name: string; bytes: number; sha256: string; retained: string }> =
          [];
        for (const [index, name] of files.entries()) {
          if (name === basename(sentinel)) {
            continue;
          }
          const path = join(downloads, name);
          const { bytes } = await readOwnedNativeBytes(downloads, path, 20_000_000);
          const retained = `firefox-original-${index}.bin`;
          await writeFile(join(output, retained), bytes, { flag: 'wx' });
          assert(
            (await readFile(join(output, retained))).equals(bytes),
            'Original failure retention changed bytes'
          );
          originals.push({ name, bytes: bytes.length, sha256: digest(bytes), retained });
        }
        cleanup.originals = originals;
        assert((await readFile(sentinel)).equals(sentinelBytes), 'Sentinel changed during cleanup');
        await rm(downloads, { recursive: true });
        cleanup.nativeDirectory = 'removed-after-retention';
      } catch (error) {
        errors.push(`native directory cleanup: ${errorText(error)}`);
        cleanup.nativeDirectory = 'preserved-for-review';
      }
    }
    receipt.errors = errors.map((message) =>
      message
        .replaceAll(firefox.executablePath!, '<firefox>')
        .replaceAll(downloads, '<native-downloads>')
        .replaceAll(prepared.copy, '<installation-copy>')
        .replaceAll(output, '<output>')
        .replaceAll(root, '<bundle>')
    );
    if (errors.length) {
      receipt.status = 'failed';
    }
    await writeFile(
      join(output, 'firefox-installation.json'),
      `${JSON.stringify(receipt, null, 2)}\n`,
      { flag: 'wx' }
    );
  }
  if (errors.length) {
    throw new Error(`Firefox installed-extension acceptance failed: ${errors.join('; ')}`);
  }
  return receipt;
}
