// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expectedStoredZipBytes, readExactDownloadFile, verifyStoredZip } from './download-memory.mjs';
import { createImageFixtures, enableDeveloperMode, verifyDownloadDirectory } from './install-profile.mjs';
import { startUserscriptFixtureLoopback } from './userscript-loopback.mjs';

const SCRIPT_NAME = 'X.com Enhanced Gallery';
const PROFILE_PREFIX = 'xeg-userscript-install-';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
export const MEDIA_COHORTS = {
  normal: ['GkE1234ABCDEF', 'GkE5678GHIJKL', 'GkE9012MNOPQR'],
  failure: ['GkF1234ABCDEF', 'GkF5678GHIJKL', 'GkF9012MNOPQR'],
  partial: ['GkP1234ABCDEF', 'GkP5678GHIJKL', 'GkP9012MNOPQR'],
  held: ['GkH1234ABCDEF', 'GkH5678GHIJKL', 'GkH9012MNOPQR'],
};
export const PUBLIC_AVATAR_PATH = '/profile_images/123456789/public-avatar.jpg';
export function isPublicAvatarFixtureUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'pbs.twimg.com' &&
      url.pathname === PUBLIC_AVATAR_PATH && !url.search && !url.hash;
  } catch { return false; }
}
export const FIXTURE_ZIP_NAME = `testuser_${TWEET_ID}.zip`;
const MAX_DOWNLOADS = 8;
const FIRST_MEDIA_URL = `https://pbs.twimg.com/media/${MEDIA_COHORTS.normal[0]}.jpg?format=jpg&name=large`;
const execFileAsync = promisify(execFile);
const NATIVE_PERMISSION_RECEIPT = 'userscript-manager-native-permission.json';
const NATIVE_PERMISSION_ACTION_RECEIPT = 'userscript-manager-native-permission-action.json';
const CHROME_KO_PERMISSION_TITLE = "'Tampermonkey'이(가) 추가 승인을 요청했습니다.";
const PROMPT_SCOPE_REASONS = new Set(['prompt-window-not-unique', 'prompt-identity-changed',
  'provider-error', 'runtime-id-unavailable', 'duplicate-runtime-id', 'cross-process',
  'name-cap', 'depth-cap', 'sibling-cap', 'node-cap']);

export function browserProcessId(processInfo) {
  const browsers = processInfo?.processInfo?.filter((process) => process.type === 'browser') ?? [];
  return browsers.length === 1 && Number.isSafeInteger(browsers[0].id) && browsers[0].id > 0
    ? browsers[0].id : null;
}

/** Read-only native UIA evidence only: no screen capture, click, or permission grant. */
export async function captureNativeManagerPermission(cdp, root, output, profile, browserName,
  run = execFileAsync) {
  const receiptPath = join(output, NATIVE_PERMISSION_RECEIPT);
  let receipt;
  try {
    assertOwned(root, profile);
    assert(['chrome', 'msedge'].includes(browserName), 'Unsupported native browser');
    const pid = browserProcessId(await cdp.send('SystemInfo.getProcessInfo'));
    assert(pid, 'CDP did not identify one browser process');
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-File',
      join(root, 'validation/windows/manager-permission-window.ps1'),
      '-BrowserPid', String(pid), '-BrowserName', browserName,
      '-Profile', profile, '-Output', output], { timeout: 12_000, windowsHide: true, maxBuffer: 4_096 });
    receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    assert(['captured', 'skipped'].includes(receipt.status), 'Invalid native diagnostic receipt');
    assert.equal(receipt.capture, 'uia-only', 'Native diagnostic must be UIA-only');
    assert.equal(receipt.screenshot, 'not-captured', 'Native diagnostic cannot capture the screen');
    assert.equal(receipt.permissionGrantAttempted, false,
      'Native diagnostic cannot change permission');
  } catch (error) {
    receipt = { status: 'unavailable', reason: error instanceof Error ? error.name : typeof error,
      capture: 'uia-only', screenshot: 'not-captured', permissionGrantAttempted: false };
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2));
  }
  return { status: receipt.status, reason: receipt.reason ?? null };
}

/** Only the observed Korean Chrome downloads-only prompt is eligible for native Invoke. */
export function isObservedChromeNativeDownloadPrompt(receipt) {
  const scope = receipt?.promptScope;
  if (receipt?.status !== 'captured' || receipt.capture !== 'uia-only' ||
      receipt.screenshot !== 'not-captured' || receipt.permissionGrantAttempted !== false ||
      receipt.foregroundOwnedAndVisible !== true ||
      !Number.isSafeInteger(receipt.browserPid) || receipt.browserPid <= 0 ||
      receipt.uiaRootProcessId !== receipt.browserPid ||
      !Number.isSafeInteger(receipt.browserSessionId) || receipt.browserSessionId <= 0 ||
      receipt.observerSessionId !== receipt.browserSessionId ||
      typeof receipt.creationUtcTicks !== 'string' || !/^\d{15,20}$/u.test(receipt.creationUtcTicks) ||
      typeof receipt.foregroundHandle !== 'string' || !/^[1-9]\d{0,19}$/u.test(receipt.foregroundHandle) ||
      !Array.isArray(receipt.controls) || receipt.controls.length > 256 ||
      scope?.complete !== true || scope.nameTruncated !== false || scope.windowCount !== 1 ||
      scope.reason !== null ||
      scope.rootProcessId !== receipt.browserPid ||
      !Number.isSafeInteger(scope.visitedControls) || scope.visitedControls <= 0 ||
      scope.visitedControls > 128 || !Array.isArray(scope.controls) ||
      scope.controls.length !== scope.visitedControls ||
      scope.attemptedNodes !== scope.visitedControls) return false;
  const controls = scope.controls;
  const count = (type, name) => controls.filter((control) =>
    control.controlType === type && control.name === name).length;
  return receipt.controls.filter((control) => control.controlType === 'ControlType.Window' &&
      control.name === CHROME_KO_PERMISSION_TITLE).length === 1 &&
    count('ControlType.Window', CHROME_KO_PERMISSION_TITLE) === 1 &&
    count('ControlType.Text', CHROME_KO_PERMISSION_TITLE) === 1 &&
    count('ControlType.Text', '이전에 가능했던 대상:') === 1 &&
    count('ControlType.Text', '다운로드 관리') === 1 &&
    count('ControlType.Button', '허용') === 1 &&
    count('ControlType.Button', '거부') === 1 &&
    controls.filter((control) => control.name &&
      ![CHROME_KO_PERMISSION_TITLE, '이전에 가능했던 대상:',
        '다운로드 관리', '허용', '거부'].includes(control.name)).length === 0 &&
    controls.filter((control) => control.controlType === 'ControlType.Button' &&
      ['허용', '거부'].includes(control.name)).every((control) =>
      control.isEnabled === true && control.isOffscreen === false);
}

/** Recheck the owned manager ask before a second, OS-bound UIA-only Invoke pass. */
export async function inspectAndAllowNativeManagerPermission(cdp, root, output, profile,
  browserName, ask, managerId, context, run = execFileAsync) {
  const diagnostic = await captureNativeManagerPermission(cdp, root, output, profile,
    browserName, run);
  const skipped = (reason) => ({ ...diagnostic, action: { status: 'skipped', reason } });
  if (browserName !== 'chrome') return skipped('browser-not-observed');
  if (diagnostic.status !== 'captured') return skipped('prompt-not-captured');
  try {
    const receipt = JSON.parse(await readFile(join(output, NATIVE_PERMISSION_RECEIPT), 'utf8'));
    if (receipt.promptScope?.complete === false) {
      const reason = PROMPT_SCOPE_REASONS.has(receipt.promptScope.reason)
        ? receipt.promptScope.reason : 'incomplete';
      return skipped(`prompt-scope-${reason}`);
    }
    if (!isObservedChromeNativeDownloadPrompt(receipt)) return skipped('prompt-not-exact');
    const currentPid = browserProcessId(await cdp.send('SystemInfo.getProcessInfo'));
    if (currentPid !== receipt.browserPid) return skipped('browser-pid-changed');
    if (ask.isClosed() || ask.context() !== context ||
        !isOwnedManagerPermissionAskUrl(ask.url(), managerId)) return skipped('manager-ask-not-current');
    const args = ['-NoProfile', '-NonInteractive', '-File',
      join(root, 'validation/windows/manager-permission-window.ps1'),
      '-BrowserPid', String(currentPid), '-BrowserName', browserName,
      '-Profile', profile, '-Output', output, '-InvokeAllow',
      '-ExpectedCreationUtcTicks', receipt.creationUtcTicks,
      '-ExpectedSessionId', String(receipt.browserSessionId),
      '-ExpectedForegroundHandle', receipt.foregroundHandle];
    await run('powershell.exe', args,
      { timeout: 12_000, windowsHide: true, maxBuffer: 4_096 });
    const action = JSON.parse(await readFile(join(output, NATIVE_PERMISSION_ACTION_RECEIPT), 'utf8'));
    assert(['skipped', 'invoked', 'unverified-after-invoke'].includes(action.status),
      'Invalid native action receipt');
    assert.equal(action.capture, 'uia-only');
    assert.equal(action.screenshot, 'not-captured');
    assert.equal(action.permissionGrantAttempted, action.status !== 'skipped',
      'Native action attempt marker differs');
    if (action.status === 'invoked') {
      assert.equal(action.postProcessStable, true);
      assert.equal(action.postForegroundOwned, true);
    }
    return { ...diagnostic, action: { status: action.status, reason: action.reason ?? null,
      permissionGrantAttempted: action.permissionGrantAttempted,
      postProcessStable: action.postProcessStable ?? null,
      postForegroundOwned: action.postForegroundOwned ?? null } };
  } catch (error) {
    return { ...diagnostic, action: { status: 'unavailable',
      reason: error instanceof Error ? error.name : typeof error } };
  }
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function filename(index) { return `testuser_${TWEET_ID}_${index}.jpg`; }
export function fixtureZipEntries(images) {
  return images.map((bytes, index) => ({ filename: filename(index), bytes }));
}
function delay(ms) { return new Promise((resolveDelay) => setTimeout(resolveDelay, ms)); }

export function summarizeDownloadUrl(value) {
  const url = new URL(value);
  return { scheme: url.protocol, origin: url.origin };
}

export function requirePageBlobZipSource(value) {
  const source = summarizeDownloadUrl(value);
  assert.deepEqual(source, { scheme: 'blob:', origin: 'https://x.com' },
    'ZIP must be saved from a page-origin Blob URL');
  return source;
}

async function waitFor(read, label, timeoutMs = 15_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const value = await read();
    if (value !== undefined) return value;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function assertOwned(root, profile) {
  assert.equal(dirname(resolve(profile)), resolve(root), 'Profile is outside the task root');
  assert(basename(profile).startsWith(PROFILE_PREFIX), 'Profile prefix differs');
}

function safeRouteError(error) {
  const name = error instanceof Error ? error.name : typeof error;
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/https?:\/\/[^\s)]+/gu, '[url]').slice(0, 256);
  return { name, message };
}

