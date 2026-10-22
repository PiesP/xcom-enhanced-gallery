// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type {
  BrowserContext,
  BrowserType,
  CDPSession,
  ConsoleMessage,
  Locator,
  Page,
  Request,
  Response,
  Route,
  Worker,
} from '@playwright/test';
import {
  expectedStoredZipBytes,
  readExactDownloadFile,
  verifyStoredZip,
} from './download-memory.ts';
import {
  createImageFixtures,
  enableDeveloperMode,
  installFixtureRoutes,
  verifyDownloadDirectory,
} from './install-profile.ts';
import {
  captureGalleryVolumeFailure,
  captureUpgradeSettingsFailure,
  observeDefaultVideoClick,
  observeGalleryKeyboardNavigation,
  observeGalleryVolume,
} from './release-upgrade/gallery-volume.ts';
import { readUpgradeInput, requireManagerEditorSource, sha256 } from './release-upgrade/source.ts';
import { startUserscriptFixtureLoopback } from './userscript-loopback.ts';

const SCRIPT_NAME = 'X.com Enhanced Gallery';
const MANAGER_SCRIPT_NAME_SELECTOR = 'span.nameNname16';
const PROFILE_PREFIX = 'xeg-userscript-install-';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const MOBILE_MANAGER_DENIAL_URL = `https://mobile.x.com/testuser/status/${TWEET_ID}?xeg-manager-denial=1`;
export const MEDIA_COHORTS = {
  normal: ['GkE1234ABCDEF', 'GkE5678GHIJKL', 'GkE9012MNOPQR'],
  failure: ['GkF1234ABCDEF', 'GkF5678GHIJKL', 'GkF9012MNOPQR'],
  partial: ['GkP1234ABCDEF', 'GkP5678GHIJKL', 'GkP9012MNOPQR'],
  held: ['GkH1234ABCDEF', 'GkH5678GHIJKL', 'GkH9012MNOPQR'],
};
export const PUBLIC_AVATAR_PATH = '/profile_images/123456789/public-avatar.jpg';
const UNAVAILABLE_PREVIEW_PATHS = new Set([
  ...[
    '8666666666666666661',
    '8666666666666666662',
    '8666666666666666663',
    '8666666666666666664',
    TWEET_ID,
  ].map((id) => `/ext_tw_video_thumb/${id}/pu/img/unavailable.jpg`),
  '/ext_tw_video_thumb/9555555555555555555/pu/img/quote-two.jpg',
]);
export function isUnavailablePreviewFixtureUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'pbs.twimg.com' &&
      UNAVAILABLE_PREVIEW_PATHS.has(url.pathname) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
export function isPublicAvatarFixtureUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'pbs.twimg.com' &&
      url.pathname === PUBLIC_AVATAR_PATH &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
export const FIXTURE_ZIP_NAME = `testuser_${TWEET_ID}.zip`;
const MAX_DOWNLOADS = 8;
const FIRST_MEDIA_URL = `https://pbs.twimg.com/media/${MEDIA_COHORTS.normal[0]}.jpg?format=jpg&name=orig`;
const execFileAsync = promisify(execFile);
const NATIVE_PERMISSION_RECEIPT = 'userscript-manager-native-permission.json';
const NATIVE_PERMISSION_ACTION_RECEIPT = 'userscript-manager-native-permission-action.json';
const CHROME_KO_PERMISSION_TITLE = "'Tampermonkey'이(가) 추가 승인을 요청했습니다.";
const PROMPT_SCOPE_REASONS = new Set([
  'prompt-window-not-unique',
  'prompt-identity-changed',
  'provider-error',
  'runtime-id-unavailable',
  'duplicate-runtime-id',
  'cross-process',
  'name-cap',
  'depth-cap',
  'sibling-cap',
  'node-cap',
]);

type ProcessInfo = { processInfo?: { type: string; id: number }[] };
type NativeControl = {
  controlType?: string;
  name?: string;
  isEnabled?: boolean;
  isOffscreen?: boolean;
};
type NativePromptReceipt = {
  status?: string;
  capture?: string;
  screenshot?: string;
  permissionGrantAttempted?: boolean;
  foregroundOwnedAndVisible?: boolean;
  browserPid?: number;
  uiaRootProcessId?: number;
  browserSessionId?: number;
  observerSessionId?: number;
  creationUtcTicks?: string;
  foregroundHandle?: string;
  controls?: NativeControl[];
  promptScope?: {
    complete?: boolean;
    nameTruncated?: boolean;
    windowCount?: number;
    reason?: string | null;
    rootProcessId?: number;
    visitedControls?: number;
    attemptedNodes?: number;
    controls?: NativeControl[];
  };
  reason?: string;
};
type FixtureMediaEvent = {
  kind: string;
  cohort: string;
  index: number;
  method: string;
  resourceType: string;
  status: number | null;
};
type ManagerUiLabels = { utilities: string; install: string; installedUserscripts: string };
type ManagerHistoryItem = {
  id: number;
  state: string;
  declaredRedirectFinalUrlMatch?: true;
  interruptReason: string | null;
  requestedNameMatch: boolean;
  ownedPathMatch: boolean;
  expectedSizeMatch: boolean;
  fixtureUrlMatch: boolean;
};
type ManagerHistory = { status: string; items: ManagerHistoryItem[]; errorType?: string };
type BrowserDownloadBegin = { guid: string; suggestedFilename: string; url: string };
type BrowserDownloadProgress = {
  guid: string;
  state: string;
  receivedBytes: number;
  totalBytes: number;
  filePath?: string;
};
type BrowserDownloadStatus = {
  state: string;
  receivedBytes: number;
  totalBytes: number;
  filePath: string | null;
};
type ManagerFrameSummary = {
  index: number;
  url: string | null;
  skipped?: string;
  document?: unknown;
  errorType?: string;
};
type ManagerPermissionDiagnostics = {
  api: Awaited<ReturnType<typeof probeManagerUserScripts>>;
  requestedUrl: string | null;
  finalUrl?: string | null;
  title?: string;
  allowUserScriptsVisible?: boolean;
  toggleControls?: { id: string; ariaLabel: string | null; checked: boolean }[];
  captureErrorType?: string;
  frameCount?: number;
  frames?: ManagerFrameSummary[];
  frameErrorType?: string;
  ariaSnapshot?: { labelContext: string | null };
  ariaSnapshotErrorType?: string;
};
type UserscriptLoopback = Awaited<ReturnType<typeof startUserscriptFixtureLoopback>>;
type UserscriptLoopbackEvent = NonNullable<ReturnType<UserscriptLoopback['findSince']>>;
type FixtureRouteRecord = {
  phase: string;
  mediaPhase: string;
  index: number;
  resourceType: string;
  method: string;
  result?: string;
};
type FixtureRouteFailure = {
  phase: string;
  error: ReturnType<typeof safeRouteError>;
  request: { host: string; pathKind: string; resourceType: string };
};
type FixtureDownload = {
  kind: string;
  guid: string | null;
  requestedName: string;
  filename: string;
  source: { scheme: string; origin: string };
  bytes: number;
  sha256: string;
  nativeState: string;
  browserBytesReceived: number | null;
  repetition?: number;
  nativeId?: number;
  completionSource?: string;
  cdpObservation?: string;
  entryOrder?: string[];
  included?: number;
  omitted?: number;
  countSource?: string;
};
type FixtureResult = {
  status: string;
  downloads: FixtureDownload[];
  routes: FixtureRouteRecord[];
  routeFailures: FixtureRouteFailure[];
  routeFailureOverflow: number;
  transportReceipts: {
    normalZip?: {
      firstResponses: UserscriptLoopbackEvent[];
      repeated?: { source: string; additionalTransferResponses: number };
    };
    networkFailure?: UserscriptLoopbackEvent;
    partialZip?: UserscriptLoopbackEvent;
  };
  cases: Record<string, unknown>;
  cleanup: {
    managerConsoleListenersRemoved?: boolean;
    pageError?: string;
    routeRemoved?: boolean;
    routeError?: string;
  };
  firstCurrentDownload?: unknown;
  browserDownloadEvents?: ReturnType<ReturnType<typeof createBrowserDownloadObserver>['events']>;
  fixtureMediaNetwork?: { events: FixtureMediaEvent[]; overflow: number };
  loopbackTransport?: ReturnType<UserscriptLoopback['snapshot']>;
  error?: ReturnType<typeof safeRouteError>;
};
type UpgradeConfirmationEvent = {
  phase: string;
  event: string;
  url?: string;
  title?: string;
  translatedTitle?: string;
  updateLabel?: string;
};
type UserscriptUpgradeReceipt = {
  status: string;
  previousVersion: string;
  candidateVersion: string;
  previousSourceSha256: string;
  candidateSourceSha256: string;
  managerId: string;
  volumeFailure?: unknown;
  volumePersistenceReadbacks?: Record<
    string,
    { expected: number; observed: number | null; attempts: number }
  >;
  baselineClickModeUi?: string;
  keyboardAfter?: unknown;
  keyboardBefore?: unknown;
  candidateClickModeReadback?: { observedMode: string | null; attempts: number };
  candidateClickModeUi?: { selected: string; persistedInNewPage: boolean };
  settingsFailure?: unknown;
  videoClickBefore?: unknown;
  volumeBefore?: unknown;
  volumeBeforeReloaded?: unknown;
  beforeReadback?: unknown;
  updateConfirmationEvents?: UpgradeConfirmationEvent[];
  afterDeferralReadback?: unknown;
  afterDeferralPreferences?: unknown;
  afterDeferralVolume?: unknown;
  afterReadback?: unknown;
  videoClickAfter?: unknown;
  nondefaultClickCrossUpdate?: string;
  volumeAfter?: unknown;
  volumeAfterReloaded?: unknown;
  fixtureDefaultsRestoredThroughUi?: boolean;
  settings?: {
    fit: string;
    videoClickMode: string;
    language: string;
    videoVolume: number;
    keyboardShortcutUsedForVolume: boolean;
    crossUpdateUiVerified: string[];
  };
  method?: string;
  error?: ReturnType<typeof safeRouteError>;
  cleanupError?: ReturnType<typeof safeRouteError>;
};
type UserscriptInstallationResult = {
  status: string;
  browserName: string;
  installation: string;
  installationMethod: string;
  sourceSha256: string;
  profileId: string;
  profilePrefix: string;
  scope: string;
  cleanup: {
    browserDownloadObserverRemoved?: boolean;
    activeLoopbackResponsesDestroyed?: boolean;
    managerUninstalled?: boolean;
    browserClosed?: boolean;
    loopbackClosed?: boolean;
    profileRemoved?: boolean;
    profilePreserved?: boolean;
    errorCount?: number;
    errors?: string[];
  };
  fixtureTransport?: {
    kind: string;
    bind: string;
    port: number;
    hosts: string[];
    certificateScope: string;
  };
  browserVersion?: string;
  downloadDirectoryVerified?: boolean;
  manager?: Awaited<ReturnType<typeof installUserscript>>;
  upgrade?: UserscriptUpgradeReceipt;
  fixtureLimits?: {
    imageBytes: number[];
    imageSha256: string[];
    maxDownloads: number;
    maxRoutedImageRequests: number;
    maxLoopbackRequests: number;
    maxLoopbackImageBytes: number;
    maxLoopbackServedBytes: number;
    maxLoopbackApiServedBytes: number;
    productionBudget: string;
  };
  fixture?: FixtureResult;
  error?: string;
};

declare global {
  interface Element {
    CodeMirror?: { getValue(): string };
  }
}

declare const chrome: {
  userScripts: { getScripts(): Promise<unknown[]> };
  i18n: { getMessage(key: string): string };
  permissions: { contains(query: { permissions: string[] }): Promise<boolean> };
  downloads: {
    search(query: { url?: string; limit?: number }): Promise<
      Array<{
        id: number;
        url: string;
        filename: string;
        state: string;
        error?: string;
        fileSize?: number;
      }>
    >;
  };
};

export function browserProcessId(processInfo: ProcessInfo) {
  const browsers = processInfo?.processInfo?.filter((process) => process.type === 'browser') ?? [];
  const browser = browsers[0];
  return browsers.length === 1 && browser && Number.isSafeInteger(browser.id) && browser.id > 0
    ? browser.id
    : null;
}

/** Read-only native UIA evidence only: no screen capture, click, or permission grant. */
export async function captureNativeManagerPermission(
  cdp: CDPSession,
  root: string,
  output: string,
  profile: string,
  browserName: string,
  run = execFileAsync
) {
  const receiptPath = join(output, NATIVE_PERMISSION_RECEIPT);
  let receipt: NativePromptReceipt;
  try {
    assertOwned(root, profile);
    assert(['chrome', 'msedge'].includes(browserName), 'Unsupported native browser');
    const pid = browserProcessId(await cdp.send('SystemInfo.getProcessInfo'));
    assert(pid, 'CDP did not identify one browser process');
    await run(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-File',
        join(root, 'validation/windows/manager-permission-window.ps1'),
        '-BrowserPid',
        String(pid),
        '-BrowserName',
        browserName,
        '-Profile',
        profile,
        '-Output',
        output,
      ],
      { timeout: 12_000, windowsHide: true, maxBuffer: 4_096 }
    );
    receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    assert(
      ['captured', 'skipped'].includes(receipt.status ?? ''),
      'Invalid native diagnostic receipt'
    );
    assert.equal(receipt.capture, 'uia-only', 'Native diagnostic must be UIA-only');
    assert.equal(receipt.screenshot, 'not-captured', 'Native diagnostic cannot capture the screen');
    assert.equal(
      receipt.permissionGrantAttempted,
      false,
      'Native diagnostic cannot change permission'
    );
  } catch (error) {
    receipt = {
      status: 'unavailable',
      reason: error instanceof Error ? error.name : typeof error,
      capture: 'uia-only',
      screenshot: 'not-captured',
      permissionGrantAttempted: false,
    };
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2));
  }
  return { status: receipt.status, reason: receipt.reason ?? null };
}

/** Only the observed Korean Chrome downloads-only prompt is eligible for native Invoke. */
export function isObservedChromeNativeDownloadPrompt(receipt: NativePromptReceipt | null) {
  const scope = receipt?.promptScope;
  if (
    receipt?.status !== 'captured' ||
    receipt.capture !== 'uia-only' ||
    receipt.screenshot !== 'not-captured' ||
    receipt.permissionGrantAttempted !== false ||
    receipt.foregroundOwnedAndVisible !== true ||
    typeof receipt.browserPid !== 'number' ||
    !Number.isSafeInteger(receipt.browserPid) ||
    receipt.browserPid <= 0 ||
    receipt.uiaRootProcessId !== receipt.browserPid ||
    typeof receipt.browserSessionId !== 'number' ||
    !Number.isSafeInteger(receipt.browserSessionId) ||
    receipt.browserSessionId <= 0 ||
    receipt.observerSessionId !== receipt.browserSessionId ||
    typeof receipt.creationUtcTicks !== 'string' ||
    !/^\d{15,20}$/u.test(receipt.creationUtcTicks) ||
    typeof receipt.foregroundHandle !== 'string' ||
    !/^[1-9]\d{0,19}$/u.test(receipt.foregroundHandle) ||
    !Array.isArray(receipt.controls) ||
    receipt.controls.length > 256 ||
    scope?.complete !== true ||
    scope.nameTruncated !== false ||
    scope.windowCount !== 1 ||
    scope.reason !== null ||
    scope.rootProcessId !== receipt.browserPid ||
    typeof scope.visitedControls !== 'number' ||
    !Number.isSafeInteger(scope.visitedControls) ||
    scope.visitedControls <= 0 ||
    scope.visitedControls > 128 ||
    !Array.isArray(scope.controls) ||
    scope.controls.length !== scope.visitedControls ||
    scope.attemptedNodes !== scope.visitedControls
  ) {
    return false;
  }
  const controls = scope.controls;
  const count = (type: string, name: string) =>
    controls.filter((control) => control.controlType === type && control.name === name).length;
  return (
    receipt.controls.filter(
      (control) =>
        control.controlType === 'ControlType.Window' && control.name === CHROME_KO_PERMISSION_TITLE
    ).length === 1 &&
    count('ControlType.Window', CHROME_KO_PERMISSION_TITLE) === 1 &&
    count('ControlType.Text', CHROME_KO_PERMISSION_TITLE) === 1 &&
    count('ControlType.Text', '이전에 가능했던 대상:') === 1 &&
    count('ControlType.Text', '다운로드 관리') === 1 &&
    count('ControlType.Button', '허용') === 1 &&
    count('ControlType.Button', '거부') === 1 &&
    controls.filter(
      (control) =>
        control.name &&
        ![
          CHROME_KO_PERMISSION_TITLE,
          '이전에 가능했던 대상:',
          '다운로드 관리',
          '허용',
          '거부',
        ].includes(control.name ?? '')
    ).length === 0 &&
    controls
      .filter(
        (control) =>
          control.controlType === 'ControlType.Button' &&
          ['허용', '거부'].includes(control.name ?? '')
      )
      .every((control) => control.isEnabled === true && control.isOffscreen === false)
  );
}

/** Recheck the owned manager ask before a second, OS-bound UIA-only Invoke pass. */
export async function inspectAndAllowNativeManagerPermission(
  cdp: CDPSession,
  root: string,
  output: string,
  profile: string,
  browserName: string,
  ask: Page,
  managerId: string,
  context: BrowserContext,
  run = execFileAsync
) {
  const diagnostic = await captureNativeManagerPermission(
    cdp,
    root,
    output,
    profile,
    browserName,
    run
  );
  const skipped = (reason: string) => ({ ...diagnostic, action: { status: 'skipped', reason } });
  if (browserName !== 'chrome') {
    return skipped('browser-not-observed');
  }
  if (diagnostic.status !== 'captured') {
    return skipped('prompt-not-captured');
  }
  try {
    const receipt = JSON.parse(await readFile(join(output, NATIVE_PERMISSION_RECEIPT), 'utf8'));
    if (receipt.promptScope?.complete === false) {
      const reason = PROMPT_SCOPE_REASONS.has(receipt.promptScope.reason)
        ? receipt.promptScope.reason
        : 'incomplete';
      return skipped(`prompt-scope-${reason}`);
    }
    if (!isObservedChromeNativeDownloadPrompt(receipt)) {
      return skipped('prompt-not-exact');
    }
    const currentPid = browserProcessId(await cdp.send('SystemInfo.getProcessInfo'));
    if (currentPid !== receipt.browserPid) {
      return skipped('browser-pid-changed');
    }
    if (
      ask.isClosed() ||
      ask.context() !== context ||
      !isOwnedManagerPermissionAskUrl(ask.url(), managerId)
    ) {
      return skipped('manager-ask-not-current');
    }
    const args = [
      '-NoProfile',
      '-NonInteractive',
      '-File',
      join(root, 'validation/windows/manager-permission-window.ps1'),
      '-BrowserPid',
      String(currentPid),
      '-BrowserName',
      browserName,
      '-Profile',
      profile,
      '-Output',
      output,
      '-InvokeAllow',
      '-ExpectedCreationUtcTicks',
      receipt.creationUtcTicks,
      '-ExpectedSessionId',
      String(receipt.browserSessionId),
      '-ExpectedForegroundHandle',
      receipt.foregroundHandle,
    ];
    await run('powershell.exe', args, { timeout: 12_000, windowsHide: true, maxBuffer: 4_096 });
    const action = JSON.parse(
      await readFile(join(output, NATIVE_PERMISSION_ACTION_RECEIPT), 'utf8')
    );
    assert(
      ['skipped', 'invoked', 'unverified-after-invoke'].includes(action.status),
      'Invalid native action receipt'
    );
    assert.equal(action.capture, 'uia-only');
    assert.equal(action.screenshot, 'not-captured');
    assert.equal(
      action.permissionGrantAttempted,
      action.status !== 'skipped',
      'Native action attempt marker differs'
    );
    if (action.status === 'invoked') {
      assert.equal(action.postProcessStable, true);
      assert.equal(action.postForegroundOwned, true);
    }
    return {
      ...diagnostic,
      action: {
        status: action.status,
        reason: action.reason ?? null,
        permissionGrantAttempted: action.permissionGrantAttempted,
        postProcessStable: action.postProcessStable ?? null,
        postForegroundOwned: action.postForegroundOwned ?? null,
      },
    };
  } catch (error) {
    return {
      ...diagnostic,
      action: { status: 'unavailable', reason: error instanceof Error ? error.name : typeof error },
    };
  }
}

