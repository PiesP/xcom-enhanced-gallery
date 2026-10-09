// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

type LivePageModule = {
  inspectLiveTargetDocument(identity: {
    handle: string;
    statusId: string;
  }): false | { state: string; reason?: string; target?: {
    kind: string;
    imageSource?: { path: string };
    quoteBoundary?: string;
    quoteStatusIds?: string[];
    ownershipPath?: unknown[];
  } };
  inspectLiveCandidateDocument(identity: { handle: string; statusId: string }): {
    exactArticleFound: boolean;
    statusIds?: string[];
    outerArticleOwnStatusAnchors?: Array<{ path: string; containsTime: boolean;
      nearestArticleIndex: number; structure: unknown[] }>;
    quoteCardCount?: number;
    videoPlayerCount?: number;
    previewInterstitialCount?: number;
    playButtonCount?: number;
  };
  inspectSelectedGalleryVideoDocument(): false | {
    index: number;
    source: { host: string; path: string } | null;
    readyState: number;
    width: number;
    height: number;
    mediaErrorCode: number | null;
  };
  inspectHitTestedVideoActionDocument(element: HTMLElement, expected: {
    posterPath: string | null;
  }): null | {
    inQuote: boolean;
    x: number | null;
    y: number | null;
    rejectedControls: number;
    mediaScopeDepth: number | null;
    nativePlay?: { x: number; y: number; mediaScopeDepth: number;
      scopeCounts?: { scopeDepth: number; videoCount: number; totalImageCount: number;
        trustedVideoThumbnailCount: number; ordinaryImageCount: number } | null } | null;
  };
  findHitTestedVideoControlDocument(element: HTMLElement, expected: {
    x: number;
    y: number;
    posterPath: string;
  }): HTMLElement | null;
  quotedVideoHitTestPassed(evidence: {
    controlledVideoClickMode: string | null;
    galleryActionKind: string;
    initialHit: ReturnType<LivePageModule['inspectHitTestedVideoActionDocument']>;
    finalHit: ReturnType<LivePageModule['inspectHitTestedVideoActionDocument']>;
    identityBeforeClick: boolean;
    focusPrepared: boolean;
    meaningfulFocusTarget: boolean;
    focusedControlStillOwnsClick: boolean | undefined;
  }): boolean;
  inspectHostVideoDocument(video: HTMLVideoElement, expected: {
    posterPath: string;
  }): null | {
    sourceKind: string;
    poster: { host: string; path: string } | null;
    posterEvidence: string;
    matchingSiblingCount: number;
    currentTime: number;
  };
  summarizeTweetResultResponse(url: string, status: number, body: unknown): unknown;
  summarizeQuoteProviderRejection(api: unknown): null | {
    operation: string;
    kind: string;
    httpStatus: number | null;
    requestedTweetId: string | null;
  };
  classifyLiveFailure(classification: string | undefined, galleryStatus: string,
    providerRejection: unknown): string;
  classifyLiveHostDiagnostics(observation: unknown): {
    expectedLifecycleCancellationCount: number;
    evidenceStatus: string;
  };
  refreshQuotedVideoErrorAssertions(observation: {
    requiredAssertions: Record<string, boolean>;
    missingAssertions: string[];
    productErrors: unknown[];
    productErrorOverflow: number;
    pageErrors: unknown[];
    pageErrorOverflow: number;
  }): string[];
  captureActivationFocusDocument(surface: HTMLElement, expected: {
    articleIndex: number;
    point: { x: number; y: number };
  }): { readonly focus: HTMLElement | null; readonly captured: boolean; dispose(): void };
  findActivationHitDocument(surface: HTMLElement, expected: {
    articleIndex: number;
    point: { x: number; y: number };
  }): Element | null;
  createControlledVideoSettings(prior: unknown, timestamp: number): {
    gallery: { videoClickMode: string; [key: string]: unknown };
    __schemaHash: string;
    [key: string]: unknown;
  };
  inspectSelectedGalleryDocument(expected: {
    expectedIndex: number;
    expectedPath: string;
  }): false | {
    imageSource: { host: string; path: string };
    itemIndex: number;
    itemVisible: boolean;
    positionValue: number;
  };
  observeLiveUrls(options: {
    context: unknown;
    extensionId: string;
    liveUrls: unknown;
    output: string;
  }): Promise<unknown>;
  validateLiveObservation(value: unknown): void;
  validateLiveUrls(values: unknown): string[];
};

type InstallProfileModule = {
  assertDownloadIncomplete(download: unknown, stage: string): void;
  enableDeveloperMode(context: unknown, browserName: string): Promise<void>;
  run(options: {
    browserName: string;
    chromium: { launchPersistentContext(): Promise<never> };
    headless: boolean;
    installation: string;
    liveUrls: string[];
    output: string;
    root: string;
  }): Promise<unknown>;
};

const livePage = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/live-page.mjs')).href
)) as LivePageModule;
const installProfile = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/install-profile.mjs')).href
)) as InstallProfileModule;
const userscriptInstall = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/userscript-install.mjs')).href
)) as { MEDIA_COHORTS: Record<'normal' | 'failure' | 'partial' | 'held', string[]>;
  PUBLIC_AVATAR_PATH: string;
  isPublicAvatarFixtureUrl(value: string): boolean;
  FIXTURE_ZIP_NAME: string;
  fixtureZipEntries(images: Uint8Array[]): Array<{ filename: string; bytes: Uint8Array }>;
  managerDetailsUrl(browserName: string, id: string): string;
  probeManagerUserScripts(page: { evaluate(callback: () => Promise<unknown>): Promise<unknown> }):
    Promise<{ available: boolean; registeredScriptCount?: number; errorType?: string }>;
  hasKnownChromeUserScriptsLabel(text: string): boolean;
  summarizeManagerFrameUrl(value: string, managerId: string): string | null;
  isOwnedManagerDetailsUrl(value: string, detailsUrl: string): boolean;
  isOwnedManagerInspectionUrl(value: string, detailsUrl: string, managerId: string): boolean;
  isOwnedManagerOptionsUrl(value: string, managerId: string): boolean;
  isOwnedManagerPermissionAskUrl(value: string, managerId: string): boolean;
  requireManagerDownloadsHeading(actual: string, localizedDownloads: string): void;
  requireManagerUiLabels(labels: Record<string, unknown>): Record<string, string>;
  readManagerUiLabels(page: { url(): string;
    evaluate(callback: (id: string) => unknown, id: string): Promise<unknown> },
  managerId: string): Promise<Record<string, string>>;
  probeManagerDownloadsPermission(page: { url(): string;
    evaluate(callback: (id: string) => Promise<boolean>, id: string): Promise<boolean> },
  managerId: string): Promise<boolean>;
  inspectFirstCurrentDownload(page: { url(): string;
    evaluate(callback: (url: string) => unknown, url: string): Promise<unknown> }): Promise<unknown>;
  findEdgeUserScriptsControl(page: unknown, managerId: string): Promise<unknown>;
  watchFixtureMediaNetwork(context: EventEmitter): {
    events: Array<{ kind: string; cohort: string; index: number; method: string;
      resourceType: string; status: number | null }>;
    overflow(): number;
    dispose(): void;
  };
  createBrowserDownloadObserver(cdp: EventEmitter & { send(method: string): Promise<unknown> }): {
  snapshot(): number;
  waitForCompletion(since: number, name: string): Promise<{ guid: string; state: string }>;
  assertNoneSince(since: number, label: string): Promise<void>;
  events(): Array<{ guid: string; source: { scheme: string; origin: string } }>;
  dispose(): void;
};
  requirePageBlobZipSource(value: string): { scheme: string; origin: string };
  observeNoNativeDownload(observer: { assertNoneSince(since: number, label: string): Promise<void> },
    since: number, files: Set<string>, directory: string, label: string,
    durationMs: number): Promise<{ samples: number }>;
  watchExactRequestTerminal(context: EventEmitter): {
    bind(request: unknown): void;
    waitForTerminal(): Promise<{ kind: string; errorText?: string | null }>;
    terminal(): { kind: string; errorText?: string | null } | undefined;
    dispose(): void;
  };
  requireHeldRouteOutcome(route: { kind: string; error?: unknown },
    terminal?: { kind: string; errorText?: string | null }): unknown;
};