/** Report only the twelve fixture media identities, without URLs or response bodies. */
export function watchFixtureMediaNetwork(context) {
  const events = [];
  let overflow = 0;
  const identify = (request) => {
    try {
      const url = new URL(request.url());
      if (url.protocol !== 'https:' || url.hostname !== 'pbs.twimg.com') return null;
      for (const [cohort, markers] of Object.entries(MEDIA_COHORTS)) {
        const index = markers.findIndex((marker) =>
          url.pathname === `/media/${marker}.jpg`);
        if (index >= 0) return { cohort, index };
      }
    } catch { /* Ignore non-URL browser requests. */ }
    return null;
  };
  const append = (kind, request, status = null) => {
    const media = identify(request);
    if (!media) return;
    if (events.length >= 64) { overflow += 1; return; }
    events.push({ kind, ...media, method: request.method(),
      resourceType: request.resourceType(), status });
  };
  const onRequest = (request) => append('request', request);
  const onResponse = (response) => append('response', response.request(), response.status());
  const onFailed = (request) => append('requestfailed', request);
  context.on('request', onRequest);
  context.on('response', onResponse);
  context.on('requestfailed', onFailed);
  return { events, overflow: () => overflow, dispose() {
    context.off('request', onRequest);
    context.off('response', onResponse);
    context.off('requestfailed', onFailed);
  } };
}

export function managerDetailsUrl(browserName, id) {
  assert(['chrome', 'msedge'].includes(browserName), 'Unsupported manager browser');
  return `${browserName === 'msedge' ? 'edge' : 'chrome'}://extensions/?id=${encodeURIComponent(id)}`;
}

export async function probeManagerUserScripts(page) {
  try {
    return await page.evaluate(async () => {
      try {
        const scripts = await chrome.userScripts.getScripts();
        return { available: true, registeredScriptCount: scripts.length };
      } catch (error) {
        return { available: false, errorType: error && typeof error.name === 'string'
          ? error.name : typeof error };
      }
    });
  } catch {
    return { available: false, errorType: 'PageEvaluationError' };
  }
}

export async function findEdgeUserScriptsControl(page, managerId) {
  assert(/^[a-p]{32}$/u.test(managerId), 'Invalid manager extension ID');
  assert(isOwnedManagerDetailsUrl(page.url(), managerDetailsUrl('msedge', managerId)),
    'Edge permission control requires owned extension details');
  const section = page.locator('access-section').filter({
    has: page.getByText(/^(?:사용자 스크립트 허용|Allow user scripts)$/iu),
  });
  await section.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await section.count(), 1, 'Expected exactly one owned Edge access section');
  assert(await section.evaluate((element, id) => element.id === id, managerId),
    'Labeled Edge access section belongs to another extension');
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

export function hasKnownChromeUserScriptsLabel(text) {
  return text.split(/\r?\n/u).some((line) =>
    /^(?:사용자 스크립트 허용|Allow user scripts)$/iu.test(line.trim()));
}

export function summarizeManagerFrameUrl(value, managerId) {
  try {
    const url = new URL(value);
    if (['edge:', 'chrome:'].includes(url.protocol) && url.hostname === 'extensions') {
      return `${url.protocol}//${url.hostname}${url.pathname}`;
    }
    if (url.protocol === 'chrome-extension:' && url.hostname === managerId) {
      return `${url.protocol}//${url.hostname}${url.pathname}`;
    }
  } catch { /* Unknown frame URLs are deliberately omitted. */ }
  return null;
}

export function isOwnedManagerDetailsUrl(value, detailsUrl) {
  try {
    const actual = new URL(value);
    const expected = new URL(detailsUrl);
    return ['edge:', 'chrome:'].includes(expected.protocol) &&
      expected.hostname === 'extensions' && expected.pathname === '/' &&
      expected.searchParams.size === 1 && expected.searchParams.has('id') &&
      actual.href === expected.href;
  } catch { return false; }
}

export function isOwnedManagerInspectionUrl(value, detailsUrl, managerId) {
  if (!isOwnedManagerDetailsUrl(detailsUrl, detailsUrl) ||
    new URL(detailsUrl).searchParams.get('id') !== managerId) return false;
  if (isOwnedManagerDetailsUrl(value, detailsUrl)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'chrome-extension:' && url.hostname === managerId &&
      !url.search && !url.hash;
  } catch { return false; }
}

export function isOwnedManagerOptionsUrl(value, managerId) {
  try {
    const url = new URL(value);
    return url.protocol === 'chrome-extension:' && url.hostname === managerId &&
      url.pathname === '/options.html' && !url.search;
  } catch { return false; }
}

export function isOwnedManagerPermissionAskUrl(value, managerId) {
  try {
    const url = new URL(value);
    return url.protocol === 'chrome-extension:' && url.hostname === managerId &&
      url.pathname === '/ask.html' && !url.hash && url.searchParams.size === 1 &&
      Boolean(url.searchParams.get('aid'));
  } catch { return false; }
}

export function requireManagerDownloadsHeading(actual, localizedDownloads) {
  assert.equal(actual.trim(), `${localizedDownloads} BETA`,
    'Manager Downloads section label differs');
}

export function managerSettingRowLabel(localizedName) {
  return `${localizedName}:`;
}

export function managerSettingRow(scope, localizedName) {
  const settingRowClass = 'contains(concat(" ", normalize-space(@class), " "), " settingstr ")';
  return scope.getByText(managerSettingRowLabel(localizedName), { exact: true })
    .locator(`xpath=ancestor::tr[${settingRowClass}][not(descendant::tr[${settingRowClass}])]`);
}

export async function captureAndConfirmManagerPermissionAsk(ask, managerId, output, okLabel) {
  assert(isOwnedManagerPermissionAskUrl(ask.url(), managerId),
    'Manager permission confirmation navigated away');
  if (output) {
    const screenshot = await ask.screenshot();
    assert(isOwnedManagerPermissionAskUrl(ask.url(), managerId),
      'Manager permission confirmation navigated away during capture');
    await writeFile(join(output, 'userscript-manager-download-permission.png'), screenshot);
  }
  assert(isOwnedManagerPermissionAskUrl(ask.url(), managerId),
    'Manager permission confirmation navigated away before confirmation');
  await ask.getByRole('button', { name: okLabel, exact: true }).click();
}

export function requireManagerUiLabels(labels) {
  assert(labels && typeof labels === 'object' && !Array.isArray(labels),
    'Manager returned invalid UI labels');
  assert.deepEqual(Object.keys(labels).sort(), ['install', 'installedUserscripts', 'utilities'],
    'Manager UI label keys differ');
  for (const value of Object.values(labels)) {
    assert(typeof value === 'string' && value.length > 0 && value.length <= 80 &&
      value.trim() === value && !/[\r\n\u0000-\u001f]/u.test(value),
    'Manager returned an invalid UI label');
  }
  return labels;
}

export async function readManagerUiLabels(page, managerId) {
  assert(isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager labels require its owned options page');
  const labels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (url.protocol !== 'chrome-extension:' || url.hostname !== expectedId ||
      url.pathname !== '/options.html' || url.search) {
      throw new Error('Manager options page navigated away');
    }
    return {
      utilities: chrome.i18n.getMessage('Utilities'),
      install: chrome.i18n.getMessage('Install'),
      installedUserscripts: chrome.i18n.getMessage('Installed_userscripts'),
    };
  }, managerId);
  assert(isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager options page navigated away after label lookup');
  return requireManagerUiLabels(labels);
}