function filename(index: number) {
  return `testuser_${TWEET_ID}_${index}.jpg`;
}
export function fixtureZipEntries<T extends Uint8Array>(images: T[]) {
  return images.map((bytes, index) => ({ filename: filename(index), bytes }));
}
function delay(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

export function summarizeDownloadUrl(value: string) {
  const url = new URL(value);
  return { scheme: url.protocol, origin: url.origin };
}

export function requirePageBlobZipSource(value: string) {
  const source = summarizeDownloadUrl(value);
  assert.deepEqual(
    source,
    { scheme: 'blob:', origin: 'https://x.com' },
    'ZIP must be saved from a page-origin Blob URL'
  );
  return source;
}

async function waitFor<T>(
  read: () => T | undefined | Promise<T | undefined>,
  label: string,
  timeoutMs = 15_000
): Promise<T> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const value = await read();
    if (value !== undefined) {
      return value;
    }
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function observeManagerNotificationCreates(context: BrowserContext, managerId: string) {
  const worker = await waitFor(
    () =>
      context
        .serviceWorkers()
        .find((item) => item.url() === `chrome-extension://${managerId}/background.js`),
    'installed Tampermonkey background worker'
  );
  const marker = '__xegManagerNativeNotificationObserver';
  await worker.evaluate((key) => {
    if (Reflect.has(globalThis, key)) {
      throw new Error('Manager notification observer is already installed');
    }
    const notifications: unknown = Reflect.get(chrome, 'notifications');
    if (typeof notifications !== 'object' || notifications === null) {
      throw new Error('Manager native notifications are unavailable');
    }
    const original: unknown = Reflect.get(notifications, 'create');
    if (typeof original !== 'function') {
      throw new Error('Manager native notification creation is unavailable');
    }
    const state = {
      original,
      wrapper: null as ((...args: unknown[]) => unknown) | null,
      calls: [] as Array<{ id: string | null; message: string | null }>,
      overflow: false,
    };
    state.wrapper = function (this: unknown, ...args: unknown[]) {
      const [id, options] = args;
      const message: unknown =
        typeof options === 'object' && options !== null
          ? Reflect.get(options, 'message')
          : undefined;
      if (state.calls.length < 8) {
        state.calls.push({
          id: typeof id === 'string' ? id.slice(0, 128) : null,
          message: typeof message === 'string' ? message.slice(0, 512) : null,
        });
      } else {
        state.overflow = true;
      }
      return Reflect.apply(original, this, args);
    };
    if (
      !Reflect.set(globalThis, key, state) ||
      !Reflect.set(notifications, 'create', state.wrapper)
    ) {
      Reflect.deleteProperty(globalThis, key);
      throw new Error('Manager native notification observer could not be installed');
    }
  }, marker);
  return {
    async snapshot() {
      const state = await worker.evaluate((key) => {
        const value: unknown = Reflect.get(globalThis, key);
        if (typeof value !== 'object' || value === null) {
          return null;
        }
        const notifications: unknown = Reflect.get(chrome, 'notifications');
        return {
          calls: Reflect.get(value, 'calls') as Array<{
            id: string | null;
            message: string | null;
          }>,
          overflow: Reflect.get(value, 'overflow') as boolean,
          intact:
            typeof notifications === 'object' &&
            notifications !== null &&
            Reflect.get(notifications, 'create') === Reflect.get(value, 'wrapper'),
        };
      }, marker);
      assert(state?.intact, 'Manager native notification observer was replaced');
      assert.equal(state.overflow, false, 'Manager notification observation exceeded eight calls');
      return state.calls;
    },
    async dispose() {
      const restored = await worker.evaluate((key) => {
        const state: unknown = Reflect.get(globalThis, key);
        const notifications: unknown = Reflect.get(chrome, 'notifications');
        if (
          typeof state !== 'object' ||
          state === null ||
          typeof notifications !== 'object' ||
          notifications === null
        ) {
          return false;
        }
        const original: unknown = Reflect.get(state, 'original');
        const reset = Reflect.set(notifications, 'create', original);
        const exact = Reflect.get(notifications, 'create') === original;
        const removed = Reflect.deleteProperty(globalThis, key);
        return reset && exact && removed && !Reflect.has(globalThis, key);
      }, marker);
      assert.equal(restored, true, 'Manager native notification observer was not restored');
    },
  };
}

async function chooseTrustedVideoClickMode(page: Page, select: Locator, target: string) {
  assert(
    target === 'block-all' || target === 'block-controls-only' || target === 'allow-all',
    'Video click mode must be a declared option'
  );
  const current = await select.inputValue();
  if (current === target) {
    return;
  }
  await select.focus();
  const key =
    target === 'allow-all'
      ? 'End'
      : target === 'block-all'
        ? 'Home'
        : current === 'allow-all'
          ? 'ArrowUp'
          : 'ArrowDown';
  await page.keyboard.press(key);
  await page.waitForFunction((expected) => {
    const control = document.querySelector(
      '[data-xeg-gallery-container] #settings-video-click-select'
    );
    return control instanceof HTMLSelectElement && !control.disabled && control.value === expected;
  }, target);
}

function assertOwned(root: string, profile: string) {
  assert.equal(dirname(resolve(profile)), resolve(root), 'Profile is outside the task root');
  assert(basename(profile).startsWith(PROFILE_PREFIX), 'Profile prefix differs');
}

function safeRouteError(error: unknown) {
  const name = error instanceof Error ? error.name : typeof error;
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/https?:\/\/[^\s)]+/gu, '[url]')
    .slice(0, 256);
  return { name, message };
}

/** Report only the twelve fixture media identities, without URLs or response bodies. */
export function watchFixtureMediaNetwork(context: BrowserContext) {
  const events: FixtureMediaEvent[] = [];
  let overflow = 0;
  const identify = (request: Request) => {
    try {
      const url = new URL(request.url());
      if (url.protocol !== 'https:' || url.hostname !== 'pbs.twimg.com') {
        return null;
      }
      for (const [cohort, markers] of Object.entries(MEDIA_COHORTS)) {
        const index = markers.findIndex((marker) => url.pathname === `/media/${marker}.jpg`);
        if (index >= 0) {
          return { cohort, index };
        }
      }
    } catch {
      /* Ignore non-URL browser requests. */
    }
    return null;
  };
  const append = (kind: string, request: Request, status: number | null = null) => {
    const media = identify(request);
    if (!media) {
      return;
    }
    if (events.length >= 64) {
      overflow += 1;
      return;
    }
    events.push({
      kind,
      ...media,
      method: request.method(),
      resourceType: request.resourceType(),
      status,
    });
  };
  const onRequest = (request: Request) => append('request', request);
  const onResponse = (response: Response) =>
    append('response', response.request(), response.status());
  const onFailed = (request: Request) => append('requestfailed', request);
  context.on('request', onRequest);
  context.on('response', onResponse);
  context.on('requestfailed', onFailed);
  return {
    events,
    overflow: () => overflow,
    dispose() {
      context.off('request', onRequest);
      context.off('response', onResponse);
      context.off('requestfailed', onFailed);
    },
  };
}

export function managerDetailsUrl(browserName: string, id: string) {
  assert(['chrome', 'msedge'].includes(browserName), 'Unsupported manager browser');
  return `${browserName === 'msedge' ? 'edge' : 'chrome'}://extensions/?id=${encodeURIComponent(id)}`;
}

export async function probeManagerUserScripts(page: Page) {
  try {
    return await page.evaluate(async () => {
      try {
        const scripts = await chrome.userScripts.getScripts();
        return { available: true, registeredScriptCount: scripts.length };
      } catch (error) {
        return {
          available: false,
          errorType:
            error !== null &&
            (typeof error === 'object' || typeof error === 'function') &&
            'name' in error &&
            typeof error.name === 'string'
              ? error.name
              : typeof error,
        };
      }
    });
  } catch {
    return { available: false, errorType: 'PageEvaluationError' };
  }
}

export async function findEdgeUserScriptsControl(page: Page, managerId: string) {
  assert(/^[a-p]{32}$/u.test(managerId), 'Invalid manager extension ID');
  assert(
    isOwnedManagerDetailsUrl(page.url(), managerDetailsUrl('msedge', managerId)),
    'Edge permission control requires owned extension details'
  );
  const section = page.locator('access-section').filter({
    has: page.getByText(/^(?:사용자 스크립트 허용|Allow user scripts)$/iu),
  });
  await section.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await section.count(), 1, 'Expected exactly one owned Edge access section');
  assert(
    await section.evaluate((element, id) => element.id === id, managerId),
    'Labeled Edge access section belongs to another extension'
  );
  const row = section.locator('standard-row').filter({
    has: page.getByText(/^(?:사용자 스크립트 허용|Allow user scripts)$/iu),
  });
  assert.equal(await row.count(), 1, 'Expected exactly one labeled Edge user-scripts row');
  const control = row.locator('fluent-switch#checkbox-1');
  await control.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await control.count(), 1, 'Expected exactly one Edge user-scripts switch');
  assert(await control.isVisible(), 'Edge user-scripts permission control is hidden');
  return control;
}

export function hasKnownChromeUserScriptsLabel(text: string) {
  return text
    .split(/\r?\n/u)
    .some((line) => /^(?:사용자 스크립트 허용|Allow user scripts)$/iu.test(line.trim()));
}

export function summarizeManagerFrameUrl(value: string, managerId: string) {
  try {
    const url = new URL(value);
    if (['edge:', 'chrome:'].includes(url.protocol) && url.hostname === 'extensions') {
      return `${url.protocol}//${url.hostname}${url.pathname}`;
    }
    if (url.protocol === 'chrome-extension:' && url.hostname === managerId) {
      return `${url.protocol}//${url.hostname}${url.pathname}`;
    }
  } catch {
    /* Unknown frame URLs are deliberately omitted. */
  }
  return null;
}

export function isOwnedManagerDetailsUrl(value: string, detailsUrl: string) {
  try {
    const actual = new URL(value);
    const expected = new URL(detailsUrl);
    return (
      ['edge:', 'chrome:'].includes(expected.protocol) &&
      expected.hostname === 'extensions' &&
      expected.pathname === '/' &&
      expected.searchParams.size === 1 &&
      expected.searchParams.has('id') &&
      actual.href === expected.href
    );
  } catch {
    return false;
  }
}

export function isOwnedManagerInspectionUrl(value: string, detailsUrl: string, managerId: string) {
  if (
    !isOwnedManagerDetailsUrl(detailsUrl, detailsUrl) ||
    new URL(detailsUrl).searchParams.get('id') !== managerId
  ) {
    return false;
  }
  if (isOwnedManagerDetailsUrl(value, detailsUrl)) {
    return true;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === 'chrome-extension:' && url.hostname === managerId && !url.search && !url.hash
    );
  } catch {
    return false;
  }
}

export function isOwnedManagerOptionsUrl(value: string, managerId: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'chrome-extension:' &&
      url.hostname === managerId &&
      url.pathname === '/options.html' &&
      !url.search
    );
  } catch {
    return false;
  }
}

export function isOwnedManagerPermissionAskUrl(value: string, managerId: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'chrome-extension:' &&
      url.hostname === managerId &&
      url.pathname === '/ask.html' &&
      !url.hash &&
      url.searchParams.size === 1 &&
      Boolean(url.searchParams.get('aid'))
    );
  } catch {
    return false;
  }
}

export function requireManagerDownloadsHeading(actual: string, localizedDownloads: string) {
  assert.equal(
    actual.trim(),
    `${localizedDownloads} BETA`,
    'Manager Downloads section label differs'
  );
}

export function managerSettingRowLabel(localizedName: string) {
  return `${localizedName}:`;
}

export function managerSettingRow(scope: Page | Locator, localizedName: string) {
  const settingRowClass = 'contains(concat(" ", normalize-space(@class), " "), " settingstr ")';
  return scope
    .getByText(managerSettingRowLabel(localizedName), { exact: true })
    .locator(`xpath=ancestor::tr[${settingRowClass}][not(descendant::tr[${settingRowClass}])]`);
}

export async function captureAndConfirmManagerPermissionAsk(
  ask: Page,
  managerId: string,
  output: string | null,
  okLabel: string
) {
  assert(
    isOwnedManagerPermissionAskUrl(ask.url(), managerId),
    'Manager permission confirmation navigated away'
  );
  if (output) {
    const screenshot = await ask.screenshot();
    assert(
      isOwnedManagerPermissionAskUrl(ask.url(), managerId),
      'Manager permission confirmation navigated away during capture'
    );
    await writeFile(join(output, 'userscript-manager-download-permission.png'), screenshot);
  }
  assert(
    isOwnedManagerPermissionAskUrl(ask.url(), managerId),
    'Manager permission confirmation navigated away before confirmation'
  );
  await ask.getByRole('button', { name: okLabel, exact: true }).click();
}

export function requireManagerUiLabels(labels: ManagerUiLabels) {
  assert(
    labels && typeof labels === 'object' && !Array.isArray(labels),
    'Manager returned invalid UI labels'
  );
  assert.deepEqual(
    Object.keys(labels).sort(),
    ['install', 'installedUserscripts', 'utilities'],
    'Manager UI label keys differ'
  );
  for (const value of Object.values(labels)) {
    assert(
      typeof value === 'string' &&
        value.length > 0 &&
        value.length <= 80 &&
        value.trim() === value &&
        !Array.from(value).some((character) => character.charCodeAt(0) < 32),
      'Manager returned an invalid UI label'
    );
  }
  return labels;
}

export async function readManagerUiLabels(page: Page, managerId: string) {
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager labels require its owned options page'
  );
  const labels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (
      url.protocol !== 'chrome-extension:' ||
      url.hostname !== expectedId ||
      url.pathname !== '/options.html' ||
      url.search
    ) {
      throw new Error('Manager options page navigated away');
    }
    return {
      utilities: chrome.i18n.getMessage('Utilities'),
      install: chrome.i18n.getMessage('Install'),
      installedUserscripts: chrome.i18n.getMessage('Installed_userscripts'),
    };
  }, managerId);
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager options page navigated away after label lookup'
  );
  return requireManagerUiLabels(labels);
}

async function openManagerDomainBlacklist(page: Page, managerId: string, output: string) {
  const optionsUrl = `chrome-extension://${managerId}/options.html`;
  await page.goto(optionsUrl, { waitUntil: 'domcontentloaded' });
  const labels = await readManagerUiLabels(page, managerId);
  const securityLabels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (
      url.protocol !== 'chrome-extension:' ||
      url.hostname !== expectedId ||
      url.pathname !== '/options.html' ||
      url.search
    ) {
      throw new Error('Manager security settings navigated away');
    }
    return {
      settings: chrome.i18n.getMessage('Settings'),
      security: chrome.i18n.getMessage('XHR_Security'),
      blacklist: chrome.i18n.getMessage('User_domain_blacklist'),
      add: chrome.i18n.getMessage('Add'),
      remove: chrome.i18n.getMessage('Remove'),
      prompt: chrome.i18n.getMessage('Enter_the_new_rule'),
    };
  }, managerId);
  assert(
    Object.values(securityLabels).every(
      (label) =>
        typeof label === 'string' &&
        label.length > 0 &&
        label.length <= 120 &&
        label.trim() === label
    ),
    'Manager returned invalid security setting labels'
  );
  await page.getByText(labels.installedUserscripts, { exact: true }).first().click();
  const row = await requireInstalledManagerRow(page, output, 'security');
  await row.locator(MANAGER_SCRIPT_NAME_SELECTOR).click();
  const settingsTab = page
    .locator('div[tvid="settings"][name^="tabview_tab"]:not([name="tabview_tabmain"]):visible')
    .filter({
      hasText: securityLabels.settings,
    });
  await settingsTab.waitFor({ state: 'visible' });
  assert.equal(await settingsTab.count(), 1, 'Expected one script-specific Settings tab');
  await settingsTab.click();
  const heading = page.locator('div.section_head:visible').filter({
    hasText: securityLabels.security,
  });
  await heading.waitFor({ state: 'visible' });
  assert.equal(await heading.count(), 1, 'Expected one script-specific XHR Security heading');
  assert.equal(
    (await heading.innerText()).trim(),
    securityLabels.security,
    'Manager XHR Security heading differs'
  );
  const section = heading.locator('xpath=..');
  assert.equal(await section.count(), 1, 'Expected one script-specific XHR Security section');
  assert.equal(
    await section.evaluate((element) => element.classList.contains('section')),
    true,
    'Manager XHR Security heading is outside a section'
  );
  const blacklist = section
    .getByText(securityLabels.blacklist, { exact: true })
    .locator(
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " cludes ")][1]'
    );
  assert.equal(await blacklist.count(), 1, 'Expected one script-specific domain blacklist');
  assert.equal(
    await blacklist.locator('select').count(),
    1,
    'Expected one domain blacklist selector'
  );
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager security settings navigated away'
  );
  return { blacklist, labels: securityLabels };
}

async function managerDomainBlacklistValues(blacklist: Locator) {
  return blacklist.locator('select').evaluate((element) => {
    if (!(element instanceof HTMLSelectElement)) {
      throw new Error('Manager domain blacklist is not a selector');
    }
    return Array.from(element.options, (option) => option.value);
  });
}

