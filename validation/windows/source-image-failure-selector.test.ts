// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, test, vi } from 'vite-plus/test';
import { validateFirefoxSelectors } from './firefox-install.ts';
import { run } from './install-profile.ts';
import { observedSelectedAlignment } from './source-image-trace.ts';

const mocks = vi.hoisted(() => ({
  startLoopback: vi.fn(),
  createImages: vi.fn(),
  installRoutes: vi.fn(),
  enableDeveloperMode: vi.fn(),
  verifyDownloadDirectory: vi.fn(),
  readUpgradeInput: vi.fn(),
  readSameVersionInput: vi.fn(),
}));

vi.mock('./extension-native-loopback.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./extension-native-loopback.ts')>()),
  startExtensionNativeFixtureLoopback: mocks.startLoopback,
}));
vi.mock('./install-preparation.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./install-preparation.ts')>()),
  createImageFixtures: mocks.createImages,
  installFixtureRoutes: mocks.installRoutes,
  enableDeveloperMode: mocks.enableDeveloperMode,
  verifyDownloadDirectory: mocks.verifyDownloadDirectory,
}));
vi.mock('./release-upgrade/source.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./release-upgrade/source.ts')>()),
  readUpgradeInput: mocks.readUpgradeInput,
  readSameVersionInput: mocks.readSameVersionInput,
}));

let root: string;
let output: string;
let selector: string;