export async function probeManagerDownloadsPermission(page, managerId) {
  assert(isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager downloads permission requires its owned options page');
  const granted = await page.evaluate(async (expectedId) => {
    const url = new URL(location.href);
    if (url.protocol !== 'chrome-extension:' || url.hostname !== expectedId ||
      url.pathname !== '/options.html' || url.search) {
      throw new Error('Manager options page navigated away');
    }
    return chrome.permissions.contains({ permissions: ['downloads'] });
  }, managerId);
  assert(isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager options page navigated away after permission lookup');
  assert.equal(typeof granted, 'boolean', 'Manager returned invalid downloads permission');
  return granted;
}

/** Select Tampermonkey's own Browser API option through its ordinary options UI. */
export async function configureManagerBrowserDownloads(page, managerId, output,
  captureNativePermission = async () => null) {
  assert(isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager download settings require its owned options page');
  const labels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (url.protocol !== 'chrome-extension:' || url.hostname !== expectedId ||
      url.pathname !== '/options.html' || url.search) {
      throw new Error('Manager options page navigated away');
    }
    return Object.fromEntries(['Settings', 'Config_Mode', 'Beginner', 'Downloads',
      'Download_Mode', 'Browser_API', 'Whitelisted_File_Extensions', 'Save',
      'Browser_API_Downloads', 'Click_here_to_allow_TM_to_start_downloads', 'Ok']
      .map((key) => [key, chrome.i18n.getMessage(key)]));
  }, managerId);
  for (const label of Object.values(labels)) {
    assert(typeof label === 'string' && label.length > 0 && label.length <= 120,
      'Manager returned an invalid download setting label');
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
  requireManagerDownloadsHeading(await downloads.locator('.section_head').innerText(), labels.Downloads);
  const whitelistRow = managerSettingRow(downloads, labels.Whitelisted_File_Extensions);
  assert.equal(await whitelistRow.count(), 1, 'Expected exactly one manager whitelist row');
  const whitelist = await whitelistRow.locator('input, textarea').evaluateAll((elements) =>
    elements.slice(0, 64).map((element) => element.value).filter((value) => typeof value === 'string'));
  assert(whitelist.some((value) => value.includes('jpe?g')) &&
    whitelist.some((value) => value.includes('zip')),
  'Manager whitelist does not visibly include JPG and ZIP');
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
  const askPromise = permissionWasGranted ? null : context.waitForEvent('page', {
    timeout: 5_000,
  }).catch(() => null);
  await save.click();
  let permissionAskShown = false;
  let permissionOkClicked = false;
  const ask = await askPromise;
  if (ask) {
    await ask.waitForURL(`chrome-extension://${managerId}/ask.html*`, { timeout: 5_000 });
    assert(isOwnedManagerPermissionAskUrl(ask.url(), managerId),
      'Manager permission confirmation navigated away');
    await ask.getByText(labels.Browser_API_Downloads, { exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 });
    await ask.getByText(labels.Click_here_to_allow_TM_to_start_downloads, { exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 });
    permissionAskShown = true;
    assert(isOwnedManagerPermissionAskUrl(ask.url(), managerId),
      'Manager permission confirmation navigated away');
    await captureAndConfirmManagerPermissionAsk(ask, managerId, output, labels.Ok);
    permissionOkClicked = true;
  }
  const nativeDiagnostic = permissionOkClicked
    ? await captureNativePermission(ask, managerId, context) : null;
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await page.getByText(labels.Settings, { exact: true }).first().click();
  const savedMode = managerSettingRow(page.locator('div.section.type_downloads'),
    labels.Download_Mode).locator('select');
  await savedMode.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await savedMode.count(), 1, 'Expected one saved manager Download Mode selector');
  const observed = await savedMode.inputValue();
  assert.equal(observed, 'chrome', 'Manager Browser API mode did not persist');
  const downloadsPermissionGranted = await probeManagerDownloadsPermission(page, managerId);
  return { requested: 'chrome', observed, configMode: '50',
    whitelistJpgZipPresent: true, permissionAskShown, permissionOkClicked,
    downloadsPermissionGranted, permissionPending: !downloadsPermissionGranted,
    nativeDiagnostic };
}

/** Enable only the ordinary Info setting in this owned manager profile. */
export async function configureManagerInfoLogging(page, managerId) {
  assert(isOwnedManagerOptionsUrl(page.url(), managerId),
    'Manager logging requires its owned options page');
  const labels = await page.evaluate((expectedId) => {
    const url = new URL(location.href);
    if (url.protocol !== 'chrome-extension:' || url.hostname !== expectedId ||
      url.pathname !== '/options.html' || url.search) {
      throw new Error('Manager options page navigated away');
    }
    return Object.fromEntries(['Settings', 'General', 'LogLevel', 'Info']
      .map((key) => [key, chrome.i18n.getMessage(key)]));
  }, managerId);
  for (const label of Object.values(labels)) {
    assert(typeof label === 'string' && label.length > 0 && label.length <= 120 &&
      label.trim() === label && !/[\r\n\u0000-\u001f]/u.test(label),
    'Manager returned an invalid logging label');
  }
  assert(isOwnedManagerOptionsUrl(page.url(), managerId), 'Manager options page navigated away');
  await page.getByText(labels.Settings, { exact: true }).first().click();
  const general = page.locator('div.section.type_general');
  await general.waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(await general.count(), 1, 'Expected exactly one manager General section');
  assert.equal((await general.locator('.section_head').innerText()).trim(), labels.General,
    'Manager General heading differs');
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

async function captureManagerDownloadsPermission(context, managerId) {
  let page;
  try {
    page = await context.newPage();
    await page.goto(`chrome-extension://${managerId}/options.html`,
      { waitUntil: 'domcontentloaded', timeout: 10_000 });
    return { granted: await probeManagerDownloadsPermission(page, managerId) };
  } catch (error) {
    return { errorType: error instanceof Error ? error.name : typeof error };
  } finally {
    await page?.close().catch(() => {});
  }
}

/** Run only in the owned manager options page; return no download URL or local path. */
export async function inspectManagerDownloadHistoryDocument({ managerId, fixtureUrl, expectedName,
  expectedPath, expectedBytes }) {
  const current = new URL(location.href);
  if (current.protocol !== 'chrome-extension:' || current.hostname !== managerId ||
      current.pathname !== '/options.html' || current.search || current.hash) {
    return { status: 'unowned-page', items: [] };
  }
  if (!chrome.downloads?.search) return { status: 'api-unavailable', items: [] };
  let found;
  try {
    found = await chrome.downloads.search({ url: fixtureUrl, limit: 9 });
  } catch {
    return { status: 'query-rejected', items: [] };
  }
  if (!Array.isArray(found)) return { status: 'invalid-result', items: [] };
  if (found.length > 8) return { status: 'overflow', items: [] };
  const reasons = new Set(['FILE_FAILED', 'FILE_ACCESS_DENIED', 'FILE_NO_SPACE',
    'FILE_NAME_TOO_LONG', 'FILE_TOO_LARGE', 'FILE_VIRUS_INFECTED',
    'FILE_TRANSIENT_ERROR', 'FILE_BLOCKED', 'FILE_SECURITY_CHECK_FAILED',
    'FILE_TOO_SHORT', 'FILE_HASH_MISMATCH', 'FILE_SAME_AS_SOURCE',
    'NETWORK_FAILED', 'NETWORK_TIMEOUT', 'NETWORK_DISCONNECTED',
    'NETWORK_SERVER_DOWN', 'NETWORK_INVALID_REQUEST', 'SERVER_FAILED',
    'SERVER_NO_RANGE', 'SERVER_BAD_CONTENT', 'SERVER_UNAUTHORIZED',
    'SERVER_CERT_PROBLEM', 'SERVER_FORBIDDEN', 'SERVER_UNREACHABLE',
    'SERVER_CONTENT_LENGTH_MISMATCH', 'SERVER_CROSS_ORIGIN_REDIRECT',
    'USER_CANCELED', 'USER_SHUTDOWN', 'CRASH']);
  const items = [];
  for (const item of found) {
    if (item?.url !== fixtureUrl) continue;
    if (!Number.isSafeInteger(item.id) || item.id < 0 ||
        !['in_progress', 'interrupted', 'complete'].includes(item.state)) {
      return { status: 'invalid-item', items: [] };
    }
    const nameMatch = typeof item.filename === 'string' &&
      item.filename.split(/[\\/]/u).at(-1) === expectedName;
    const pathMatch = typeof item.filename === 'string' &&
      item.filename.replaceAll('/', '\\').toLowerCase() ===
        expectedPath.replaceAll('/', '\\').toLowerCase();
    items.push({ id: item.id, state: item.state,
      interruptReason: item.error === undefined ? null
        : reasons.has(item.error) ? item.error : 'unknown',
      requestedNameMatch: nameMatch, ownedPathMatch: pathMatch,
      expectedSizeMatch: item.fileSize === expectedBytes, fixtureUrlMatch: true });
  }
  if (new Set(items.map(({ id }) => id)).size !== items.length) {
    return { status: 'ambiguous-ids', items: [] };
  }
  return { status: 'observed', items };
}

async function captureManagerDownloadHistory(context, managerId, downloads, savedName, expectedBytes) {
  let page;
  try {
    page = await context.newPage();
    await page.goto(`chrome-extension://${managerId}/options.html`,
      { waitUntil: 'domcontentloaded', timeout: 10_000 });
    if (!isOwnedManagerOptionsUrl(page.url(), managerId)) {
      return { status: 'unowned-page', items: [] };
    }
    const result = await page.evaluate(inspectManagerDownloadHistoryDocument,
      { managerId, fixtureUrl: FIRST_MEDIA_URL, expectedName: savedName,
        expectedPath: join(downloads, savedName), expectedBytes });
    if (!isOwnedManagerOptionsUrl(page.url(), managerId)) {
      return { status: 'unowned-page', items: [] };
    }
    return result;
  } catch (error) {
    return { status: 'capture-error', errorType: error instanceof Error ? error.name : typeof error,
      items: [] };
  } finally {
    await page?.close().catch(() => {});
  }
}

export function firstCurrentManagerDownloadHistory(before, after) {
  if (before.status !== 'observed' || after.status !== 'observed') {
    return { status: 'unknown', baselineStatus: before.status, queryStatus: after.status,
      items: [] };
  }
  const seen = new Set(before.items.map(({ id }) => id));
  const items = after.items.filter(({ id }) => !seen.has(id));
  return { status: items.length > 1 ? 'ambiguous' : 'observed',
    baselineCount: before.items.length, items: items.length > 1 ? [] : items };
}

/** Each action must produce one new, complete native item with the exact saved file. */
export function selectCompletedManagerDownload(before, after) {
  assert.equal(before.status, 'observed', 'Native download baseline is unavailable');
  assert.equal(after.status, 'observed', 'Native download history is unavailable');
  const seen = new Set(before.items.map(({ id }) => id));
  const created = after.items.filter(({ id }) => !seen.has(id));
  assert(created.length <= 1, 'One action created multiple native download items');
  if (!created.length) return undefined;
  const item = created[0];
  if (item.state === 'in_progress') return undefined;
  assert.equal(item.state, 'complete', 'Native download did not complete');
  assert.equal(item.interruptReason, null, 'Completed native download has an interrupt reason');
  assert.equal(item.fixtureUrlMatch, true, 'Native download URL differs');
  assert.equal(item.requestedNameMatch, true, 'Native saved filename differs');
  assert.equal(item.ownedPathMatch, true, 'Native download escaped the owned directory');
  assert.equal(item.expectedSizeMatch, true, 'Native download size differs');
  return { nativeId: item.id, nativeState: 'complete', completionSource: 'chrome.downloads.search' };
}

async function captureManagerPermissionDiagnostics(page, detailsUrl, output, probe) {
  const managerId = new URL(detailsUrl).searchParams.get('id');
  const diagnostics = { api: probe,
    requestedUrl: summarizeManagerFrameUrl(detailsUrl, managerId) };
  let ownedDetailsPage = false;
  try {
    await page.goto(detailsUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 });
    assert(isOwnedManagerDetailsUrl(page.url(), detailsUrl),
      'Permission diagnostic did not reach the owned extension details page');
    ownedDetailsPage = true;
    const title = (await page.title()).slice(0, 120);
    assert(isOwnedManagerDetailsUrl(page.url(), detailsUrl), 'Permission details page navigated away');
    const screenshot = await page.screenshot();
    assert(isOwnedManagerDetailsUrl(page.url(), detailsUrl), 'Permission details page navigated away');
    const allowUserScriptsVisible = await page.locator('#allow-user-scripts cr-toggle').isVisible();
    const toggleControls = await page.locator('cr-toggle').evaluateAll((elements) =>
      elements.slice(0, 32).map((element) => ({
        id: element.id.slice(0, 80),
        ariaLabel: element.getAttribute('aria-label')?.slice(0, 80) ?? null,
        checked: Boolean(element.checked),
      })));
    assert(isOwnedManagerDetailsUrl(page.url(), detailsUrl), 'Permission details page navigated away');
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
    const skipped = { api: probe, requestedUrl: diagnostics.requestedUrl,
      frameCount: diagnostics.frameCount,
      captureErrorType: diagnostics.captureErrorType ?? null,
      contentSkipped: 'unowned-or-unavailable-details-page' };
    await writeFile(join(output, 'userscript-manager-permission.json'), JSON.stringify(skipped, null, 2));
    return;
  }
  try {
    const frames = page.frames();
    diagnostics.frames = await Promise.all(frames.slice(0, 12).map(async (frame, index) => {
      const summary = { index, url: summarizeManagerFrameUrl(frame.url(), managerId) };
      if (!isOwnedManagerDetailsUrl(page.url(), detailsUrl) ||
        !isOwnedManagerInspectionUrl(frame.url(), detailsUrl, managerId)) {
        summary.skipped = 'unowned-frame';
        return summary;
      }
      try {
        summary.document = await frame.evaluate(({ expectedDetailsUrl, expectedManagerId }) => {
          const current = new URL(location.href);
          const ownedDetails = location.href === expectedDetailsUrl;
          const ownedExtension = current.protocol === 'chrome-extension:' &&
            current.hostname === expectedManagerId && !current.search && !current.hash;
          if (!ownedDetails && !ownedExtension) return { skipped: 'frame-navigated-away' };
          const knownLabels = new Set(['사용자 스크립트 허용', 'Allow user scripts']);
          const describe = (element) => ({
            tag: element.tagName.toLowerCase().slice(0, 40),
            id: element.id?.slice(0, 80) ?? null,
            role: element.getAttribute('role')?.slice(0, 40) ?? null,
            type: element.getAttribute('type')?.slice(0, 40) ?? null,
            label: (element.getAttribute('label') ?? element.labels?.[0]?.textContent?.trim())
              ?.slice(0, 80) ?? null,
            ariaLabel: element.getAttribute('aria-label')?.slice(0, 80) ?? null,
            ariaChecked: element.getAttribute('aria-checked')?.slice(0, 12) ?? null,
            checked: typeof element.checked === 'boolean' ? element.checked : null,
          });
          const labels = [];
          const controls = [];
          const embedded = [];
          let visited = 0;
          const visit = (node) => {
            if (++visited > 4_000) return;
            if (node.nodeType === Node.TEXT_NODE && labels.length < 4 &&
              knownLabels.has(node.textContent?.trim())) {
              const ancestry = [];
              const nearbyControls = [];
              for (let element = node.parentElement; element && ancestry.length < 5;
                element = element.parentElement ?? element.getRootNode().host ?? null) {
                ancestry.push(describe(element));
                if (ancestry.length <= 3) {
                  const candidates = element.querySelectorAll(
                    'input, button, [role="switch"], [role="checkbox"], fluent-switch, cr-toggle'
                  );
                  for (const candidate of Array.from(candidates).slice(0, 8)) {
                    if (nearbyControls.length < 16) nearbyControls.push(describe(candidate));
                  }
                }
              }
              labels.push({ ancestry, nearbyControls });
            }
            if (node instanceof Element) {
              const tag = node.tagName.toLowerCase();
              if (controls.length < 64 &&
                (/switch|toggle|checkbox/u.test(tag) ||
                  ['input', 'button'].includes(tag) ||
                  ['switch', 'checkbox'].includes(node.getAttribute('role')))) {
                controls.push(describe(node));
              }
              if (embedded.length < 16 && ['iframe', 'webview', 'object'].includes(tag)) {
                embedded.push(describe(node));
              }
              if (node.shadowRoot) visit(node.shadowRoot);
            }
            for (const child of node.childNodes) {
              if (visited >= 4_000) break;
              visit(child);
            }
          };
          visit(document.documentElement);
          return { readyState: document.readyState, visitedNodes: visited,
            labelMatches: labels, controls, embedded };
        }, { expectedDetailsUrl: detailsUrl, expectedManagerId: managerId });
      } catch (error) {
        summary.errorType = error instanceof Error ? error.name : typeof error;
      }
      return summary;
    }));
  } catch (error) {
    diagnostics.frameErrorType = error instanceof Error ? error.name : typeof error;
  }
  if (isOwnedManagerDetailsUrl(page.url(), detailsUrl)) {
    try {
      const snapshot = await page.locator('body').ariaSnapshot({ timeout: 5_000 });
      assert(isOwnedManagerDetailsUrl(page.url(), detailsUrl), 'Permission details page navigated away');
      const safe = snapshot.replace(/[A-Za-z]:\\[^\n]*/gu, '[path]')
        .replace(/https?:\/\/[^\s"']+/gu, '[url]');
      const lines = safe.split('\n');
      const labelIndex = lines.findIndex((line) =>
        line.includes('사용자 스크립트 허용') || line.includes('Allow user scripts'));
      diagnostics.ariaSnapshot = { labelContext: labelIndex < 0 ? null
        : lines.slice(Math.max(0, labelIndex - 1), labelIndex + 2).join('\n').slice(0, 1_024) };
    } catch (error) {
      diagnostics.ariaSnapshotErrorType = error instanceof Error ? error.name : typeof error;
    }
  }
  if (!isOwnedManagerDetailsUrl(page.url(), detailsUrl)) {
    const skipped = { api: probe, requestedUrl: diagnostics.requestedUrl,
      frameCount: diagnostics.frameCount, contentSkipped: 'details-page-navigated-away' };
    await writeFile(join(output, 'userscript-manager-permission.json'), JSON.stringify(skipped, null, 2));
    return;
  }
  await writeFile(join(output, 'userscript-manager-permission.json'), JSON.stringify(diagnostics, null, 2));
}

async function installUserscript(context, id, root, output, browserName, sourceSha256, profile,
  captureNativePermission) {
  const manifest = JSON.parse(await readFile(join(root, 'test-tools/userscript-manager/manifest.json'), 'utf8'));
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
          if (!await control.evaluate((element) => element.checked)) await control.click();
          await waitFor(async () => await control.evaluate((element) => element.checked)
            ? true : undefined,
            'Edge user-scripts permission enabled', 5_000);
          await page.reload({ waitUntil: 'domcontentloaded' });
          assert(isOwnedManagerDetailsUrl(page.url(), detailsUrl),
            'Edge extension details navigated away after permission change');
          permissionPath = 'edge-labeled-ui-control';
        } else {
          const toggle = page.locator('#allow-user-scripts cr-toggle');
          const label = page.locator('#allow-user-scripts');
          if (await toggle.count() !== 1 || !await toggle.isVisible() ||
            await label.count() !== 1 ||
            !hasKnownChromeUserScriptsLabel(await label.innerText())) {
            throw new Error('Manager userScripts API unavailable and no verified UI permission control');
          }
          if (!await toggle.evaluate((element) => element.checked)) await toggle.click();
          assert(await toggle.evaluate((element) => element.checked), 'Manager user-scripts control stayed disabled');
          const keep = page.getByRole('button', { name: 'Keep', exact: true });
          if (await keep.isVisible()) await keep.click();
          const reload = page.locator('extensions-detail-view #dev-reload-button');
          assert(await reload.isVisible(), 'Manager permission changed but extension reload control is unavailable');
          const restarted = context.waitForEvent('serviceworker', {
            predicate: (worker) => worker.url().startsWith(`chrome-extension://${id}/`), timeout: 15_000,
          });
          await reload.click();
          await restarted;
          permissionPath = 'chrome-labeled-ui-toggle-and-reload';
        }
        await page.goto(optionsUrl);
        permission = await probeManagerUserScripts(page);
        assert(permission.available, 'Manager userScripts API unavailable after UI permission change');
      } catch (error) {
        await captureManagerPermissionDiagnostics(page, detailsUrl, output, permission);
        throw error;
      }
    }
    assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page is not owned');
    const admission = { browserName, managerId: id, managerVersion: manifest.version,
      sourceSha256, permission: { path: permissionPath, available: permission.available,
        registeredScriptCount: permission.registeredScriptCount } };
    const admissionPath = join(output, 'userscript-manager-admission.json');
    await writeFile(admissionPath, JSON.stringify(admission, null, 2));
    const optionsScreenshot = await page.screenshot();
    assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page navigated away');
    await writeFile(join(output, 'userscript-manager-options.png'), optionsScreenshot);
    const labels = await readManagerUiLabels(page, id);
    await writeFile(admissionPath, JSON.stringify({ ...admission, labels }, null, 2));
    let downloadMode;
    try {
      downloadMode = await configureManagerBrowserDownloads(page, id, output,
        captureNativePermission);
    } catch (error) {
      const ownedOptions = isOwnedManagerOptionsUrl(page.url(), id);
      const diagnostic = { errorType: error instanceof Error ? error.name : typeof error,
        ownedOptions, downloadsSections: null, captureErrorType: null };
      if (ownedOptions) {
        try {
          diagnostic.downloadsSections = await page.locator('div.section.type_downloads').count();
          const screenshot = await page.screenshot();
          assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page navigated away');
          await writeFile(join(output, 'userscript-manager-download-settings-failed.png'), screenshot);
        } catch (captureError) {
          diagnostic.captureErrorType = captureError instanceof Error ? captureError.name
            : typeof captureError;
        }
      }
      await writeFile(join(output, 'userscript-manager-download-settings-failed.json'),
        JSON.stringify(diagnostic, null, 2));
      throw error;
    }
    await writeFile(admissionPath, JSON.stringify({ ...admission, labels, downloadMode }, null, 2));
    assertOwned(root, profile);
    assert.equal(manifest.version, '5.5.1', 'Unknown manager logging source version');
    assert.equal(sha256(await readFile(join(root, 'test-tools/userscript-manager/background.js'))),
      MANAGER_BACKGROUND_SHA256, 'Manager logging source changed');
    const logging = await configureManagerInfoLogging(page, id);
    await writeFile(admissionPath,
      JSON.stringify({ ...admission, labels, downloadMode, logging }, null, 2));
    await page.getByText(labels.utilities, { exact: true }).click();
    const confirmationPromise = context.waitForEvent('page');
    await page.locator('input[type=file]').setInputFiles(join(root, 'dist/xcom-enhanced-gallery.user.js'));
    const confirmation = await confirmationPromise;
    await confirmation.waitForURL(`chrome-extension://${id}/ask.html*`);
    const confirmationUrl = new URL(confirmation.url());
    assert(confirmationUrl.protocol === 'chrome-extension:' &&
      confirmationUrl.hostname === id && confirmationUrl.pathname === '/ask.html',
    'Manager confirmation page is not owned');
    const closed = confirmation.waitForEvent('close');
    await confirmation.getByRole('button', { name: labels.install, exact: true }).click();
    await closed;
    await page.reload();
    assert(isOwnedManagerOptionsUrl(page.url(), id), 'Manager options page is not owned after reload');
    await page.getByText(labels.installedUserscripts, { exact: true }).first().click();
    await page.getByText(SCRIPT_NAME, { exact: true }).first().waitFor({ state: 'visible' });
    await page.screenshot({ path: join(output, 'userscript-installed.png') });
    return { id, managerName: 'Tampermonkey', managerVersion: manifest.version,
      scriptName: SCRIPT_NAME, method: 'real-manager-ui-import',
      userScriptsPermission: { path: permissionPath,
        available: permission.available, registeredScriptCount: permission.registeredScriptCount },
      downloadMode, logging };
  } finally {
    await page.close();
  }
}