async function waitForManagerDomainBlacklist(
  page: Page,
  managerId: string,
  output: string,
  expected: string[]
) {
  return waitFor(async () => {
    const view = await openManagerDomainBlacklist(page, managerId, output);
    const values = await managerDomainBlacklistValues(view.blacklist);
    return JSON.stringify(values) === JSON.stringify(expected) ? view : undefined;
  }, 'persisted script-specific manager domain blacklist');
}

export async function probeManagerDownloadsPermission(page: Page, managerId: string) {
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager downloads permission requires its owned options page'
  );
  const granted = await page.evaluate(async (expectedId) => {
    const url = new URL(location.href);
    if (
      url.protocol !== 'chrome-extension:' ||
      url.hostname !== expectedId ||
      url.pathname !== '/options.html' ||
      url.search
    ) {
      throw new Error('Manager options page navigated away');
    }
    return chrome.permissions.contains({ permissions: ['downloads'] });
  }, managerId);
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager options page navigated away after permission lookup'
  );
  assert.equal(typeof granted, 'boolean', 'Manager returned invalid downloads permission');
  return granted;
}

/** Select Tampermonkey's own Browser API option through its ordinary options UI. */
export async function configureManagerBrowserDownloads(
  page: Page,
  managerId: string,
  output: string,
  captureNativePermission: (
    ask: Page,
    managerId: string,
    context: BrowserContext
  ) => Promise<unknown> = async () => null
) {
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager download settings require its owned options page'
  );
  const labels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (
      url.protocol !== 'chrome-extension:' ||
      url.hostname !== expectedId ||
      url.pathname !== '/options.html' ||
      url.search
    ) {
      throw new Error('Manager options page navigated away');
    }
    return {
      Settings: chrome.i18n.getMessage('Settings'),
      Config_Mode: chrome.i18n.getMessage('Config_Mode'),
      Beginner: chrome.i18n.getMessage('Beginner'),
      Downloads: chrome.i18n.getMessage('Downloads'),
      Download_Mode: chrome.i18n.getMessage('Download_Mode'),
      Browser_API: chrome.i18n.getMessage('Browser_API'),
      Whitelisted_File_Extensions: chrome.i18n.getMessage('Whitelisted_File_Extensions'),
      Save: chrome.i18n.getMessage('Save'),
      Browser_API_Downloads: chrome.i18n.getMessage('Browser_API_Downloads'),
      Click_here_to_allow_TM_to_start_downloads: chrome.i18n.getMessage(
        'Click_here_to_allow_TM_to_start_downloads'
      ),
      Ok: chrome.i18n.getMessage('Ok'),
    };
  }, managerId);
  for (const label of Object.values(labels)) {
    assert(
      typeof label === 'string' && label.length > 0 && label.length <= 120,
      'Manager returned an invalid download setting label'
    );
  }
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await page.getByText(labels.Settings, { exact: true }).first().click();
  const configRow = managerSettingRow(page, labels.Config_Mode);
  await configRow.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await configRow.count(), 1, 'Expected exactly one manager config-mode row');
  const configSelect = configRow.locator('select');
  assert.equal(await configSelect.count(), 1, 'Expected one manager config-mode selector');
  await configSelect.selectOption({ label: labels.Beginner });
  assert.equal(await configSelect.inputValue(), '50', 'Manager did not select Beginner mode');
  const downloads = page.locator('div.section.type_downloads');
  await downloads.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await downloads.count(), 1, 'Expected exactly one manager Downloads section');
  requireManagerDownloadsHeading(
    await downloads.locator('.section_head').innerText(),
    labels.Downloads
  );
  const whitelistRow = managerSettingRow(downloads, labels.Whitelisted_File_Extensions);
  assert.equal(await whitelistRow.count(), 1, 'Expected exactly one manager whitelist row');
  const whitelist = await whitelistRow.locator('input, textarea').evaluateAll((elements) =>
    elements
      .slice(0, 64)
      .map((element) =>
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
          ? element.value
          : null
      )
      .filter((value) => typeof value === 'string')
  );
  assert(
    whitelist.some((value) => value.includes('jpe?g')) &&
      whitelist.some((value) => value.includes('zip')),
    'Manager whitelist does not visibly include JPG and ZIP'
  );
  const modeRow = managerSettingRow(downloads, labels.Download_Mode);
  assert.equal(await modeRow.count(), 1, 'Expected exactly one manager Download Mode row');
  const modeSelect = modeRow.locator('select');
  assert.equal(await modeSelect.count(), 1, 'Expected one manager Download Mode selector');
  await modeSelect.selectOption({ label: labels.Browser_API });
  assert.equal(await modeSelect.inputValue(), 'chrome', 'Manager did not select Browser API');
  const save = downloads.getByRole('button', { name: labels.Save, exact: true });
  assert.equal(await save.count(), 1, 'Expected exactly one manager Downloads Save button');
  assert.equal(await save.inputValue(), labels.Save, 'Manager Downloads Save label differs');
  const context = page.context();
  const permissionWasGranted = await probeManagerDownloadsPermission(page, managerId);
  const askPromise = permissionWasGranted
    ? null
    : context
        .waitForEvent('page', {
          timeout: 5_000,
        })
        .catch(() => null);
  await save.click();
  let permissionAskShown = false;
  let permissionOkClicked = false;
  const ask = await askPromise;
  if (ask) {
    await ask.waitForURL(`chrome-extension://${managerId}/ask.html*`, { timeout: 5_000 });
    assert(
      isOwnedManagerPermissionAskUrl(ask.url(), managerId),
      'Manager permission confirmation navigated away'
    );
    await ask
      .getByText(labels.Browser_API_Downloads, { exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 });
    await ask
      .getByText(labels.Click_here_to_allow_TM_to_start_downloads, { exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 });
    permissionAskShown = true;
    assert(
      isOwnedManagerPermissionAskUrl(ask.url(), managerId),
      'Manager permission confirmation navigated away'
    );
    await captureAndConfirmManagerPermissionAsk(ask, managerId, output, labels.Ok);
    permissionOkClicked = true;
  }
  const nativeDiagnostic =
    permissionOkClicked && ask ? await captureNativePermission(ask, managerId, context) : null;
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await page.getByText(labels.Settings, { exact: true }).first().click();
  const savedMode = managerSettingRow(
    page.locator('div.section.type_downloads'),
    labels.Download_Mode
  ).locator('select');
  await savedMode.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await savedMode.count(), 1, 'Expected one saved manager Download Mode selector');
  const observed = await savedMode.inputValue();
  assert.equal(observed, 'chrome', 'Manager Browser API mode did not persist');
  const downloadsPermissionGranted = await probeManagerDownloadsPermission(page, managerId);
  return {
    requested: 'chrome',
    observed,
    configMode: '50',
    whitelistJpgZipPresent: true,
    permissionAskShown,
    permissionOkClicked,
    downloadsPermissionGranted,
    permissionPending: !downloadsPermissionGranted,
    nativeDiagnostic,
  };
}

/** Enable only the ordinary Info setting in this owned manager profile. */
export async function configureManagerInfoLogging(page: Page, managerId: string) {
  assert(
    isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager logging requires its owned options page'
  );
  const labels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (
      url.protocol !== 'chrome-extension:' ||
      url.hostname !== expectedId ||
      url.pathname !== '/options.html' ||
      url.search
    ) {
      throw new Error('Manager options page navigated away');
    }
    return {
      Settings: chrome.i18n.getMessage('Settings'),
      General: chrome.i18n.getMessage('General'),
      LogLevel: chrome.i18n.getMessage('LogLevel'),
      Info: chrome.i18n.getMessage('Info'),
    };
  }, managerId);
  for (const label of Object.values(labels)) {
    assert(
      typeof label === 'string' &&
        label.length > 0 &&
        label.length <= 120 &&
        label.trim() === label &&
        !Array.from(label).some((character) => character.charCodeAt(0) < 32),
      'Manager returned an invalid logging label'
    );
  }
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await page.getByText(labels.Settings, { exact: true }).first().click();
  const general = page.locator('div.section.type_general');
  await general.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await general.count(), 1, 'Expected exactly one manager General section');
  assert.equal(
    (await general.locator('.section_head').innerText()).trim(),
    labels.General,
    'Manager General heading differs'
  );
  const row = managerSettingRow(general, labels.LogLevel);
  await row.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await row.count(), 1, 'Expected exactly one manager LogLevel row');
  const select = row.locator('select');
  assert.equal(await select.count(), 1, 'Expected one manager LogLevel selector');
  const original = await select.inputValue();
  assert(['0', '30', '60', '80'].includes(original), 'Unknown manager LogLevel value');
  const info = select.locator('option[value="60"]');
  assert.equal(await info.count(), 1, 'Expected one manager Info logging option');
  assert.equal((await info.innerText()).trim(), labels.Info, 'Manager Info label differs');
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await select.selectOption({ label: labels.Info });
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  assert.equal(await select.inputValue(), '60', 'Manager did not select Info logging');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await page.getByText(labels.Settings, { exact: true }).first().click();
  const savedGeneral = page.locator('div.section.type_general');
  await savedGeneral.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await savedGeneral.count(), 1, 'Expected one saved manager General section');
  const savedRow = managerSettingRow(savedGeneral, labels.LogLevel);
  await savedRow.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await savedRow.count(), 1, 'Expected one saved manager LogLevel row');
  const savedSelect = savedRow.locator('select');
  assert.equal(await savedSelect.count(), 1, 'Expected one saved manager LogLevel selector');
  const observed = await savedSelect.inputValue();
  assert.equal(observed, '60', 'Manager Info logging did not persist');
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  return { original, requested: '60', observed, scope: 'fresh-owned-profile' };
}

async function captureManagerDownloadsPermission(context: BrowserContext, managerId: string) {
  let page: Page | undefined;
  try {
    page = await context.newPage();
    await page.goto(`chrome-extension://${managerId}/options.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10_000,
    });
    return { granted: await probeManagerDownloadsPermission(page, managerId) };
  } catch (error) {
    return { errorType: error instanceof Error ? error.name : typeof error };
  } finally {
    await page?.close().catch(() => {});
  }
}

/** Run only in the owned manager options page; return no download URL or local path. */
export async function inspectManagerDownloadHistoryDocument({
  managerId,
  fixtureUrl,
  expectedName,
  expectedPath,
  expectedBytes,
}: {
  managerId: string;
  fixtureUrl: string;
  expectedName: string;
  expectedPath: string;
  expectedBytes: number;
}): Promise<ManagerHistory> {
  const current = new URL(location.href);
  if (
    current.protocol !== 'chrome-extension:' ||
    current.hostname !== managerId ||
    current.pathname !== '/options.html' ||
    current.search ||
    current.hash
  ) {
    return { status: 'unowned-page', items: [] };
  }
  if (!chrome.downloads?.search) {
    return { status: 'api-unavailable', items: [] };
  }
  let found: Awaited<ReturnType<typeof chrome.downloads.search>>;
  try {
    found = await chrome.downloads.search({ url: fixtureUrl, limit: 9 });
  } catch {
    return { status: 'query-rejected', items: [] };
  }
  if (!Array.isArray(found)) {
    return { status: 'invalid-result', items: [] };
  }
  if (found.length > 8) {
    return { status: 'overflow', items: [] };
  }
  const reasons = new Set([
    'FILE_FAILED',
    'FILE_ACCESS_DENIED',
    'FILE_NO_SPACE',
    'FILE_NAME_TOO_LONG',
    'FILE_TOO_LARGE',
    'FILE_VIRUS_INFECTED',
    'FILE_TRANSIENT_ERROR',
    'FILE_BLOCKED',
    'FILE_SECURITY_CHECK_FAILED',
    'FILE_TOO_SHORT',
    'FILE_HASH_MISMATCH',
    'FILE_SAME_AS_SOURCE',
    'NETWORK_FAILED',
    'NETWORK_TIMEOUT',
    'NETWORK_DISCONNECTED',
    'NETWORK_SERVER_DOWN',
    'NETWORK_INVALID_REQUEST',
    'SERVER_FAILED',
    'SERVER_NO_RANGE',
    'SERVER_BAD_CONTENT',
    'SERVER_UNAUTHORIZED',
    'SERVER_CERT_PROBLEM',
    'SERVER_FORBIDDEN',
    'SERVER_UNREACHABLE',
    'SERVER_CONTENT_LENGTH_MISMATCH',
    'SERVER_CROSS_ORIGIN_REDIRECT',
    'USER_CANCELED',
    'USER_SHUTDOWN',
    'CRASH',
  ]);
  const items: ManagerHistoryItem[] = [];
  for (const item of found) {
    if (item?.url !== fixtureUrl) {
      continue;
    }
    if (
      !Number.isSafeInteger(item.id) ||
      item.id < 0 ||
      !['in_progress', 'interrupted', 'complete'].includes(item.state)
    ) {
      return { status: 'invalid-item', items: [] };
    }
    const nameMatch =
      typeof item.filename === 'string' && item.filename.split(/[\\/]/u).at(-1) === expectedName;
    const pathMatch =
      typeof item.filename === 'string' &&
      item.filename.replaceAll('/', '\\').toLowerCase() ===
        expectedPath.replaceAll('/', '\\').toLowerCase();
    const finalUrl: unknown = Reflect.get(item, 'finalUrl');
    items.push({
      id: item.id,
      state: item.state,
      ...(finalUrl === 'https://pbs.twimg.com/media/xeg-owned-redirect-final.jpg'
        ? { declaredRedirectFinalUrlMatch: true as const }
        : {}),
      interruptReason:
        item.error === undefined ? null : reasons.has(item.error) ? item.error : 'unknown',
      requestedNameMatch: nameMatch,
      ownedPathMatch: pathMatch,
      expectedSizeMatch: item.fileSize === expectedBytes,
      fixtureUrlMatch: true,
    });
  }
  if (new Set(items.map(({ id }) => id)).size !== items.length) {
    return { status: 'ambiguous-ids', items: [] };
  }
  return { status: 'observed', items };
}

async function captureManagerDownloadHistory(
  context: BrowserContext,
  managerId: string,
  downloads: string,
  savedName: string,
  expectedBytes: number
): Promise<ManagerHistory> {
  let page: Page | undefined;
  try {
    page = await context.newPage();
    await page.goto(`chrome-extension://${managerId}/options.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10_000,
    });
    if (!isOwnedManagerOptionsUrl(page.url(), managerId)) {
      return { status: 'unowned-page', items: [] };
    }
    const result = await page.evaluate(inspectManagerDownloadHistoryDocument, {
      managerId,
      fixtureUrl: FIRST_MEDIA_URL,
      expectedName: savedName,
      expectedPath: join(downloads, savedName),
      expectedBytes,
    });
    if (!isOwnedManagerOptionsUrl(page.url(), managerId)) {
      return { status: 'unowned-page', items: [] };
    }
    return result;
  } catch (error) {
    return {
      status: 'capture-error',
      errorType: error instanceof Error ? error.name : typeof error,
      items: [],
    };
  } finally {
    await page?.close().catch(() => {});
  }
}

export function firstCurrentManagerDownloadHistory(before: ManagerHistory, after: ManagerHistory) {
  if (before.status !== 'observed' || after.status !== 'observed') {
    return {
      status: 'unknown',
      baselineStatus: before.status,
      queryStatus: after.status,
      items: [],
    };
  }
  const seen = new Set(before.items.map(({ id }) => id));
  const items = after.items.filter(({ id }) => !seen.has(id));
  return {
    status: items.length > 1 ? 'ambiguous' : 'observed',
    baselineCount: before.items.length,
    items: items.length > 1 ? [] : items,
  };
}

/** Each action must produce one new, complete native item with the exact saved file. */
export function selectCompletedManagerDownload(before: ManagerHistory, after: ManagerHistory) {
  assert.equal(before.status, 'observed', 'Native download baseline is unavailable');
  assert.equal(after.status, 'observed', 'Native download history is unavailable');
  const seen = new Set(before.items.map(({ id }) => id));
  const created = after.items.filter(({ id }) => !seen.has(id));
  assert(created.length <= 1, 'One action created multiple native download items');
  if (!created.length) {
    return undefined;
  }
  const item = created[0];
  assert(item);
  if (item.state === 'in_progress') {
    return undefined;
  }
  assert.equal(item.state, 'complete', 'Native download did not complete');
  assert.equal(item.interruptReason, null, 'Completed native download has an interrupt reason');
  assert.equal(item.fixtureUrlMatch, true, 'Native download URL differs');
  assert.equal(item.requestedNameMatch, true, 'Native saved filename differs');
  assert.equal(item.ownedPathMatch, true, 'Native download escaped the owned directory');
  assert.equal(item.expectedSizeMatch, true, 'Native download size differs');
  return {
    nativeId: item.id,
    nativeState: 'complete',
    ...(item.declaredRedirectFinalUrlMatch && { declaredRedirectFinalUrlMatch: true }),
    completionSource: 'chrome.downloads.search',
  };
}

