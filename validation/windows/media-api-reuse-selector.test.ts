// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, test, vi } from 'vite-plus/test';
import { validateFirefoxSelectors } from './firefox-install.ts';
import {
  QUALITY_FIXTURE_URL,
  QUALITY_IMAGE_PATHS,
  QUALITY_TWEET_ID,
} from './install-preparation.ts';
import { run } from './install-profile.ts';

const mocks = vi.hoisted(() => ({
  startLoopback: vi.fn(),
  createImages: vi.fn(),
  installRoutes: vi.fn(),
  enableDeveloperMode: vi.fn(),
  verifyDownloadDirectory: vi.fn(),
  runApiReuse: vi.fn(),
  readUpgradeInput: vi.fn(),
  readSameVersionInput: vi.fn(),
}));
const routeOverflowAssertion = vi.fn();

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
vi.mock('./media-api-reuse-profile.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./media-api-reuse-profile.ts')>()),
  runInstalledMediaApiReuseProfile: mocks.runApiReuse,
}));
vi.mock('./release-upgrade/source.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./release-upgrade/source.ts')>()),
  readUpgradeInput: mocks.readUpgradeInput,
  readSameVersionInput: mocks.readSameVersionInput,
}));

let root: string;
let output: string;
let inputs: string;
const qualityImages = [Buffer.from('first'), Buffer.from('second'), Buffer.from('third')];