/** Browser-level events require no optional permissions from Tampermonkey. */
export function createBrowserDownloadObserver(cdp) {
  const begun = [];
  const progress = new Map();
  const onBegin = (event) => {
    assert(begun.length < MAX_DOWNLOADS + 4, 'Too many task-profile downloads');
    begun.push({ guid: event.guid, suggestedFilename: event.suggestedFilename,
      url: event.url });
  };
  const onProgress = (event) => {
    progress.set(event.guid, { state: event.state,
      receivedBytes: event.receivedBytes, totalBytes: event.totalBytes,
      filePath: event.filePath ?? null });
  };
  cdp.on('Browser.downloadWillBegin', onBegin);
  cdp.on('Browser.downloadProgress', onProgress);
  return {
    snapshot: () => begun.length,
    events: () => begun.map(({ guid, suggestedFilename, url }) => ({
      guid, suggestedFilename, source: summarizeDownloadUrl(url),
    })),
    async flush() { await cdp.send('Browser.getVersion'); },
    async waitForCompletion(since, ...expectedNames) {
      const item = await waitFor(() => {
        const created = begun.slice(since);
        assert(created.length <= 1, `One action created ${created.length} native downloads`);
        if (!created.length) return undefined;
        const candidate = created[0];
        assert(expectedNames.includes(candidate.suggestedFilename),
          'Browser download request used an unexpected filename');
        const status = progress.get(candidate.guid);
        if (status?.state === 'canceled') throw new Error('Browser canceled the native download');
        return status?.state === 'completed' ? { ...candidate, ...status } : undefined;
      }, `CDP native completion of ${expectedNames[0]}`, 30_000);
      return item;
    },
    async assertNoneSince(since, label) {
      await cdp.send('Browser.getVersion');
      assert.deepEqual(begun.slice(since), [], `${label} created a native download`);
    },
    dispose() {
      cdp.off('Browser.downloadWillBegin', onBegin);
      cdp.off('Browser.downloadProgress', onProgress);
    },
  };
}