async function captureManagerPermissionDiagnostics(
  page: Page,
  detailsUrl: string,
  output: string,
  probe: Awaited<ReturnType<typeof probeManagerUserScripts>>
) {
  const managerId = new URL(detailsUrl).searchParams.get('id') ?? '';
  const diagnostics: ManagerPermissionDiagnostics = {
    api: probe,
    requestedUrl: summarizeManagerFrameUrl(detailsUrl, managerId),
  };
  let ownedDetailsPage = false;
  try {
    await page.goto(detailsUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 });
    assert(
      isOwnedManagerDetailsUrl(page.url(), detailsUrl),
      'Permission diagnostic did not reach the owned extension details page'
    );
    ownedDetailsPage = true;
    const title = (await page.title()).slice(0, 120);
    assert(
      isOwnedManagerDetailsUrl(page.url(), detailsUrl),
      'Permission details page navigated away'
    );
    const screenshot = await page.screenshot();
    assert(
      isOwnedManagerDetailsUrl(page.url(), detailsUrl),
      'Permission details page navigated away'
    );
    const allowUserScriptsVisible = await page.locator('#allow-user-scripts cr-toggle').isVisible();
    const toggleControls = await page.locator('cr-toggle').evaluateAll((elements) =>
      elements.slice(0, 32).map((element) => ({
        id: element.id.slice(0, 80),
        ariaLabel: element.getAttribute('aria-label')?.slice(0, 80) ?? null,
        checked: Boolean('checked' in element && element.checked),
      }))
    );
    assert(
      isOwnedManagerDetailsUrl(page.url(), detailsUrl),
      'Permission details page navigated away'
    );
    await writeFile(join(output, 'userscript-manager-permission.png'), screenshot);
    diagnostics.finalUrl = summarizeManagerFrameUrl(page.url(), managerId);
    diagnostics.title = title;
    diagnostics.allowUserScriptsVisible = allowUserScriptsVisible;
    diagnostics.toggleControls = toggleControls;
  } catch (error) {
    diagnostics.captureErrorType = error instanceof Error ? error.name : typeof error;
  }
  diagnostics.frameCount = page.frames().length;
  if (!ownedDetailsPage || !isOwnedManagerDetailsUrl(page.url(), detailsUrl)) {
    const skipped = {
      api: probe,
      requestedUrl: diagnostics.requestedUrl,
      frameCount: diagnostics.frameCount,
      captureErrorType: diagnostics.captureErrorType ?? null,
      contentSkipped: 'unowned-or-unavailable-details-page',
    };
    await writeFile(
      join(output, 'userscript-manager-permission.json'),
      JSON.stringify(skipped, null, 2)
    );
    return;
  }
  try {
    const frames = page.frames();
    diagnostics.frames = await Promise.all(
      frames.slice(0, 12).map(async (frame, index) => {
        const summary: ManagerFrameSummary = {
          index,
          url: summarizeManagerFrameUrl(frame.url(), managerId),
        };
        if (
          !isOwnedManagerDetailsUrl(page.url(), detailsUrl) ||
          !isOwnedManagerInspectionUrl(frame.url(), detailsUrl, managerId)
        ) {
          summary.skipped = 'unowned-frame';
          return summary;
        }
        try {
          summary.document = await frame.evaluate(
            ({ expectedDetailsUrl, expectedManagerId }) => {
              const current = new URL(location.href);
              const ownedDetails = location.href === expectedDetailsUrl;
              const ownedExtension =
                current.protocol === 'chrome-extension:' &&
                current.hostname === expectedManagerId &&
                !current.search &&
                !current.hash;
              if (!ownedDetails && !ownedExtension) {
                return { skipped: 'frame-navigated-away' };
              }
              const knownLabels = new Set(['사용자 스크립트 허용', 'Allow user scripts']);
              const describe = (element: Element) => ({
                tag: element.tagName.toLowerCase().slice(0, 40),
                id: element.id?.slice(0, 80) ?? null,
                role: element.getAttribute('role')?.slice(0, 40) ?? null,
                type: element.getAttribute('type')?.slice(0, 40) ?? null,
                label:
                  (
                    element.getAttribute('label') ??
                    ('labels' in element && element.labels instanceof NodeList
                      ? element.labels[0]?.textContent?.trim()
                      : null)
                  )?.slice(0, 80) ?? null,
                ariaLabel: element.getAttribute('aria-label')?.slice(0, 80) ?? null,
                ariaChecked: element.getAttribute('aria-checked')?.slice(0, 12) ?? null,
                checked:
                  'checked' in element && typeof element.checked === 'boolean'
                    ? element.checked
                    : null,
              });
              const labels: {
                ancestry: ReturnType<typeof describe>[];
                nearbyControls: ReturnType<typeof describe>[];
              }[] = [];
              const controls: ReturnType<typeof describe>[] = [];
              const embedded: ReturnType<typeof describe>[] = [];
              let visited = 0;
              const parentElementOrHost = (element: Element): Element | null => {
                const root = element.getRootNode();
                return element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
              };
              const visit = (node: Node) => {
                if (++visited > 4_000) {
                  return;
                }
                if (
                  node.nodeType === Node.TEXT_NODE &&
                  labels.length < 4 &&
                  knownLabels.has(node.textContent?.trim() ?? '')
                ) {
                  const ancestry: ReturnType<typeof describe>[] = [];
                  const nearbyControls: ReturnType<typeof describe>[] = [];
                  for (
                    let element: Element | null = node.parentElement;
                    element && ancestry.length < 5;
                    element = parentElementOrHost(element)
                  ) {
                    ancestry.push(describe(element));
                    if (ancestry.length <= 3) {
                      const candidates = element.querySelectorAll(
                        'input, button, [role="switch"], [role="checkbox"], fluent-switch, cr-toggle'
                      );
                      for (const candidate of Array.from(candidates).slice(0, 8)) {
                        if (nearbyControls.length < 16) {
                          nearbyControls.push(describe(candidate));
                        }
                      }
                    }
                  }
                  labels.push({ ancestry, nearbyControls });
                }
                if (node instanceof Element) {
                  const tag = node.tagName.toLowerCase();
                  if (
                    controls.length < 64 &&
                    (/switch|toggle|checkbox/u.test(tag) ||
                      ['input', 'button'].includes(tag) ||
                      ['switch', 'checkbox'].includes(node.getAttribute('role') ?? ''))
                  ) {
                    controls.push(describe(node));
                  }
                  if (embedded.length < 16 && ['iframe', 'webview', 'object'].includes(tag)) {
                    embedded.push(describe(node));
                  }
                  if (node.shadowRoot) {
                    visit(node.shadowRoot);
                  }
                }
                for (const child of node.childNodes) {
                  if (visited >= 4_000) {
                    break;
                  }
                  visit(child);
                }
              };
              visit(document.documentElement);
              return {
                readyState: document.readyState,
                visitedNodes: visited,
                labelMatches: labels,
                controls,
                embedded,
              };
            },
            { expectedDetailsUrl: detailsUrl, expectedManagerId: managerId }
          );
        } catch (error) {
          summary.errorType = error instanceof Error ? error.name : typeof error;
        }
        return summary;
      })
    );
  } catch (error) {
    diagnostics.frameErrorType = error instanceof Error ? error.name : typeof error;
  }
  if (isOwnedManagerDetailsUrl(page.url(), detailsUrl)) {
    try {
      const snapshot = await page.locator('body').ariaSnapshot({ timeout: 5_000 });
      assert(
        isOwnedManagerDetailsUrl(page.url(), detailsUrl),
        'Permission details page navigated away'
      );
      const safe = snapshot
        .replace(/[A-Za-z]:\\[^\n]*/gu, '[path]')
        .replace(/https?:\/\/[^\s"']+/gu, '[url]');
      const lines = safe.split('\n');
      const labelIndex = lines.findIndex(
        (line) => line.includes('사용자 스크립트 허용') || line.includes('Allow user scripts')
      );
      diagnostics.ariaSnapshot = {
        labelContext:
          labelIndex < 0
            ? null
            : lines
                .slice(Math.max(0, labelIndex - 1), labelIndex + 2)
                .join('\n')
                .slice(0, 1_024),
      };
    } catch (error) {
      diagnostics.ariaSnapshotErrorType = error instanceof Error ? error.name : typeof error;
    }
  }
  if (!isOwnedManagerDetailsUrl(page.url(), detailsUrl)) {
    const skipped = {
      api: probe,
      requestedUrl: diagnostics.requestedUrl,
      frameCount: diagnostics.frameCount,
      contentSkipped: 'details-page-navigated-away',
    };
    await writeFile(
      join(output, 'userscript-manager-permission.json'),
      JSON.stringify(skipped, null, 2)
    );
    return;
  }
  await writeFile(
    join(output, 'userscript-manager-permission.json'),
    JSON.stringify(diagnostics, null, 2)
  );
}

async function installUserscript(
  context: BrowserContext,
  id: string,
  root: string,
  output: string,
  browserName: string,
  sourceSha256: string,
  profile: string,
  captureNativePermission: (
    ask: Page,
    managerId: string,
    context: BrowserContext
  ) => Promise<unknown>,
  sourcePath = 'dist/xcom-enhanced-gallery.user.js',
  sourceVersion: string | null = null
) {
  const manifest = JSON.parse(
    await readFile(join(root, 'test-tools/userscript-manager/manifest.json'), 'utf8')
  );
  assert(/^\d+(?:\.\d+){1,3}$/.test(manifest.version), 'Manager version is invalid');
  assert(manifest.permissions?.includes('userScripts'), 'Manager lacks userScripts permission');
  const page = await context.newPage();
  const detailsUrl = managerDetailsUrl(browserName, id);
  const optionsUrl = `chrome-extension://${id}/options.html`;
  try {
    await page.goto(optionsUrl);
    let permission = await probeManagerUserScripts(page);
    let permissionPath = 'already-enabled';
    if (!permission.available) {
      try {
        await page.goto(detailsUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 });
        if (browserName === 'msedge') {
          const control = await findEdgeUserScriptsControl(page, id);
          if (!(await control.evaluate((element) => 'checked' in element && element.checked))) {
            await control.click();
          }
          await waitFor(
            async () =>
              (await control.evaluate((element) => 'checked' in element && element.checked))
                ? true
                : undefined,
            'Edge user-scripts permission enabled',
            5_000
          );
          await page.reload({ waitUntil: 'domcontentloaded' });
          assert(
            isOwnedManagerDetailsUrl(page.url(), detailsUrl),
            'Edge extension details navigated away after permission change'
          );
          permissionPath = 'edge-labeled-ui-control';
        } else {
          const toggle = page.locator('#allow-user-scripts cr-toggle');
          const label = page.locator('#allow-user-scripts');
          if (
            (await toggle.count()) !== 1 ||
            !(await toggle.isVisible()) ||
            (await label.count()) !== 1 ||
            !hasKnownChromeUserScriptsLabel(await label.innerText())
          ) {
            throw new Error(
              'Manager userScripts API unavailable and no verified UI permission control'
            );
          }
          if (!(await toggle.evaluate((element) => 'checked' in element && element.checked))) {
            await toggle.click();
          }
          assert(
            await toggle.evaluate((element) => 'checked' in element && element.checked),
            'Manager user-scripts control stayed disabled'
          );
          const keep = page.getByRole('button', { name: 'Keep', exact: true });
          if (await keep.isVisible()) {
            await keep.click();
          }
          const reload = page.locator('extensions-detail-view #dev-reload-button');
          assert(
            await reload.isVisible(),
            'Manager permission changed but extension reload control is unavailable'
          );
          const restarted = context.waitForEvent('serviceworker', {
            predicate: (worker) => worker.url().startsWith(`chrome-extension://${id}/`),
            timeout: 15_000,
          });
          await reload.click();
          await restarted;
          permissionPath = 'chrome-labeled-ui-toggle-and-reload';
        }
        await page.goto(optionsUrl);
        permission = await probeManagerUserScripts(page);
        assert(
          permission.available,
          'Manager userScripts API unavailable after UI permission change'
        );
      } catch (error) {
        await captureManagerPermissionDiagnostics(page, detailsUrl, output, permission);
        throw error;
      }
    }
    assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page is not owned');
    const admission = {
      browserName,
      managerId: id,
      managerVersion: manifest.version,
      sourceSha256,
      permission: {
        path: permissionPath,
        available: permission.available,
        registeredScriptCount: permission.registeredScriptCount,
      },
    };
    const admissionPath = join(output, 'userscript-manager-admission.json');
    await writeFile(admissionPath, JSON.stringify(admission, null, 2));
    const optionsScreenshot = await page.screenshot();
    assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page navigated away');
    await writeFile(join(output, 'userscript-manager-options.png'), optionsScreenshot);
    const labels = await readManagerUiLabels(page, id);
    await writeFile(admissionPath, JSON.stringify({ ...admission, labels }, null, 2));
    let downloadMode: Awaited<ReturnType<typeof configureManagerBrowserDownloads>>;
    try {
      downloadMode = await configureManagerBrowserDownloads(
        page,
        id,
        output,
        captureNativePermission
      );
    } catch (error) {
      const ownedOptions = isOwnedManagerOptionsUrl(page.url(), id);
      const diagnostic: {
        errorType: string;
        ownedOptions: boolean;
        downloadsSections: number | null;
        captureErrorType: string | null;
      } = {
        errorType: error instanceof Error ? error.name : typeof error,
        ownedOptions,
        downloadsSections: null,
        captureErrorType: null,
      };
      if (ownedOptions) {
        try {
          diagnostic.downloadsSections = await page.locator('div.section.type_downloads').count();
          const screenshot = await page.screenshot();
          assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page navigated away');
          await writeFile(
            join(output, 'userscript-manager-download-settings-failed.png'),
            screenshot
          );
        } catch (captureError) {
          diagnostic.captureErrorType =
            captureError instanceof Error ? captureError.name : typeof captureError;
        }
      }
      await writeFile(
        join(output, 'userscript-manager-download-settings-failed.json'),
        JSON.stringify(diagnostic, null, 2)
      );
      throw error;
    }
    await writeFile(admissionPath, JSON.stringify({ ...admission, labels, downloadMode }, null, 2));
    assertOwned(root, profile);
    assert.equal(manifest.version, '5.5.1', 'Unknown manager logging source version');
    assert.equal(
      sha256(await readFile(join(root, 'test-tools/userscript-manager/background.js'))),
      MANAGER_BACKGROUND_SHA256,
      'Manager logging source changed'
    );
    const logging = await configureManagerInfoLogging(page, id);
    await writeFile(
      admissionPath,
      JSON.stringify({ ...admission, labels, downloadMode, logging }, null, 2)
    );
    await page.getByText(labels.utilities, { exact: true }).click();
    const confirmationPromise = context.waitForEvent('page');
    await page.locator('input[type=file]').setInputFiles(join(root, sourcePath));
    const confirmation = await confirmationPromise;
    await confirmation.waitForURL(`chrome-extension://${id}/ask.html*`);
    const confirmationUrl = new URL(confirmation.url());
    assert(
      confirmationUrl.protocol === 'chrome-extension:' &&
        confirmationUrl.hostname === id &&
        confirmationUrl.pathname === '/ask.html',
      'Manager confirmation page is not owned'
    );
    const closed = confirmation.waitForEvent('close');
    await confirmation.getByRole('button', { name: labels.install, exact: true }).click();
    await closed;
    await page.reload();
    assert(
      isOwnedManagerOptionsUrl(page.url(), id),
      'Manager options page is not owned after reload'
    );
    await page.getByText(labels.installedUserscripts, { exact: true }).first().click();
    const installedRow = await requireInstalledManagerRow(page, output, 'installed');
    if (sourceVersion) {
      assert.match(
        await installedRow.innerText(),
        new RegExp(`\\b${sourceVersion.replaceAll('.', '\\.')}\\b`, 'u')
      );
    }
    await page.screenshot({ path: join(output, 'userscript-installed.png') });
    return {
      id,
      managerName: 'Tampermonkey',
      managerVersion: manifest.version,
      scriptName: SCRIPT_NAME,
      method: 'real-manager-ui-import',
      userScriptsPermission: {
        path: permissionPath,
        available: permission.available,
        registeredScriptCount: permission.registeredScriptCount,
      },
      downloadMode,
      logging,
    };
  } finally {
    await page.close();
  }
}

/** Browser-level events require no optional permissions from Tampermonkey. */
export function createBrowserDownloadObserver(cdp: CDPSession) {
  const begun: BrowserDownloadBegin[] = [];
  const progress = new Map<string, BrowserDownloadStatus>();
  const onBegin = (event: BrowserDownloadBegin) => {
    assert(begun.length < MAX_DOWNLOADS + 4, 'Too many task-profile downloads');
    begun.push({ guid: event.guid, suggestedFilename: event.suggestedFilename, url: event.url });
  };
  const onProgress = (event: BrowserDownloadProgress) => {
    progress.set(event.guid, {
      state: event.state,
      receivedBytes: event.receivedBytes,
      totalBytes: event.totalBytes,
      filePath: event.filePath ?? null,
    });
  };
  cdp.on('Browser.downloadWillBegin', onBegin);
  cdp.on('Browser.downloadProgress', onProgress);
  return {
    snapshot: () => begun.length,
    events: () =>
      begun.map(({ guid, suggestedFilename, url }) => ({
        guid,
        suggestedFilename,
        source: summarizeDownloadUrl(url),
      })),
    async flush() {
      await cdp.send('Browser.getVersion');
    },
    async waitForCompletion(since: number, ...expectedNames: string[]) {
      const item = await waitFor(
        () => {
          const created = begun.slice(since);
          assert(created.length <= 1, `One action created ${created.length} native downloads`);
          if (!created.length) {
            return undefined;
          }
          const candidate = created[0];
          assert(candidate);
          assert(
            expectedNames.includes(candidate.suggestedFilename),
            'Browser download request used an unexpected filename'
          );
          const status = progress.get(candidate.guid);
          if (status?.state === 'canceled') {
            throw new Error('Browser canceled the native download');
          }
          return status?.state === 'completed' ? { ...candidate, ...status } : undefined;
        },
        `CDP native completion of ${expectedNames[0]}`,
        30_000
      );
      return item;
    },
    async assertNoneSince(since: number, label: string) {
      await cdp.send('Browser.getVersion');
      assert.deepEqual(begun.slice(since), [], `${label} created a native download`);
    },
    dispose() {
      cdp.off('Browser.downloadWillBegin', onBegin);
      cdp.off('Browser.downloadProgress', onProgress);
    },
  };
}

async function waitForDownload(
  observer: ReturnType<typeof createBrowserDownloadObserver>,
  since: number,
  beforeFiles: Set<string>,
  requestedName: string,
  savedName: string,
  downloads: string,
  expectedBytes: number
) {
  const item = await observer.waitForCompletion(since, requestedName, savedName);
  const source = requestedName.endsWith('.zip')
    ? requirePageBlobZipSource(item.url)
    : summarizeDownloadUrl(item.url);
  if (item.filePath !== null) {
    assert(
      resolve(item.filePath) === resolve(downloads, savedName),
      'CDP completed a file outside the exact owned download path'
    );
  }
  const bytes = await readOwnedDownload(beforeFiles, savedName, downloads, expectedBytes);
  return {
    guid: item.guid,
    requestedName,
    filename: savedName,
    source,
    bytes,
    sha256: sha256(bytes),
    nativeState: item.state,
    browserBytesReceived: item.receivedBytes,
  };
}

async function readOwnedDownload(
  beforeFiles: Set<string>,
  savedName: string,
  downloads: string,
  expectedBytes: number
) {
  const added = await waitFor(async () => {
    const names = await readdir(downloads);
    const newNames = names.filter(
      (name) => !beforeFiles.has(name) && !name.endsWith('.crdownload')
    );
    assert(newNames.length <= 1, `One action saved ${newNames.length} files`);
    return newNames.length ? newNames : undefined;
  }, `native saved file for ${savedName}`);
  assert(added.length === 1 && added[0] === savedName, 'Native saved filename differs');
  const { bytes } = await readExactDownloadFile(join(downloads, savedName), expectedBytes);
  assert.equal(
    (await readdir(downloads)).filter((name) => name.endsWith('.crdownload')).length,
    0,
    'Partial native download remained'
  );
  return bytes;
}