beforeEach(async () => {
  vi.clearAllMocks();
  routeOverflowAssertion.mockReset();
  root = await mkdtemp(join(tmpdir(), 'xeg-api-selector-'));
  output = join(root, 'output');
  inputs = join(root, 'validation/windows/inputs');
  await mkdir(inputs, { recursive: true });
  await writeFile(join(inputs, 'media-api-reuse.json'), '{"scenario":"media-api-reuse"}\n');
  mocks.createImages.mockResolvedValue(qualityImages);
  mocks.installRoutes.mockResolvedValue({
    videoPayloads: { fixture: Buffer.from('video') },
    unhandledRequests: [],
    assertNoQualityRequestOverflow: routeOverflowAssertion,
    remove: vi.fn(async () => {}),
  });
  mocks.startLoopback.mockResolvedValue({
    port: 44444,
    spkiSha256: 'fixture-spki',
    setPayloads: vi.fn(),
    snapshot: () => ({ unexpectedCount: 0, overflow: false, serverError: false, activeCount: 0 }),
    close: vi.fn(async () => {}),
  });
  mocks.runApiReuse.mockResolvedValue({ status: 'passed', cases: [{ case: 'owned quality' }] });
  mocks.readUpgradeInput.mockResolvedValue(null);
  mocks.readSameVersionInput.mockResolvedValue(null);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function installedBrowser() {
  const page = { goto: vi.fn(async (_url: string) => {}), close: vi.fn(async () => {}) };
  const cdp = {
    send: vi.fn(async (method: string) =>
      method === 'Extensions.loadUnpacked' ? { id: 'owned-extension' } : {}
    ),
  };
  const browser = { version: () => 'fixture-browser', newBrowserCDPSession: async () => cdp };
  const context = {
    browser: () => browser,
    newPage: vi.fn(async () => page),
    unrouteAll: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  };
  const chromium = { launchPersistentContext: vi.fn(async () => context) };
  return { page, cdp, context, chromium };
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

test('exclusive selector reaches the unchanged API helper with shared quality routes and cleanup', async () => {
  const { page, context, chromium } = installedBrowser();
  const result = await run(options(chromium));
  assert('mediaApiReuse' in result && typeof result.scope === 'string');
  assert.equal(result.status, 'passed');
  assert.match(result.scope, /no full fixture or live X observation/u);
  assert.deepEqual(result.mediaApiReuse, { status: 'passed', cases: [{ case: 'owned quality' }] });
  assert.equal(mocks.installRoutes.mock.calls.length, 1);
  assert.deepEqual(mocks.installRoutes.mock.calls[0]?.slice(1), [
    root,
    qualityImages,
    qualityImages,
  ]);
  assert.deepEqual(mocks.runApiReuse.mock.calls[0]?.[0], {
    context,
    page,
    qualityFixtureUrl: QUALITY_FIXTURE_URL,
    qualityTweetId: QUALITY_TWEET_ID,
    qualityImagePaths: QUALITY_IMAGE_PATHS,
    output,
    videoPayloads: { fixture: Buffer.from('video') },
  });
  assert.equal(page.goto.mock.calls[0]?.[0], 'chrome-extension://owned-extension/manifest.json');
  assert.equal(page.close.mock.calls.length, 1);
  const routes = await mocks.installRoutes.mock.results[0]?.value;
  assert(routes);
  assert.equal(routes.assertNoQualityRequestOverflow.mock.calls.length, 1);
  assert.equal(routes.remove.mock.calls.length, 1);
  assert.equal(context.close.mock.calls.length, 1);
  const receipt = JSON.parse(await readFile(join(output, 'installation-result.json'), 'utf8'));
  assert.equal(receipt.status, 'passed');
  assert.equal(receipt.evidenceStatus, 'media-api-reuse-fixture-observed');
  assert.equal(receipt.cleanup.profileRemoved, true);
  assert.equal(receipt.fixture, undefined);
});

test('helper failure retains a failed installation result and still closes owned resources', async () => {
  const { page, context, chromium } = installedBrowser();
  mocks.runApiReuse.mockRejectedValueOnce(new Error('API helper failed'));
  await assert.rejects(run(options(chromium)), /API helper failed/u);
  const receipt = JSON.parse(await readFile(join(output, 'installation-result.json'), 'utf8'));
  assert.equal(receipt.status, 'failed');
  assert.equal(receipt.mediaApiReuse, undefined);
  assert.equal(receipt.cleanup.profileRemoved, true);
  assert.equal(page.close.mock.calls.length, 1);
  assert.equal(context.close.mock.calls.length, 1);
  const routes = await mocks.installRoutes.mock.results[0]?.value;
  assert(routes);
  assert.equal(routes.remove.mock.calls.length, 1);
});

test('quality observation overflow fails the focused owner and still closes owned resources', async () => {
  const { page, context, chromium } = installedBrowser();
  routeOverflowAssertion.mockImplementationOnce(() => {
    throw new Error('Source-quality request observation overflow: controlled route boundary');
  });
  await assert.rejects(run(options(chromium)), /Source-quality request observation overflow/u);
  assert.equal(mocks.runApiReuse.mock.calls.length, 1);
  assert.equal(routeOverflowAssertion.mock.calls.length, 1);
  const routes = await mocks.installRoutes.mock.results[0]?.value;
  assert(routes);
  assert.equal(routes.remove.mock.calls.length, 1);
  assert.equal(page.close.mock.calls.length, 1);
  assert.equal(context.close.mock.calls.length, 1);
  const loopback = await mocks.startLoopback.mock.results[0]?.value;
  assert(loopback);
  assert.equal(loopback.close.mock.calls.length, 1);
  const receipt = JSON.parse(await readFile(join(output, 'installation-result.json'), 'utf8'));
  assert.equal(receipt.status, 'failed');
  assert.match(receipt.error, /Source-quality request observation overflow/u);
  assert.equal(receipt.cleanup.browserClosed, true);
  assert.equal(receipt.cleanup.fixtureLoopbackClosed, true);
  assert.equal(receipt.cleanup.profileRemoved, true);
});

test('selector rejects extra fields, other selectors, userscript, and public URLs before browser launch', async () => {
  const { chromium } = installedBrowser();
  const selector = join(inputs, 'media-api-reuse.json');
  await writeFile(selector, '{"scenario":"media-api-reuse","skip404":true}\n');
  await assert.rejects(run(options(chromium)));
  await writeFile(selector, '{"scenario":"media-api-reuse"}\n');
  await writeFile(join(inputs, 'gallery-experience.json'), '{"scenario":"gallery-experience"}\n');
  await assert.rejects(run(options(chromium)), /exclusive focused selector/u);
  await rm(join(inputs, 'gallery-experience.json'));
  await assert.rejects(
    run(options(chromium, { installation: 'userscript' })),
    /requires the installed extension/u
  );
  await assert.rejects(
    run(options(chromium, { liveUrls: ['https://x.com/public/status/1'] })),
    /only owned fixture URLs/u
  );
  mocks.readUpgradeInput.mockResolvedValueOnce({ previousExtensionPath: 'unsupported' });
  await assert.rejects(run(options(chromium)), /cannot run during upgrade checks/u);
  mocks.readSameVersionInput.mockResolvedValueOnce({ extensionPath: 'unsupported' });
  await assert.rejects(run(options(chromium)), /cannot run during upgrade checks/u);
  await assert.rejects(validateFirefoxSelectors(root), /does not implement this selector/u);
  assert.equal(chromium.launchPersistentContext.mock.calls.length, 0);
  assert.equal(mocks.startLoopback.mock.calls.length, 0);
});

test('source bundle carries the selector directory, quality fixture, and API helper', async () => {
  const manifest = JSON.parse(
    await readFile(join(process.cwd(), 'validation/windows/profile.json'), 'utf8')
  );
  const ignore = await readFile(join(process.cwd(), '.gitignore'), 'utf8');
  assert(ignore.split(/\r?\n/u).includes('/validation/windows/inputs/media-api-reuse.json'));
  assert(manifest.assets.includes('validation/windows/inputs'));
  assert(manifest.installation.assets.includes('test/e2e/fixtures/installed-gallery-page.html'));
  assert(manifest.installation.assets.includes('validation/windows/media-api-reuse-profile.ts'));
});