async function waitForDownload(observer, since, beforeFiles, requestedName, savedName,
  downloads, expectedBytes) {
  const item = await observer.waitForCompletion(since, requestedName, savedName);
  const source = requestedName.endsWith('.zip')
    ? requirePageBlobZipSource(item.url) : summarizeDownloadUrl(item.url);
  if (item.filePath !== null) {
    assert(resolve(item.filePath) === resolve(downloads, savedName),
      'CDP completed a file outside the exact owned download path');
  }
  const bytes = await readOwnedDownload(beforeFiles, savedName, downloads, expectedBytes);
  return { guid: item.guid, requestedName, filename: savedName, source,
    bytes, sha256: sha256(bytes),
    nativeState: item.state, browserBytesReceived: item.receivedBytes };
}

async function readOwnedDownload(beforeFiles, savedName, downloads, expectedBytes) {
  const added = await waitFor(async () => {
    const names = await readdir(downloads);
    const newNames = names.filter((name) => !beforeFiles.has(name) && !name.endsWith('.crdownload'));
    assert(newNames.length <= 1, `One action saved ${newNames.length} files`);
    return newNames.length ? newNames : undefined;
  }, `native saved file for ${savedName}`);
  assert(added.length === 1 && added[0] === savedName, 'Native saved filename differs');
  const { bytes } = await readExactDownloadFile(join(downloads, savedName), expectedBytes);
  assert.equal((await readdir(downloads)).filter((name) => name.endsWith('.crdownload')).length,
    0, 'Partial native download remained');
  return bytes;
}