async function waitForManagerDownload(
  context: BrowserContext,
  managerId: string,
  observer: ReturnType<typeof createBrowserDownloadObserver>,
  since: number,
  beforeFiles: Set<string>,
  historyBefore: ManagerHistory,
  requestedName: string,
  savedName: string,
  downloads: string,
  expectedBytes: number
) {
  const native = await waitFor(
    async () =>
      selectCompletedManagerDownload(
        historyBefore,
        await captureManagerDownloadHistory(context, managerId, downloads, savedName, expectedBytes)
      ),
    `native manager completion of ${savedName}`,
    30_000
  );
  const bytes = await readOwnedDownload(beforeFiles, savedName, downloads, expectedBytes);
  await observer.flush();
  const cdpCount = observer.snapshot() - since;
  assert(cdpCount <= 1, 'One manager action created multiple CDP downloads');
  const cdpItem = cdpCount
    ? await observer.waitForCompletion(since, requestedName, savedName)
    : null;
  if (cdpItem) {
    assert(cdpItem.url === FIRST_MEDIA_URL, 'Manager CDP download URL differs');
    assert.equal(cdpItem.receivedBytes, expectedBytes, 'Manager CDP received byte count differs');
    if (cdpItem.filePath !== null) {
      assert(
        resolve(cdpItem.filePath) === resolve(downloads, savedName),
        'Manager CDP completed outside the owned download path'
      );
    }
  }
  return {
    ...native,
    guid: cdpItem?.guid ?? null,
    requestedName,
    filename: savedName,
    source: summarizeDownloadUrl(FIRST_MEDIA_URL),
    bytes,
    sha256: sha256(bytes),
    browserBytesReceived: cdpItem?.receivedBytes ?? null,
    cdpObservation: cdpItem ? 'completed' : 'absent',
  };
}

function browserFilename(name: string, duplicate: number) {
  if (duplicate === 0) {
    return name;
  }
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot)} (${duplicate})${name.slice(dot)}`;
}

export async function observeNoNativeDownload(
  observer: ReturnType<typeof createBrowserDownloadObserver>,
  since: number,
  beforeFiles: Set<string>,
  downloads: string,
  label: string,
  durationMs = 0
) {
  assert(
    Number.isSafeInteger(durationMs) && durationMs >= 0 && durationMs <= 5_000,
    'Native absence observation must be bounded'
  );
  const started = Date.now();
  let samples = 0;
  for (;;) {
    await observer.assertNoneSince(since, label);
    assert.deepEqual(
      (await readdir(downloads)).sort(),
      [...beforeFiles].sort(),
      `${label} left a file in the owned directory`
    );
    samples += 1;
    const remaining = durationMs - (Date.now() - started);
    if (remaining <= 0) {
      break;
    }
    await delay(Math.min(50, remaining));
  }
  return {
    observedMs: Date.now() - started,
    samples,
    boundary:
      'bounded browser events and owned files after held request terminal; not manager callback completion',
  };
}

export async function inspectFirstCurrentDownload(page: Page) {
  if (page.url() !== FIXTURE_URL) {
    return { scope: 'unowned-page' };
  }
  const observation = await page.evaluate((expectedUrl) => {
    if (location.href !== expectedUrl) {
      return { scope: 'navigated-away' };
    }
    const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
    if (galleries.length !== 1) {
      return { scope: 'unowned-gallery' };
    }
    const gallery = galleries.item(0);
    if (!gallery) {
      return { scope: 'unowned-gallery' };
    }
    const toolbar = gallery.querySelector('[data-gallery-element="toolbar"]');
    const current = toolbar?.querySelector('button[aria-label="Download"]');
    const selected = gallery.querySelector('[data-gallery-element="item"][data-index="0"] img');
    const source = selected instanceof HTMLImageElement ? new URL(selected.src) : null;
    const selectedFirstFixtureMedia =
      source?.origin === 'https://pbs.twimg.com' && source.pathname === '/media/GkE1234ABCDEF.jpg';
    const status = toolbar
      ?.querySelector('[role="status"][data-download-status]')
      ?.getAttribute('data-download-status');
    const liveRegions = gallery.querySelectorAll(
      'div.xeg-sr-only[aria-live="polite"][aria-atomic="true"]'
    );
    const errorText =
      selectedFirstFixtureMedia && status === 'error' && liveRegions.length === 1
        ? liveRegions.item(0)?.textContent?.slice(0, 2_048)
        : null;
    const normalizedError =
      errorText
        ?.replace(/(?:https?|blob|file|chrome-extension):\/\/[^\s<>"']+/giu, '[url]')
        .replace(/(?:[A-Za-z]:\\|\\\\)[^\r\n]*/gu, '[path]')
        .replace(/\/(?:home|Users|tmp|var|mnt|etc)\/[^\r\n]*/gu, '[path]')
        .replace(
          /\b(?:bearer|token|api[-_]?key|secret|session|authorization|cookie|password)\b[^\r\n]*/giu,
          '[credential]'
        )
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, '[email]')
        .replace(/\b[A-Za-z0-9_-]{32,}\b/gu, '[opaque]')
        .replace(/\s+/gu, ' ')
        .trim()
        .slice(0, 256) || null;
    if (
      location.href !== expectedUrl ||
      !gallery.isConnected ||
      document.querySelectorAll('[data-xeg-gallery-container]').length !== 1 ||
      document.querySelector('[data-xeg-gallery-container]') !== gallery
    ) {
      return { scope: 'gallery-changed' };
    }
    return {
      scope: 'owned-fixture',
      galleryPresent: true,
      currentControlPresent: Boolean(current),
      currentControlDisabled: current instanceof HTMLButtonElement ? current.disabled : null,
      currentControlBusy: current?.getAttribute('aria-busy') === 'true',
      selectedFirstFixtureMedia,
      downloadStatus: ['working', 'handedOff', 'error'].includes(status ?? '') ? status : null,
      errorLiveRegionPresent: liveRegions.length === 1,
      errorLiveRegionText: normalizedError,
    };
  }, FIXTURE_URL);
  return page.url() === FIXTURE_URL ? observation : { scope: 'navigated-away' };
}

const MANAGER_CONSOLE_BRANCHES = [
  'manager_request_branch',
  'permission_true',
  'permission_false',
  'not_enabled_branch',
  'not_supported_branch',
  'not_permitted_branch',
  'download_failed_branch',
  'not_whitelisted_branch',
  'native_interrupted_branch',
  'native_query_failed_branch',
];
const MANAGER_BACKGROUND_SHA256 =
  '7377109daee3340f6f1f89d06f8099e92583229231b25d0f950653a63fb7dd32';

/** Match only known Tampermonkey 5.5.1 background.js download log shapes. */
export function classifyManagerDownloadConsole(value: unknown) {
  if (typeof value !== 'string' || value.length > 4_096) {
    return null;
  }
  const offset = value.indexOf('downs: ');
  if (offset < 0 || offset > 64) {
    return null;
  }
  const line = value.slice(offset);
  if (/^downs: start(?:\s|$)/u.test(line)) {
    return 'manager_request_branch';
  }
  if (line === 'downs: permission to use downloads -> true') {
    return 'permission_true';
  }
  if (line === 'downs: permission to use downloads -> false') {
    return 'permission_false';
  }
  if (line === 'downs: feature is not enabled') {
    return 'not_enabled_branch';
  }
  if (
    /^downs: (?:this download mode is not supported|invalid transferable|can't get URL from transferable)$/u.test(
      line
    )
  ) {
    return 'not_supported_branch';
  }
  if (line === 'downs: download permission is missing') {
    return 'not_permitted_branch';
  }
  if (line === 'downs: download failed') {
    return 'download_failed_branch';
  }
  if (/^downs: "[^\n]+" is not whitelisted$/u.test(line)) {
    return 'not_whitelisted_branch';
  }
  if (/^downs: download of .+ \(.+\) failed(?:\s.*)?$/u.test(line)) {
    return 'native_interrupted_branch';
  }
  if (/^downs: unable to query download ID(?:\s.*)?$/u.test(line)) {
    return 'native_query_failed_branch';
  }
  return null;
}

/** Passive, bounded observation of the one admitted manager's service worker. */
export function watchManagerDownloadConsole(context: BrowserContext, managerId: string) {
  assert(/^[a-p]{32}$/u.test(managerId), 'Invalid manager extension ID');
  const expectedUrl = `chrome-extension://${managerId}/background.js`;
  const listeners = new Map<
    Worker,
    { onConsole: (message: ConsoleMessage) => void; onClose: () => void }
  >();
  const counts: Record<string, number> = Object.fromEntries(
    MANAGER_CONSOLE_BRANCHES.map((branch) => [branch, 0])
  );
  let attachments = 0;
  let attachmentOverflow = false;
  let inspectedMessages = 0;
  let messageOverflow = false;
  let recognizedEvents = 0;
  let eventOverflow = false;
  let consoleUnavailable = false;
  let disposed = false;
  const attach = (worker: Worker) => {
    if (disposed || listeners.has(worker)) {
      return;
    }
    try {
      if (worker.url() !== expectedUrl) {
        return;
      }
    } catch {
      consoleUnavailable = true;
      return;
    }
    if (attachments >= 8) {
      attachmentOverflow = true;
      return;
    }
    const onConsole = (message: ConsoleMessage) => {
      if (disposed) {
        return;
      }
      if (inspectedMessages >= 256) {
        messageOverflow = true;
        return;
      }
      inspectedMessages++;
      let value: string;
      try {
        value = message.text();
      } catch {
        consoleUnavailable = true;
        return;
      }
      const branch = classifyManagerDownloadConsole(value);
      if (!branch) {
        return;
      }
      if (recognizedEvents >= 16) {
        eventOverflow = true;
        return;
      }
      counts[branch] = (counts[branch] ?? 0) + 1;
      recognizedEvents++;
    };
    const onClose = () => {
      worker.off('console', onConsole);
      worker.off('close', onClose);
      listeners.delete(worker);
    };
    try {
      worker.on('console', onConsole);
      worker.on('close', onClose);
    } catch {
      worker.off('console', onConsole);
      worker.off('close', onClose);
      consoleUnavailable = true;
      return;
    }
    listeners.set(worker, { onConsole, onClose });
    attachments++;
  };
  context.on('serviceworker', attach);
  try {
    for (const worker of context.serviceWorkers()) {
      attach(worker);
    }
  } catch {
    consoleUnavailable = true;
  }
  const mark = () => ({ counts: { ...counts }, attachments, recognizedEvents });
  return {
    mark,
    snapshotSince(before: ReturnType<typeof mark>) {
      const branches = Object.fromEntries(
        MANAGER_CONSOLE_BRANCHES.map((branch) => [
          branch,
          (counts[branch] ?? 0) - (before.counts[branch] ?? 0),
        ])
      );
      const matched = recognizedEvents - before.recognizedEvents;
      return {
        status: matched > 0 ? 'known-branch-observed' : 'inconclusive',
        availability: consoleUnavailable
          ? 'unavailable'
          : before.attachments > 0
            ? 'attached-before-click'
            : attachments > 0
              ? 'attached-after-click'
              : 'no-worker-observed',
        branchCounts: branches,
        matchedEvents: matched,
        workersAttachedBeforeClick: before.attachments,
        workersAttachedAfterClick: attachments,
        attachmentOverflow,
        messageOverflow,
        eventOverflow,
        consoleUnavailable,
      };
    },
    dispose() {
      disposed = true;
      context.off('serviceworker', attach);
      for (const [worker, { onConsole, onClose }] of listeners) {
        worker.off('console', onConsole);
        worker.off('close', onClose);
      }
      listeners.clear();
    },
  };
}