describe('Windows X live page validation', () => {
  it('checks the actual manager userScripts API and uses the browser-specific details URL', async () => {
    expect(userscriptInstall.managerDetailsUrl('msedge', 'manager-id'))
      .toBe('edge://extensions/?id=manager-id');
    expect(userscriptInstall.managerDetailsUrl('chrome', 'manager-id'))
      .toBe('chrome://extensions/?id=manager-id');
    const page = { evaluate: async (callback: () => Promise<unknown>) => callback() };
    try {
      vi.stubGlobal('chrome', { userScripts: { getScripts: async () => ['private-script'] } });
      expect(await userscriptInstall.probeManagerUserScripts(page)).toEqual({
        available: true, registeredScriptCount: 1,
      });
      vi.stubGlobal('chrome', { userScripts: { getScripts: async () => {
        throw new DOMException('denied', 'NotAllowedError');
      } } });
      expect(await userscriptInstall.probeManagerUserScripts(page)).toEqual({
        available: false, errorType: 'NotAllowedError',
      });
      vi.stubGlobal('chrome', {});
      expect(await userscriptInstall.probeManagerUserScripts(page)).toEqual({
        available: false, errorType: 'TypeError',
      });
      expect(await userscriptInstall.probeManagerUserScripts({
        evaluate: async () => { throw new Error('extension page unavailable'); },
      })).toEqual({ available: false, errorType: 'PageEvaluationError' });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('targets the observed Edge switch inside the exact owned labeled row', async () => {
    const id = 'a'.repeat(32);
    const control = { count: async () => 1, isVisible: async () => true,
      waitFor: vi.fn(async () => {}) };
    const row = { count: async () => 1,
      locator: vi.fn((selector: string) => {
        expect(selector).toBe('fluent-switch#checkbox-1');
        return control;
      }) };
    const section = { count: async () => 1, waitFor: vi.fn(async () => {}),
      evaluate: async (callback: (element: { id: string }, id: string) => boolean, id: string) =>
        callback({ id }, id),
      locator: vi.fn((selector: string) => {
        expect(selector).toBe('standard-row');
        return { filter: ({ has }: { has: unknown }) => {
          expect(has).toBe('known-label');
          return row;
        } };
      }) };
    const page = { url: () => userscriptInstall.managerDetailsUrl('msedge', id),
      locator: vi.fn((selector: string) => {
        expect(selector).toBe('access-section');
        return { filter: ({ has }: { has: unknown }) => {
          expect(has).toBe('known-label');
          return section;
        } };
      }),
      getByText: vi.fn((name: RegExp) => {
        expect(name.test('사용자 스크립트 허용')).toBe(true);
        expect(name.test('Allow user scripts')).toBe(true);
        expect(name.test('InPrivate에서 허용')).toBe(false);
        return 'known-label';
      }) };
    await expect(userscriptInstall.findEdgeUserScriptsControl(page, id)).resolves.toBe(control);
    expect(section.waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 10_000 });
    expect(control.waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 10_000 });
    expect(page.locator).toHaveBeenCalledTimes(1);
    await expect(userscriptInstall.findEdgeUserScriptsControl({ ...page,
      url: () => userscriptInstall.managerDetailsUrl('msedge', 'b'.repeat(32)),
    }, id)).rejects.toThrow('owned extension details');
    await expect(userscriptInstall.findEdgeUserScriptsControl({ ...page,
      locator: () => ({ filter: () => ({ ...section, count: async () => 2 }) }),
    }, id)).rejects.toThrow('one owned Edge access section');
    const missingRowSection = { ...section,
      locator: () => ({ filter: () => ({ ...row, count: async () => 0 }) }) };
    await expect(userscriptInstall.findEdgeUserScriptsControl({ ...page,
      locator: () => ({ filter: () => missingRowSection }),
    }, id)).rejects.toThrow('one labeled Edge user-scripts row');
  });

  it('accepts only the observed Chrome user-scripts label in English or Korean', () => {
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel(
      '사용자 스크립트 허용\n이 확장 프로그램은 검토되지 않은 코드를 실행할 수 있습니다.'
    )).toBe(true);
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel('Allow user scripts')).toBe(true);
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel('InPrivate에서 허용')).toBe(false);
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel('Not Allow user scripts')).toBe(false);
  });

  it('records only bounded fixture-media network metadata', () => {
    const context = new EventEmitter();
    const watcher = userscriptInstall.watchFixtureMediaNetwork(context);
    const request = (url: string) => ({ url: () => url,
      method: () => 'GET', resourceType: () => 'fetch' });
    const owned = request('https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?name=orig&private=secret');
    context.emit('request', request('https://pbs.twimg.com/profile_images/123456789/public-avatar.jpg'));
    context.emit('request', request('https://other.example/media/GkE1234ABCDEF.jpg'));
    context.emit('request', owned);
    context.emit('response', { request: () => owned, status: () => 200 });
    context.emit('requestfailed', owned);
    expect(watcher.events).toEqual([
      { kind: 'request', cohort: 'normal', index: 0, method: 'GET', resourceType: 'fetch', status: null },
      { kind: 'response', cohort: 'normal', index: 0, method: 'GET', resourceType: 'fetch', status: 200 },
      { kind: 'requestfailed', cohort: 'normal', index: 0, method: 'GET', resourceType: 'fetch', status: null },
    ]);
    expect(JSON.stringify(watcher.events)).not.toContain('secret');
    watcher.dispose();
    context.emit('request', owned);
    expect(watcher.events).toHaveLength(3);
  });

  it('keeps permission-diagnostic frame URLs on owned origins without query tokens', () => {
    expect(userscriptInstall.summarizeManagerFrameUrl(
      'edge://extensions/?id=owned&secret=ignored', 'owned'
    )).toBe('edge://extensions/');
    expect(userscriptInstall.summarizeManagerFrameUrl(
      'chrome-extension://owned/options.html?token=ignored#part', 'owned'
    )).toBe('chrome-extension://owned/options.html');
    expect(userscriptInstall.summarizeManagerFrameUrl(
      'chrome-extension://other/options.html?token=ignored', 'owned'
    )).toBeNull();
    expect(userscriptInstall.summarizeManagerFrameUrl(
      'https://private.example/path?token=ignored', 'owned'
    )).toBeNull();
    expect(userscriptInstall.summarizeManagerFrameUrl('about:blank', 'owned')).toBeNull();
  });

  it('admits diagnostic DOM reads only on the exact owned details route or manager origin', () => {
    const details = 'edge://extensions/?id=owned';
    expect(userscriptInstall.isOwnedManagerDetailsUrl(details, details)).toBe(true);
    expect(userscriptInstall.isOwnedManagerInspectionUrl(details, details, 'owned')).toBe(true);
    expect(userscriptInstall.isOwnedManagerInspectionUrl(
      'chrome-extension://owned/options.html', details, 'owned'
    )).toBe(true);
    expect(userscriptInstall.isOwnedManagerInspectionUrl(
      'chrome-extension://other/options.html', details, 'other'
    )).toBe(false);
    for (const value of [
      'edge://extensions/?id=other',
      'edge://extensions/?id=owned&token=secret',
      'edge://extensions/',
      'chrome://extensions/?id=owned',
      'chrome-extension://other/options.html',
      'chrome-extension://owned/options.html?token=secret',
      'about:blank',
      'https://private.example/path',
    ]) {
      expect(userscriptInstall.isOwnedManagerDetailsUrl(value, details)).toBe(false);
      expect(userscriptInstall.isOwnedManagerInspectionUrl(value, details, 'owned')).toBe(false);
    }
  });

  it('reads bounded bundled manager labels only from its own options page', async () => {
    const optionsUrl = 'chrome-extension://owned/options.html';
    expect(userscriptInstall.isOwnedManagerOptionsUrl(optionsUrl, 'owned')).toBe(true);
    for (const value of ['about:blank', 'https://x.com/',
      'chrome-extension://other/options.html', 'chrome-extension://owned/ask.html',
      'chrome-extension://owned/options.html?token=private']) {
      expect(userscriptInstall.isOwnedManagerOptionsUrl(value, 'owned')).toBe(false);
    }
    const messages: Record<string, string> = {
      Utilities: '도구', Install: '설치', Installed_userscripts: '설치된 유저 스크립트',
    };
    const page = { url: () => optionsUrl,
      evaluate: async (callback: (id: string) => unknown, id: string) => callback(id) };
    try {
      vi.stubGlobal('location', { href: optionsUrl });
      vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => messages[key] ?? '' } });
      expect(await userscriptInstall.readManagerUiLabels(page, 'owned')).toEqual({
        utilities: '도구', install: '설치', installedUserscripts: '설치된 유저 스크립트',
      });
      expect(userscriptInstall.requireManagerUiLabels({
        utilities: 'Utilities', install: 'Install', installedUserscripts: 'Installed Userscripts',
      })).toMatchObject({ utilities: 'Utilities' });
      expect(() => userscriptInstall.requireManagerUiLabels({
        utilities: 'x'.repeat(81), install: 'Install', installedUserscripts: 'Installed Userscripts',
      })).toThrow('invalid UI label');
      expect(() => userscriptInstall.requireManagerUiLabels({
        utilities: 'Utilities\nother', install: 'Install', installedUserscripts: 'Installed Userscripts',
      })).toThrow('invalid UI label');
      await expect(userscriptInstall.readManagerUiLabels({ ...page,
        url: () => 'chrome-extension://other/options.html',
      }, 'owned')).rejects.toThrow('owned options page');
      vi.stubGlobal('location', { href: 'https://private.example/' });
      await expect(userscriptInstall.readManagerUiLabels(page, 'owned'))
        .rejects.toThrow('navigated away');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('matches the bundled Downloads BETA heading in localized options markup', () => {
    document.body.innerHTML = '<div class="section type_downloads"><div class="section_head">다운로드 BETA</div>' +
      '<table class="section_content"><tr class="settingstr"><td>다운로드 모드</td>' +
      '<td><select><option value="chrome">브라우저 API</option></select></td></tr></table></div>';
    const heading = document.querySelector('.section.type_downloads .section_head');
    expect(heading).not.toBeNull();
    expect(() => userscriptInstall.requireManagerDownloadsHeading(
      heading?.textContent ?? '', '다운로드')).not.toThrow();
    expect(() => userscriptInstall.requireManagerDownloadsHeading('다운로드', '다운로드'))
      .toThrow('Manager Downloads section label differs');
  });

  it('accepts only an owned Tampermonkey permission ask page with its aid', () => {
    expect(userscriptInstall.isOwnedManagerPermissionAskUrl(
      'chrome-extension://owned/ask.html?aid=opaque', 'owned')).toBe(true);
    for (const url of ['chrome-extension://other/ask.html?aid=opaque',
      'chrome-extension://owned/ask.html', 'chrome-extension://owned/ask.html?aid=opaque&next=x',
      'chrome-extension://owned/options.html?aid=opaque',
      'chrome-extension://owned/ask.html?aid=opaque#fragment']) {
      expect(userscriptInstall.isOwnedManagerPermissionAskUrl(url, 'owned')).toBe(false);
    }
  });

  it('reads the optional manager downloads permission only on its owned options page', async () => {
    const optionsUrl = 'chrome-extension://owned/options.html';
    const page = { url: () => optionsUrl,
      evaluate: async (callback: (id: string) => Promise<boolean>, id: string) => callback(id) };
    try {
      vi.stubGlobal('location', { href: optionsUrl });
      const contains = vi.fn(async () => false);
      vi.stubGlobal('chrome', { permissions: { contains } });
      await expect(userscriptInstall.probeManagerDownloadsPermission(page, 'owned'))
        .resolves.toBe(false);
      expect(contains).toHaveBeenCalledWith({ permissions: ['downloads'] });
      await expect(userscriptInstall.probeManagerDownloadsPermission({ ...page,
        url: () => 'chrome-extension://other/options.html',
      }, 'owned')).rejects.toThrow('owned options page');
      vi.stubGlobal('location', { href: 'https://private.example/' });
      await expect(userscriptInstall.probeManagerDownloadsPermission(page, 'owned'))
        .rejects.toThrow('navigated away');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('bounds failed current-download diagnostics to the owned fixture and status attributes', async () => {
    const fixtureUrl = 'https://x.com/testuser/status/1234567890123456789';
    const page = { url: () => fixtureUrl,
      evaluate: async (callback: (url: string) => unknown, url: string) => callback(url) };
    document.body.innerHTML = `<div data-xeg-gallery-container>
      <div data-gallery-element="toolbar">
        <button aria-label="Download" aria-busy="false"></button>
        <span role="status" data-download-status="error">private failure text</span>
      </div>
      <li data-gallery-element="item" data-index="0">
        <img src="https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=large">
      </li>
    </div>`;
    try {
      vi.stubGlobal('location', { href: fixtureUrl });
      expect(await userscriptInstall.inspectFirstCurrentDownload(page)).toEqual({
        scope: 'owned-fixture', galleryPresent: true, currentControlPresent: true,
        currentControlDisabled: false, currentControlBusy: false,
        selectedFirstFixtureMedia: true, downloadStatus: 'error',
      });
      await expect(userscriptInstall.inspectFirstCurrentDownload({ ...page,
        url: () => 'https://private.example/',
      })).resolves.toEqual({ scope: 'unowned-page' });
      vi.stubGlobal('location', { href: 'https://private.example/' });
      await expect(userscriptInstall.inspectFirstCurrentDownload(page))
        .resolves.toEqual({ scope: 'navigated-away' });
    } finally {
      vi.unstubAllGlobals();
      document.body.innerHTML = '';
    }
  });

  it('keeps same-document userscript phases on distinct media cache keys with stable ZIP entries', () => {
    const html = readFileSync(resolve(import.meta.dirname,
      '../../e2e/fixtures/installed-gallery-page.html'), 'utf8');
    const allMarkers: string[] = [];
    for (const [phase, markers] of Object.entries(userscriptInstall.MEDIA_COHORTS)) {
      expect(html).toContain(`[data-fixture-phase="${phase}"] [data-phase]:not([data-phase="${phase}"])`);
      const article = html.match(new RegExp(`<article data-route="classic" data-phase="${phase}"[\\s\\S]*?</article>`, 'u'));
      expect(article, `Missing ${phase} article`).not.toBeNull();
      const phaseDocument = new DOMParser().parseFromString(article?.[0] ?? '', 'text/html');
      const actual = [...phaseDocument.querySelectorAll('img[src]')].map((image) => {
        const url = new URL(image.getAttribute('src') ?? '');
        expect(url.origin).toBe('https://pbs.twimg.com');
        const mediaPath = url.pathname.match(/^\/media\/([A-Za-z0-9]+)\.jpg$/u);
        expect(mediaPath).not.toBeNull();
        return mediaPath?.[1];
      });
      expect(actual).toEqual(markers);
      allMarkers.push(...markers);
    }
    expect(new Set(allMarkers).size).toBe(12);
    expect(html).toContain('<body data-fixture-route="classic">');
    expect(html).toContain('<main data-fixture-phase="normal">');
    expect(html.replace('<body data-fixture-route="classic">',
      '<body data-fixture-route="public">')).toContain('<body data-fixture-route="public">');
    const entries = userscriptInstall.fixtureZipEntries([
      Uint8Array.of(0), Uint8Array.of(1), Uint8Array.of(2),
    ]);
    expect(entries.map(({ filename }) => filename)).toEqual([
      'testuser_1234567890123456789_0.jpg',
      'testuser_1234567890123456789_1.jpg',
      'testuser_1234567890123456789_2.jpg',
    ]);
    expect(entries.map(({ bytes }) => bytes[0])).toEqual([0, 1, 2]);
    expect(userscriptInstall.FIXTURE_ZIP_NAME).toBe('testuser_1234567890123456789.zip');
  });

  it('serves only the public fixture avatar as an auxiliary pbs image', () => {
    const html = readFileSync(resolve(import.meta.dirname,
      '../../e2e/fixtures/installed-gallery-page.html'), 'utf8');
    const document = new DOMParser().parseFromString(html, 'text/html');
    const avatar = document.querySelector<HTMLImageElement>('article[data-route="public"] img.public-avatar');
    expect(avatar).not.toBeNull();
    const url = avatar?.src ?? '';
    expect(new URL(url).pathname).toBe(userscriptInstall.PUBLIC_AVATAR_PATH);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(url)).toBe(true);
    const mediaMarkers = Object.values(userscriptInstall.MEDIA_COHORTS).flat();
    const fixtureImages = [...document.querySelectorAll<HTMLImageElement>('img[src]')];
    expect(fixtureImages.filter((image) => userscriptInstall.isPublicAvatarFixtureUrl(image.src)))
      .toHaveLength(1);
    expect(fixtureImages.every((image) => userscriptInstall.isPublicAvatarFixtureUrl(image.src) ||
      mediaMarkers.some((marker) => new URL(image.src).pathname.includes(marker)))).toBe(true);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(`${url}?name=large`)).toBe(false);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(url.replace('pbs.twimg.com', 'other.example')))
      .toBe(false);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(url.replace('public-avatar', 'other-avatar')))
      .toBe(false);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(url.replace('https:', 'http:'))).toBe(false);
  });

  it('binds native completion to the browser download GUID without manager privileges', async () => {
    const cdp = Object.assign(new EventEmitter(), { send: vi.fn(async () => ({})) });
    const observer = userscriptInstall.createBrowserDownloadObserver(cdp);
    const since = observer.snapshot();
    cdp.emit('Browser.downloadWillBegin', {
      guid: 'owned-download', suggestedFilename: 'image.jpg', url: 'blob:https://x.com/owned',
    });
    cdp.emit('Browser.downloadProgress', {
      guid: 'owned-download', state: 'completed', receivedBytes: 5, totalBytes: 5,
    });
    await expect(observer.waitForCompletion(since, 'image.jpg')).resolves.toMatchObject({
      guid: 'owned-download', state: 'completed', receivedBytes: 5,
    });
    await expect(observer.assertNoneSince(observer.snapshot(), 'cancelled action')).resolves.toBeUndefined();
    expect(observer.events()).toEqual([{ guid: 'owned-download',
      suggestedFilename: 'image.jpg', source: { scheme: 'blob:', origin: 'https://x.com' } }]);
    expect(cdp.send).toHaveBeenCalledWith('Browser.getVersion');
    observer.dispose();
    expect(cdp.listenerCount('Browser.downloadWillBegin')).toBe(0);
    expect(cdp.listenerCount('Browser.downloadProgress')).toBe(0);
  });

  it('requires a page-origin Blob URL for a ZIP save', () => {
    expect(userscriptInstall.requirePageBlobZipSource('blob:https://x.com/owned'))
      .toEqual({ scheme: 'blob:', origin: 'https://x.com' });
    expect(() => userscriptInstall.requirePageBlobZipSource('blob:https://other.example/owned'))
      .toThrow('page-origin Blob URL');
    expect(() => userscriptInstall.requirePageBlobZipSource('https://x.com/archive.zip'))
      .toThrow('page-origin Blob URL');
  });

  it('catches a native save dispatched after the routed response returns', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'xeg-late-native-save-'));
    const cdp = Object.assign(new EventEmitter(), { send: vi.fn(async () => ({})) });
    const observer = userscriptInstall.createBrowserDownloadObserver(cdp);
    const since = observer.snapshot();
    const lateEvent = setTimeout(() => cdp.emit('Browser.downloadWillBegin', {
      guid: 'late-save', suggestedFilename: 'late.zip', url: 'blob:https://x.com/late',
    }), 25);
    try {
      await expect(userscriptInstall.observeNoNativeDownload(
        observer, since, new Set(), directory, 'late response', 150
      )).rejects.toThrow('created a native download');
    } finally {
      clearTimeout(lateEvent);
      observer.dispose();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('catches a late owned file even when no CDP begin event arrived', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'xeg-late-native-file-'));
    const cdp = Object.assign(new EventEmitter(), { send: vi.fn(async () => ({})) });
    const observer = userscriptInstall.createBrowserDownloadObserver(cdp);
    const lateFile = setTimeout(() => writeFileSync(join(directory, 'late.zip'), 'late'), 25);
    try {
      await expect(userscriptInstall.observeNoNativeDownload(
        observer, observer.snapshot(), new Set(), directory, 'late response', 150
      )).rejects.toThrow('left a file');
    } finally {
      clearTimeout(lateFile);
      observer.dispose();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('requires an exact held-request terminal before accepting a route failure', async () => {
    const context = new EventEmitter();
    const held = { failure: () => ({ errorText: 'net::ERR_ABORTED' }) };
    const unrelated = { failure: () => ({ errorText: 'net::ERR_FAILED' }) };
    const watcher = userscriptInstall.watchExactRequestTerminal(context);
    try {
      watcher.bind(held);
      context.emit('requestfinished', unrelated);
      context.emit('requestfailed', unrelated);
      expect(watcher.terminal()).toBeUndefined();
      expect(() => userscriptInstall.requireHeldRouteOutcome({ kind: 'rejected' }))
        .toThrow('no correlated transport terminal');
      context.emit('requestfailed', held);
      const terminal = await watcher.waitForTerminal();
      expect(terminal).toEqual({ kind: 'requestfailed', errorText: 'net::ERR_ABORTED' });
      expect(userscriptInstall.requireHeldRouteOutcome({ kind: 'rejected' }, terminal))
        .toMatchObject({ requestTerminal: terminal });
      expect(() => userscriptInstall.requireHeldRouteOutcome({ kind: 'rejected' },
        { kind: 'requestfinished' })).toThrow('without a matching failed request');
    } finally {
      watcher.dispose();
    }
    expect(context.listenerCount('requestfinished')).toBe(0);
    expect(context.listenerCount('requestfailed')).toBe(0);
  });

  it('rejects a paused in-progress download after all bytes have arrived', () => {
    const download = {
      bytesReceived: 256 * 1024 * 1024,
      id: 7,
      paused: true,
      state: 'in_progress',
      totalBytes: 256 * 1024 * 1024,
    };
    expect(() => installProfile.assertDownloadIncomplete(download, 'before worker stop'))
      .toThrow(/before worker stop.*bytesReceived.*268435456.*totalBytes.*268435456/u);
    expect(() => installProfile.assertDownloadIncomplete({
      ...download,
      bytesReceived: download.totalBytes - 1,
    }, 'before worker stop')).not.toThrow();
  });

  it('uses the visible Edge switch and its checked property, while keeping Chrome controls', async () => {
    for (const browserName of ['msedge', 'chrome']) {
      const visible = { checked: browserName === 'chrome', getAttribute: () => 'false' };
      const click = vi.fn(async () => { visible.checked = true; });
      const locator = vi.fn((selector: string) => {
        const expected = browserName === 'msedge' ? '#dev-switch:visible' : '#devMode';
        if (selector !== expected) throw new Error('Selected a hidden or unsupported toggle');
        return {
          waitFor: vi.fn(async () => {}),
          evaluate: async (read: (element: typeof visible) => boolean) => read(visible),
          click,
        };
      });
      const page = { goto: vi.fn(async () => {}), locator, close: vi.fn(async () => {}) };
      await installProfile.enableDeveloperMode({ newPage: async () => page }, browserName);
      expect(page.goto).toHaveBeenCalledWith(
        browserName === 'msedge' ? 'edge://extensions/' : 'chrome://extensions/'
      );
      expect(locator).toHaveBeenCalledWith(
        browserName === 'msedge' ? '#dev-switch:visible' : '#devMode'
      );
      expect(click).toHaveBeenCalledTimes(browserName === 'msedge' ? 1 : 0);
      expect(visible.checked).toBe(true);
      expect(page.close).toHaveBeenCalledOnce();
    }
  });

  it('rejects an Edge switch that remains disabled after clicking', async () => {
    const switchElement = { checked: false };
    const page = {
      goto: vi.fn(async () => {}),
      locator: vi.fn(() => ({
        waitFor: async () => {},
        evaluate: async (read: (element: typeof switchElement) => boolean) => read(switchElement),
        click: async () => {},
      })),
      close: vi.fn(async () => {}),
    };
    await expect(installProfile.enableDeveloperMode({ newPage: async () => page }, 'msedge'))
      .rejects.toThrow('developer mode is disabled');
    expect(page.close).toHaveBeenCalledOnce();
  });

  it('accepts only exact public X and Twitter status URLs', () => {
    expect(
      livePage.validateLiveUrls([
        'https://x.com/user_1/status/1',
        'https://twitter.com/ABCDEFGHIJKLMNO/status/9876543210',
      ])
    ).toEqual([
      'https://x.com/user_1/status/1',
      'https://twitter.com/ABCDEFGHIJKLMNO/status/9876543210',
    ]);

    for (const value of [
      'http://x.com/user/status/1',
      'https://www.x.com/user/status/1',
      'https://x.com/user-name/status/1',
      'https://x.com/abcdefghijklmnop/status/1',
      'https://x.com/user/status/not-digits',
      'https://x.com/user/status/1/',
      'https://x.com/user/status/1?view=1',
      'https://x.com/user/status/1#media',
      'https://user:password@x.com/user/status/1',
      'https://x.com:443/user/status/1',
      'https://x.com\\user\\status\\1',
      ' https://x.com/user/status/1',
      'https://x.com/user/status/1\n',
    ]) {
      expect(() => livePage.validateLiveUrls([value]), value).toThrow();
    }
  });

  it('bounds live URLs and rejects duration observation', () => {
    expect(() => livePage.validateLiveUrls('https://x.com/user/status/1')).toThrow();
    expect(() =>
      livePage.validateLiveUrls([
        'https://x.com/a/status/1',
        'https://x.com/b/status/2',
        'https://x.com/c/status/3',
        'https://x.com/d/status/4',
      ])
    ).toThrow('At most three');
    expect(() => livePage.validateLiveObservation(null)).not.toThrow();
    expect(() =>
      livePage.validateLiveObservation({ mode: 'duration', durationSeconds: 1200 })
    ).toThrow('does not support duration');
  });

  it('defaults an omitted live observation to the fixture-compatible null mode', async () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-live-observation-default-'));
    const output = join(root, 'output');
    const chromium = {
      launchPersistentContext: async (): Promise<never> => {
        throw new Error('browser launch reached');
      },
    };
    try {
      await expect(
        installProfile.run({
          browserName: 'chrome',
          chromium,
          headless: true,
          installation: 'extension',
          liveUrls: [],
          output,
          root,
        })
      ).rejects.toThrow('browser launch reached');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('routes the installed userscript separately and rejects public URLs', async () => {
    const chromium = {
      launchPersistentContext: async (): Promise<never> => {
        throw new Error('browser must not launch');
      },
    };
    await expect(installProfile.run({
      browserName: 'chrome', chromium, headless: true, installation: 'userscript',
      liveUrls: ['https://x.com/a/status/1'], output: '/unused', root: '/unused',
    })).rejects.toThrow('does not support public URLs');
  });

  it('keeps live observation opt-in and bundles its imported module', async () => {
    await expect(
      livePage.observeLiveUrls({
        context: null,
        extensionId: 'fixture-extension',
        liveUrls: [],
        output: '',
      })
    ).resolves.toEqual({
      status: 'not-requested',
      evidenceStatus: 'not-applicable',
      pages: [],
    });

    const profile = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../../../validation/windows/profile.json'), 'utf8')
    ) as { installation?: { assets?: string[] } };
    expect(profile.installation?.assets).toContain('validation/windows/live-page.mjs');
    expect(profile.installation?.assets).toContain('validation/windows/userscript-install.mjs');
    expect(profile.installation?.assets).toContain('dist/xcom-enhanced-gallery.user.js');
  });

  it('changes only the supported video click setting in a complete task-owned copy', () => {
    const prior = {
      __schemaHash: '1', version: '1', lastModified: 42,
      gallery: { theme: 'dark', videoClickMode: 'block-controls-only', preloadCount: 3 },
      toolbar: { autoHideDelay: 3000 }, features: { gallery: true },
    };
    const controlled = livePage.createControlledVideoSettings(prior, 100);
    expect(controlled).toEqual({
      ...prior,
      gallery: { ...prior.gallery, videoClickMode: 'allow-all' },
    });
    expect(prior.gallery.videoClickMode).toBe('block-controls-only');
    expect(livePage.createControlledVideoSettings(null, 100)).toMatchObject({
      version: '1', lastModified: 100, __schemaHash: '1',
      gallery: { videoClickMode: 'allow-all' },
    });
  });

  it('waits when the exact article precedes its image and terminates on a challenge', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/public_user/status/9876543210987654321">Status</a>
        <img src="https://pbs.twimg.com/media/delayed.jpg" alt="Delayed media">
      </article>
    `;
    const image = document.querySelector('img');
    if (!(image instanceof HTMLImageElement)) throw new Error('Delayed media fixture missing');
    image.style.display = 'block';
    image.style.opacity = '1';
    image.style.visibility = 'visible';
    Object.defineProperties(image, {
      complete: { configurable: true, value: false },
      naturalWidth: { configurable: true, value: 0 },
    });
    image.getBoundingClientRect = () => ({
      bottom: 180,
      height: 180,
      left: 0,
      right: 320,
      toJSON: () => ({}),
      top: 0,
      width: 320,
      x: 0,
      y: 0,
    });
    const identity = { handle: 'public_user', statusId: '9876543210987654321' };

    expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 320 },
    });
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready',
      target: { imageSource: { path: '/media/delayed.jpg' } },
    });

    document.body.innerHTML = '<main>Verify you are human</main>';
    expect(livePage.inspectLiveTargetDocument(identity)).toEqual({
      state: 'terminal',
      reason: 'host-challenge-or-unavailable',
    });
  });

  it('prefers the exact article quoted video and retains only bounded ownership evidence', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer/status/123">A</a>
        <div data-testid="quoteTweet">
          <a href="https://x.com/quoted/status/456">B</a>
          <div data-testid="videoPlayer"><video poster="https://pbs.twimg.com/ext_tw_video_thumb/456/pu/img/poster.jpg"></video></div>
        </div>
        <img src="https://pbs.twimg.com/media/outer.jpg">
      </article>
    `;
    const video = document.querySelector<HTMLVideoElement>('video');
    if (!video) throw new Error('Video fixture missing');
    video.getBoundingClientRect = () => ({
      bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top: 100, width: 200, x: 0, y: 100,
    });
    const identity = { handle: 'outer', statusId: '123' };
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready',
      target: {
        kind: 'quoted-video', quoteBoundary: 'quoteTweet', quoteStatusIds: ['456'],
        posterSource: { host: 'pbs.twimg.com', path: '/ext_tw_video_thumb/456/pu/img/poster.jpg' },
        ownershipPath: [
          { tag: 'video', testId: null },
          { tag: 'div', testId: 'videoPlayer' },
          { tag: 'div', testId: 'quoteTweet' },
        ],
      },
    });
    expect(livePage.inspectLiveCandidateDocument(identity)).toMatchObject({
      exactArticleFound: true, statusIds: ['123', '456'], quoteCardCount: 1, videoPlayerCount: 1,
    });
  });

  it('records an unmarked video candidate without inventing a quoted post ID', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer/status/123">A</a>
        <div role="link"><div data-testid="videoPlayer"><video></video></div></div>
      </article>
    `;
    const video = document.querySelector<HTMLVideoElement>('video');
    if (!video) throw new Error('Video fixture missing');
    video.getBoundingClientRect = () => ({
      bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top: 100, width: 200, x: 0, y: 100,
    });
    expect(livePage.inspectLiveTargetDocument({ handle: 'outer', statusId: '123' }))
      .toMatchObject({ state: 'ready', target: {
        kind: 'quoted-video', quoteBoundary: 'unmarked-candidate', quoteStatusIds: [],
      } });
  });

  it('recognizes a pre-player video quote by its play button and rejects multiple unmarked candidates', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer/status/123">A</a>
        <div data-testid="quoteTweet"><div data-testid="tweetPhoto">
          <div data-testid="previewInterstitial">
            <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/poster.jpg">
            <button data-testid="playButton">Play</button>
          </div>
        </div></div>
      </article>
    `;
    const button = document.querySelector<HTMLButtonElement>('[data-testid="playButton"]');
    if (!button) throw new Error('Play button fixture missing');
    button.getBoundingClientRect = () => ({
      bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top: 100, width: 200, x: 0, y: 100,
    });
    const identity = { handle: 'outer', statusId: '123' };
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready', target: {
        kind: 'quoted-video', quoteBoundary: 'quoteTweet', previewIndex: 0,
        posterSource: { path: '/amplify_video_thumb/456/img/poster.jpg' },
      },
    });
    expect(livePage.inspectLiveCandidateDocument(identity)).toMatchObject({
      previewInterstitialCount: 1, playButtonCount: 1,
    });

    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer/status/123">A</a>
        <div data-testid="videoPlayer"><video></video></div>
        <div data-testid="videoPlayer"><video></video></div>
      </article>
    `;
    for (const player of document.querySelectorAll<HTMLElement>('[data-testid="videoPlayer"]')) {
      player.getBoundingClientRect = () => ({
        bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
        top: 100, width: 200, x: 0, y: 100,
      });
    }
    expect(livePage.inspectLiveTargetDocument(identity)).toEqual({
      state: 'ambiguous', reason: 'multiple-visible-video-candidates', candidateCount: 2,
    });
  });

  it('records only bounded paths and trusted thumbnail identity around a hidden live video', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer/status/123">Outer private text</a>
        <div role="link"><a href="https://x.com/quoted/status/456">Quoted private text</a>
          <video src="blob:https://x.com/private" poster="https://pbs.twimg.com/amplify_video_thumb/456/img/poster.jpg?token=private"></video>
          <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/poster.jpg?token=private" alt="Private description">
        </div>
      </article>
    `;
    const observation = livePage.inspectLiveCandidateDocument({ handle: 'outer', statusId: '123' });
    expect(observation).toMatchObject({
      exactArticleFound: true,
      statusIds: ['123', '456'],
      videoDetails: [{
        sourceKind: 'blob',
        poster: { host: 'pbs.twimg.com', path: '/amplify_video_thumb/456/img/poster.jpg' },
      }],
      thumbnailDetails: [{
        sourceKind: 'image',
        source: { host: 'pbs.twimg.com', path: '/amplify_video_thumb/456/img/poster.jpg' },
      }],
    });
    expect(JSON.stringify(observation)).not.toMatch(/private|Private|token=|blob:https/u);
  });

  it('targets a direct nested quote article while excluding media in its deeper quote', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer/status/123?token=private"><time>A</time></a>
        <article>
          <a href="https://x.com/quoted/status/456">B</a>
          <video style="display:none" poster="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg"></video>
          <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
          <article><a href="https://x.com/deeper/status/789">C</a>
            <video poster="https://pbs.twimg.com/amplify_video_thumb/789/img/c.jpg"></video>
          </article>
        </article>
      </article>
    `;
    const image = document.querySelector<HTMLImageElement>('img');
    if (!image) throw new Error('Quoted poster fixture missing');
    image.getBoundingClientRect = () => ({
      bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top: 100, width: 200, x: 0, y: 100,
    });
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 200 },
    });
    const identity = { handle: 'outer', statusId: '123' };
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready', target: {
        kind: 'quoted-video', quoteBoundary: 'nested-article', quoteStatusIds: ['456'],
        posterIndex: 0, posterSource: { path: '/amplify_video_thumb/456/img/b.jpg' },
      },
    });
    const candidate = livePage.inspectLiveCandidateDocument(identity);
    expect(candidate).toMatchObject({
      outerArticleOwnStatusAnchors: [{ path: '/outer/status/123', containsTime: true,
        nearestArticleIndex: 0, structure: [{ tag: 'a', role: null, testId: null }] }],
      videoDetails: [
        { nearestArticleIndex: 1, ancestorArticleIndexes: [1, 0],
          ownStatusPaths: ['/quoted/status/456'] },
        { nearestArticleIndex: 2, ancestorArticleIndexes: [2, 1, 0],
          ownStatusPaths: ['/deeper/status/789'] },
      ],
    });
    expect(JSON.stringify(candidate)).not.toContain('token=private');
  });

  it('records bounded status-anchor timing within the video article only', () => {
    document.body.innerHTML = `
      <article><a href="https://x.com/outer/status/123">A</a>
        <article>
          <div role="link"><a href="https://x.com/quoted/status/456?token=private">B</a></div>
          <div data-testid="User-Name"><a href="https://x.com/other/status/457">
            <time datetime="2026-10-08">timestamp</time></a></div>
          <a href="https://evil.example/attacker/status/999">external</a>
          <video></video>
          <article><a href="https://x.com/deeper/status/789"><time>nested</time></a></article>
        </article>
      </article>
    `;
    const observation = livePage.inspectLiveCandidateDocument({ handle: 'outer', statusId: '123' });
    expect(observation).toMatchObject({ videoDetails: [{
      nearestArticleIndex: 1,
      ownStatusPaths: ['/quoted/status/456', '/other/status/457'],
      ownStatusAnchors: [
        { path: '/quoted/status/456', containsTime: false, nearestArticleIndex: 1,
          structure: [{ tag: 'a', role: null, testId: null },
            { tag: 'div', role: 'link', testId: null }] },
        { path: '/other/status/457', containsTime: true, nearestArticleIndex: 1,
          structure: [{ tag: 'a', role: null, testId: null },
            { tag: 'div', role: null, testId: 'User-Name' }] },
      ],
    }] });
    expect(JSON.stringify(observation)).not.toMatch(/token=private|evil\.example|timestamp/u);
  });

  it('uses a non-control poster point within the quote media scope', () => {
    document.body.innerHTML = `
      <article><img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
        <button>Native play control</button></article>
    `;
    const image = document.querySelector<HTMLImageElement>('img');
    const button = document.querySelector<HTMLButtonElement>('button');
    if (!image || !button) throw new Error('Hit-test fixture missing');
    image.getBoundingClientRect = () => ({
      bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top: 100, width: 200, x: 0, y: 100,
    });
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: (x: number) => x < 100 ? [button] : [image],
    });
    try {
      expect(livePage.inspectHitTestedVideoActionDocument(image, {
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      })).toMatchObject({
        inQuote: true, x: 160, y: 120, rejectedControls: 1, mediaScopeDepth: 0,
      });
      expect(livePage.inspectHitTestedVideoActionDocument(image, {
        posterPath: '/amplify_video_thumb/other/img/b.jpg',
      })).toBeNull();
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [button],
      });
      expect(livePage.inspectHitTestedVideoActionDocument(image, {
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      })).toMatchObject({ inQuote: false, rejectedControls: 9 });
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('identifies a bounded native play control separately from a gallery action', () => {
    document.body.innerHTML = `
      <article><div>
        <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
        <img src="https://pbs.twimg.com/profile_images/1/avatar.jpg?token=private">
        <button>Native play</button>
        <video src="blob:https://x.com/private" poster="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg"></video>
        <article><img src="https://pbs.twimg.com/amplify_video_thumb/789/img/nested.jpg"></article>
      </div><img src="https://pbs.twimg.com/profile_images/2/outside.jpg"></article>
    `;
    const image = document.querySelector<HTMLImageElement>('img');
    const button = document.querySelector<HTMLButtonElement>('button');
    const video = document.querySelector<HTMLVideoElement>('video');
    if (!image || !button || !video) throw new Error('Native play fixture missing');
    let top = 100;
    image.getBoundingClientRect = () => ({
      bottom: top + 100, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top, width: 200, x: 0, y: top,
    });
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [button],
    });
    try {
      const hit = livePage.inspectHitTestedVideoActionDocument(image, {
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      });
      expect(hit).toMatchObject({
        inQuote: false,
        nativePlay: { x: 40, y: 120, mediaScopeDepth: 1,
          scopeCounts: { scopeDepth: 1, videoCount: 1, totalImageCount: 2,
            trustedVideoThumbnailCount: 1, ordinaryImageCount: 1 } },
      });
      expect(JSON.stringify(hit)).not.toMatch(/avatar|token=private|nested\.jpg|outside\.jpg/u);
      const focusTarget = livePage.findHitTestedVideoControlDocument(image, {
        x: 40, y: 120, posterPath: '/amplify_video_thumb/456/img/b.jpg',
      });
      expect(focusTarget).toBe(button);
      focusTarget?.focus();
      expect(document.activeElement).toBe(button);
      expect(livePage.findHitTestedVideoControlDocument(image, {
        x: 40, y: 120, posterPath: '/amplify_video_thumb/999/img/other.jpg',
      })).toBeNull();
      const outside = document.createElement('button');
      document.body.append(outside);
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [outside],
      });
      expect(livePage.findHitTestedVideoControlDocument(image, {
        x: 40, y: 120, posterPath: '/amplify_video_thumb/456/img/b.jpg',
      })).toBeNull();
      expect(livePage.inspectHostVideoDocument(video, {
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      })).toMatchObject({
        sourceKind: 'blob',
        poster: { host: 'pbs.twimg.com', path: '/amplify_video_thumb/456/img/b.jpg' },
      });
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [button],
      });
      const scope = document.querySelector<HTMLElement>('article > div');
      if (!scope) throw new Error('Native play scope missing');
      for (let index = 0; index < 25; index += 1) {
        const avatar = document.createElement('img');
        avatar.src = `https://pbs.twimg.com/profile_images/${index}/avatar.jpg?token=private`;
        scope.append(avatar);
      }
      expect(livePage.inspectHitTestedVideoActionDocument(image, {
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      })).toMatchObject({ nativePlay: { scopeCounts: {
        videoCount: 1, totalImageCount: 20,
        trustedVideoThumbnailCount: 1, ordinaryImageCount: 20,
      } } });
      top = 260;
      expect(livePage.inspectHitTestedVideoActionDocument(image, {
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      })).toMatchObject({
        inQuote: false,
        nativePlay: { x: 40, y: 280, mediaScopeDepth: 1 },
      });
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('passes the final quoted-video hit assertion only for the same focused control in allow-all mode', () => {
    document.body.innerHTML = `
      <article><div>
        <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
        <button>Native play</button>
        <button>Other media control</button>
      </div><button>Other article control</button></article>
    `;
    const image = document.querySelector<HTMLImageElement>('img');
    const mediaButton = document.querySelector<HTMLButtonElement>('article > div > button');
    const otherMediaButton = document.querySelector<HTMLButtonElement>(
      'article > div > button + button'
    );
    const otherButton = document.querySelector<HTMLButtonElement>('article > button');
    if (!image || !mediaButton || !otherMediaButton || !otherButton) {
      throw new Error('Control verdict fixture missing');
    }
    image.getBoundingClientRect = () => ({
      bottom: 200, height: 100, left: 0, right: 200, toJSON: () => ({}),
      top: 100, width: 200, x: 0, y: 100,
    });
    let top: Element = mediaButton;
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [top],
    });
    try {
      const expected = { posterPath: '/amplify_video_thumb/456/img/b.jpg' };
      const initialHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      const control = livePage.findHitTestedVideoControlDocument(image, {
        x: initialHit?.nativePlay?.x ?? -1, y: initialHit?.nativePlay?.y ?? -1,
        ...expected,
      });
      expect(initialHit).toMatchObject({ inQuote: false,
        nativePlay: { x: 40, y: 120, mediaScopeDepth: 1 } });
      expect(control).toBe(mediaButton);
      control?.focus();
      const finalHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      const evidence = {
        controlledVideoClickMode: 'allow-all',
        galleryActionKind: 'media-scoped-control-under-allow-all',
        initialHit, finalHit,
        identityBeforeClick: true,
        focusPrepared: document.activeElement === control,
        meaningfulFocusTarget: control instanceof HTMLElement,
        focusedControlStillOwnsClick: document.activeElement === control &&
          document.elementsFromPoint(finalHit?.nativePlay?.x ?? -1,
            finalHit?.nativePlay?.y ?? -1)[0]?.closest('button') === control,
      };
      expect(livePage.quotedVideoHitTestPassed(evidence)).toBe(true);
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, controlledVideoClickMode: 'block-controls-only',
      })).toBe(false);
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, focusedControlStillOwnsClick: false,
      })).toBe(false);
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, focusPrepared: false,
      })).toBe(false);
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, identityBeforeClick: false,
      })).toBe(false);

      top = otherMediaButton;
      const changedControlHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      expect(changedControlHit).toMatchObject({ inQuote: false,
        nativePlay: { mediaScopeDepth: 1 } });
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, finalHit: changedControlHit,
        focusedControlStillOwnsClick: document.elementsFromPoint(
          changedControlHit?.nativePlay?.x ?? -1,
          changedControlHit?.nativePlay?.y ?? -1
        )[0]?.closest('button') === control,
      })).toBe(false);

      top = otherButton;
      const outOfScopeHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      expect(outOfScopeHit).toMatchObject({ inQuote: false, nativePlay: null });
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, finalHit: outOfScopeHit,
      })).toBe(false);

      top = image;
      const ordinaryHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      expect(ordinaryHit).toMatchObject({ inQuote: true, nativePlay: null });
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, finalHit: ordinaryHit,
      })).toBe(false);
      expect(livePage.quotedVideoHitTestPassed({
        ...evidence, controlledVideoClickMode: null,
        galleryActionKind: 'non-control-media-surface',
        initialHit: ordinaryHit, finalHit: ordinaryHit,
        focusedControlStillOwnsClick: undefined,
      })).toBe(true);
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('compares Escape restoration with focus at the trusted activation click', () => {
    document.body.innerHTML = `<article><a href="/source">Prepared</a>
      <div data-testid="videoPlayer"><video tabindex="0"></video><div class="overlay"></div></div>
      <button>Adjacent</button></article><article><button>Foreign</button></article>`;
    const article = document.querySelector('article');
    const prepared = article?.querySelector('a');
    const player = article?.querySelector('video');
    const overlay = article?.querySelector('.overlay');
    const adjacent = article?.querySelector('button');
    const foreign = document.querySelectorAll('article')[1]?.querySelector('button');
    if (!article || !prepared || !player || !overlay || !adjacent || !foreign) {
      throw new Error('Activation fixture missing');
    }
    let top: Element = overlay;
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true, value: () => [top],
    });
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    let capture: ReturnType<LivePageModule['captureActivationFocusDocument']> | undefined;
    try {
      prepared.focus();
      expect(document.activeElement).toBe(prepared);
      const hit = livePage.findActivationHitDocument(player, {
        articleIndex: 0, point: { x: 40, y: 120 },
      });
      expect(hit).toBe(overlay);
      if (!(hit instanceof HTMLElement)) throw new Error('Activation hit missing');
      capture = livePage.captureActivationFocusDocument(hit, {
        articleIndex: 0, point: { x: 40, y: 120 },
      });
      const listener = add.mock.calls.find(([type]) => type === 'click')?.[1];
      if (typeof listener !== 'function') throw new Error('Activation listener missing');
      player.focus(); // Native pointer behavior before the click event.
      listener({ isTrusted: true, button: 0, clientX: 40, clientY: 120,
        target: overlay } as unknown as MouseEvent);
      expect(capture.captured).toBe(true);
      expect(capture.focus).toBe(player);
      expect(capture.focus).not.toBe(prepared);
      prepared.focus(); // Gallery focus while open.
      player.focus(); // Escape restores the actual activation focus.
      expect(document.activeElement).toBe(capture.focus);
      capture.dispose();
      expect(remove).toHaveBeenCalledWith('click', listener, true);
      top = adjacent;
      expect(livePage.findActivationHitDocument(player, {
        articleIndex: 0, point: { x: 40, y: 120 },
      })).toBeNull();
      top = foreign;
      expect(livePage.findActivationHitDocument(player, {
        articleIndex: 0, point: { x: 40, y: 120 },
      })).toBeNull();
    } finally {
      capture?.dispose();
      add.mockRestore();
      remove.mockRestore();
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('rejects missing, untrusted, out-of-scope, and non-meaningful activation focus', () => {
    document.body.innerHTML = '<article><button>Inside</button></article><article><button>Outside</button></article>';
    const article = document.querySelector('article');
    const inside = article?.querySelector('button');
    const outside = document.querySelectorAll('article')[1]?.querySelector('button');
    if (!article || !inside || !outside) throw new Error('Activation fixture missing');
    const add = vi.spyOn(window, 'addEventListener');
    const capture = livePage.captureActivationFocusDocument(article, {
      articleIndex: 0, point: { x: 40, y: 120 },
    });
    try {
      const listener = add.mock.calls.find(([type]) => type === 'click')?.[1];
      if (typeof listener !== 'function') throw new Error('Activation listener missing');
      expect(capture.captured).toBe(false);
      inside.focus();
      inside.click();
      expect(capture.captured).toBe(false);
      const click = (target: Element, x = 40, y = 120, button = 0): void => {
        listener({ isTrusted: true, button, clientX: x, clientY: y,
          target } as unknown as MouseEvent);
      };
      click(outside);
      click(inside, 50);
      click(inside, 40, 120, 2);
      outside.focus();
      click(inside);
      document.body.focus();
      inside.blur();
      click(inside);
      expect(capture.captured).toBe(false);
      expect(capture.focus).toBeNull();
    } finally {
      capture.dispose();
      add.mockRestore();
    }
  });

  it('accepts only aborts from the selected, proven quoted video', () => {
    const source = { host: 'video.twimg.com', path: '/amplify_video/456/vid/clip.mp4' };
    const abort = { kind: 'request-failed', error: 'net::ERR_ABORTED',
      url: 'https://video.twimg.com/amplify_video/456/aud/chunk.m4s' };
    const observation = {
      requiredAssertions: Object.fromEntries(Array.from({ length: 13 }, (_, index) =>
        [`assertion${index}`, true])),
      gallery: { owner: { status: 'matched-direct-quote-variant', mediaId: '456' },
        opened: { selectedVideo: { source } } },
      hostDiagnostics: [abort], hostDiagnosticOverflow: 0,
      productErrors: [] as unknown[], productErrorOverflow: 0,
      pageErrors: [] as unknown[], pageErrorOverflow: 0,
      missingAssertions: [] as string[],
    };
    expect(livePage.classifyLiveHostDiagnostics(observation)).toEqual({
      expectedLifecycleCancellationCount: 1, evidenceStatus: 'observed',
    });
    const unverified = (override: Record<string, unknown>): void => {
      expect(livePage.classifyLiveHostDiagnostics({ ...observation, ...override }).evidenceStatus)
        .toBe('unverified');
    };
    unverified({ hostDiagnostics: [{ ...abort,
      url: 'https://video.twimg.com/amplify_video/789/aud/chunk.m4s' }] });
    unverified({ hostDiagnostics: [{ ...abort,
      url: 'https://video.twimg.com/ext_tw_video/456/aud/chunk.m4s' }] });
    unverified({ hostDiagnostics: [{ ...abort, error: 'HTTP 403' }] });
    unverified({ hostDiagnostics: [{ ...abort, hadQuery: true }] });
    unverified({ hostDiagnostics: [{ ...abort, hadCredentials: true }] });
    unverified({ hostDiagnostics: [{ ...abort, hadPort: true }] });
    unverified({ hostDiagnostics: [{ ...abort,
      url: `${abort.url}?private=redacted` }] });
    unverified({ hostDiagnostics: [{ ...abort,
      url: 'https://user:pass@video.twimg.com/amplify_video/456/aud/chunk.m4s' }] });
    unverified({ hostDiagnostics: [{ ...abort,
      url: 'https://video.twimg.com:444/amplify_video/456/aud/chunk.m4s' }] });
    unverified({ hostDiagnostics: [{ ...abort,
      url: 'https://video.twimg.com:443/amplify_video/456/aud/chunk.m4s' }] });
    unverified({ hostDiagnostics: [{ kind: 'http-response', status: 403,
      url: 'https://x.com/i/api/graphql/TweetResultByRestId' }] });
    unverified({ hostDiagnostics: [{ ...abort,
      url: 'https://foreign.example/amplify_video/456/aud/chunk.m4s' }] });
    unverified({ hostDiagnostics: [{ kind: 'console', location: 'https://x.com',
      text: 'Host failed' }] });
    unverified({ requiredAssertions: { ...observation.requiredAssertions,
      playbackProgress: false } });
    unverified({ hostDiagnosticOverflow: 1 });
    unverified({ gallery: { ...observation.gallery,
      opened: { selectedVideo: { source: { ...source,
        path: '/amplify_video/789/vid/clip.mp4' } } } } });

    // A page or product error can arrive while the post-close screenshot is awaited.
    observation.productErrors.push({ kind: 'console' });
    expect(livePage.classifyLiveHostDiagnostics(observation).evidenceStatus).toBe('unverified');
    expect(livePage.refreshQuotedVideoErrorAssertions(observation)).toContain('noProductErrors');
    expect(observation.requiredAssertions.noProductErrors).toBe(false);
    observation.productErrors.pop();
    observation.pageErrors.push({ kind: 'page-error' });
    expect(livePage.refreshQuotedVideoErrorAssertions(observation)).toContain('noPageErrors');
    expect(observation.requiredAssertions.noPageErrors).toBe(false);
  });

  it('accepts one sibling poster after the host clears video.poster and rejects conflicts', () => {
    document.body.innerHTML = `
      <article>
        <video src="blob:https://x.com/private"></video>
        <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg?token=private">
        <article><img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg"></article>
      </article>
    `;
    const video = document.querySelector<HTMLVideoElement>('video');
    const sibling = document.querySelector<HTMLImageElement>('article > img');
    if (!video || !sibling) throw new Error('Sibling poster fixture missing');
    const expected = { posterPath: '/amplify_video_thumb/456/img/b.jpg' };
    expect(livePage.inspectHostVideoDocument(video, expected)).toMatchObject({
      poster: { host: 'pbs.twimg.com', path: expected.posterPath },
      posterEvidence: 'unique-sibling-image', matchingSiblingCount: 1,
    });
    video.poster = 'https://pbs.twimg.com/amplify_video_thumb/999/img/other.jpg';
    expect(livePage.inspectHostVideoDocument(video, expected)).toMatchObject({
      poster: null, posterEvidence: 'conflict',
    });
    video.removeAttribute('poster');
    sibling.insertAdjacentHTML('afterend',
      '<img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">');
    expect(livePage.inspectHostVideoDocument(video, expected)).toMatchObject({
      poster: null, posterEvidence: 'ambiguous-sibling-images', matchingSiblingCount: 2,
    });
  });

  it('summarizes direct quote API relationships and playable variants without response text', () => {
    const url = 'https://x.com/i/api/graphql/query/TweetResultByRestId?variables=%7B%22tweetId%22%3A%22123%22%7D';
    const result = livePage.summarizeTweetResultResponse(url, 200, {
      data: { tweetResult: { result: {
        rest_id: '123', legacy: { full_text: 'Private text' },
        quoted_status_result: { result: {
          rest_id: '456', legacy: { full_text: 'Another private text', extended_entities: { media: [{
            id_str: '789', type: 'video',
            media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/456/pu/img/poster.jpg',
            video_info: { variants: [
              { content_type: 'video/mp4', url: 'https://video.twimg.com/ext_tw_video/456/pu/vid/clip.mp4?token=secret' },
              { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/playlist.m3u8' },
            ] },
          }] } },
        } },
      } } },
    });
    expect(result).toMatchObject({
      operation: 'TweetResultByRestId', requestedTweetId: '123', httpStatus: 200,
      result: { id: '123' }, directQuote: { id: '456', media: [{
        id: '789', type: 'video', playableVariants: [{ host: 'video.twimg.com', path: '/ext_tw_video/456/pu/vid/clip.mp4' }],
      }] },
    });
    expect(JSON.stringify(result)).not.toMatch(/Private text|Another private text|secret|playlist/u);
  });

  it('marks a rejected quote lookup without inferring login or product success', () => {
    const rejection = livePage.summarizeQuoteProviderRejection({
      tweetResultByRestId: { responses: [403] },
      observations: [{ operation: 'TweetResultByRestId', requestedTweetId: '456',
        httpStatus: 403, providerErrors: false, result: null, bodyOutcome: 'not-readable' }],
    });
    expect(rejection).toEqual({ operation: 'TweetResultByRestId', kind: 'http-rejection',
      httpStatus: 403, requestedTweetId: '456' });
    expect(livePage.classifyLiveFailure('controlled-media-click-did-not-open-gallery',
      'attempting', rejection)).toBe('provider-rejection-observed-gallery-unverified');
    expect(livePage.classifyLiveFailure('controlled-media-click-did-not-open-gallery',
      'attempting', null)).toBe('controlled-media-click-did-not-open-gallery');
    expect(livePage.summarizeQuoteProviderRejection({
      tweetResultByRestId: { responses: [200] },
      observations: [{ operation: 'TweetResultByRestId', requestedTweetId: '456',
        httpStatus: 200, providerErrors: true }],
    })).toEqual({ operation: 'TweetResultByRestId', kind: 'graphql-errors',
      httpStatus: 200, requestedTweetId: '456' });
    expect(livePage.summarizeQuoteProviderRejection({
      tweetResultByRestId: { responses: [403] }, observations: [],
    })).toEqual({ operation: 'TweetResultByRestId', kind: 'http-rejection',
      httpStatus: 403, requestedTweetId: null });
    expect(livePage.summarizeQuoteProviderRejection({
      tweetResultByRestId: { responses: [200] }, observations: [],
    })).toBeNull();
  });

  it('rejects a matching image outside the selected gallery index', () => {
    document.body.innerHTML = `
      <div data-xeg-gallery-container>
        <fieldset data-gallery-element="toolbar" data-current-index="1" data-focused-index="1">
          <span id="xeg-toolbar-counter" data-gallery-element="position"
            data-position="2" data-total="2" data-current-index="1" data-focused-index="1"></span>
        </fieldset>
        <ol>
          <li data-gallery-element="item" data-index="0" data-media-loaded="true">
            <img src="https://pbs.twimg.com/media/target.jpg" alt="Target in wrong item">
          </li>
          <li data-gallery-element="item" data-index="1" data-media-loaded="true">
            <img src="https://pbs.twimg.com/media/wrong.jpg" alt="Wrong selected image">
          </li>
        </ol>
      </div>
    `;
    const elements = document.querySelectorAll<HTMLElement>(
      '[data-gallery-element="item"], [data-gallery-element="item"] img'
    );
    for (const element of elements) {
      element.style.display = 'block';
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      element.getBoundingClientRect = () => ({
        bottom: 180,
        height: 180,
        left: 0,
        right: 320,
        toJSON: () => ({}),
        top: 0,
        width: 320,
        x: 0,
        y: 0,
      });
      if (element instanceof HTMLImageElement) {
        Object.defineProperties(element, {
          complete: { configurable: true, value: true },
          naturalWidth: { configurable: true, value: 320 },
        });
      }
    }
    const expected = { expectedIndex: 2, expectedPath: '/media/target.jpg' };

    expect(livePage.inspectSelectedGalleryDocument(expected)).toBe(false);
    const selectedImage = document.querySelector<HTMLImageElement>(
      '[data-gallery-element="item"][data-index="1"] img'
    );
    if (!selectedImage) throw new Error('Selected gallery image fixture missing');
    selectedImage.src = 'https://pbs.twimg.com/media/target.jpg?name=orig';
    const wrongImage = document.querySelector<HTMLImageElement>(
      '[data-gallery-element="item"][data-index="0"] img'
    );
    if (!wrongImage) throw new Error('Other gallery image fixture missing');
    wrongImage.src = 'https://pbs.twimg.com/media/other.jpg';
    expect(livePage.inspectSelectedGalleryDocument(expected)).toEqual({
      imageSource: { host: 'pbs.twimg.com', path: '/media/target.jpg' },
      itemIndex: 1,
      itemVisible: true,
      positionValue: 2,
    });

    const position = document.querySelector<HTMLElement>('#xeg-toolbar-counter');
    const toolbar = document.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
    if (!position || !toolbar) throw new Error('Gallery context fixture missing');

    for (const [element, attribute, value] of [
      [position, 'data-position', '1'],
      [position, 'data-total', '3'],
      [position, 'data-focused-index', '0'],
      [position, 'data-current-index', '0'],
      [toolbar, 'data-focused-index', '0'],
      [toolbar, 'data-current-index', '0'],
    ] as const) {
      const original = element.getAttribute(attribute);
      element.setAttribute(attribute, value);
      expect(livePage.inspectSelectedGalleryDocument(expected), attribute).toBe(false);
      if (original === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, original);
    }

    wrongImage.src = 'https://pbs.twimg.com/media/target.jpg';
    expect(livePage.inspectSelectedGalleryDocument(expected)).toBe(false);
  });
});