async function waitForManagerDownload(context, managerId, observer, since, beforeFiles,
  historyBefore, requestedName, savedName, downloads, expectedBytes) {
  const native = await waitFor(async () => selectCompletedManagerDownload(historyBefore,
    await captureManagerDownloadHistory(context, managerId, downloads, savedName, expectedBytes)),
  `native manager completion of ${savedName}`, 30_000);
  const bytes = await readOwnedDownload(beforeFiles, savedName, downloads, expectedBytes);
  await observer.flush();
  const cdpCount = observer.snapshot() - since;
  assert(cdpCount <= 1, 'One manager action created multiple CDP downloads');
  const cdpItem = cdpCount
    ? await observer.waitForCompletion(since, requestedName, savedName) : null;
  if (cdpItem) {
    assert(cdpItem.url === FIRST_MEDIA_URL, 'Manager CDP download URL differs');
    assert.equal(cdpItem.receivedBytes, expectedBytes, 'Manager CDP received byte count differs');
    if (cdpItem.filePath !== null) {
      assert(resolve(cdpItem.filePath) === resolve(downloads, savedName),
        'Manager CDP completed outside the owned download path');
    }
  }
  return { ...native, guid: cdpItem?.guid ?? null, requestedName, filename: savedName,
    source: summarizeDownloadUrl(FIRST_MEDIA_URL), bytes, sha256: sha256(bytes),
    browserBytesReceived: cdpItem?.receivedBytes ?? null,
    cdpObservation: cdpItem ? 'completed' : 'absent' };
}