async function runFixture(
  context: BrowserContext,
  observer: ReturnType<typeof createBrowserDownloadObserver>,
  root: string,
  output: string,
  downloads: string,
  images: Buffer[],
  loopback: UserscriptLoopback,
  managerId: string,
  managerVersion: string,
  profile: string,
  sourceSha256: string
) {
  const imageAt = (index: number): Buffer => {
    const bytes = images[index];
    assert(bytes, `Missing fixture image ${index}`);
    return bytes;
  };
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const noDomHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-unavailable-sequence-page.html'),
    'utf8'
  );
  const settingsPageUrl = `${FIXTURE_URL}?xeg-settings-readback=1`;
  const apiPageUrl = `${FIXTURE_URL}?xeg-api-admission=1`;
  const compactHtml = (
    imageCount: 1 | 3
  ) => `<!doctype html><html lang="en"><head><meta charset="UTF-8"></head><body>
    <article data-phase="normal" data-testid="tweet">
      <span>Test User</span><span>@testuser</span>
      <a href="/testuser/status/${TWEET_ID}"><time datetime="2026-06-25T10:00:00.000Z">Jun 25, 2026</time></a>
      ${MEDIA_COHORTS.normal
        .slice(0, imageCount)
        .map(
          (marker, index) =>
            `<div data-testid="tweetPhoto"><img src="https://pbs.twimg.com/media/${marker}.jpg?format=jpg&amp;name=large" alt="Fixture image ${index + 1}" width="320" height="180" tabindex="0"></div>`
        )
        .join('')}
    </article></body></html>`;
  const settingsHtml = compactHtml(1);
  const apiHtml = compactHtml(3);
  const managerDenialHtml = apiHtml.replace(
    '</article>',
    '<button type="button" data-testid="native-action" onclick="this.dataset.clicks=String(Number(this.dataset.clicks||0)+1)">Host action</button></article>'
  );
  const routeRecords: FixtureRouteRecord[] = [];
  const result: FixtureResult = {
    status: 'failed',
    downloads: [],
    routes: routeRecords,
    routeFailures: [],
    routeFailureOverflow: 0,
    transportReceipts: {},
    cases: {},
    cleanup: {},
  };
  let phase = 'normal';
  let apiMode: 'healthy' | 'capacity' | 'redirect-allowed' | 'redirect-blocked' | null = null;
  let managerConsole: ReturnType<typeof watchManagerDownloadConsole> | undefined;
  const mediaNetwork = watchFixtureMediaNetwork(context);
  const routeFixture = async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') {
      await route.continue();
      return;
    }
    if (
      url.hostname === 'mobile.x.com' &&
      route.request().isNavigationRequest() &&
      url.href === MOBILE_MANAGER_DENIAL_URL
    ) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: managerDenialHtml });
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      const noDom = url.href === `${FIXTURE_URL}?xeg-no-dom=1`;
      const settingsReadback = url.href === settingsPageUrl;
      const apiAdmission = url.href === apiPageUrl;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: noDom ? noDomHtml : settingsReadback ? settingsHtml : apiAdmission ? apiHtml : html,
      });
      return;
    }
    if (['x.com', 'mobile.x.com'].includes(url.hostname) && url.pathname === '/favicon.ico') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    if (
      (url.hostname === 'pbs.twimg.com' && url.pathname === '/xeg-metadata-allowed.json') ||
      (url.hostname === 'x.com' && url.pathname === '/xeg-metadata-blocked.json')
    ) {
      await route.continue();
      return;
    }
    if (
      url.hostname === 'pbs.twimg.com' &&
      url.pathname === '/media/xeg-owned-redirect-final.jpg'
    ) {
      await route.continue();
      return;
    }
    if (apiMode === 'capacity' && isUnavailablePreviewFixtureUrl(url.href)) {
      assert.equal(
        route.request().method(),
        'GET',
        'Unavailable preview used an unexpected method'
      );
      assert.equal(
        route.request().resourceType(),
        'image',
        'Unavailable preview used an unexpected resource type'
      );
      await route.fulfill({ status: 200, contentType: 'image/jpeg', body: imageAt(0) });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      if (isPublicAvatarFixtureUrl(url.href)) {
        await route.fulfill({ status: 200, contentType: 'image/jpeg', body: imageAt(0) });
        return;
      }
      const cohort = Object.entries(MEDIA_COHORTS).find(([, markers]) =>
        markers.some((marker) => url.pathname.includes(marker))
      );
      assert(cohort, 'Unknown media fixture request');
      const [mediaPhase, markers] = cohort;
      const index = markers.findIndex((marker) => url.pathname.includes(marker));
      const marker = markers[index];
      assert(marker, 'Missing media marker');
      const isPreview = route.request().resourceType() === 'image';
      const allowedNames =
        isPreview && (apiMode === 'healthy' || apiMode === 'redirect-allowed')
          ? ['large', 'orig']
          : [isPreview ? 'large' : 'orig'];
      assert(
        allowedNames.some(
          (name) => url.href === `https://pbs.twimg.com/media/${marker}.jpg?format=jpg&name=${name}`
        ),
        'Fixture media URL differs from its declared purpose'
      );
      // The 56-route baseline plus three mobile previews and up to two three-item renders
      // can exceed 64; keep this cap aligned with fixtureLimits.maxRoutedImageRequests.
      assert(routeRecords.length < 80, 'Fixture exceeded its routed request limit');
      const record: FixtureRouteRecord = {
        phase,
        mediaPhase,
        index,
        resourceType: route.request().resourceType(),
        method: route.request().method(),
      };
      routeRecords.push(record);
      if (!isPreview) {
        assert.equal(route.request().method(), 'GET', 'Fixture download used an unexpected method');
        record.result = 'loopback';
        await route.continue();
        return;
      }
      if (mediaPhase === phase && (phase === 'failure' || (phase === 'partial' && index === 1))) {
        record.result = 'http-503';
        await route.fulfill({
          status: 503,
          contentType: 'text/plain',
          body: 'fixture unavailable',
        });
        return;
      }
      record.result ??= 'image';
      await route.fulfill({ status: 200, contentType: 'image/jpeg', body: imageAt(index) });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname.endsWith('/TweetResultByRestId')) {
      if (apiMode) {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.abort('blockedbyclient');
  };
  const handler = async (route: Route) => {
    try {
      await routeFixture(route);
    } catch (error) {
      const url = new URL(route.request().url());
      if (result.routeFailures.length < 8) {
        result.routeFailures.push({
          phase,
          error: safeRouteError(error),
          request: {
            host: ['x.com', 'mobile.x.com', 'pbs.twimg.com'].includes(url.hostname)
              ? url.hostname
              : 'other',
            pathKind:
              url.pathname === PUBLIC_AVATAR_PATH
                ? 'fixture-avatar'
                : url.pathname.startsWith('/media/')
                  ? 'media'
                  : 'other',
            resourceType: route.request().resourceType(),
          },
        });
      } else {
        result.routeFailureOverflow += 1;
      }
      await route.abort('blockedbyclient').catch(() => {});
    }
  };
  await context.route('**/*', handler);
  const page = await context.newPage();
  const readFreshVideoClickMode = async () => {
    const readbackPage = await context.newPage();
    try {
      await readbackPage.goto(settingsPageUrl, { waitUntil: 'domcontentloaded' });
      await readbackPage.locator('html[data-xeg-gallery-ready="true"]').waitFor({
        state: 'attached',
        timeout: 15_000,
      });
      await readbackPage
        .locator('[data-phase="normal"] [data-testid="tweetPhoto"] img')
        .first()
        .click();
      const readbackGallery = readbackPage.locator('[data-xeg-gallery-container]');
      await readbackGallery.waitFor({ state: 'visible' });
      await readbackGallery.locator('#settings-button').click();
      const select = readbackGallery.locator('#settings-video-click-select');
      await select.waitFor({ state: 'visible' });
      return select.inputValue();
    } finally {
      await readbackPage.close();
    }
  };
  try {
    await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const current = gallery.locator(
      '[data-gallery-element="toolbar"] button[aria-label="Download"]'
    );
    const all = gallery.locator(
      '[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]'
    );
    const expectedEntries = fixtureZipEntries(images);
    const showPhase = async (nextPhase: string) => {
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      loopback.setPhase(nextPhase);
      phase = nextPhase;
      await page.locator('main').evaluate((main, selected) => {
        main.dataset.fixturePhase = selected;
      }, nextPhase);
      const nextTrigger = page
        .locator(`[data-phase="${nextPhase}"] [data-testid="tweetPhoto"] img`)
        .first();
      await nextTrigger.click();
      await gallery.waitFor({ state: 'visible' });
      return nextTrigger;
    };
    assert.equal(observer.snapshot(), 0, 'Task profile has prior native downloads');
    assert.deepEqual(await readdir(downloads), [], 'Task download directory is not empty');
    assertOwned(root, profile);
    assert.equal(managerVersion, '5.5.1', 'Unknown manager download log version');
    assert.equal(
      sha256(await readFile(join(root, 'test-tools/userscript-manager/background.js'))),
      MANAGER_BACKGROUND_SHA256,
      'Manager download log source changed'
    );
    assert.equal(
      sha256(await readFile(join(root, 'dist/xcom-enhanced-gallery.user.js'))),
      sourceSha256,
      'Userscript source changed before manager console observation'
    );
    managerConsole = watchManagerDownloadConsole(context, managerId);
    for (let repetition = 0; repetition < 2; repetition++) {
      const singleSince = observer.snapshot();
      const singleBefore = new Set(await readdir(downloads));
      const savedSingleName = browserFilename(filename(0), repetition);
      const historyBefore = await captureManagerDownloadHistory(
        context,
        managerId,
        downloads,
        savedSingleName,
        imageAt(0).length
      );
      assert.equal(historyBefore.status, 'observed', 'Native download baseline is unavailable');
      const consoleBefore = repetition === 0 ? managerConsole.mark() : null;
      const singleTransportStart = loopback.mark();
      let single: Awaited<ReturnType<typeof waitForManagerDownload>>;
      try {
        await current.click();
        single = await waitForManagerDownload(
          context,
          managerId,
          observer,
          singleSince,
          singleBefore,
          historyBefore,
          filename(0),
          savedSingleName,
          downloads,
          imageAt(0).length
        );
      } catch (error) {
        if (repetition === 0) {
          assert(consoleBefore);
          const managerConsoleClick = managerConsole.snapshotSince(consoleBefore);
          result.firstCurrentDownload = {
            fixture: await inspectFirstCurrentDownload(page).catch((captureError) => ({
              errorType: captureError instanceof Error ? captureError.name : typeof captureError,
            })),
            managerDownloadsPermission: await captureManagerDownloadsPermission(context, managerId),
            managerConsole: managerConsoleClick,
            managerDownloadHistory: firstCurrentManagerDownloadHistory(
              historyBefore,
              await captureManagerDownloadHistory(
                context,
                managerId,
                downloads,
                savedSingleName,
                imageAt(0).length
              )
            ),
          };
        }
        throw error;
      }
      const singleTransport = await waitFor(
        () => loopback.findSince(singleTransportStart, 'normal', 0, 'served'),
        'first media HTTPS loopback response'
      );
      assert.equal(singleTransport.sha256, sha256(imageAt(0)));
      assert(single.bytes.equals(imageAt(0)), 'Single saved bytes differ');
      result.downloads.push({ kind: 'single', repetition, ...single, bytes: single.bytes.length });
      await waitFor(
        async () => ((await current.isEnabled()) ? true : undefined),
        'single control ready'
      );
      const zipSince = observer.snapshot();
      const zipBefore = new Set(await readdir(downloads));
      const zipTransportStart = loopback.mark();
      await all.click();
      const zipName = FIXTURE_ZIP_NAME;
      const zip = await waitForDownload(
        observer,
        zipSince,
        zipBefore,
        zipName,
        browserFilename(zipName, repetition),
        downloads,
        expectedStoredZipBytes(expectedEntries)
      );
      const verified = verifyStoredZip(zip.bytes, expectedEntries);
      if (repetition === 0) {
        const firstResponses = [];
        for (const index of [0, 1, 2]) {
          const transport = await waitFor(
            () => loopback.findSince(zipTransportStart, 'normal', index, 'served'),
            `first ZIP media ${index} HTTPS loopback response`
          );
          assert.equal(transport.sha256, sha256(imageAt(index)));
          firstResponses.push({ ...transport });
        }
        result.transportReceipts.normalZip = { firstResponses };
      } else {
        const normalZip = result.transportReceipts.normalZip;
        assert(normalZip);
        assert.equal(
          normalZip.firstResponses.length,
          3,
          'Repeated ZIP has no verified first ZIP transport provenance'
        );
        normalZip.repeated = {
          source: 'same-page-first-zip-verified-media-cache-or-refetch',
          additionalTransferResponses: loopback
            .snapshot()
            .events.slice(zipTransportStart)
            .filter(
              (event) =>
                event.phase === 'normal' &&
                event.purpose === 'transfer' &&
                event.result === 'served'
            ).length,
        };
      }
      result.downloads.push({
        kind: 'zip',
        repetition,
        ...zip,
        bytes: zip.bytes.length,
        entryOrder: verified.entryOrder,
        included: verified.entries.length,
        omitted: 0,
      });
      await waitFor(async () => ((await all.isEnabled()) ? true : undefined), 'ZIP control ready');
    }
    result.cases.repeated = 'passed';
    assert(result.downloads.length <= MAX_DOWNLOADS, 'Fixture created too many downloads');

    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    result.cases.closeReopen = 'passed';

    await showPhase('failure');
    const failureSince = observer.snapshot();
    const failureBefore = new Set(await readdir(downloads));
    const failureTransportStart = loopback.mark();
    await all.click();
    const failedTransport = await waitFor(
      () => loopback.findSince(failureTransportStart, 'failure', 0, 'http-503'),
      'post-click HTTPS loopback transport failure'
    );
    result.transportReceipts.networkFailure = { ...failedTransport };
    await waitFor(async () => ((await all.isEnabled()) ? true : undefined), 'failed control ready');
    await observeNoNativeDownload(
      observer,
      failureSince,
      failureBefore,
      downloads,
      'Transport failure'
    );
    result.cases.networkFailure = 'passed';

    await showPhase('partial');
    const partialSince = observer.snapshot();
    const partialBefore = new Set(await readdir(downloads));
    const partialTransportStart = loopback.mark();
    await all.click();
    const includedEntries = expectedEntries.filter((_, index) => index !== 1);
    const partialName = FIXTURE_ZIP_NAME;
    const partial = await waitForDownload(
      observer,
      partialSince,
      partialBefore,
      partialName,
      browserFilename(partialName, 2),
      downloads,
      expectedStoredZipBytes(includedEntries)
    );
    const partialZip = verifyStoredZip(partial.bytes, includedEntries);
    result.downloads.push({
      kind: 'partial-zip',
      ...partial,
      bytes: partial.bytes.length,
      entryOrder: partialZip.entryOrder,
      included: partialZip.entries.length,
      omitted: expectedEntries.length - partialZip.entries.length,
      countSource: 'verified-zip-inventory-vs-expected-fixture',
    });
    const partialFailedTransport = await waitFor(
      () => loopback.findSince(partialTransportStart, 'partial', 1, 'http-503'),
      'post-click partial ZIP HTTPS loopback failure'
    );
    for (const index of [0, 2]) {
      const transport = await waitFor(
        () => loopback.findSince(partialTransportStart, 'partial', index, 'served'),
        `partial ZIP media ${index} HTTPS loopback response`
      );
      assert.equal(transport.sha256, sha256(imageAt(index)));
    }
    result.transportReceipts.partialZip = { ...partialFailedTransport };
    result.cases.partialZip = 'passed';
    await waitFor(
      async () => ((await all.isEnabled()) ? true : undefined),
      'partial ZIP control ready'
    );

    const heldTrigger = await showPhase('held');
    loopback.armHeld();
    const heldSince = observer.snapshot();
    const heldBefore = new Set(await readdir(downloads));
    const heldTransportStart = loopback.mark();
    await all.click();
    await waitFor(
      () => loopback.findSince(heldTransportStart, 'held', 0, 'started'),
      'held HTTPS loopback request'
    );
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const heldTerminal = await waitFor(
      () => loopback.findSince(heldTransportStart, 'held', 0, 'aborted'),
      'held HTTPS loopback response closure'
    );
    assert.equal(loopback.activeCount(), 0, 'Held response remains active after cancellation');
    // cleanupGallery() resets the busy signal synchronously. A detached gallery
    // and enabled toolbar cannot prove that an old manager callback has settled.
    // Keep this document alive after the exact held request reaches a terminal
    // state and inspect browser events and owned files during the bounded interval.
    await heldTrigger.click();
    await gallery.waitFor({ state: 'visible' });
    await waitFor(
      async () => ((await all.isEnabled()) ? true : undefined),
      'same-document toolbar ready after cancellation'
    );
    result.cases.lateAbsence = await observeNoNativeDownload(
      observer,
      heldSince,
      heldBefore,
      downloads,
      'Pre-dispatch cancellation',
      2_000
    );
    result.cases.preDispatchCancellation = 'passed';
    result.cases.delayedSettlement = {
      status: 'bounded-no-native-save',
      transport: { ...heldTerminal },
    };

    loopback.setPhase('normal');
    phase = 'normal';
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    const recoverySince = observer.snapshot();
    const recoveryBefore = new Set(await readdir(downloads));
    const recoveryName = browserFilename(filename(0), 2);
    const recoveryHistoryBefore = await captureManagerDownloadHistory(
      context,
      managerId,
      downloads,
      recoveryName,
      imageAt(0).length
    );
    assert.equal(
      recoveryHistoryBefore.status,
      'observed',
      'Recovery native download baseline is unavailable'
    );
    const recoveryTransportStart = loopback.mark();
    await current.click();
    const recovered = await waitForManagerDownload(
      context,
      managerId,
      observer,
      recoverySince,
      recoveryBefore,
      recoveryHistoryBefore,
      filename(0),
      recoveryName,
      downloads,
      imageAt(0).length
    );
    assert(recovered.bytes.equals(imageAt(0)), 'Reload recovery saved bytes differ');
    const recoveredTransport = await waitFor(
      () => loopback.findSince(recoveryTransportStart, 'normal', 0, 'served'),
      'reload recovery HTTPS loopback response'
    );
    assert.equal(recoveredTransport.sha256, sha256(imageAt(0)));
    result.downloads.push({
      kind: 'single-after-reload',
      ...recovered,
      bytes: recovered.bytes.length,
    });
    result.cases.reloadRecovery = 'passed';
    await waitFor(
      async () => ((await current.isEnabled()) ? true : undefined),
      'redirected single control ready'
    );
    loopback.armMediaRedirect();
    const redirectSince = observer.snapshot();
    const redirectBefore = new Set(await readdir(downloads));
    const redirectName = browserFilename(filename(0), 3);
    const redirectHistoryBefore = await captureManagerDownloadHistory(
      context,
      managerId,
      downloads,
      redirectName,
      imageAt(0).length
    );
    assert.equal(redirectHistoryBefore.status, 'observed');
    const redirectTransportStart = loopback.mark();
    await current.click();
    const redirected = await waitForManagerDownload(
      context,
      managerId,
      observer,
      redirectSince,
      redirectBefore,
      redirectHistoryBefore,
      filename(0),
      redirectName,
      downloads,
      imageAt(0).length
    );
    assert.equal(
      redirected.declaredRedirectFinalUrlMatch,
      true,
      'Manager native download did not report the exact allowed redirect destination'
    );
    assert(redirected.bytes.equals(imageAt(0)), 'Redirected native bytes differ');
    const redirectedTransport = loopback.snapshot().events.slice(redirectTransportStart);
    assert.deepEqual(
      redirectedTransport
        .filter((event) => event.result === 'redirect' || event.cohort === 'native-redirect-final')
        .map(({ cohort, result }) => [cohort, result]),
      [
        ['normal', 'redirect'],
        ['native-redirect-final', 'served'],
      ]
    );
    assert.equal(loopback.snapshot().mediaRedirectArmed, false);
    assert.equal(loopback.snapshot().mediaRedirectPending, false);
    result.downloads.push({
      kind: 'single-redirect',
      ...redirected,
      bytes: redirected.bytes.length,
    });
    result.cases.nativeMediaRedirect = { status: 'passed', transport: redirectedTransport };
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    const apiCases: Record<string, unknown> = {};
    for (const mode of ['healthy', 'redirect-allowed', 'redirect-blocked'] as const) {
      apiMode = mode;
      loopback.setApiMode(mode);
      const before = loopback.mark();
      await page.goto(apiPageUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
        state: 'attached',
        timeout: 15_000,
      });
      await page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').nth(1).click();
      await gallery.waitFor({ state: 'visible' });
      const selected = gallery.locator('[data-gallery-element="item"][data-index="1"] img');
      await selected.waitFor({ state: 'visible' });
      const expectedName = mode === 'redirect-blocked' ? 'large' : 'orig';
      const selectedUrl = await waitFor(async () => {
        const source = await selected.getAttribute('src');
        if (!source) {
          return undefined;
        }
        const url = new URL(source);
        return url.searchParams.get('name') === expectedName ? url : undefined;
      }, `${mode} selected metadata image quality`);
      assert.equal(selectedUrl.pathname, `/media/${MEDIA_COHORTS.normal[1]}.jpg`);
      assert.equal(
        selectedUrl.searchParams.get('name'),
        expectedName,
        `${mode} metadata response selected an unexpected image quality`
      );
      const apiEvents = await waitFor(() => {
        const events = loopback
          .snapshot()
          .events.slice(before)
          .filter((event) => event.cohort === 'api');
        const expectedCount = mode.startsWith('redirect-') ? 2 : 1;
        return events.length === expectedCount &&
          events.every((event) => event.result !== 'started')
          ? events
          : undefined;
      }, `${mode} installed GM metadata request`);
      assert.equal(
        apiEvents.length,
        mode.startsWith('redirect-') ? 2 : 1,
        `${mode} made an unexpected number of GM metadata requests`
      );
      if (mode === 'healthy') {
        assert.equal(apiEvents[0]?.result, 'served');
        assert((apiEvents[0]?.bytes ?? 0) > 0 && (apiEvents[0]?.bytes ?? 0) < 2 * 1024 * 1024);
      } else {
        assert.equal(apiEvents[0]?.result, 'redirect');
        assert.equal(apiEvents[0]?.bytes, 0);
        assert.equal(apiEvents[1]?.result, 'served');
        assert.equal(
          apiEvents[1]?.purpose,
          mode === 'redirect-allowed' ? 'allowed-final' : 'blocked-final'
        );
        assert((apiEvents[1]?.bytes ?? 0) > 0 && (apiEvents[1]?.bytes ?? 0) < 2 * 1024 * 1024);
      }
      apiCases[mode] = {
        requests: apiEvents.length,
        transport: apiEvents,
        selectedName: selectedUrl.searchParams.get('name'),
      };
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
    }
    result.cases.metadataAdmission = apiCases;
    apiMode = null;
    loopback.setApiMode(null);
    const managerDenialReceipt: Record<string, unknown> = {
      status: 'failed',
      managerVersion,
      sourceSha256,
      pageOrigin: 'https://mobile.x.com',
      blockedApiOrigin: 'https://x.com',
      rule: 'x.com',
      cleanup: {},
    };
    result.cases.managerDenial = managerDenialReceipt;
    const managerDenialCleanup: Record<string, unknown> = {};
    managerDenialReceipt.cleanup = managerDenialCleanup;
    let securityPage: Page | undefined;
    let originalBlacklist: string[] | undefined;
    let ruleMayHaveBeenAdded = false;
    let managerDenialError: unknown;
    let managerDenialFailed = false;
    const managerDenialCleanupErrors: unknown[] = [];
    const observeSelectedManagerImage = async (expectedName: 'large' | 'orig', label: string) => {
      const selected = gallery.locator('[data-gallery-element="item"][data-index="1"] img');
      await selected.waitFor({ state: 'visible' });
      return waitFor(async () => {
        const observation = await gallery.evaluate((root) => {
          const toolbar = root.querySelector('[data-gallery-element="toolbar"]');
          const counter = toolbar?.querySelector('#xeg-toolbar-counter');
          const item = root.querySelector('[data-gallery-element="item"][data-index="1"]');
          const image = item?.querySelector('img');
          return {
            currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
            focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
            counterPosition: counter?.getAttribute('data-position') ?? null,
            counterTotal: counter?.getAttribute('data-total') ?? null,
            counterFocusedIndex: counter?.getAttribute('data-focused-index') ?? null,
            itemIndex: item?.getAttribute('data-index') ?? null,
            mediaLoaded: item?.getAttribute('data-media-loaded') ?? null,
            source: image instanceof HTMLImageElement ? image.currentSrc || image.src : null,
            complete: image instanceof HTMLImageElement && image.complete,
            width: image instanceof HTMLImageElement ? image.naturalWidth : 0,
            height: image instanceof HTMLImageElement ? image.naturalHeight : 0,
          };
        });
        if (
          observation.currentIndex !== '1' ||
          observation.focusedIndex !== '1' ||
          observation.counterPosition !== '2' ||
          observation.counterTotal !== '3' ||
          observation.counterFocusedIndex !== '1' ||
          observation.itemIndex !== '1' ||
          observation.mediaLoaded !== 'true' ||
          !observation.source ||
          !observation.complete ||
          observation.width <= 0 ||
          observation.height <= 0
        ) {
          return undefined;
        }
        const source = new URL(observation.source);
        return source.origin === 'https://pbs.twimg.com' &&
          source.pathname === `/media/${MEDIA_COHORTS.normal[1]}.jpg` &&
          source.searchParams.get('name') === expectedName
          ? observation
          : undefined;
      }, label);
    };
    try {
      securityPage = await context.newPage();
      const initial = await openManagerDomainBlacklist(securityPage, managerId, output);
      originalBlacklist = await managerDomainBlacklistValues(initial.blacklist);
      assert(
        !originalBlacklist.some((rule) => rule === 'x.com'),
        'Task profile already blacklists x.com'
      );
      managerDenialReceipt.beforeRules = originalBlacklist;
      apiMode = 'healthy';
      loopback.setApiMode('healthy');
      const deniedStart = loopback.mark();
      const add = initial.blacklist.getByRole('button', {
        name: `${initial.labels.add}...`,
        exact: true,
      });
      assert.equal(await add.count(), 1, 'Expected one manager blacklist Add button');
      ruleMayHaveBeenAdded = true;
      const promptPromise = securityPage.waitForEvent('dialog', { timeout: 10_000 });
      const addClick = add.click();
      const prompt = await promptPromise;
      assert.equal(prompt.type(), 'prompt', 'Manager blacklist did not ask for a rule');
      assert.equal(prompt.message(), initial.labels.prompt, 'Manager blacklist prompt differs');
      await prompt.accept('x.com');
      await addClick;
      const addedRules = [...originalBlacklist, 'x.com'];
      const added = await waitForManagerDomainBlacklist(
        securityPage,
        managerId,
        output,
        addedRules
      );
      managerDenialReceipt.addedRules = addedRules;

      await page.goto(MOBILE_MANAGER_DENIAL_URL, { waitUntil: 'domcontentloaded' });
      assert.equal(new URL(page.url()).hostname, 'mobile.x.com');
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
        state: 'attached',
        timeout: 15_000,
      });
      const middle = page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').nth(1);
      await middle.click();
      await gallery.waitFor({ state: 'visible' });
      const deniedImage = await observeSelectedManagerImage(
        'large',
        'manager-denied decoded DOM image'
      );
      assert.equal(
        await gallery.locator('[data-gallery-element="item"]').count(),
        3,
        'Manager-denied DOM extraction did not retain the three visible photos'
      );
      await delay(1_000);
      const deniedApiEvents = loopback
        .snapshot()
        .events.slice(deniedStart)
        .filter((event) => event.cohort === 'api');
      assert.deepEqual(deniedApiEvents, [], 'Denied manager request reached the physical API');
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      const nativeAction = page.getByRole('button', { name: 'Host action', exact: true });
      await nativeAction.click();
      assert.equal(await nativeAction.getAttribute('data-clicks'), '1');
      assert.deepEqual(
        loopback
          .snapshot()
          .events.slice(deniedStart)
          .filter((event) => event.cohort === 'api'),
        [],
        'Denied manager request reached the physical API after gallery close'
      );
      managerDenialReceipt.denied = {
        physicalApiRequests: deniedApiEvents.length,
        selectedName: 'large',
        selectedImage: deniedImage,
        visiblePhotoCount: 3,
        nativeHostClicks: 1,
      };
      const selectedRule = added.blacklist.locator('select');
      await selectedRule.selectOption('x.com');
      const remove = added.blacklist.getByRole('button', {
        name: added.labels.remove,
        exact: true,
      });
      assert.equal(await remove.count(), 1, 'Expected one manager blacklist Remove button');
      await remove.click();
      await waitForManagerDomainBlacklist(securityPage, managerId, output, originalBlacklist);
      ruleMayHaveBeenAdded = false;
      managerDenialReceipt.restoredRules = originalBlacklist;

      assert.equal(page.url(), MOBILE_MANAGER_DENIAL_URL, 'Recovery left the owned mobile page');
      const healthyStart = loopback.mark();
      await middle.click();
      await gallery.waitFor({ state: 'visible' });
      const healthyImage = await observeSelectedManagerImage(
        'orig',
        'manager-restored decoded original image'
      );
      const healthyApiEvents = await waitFor(() => {
        const events = loopback
          .snapshot()
          .events.slice(healthyStart)
          .filter((event) => event.cohort === 'api');
        return events.length === 1 && events[0]?.result === 'served' ? events : undefined;
      }, 'restored manager physical API response');
      assert.equal(healthyApiEvents[0]?.purpose, 'metadata');
      assert((healthyApiEvents[0]?.bytes ?? 0) > 0);
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      await nativeAction.click();
      assert.equal(await nativeAction.getAttribute('data-clicks'), '2');
      await middle.click();
      await gallery.waitFor({ state: 'visible' });
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      assert.equal(page.url(), MOBILE_MANAGER_DENIAL_URL, 'Healthy control left the mobile page');
      managerDenialReceipt.healthy = {
        firstClickPhysicalApiRequests: healthyApiEvents.length,
        responseStatus: 200,
        selectedName: 'orig',
        selectedImage: healthyImage,
        nativeHostClicks: 2,
        freshReopenAndClose: true,
      };
      managerDenialReceipt.status = 'passed';
    } catch (error) {
      managerDenialFailed = true;
      managerDenialError = error;
      managerDenialReceipt.error = safeRouteError(error);
      if (
        securityPage &&
        !securityPage.isClosed() &&
        isOwnedManagerOptionsUrl(securityPage.url(), managerId)
      ) {
        try {
          managerDenialReceipt.managerUiFailureShape = await securityPage.evaluate(() => {
            const visible = (element: Element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0
              );
            };
            const label = (element: Element) => (element.textContent ?? '').trim().slice(0, 100);
            const elements = (selector: string, limit: number) =>
              Array.from(document.querySelectorAll(selector)).filter(visible).slice(0, limit);
            const countVisible = (selector: string) =>
              Array.from(document.querySelectorAll(selector)).filter(visible).length;
            return {
              tabs: elements('div[name^="tabview_tab"][tvid]', 12).map((element) => ({
                name: element.getAttribute('name'),
                tvid: element.getAttribute('tvid'),
              })),
              headings: elements('div.section_head', 16).map(label),
              buttonLabels: elements('button', 24).map(label),
              selectorCounts: {
                scriptSettingsTabs: countVisible(
                  'div[tvid="settings"][name^="tabview_tab"]:not([name="tabview_tabmain"])'
                ),
                visibleSections: countVisible('div.section'),
                visibleHeadings: countVisible('div.section_head'),
                visibleCludes: countVisible('div.cludes'),
                visibleSelects: countVisible('select'),
              },
            };
          });
        } catch (diagnosticError) {
          managerDenialReceipt.managerUiFailureShapeError = safeRouteError(diagnosticError);
        }
        try {
          const screenshot = 'userscript-manager-denial-ui-failure.png';
          await securityPage.screenshot({
            path: join(output, screenshot),
            mask: [securityPage.locator('input, select, textarea, pre, code, [contenteditable]')],
          });
          managerDenialReceipt.managerUiFailureScreenshot = screenshot;
        } catch (diagnosticError) {
          managerDenialReceipt.managerUiFailureScreenshotError = safeRouteError(diagnosticError);
        }
      }
    } finally {
      if (await gallery.isVisible().catch(() => false)) {
        await gallery
          .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
          .click()
          .catch((error) => managerDenialCleanupErrors.push(error));
      }
      if (ruleMayHaveBeenAdded && securityPage && originalBlacklist) {
        try {
          const current = await openManagerDomainBlacklist(securityPage, managerId, output);
          const values = await managerDomainBlacklistValues(current.blacklist);
          if (values.some((rule) => rule === 'x.com')) {
            await current.blacklist.locator('select').selectOption('x.com');
            await current.blacklist
              .getByRole('button', { name: current.labels.remove, exact: true })
              .click();
          }
          await waitForManagerDomainBlacklist(securityPage, managerId, output, originalBlacklist);
          managerDenialCleanup.settingsRestored = true;
        } catch (error) {
          managerDenialCleanupErrors.push(error);
          managerDenialCleanup.settingsRestored = false;
        }
      } else if (originalBlacklist) {
        managerDenialCleanup.settingsRestored = true;
      }
      if (securityPage) {
        await securityPage.close().then(
          () => {
            managerDenialCleanup.managerPageClosed = true;
          },
          (error) => {
            managerDenialCleanupErrors.push(error);
          }
        );
      }
      if (loopback.activeCount() === 0) {
        apiMode = null;
        loopback.setApiMode(null);
        managerDenialCleanup.apiModeReset = true;
      } else {
        managerDenialCleanupErrors.push(
          new Error('Manager denial left an active loopback response')
        );
      }
      managerDenialReceipt.cleanupErrors = managerDenialCleanupErrors.map(safeRouteError);
      if (managerDenialCleanupErrors.length) {
        managerDenialReceipt.status = 'failed';
      }
      await writeFile(
        join(output, 'userscript-manager-denial-result.json'),
        JSON.stringify(managerDenialReceipt, null, 2)
      );
    }
    if (managerDenialFailed || managerDenialCleanupErrors.length) {
      throw new AggregateError(
        [...(managerDenialFailed ? [managerDenialError] : []), ...managerDenialCleanupErrors],
        'Installed Tampermonkey domain denial or restoration failed'
      );
    }
    const notificationPage = await context.newPage();
    let notificationObserver:
      | Awaited<ReturnType<typeof observeManagerNotificationCreates>>
      | undefined;
    let originalClickMode: string | undefined;
    let capacityFailure: unknown;
    let capacityFailed = false;
    const capacityCleanupErrors: unknown[] = [];
    try {
      await notificationPage.goto(`chrome-extension://${managerId}/options.html`, {
        waitUntil: 'domcontentloaded',
      });
      assert(isOwnedManagerOptionsUrl(notificationPage.url(), managerId));
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      await page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').first().click();
      await gallery.waitFor({ state: 'visible' });
      await gallery.locator('#settings-button').click();
      const clickMode = gallery.locator('#settings-video-click-select');
      originalClickMode = await clickMode.inputValue();
      await chooseTrustedVideoClickMode(page, clickMode, 'allow-all');
      await waitFor(
        async () => ((await readFreshVideoClickMode()) === 'allow-all' ? true : undefined),
        'userscript video click setting to persist'
      );
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      apiMode = 'capacity';
      loopback.setApiMode('capacity');
      const capacityStart = loopback.mark();
      await page.goto(`${FIXTURE_URL}?xeg-no-dom=1`, { waitUntil: 'domcontentloaded' });
      await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
        state: 'attached',
        timeout: 15_000,
      });
      const article = page.locator('[data-sequence-step="userscript-capacity"]');
      const preview = await article.evaluate((element) => {
        const video = element.querySelector('video');
        return {
          poster: video?.poster ?? null,
          src: video?.getAttribute('src') ?? null,
          sourceCount: video?.querySelectorAll('source').length ?? -1,
          imageCount: element.querySelectorAll('img').length,
        };
      });
      assert.deepEqual(preview, {
        poster: `https://pbs.twimg.com/ext_tw_video_thumb/${TWEET_ID}/pu/img/unavailable.jpg`,
        src: null,
        sourceCount: 0,
        imageCount: 0,
      });
      const knownNotifications = await notificationPage.evaluate(async () => {
        const extension = chrome as typeof chrome & {
          notifications: { getAll(): Promise<Record<string, unknown>> };
        };
        return Object.keys(await extension.notifications.getAll());
      });
      notificationObserver = await observeManagerNotificationCreates(context, managerId);
      await article.locator('.media-shell button').click();
      const notification = await waitFor(
        () =>
          notificationPage.evaluate(async (known) => {
            const extension = chrome as typeof chrome & {
              notifications: { getAll(): Promise<Record<string, unknown>> };
            };
            const active = await extension.notifications.getAll();
            const entry = Object.entries(active).find(([id]) => !known.includes(id));
            return entry ? { id: entry[0] } : undefined;
          }, knownNotifications),
        'real-manager metadata capacity notification'
      );
      const created = await waitFor(async () => {
        const calls = await notificationObserver?.snapshot();
        return calls?.find((call) => call.id === notification.id);
      }, 'real-manager native notification creation');
      assert(
        created.message?.startsWith(
          'This post exceeds the metadata size limit. Open it on X to view its media.'
        ),
        'Installed Tampermonkey did not report the metadata capacity category'
      );
      assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
      const apiEvents = loopback
        .snapshot()
        .events.slice(capacityStart)
        .filter((event) => event.cohort === 'api');
      assert.equal(apiEvents.length, 1);
      assert.equal(apiEvents[0]?.result, 'served');
      assert((apiEvents[0]?.bytes ?? 0) > 2 * 1024 * 1024);
      result.cases.metadataCapacity = {
        status: 'passed',
        notification: { id: notification.id, message: created.message },
        transport: apiEvents,
      };
    } catch (error) {
      capacityFailed = true;
      capacityFailure = error;
      result.cases.metadataCapacity = { status: 'failed', error: safeRouteError(error) };
    } finally {
      if (notificationObserver) {
        await notificationObserver.dispose().catch((error) => capacityCleanupErrors.push(error));
      }
      if (loopback.activeCount() === 0) {
        apiMode = null;
        loopback.setApiMode(null);
      }
      if (originalClickMode !== undefined) {
        try {
          await page.goto(settingsPageUrl, { waitUntil: 'domcontentloaded' });
          await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
          await page
            .locator('[data-phase="normal"] [data-testid="tweetPhoto"] img')
            .first()
            .click();
          await gallery.waitFor({ state: 'visible' });
          await gallery.locator('#settings-button').click();
          const clickMode = gallery.locator('#settings-video-click-select');
          await chooseTrustedVideoClickMode(page, clickMode, originalClickMode);
          await waitFor(
            async () =>
              (await readFreshVideoClickMode()) === originalClickMode ? true : undefined,
            'userscript video click setting to restore'
          );
          await gallery
            .locator('[data-gallery-element="toolbar"] button[aria-label="Close"]')
            .click();
          await gallery.waitFor({ state: 'detached' });
        } catch (error) {
          capacityCleanupErrors.push(error);
        }
      }
      await notificationPage.close().catch((error) => capacityCleanupErrors.push(error));
    }
    if (capacityFailed || capacityCleanupErrors.length) {
      throw new AggregateError(
        [...(capacityFailed ? [capacityFailure] : []), ...capacityCleanupErrors],
        'Installed userscript capacity observation or restoration failed'
      );
    }
    apiMode = null;
    loopback.setApiMode(null);
    await observer.flush();
    assert.equal(
      result.routeFailures.length + result.routeFailureOverflow,
      0,
      'Fixture route failed'
    );
    assert.equal(
      observer.snapshot(),
      result.downloads.filter((download) => download.guid).length,
      'Unexpected CDP download count'
    );
    const loopbackResult = loopback.snapshot();
    assert.equal(loopbackResult.unexpectedCount, 0, 'Unexpected loopback request');
    assert.equal(loopbackResult.upgradeDenialEnabled, false, 'Upgrade API denial remained enabled');
    assert.equal(loopbackResult.overflow, false, 'Loopback fixture exceeded bounds');
    assert.equal(loopbackResult.serverError, false, 'Loopback server reported an error');
    assert.equal(loopbackResult.activeCount, 0, 'Loopback response remains active');
    assert(
      loopbackResult.events.every((event) => event.result !== 'started'),
      'Loopback transport lacks a terminal result'
    );
    await page.screenshot({ path: join(output, 'userscript-fixture.png') });
    result.status = 'passed';
    return result;
  } catch (error) {
    result.error = safeRouteError(error);
    throw error;
  } finally {
    if (managerConsole) {
      try {
        managerConsole.dispose();
        result.cleanup.managerConsoleListenersRemoved = true;
      } catch {
        result.cleanup.managerConsoleListenersRemoved = false;
      }
    }
    await page.close().catch((error) => {
      result.cleanup.pageError = String(error);
    });
    mediaNetwork.dispose();
    await context.unroute('**/*', handler).then(
      () => {
        result.cleanup.routeRemoved = true;
      },
      (error) => {
        result.cleanup.routeError = String(error);
      }
    );
    result.browserDownloadEvents = observer.events();
    result.fixtureMediaNetwork = { events: mediaNetwork.events, overflow: mediaNetwork.overflow() };
    result.loopbackTransport = loopback.snapshot();
    await writeFile(
      join(output, 'userscript-fixture-result.json'),
      JSON.stringify(result, null, 2)
    );
    assert.deepEqual(
      result.cleanup,
      managerConsole
        ? { managerConsoleListenersRemoved: true, routeRemoved: true }
        : { routeRemoved: true },
      'Fixture cleanup failed'
    );
  }
}