beforeEach(async () => {
  vi.clearAllMocks();
  root = await mkdtemp(join(tmpdir(), 'xeg-source-image-selector-'));
  output = join(root, 'output');
  const inputs = join(root, 'validation/windows/inputs');
  await mkdir(inputs, { recursive: true });
  selector = join(inputs, 'source-image-failures.json');
  await writeFile(selector, '{"scenario":"source-image-failures","trace":true}\n');
  mocks.createImages.mockResolvedValue([Buffer.from('first'), Buffer.from('second')]);
  mocks.installRoutes.mockResolvedValue({
    videoPayloads: {},
    qualityApiResponses: [],
    qualityRequests: [],
    unhandledRequests: [],
    remove: vi.fn(async () => {}),
  });
  mocks.startLoopback.mockResolvedValue({
    port: 44444,
    spkiSha256: 'fixture-spki',
    setPayloads: vi.fn(),
    snapshot: () => ({ unexpectedCount: 0, overflow: false, serverError: false, activeCount: 0 }),
    close: vi.fn(async () => {}),
  });
  mocks.readUpgradeInput.mockResolvedValue(null);
  mocks.readSameVersionInput.mockResolvedValue(null);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function installedBrowser() {
  const page = { goto: vi.fn(async () => {}), close: vi.fn(async () => {}) };
  const cdp = {
    send: vi.fn(async (method: string) =>
      method === 'Extensions.loadUnpacked' ? { id: 'owned-extension' } : {}
    ),
  };
  const browser = { version: () => 'fixture-browser', newBrowserCDPSession: async () => cdp };
  const context = {
    browser: () => browser,
    newPage: vi.fn().mockResolvedValueOnce(page).mockRejectedValue(new Error('case page denied')),
    close: vi.fn(async () => {}),
  };
  const chromium = { launchPersistentContext: vi.fn(async () => context) };
  return { page, context, chromium };
}

function options(
  chromium: ReturnType<typeof installedBrowser>['chromium'],
  changes: Partial<Parameters<typeof run>[0]> = {}
): Parameters<typeof run>[0] {
  return {
    chromium: chromium as unknown as Parameters<typeof run>[0]['chromium'],
    root,
    output,
    browserName: 'msedge',
    headless: true,
    installation: 'extension',
    liveUrls: [],
    ...changes,
  };
}

test('focused selector reaches the existing three-fault helper and retains failed cleanup evidence', async () => {
  const { page, context, chromium } = installedBrowser();
  await assert.rejects(run(options(chromium)), /Selected image failure validation/u);
  assert.equal(mocks.installRoutes.mock.calls.length, 1);
  assert.equal(context.newPage.mock.calls.length, 4);
  assert.equal(page.close.mock.calls.length, 1);
  const routes = await mocks.installRoutes.mock.results[0]?.value;
  assert(routes);
  assert.equal(routes.remove.mock.calls.length, 1);
  assert.equal(context.close.mock.calls.length, 1);
  const evidence = JSON.parse(
    await readFile(join(output, 'focused-source-image-failures.json'), 'utf8')
  );
  assert.equal(evidence.status, 'failed');
  assert.deepEqual(
    evidence.cases.map((item: { kind: string }) => item.kind),
    ['404', 'empty', 'corrupt']
  );
  assert(
    evidence.cases.every((item: { error: string }) => item.error.includes('case page denied'))
  );
  assert.deepEqual(evidence.cleanupErrors, []);
  const result = JSON.parse(await readFile(join(output, 'installation-result.json'), 'utf8'));
  assert.equal(result.status, 'failed');
  assert.equal(result.cleanup.profileRemoved, true);
});

test('selector rejects extra fields, other selectors, other modes and upgrade inputs before launch', async () => {
  const { chromium } = installedBrowser();
  await writeFile(selector, '{"scenario":"source-image-failures","faultRelease":"unknown"}\n');
  await assert.rejects(run(options(chromium)), /fault release selector is unsupported/u);
  await writeFile(
    selector,
    '{"scenario":"source-image-failures","faultRelease":"after-initial-alignment"}\n'
  );
  await assert.rejects(run(options(chromium)), /requires the bounded source image trace/u);
  await writeFile(selector, '{"scenario":"source-image-failures","skip404":true}\n');
  await assert.rejects(run(options(chromium)));
  await writeFile(selector, '{"scenario":"source-image-failures","trace":true}\n');
  await writeFile(join(root, 'validation/windows/inputs/gallery-experience.json'), '{}\n');
  await assert.rejects(run(options(chromium)), /exclusive focused selector/u);
  await rm(join(root, 'validation/windows/inputs/gallery-experience.json'));
  await assert.rejects(run(options(chromium, { browserName: 'chrome' })), /installed Edge/u);
  await assert.rejects(
    run(options(chromium, { installation: 'userscript' })),
    /installed extension/u
  );
  await assert.rejects(
    run(options(chromium, { liveUrls: ['https://x.com/public/status/1'] })),
    /owned fixture URLs/u
  );
  mocks.readUpgradeInput.mockResolvedValueOnce({ previousExtensionPath: 'unsupported' });
  await assert.rejects(run(options(chromium)), /cannot run during upgrade checks/u);
  mocks.readSameVersionInput.mockResolvedValueOnce({ extensionPath: 'unsupported' });
  await assert.rejects(run(options(chromium)), /cannot run during upgrade checks/u);
  await assert.rejects(validateFirefoxSelectors(root), /does not implement this selector/u);
  assert.equal(chromium.launchPersistentContext.mock.calls.length, 0);
  assert.equal(mocks.startLoopback.mock.calls.length, 0);
});

test('diagnostic selector admits the bounded alignment gate without weakening the three cases', async () => {
  const { chromium } = installedBrowser();
  await writeFile(
    selector,
    '{"scenario":"source-image-failures","trace":true,"faultRelease":"after-initial-alignment"}\n'
  );
  await assert.rejects(run(options(chromium)), /Selected image failure validation/u);
  const evidence = JSON.parse(
    await readFile(join(output, 'focused-source-image-failures.json'), 'utf8')
  );
  assert.deepEqual(
    evidence.cases.map((item: { kind: string }) => item.kind),
    ['404', 'empty', 'corrupt']
  );
});

test('alignment gate needs second accepted viewport guard and two settled selected frames', () => {
  const originalUrl = 'https://pbs.twimg.com/media/selected?format=jpg&name=orig';
  const guard = (at: number) => ({
    event: 'viewport-realign-guard',
    at,
    visible: true,
    currentIndex: 1,
    focusedIndex: 1,
    userAt: 0,
    programmaticAt: at - 1,
  });
  const aligned = { event: 'align-done', at: 120, index: 1 };
  const frame = (atMs: number, top = 128, scrollTop = 354) => ({
    atMs,
    selectedIndex: '1',
    currentIndex: '1',
    focusedIndex: '1',
    imageSrc: originalUrl,
    itemTop: top,
    portTop: 0,
    portBottom: 800,
    scrollTop,
    clearance: 128,
  });
  const events = [guard(100), guard(110), aligned];
  const frames = [frame(130), frame(146)];
  assert.deepEqual(observedSelectedAlignment(events, frames, originalUrl), {
    secondGuardAtMs: 110,
    alignDoneAtMs: 120,
    frames,
  });
  assert.equal(observedSelectedAlignment([guard(100), aligned], frames, originalUrl), null);
  assert.equal(observedSelectedAlignment(events, [frame(119), frame(146)], originalUrl), null);
  assert.equal(
    observedSelectedAlignment(events, [frame(130), frame(146, -400)], originalUrl),
    null
  );
  assert.equal(
    observedSelectedAlignment(events, [frame(130), frame(146, 128, 355)], originalUrl),
    null
  );
  assert.equal(
    observedSelectedAlignment(
      events,
      [{ ...frame(130), imageSrc: 'wrong' }, frame(146)],
      originalUrl
    ),
    null
  );
});

test('Windows source bundle includes the trace helper and quality fixture', async () => {
  const manifest = JSON.parse(
    await readFile(join(process.cwd(), 'validation/windows/profile.json'), 'utf8')
  );
  assert(manifest.installation.assets.includes('validation/windows/source-image-trace.ts'));
  assert(manifest.installation.assets.includes('test/e2e/fixtures/installed-gallery-page.html'));
  assert(manifest.assets.includes('validation/windows/inputs'));
});