function browserFilename(name, duplicate) {
  if (duplicate === 0) return name;
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot)} (${duplicate})${name.slice(dot)}`;
}

export async function observeNoNativeDownload(observer, since, beforeFiles, downloads,
  label, durationMs = 0) {
  assert(Number.isSafeInteger(durationMs) && durationMs >= 0 && durationMs <= 5_000,
    'Native absence observation must be bounded');
  const started = Date.now();
  let samples = 0;
  do {
    await observer.assertNoneSince(since, label);
    assert.deepEqual((await readdir(downloads)).sort(), [...beforeFiles].sort(),
      `${label} left a file in the owned directory`);
    samples += 1;
    const remaining = durationMs - (Date.now() - started);
    if (remaining <= 0) break;
    await delay(Math.min(50, remaining));
  } while (true);
  return { observedMs: Date.now() - started, samples,
    boundary: 'bounded browser events and owned files after held request terminal; not manager callback completion' };
}

export async function inspectFirstCurrentDownload(page) {
  if (page.url() !== FIXTURE_URL) return { scope: 'unowned-page' };
  const observation = await page.evaluate((expectedUrl) => {
    if (location.href !== expectedUrl) return { scope: 'navigated-away' };
    const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
    if (galleries.length !== 1) return { scope: 'unowned-gallery' };
    const gallery = galleries[0];
    const toolbar = gallery.querySelector('[data-gallery-element="toolbar"]');
    const current = toolbar?.querySelector('button[aria-label="Download"]');
    const selected = gallery.querySelector('[data-gallery-element="item"][data-index="0"] img');
    const source = selected instanceof HTMLImageElement ? new URL(selected.src) : null;
    const selectedFirstFixtureMedia = source?.origin === 'https://pbs.twimg.com' &&
      source.pathname === '/media/GkE1234ABCDEF.jpg';
    const status = toolbar?.querySelector('[role="status"][data-download-status]')
      ?.getAttribute('data-download-status');
    const liveRegions = gallery.querySelectorAll('div.xeg-sr-only[aria-live="polite"][aria-atomic="true"]');
    const errorText = selectedFirstFixtureMedia && status === 'error' && liveRegions.length === 1
      ? liveRegions[0].textContent?.slice(0, 2_048) : null;
    const normalizedError = errorText?.replace(/(?:https?|blob|file|chrome-extension):\/\/[^\s<>"']+/giu, '[url]')
      .replace(/(?:[A-Za-z]:\\|\\\\)[^\r\n]*/gu, '[path]')
      .replace(/\/(?:home|Users|tmp|var|mnt|etc)\/[^\r\n]*/gu, '[path]')
      .replace(/\b(?:bearer|token|api[-_]?key|secret|session|authorization|cookie|password)\b[^\r\n]*/giu,
        '[credential]')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, '[email]')
      .replace(/\b[A-Za-z0-9_-]{32,}\b/gu, '[opaque]')
      .replace(/\s+/gu, ' ').trim().slice(0, 256) || null;
    if (location.href !== expectedUrl || !gallery.isConnected ||
        document.querySelectorAll('[data-xeg-gallery-container]').length !== 1 ||
        document.querySelector('[data-xeg-gallery-container]') !== gallery) {
      return { scope: 'gallery-changed' };
    }
    return {
      scope: 'owned-fixture',
      galleryPresent: true,
      currentControlPresent: Boolean(current),
      currentControlDisabled: current instanceof HTMLButtonElement ? current.disabled : null,
      currentControlBusy: current?.getAttribute('aria-busy') === 'true',
      selectedFirstFixtureMedia,
      downloadStatus: ['working', 'handedOff', 'error'].includes(status) ? status : null,
      errorLiveRegionPresent: liveRegions.length === 1,
      errorLiveRegionText: normalizedError,
    };
  }, FIXTURE_URL);
  return page.url() === FIXTURE_URL ? observation : { scope: 'navigated-away' };
}

const MANAGER_CONSOLE_BRANCHES = ['manager_request_branch', 'permission_true',
  'permission_false', 'not_enabled_branch', 'not_supported_branch', 'not_permitted_branch',
  'download_failed_branch', 'not_whitelisted_branch', 'native_interrupted_branch',
  'native_query_failed_branch'];
const MANAGER_BACKGROUND_SHA256 = '7377109daee3340f6f1f89d06f8099e92583229231b25d0f950653a63fb7dd32';

/** Match only known Tampermonkey 5.5.1 background.js download log shapes. */
export function classifyManagerDownloadConsole(value) {
  if (typeof value !== 'string' || value.length > 4_096) return null;
  const offset = value.indexOf('downs: ');
  if (offset < 0 || offset > 64) return null;
  const line = value.slice(offset);
  if (/^downs: start(?:\s|$)/u.test(line)) return 'manager_request_branch';
  if (line === 'downs: permission to use downloads -> true') return 'permission_true';
  if (line === 'downs: permission to use downloads -> false') return 'permission_false';
  if (line === 'downs: feature is not enabled') return 'not_enabled_branch';
  if (/^downs: (?:this download mode is not supported|invalid transferable|can't get URL from transferable)$/u.test(line))
    return 'not_supported_branch';
  if (line === 'downs: download permission is missing') return 'not_permitted_branch';
  if (line === 'downs: download failed') return 'download_failed_branch';
  if (/^downs: "[^\n]+" is not whitelisted$/u.test(line)) return 'not_whitelisted_branch';
  if (/^downs: download of .+ \(.+\) failed(?:\s.*)?$/u.test(line))
    return 'native_interrupted_branch';
  if (/^downs: unable to query download ID(?:\s.*)?$/u.test(line))
    return 'native_query_failed_branch';
  return null;
}

/** Passive, bounded observation of the one admitted manager's service worker. */
export function watchManagerDownloadConsole(context, managerId) {
  assert(/^[a-p]{32}$/u.test(managerId), 'Invalid manager extension ID');
  const expectedUrl = `chrome-extension://${managerId}/background.js`;
  const listeners = new Map();
  const counts = Object.fromEntries(MANAGER_CONSOLE_BRANCHES.map((branch) => [branch, 0]));
  let attachments = 0;
  let attachmentOverflow = false;
  let inspectedMessages = 0;
  let messageOverflow = false;
  let recognizedEvents = 0;
  let eventOverflow = false;
  let consoleUnavailable = false;
  let disposed = false;
  const attach = (worker) => {
    if (disposed || listeners.has(worker)) return;
    try { if (worker.url() !== expectedUrl) return; } catch { consoleUnavailable = true; return; }
    if (attachments >= 8) { attachmentOverflow = true; return; }
    const onConsole = (message) => {
      if (disposed) return;
      if (inspectedMessages >= 256) { messageOverflow = true; return; }
      inspectedMessages++;
      let value;
      try { value = message.text(); } catch { consoleUnavailable = true; return; }
      const branch = classifyManagerDownloadConsole(value);
      if (!branch) return;
      if (recognizedEvents >= 16) { eventOverflow = true; return; }
      counts[branch]++;
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
    for (const worker of context.serviceWorkers()) attach(worker);
  } catch {
    consoleUnavailable = true;
  }
  const mark = () => ({ counts: { ...counts }, attachments, recognizedEvents });
  return {
    mark,
    snapshotSince(before) {
      const branches = Object.fromEntries(MANAGER_CONSOLE_BRANCHES.map((branch) =>
        [branch, counts[branch] - before.counts[branch]]));
      const matched = recognizedEvents - before.recognizedEvents;
      return { status: matched > 0 ? 'known-branch-observed' : 'inconclusive',
        availability: consoleUnavailable ? 'unavailable'
          : before.attachments > 0 ? 'attached-before-click'
            : attachments > 0 ? 'attached-after-click' : 'no-worker-observed',
        branchCounts: branches, matchedEvents: matched,
        workersAttachedBeforeClick: before.attachments,
        workersAttachedAfterClick: attachments,
        attachmentOverflow, messageOverflow, eventOverflow, consoleUnavailable };
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

async function runFixture(context, observer, root, output, downloads, images, loopback, managerId,
  managerVersion, profile, sourceSha256) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const routeRecords = [];
  const result = { status: 'failed', downloads: [], routes: routeRecords, routeFailures: [],
    routeFailureOverflow: 0, transportReceipts: {}, cases: {}, cleanup: {} };
  let phase = 'normal';
  let managerConsole;
  const mediaNetwork = watchFixtureMediaNetwork(context);
  const routeFixture = async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') {
      await route.continue();
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: html });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname === '/favicon.ico') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      if (isPublicAvatarFixtureUrl(url.href)) {
        await route.fulfill({ status: 200, contentType: 'image/jpeg', body: images[0] });
        return;
      }
      const cohort = Object.entries(MEDIA_COHORTS).find(([, markers]) =>
        markers.some((marker) => url.pathname.includes(marker)));
      assert(cohort, 'Unknown media fixture request');
      const [mediaPhase, markers] = cohort;
      const index = markers.findIndex((marker) => url.pathname.includes(marker));
      assert(routeRecords.length < 64, 'Fixture exceeded its routed request limit');
      const record = { phase, mediaPhase, index, resourceType: route.request().resourceType(),
        method: route.request().method() };
      routeRecords.push(record);
      if (route.request().resourceType() !== 'image') {
        assert.equal(route.request().method(), 'GET', 'Fixture download used an unexpected method');
        record.result = 'loopback';
        await route.continue();
        return;
      }
      if (mediaPhase === phase && (phase === 'failure' || (phase === 'partial' && index === 1))) {
        record.result = 'http-503';
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'fixture unavailable' });
        return;
      }
      record.result ??= 'image';
      await route.fulfill({ status: 200, contentType: 'image/jpeg', body: images[index] });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname.endsWith('/TweetResultByRestId')) {
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.abort('blockedbyclient');
  };
  const handler = async (route) => {
    try {
      await routeFixture(route);
    } catch (error) {
      const url = new URL(route.request().url());
      if (result.routeFailures.length < 8) {
        result.routeFailures.push({ phase, error: safeRouteError(error),
          request: { host: ['x.com', 'pbs.twimg.com'].includes(url.hostname) ? url.hostname : 'other',
            pathKind: url.pathname === PUBLIC_AVATAR_PATH ? 'fixture-avatar'
              : url.pathname.startsWith('/media/') ? 'media' : 'other',
            resourceType: route.request().resourceType() } });
      } else result.routeFailureOverflow += 1;
      await route.abort('blockedbyclient').catch(() => {});
    }
  };
  await context.route('**/*', handler);
  const page = await context.newPage();
  try {
    await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const current = gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]');
    const all = gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]');
    const expectedEntries = fixtureZipEntries(images);
    const showPhase = async (nextPhase) => {
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      loopback.setPhase(nextPhase);
      phase = nextPhase;
      await page.locator('main').evaluate((main, selected) => {
        main.dataset.fixturePhase = selected;
      }, nextPhase);
      const nextTrigger = page.locator(`[data-phase="${nextPhase}"] [data-testid="tweetPhoto"] img`).first();
      await nextTrigger.click();
      await gallery.waitFor({ state: 'visible' });
      return nextTrigger;
    };
    assert.equal(observer.snapshot(), 0, 'Task profile has prior native downloads');
    assert.deepEqual(await readdir(downloads), [], 'Task download directory is not empty');
    assertOwned(root, profile);
    assert.equal(managerVersion, '5.5.1', 'Unknown manager download log version');
    assert.equal(sha256(await readFile(join(root, 'test-tools/userscript-manager/background.js'))),
      MANAGER_BACKGROUND_SHA256, 'Manager download log source changed');
    assert.equal(sha256(await readFile(join(root, 'dist/xcom-enhanced-gallery.user.js'))),
      sourceSha256, 'Userscript source changed before manager console observation');
    managerConsole = watchManagerDownloadConsole(context, managerId);
    for (let repetition = 0; repetition < 2; repetition++) {
      const singleSince = observer.snapshot();
      const singleBefore = new Set(await readdir(downloads));
      const savedSingleName = browserFilename(filename(0), repetition);
      const historyBefore = await captureManagerDownloadHistory(context, managerId,
        downloads, savedSingleName, images[0].length);
      assert.equal(historyBefore.status, 'observed', 'Native download baseline is unavailable');
      const consoleBefore = repetition === 0 ? managerConsole.mark() : null;
      const singleTransportStart = loopback.mark();
      let single;
      try {
        await current.click();
        single = await waitForManagerDownload(context, managerId, observer, singleSince,
          singleBefore, historyBefore, filename(0), savedSingleName, downloads, images[0].length);
      } catch (error) {
        if (repetition === 0) {
          const managerConsoleClick = managerConsole.snapshotSince(consoleBefore);
          result.firstCurrentDownload = {
            fixture: await inspectFirstCurrentDownload(page).catch((captureError) =>
              ({ errorType: captureError instanceof Error ? captureError.name : typeof captureError })),
            managerDownloadsPermission: await captureManagerDownloadsPermission(context, managerId),
            managerConsole: managerConsoleClick,
            managerDownloadHistory: firstCurrentManagerDownloadHistory(historyBefore,
              await captureManagerDownloadHistory(context, managerId, downloads,
                savedSingleName, images[0].length)),
          };
        }
        throw error;
      }
      const singleTransport = await waitFor(() =>
        loopback.findSince(singleTransportStart, 'normal', 0, 'served'),
      'first media HTTPS loopback response');
      assert.equal(singleTransport.sha256, sha256(images[0]));
      assert(single.bytes.equals(images[0]), 'Single saved bytes differ');
      result.downloads.push({ kind: 'single', repetition, ...single, bytes: single.bytes.length });
      await waitFor(async () => await current.isEnabled() ? true : undefined, 'single control ready');
      const zipSince = observer.snapshot();
      const zipBefore = new Set(await readdir(downloads));
      const zipTransportStart = loopback.mark();
      await all.click();
      const zipName = FIXTURE_ZIP_NAME;
      const zip = await waitForDownload(observer, zipSince, zipBefore,
        zipName, browserFilename(zipName, repetition), downloads,
        expectedStoredZipBytes(expectedEntries));
      const verified = verifyStoredZip(zip.bytes, expectedEntries);
      if (repetition === 0) {
        const firstResponses = [];
        for (const index of [0, 1, 2]) {
          const transport = await waitFor(() =>
            loopback.findSince(zipTransportStart, 'normal', index, 'served'),
          `first ZIP media ${index} HTTPS loopback response`);
          assert.equal(transport.sha256, sha256(images[index]));
          firstResponses.push({ ...transport });
        }
        result.transportReceipts.normalZip = { firstResponses };
      } else {
        assert.equal(result.transportReceipts.normalZip.firstResponses.length, 3,
          'Repeated ZIP has no verified first ZIP transport provenance');
        result.transportReceipts.normalZip.repeated = {
          source: 'same-page-first-zip-verified-media-cache-or-refetch',
          additionalTransferResponses: loopback.snapshot().events.slice(zipTransportStart)
            .filter((event) => event.phase === 'normal' && event.purpose === 'transfer' &&
              event.result === 'served').length,
        };
      }
      result.downloads.push({ kind: 'zip', repetition, ...zip, bytes: zip.bytes.length,
        entryOrder: verified.entryOrder, included: verified.entries.length, omitted: 0 });
      await waitFor(async () => await all.isEnabled() ? true : undefined, 'ZIP control ready');
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
    const failedTransport = await waitFor(() =>
      loopback.findSince(failureTransportStart, 'failure', 0, 'http-503'),
    'post-click HTTPS loopback transport failure');
    result.transportReceipts.networkFailure = { ...failedTransport };
    await waitFor(async () => await all.isEnabled() ? true : undefined, 'failed control ready');
    await observeNoNativeDownload(observer, failureSince, failureBefore, downloads,
      'Transport failure');
    result.cases.networkFailure = 'passed';

    await showPhase('partial');
    const partialSince = observer.snapshot();
    const partialBefore = new Set(await readdir(downloads));
    const partialTransportStart = loopback.mark();
    await all.click();
    const includedEntries = expectedEntries.filter((_, index) => index !== 1);
    const partialName = FIXTURE_ZIP_NAME;
    const partial = await waitForDownload(observer, partialSince, partialBefore,
      partialName, browserFilename(partialName, 2), downloads,
      expectedStoredZipBytes(includedEntries));
    const partialZip = verifyStoredZip(partial.bytes, includedEntries);
    result.downloads.push({ kind: 'partial-zip', ...partial, bytes: partial.bytes.length,
      entryOrder: partialZip.entryOrder, included: partialZip.entries.length,
      omitted: expectedEntries.length - partialZip.entries.length,
      countSource: 'verified-zip-inventory-vs-expected-fixture' });
    const partialFailedTransport = await waitFor(() =>
      loopback.findSince(partialTransportStart, 'partial', 1, 'http-503'),
    'post-click partial ZIP HTTPS loopback failure');
    for (const index of [0, 2]) {
      const transport = await waitFor(() =>
        loopback.findSince(partialTransportStart, 'partial', index, 'served'),
      `partial ZIP media ${index} HTTPS loopback response`);
      assert.equal(transport.sha256, sha256(images[index]));
    }
    result.transportReceipts.partialZip = { ...partialFailedTransport };
    result.cases.partialZip = 'passed';
    await waitFor(async () => await all.isEnabled() ? true : undefined, 'partial ZIP control ready');

    const heldTrigger = await showPhase('held');
    loopback.armHeld();
    const heldSince = observer.snapshot();
    const heldBefore = new Set(await readdir(downloads));
    const heldTransportStart = loopback.mark();
    await all.click();
    await waitFor(() => loopback.findSince(heldTransportStart, 'held', 0, 'started'),
      'held HTTPS loopback request');
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const heldTerminal = await waitFor(() =>
      loopback.findSince(heldTransportStart, 'held', 0, 'aborted'),
    'held HTTPS loopback response closure');
    assert.equal(loopback.activeCount(), 0, 'Held response remains active after cancellation');
    // cleanupGallery() resets the busy signal synchronously. A detached gallery
    // and enabled toolbar cannot prove that an old manager callback has settled.
    // Keep this document alive after the exact held request reaches a terminal
    // state and inspect browser events and owned files during the bounded interval.
    await heldTrigger.click();
    await gallery.waitFor({ state: 'visible' });
    await waitFor(async () => await all.isEnabled() ? true : undefined,
      'same-document toolbar ready after cancellation');
    result.cases.lateAbsence = await observeNoNativeDownload(observer, heldSince,
      heldBefore, downloads, 'Pre-dispatch cancellation', 2_000);
    result.cases.preDispatchCancellation = 'passed';
    result.cases.delayedSettlement = { status: 'bounded-no-native-save',
      transport: { ...heldTerminal } };

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
    const recoveryHistoryBefore = await captureManagerDownloadHistory(context, managerId,
      downloads, recoveryName, images[0].length);
    assert.equal(recoveryHistoryBefore.status, 'observed',
      'Recovery native download baseline is unavailable');
    const recoveryTransportStart = loopback.mark();
    await current.click();
    const recovered = await waitForManagerDownload(context, managerId, observer, recoverySince,
      recoveryBefore, recoveryHistoryBefore, filename(0), recoveryName, downloads, images[0].length);
    assert(recovered.bytes.equals(images[0]), 'Reload recovery saved bytes differ');
    const recoveredTransport = await waitFor(() =>
      loopback.findSince(recoveryTransportStart, 'normal', 0, 'served'),
    'reload recovery HTTPS loopback response');
    assert.equal(recoveredTransport.sha256, sha256(images[0]));
    result.downloads.push({ kind: 'single-after-reload', ...recovered, bytes: recovered.bytes.length });
    result.cases.reloadRecovery = 'passed';
    await observer.flush();
    assert.equal(result.routeFailures.length + result.routeFailureOverflow, 0,
      'Fixture route failed');
    assert.equal(observer.snapshot(), result.downloads.filter((download) => download.guid).length,
      'Unexpected CDP download count');
    const loopbackResult = loopback.snapshot();
    assert.equal(loopbackResult.unexpectedCount, 0, 'Unexpected loopback request');
    assert.equal(loopbackResult.overflow, false, 'Loopback fixture exceeded bounds');
    assert.equal(loopbackResult.serverError, false, 'Loopback server reported an error');
    assert.equal(loopbackResult.activeCount, 0, 'Loopback response remains active');
    assert(loopbackResult.events.every((event) => event.result !== 'started'),
      'Loopback transport lacks a terminal result');
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
      } catch { result.cleanup.managerConsoleListenersRemoved = false; }
    }
    await page.close().catch((error) => { result.cleanup.pageError = String(error); });
    mediaNetwork.dispose();
    await context.unroute('**/*', handler).then(() => { result.cleanup.routeRemoved = true; },
      (error) => { result.cleanup.routeError = String(error); });
    result.browserDownloadEvents = observer.events();
    result.fixtureMediaNetwork = { events: mediaNetwork.events,
      overflow: mediaNetwork.overflow() };
    result.loopbackTransport = loopback.snapshot();
    await writeFile(join(output, 'userscript-fixture-result.json'), JSON.stringify(result, null, 2));
    assert.deepEqual(result.cleanup, managerConsole
      ? { managerConsoleListenersRemoved: true, routeRemoved: true }
      : { routeRemoved: true },
      'Fixture cleanup failed');
  }
}