export async function requireInstalledManagerRow(page: Page, output: string, phase: string) {
  const rows = page.locator('tr.scripttr:visible').filter({
    has: page.locator(MANAGER_SCRIPT_NAME_SELECTOR).getByText(SCRIPT_NAME, { exact: true }),
  });
  await page.getByText(SCRIPT_NAME, { exact: true }).first().waitFor({ state: 'visible' });
  const count = await rows.count();
  if (count !== 1) {
    const visibleEntries = await page.locator('tr.scripttr:visible').evaluateAll((elements) =>
      elements.slice(0, 8).map((element) => ({
        name: element.querySelector('span.nameNname16')?.textContent?.trim().slice(0, 100),
        version: element.querySelector('.script_version')?.textContent?.trim().slice(0, 40),
      }))
    );
    await page
      .screenshot({ path: join(output, `userscript-${phase}-identity.png`) })
      .catch(() => {});
    assert.equal(
      count,
      1,
      `Manager must show exactly one installed script identity; visible entries: ${JSON.stringify(visibleEntries)}`
    );
  }
  return rows.first();
}

export function managerRowShowsVersion(rowText: string, version: string) {
  return rowText.split(/\s+/u).includes(version);
}

async function observeInstalledManagerSource(
  page: Page,
  managerId: string,
  labels: ManagerUiLabels,
  version: string,
  expectedSha256: string,
  output: string,
  phase: string
) {
  const optionsUrl = `chrome-extension://${managerId}/options.html`;
  await page.goto(optionsUrl);
  assert.equal(page.url(), optionsUrl, 'Manager options page navigated away');
  await page.getByText(labels.installedUserscripts, { exact: true }).first().click();
  const row = await requireInstalledManagerRow(page, output, phase);
  const rowText = (await row.innerText()).replace(/\s+/gu, ' ').trim();
  assert(
    managerRowShowsVersion(rowText, version),
    `Manager did not show installed version ${version}`
  );
  await row.locator(MANAGER_SCRIPT_NAME_SELECTOR).click();
  const editor = page.locator('.CodeMirror:visible').first();
  await editor.waitFor({ state: 'visible' });
  const source = await editor.evaluate((element) => element.CodeMirror?.getValue());
  const readback = requireManagerEditorSource(source, expectedSha256, version);
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager editor navigated away');
  return { ...readback, rowText: rowText.slice(0, 200) };
}

async function runUserscriptUpgrade({
  context,
  managerId,
  root,
  output,
  input,
}: {
  context: BrowserContext;
  managerId: string;
  root: string;
  output: string;
  input: NonNullable<Awaited<ReturnType<typeof readUpgradeInput>>>;
}) {
  const receipt: UserscriptUpgradeReceipt = {
    status: 'failed',
    previousVersion: input.previousVersion,
    candidateVersion: input.candidateVersion,
    previousSourceSha256: input.previousUserscript.sha256,
    candidateSourceSha256: input.candidateUserSha256,
    managerId,
  };
  const observeUpgradeVolume = (
    phase: string,
    options: Parameters<typeof observeGalleryVolume>[1]
  ) =>
    observeGalleryVolume(context, {
      ...options,
      galleryFixture: 'direct',
      waitForPersistedVolume:
        options.after === undefined
          ? null
          : async (expected) => {
              const deadline = Date.now() + 15_000;
              let observed = null;
              let attempts = 0;
              do {
                const readback = await observeGalleryVolume(context, {
                  before: null,
                  galleryFixture: 'direct',
                  onFailure: async (page, consoleEvents) => {
                    receipt.volumeFailure ??= await captureGalleryVolumeFailure(
                      page,
                      output,
                      'userscript',
                      `${phase}-readback`,
                      consoleEvents
                    );
                  },
                });
                observed = readback.before;
                attempts++;
                receipt.volumePersistenceReadbacks ??= {};
                receipt.volumePersistenceReadbacks[phase] = { expected, observed, attempts };
                if (observed !== null && Math.abs(observed - expected) < 0.011) {
                  return;
                }
              } while (Date.now() < deadline);
              throw new Error(
                `Userscript gallery volume was ${observed} after ${attempts} fresh-page readbacks; expected ${expected}`
              );
            },
      onFailure: async (page, consoleEvents) => {
        receipt.volumeFailure ??= await captureGalleryVolumeFailure(
          page,
          output,
          'userscript',
          phase,
          consoleEvents
        );
      },
    });
  const images = await createImageFixtures(context);
  const displayImages = await createImageFixtures(context, 0.25);
  const routes = await installFixtureRoutes(context, root, images, displayImages);
  const options = await context.newPage();
  let primaryError: unknown;
  let caughtPrimaryError = false;
  let cleanupFailure: unknown;
  let caughtCleanupFailure = false;
  try {
    const inspectGallery = async (
      expected: boolean,
      restore = false,
      afterUpdate = false,
      screenshotPhase: string | null = null
    ) => {
      const page = await context.newPage();
      try {
        await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').first().click();
        const gallery = page.locator('[data-xeg-gallery-container]');
        await gallery.waitFor({ state: 'visible' });
        const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
        let publicPreferences = null;
        if (!expected) {
          await toolbar.getByRole('button', { name: 'Fit Height', exact: true }).click();
          await toolbar.locator('#settings-button').click();
          assert.equal(
            await gallery.locator('#settings-video-click-select').inputValue(),
            'block-controls-only',
            'Public 2.3.6 video-click control must show the default mode'
          );
          await gallery.locator('#settings-language-select').selectOption('ko');
          receipt.baselineClickModeUi = 'block-controls-only';
        } else {
          await toolbar.locator('#settings-button').click();
          if (afterUpdate) {
            assert.equal(
              await gallery.locator('#settings-video-click-select').inputValue(),
              'block-controls-only'
            );
          } else {
            publicPreferences = {
              videoClickMode: await gallery.locator('#settings-video-click-select').inputValue(),
              language: await gallery.locator('#settings-language-select').inputValue(),
              fitHeightPressed: await toolbar
                .getByRole('button', { name: '높이 맞춤', exact: true })
                .getAttribute('aria-pressed'),
            };
            assert.equal(publicPreferences.videoClickMode, 'block-controls-only');
          }
          assert.equal(
            publicPreferences?.language ??
              (await gallery.locator('#settings-language-select').inputValue()),
            'ko'
          );
          assert.equal(
            publicPreferences?.fitHeightPressed ??
              (await toolbar
                .getByRole('button', { name: '높이 맞춤', exact: true })
                .getAttribute('aria-pressed')),
            'true'
          );
        }
        await page.screenshot({
          path: join(
            output,
            screenshotPhase
              ? `userscript-${screenshotPhase}.png`
              : afterUpdate
                ? 'userscript-after-upgrade.png'
                : 'userscript-before-upgrade.png'
          ),
        });
        if (expected) {
          await toolbar.locator('#settings-button').click();
          const keyboard = await observeGalleryKeyboardNavigation(page, gallery);
          if (afterUpdate) {
            receipt.keyboardAfter = keyboard;
          } else {
            receipt.keyboardBefore = keyboard;
          }
          if (restore) {
            await toolbar.locator('#settings-button').click();
          }
        }
        if (restore) {
          const clickModeSelect = gallery.locator('#settings-video-click-select');
          await clickModeSelect.focus();
          await page.keyboard.press('End');
          await page.waitForFunction((expected) => {
            const select = document.querySelector(
              '[data-xeg-gallery-container] #settings-video-click-select'
            );
            return (
              select instanceof HTMLSelectElement && !select.disabled && select.value === expected
            );
          }, 'allow-all');
          const deadline = Date.now() + 15_000;
          let observedMode = null;
          let attempts = 0;
          do {
            const modePage = await context.newPage();
            try {
              await modePage.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
              await modePage
                .locator('[data-phase="normal"] [data-testid="tweetPhoto"] img')
                .first()
                .click();
              const modeGallery = modePage.locator('[data-xeg-gallery-container]');
              await modeGallery.waitFor({ state: 'visible' });
              await modeGallery.locator('#settings-button').click();
              const modeSelect = modeGallery.locator('#settings-video-click-select');
              await modeSelect.waitFor({ state: 'visible' });
              observedMode = await modeSelect.inputValue();
            } finally {
              await modePage.close();
            }
            attempts++;
            receipt.candidateClickModeReadback = { observedMode, attempts };
          } while (observedMode !== 'allow-all' && Date.now() < deadline);
          assert.equal(
            observedMode,
            'allow-all',
            'Candidate click mode did not persist in fresh UI'
          );
          receipt.candidateClickModeUi = { selected: 'allow-all', persistedInNewPage: true };
          await page.bringToFront();
          await gallery.locator('#settings-language-select').selectOption('en');
          await clickModeSelect.focus();
          await page.keyboard.press('ArrowUp');
          await page.waitForFunction((expected) => {
            const select = document.querySelector(
              '[data-xeg-gallery-container] #settings-video-click-select'
            );
            return (
              select instanceof HTMLSelectElement && !select.disabled && select.value === expected
            );
          }, 'block-controls-only');
          await toolbar.locator('#settings-button').click();
          await toolbar.getByRole('button', { name: 'Fit Width', exact: true }).click();
        }
        return publicPreferences;
      } catch (error) {
        receipt.settingsFailure = await captureUpgradeSettingsFailure(
          page,
          output,
          'userscript',
          afterUpdate ? 'candidate' : 'public'
        );
        throw error;
      } finally {
        await page.close();
      }
    };
    await inspectGallery(false);
    await inspectGallery(true); // Verify saved settings before changing the installed script.
    receipt.videoClickBefore = await observeDefaultVideoClick(context);
    receipt.volumeBefore = await observeUpgradeVolume('public-changed', { before: 1, after: 0.9 });
    receipt.volumeBeforeReloaded = await observeUpgradeVolume('public-reloaded', {
      before: 0.9,
      waitForInitialVolume: true,
    });
    await options.goto(`chrome-extension://${managerId}/options.html`);
    const labels = await readManagerUiLabels(options, managerId);
    const updateLabel = await options.evaluate(() => chrome.i18n.getMessage('Update'));
    const updateTitle = await options.evaluate(() =>
      chrome.i18n.getMessage('You_are_about_to_update_a_UserScript_')
    );
    assert(updateLabel && updateTitle, 'Manager update labels are unavailable');
    receipt.beforeReadback = await observeInstalledManagerSource(
      options,
      managerId,
      labels,
      input.previousVersion,
      input.previousUserscript.sha256,
      output,
      'before-upgrade'
    );
    const updateConfirmationEvents: UpgradeConfirmationEvent[] = [];
    receipt.updateConfirmationEvents = updateConfirmationEvents;
    const openUpdateConfirmation = async (phase: string) => {
      await options.goto(`chrome-extension://${managerId}/options.html`);
      await options.getByText(labels.utilities, { exact: true }).click();
      const confirmationPromise = context.waitForEvent('page');
      await options
        .locator('input[type=file]')
        .setInputFiles(join(root, 'dist/xcom-enhanced-gallery.user.js'));
      const confirmation = await confirmationPromise;
      try {
        await confirmation.waitForURL(`chrome-extension://${managerId}/ask.html*`);
        const title = await confirmation.title();
        if (title !== updateTitle) {
          await confirmation
            .getByText(updateTitle, { exact: true })
            .first()
            .waitFor({ state: 'visible', timeout: 10_000 });
        }
        const updateAction = confirmation.getByRole('button', { name: updateLabel, exact: true });
        await updateAction.waitFor({ state: 'visible' });
        assert.equal(await updateAction.count(), 1, 'Manager Update action is ambiguous');
        assert.equal(
          await confirmation.getByRole('button', { name: labels.install, exact: true }).isVisible(),
          false,
          'Manager offered Install instead of Update'
        );
        await confirmation.screenshot({
          path: join(output, `userscript-update-confirmation-${phase}.png`),
        });
        updateConfirmationEvents.push({
          phase,
          event: 'observed',
          url: confirmation.url(),
          title,
          translatedTitle: updateTitle,
          updateLabel,
        });
        return { confirmation, updateAction };
      } catch (error) {
        await confirmation.close().catch(() => {});
        throw error;
      }
    };
    const deferred = await openUpdateConfirmation('deferred');
    await deferred.confirmation.close();
    assert(deferred.confirmation.isClosed(), 'Manager update confirmation did not close');
    updateConfirmationEvents.push({ phase: 'deferred', event: 'deferred' });
    receipt.afterDeferralReadback = await observeInstalledManagerSource(
      options,
      managerId,
      labels,
      input.previousVersion,
      input.previousUserscript.sha256,
      output,
      'after-deferral'
    );
    receipt.afterDeferralPreferences = await inspectGallery(true, false, false, 'after-deferral');
    receipt.afterDeferralVolume = await observeUpgradeVolume('public-deferred', {
      before: 0.9,
      waitForInitialVolume: true,
    });
    const approved = await openUpdateConfirmation('approved');
    try {
      const closed = approved.confirmation.waitForEvent('close');
      await approved.updateAction.click();
      await closed;
      updateConfirmationEvents.push({ phase: 'approved', event: 'approved' });
    } finally {
      await approved.confirmation.close().catch(() => {});
    }
    receipt.afterReadback = await observeInstalledManagerSource(
      options,
      managerId,
      labels,
      input.candidateVersion,
      input.candidateUserSha256,
      output,
      'after-upgrade'
    );
    await inspectGallery(true, true, true);
    receipt.videoClickAfter = await observeDefaultVideoClick(context);
    receipt.nondefaultClickCrossUpdate = 'not-exercised';
    receipt.volumeAfter = await observeUpgradeVolume('candidate-changed', {
      before: 0.9,
      after: 1,
    });
    receipt.volumeAfterReloaded = await observeUpgradeVolume('candidate-reloaded', {
      before: 1,
      waitForInitialVolume: true,
    });
    const restored = await context.newPage();
    try {
      await restored.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
      await restored
        .locator('[data-phase="normal"] [data-testid="tweetPhoto"] img')
        .first()
        .click();
      const gallery = restored.locator('[data-xeg-gallery-container]');
      await gallery.waitFor({ state: 'visible' });
      await gallery.locator('#settings-button').click();
      assert.equal(
        await gallery.locator('#settings-video-click-select').inputValue(),
        'block-controls-only'
      );
      assert.equal(await gallery.locator('#settings-language-select').inputValue(), 'en');
      assert.equal(
        await gallery
          .getByRole('button', { name: 'Fit Width', exact: true })
          .getAttribute('aria-pressed'),
        'true'
      );
    } finally {
      await restored.close();
    }
    receipt.fixtureDefaultsRestoredThroughUi = true;
    receipt.settings = {
      fit: 'fitHeight',
      videoClickMode: 'block-controls-only',
      language: 'ko',
      videoVolume: 0.9,
      keyboardShortcutUsedForVolume: true,
      crossUpdateUiVerified: ['fit', 'language', 'videoVolume'],
    };
    receipt.method = 'same-manager-profile-utilities-import-defer-then-update';
    receipt.status = 'passed';
  } catch (error) {
    receipt.error = safeRouteError(error);
    caughtPrimaryError = true;
    primaryError = error;
  } finally {
    await options.close();
    try {
      await routes.remove();
    } catch (error) {
      receipt.status = 'failed';
      receipt.cleanupError = safeRouteError(error);
      caughtCleanupFailure = true;
      cleanupFailure = error;
    }
    await writeFile(join(output, 'userscript-upgrade.json'), JSON.stringify(receipt, null, 2));
  }
  if (caughtPrimaryError && caughtCleanupFailure) {
    throw new AggregateError(
      [primaryError, cleanupFailure],
      'Userscript upgrade and cleanup failed'
    );
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  if (caughtCleanupFailure) {
    throw cleanupFailure;
  }
  return receipt;
}

export async function runUserscriptInstallation({
  chromium,
  root,
  output,
  browserName,
  headless,
}: {
  chromium: BrowserType;
  root: string;
  output: string;
  browserName: string;
  headless: boolean;
}) {
  assert.equal(browserName, 'chrome', 'HTTPS userscript fixture currently supports Chrome only');
  const upgradeInput = await readUpgradeInput(root);
  await mkdir(output, { recursive: true });
  const source = await readFile(join(root, 'dist/xcom-enhanced-gallery.user.js'));
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  assertOwned(root, profile);
  const downloads = join(profile, 'downloads');
  await mkdir(downloads);
  await mkdir(join(profile, 'Default'));
  await writeFile(
    join(profile, 'Default', 'Preferences'),
    JSON.stringify({
      download: {
        default_directory: downloads,
        prompt_for_download: false,
        directory_upgrade: true,
      },
    })
  );
  const result: UserscriptInstallationResult = {
    status: 'failed',
    browserName,
    installation: 'userscript',
    installationMethod: 'real-manager-ui-import',
    sourceSha256: sha256(source),
    profileId: 'xeg-gallery',
    profilePrefix: PROFILE_PREFIX,
    scope:
      'small HTTPS loopback fixture; singles require native downloads.search completion and owned saved bytes; ZIPs require CDP completion and owned saved bytes; no heap/RSS or native Save As claim',
    cleanup: {},
  };
  let context: BrowserContext | undefined;
  let cdp: CDPSession | undefined;
  let managerId: string | undefined;
  let observer: ReturnType<typeof createBrowserDownloadObserver> | undefined;
  let loopback: UserscriptLoopback | undefined;
  let primaryError: unknown;
  let caughtPrimaryError = false;
  let cleanupError: AggregateError | undefined;
  try {
    loopback = await startUserscriptFixtureLoopback(
      join(root, 'validation/windows/userscript-fixture-certificate.ps1'),
      MEDIA_COHORTS,
      PUBLIC_AVATAR_PATH
    );
    result.fixtureTransport = {
      kind: 'task-owned-https-loopback',
      bind: '127.0.0.1',
      port: loopback.port,
      hosts: ['pbs.twimg.com', 'x.com', 'mobile.x.com'],
      certificateScope: 'one-run-spki',
    };
    context = await chromium.launchPersistentContext(profile, {
      channel: browserName,
      headless,
      acceptDownloads: true,
      downloadsPath: downloads,
      locale: 'en-US',
      viewport: { width: 1280, height: 800 },
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--enable-unsafe-extension-debugging',
        `--host-resolver-rules=MAP pbs.twimg.com:443 127.0.0.1:${loopback.port},MAP x.com:443 127.0.0.1:${loopback.port},MAP mobile.x.com:443 127.0.0.1:${loopback.port}`,
        `--ignore-certificate-errors-spki-list=${loopback.spkiSha256}`,
      ],
    });
    const browser = context.browser();
    assert(browser);
    result.browserVersion = browser.version();
    await enableDeveloperMode(context, browserName);
    await verifyDownloadDirectory(context, downloads);
    result.downloadDirectoryVerified = true;
    cdp = await browser.newBrowserCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'default', eventsEnabled: true });
    ({ id: managerId } = await cdp.send('Extensions.loadUnpacked', {
      path: join(root, 'test-tools/userscript-manager'),
    }));
    assert(typeof managerId === 'string');
    const browserCdp = cdp;
    const manager = await installUserscript(
      context,
      managerId,
      root,
      output,
      browserName,
      upgradeInput ? upgradeInput.previousUserscript.sha256 : result.sourceSha256,
      profile,
      (ask, id, context) =>
        inspectAndAllowNativeManagerPermission(
          browserCdp,
          root,
          output,
          profile,
          browserName,
          ask,
          id,
          context
        ),
      upgradeInput ? upgradeInput.previousUserscript.path : undefined,
      upgradeInput ? upgradeInput.previousVersion : null
    );
    result.manager = manager;
    if (upgradeInput) {
      loopback.setUpgradeDenial(true);
      try {
        result.upgrade = await runUserscriptUpgrade({
          context,
          managerId,
          root,
          output,
          input: upgradeInput,
        });
      } finally {
        loopback.setUpgradeDenial(false);
      }
    }
    const images: Buffer[] = await createImageFixtures(context);
    loopback.setImages(images);
    result.fixtureLimits = {
      imageBytes: images.map((image) => image.length),
      imageSha256: images.map(sha256),
      maxDownloads: MAX_DOWNLOADS,
      maxRoutedImageRequests: 80,
      maxLoopbackRequests: 64,
      maxLoopbackImageBytes: 64 * 1024,
      maxLoopbackServedBytes: 2 * 1024 * 1024,
      maxLoopbackApiServedBytes: 3 * 1024 * 1024,
      productionBudget: 'unchanged',
    };
    observer = createBrowserDownloadObserver(cdp);
    result.fixture = await runFixture(
      context,
      observer,
      root,
      output,
      downloads,
      images,
      loopback,
      managerId,
      manager.managerVersion,
      profile,
      result.sourceSha256
    );
    result.status = 'passed';
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    result.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  } finally {
    const errors = [];
    if (observer) {
      observer.dispose();
      result.cleanup.browserDownloadObserverRemoved = true;
    }
    if (loopback?.activeCount()) {
      loopback.destroyActive();
      result.cleanup.activeLoopbackResponsesDestroyed = true;
    }
    if (cdp && managerId) {
      await cdp.send('Extensions.uninstall', { id: managerId }).then(
        () => {
          result.cleanup.managerUninstalled = true;
        },
        (error) => errors.push(error)
      );
    }
    if (context) {
      await context.close().then(
        () => {
          result.cleanup.browserClosed = true;
        },
        (error) => errors.push(error)
      );
    }
    if (loopback) {
      await loopback.close().then(
        () => {
          result.cleanup.loopbackClosed = true;
        },
        () => errors.push(new Error('fixture-loopback-cleanup-failed'))
      );
    }
    if (result.cleanup.browserClosed || !context) {
      try {
        assertOwned(root, profile);
        await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        assert.equal(
          await stat(profile).then(
            () => true,
            () => false
          ),
          false,
          'Owned profile remains after cleanup'
        );
        result.cleanup.profileRemoved = true;
      } catch (error) {
        errors.push(error);
      }
    } else {
      result.cleanup.profilePreserved = true;
    }
    result.cleanup.errorCount = errors.length;
    if (errors.length) {
      result.status = 'failed';
      result.cleanup.errors = errors.map(String);
    }
    await writeFile(join(output, 'installation-result.json'), JSON.stringify(result, null, 2));
    if (caughtPrimaryError && errors.length) {
      cleanupError = new AggregateError(
        [primaryError, ...errors],
        'Userscript installation and cleanup failed'
      );
    } else if (errors.length) {
      cleanupError = new AggregateError(errors, 'Userscript installation cleanup failed');
    }
  }
  if (cleanupError) {
    throw cleanupError;
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  return result;
}