export async function runUserscriptInstallation({ chromium, root, output, browserName, headless }) {
  assert.equal(browserName, 'chrome', 'HTTPS userscript fixture currently supports Chrome only');
  await mkdir(output, { recursive: true });
  const source = await readFile(join(root, 'dist/xcom-enhanced-gallery.user.js'));
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  assertOwned(root, profile);
  const downloads = join(profile, 'downloads');
  await mkdir(downloads);
  await mkdir(join(profile, 'Default'));
  await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({
    download: { default_directory: downloads, prompt_for_download: false, directory_upgrade: true },
  }));
  const result = { status: 'failed', browserName, installation: 'userscript',
    installationMethod: 'real-manager-ui-import', sourceSha256: sha256(source),
    profileId: 'xeg-gallery', profilePrefix: PROFILE_PREFIX,
    scope: 'small HTTPS loopback fixture; singles require native downloads.search completion and owned saved bytes; ZIPs require CDP completion and owned saved bytes; no heap/RSS or native Save As claim',
    cleanup: {} };
  let context;
  let cdp;
  let managerId;
  let observer;
  let loopback;
  let primaryError;
  try {
    loopback = await startUserscriptFixtureLoopback(
      join(root, 'validation/windows/userscript-fixture-certificate.ps1'),
      MEDIA_COHORTS, PUBLIC_AVATAR_PATH);
    result.fixtureTransport = { kind: 'task-owned-https-loopback',
      bind: '127.0.0.1', port: loopback.port, host: 'pbs.twimg.com',
      certificateScope: 'one-run-spki' };
    context = await chromium.launchPersistentContext(profile, {
      channel: browserName, headless, acceptDownloads: true, downloadsPath: downloads,
      locale: 'en-US', viewport: { width: 1280, height: 800 },
      ignoreDefaultArgs: ['--disable-extensions'], args: [
        '--enable-unsafe-extension-debugging',
        `--host-resolver-rules=MAP pbs.twimg.com:443 127.0.0.1:${loopback.port}`,
        `--ignore-certificate-errors-spki-list=${loopback.spkiSha256}`,
      ],
    });
    result.browserVersion = context.browser().version();
    await enableDeveloperMode(context, browserName);
    await verifyDownloadDirectory(context, downloads);
    result.downloadDirectoryVerified = true;
    cdp = await context.browser().newBrowserCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'default', eventsEnabled: true });
    ({ id: managerId } = await cdp.send('Extensions.loadUnpacked', {
      path: join(root, 'test-tools/userscript-manager'),
    }));
    assert.equal(typeof managerId, 'string');
    result.manager = await installUserscript(context, managerId, root, output, browserName,
      result.sourceSha256, profile,
      (ask, id, context) => inspectAndAllowNativeManagerPermission(cdp,
        root, output, profile, browserName, ask, id, context));
    const images = await createImageFixtures(context);
    loopback.setImages(images);
    result.fixtureLimits = { imageBytes: images.map((image) => image.length),
      imageSha256: images.map(sha256),
      maxDownloads: MAX_DOWNLOADS, maxRoutedImageRequests: 64,
      maxLoopbackRequests: 64, maxLoopbackImageBytes: 64 * 1024,
      maxLoopbackServedBytes: 2 * 1024 * 1024,
      productionBudget: 'unchanged' };
    observer = createBrowserDownloadObserver(cdp);
    result.fixture = await runFixture(context, observer, root, output, downloads, images, loopback,
      managerId,
      result.manager.managerVersion, profile, result.sourceSha256);
    result.status = 'passed';
  } catch (error) {
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
        () => { result.cleanup.managerUninstalled = true; }, (error) => errors.push(error));
    }
    if (context) {
      await context.close().then(() => { result.cleanup.browserClosed = true; },
        (error) => errors.push(error));
    }
    if (loopback) {
      await loopback.close().then(() => { result.cleanup.loopbackClosed = true; },
        () => errors.push(new Error('fixture-loopback-cleanup-failed')));
    }
    if (result.cleanup.browserClosed || !context) {
      try {
        assertOwned(root, profile);
        await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        assert.equal(await stat(profile).then(() => true, () => false), false,
          'Owned profile remains after cleanup');
        result.cleanup.profileRemoved = true;
      } catch (error) { errors.push(error); }
    } else result.cleanup.profilePreserved = true;
    result.cleanup.errorCount = errors.length;
    if (errors.length) {
      result.status = 'failed';
      result.cleanup.errors = errors.map(String);
    }
    await writeFile(join(output, 'installation-result.json'), JSON.stringify(result, null, 2));
    if (primaryError && errors.length) throw new AggregateError([primaryError, ...errors],
      'Userscript installation and cleanup failed');
    if (errors.length) throw new AggregateError(errors, 'Userscript installation cleanup failed');
  }
  if (primaryError) throw primaryError;
  return result;
}
