// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vite-plus/test';

type LivePageModule = Pick<
  typeof import('../../../validation/windows/live-page.ts'),
  | 'createControlledVideoSettings'
  | 'quotedVideoSurface'
  | 'restoreStoredVideoSettings'
  | 'validateLiveUrls'
  | 'validateBorrowedHostProof'
  | 'fingerprintKnownInlineHandlerCsp'
  | 'fullVideoUrlIdentity'
  | 'captureApiVideoIdentities'
  | 'summarizeTweetResultResponse'
  | 'readSelectedCurrentVideoUrlDocument'
  | 'inspectHitTestedAction'
  | 'inspectHitTestedNativePreviewAction'
  | 'inspectNativePreviewOwnerDocument'
  | 'refreshNativePreviewObservation'
  | 'summarizeCompactImageEvidence'
  | 'summarizeNativePreviewEvidence'
  | 'canonicalOwnedPhotoPath'
  | 'ownedMixedPhotoVideo'
> & {
  inspectLiveTargetDocument(identity: { handle: string; statusId: string }):
    | false
    | {
        state: string;
        reason?: string;
        target?: {
          kind: string;
          imageSource?: { path: string };
          ownerStatusId?: string;
          ownerHandle?: string;
          directQuoteId?: string;
          quoteBoundary?: string;
          quoteStatusIds?: string[];
          ownershipPath?: unknown[];
        };
      };
  inspectLiveCandidateDocument(identity: { handle: string; statusId: string }): {
    exactArticleFound: boolean;
    statusIds?: string[];
    outerArticleOwnStatusAnchors?: Array<{
      path: string;
      containsTime: boolean;
      nearestArticleIndex: number;
      structure: unknown[];
    }>;
    quoteCardCount?: number;
    videoPlayerCount?: number;
    previewInterstitialCount?: number;
    playButtonCount?: number;
  };
  inspectSelectedGalleryVideoDocument():
    | false
    | {
        index: number;
        source: { host: string; path: string } | null;
        readyState: number;
        width: number;
        height: number;
        mediaErrorCode: number | null;
      };
  inspectHitTestedVideoActionDocument(
    element: HTMLElement,
    expected: {
      posterPath: string | null;
    }
  ): null | {
    inQuote: boolean;
    x: number | null;
    y: number | null;
    rejectedControls: number;
    mediaScopeDepth: number | null;
    nativePlay?: {
      x: number;
      y: number;
      mediaScopeDepth: number;
      scopeCounts?: {
        scopeDepth: number;
        videoCount: number;
        totalImageCount: number;
        trustedVideoThumbnailCount: number;
        ordinaryImageCount: number;
      } | null;
    } | null;
  };
  findHitTestedVideoControlDocument(
    element: HTMLElement,
    expected: {
      x: number;
      y: number;
      posterPath: string;
    }
  ): HTMLElement | null;
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
  inspectHostVideoDocument(
    video: HTMLVideoElement,
    expected: {
      posterPath: string;
    }
  ): null | {
    sourceKind: string;
    poster: { host: string; path: string } | null;
    posterEvidence: string;
    matchingSiblingCount: number;
    currentTime: number;
  };
  summarizeQuoteProviderRejection(api: unknown): null | {
    operation: string;
    kind: string;
    httpStatus: number | null;
    requestedTweetId: string | null;
  };
  classifyLiveFailure(
    classification: string | undefined,
    galleryStatus: string,
    providerRejection: unknown
  ): string;
  classifyLiveHostDiagnostics(
    observation: unknown,
    proof?: unknown
  ): {
    expectedLifecycleCancellationCount: number;
    evidenceStatus: string;
    qualifiedCspCount?: number;
  };
  refreshQuotedVideoErrorAssertions(observation: {
    requiredAssertions: Record<string, boolean>;
    missingAssertions: string[];
    productErrors: unknown[];
    productErrorOverflow: number;
    pageErrors: unknown[];
    pageErrorOverflow: number;
  }): string[];
  captureActivationFocusDocument(
    surface: Element,
    expected: {
      articleIndex: number;
      point: { x: number; y: number };
    }
  ): { readonly focus: HTMLElement | null; readonly captured: boolean; dispose(): void };
  findActivationHitDocument(
    surface: HTMLElement,
    expected: {
      articleIndex: number;
      point: { x: number; y: number };
    }
  ): Element | null;
  inspectSelectedGalleryDocument(expected: {
    expectedIndex: number | null;
    expectedPath: string;
    allowPhotoFormatVariant?: boolean;
  }):
    | false
    | {
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
};

type InstallProfileModule = {
  notificationCallsSince(cursor: unknown, observed: unknown): unknown[];
  assertNoRetiredExtractionNotifications(cursor: unknown, observed: unknown): unknown[];
  assertDownloadIncomplete(download: unknown, stage: string): void;
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

type InstallPreparationModule = {
  installFixtureRoutes(
    context: unknown,
    root: string,
    images: [Buffer, Buffer, Buffer],
    displayImages: [Buffer, Buffer, Buffer],
    compactImages?: unknown,
    experienceImages?: Buffer[],
    options?: { classicTweetApi?: boolean }
  ): Promise<{
    apiResponses: Array<{ status: number }>;
    classicApiResponses: Array<{ status: number; tweetId?: string }>;
    unhandledRequests: unknown[];
    remove(): Promise<void>;
  }>;
  enableDeveloperMode(context: unknown, browserName: string): Promise<void>;
};

const livePage = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/live-page.ts')).href
)) as LivePageModule;
const installProfile = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/install-profile.ts')).href
)) as InstallProfileModule;
const installPreparation = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/install-preparation.ts'))
    .href
)) as InstallPreparationModule;
const userscriptInstall = (await import(
  pathToFileURL(resolve(import.meta.dirname, '../../../validation/windows/userscript-install.ts'))
    .href
)) as Pick<
  typeof import('../../../validation/windows/userscript-install.ts'),
  'managerDetailsUrl'
> & {
  MEDIA_COHORTS: Record<'normal' | 'failure' | 'partial' | 'held', string[]>;
  PUBLIC_AVATAR_PATH: string;
  isPublicAvatarFixtureUrl(value: string): boolean;
  isUnavailablePreviewFixtureUrl(value: string): boolean;
  FIXTURE_ZIP_NAME: string;
  fixtureZipEntries(images: Uint8Array[]): Array<{ filename: string; bytes: Uint8Array }>;
  probeManagerUserScripts(page: {
    evaluate(callback: () => Promise<unknown>): Promise<unknown>;
  }): Promise<{ available: boolean; registeredScriptCount?: number; errorType?: string }>;
  hasKnownChromeUserScriptsLabel(text: string): boolean;
  summarizeManagerFrameUrl(value: string, managerId: string): string | null;
  isOwnedManagerDetailsUrl(value: string, detailsUrl: string): boolean;
  isOwnedManagerInspectionUrl(value: string, detailsUrl: string, managerId: string): boolean;
  isOwnedManagerOptionsUrl(value: string, managerId: string): boolean;
  isOwnedManagerPermissionAskUrl(value: string, managerId: string): boolean;
  browserProcessId(value: unknown): number | null;
  isObservedChromeNativeDownloadPrompt(value: unknown): boolean;
  captureNativeManagerPermission(
    cdp: { send(method: string): Promise<unknown> },
    root: string,
    output: string,
    profile: string,
    browserName: string,
    run: (file: string, args: string[], options: unknown) => Promise<unknown>
  ): Promise<{ status: string; reason: string | null }>;
  inspectAndAllowNativeManagerPermission(
    cdp: { send(method: string): Promise<unknown> },
    root: string,
    output: string,
    profile: string,
    browserName: string,
    ask: { isClosed(): boolean; context(): unknown; url(): string },
    managerId: string,
    context: unknown,
    run: (file: string, args: string[], options: unknown) => Promise<unknown>
  ): Promise<{ status: string; action: { status: string; reason: string | null } }>;
  requireManagerDownloadsHeading(actual: string, localizedDownloads: string): void;
  managerSettingRowLabel(localizedName: string): string;
  managerSettingRow(scope: unknown, localizedName: string): unknown;
  captureAndConfirmManagerPermissionAsk(
    ask: unknown,
    managerId: string,
    output: string,
    okLabel: string
  ): Promise<void>;
  requireManagerUiLabels(labels: Record<string, unknown>): Record<string, string>;
  readManagerUiLabels(
    page: {
      url(): string;
      evaluate(callback: (id: string) => unknown, id: string): Promise<unknown>;
    },
    managerId: string
  ): Promise<Record<string, string>>;
  probeManagerDownloadsPermission(
    page: {
      url(): string;
      evaluate(callback: (id: string) => Promise<boolean>, id: string): Promise<boolean>;
    },
    managerId: string
  ): Promise<boolean>;
  configureManagerInfoLogging(
    page: unknown,
    managerId: string
  ): Promise<{
    original: string;
    requested: string;
    observed: string;
    scope: string;
  }>;
  inspectFirstCurrentDownload(page: {
    url(): string;
    evaluate(callback: (url: string) => unknown, url: string): Promise<unknown>;
  }): Promise<unknown>;
  inspectManagerDownloadHistoryDocument(args: {
    managerId: string;
    fixtureUrl: string;
    expectedName: string;
    expectedPath: string;
    expectedBytes: number;
  }): Promise<{
    status: string;
    items: Array<{
      id: number;
      state: string;
      interruptReason: string | null;
      requestedNameMatch: boolean;
      ownedPathMatch: boolean;
      expectedSizeMatch: boolean;
      fixtureUrlMatch: boolean;
    }>;
  }>;
  firstCurrentManagerDownloadHistory(
    before: { status: string; items: Array<{ id: number }> },
    after: { status: string; items: Array<{ id: number }> }
  ): { status: string; items: Array<{ id: number }> };
  selectCompletedManagerDownload(
    before: unknown,
    after: unknown
  ): { nativeId: number; nativeState: string; completionSource: string } | undefined;
  runUserscriptInstallation(options: {
    browserName: string;
    chromium: unknown;
    root: string;
    output: string;
    headless: boolean;
  }): Promise<unknown>;
  classifyManagerDownloadConsole(value: unknown): string | null;
  watchManagerDownloadConsole(
    context: EventEmitter & { serviceWorkers(): EventEmitter[] },
    managerId: string
  ): { mark(): unknown; snapshotSince(before: unknown): unknown; dispose(): void };
  findEdgeUserScriptsControl(page: unknown, managerId: string): Promise<unknown>;
  watchFixtureMediaNetwork(context: EventEmitter): {
    events: Array<{
      kind: string;
      cohort: string;
      index: number;
      method: string;
      resourceType: string;
      status: number | null;
    }>;
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
  observeNoNativeDownload(
    observer: { assertNoneSince(since: number, label: string): Promise<void> },
    since: number,
    files: Set<string>,
    directory: string,
    label: string,
    durationMs: number
  ): Promise<{ samples: number }>;
};

describe('installed navigation notification creation history', () => {
  const prior = { id: 'xeg-prior', message: 'Before the scenario' };
  const cursor = {
    observerId: 'owned-worker-observer',
    apiIntact: true,
    overflow: false,
    calls: [prior],
    activeIds: [],
  };

  it('excludes intact pre-existing history and accepts zero new creations', () => {
    expect(installProfile.assertNoRetiredExtractionNotifications(cursor, { ...cursor })).toEqual(
      []
    );
  });

  it('rejects a transient creation even after the active list is empty', () => {
    const observed = { ...cursor, calls: [prior, { id: 'xeg-transient' }], activeIds: [] };
    expect(installProfile.notificationCallsSince(cursor, observed)).toHaveLength(1);
    expect(() => installProfile.assertNoRetiredExtractionNotifications(cursor, observed)).toThrow(
      'zero notification-creation calls'
    );
  });

  it('rejects reuse of a prior notification ID even after it is cleared', () => {
    const observed = { ...cursor, calls: [prior, { ...prior }], activeIds: [] };
    expect(() => installProfile.assertNoRetiredExtractionNotifications(cursor, observed)).toThrow(
      'zero notification-creation calls'
    );
  });

  it.each([
    { ...cursor, observerId: 'restarted-worker' },
    { ...cursor, apiIntact: false },
    { ...cursor, overflow: true },
    { ...cursor, calls: [] },
    null,
  ])('rejects lost or incomplete observation instead of reporting zero calls: %j', (observed) => {
    expect(() => installProfile.assertNoRetiredExtractionNotifications(cursor, observed)).toThrow();
  });
});

describe('Windows X live page validation', () => {
  it('serves exact classic photo metadata only for the failed-entry fixture', async () => {
    const root = resolve(import.meta.dirname, '../../..');
    const images: [Buffer, Buffer, Buffer] = [
      Buffer.from('first'),
      Buffer.from('second'),
      Buffer.from('third'),
    ];
    const url =
      'https://x.com/i/api/graphql/owned/TweetResultByRestId?variables=' +
      encodeURIComponent(JSON.stringify({ tweetId: '1234567890123456789' }));
    const exercise = async (classicTweetApi: boolean) => {
      let handler:
        | ((route: {
            request(): { url(): string; method(): string };
            fulfill(response: { status: number; body: string }): Promise<void>;
          }) => Promise<void>)
        | undefined;
      const context = Object.assign(new EventEmitter(), {
        route: vi.fn(async (_pattern: string, routeHandler: typeof handler) => {
          handler = routeHandler;
        }),
        unroute: vi.fn(async () => {}),
      });
      const routes = await installPreparation.installFixtureRoutes(
        context,
        root,
        images,
        images,
        undefined,
        undefined,
        { classicTweetApi }
      );
      const fulfill = vi.fn(async (_response: { status: number; body: string }) => {});
      try {
        expect(handler).toBeDefined();
        await handler!({
          request: () => ({ url: () => url, method: () => 'GET' }),
          fulfill,
        });
        return { response: fulfill.mock.calls[0]![0], routes };
      } finally {
        await routes.remove();
      }
    };
    const focused = await exercise(true);
    expect(focused.response.status).toBe(200);
    const result = JSON.parse(focused.response.body).data.tweetResult.result;
    expect(result).toMatchObject({
      rest_id: '1234567890123456789',
      core: { user_results: { result: { legacy: { screen_name: 'testuser' } } } },
    });
    expect(
      result.legacy.extended_entities.media.map(
        (media: { media_url_https: string }) => media.media_url_https
      )
    ).toEqual([
      'https://pbs.twimg.com/media/GkE1234ABCDEF?format=jpg&name=small',
      'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=small',
      'https://pbs.twimg.com/media/GkE9012MNOPQR.jpg?format=jpg&name=small',
    ]);
    expect(focused.routes.classicApiResponses).toMatchObject([
      { status: 200, tweetId: '1234567890123456789' },
    ]);
    expect(focused.routes.apiResponses).toEqual([]);
    expect(focused.routes.unhandledRequests).toEqual([]);

    const defaultRoute = await exercise(false);
    expect(defaultRoute.response.status).toBe(403);
    expect(defaultRoute.routes.classicApiResponses).toEqual([]);
    expect(defaultRoute.routes.apiResponses).toEqual([
      { method: 'GET', status: 403, url: '/i/api/graphql/owned/TweetResultByRestId' },
    ]);
  });
  it('keeps the loopback certificate exception scoped to Chrome', async () => {
    const chromium = { launchPersistentContext: vi.fn() };
    await expect(
      userscriptInstall.runUserscriptInstallation({
        browserName: 'msedge',
        chromium,
        root: '/unused',
        output: '/unused',
        headless: false,
      })
    ).rejects.toThrow('Chrome only');
    expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
  });

  const nativePrompt = () => ({
    status: 'captured',
    capture: 'uia-only',
    screenshot: 'not-captured',
    permissionGrantAttempted: false,
    truncated: true,
    browserPid: 42,
    creationUtcTicks: '639271195545735820',
    browserSessionId: 2,
    observerSessionId: 2,
    foregroundHandle: '8259362',
    foregroundOwnedAndVisible: true,
    uiaRootProcessId: 42,
    controls: [
      {
        name: "'Tampermonkey'이(가) 추가 승인을 요청했습니다.",
        controlType: 'ControlType.Window',
        depth: 3,
      },
      { name: '허용', controlType: 'ControlType.Button', depth: 8 },
      { name: '거부', controlType: 'ControlType.Button', depth: 8 },
    ],
    promptScope: {
      complete: true,
      reason: null as string | null,
      windowCount: 1,
      nameTruncated: false,
      rootProcessId: 42,
      visitedControls: 6,
      attemptedNodes: 6,
      controls: [
        {
          name: "'Tampermonkey'이(가) 추가 승인을 요청했습니다.",
          controlType: 'ControlType.Window',
          depth: 0,
          isEnabled: true,
          isOffscreen: false,
        },
        {
          name: "'Tampermonkey'이(가) 추가 승인을 요청했습니다.",
          controlType: 'ControlType.Text',
          depth: 1,
          isEnabled: true,
          isOffscreen: false,
        },
        {
          name: '이전에 가능했던 대상:',
          controlType: 'ControlType.Text',
          depth: 2,
          isEnabled: true,
          isOffscreen: false,
        },
        {
          name: '다운로드 관리',
          controlType: 'ControlType.Text',
          depth: 2,
          isEnabled: true,
          isOffscreen: false,
        },
        {
          name: '허용',
          controlType: 'ControlType.Button',
          depth: 1,
          isEnabled: true,
          isOffscreen: false,
        },
        {
          name: '거부',
          controlType: 'ControlType.Button',
          depth: 1,
          isEnabled: true,
          isOffscreen: false,
        },
      ],
    },
  });

  it('rejects a changed native title, extra permission, ambiguous Allow, and mismatched process', () => {
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(nativePrompt())).toBe(true);
    const wrongTitle = nativePrompt();
    wrongTitle.promptScope.controls[0]!.name = 'Another extension requested approval';
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(wrongTitle)).toBe(false);
    const otherPermission = nativePrompt();
    otherPermission.promptScope.controls.push({
      name: '방문 기록 읽기',
      controlType: 'ControlType.Text',
      depth: 2,
      isEnabled: true,
      isOffscreen: false,
    });
    otherPermission.promptScope.visitedControls++;
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(otherPermission)).toBe(false);
    const ambiguousAllow = nativePrompt();
    ambiguousAllow.promptScope.controls.push({
      name: '허용',
      controlType: 'ControlType.Button',
      depth: 1,
      isEnabled: true,
      isOffscreen: false,
    });
    ambiguousAllow.promptScope.visitedControls++;
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(ambiguousAllow)).toBe(false);
    const differentProcess = nativePrompt();
    differentProcess.uiaRootProcessId = 77;
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(differentProcess)).toBe(false);
    const incompleteScope = nativePrompt();
    incompleteScope.promptScope.complete = false;
    incompleteScope.promptScope.reason = 'depth-cap';
    incompleteScope.promptScope.controls.pop();
    incompleteScope.promptScope.visitedControls--;
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(incompleteScope)).toBe(false);
    const disabledAllow = nativePrompt();
    disabledAllow.promptScope.controls[4]!.isEnabled = false;
    expect(userscriptInstall.isObservedChromeNativeDownloadPrompt(disabledAllow)).toBe(false);
  });

  it('requires a current owned manager ask before guarded native Invoke', async () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-native-invoke-'));
    const profile = join(root, 'xeg-userscript-install-owned');
    const output = join(root, 'output');
    mkdirSync(profile);
    mkdirSync(output);
    const context = {};
    let closed = false;
    let url = 'chrome-extension://owned/ask.html?aid=opaque';
    let promptReceipt = nativePrompt();
    const ask = { isClosed: () => closed, context: () => context, url: () => url };
    const cdp = { send: vi.fn(async () => ({ processInfo: [{ type: 'browser', id: 42 }] })) };
    const run = vi.fn(async (_file: string, args: string[], _options: unknown) => {
      writeFileSync(
        join(
          output,
          args.includes('-InvokeAllow')
            ? 'userscript-manager-native-permission-action.json'
            : 'userscript-manager-native-permission.json'
        ),
        JSON.stringify(
          args.includes('-InvokeAllow')
            ? {
                status: 'invoked',
                capture: 'uia-only',
                screenshot: 'not-captured',
                permissionGrantAttempted: true,
                postProcessStable: true,
                postForegroundOwned: true,
              }
            : promptReceipt
        )
      );
    });
    try {
      closed = true;
      const skipped = await userscriptInstall.inspectAndAllowNativeManagerPermission(
        cdp,
        root,
        output,
        profile,
        'chrome',
        ask,
        'owned',
        context,
        run
      );
      expect(skipped.action).toEqual({ status: 'skipped', reason: 'manager-ask-not-current' });
      expect(run).toHaveBeenCalledOnce();
      run.mockClear();
      closed = false;
      url = 'chrome-extension://other/ask.html?aid=opaque';
      const otherManager = await userscriptInstall.inspectAndAllowNativeManagerPermission(
        cdp,
        root,
        output,
        profile,
        'chrome',
        ask,
        'owned',
        context,
        run
      );
      expect(otherManager.action).toEqual({ status: 'skipped', reason: 'manager-ask-not-current' });
      expect(run).toHaveBeenCalledOnce();
      run.mockClear();
      url = 'chrome-extension://owned/ask.html?aid=opaque';
      promptReceipt = nativePrompt();
      promptReceipt.promptScope.complete = false;
      promptReceipt.promptScope.reason = 'depth-cap';
      promptReceipt.promptScope.controls.pop();
      promptReceipt.promptScope.visitedControls--;
      const incomplete = await userscriptInstall.inspectAndAllowNativeManagerPermission(
        cdp,
        root,
        output,
        profile,
        'chrome',
        ask,
        'owned',
        context,
        run
      );
      expect(incomplete.action).toEqual({ status: 'skipped', reason: 'prompt-scope-depth-cap' });
      expect(run).toHaveBeenCalledOnce();
      run.mockClear();
      promptReceipt = nativePrompt();
      const invoked = await userscriptInstall.inspectAndAllowNativeManagerPermission(
        cdp,
        root,
        output,
        profile,
        'chrome',
        ask,
        'owned',
        context,
        run
      );
      expect(invoked.action.status).toBe('invoked');
      expect(run).toHaveBeenCalledTimes(2);
      expect(run.mock.calls[1]?.[1]).toEqual(
        expect.arrayContaining([
          '-InvokeAllow',
          '-ExpectedCreationUtcTicks',
          '639271195545735820',
          '-ExpectedSessionId',
          '2',
          '-ExpectedForegroundHandle',
          '8259362',
        ])
      );
      expect(cdp.send).toHaveBeenCalledWith('SystemInfo.getProcessInfo');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps native permission evidence UIA-only and bound to the browser process', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../../../validation/windows/manager-permission-window.ps1'),
      'utf8'
    );
    expect(source).not.toMatch(
      /CopyFromScreen|PrintWindow|BitBlt|System\.Drawing|GetWindowRect|SendInput|SetForegroundWindow/u
    );
    expect(source).toContain("screenshot = 'not-captured'");
    expect(source).toContain('@($child, ($depth + 1))');
    for (const proof of [
      'browserPid =',
      'creationUtcTicks =',
      'browserSessionId =',
      'foregroundHandle =',
      'foregroundOwnedAndVisible =',
      'uiaRootProcessId =',
    ]) {
      expect(source).toContain(proof);
    }
  });

  it('keeps PowerShell 5.1 prompt labels ASCII-source and exact to observed ko-KR UIA', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../../../validation/windows/manager-permission-window.ps1')
    );
    expect(source.every((byte) => byte < 128)).toBe(true);
    const codePoints = (name: string) => {
      const script = source.toString('ascii');
      const start = script.indexOf(`$script:${name} =`);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = script.indexOf('))', start);
      expect(end).toBeGreaterThan(start);
      return String.fromCharCode(
        ...[...script.slice(start, end).matchAll(/0x[0-9A-F]{4}/gu)].map(([hex]) => Number(hex))
      );
    };
    expect(`'Tampermonkey'${codePoints('PermissionTitle')}`).toBe(
      "'Tampermonkey'이(가) 추가 승인을 요청했습니다."
    );
    expect(codePoints('PriorPermissionsLabel')).toBe('이전에 가능했던 대상:');
    expect(codePoints('DownloadsPermissionLabel')).toBe('다운로드 관리');
    expect(codePoints('AllowButtonLabel')).toBe('허용');
    expect(codePoints('DenyButtonLabel')).toBe('거부');
  });

  it('collects read-only UIA diagnostics only with one CDP browser PID and an owned profile', async () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-native-permission-'));
    const profile = join(root, 'xeg-userscript-install-owned');
    const output = join(root, 'output');
    mkdirSync(profile);
    mkdirSync(output);
    const run = vi.fn(async (_file: string, _args: string[], _options: unknown) => {
      writeFileSync(
        join(output, 'userscript-manager-native-permission.json'),
        JSON.stringify({
          status: 'skipped',
          reason: 'owned-window-not-foreground',
          capture: 'uia-only',
          screenshot: 'not-captured',
          permissionGrantAttempted: false,
        })
      );
    });
    try {
      expect(
        userscriptInstall.browserProcessId({
          processInfo: [
            { type: 'browser', id: 42 },
            { type: 'renderer', id: 43 },
          ],
        })
      ).toBe(42);
      for (const processInfo of [
        { processInfo: [] },
        {
          processInfo: [
            { type: 'browser', id: 42 },
            { type: 'browser', id: 43 },
          ],
        },
        { processInfo: [{ type: 'browser', id: '42' }] },
      ]) {
        expect(userscriptInstall.browserProcessId(processInfo)).toBeNull();
      }
      const cdp = {
        send: vi.fn(async () => ({
          processInfo: [
            { type: 'browser', id: 42 },
            { type: 'renderer', id: 43 },
          ],
        })),
      };
      await expect(
        userscriptInstall.captureNativeManagerPermission(cdp, root, output, profile, 'chrome', run)
      ).resolves.toEqual({ status: 'skipped', reason: 'owned-window-not-foreground' });
      expect(cdp.send).toHaveBeenCalledWith('SystemInfo.getProcessInfo');
      expect(run).toHaveBeenCalledOnce();
      expect(run.mock.calls[0]?.[0]).toBe('powershell.exe');
      expect(run.mock.calls[0]?.[1]).toEqual(
        expect.arrayContaining(['-BrowserPid', '42', '-BrowserName', 'chrome', '-Profile', profile])
      );
      run.mockClear();
      await expect(
        userscriptInstall.captureNativeManagerPermission(
          { send: async () => ({ processInfo: [] }) },
          root,
          output,
          profile,
          'chrome',
          run
        )
      ).resolves.toEqual({ status: 'unavailable', reason: 'AssertionError' });
      expect(run).not.toHaveBeenCalled();
      await expect(
        userscriptInstall.captureNativeManagerPermission(
          cdp,
          root,
          output,
          join(root, 'unowned'),
          'chrome',
          run
        )
      ).resolves.toEqual({ status: 'unavailable', reason: 'AssertionError' });
      expect(run).not.toHaveBeenCalled();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('checks the actual manager userScripts API and uses the browser-specific details URL', async () => {
    expect(userscriptInstall.managerDetailsUrl('msedge', 'manager-id')).toBe(
      'edge://extensions/?id=manager-id'
    );
    expect(userscriptInstall.managerDetailsUrl('chrome', 'manager-id')).toBe(
      'chrome://extensions/?id=manager-id'
    );
    const page = { evaluate: async (callback: () => Promise<unknown>) => callback() };
    try {
      vi.stubGlobal('chrome', { userScripts: { getScripts: async () => ['private-script'] } });
      expect(await userscriptInstall.probeManagerUserScripts(page)).toEqual({
        available: true,
        registeredScriptCount: 1,
      });
      vi.stubGlobal('chrome', {
        userScripts: {
          getScripts: async () => {
            throw new DOMException('denied', 'NotAllowedError');
          },
        },
      });
      expect(await userscriptInstall.probeManagerUserScripts(page)).toEqual({
        available: false,
        errorType: 'NotAllowedError',
      });
      vi.stubGlobal('chrome', {});
      expect(await userscriptInstall.probeManagerUserScripts(page)).toEqual({
        available: false,
        errorType: 'TypeError',
      });
      expect(
        await userscriptInstall.probeManagerUserScripts({
          evaluate: async () => {
            throw new Error('extension page unavailable');
          },
        })
      ).toEqual({ available: false, errorType: 'PageEvaluationError' });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('targets the observed Edge switch inside the exact owned labeled row', async () => {
    const id = 'a'.repeat(32);
    const control = {
      count: async () => 1,
      isVisible: async () => true,
      waitFor: vi.fn(async () => {}),
    };
    const row = {
      count: async () => 1,
      locator: vi.fn((selector: string) => {
        expect(selector).toBe('fluent-switch#checkbox-1');
        return control;
      }),
    };
    const section = {
      count: async () => 1,
      waitFor: vi.fn(async () => {}),
      evaluate: async (callback: (element: { id: string }, id: string) => boolean, id: string) =>
        callback({ id }, id),
      locator: vi.fn((selector: string) => {
        expect(selector).toBe('standard-row');
        return {
          filter: ({ has }: { has: unknown }) => {
            expect(has).toBe('known-label');
            return row;
          },
        };
      }),
    };
    const page = {
      url: () => userscriptInstall.managerDetailsUrl('msedge', id),
      locator: vi.fn((selector: string) => {
        expect(selector).toBe('access-section');
        return {
          filter: ({ has }: { has: unknown }) => {
            expect(has).toBe('known-label');
            return section;
          },
        };
      }),
      getByText: vi.fn((name: RegExp) => {
        expect(name.test('사용자 스크립트 허용')).toBe(true);
        expect(name.test('Allow user scripts')).toBe(true);
        expect(name.test('InPrivate에서 허용')).toBe(false);
        return 'known-label';
      }),
    };
    await expect(userscriptInstall.findEdgeUserScriptsControl(page, id)).resolves.toBe(control);
    expect(section.waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 10_000 });
    expect(control.waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 10_000 });
    expect(page.locator).toHaveBeenCalledTimes(1);
    await expect(
      userscriptInstall.findEdgeUserScriptsControl(
        { ...page, url: () => userscriptInstall.managerDetailsUrl('msedge', 'b'.repeat(32)) },
        id
      )
    ).rejects.toThrow('owned extension details');
    await expect(
      userscriptInstall.findEdgeUserScriptsControl(
        { ...page, locator: () => ({ filter: () => ({ ...section, count: async () => 2 }) }) },
        id
      )
    ).rejects.toThrow('one owned Edge access section');
    const missingRowSection = {
      ...section,
      locator: () => ({ filter: () => ({ ...row, count: async () => 0 }) }),
    };
    await expect(
      userscriptInstall.findEdgeUserScriptsControl(
        { ...page, locator: () => ({ filter: () => missingRowSection }) },
        id
      )
    ).rejects.toThrow('one labeled Edge user-scripts row');
  });

  it('accepts only the observed Chrome user-scripts label in English or Korean', () => {
    expect(
      userscriptInstall.hasKnownChromeUserScriptsLabel(
        '사용자 스크립트 허용\n이 확장 프로그램은 검토되지 않은 코드를 실행할 수 있습니다.'
      )
    ).toBe(true);
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel('Allow user scripts')).toBe(true);
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel('InPrivate에서 허용')).toBe(false);
    expect(userscriptInstall.hasKnownChromeUserScriptsLabel('Not Allow user scripts')).toBe(false);
  });

  it('records only bounded fixture-media network metadata', () => {
    const context = new EventEmitter();
    const watcher = userscriptInstall.watchFixtureMediaNetwork(context);
    const request = (url: string) => ({
      url: () => url,
      method: () => 'GET',
      resourceType: () => 'fetch',
    });
    const owned = request('https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?name=orig&private=secret');
    context.emit(
      'request',
      request('https://pbs.twimg.com/profile_images/123456789/public-avatar.jpg')
    );
    context.emit('request', request('https://other.example/media/GkE1234ABCDEF.jpg'));
    context.emit('request', owned);
    context.emit('response', { request: () => owned, status: () => 200 });
    context.emit('requestfailed', owned);
    expect(watcher.events).toEqual([
      {
        kind: 'request',
        cohort: 'normal',
        index: 0,
        method: 'GET',
        resourceType: 'fetch',
        status: null,
      },
      {
        kind: 'response',
        cohort: 'normal',
        index: 0,
        method: 'GET',
        resourceType: 'fetch',
        status: 200,
      },
      {
        kind: 'requestfailed',
        cohort: 'normal',
        index: 0,
        method: 'GET',
        resourceType: 'fetch',
        status: null,
      },
    ]);
    expect(JSON.stringify(watcher.events)).not.toContain('secret');
    watcher.dispose();
    context.emit('request', owned);
    expect(watcher.events).toHaveLength(3);
  });

  it('keeps permission-diagnostic frame URLs on owned origins without query tokens', () => {
    expect(
      userscriptInstall.summarizeManagerFrameUrl(
        'edge://extensions/?id=owned&secret=ignored',
        'owned'
      )
    ).toBe('edge://extensions/');
    expect(
      userscriptInstall.summarizeManagerFrameUrl(
        'chrome-extension://owned/options.html?token=ignored#part',
        'owned'
      )
    ).toBe('chrome-extension://owned/options.html');
    expect(
      userscriptInstall.summarizeManagerFrameUrl(
        'chrome-extension://other/options.html?token=ignored',
        'owned'
      )
    ).toBeNull();
    expect(
      userscriptInstall.summarizeManagerFrameUrl(
        'https://private.example/path?token=ignored',
        'owned'
      )
    ).toBeNull();
    expect(userscriptInstall.summarizeManagerFrameUrl('about:blank', 'owned')).toBeNull();
  });

  it('admits diagnostic DOM reads only on the exact owned details route or manager origin', () => {
    const details = 'edge://extensions/?id=owned';
    expect(userscriptInstall.isOwnedManagerDetailsUrl(details, details)).toBe(true);
    expect(userscriptInstall.isOwnedManagerInspectionUrl(details, details, 'owned')).toBe(true);
    expect(
      userscriptInstall.isOwnedManagerInspectionUrl(
        'chrome-extension://owned/options.html',
        details,
        'owned'
      )
    ).toBe(true);
    expect(
      userscriptInstall.isOwnedManagerInspectionUrl(
        'chrome-extension://other/options.html',
        details,
        'other'
      )
    ).toBe(false);
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
    for (const value of [
      'about:blank',
      'https://x.com/',
      'chrome-extension://other/options.html',
      'chrome-extension://owned/ask.html',
      'chrome-extension://owned/options.html?token=private',
    ]) {
      expect(userscriptInstall.isOwnedManagerOptionsUrl(value, 'owned')).toBe(false);
    }
    const messages: Record<string, string> = {
      Utilities: '도구',
      Install: '설치',
      Installed_userscripts: '설치된 유저 스크립트',
    };
    const page = {
      url: () => optionsUrl,
      evaluate: async (callback: (id: string) => unknown, id: string) => callback(id),
    };
    try {
      vi.stubGlobal('location', { href: optionsUrl });
      vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => messages[key] ?? '' } });
      expect(await userscriptInstall.readManagerUiLabels(page, 'owned')).toEqual({
        utilities: '도구',
        install: '설치',
        installedUserscripts: '설치된 유저 스크립트',
      });
      expect(
        userscriptInstall.requireManagerUiLabels({
          utilities: 'Utilities',
          install: 'Install',
          installedUserscripts: 'Installed Userscripts',
        })
      ).toMatchObject({ utilities: 'Utilities' });
      expect(() =>
        userscriptInstall.requireManagerUiLabels({
          utilities: 'x'.repeat(81),
          install: 'Install',
          installedUserscripts: 'Installed Userscripts',
        })
      ).toThrow('invalid UI label');
      expect(() =>
        userscriptInstall.requireManagerUiLabels({
          utilities: 'Utilities\nother',
          install: 'Install',
          installedUserscripts: 'Installed Userscripts',
        })
      ).toThrow('invalid UI label');
      await expect(
        userscriptInstall.readManagerUiLabels(
          { ...page, url: () => 'chrome-extension://other/options.html' },
          'owned'
        )
      ).rejects.toThrow('owned options page');
      vi.stubGlobal('location', { href: 'https://private.example/' });
      await expect(userscriptInstall.readManagerUiLabels(page, 'owned')).rejects.toThrow(
        'navigated away'
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('accepts only an owned Tampermonkey permission ask page with its aid', () => {
    expect(
      userscriptInstall.isOwnedManagerPermissionAskUrl(
        'chrome-extension://owned/ask.html?aid=opaque',
        'owned'
      )
    ).toBe(true);
    for (const url of [
      'chrome-extension://other/ask.html?aid=opaque',
      'chrome-extension://owned/ask.html',
      'chrome-extension://owned/ask.html?aid=opaque&next=x',
      'chrome-extension://owned/options.html?aid=opaque',
      'chrome-extension://owned/ask.html?aid=opaque#fragment',
    ]) {
      expect(userscriptInstall.isOwnedManagerPermissionAskUrl(url, 'owned')).toBe(false);
    }
  });

  it('does not persist or confirm an ask screenshot after navigation escapes the manager', async () => {
    const output = mkdtempSync(join(tmpdir(), 'xeg-manager-ask-'));
    let url = 'chrome-extension://owned/ask.html?aid=opaque';
    const click = vi.fn(async () => {});
    const ask = {
      url: () => url,
      screenshot: async () => {
        url = 'https://other.example/private';
        return Buffer.from('external-page');
      },
      getByRole: () => ({ click }),
    };
    try {
      await expect(
        userscriptInstall.captureAndConfirmManagerPermissionAsk(ask, 'owned', output, 'Ok')
      ).rejects.toThrow('navigated away during capture');
      expect(existsSync(join(output, 'userscript-manager-download-permission.png'))).toBe(false);
      expect(click).not.toHaveBeenCalled();
    } finally {
      rmSync(output, { recursive: true, force: true });
    }
  });

  it('reads the optional manager downloads permission only on its owned options page', async () => {
    const optionsUrl = 'chrome-extension://owned/options.html';
    const page = {
      url: () => optionsUrl,
      evaluate: async (callback: (id: string) => Promise<boolean>, id: string) => callback(id),
    };
    try {
      vi.stubGlobal('location', { href: optionsUrl });
      const contains = vi.fn(async () => false);
      vi.stubGlobal('chrome', { permissions: { contains } });
      await expect(userscriptInstall.probeManagerDownloadsPermission(page, 'owned')).resolves.toBe(
        false
      );
      expect(contains).toHaveBeenCalledWith({ permissions: ['downloads'] });
      await expect(
        userscriptInstall.probeManagerDownloadsPermission(
          { ...page, url: () => 'chrome-extension://other/options.html' },
          'owned'
        )
      ).rejects.toThrow('owned options page');
      vi.stubGlobal('location', { href: 'https://private.example/' });
      await expect(
        userscriptInstall.probeManagerDownloadsPermission(page, 'owned')
      ).rejects.toThrow('navigated away');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('sets only the owned manager General LogLevel row to Info and verifies persistence', async () => {
    const managerId = 'a'.repeat(32);
    const optionsUrl = `chrome-extension://${managerId}/options.html`;
    const labels: Record<string, string> = {
      Settings: 'Settings',
      General: 'General',
      LogLevel: 'Log level',
      Info: 'Info',
    };
    let currentUrl = optionsUrl;
    let selected = '0';
    let saved = '0';
    let persist = true;
    let sectionCount = 1;
    const infoOption = { count: async () => 1, innerText: async () => labels.Info };
    const selectOption = vi.fn(async (option: { label: string }) => {
      expect(option).toEqual({ label: labels.Info });
      selected = '60';
      if (persist) {
        saved = '60';
      }
    });
    const select = {
      count: async () => 1,
      inputValue: async () => selected,
      locator: (query: string) => {
        expect(query).toBe('option[value="60"]');
        return infoOption;
      },
      selectOption,
    };
    const row = {
      waitFor: async () => undefined,
      count: async () => 1,
      locator: (query: string) => {
        expect(query).toBe('select');
        return select;
      },
    };
    const general = {
      waitFor: async () => undefined,
      count: async () => sectionCount,
      locator: (query: string) => {
        expect(query).toBe('.section_head');
        return { innerText: async () => labels.General };
      },
      getByText: (label: string, options: { exact: boolean }) => {
        expect([label, options]).toEqual(['Log level:', { exact: true }]);
        return {
          locator: (query: string) => {
            expect(query).toMatch(/^xpath=ancestor::tr\[/u);
            return row;
          },
        };
      },
    };
    const page = {
      url: () => currentUrl,
      evaluate: async (callback: (id: string) => unknown, id: string) => callback(id),
      getByText: (label: string, options: { exact: boolean }) => {
        expect([label, options]).toEqual([labels.Settings, { exact: true }]);
        return { first: () => ({ click: async () => undefined }) };
      },
      locator: (query: string) => {
        expect(query).toBe('div.section.type_general');
        return general;
      },
      reload: async () => {
        selected = saved;
      },
    };
    try {
      vi.stubGlobal('location', { href: optionsUrl });
      vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => labels[key] } });
      await expect(userscriptInstall.configureManagerInfoLogging(page, managerId)).resolves.toEqual(
        { original: '0', requested: '60', observed: '60', scope: 'fresh-owned-profile' }
      );
      expect(selectOption).toHaveBeenCalledOnce();
      currentUrl = 'chrome-extension://other/options.html';
      await expect(userscriptInstall.configureManagerInfoLogging(page, managerId)).rejects.toThrow(
        'owned options page'
      );
      expect(selectOption).toHaveBeenCalledOnce();
      currentUrl = optionsUrl;
      sectionCount = 2;
      await expect(userscriptInstall.configureManagerInfoLogging(page, managerId)).rejects.toThrow(
        'exactly one manager General section'
      );
      expect(selectOption).toHaveBeenCalledOnce();
      sectionCount = 1;
      selected = saved = '0';
      persist = false;
      await expect(userscriptInstall.configureManagerInfoLogging(page, managerId)).rejects.toThrow(
        'Info logging did not persist'
      );
      expect(selectOption).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('classifies only known manager download branches without retaining console data', () => {
    const id = 'a'.repeat(32);
    const managerUrl = `chrome-extension://${id}/background.js`;
    const context = new EventEmitter() as EventEmitter & { serviceWorkers(): EventEmitter[] };
    const worker = new EventEmitter() as EventEmitter & { url(): string };
    worker.url = () => managerUrl;
    context.serviceWorkers = () => [worker];
    const watcher = userscriptInstall.watchManagerDownloadConsole(context, id);
    try {
      const before = watcher.mark();
      worker.emit('console', { text: () => 'downs: start https://secret.example/?token=abc' });
      worker.emit('console', {
        text: () =>
          'downs: download of secret.jpg (https://secret.example/?token=abc) failed NETWORK_FAILED',
      });
      worker.emit('console', { text: () => 'downs: download permission is missing' });
      worker.emit('console', { text: () => 'downs: feature is not enabled' });
      worker.emit('console', { text: () => 'downs: permission to use downloads -> true' });
      worker.emit('console', { text: () => 'downs: permission to use downloads -> false' });
      const receipt = watcher.snapshotSince(before);
      expect(receipt).toMatchObject({
        status: 'known-branch-observed',
        matchedEvents: 6,
        availability: 'attached-before-click',
        branchCounts: {
          native_interrupted_branch: 1,
          not_permitted_branch: 1,
          permission_true: 1,
          permission_false: 1,
          manager_request_branch: 1,
          not_enabled_branch: 1,
        },
        workersAttachedBeforeClick: 1,
        workersAttachedAfterClick: 1,
        attachmentOverflow: false,
        messageOverflow: false,
        eventOverflow: false,
      });
      expect(JSON.stringify(receipt)).not.toMatch(/secret|token|NETWORK_FAILED|https?:/u);
      expect(
        userscriptInstall.classifyManagerDownloadConsole(
          'downs: permission to use downloads -> true'
        )
      ).toBe('permission_true');
      expect(
        userscriptInstall.classifyManagerDownloadConsole(
          'downs: permission to use downloads -> false'
        )
      ).toBe('permission_false');
      expect(
        userscriptInstall.classifyManagerDownloadConsole(
          'downs: permission to use downloads -> private'
        )
      ).toBeNull();
      expect(userscriptInstall.classifyManagerDownloadConsole('downs: download failed')).toBe(
        'download_failed_branch'
      );
      expect(
        userscriptInstall.classifyManagerDownloadConsole('downs: "private" is not whitelisted')
      ).toBe('not_whitelisted_branch');
      expect(
        userscriptInstall.classifyManagerDownloadConsole('downs: unable to query download ID 123')
      ).toBe('native_query_failed_branch');
      expect(
        userscriptInstall.classifyManagerDownloadConsole(
          'downs: this download mode is not supported'
        )
      ).toBe('not_supported_branch');
      expect(userscriptInstall.classifyManagerDownloadConsole('downs: start private')).toBe(
        'manager_request_branch'
      );
      expect(
        userscriptInstall.classifyManagerDownloadConsole('downs: unrelated private')
      ).toBeNull();
    } finally {
      watcher.dispose();
    }
    expect(context.listenerCount('serviceworker')).toBe(0);
    expect(worker.listenerCount('console')).toBe(0);
    expect(worker.listenerCount('close')).toBe(0);
  });

  it('follows only the exact manager service worker across restarts and bounds events', () => {
    const id = 'b'.repeat(32);
    const ownedUrl = `chrome-extension://${id}/background.js`;
    const context = new EventEmitter() as EventEmitter & { serviceWorkers(): EventEmitter[] };
    context.serviceWorkers = () => [];
    const worker = (url: string) => Object.assign(new EventEmitter(), { url: () => url });
    const foreign = worker(`chrome-extension://${'c'.repeat(32)}/background.js`);
    const first = worker(ownedUrl);
    const second = worker(ownedUrl);
    const watcher = userscriptInstall.watchManagerDownloadConsole(context, id);
    try {
      const before = watcher.mark();
      context.emit('serviceworker', foreign);
      foreign.emit('console', { text: () => 'downs: download failed' });
      context.emit('serviceworker', first);
      first.emit('console', { text: () => 'downs: download failed' });
      first.emit('close');
      context.emit('serviceworker', second);
      for (let i = 0; i < 20; i++) {
        second.emit('console', { text: () => 'downs: download failed' });
      }
      expect(watcher.snapshotSince(before)).toMatchObject({
        status: 'known-branch-observed',
        matchedEvents: 16,
        availability: 'attached-after-click',
        branchCounts: { download_failed_branch: 16 },
        workersAttachedBeforeClick: 0,
        workersAttachedAfterClick: 2,
        eventOverflow: true,
      });
      expect(first.listenerCount('console')).toBe(0);
    } finally {
      watcher.dispose();
    }
    expect(context.listenerCount('serviceworker')).toBe(0);
    expect(second.listenerCount('console')).toBe(0);
    expect(second.listenerCount('close')).toBe(0);
    expect(foreign.listenerCount('console')).toBe(0);
  });

  it('reports silent and capped manager console observation as inconclusive', () => {
    const id = 'd'.repeat(32);
    const context = new EventEmitter() as EventEmitter & { serviceWorkers(): EventEmitter[] };
    context.serviceWorkers = () => [];
    const watcher = userscriptInstall.watchManagerDownloadConsole(context, id);
    const workers = Array.from({ length: 9 }, () =>
      Object.assign(new EventEmitter(), { url: () => `chrome-extension://${id}/background.js` })
    );
    try {
      const before = watcher.mark();
      expect(watcher.snapshotSince(before)).toMatchObject({
        status: 'inconclusive',
        availability: 'no-worker-observed',
        matchedEvents: 0,
      });
      for (const worker of workers) {
        context.emit('serviceworker', worker);
      }
      for (let i = 0; i < 260; i++) {
        workers[0]?.emit('console', { text: () => 'downs: unrelated private' });
      }
      expect(watcher.snapshotSince(before)).toMatchObject({
        status: 'inconclusive',
        availability: 'attached-after-click',
        matchedEvents: 0,
        workersAttachedAfterClick: 8,
        attachmentOverflow: true,
        messageOverflow: true,
      });
      expect(workers[8]?.listenerCount('console')).toBe(0);
    } finally {
      watcher.dispose();
    }
    expect(context.listenerCount('serviceworker')).toBe(0);
    expect(workers.every((worker) => worker.listenerCount('console') === 0)).toBe(true);
  });

  it('limits manager history to the exact first fixture request and redacts native fields', async () => {
    const fixtureUrl = 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
    const expectedName = 'testuser_1234567890123456789_0.jpg';
    const expectedPath = `C:\\owned\\${expectedName}`;
    const search = vi.fn(async () => [
      {
        id: 11,
        url: fixtureUrl,
        filename: expectedPath,
        fileSize: 4237,
        state: 'interrupted',
        error: 'NETWORK_FAILED',
        finalUrl: 'https://secret.example/',
        byExtensionId: 'secret-id',
        referrer: 'https://private.example/',
      },
      {
        id: 12,
        url: `${fixtureUrl}&other=1`,
        filename: 'C:\\private\\file.jpg',
        state: 'complete',
      },
    ]);
    vi.stubGlobal('location', { href: 'chrome-extension://manager/options.html' });
    vi.stubGlobal('chrome', { downloads: { search } });
    try {
      const observation = await userscriptInstall.inspectManagerDownloadHistoryDocument({
        managerId: 'manager',
        fixtureUrl,
        expectedName,
        expectedPath,
        expectedBytes: 4237,
      });
      expect(search).toHaveBeenCalledWith({ url: fixtureUrl, limit: 9 });
      expect(observation).toEqual({
        status: 'observed',
        items: [
          {
            id: 11,
            state: 'interrupted',
            interruptReason: 'NETWORK_FAILED',
            requestedNameMatch: true,
            ownedPathMatch: true,
            expectedSizeMatch: true,
            fixtureUrlMatch: true,
          },
        ],
      });
      expect(JSON.stringify(observation)).not.toMatch(
        /private|secret|chrome-extension|pbs\.twimg/u
      );
      expect(
        userscriptInstall.firstCurrentManagerDownloadHistory(
          { status: 'observed', items: [] },
          observation
        )
      ).toMatchObject({
        status: 'observed',
        items: [{ id: 11 }],
      });
      expect(
        userscriptInstall.firstCurrentManagerDownloadHistory(observation, observation)
      ).toMatchObject({ status: 'observed', items: [] });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('records only an exact owned native redirect destination match', async () => {
    const fixtureUrl = 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
    vi.stubGlobal('location', { href: 'chrome-extension://manager/options.html' });
    vi.stubGlobal('chrome', {
      downloads: {
        search: vi.fn(async () => [
          {
            id: 17,
            url: fixtureUrl,
            finalUrl: 'https://pbs.twimg.com/media/xeg-owned-redirect-final.jpg',
            filename: 'C:\\owned\\first.jpg',
            fileSize: 5,
            state: 'complete',
          },
        ]),
      },
    });
    try {
      const observation = await userscriptInstall.inspectManagerDownloadHistoryDocument({
        managerId: 'manager',
        fixtureUrl,
        expectedName: 'first.jpg',
        expectedPath: 'C:\\owned\\first.jpg',
        expectedBytes: 5,
      });
      expect(observation.items).toMatchObject([{ declaredRedirectFinalUrlMatch: true }]);
      expect(JSON.stringify(observation)).not.toContain('pbs.twimg.com');
      expect(
        userscriptInstall.selectCompletedManagerDownload(
          { status: 'observed', items: [] },
          observation
        )
      ).toMatchObject({ declaredRedirectFinalUrlMatch: true });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('marks incomplete or ambiguous manager history unknown without leaking items', async () => {
    const args = {
      managerId: 'manager',
      fixtureUrl: 'https://pbs.twimg.com/media/first.jpg',
      expectedName: 'first.jpg',
      expectedPath: 'C:\\owned\\first.jpg',
      expectedBytes: 5,
    };
    vi.stubGlobal('location', { href: 'chrome-extension://manager/options.html' });
    vi.stubGlobal('chrome', {
      downloads: {
        search: vi.fn(async () =>
          Array.from({ length: 9 }, (_, id) => ({
            id,
            url: args.fixtureUrl,
            state: 'complete',
            filename: 'first.jpg',
          }))
        ),
      },
    });
    try {
      const overflow = await userscriptInstall.inspectManagerDownloadHistoryDocument(args);
      expect(overflow).toEqual({ status: 'overflow', items: [] });
      expect(
        userscriptInstall.firstCurrentManagerDownloadHistory(
          { status: 'observed', items: [] },
          overflow
        )
      ).toEqual({
        status: 'unknown',
        baselineStatus: 'observed',
        queryStatus: 'overflow',
        items: [],
      });
      expect(
        userscriptInstall.firstCurrentManagerDownloadHistory(
          { status: 'observed', items: [] },
          { status: 'observed', items: [{ id: 1 }, { id: 2 }] }
        )
      ).toEqual({ status: 'ambiguous', baselineCount: 0, items: [] });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('requires one fresh complete native item with exact owned filename, path, and size', () => {
    const valid = {
      id: 2,
      state: 'complete',
      interruptReason: null,
      fixtureUrlMatch: true,
      requestedNameMatch: true,
      ownedPathMatch: true,
      expectedSizeMatch: true,
    };
    const baseline = { status: 'observed', items: [{ ...valid, id: 1 }] };
    const observationWithItems = (items: unknown[]) => ({ status: 'observed', items });
    expect(
      userscriptInstall.selectCompletedManagerDownload(
        baseline,
        observationWithItems([{ ...valid, id: 1 }])
      )
    ).toBeUndefined();
    expect(
      userscriptInstall.selectCompletedManagerDownload(
        baseline,
        observationWithItems([
          { ...valid, id: 1 },
          { ...valid, state: 'in_progress' },
        ])
      )
    ).toBeUndefined();
    expect(
      userscriptInstall.selectCompletedManagerDownload(
        baseline,
        observationWithItems([{ ...valid, id: 1 }, valid])
      )
    ).toEqual({
      nativeId: 2,
      nativeState: 'complete',
      completionSource: 'chrome.downloads.search',
    });
    expect(() =>
      userscriptInstall.selectCompletedManagerDownload(
        baseline,
        observationWithItems([{ ...valid, id: 1 }, valid, { ...valid, id: 3 }])
      )
    ).toThrow(/multiple/u);
    for (const changed of [
      { requestedNameMatch: false },
      { ownedPathMatch: false },
      { expectedSizeMatch: false },
      { fixtureUrlMatch: false },
      { state: 'interrupted', interruptReason: 'NETWORK_FAILED' },
    ]) {
      expect(() =>
        userscriptInstall.selectCompletedManagerDownload(
          baseline,
          observationWithItems([
            { ...valid, id: 1 },
            { ...valid, ...changed },
          ])
        )
      ).toThrow();
    }
    expect(() =>
      userscriptInstall.selectCompletedManagerDownload(baseline, { status: 'overflow', items: [] })
    ).toThrow(/unavailable/u);
  });

  it('projects exact native path and size matches without returning private fields', async () => {
    const fixtureUrl = 'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=orig';
    const expectedName = 'first (1).jpg';
    const expectedPath = `C:\\owned\\${expectedName}`;
    vi.stubGlobal('location', { href: 'chrome-extension://manager/options.html' });
    vi.stubGlobal('chrome', {
      downloads: {
        search: vi.fn(async () => [
          {
            id: 1,
            url: fixtureUrl,
            filename: 'C:\\other\\first (1).jpg',
            fileSize: 5,
            state: 'complete',
            byExtensionId: 'private-extension',
          },
          { id: 2, url: fixtureUrl, filename: expectedPath, fileSize: 4, state: 'complete' },
        ]),
      },
    });
    try {
      const result = await userscriptInstall.inspectManagerDownloadHistoryDocument({
        managerId: 'manager',
        fixtureUrl,
        expectedName,
        expectedPath,
        expectedBytes: 5,
      });
      expect(result.items).toMatchObject([
        { id: 1, requestedNameMatch: true, ownedPathMatch: false, expectedSizeMatch: true },
        { id: 2, requestedNameMatch: true, ownedPathMatch: true, expectedSizeMatch: false },
      ]);
      expect(JSON.stringify(result)).not.toMatch(/C:\\\\|private-extension|pbs\.twimg/u);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('binds native completion to the browser download GUID without manager privileges', async () => {
    const cdp = Object.assign(new EventEmitter(), { send: vi.fn(async () => ({})) });
    const observer = userscriptInstall.createBrowserDownloadObserver(cdp);
    const since = observer.snapshot();
    cdp.emit('Browser.downloadWillBegin', {
      guid: 'owned-download',
      suggestedFilename: 'image.jpg',
      url: 'blob:https://x.com/owned',
    });
    cdp.emit('Browser.downloadProgress', {
      guid: 'owned-download',
      state: 'completed',
      receivedBytes: 5,
      totalBytes: 5,
    });
    await expect(observer.waitForCompletion(since, 'image.jpg')).resolves.toMatchObject({
      guid: 'owned-download',
      state: 'completed',
      receivedBytes: 5,
    });
    await expect(
      observer.assertNoneSince(observer.snapshot(), 'cancelled action')
    ).resolves.toBeUndefined();
    expect(observer.events()).toEqual([
      {
        guid: 'owned-download',
        suggestedFilename: 'image.jpg',
        source: { scheme: 'blob:', origin: 'https://x.com' },
      },
    ]);
    expect(cdp.send).toHaveBeenCalledWith('Browser.getVersion');
    observer.dispose();
    expect(cdp.listenerCount('Browser.downloadWillBegin')).toBe(0);
    expect(cdp.listenerCount('Browser.downloadProgress')).toBe(0);
  });

  it('requires a page-origin Blob URL for a ZIP save', () => {
    expect(userscriptInstall.requirePageBlobZipSource('blob:https://x.com/owned')).toEqual({
      scheme: 'blob:',
      origin: 'https://x.com',
    });
    expect(() =>
      userscriptInstall.requirePageBlobZipSource('blob:https://other.example/owned')
    ).toThrow('page-origin Blob URL');
    expect(() => userscriptInstall.requirePageBlobZipSource('https://x.com/archive.zip')).toThrow(
      'page-origin Blob URL'
    );
  });

  it('catches a native save dispatched after the routed response returns', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'xeg-late-native-save-'));
    const cdp = Object.assign(new EventEmitter(), { send: vi.fn(async () => ({})) });
    const observer = userscriptInstall.createBrowserDownloadObserver(cdp);
    const since = observer.snapshot();
    const lateEvent = setTimeout(
      () =>
        cdp.emit('Browser.downloadWillBegin', {
          guid: 'late-save',
          suggestedFilename: 'late.zip',
          url: 'blob:https://x.com/late',
        }),
      25
    );
    try {
      await expect(
        userscriptInstall.observeNoNativeDownload(
          observer,
          since,
          new Set(),
          directory,
          'late response',
          150
        )
      ).rejects.toThrow('created a native download');
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
      await expect(
        userscriptInstall.observeNoNativeDownload(
          observer,
          observer.snapshot(),
          new Set(),
          directory,
          'late response',
          150
        )
      ).rejects.toThrow('left a file');
    } finally {
      clearTimeout(lateFile);
      observer.dispose();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects a paused in-progress download after all bytes have arrived', () => {
    const download = {
      bytesReceived: 256 * 1024 * 1024,
      id: 7,
      paused: true,
      state: 'in_progress',
      totalBytes: 256 * 1024 * 1024,
    };
    expect(() => installProfile.assertDownloadIncomplete(download, 'before worker stop')).toThrow(
      /before worker stop.*bytesReceived.*268435456.*totalBytes.*268435456/u
    );
    expect(() =>
      installProfile.assertDownloadIncomplete(
        {
          ...download,
          bytesReceived: download.totalBytes - 1,
        },
        'before worker stop'
      )
    ).not.toThrow();
  });

  it('uses the visible Edge switch and its checked property, while keeping Chrome controls', async () => {
    for (const browserName of ['msedge', 'chrome']) {
      const visible = { checked: browserName === 'chrome', getAttribute: () => 'false' };
      const click = vi.fn(async () => {
        visible.checked = true;
      });
      const locator = vi.fn((selector: string) => {
        const expected = browserName === 'msedge' ? '#dev-switch:visible' : '#devMode';
        if (selector !== expected) {
          throw new Error('Selected a hidden or unsupported toggle');
        }
        return {
          waitFor: vi.fn(async () => {}),
          evaluate: async (read: (element: typeof visible) => boolean) => read(visible),
          click,
        };
      });
      const page = { goto: vi.fn(async () => {}), locator, close: vi.fn(async () => {}) };
      await installPreparation.enableDeveloperMode({ newPage: async () => page }, browserName);
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
    await expect(
      installPreparation.enableDeveloperMode({ newPage: async () => page }, 'msedge')
    ).rejects.toThrow('developer mode is disabled');
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
      launchPersistentContext: vi.fn(async (): Promise<never> => {
        throw new Error('browser launch reached');
      }),
    };
    try {
      // This temporary root deliberately has no native fixture certificate helper.
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
      ).rejects.toThrow('fixture-certificate-unavailable');
      const receipt = JSON.parse(readFileSync(join(output, 'installation-result.json'), 'utf8'));
      expect(receipt.liveObservation).toBeNull();
      expect(receipt.liveUrls).toEqual([]);
      expect(receipt.cleanup).toMatchObject({ profileRemoved: true, errorCount: 0 });
      expect(chromium.launchPersistentContext).not.toHaveBeenCalled();
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
    await expect(
      installProfile.run({
        browserName: 'chrome',
        chromium,
        headless: true,
        installation: 'userscript',
        liveUrls: ['https://x.com/a/status/1'],
        output: '/unused',
        root: '/unused',
      })
    ).rejects.toThrow('does not support public URLs');
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
    expect(profile.installation?.assets).toContain('validation/windows/live-page.ts');
    expect(profile.installation?.assets).toContain('validation/windows/live-page-document.ts');
    expect(profile.installation?.assets).toContain('validation/windows/install-preparation.ts');
    expect(profile.installation?.assets).toContain('validation/windows/userscript-install.ts');
    expect(profile.installation?.assets).toContain('validation/windows/userscript-document.ts');
    expect(profile.installation?.assets).toContain('dist/xcom-enhanced-gallery.user.js');
  });

  it('changes only the supported video click setting in a complete task-owned copy', () => {
    const prior = {
      __schemaHash: '1',
      version: '1',
      lastModified: 42,
      gallery: { theme: 'dark', videoClickMode: 'block-controls-only', preloadCount: 3 },
      toolbar: { autoHideDelay: 3000 },
      features: { gallery: true },
    };
    const controlled = livePage.createControlledVideoSettings(prior, 100);
    expect(controlled).toEqual({
      ...prior,
      gallery: { ...prior.gallery, videoClickMode: 'allow-all' },
    });
    expect(prior.gallery.videoClickMode).toBe('block-controls-only');
    expect(livePage.createControlledVideoSettings(null, 100)).toMatchObject({
      version: '1',
      lastModified: 100,
      __schemaHash: '1',
      gallery: { videoClickMode: 'allow-all' },
    });
  });

  it('restores raw settings through separate browser evaluations without touching other keys', async () => {
    const snapshots = [
      { exists: false, value: null },
      { exists: true, value: null },
      { exists: true, value: { gallery: { videoClickMode: 'allow-all' } } },
      { exists: true, value: '{"gallery":{"videoClickMode":"allow-all"}}' },
      { exists: true, value: { __xegStorageEnvelope: 1, updatedAt: 42, value: 'raw' } },
      { exists: true, value: ['raw', null] },
    ];
    for (const previous of snapshots) {
      const storage = new Map<string, unknown>([
        ['xeg-app-settings', 'changed'],
        ['unrelated', { retained: true }],
      ]);
      const operations: string[] = [];
      const local = {
        set: async (values: Record<string, unknown>) => {
          operations.push('set');
          for (const [key, value] of Object.entries(values)) {
            storage.set(key, value);
          }
        },
        remove: async (key: string) => {
          operations.push('remove');
          storage.delete(key);
        },
        get: async (key: string) => {
          operations.push('get');
          return storage.has(key) ? { [key]: storage.get(key) } : {};
        },
      };
      const page = {
        evaluate: async (callback: (...args: unknown[]) => unknown, argument: unknown) => {
          operations.push('evaluate');
          return runInNewContext(`(${callback.toString()})(argument)`, {
            argument: structuredClone(argument),
            chrome: { storage: { local } },
          }) as Promise<unknown>;
        },
      } as unknown as Page;
      expect(await livePage.restoreStoredVideoSettings(page, previous)).toBe(true);
      expect(operations).toEqual([
        'evaluate',
        previous.exists ? 'set' : 'remove',
        'evaluate',
        'get',
      ]);
      expect(storage.has('xeg-app-settings')).toBe(previous.exists);
      if (previous.exists) {
        expect(storage.get('xeg-app-settings')).toEqual(previous.value);
      }
      expect(storage.get('unrelated')).toEqual({ retained: true });
    }
  });

  it('returns false on readback mismatch and propagates write and read failures', async () => {
    const previous = { exists: true, value: { gallery: { videoClickMode: 'allow-all' } } };
    const run = async (stage: 'mismatch' | 'write' | 'read') => {
      const operations: string[] = [];
      const page = {
        evaluate: async (callback: (...args: unknown[]) => unknown, argument: unknown) => {
          operations.push('evaluate');
          const local = {
            set: async () => {
              operations.push('set');
              if (stage === 'write') {
                throw new Error('write failed');
              }
            },
            remove: async () => {
              throw new Error('unexpected remove');
            },
            get: async () => {
              operations.push('get');
              if (stage === 'read') {
                throw new Error('read failed');
              }
              return { 'xeg-app-settings': { different: true } };
            },
          };
          return runInNewContext(`(${callback.toString()})(argument)`, {
            argument: structuredClone(argument),
            chrome: { storage: { local } },
          }) as Promise<unknown>;
        },
      } as unknown as Page;
      return { result: livePage.restoreStoredVideoSettings(page, previous), operations };
    };
    const mismatch = await run('mismatch');
    await expect(mismatch.result).resolves.toBe(false);
    expect(mismatch.operations).toEqual(['evaluate', 'set', 'evaluate', 'get']);
    const write = await run('write');
    await expect(write.result).rejects.toThrow('write failed');
    expect(write.operations).toEqual(['evaluate', 'set']);
    const read = await run('read');
    await expect(read.result).rejects.toThrow('read failed');
    expect(read.operations).toEqual(['evaluate', 'set', 'evaluate', 'get']);
  });

  it('requires exact C API photo, selected index/source, and canonical owner path', () => {
    const photo = {
      id: '789',
      type: 'photo',
      poster: { host: 'pbs.twimg.com', path: '/media/c.png' },
      playableVariants: [],
    };
    const api = {
      tweetResultByRestId: { requests: 1, responses: [200] },
      observations: [
        {
          operation: 'TweetResultByRestId',
          requestedTweetId: '456',
          httpStatus: 200,
          providerErrors: false,
          result: { id: '456', media: [photo] },
          directQuote: null,
          nestedQuoteId: null,
        },
      ],
      overflow: 0,
    } as Parameters<LivePageModule['summarizeNativePreviewEvidence']>[0];
    const selected = {
      imageSource: { host: 'pbs.twimg.com', path: '/media/c.png' },
      itemIndex: 0,
      itemVisible: true,
      positionValue: 1,
    };
    const verify = (value = api, item = selected, owner = '/inner/status/456') =>
      livePage.summarizeNativePreviewEvidence(value, '456', 1, item, owner, '/inner/status/456');
    expect(verify()).toMatchObject({
      providerConfirmed: true,
      selectedConfirmed: true,
      ownerConfirmed: true,
      apiMediaIndex: 0,
      source: { path: '/media/c.png' },
    });
    expect(verify(api, { ...selected, itemIndex: 1 })).toMatchObject({ selectedConfirmed: false });
    expect(verify(api, { ...selected, itemVisible: false })).toMatchObject({
      selectedConfirmed: false,
    });
    expect(
      verify(api, { ...selected, imageSource: { host: 'pbs.twimg.com', path: '/media/b.png' } })
    ).toMatchObject({ selectedConfirmed: false });
    expect(verify(api, selected, '/inner/status/456/photo/1')).toMatchObject({
      ownerConfirmed: false,
    });
    expect(verify(api, selected, '/other/status/456')).toMatchObject({ ownerConfirmed: false });
    expect(
      verify({ ...api, observations: [...api.observations, api.observations[0]!] })
    ).toMatchObject({ providerConfirmed: false });
    expect(verify({ ...api, overflow: 1 })).toMatchObject({ providerConfirmed: false });
    expect(verify({ ...api, observations: [] })).toMatchObject({ providerConfirmed: false });
    expect(
      verify({ ...api, observations: [{ ...api.observations[0]!, httpStatus: 403, result: null }] })
    ).toMatchObject({
      providerConfirmed: false,
      providerRejection: { httpStatus: 403, requestedTweetId: '456' },
    });
    expect(
      verify({ ...api, observations: [{ ...api.observations[0]!, requestedTweetId: '123' }] })
    ).toMatchObject({ providerConfirmed: false });
    expect(
      verify({
        ...api,
        observations: [
          {
            operation: 'TweetResultByRestId',
            requestedTweetId: '123',
            httpStatus: 200,
            providerErrors: false,
            result: { id: '123', media: [] },
            directQuote: { id: '789', media: [] },
            nestedQuoteId: '456',
          },
        ],
      })
    ).toMatchObject({ providerConfirmed: false });
  });

  it('downgrades native preview success when final API or diagnostics arrive late', () => {
    const cResponse = {
      operation: 'TweetResultByRestId',
      requestedTweetId: '456',
      httpStatus: 200,
      providerErrors: false,
      result: {
        id: '456',
        media: [
          {
            id: '789',
            type: 'photo',
            poster: { host: 'pbs.twimg.com', path: '/media/c.png' },
            playableVariants: [],
          },
        ],
      },
      directQuote: null,
      nestedQuoteId: null,
    };
    const makeObservation = () =>
      ({
        target: {
          kind: 'native-preview-photo',
          ownerHandle: 'inner',
          ownerStatusId: '456',
          photoNumber: 1,
        },
        gallery: {
          opened: {
            selectedGallery: {
              imageSource: { host: 'pbs.twimg.com', path: '/media/c.png' },
              itemIndex: 0,
              itemVisible: true,
              positionValue: 1,
            },
          },
          ownerPath: '/inner/status/456',
        },
        api: {
          tweetResultByRestId: { requests: 1, responses: [200] },
          observations: [cResponse],
          overflow: 0,
        },
        requiredAssertions: {
          exactCProviderPhoto: true,
          selectedCPhoto: true,
          canonicalCOwner: true,
          noProductErrors: true,
          noPageErrors: true,
        },
        missingAssertions: [] as string[],
        productErrors: [] as unknown[],
        productErrorOverflow: 0,
        pageErrors: [] as unknown[],
        pageErrorOverflow: 0,
        hostDiagnostics: [] as unknown[],
        hostDiagnosticOverflow: 0,
        status: 'core-flow-observed',
        evidenceStatus: 'observed',
      }) as unknown as Parameters<LivePageModule['refreshNativePreviewObservation']>[0];

    const lateRejection = makeObservation();
    expect(livePage.refreshNativePreviewObservation(lateRejection)).toEqual([]);
    lateRejection.api.tweetResultByRestId.requests += 1;
    lateRejection.api.tweetResultByRestId.responses.push(403);
    lateRejection.api.observations.push({ ...cResponse, httpStatus: 403, result: null });
    expect(livePage.refreshNativePreviewObservation(lateRejection)).toContain(
      'exactCProviderPhoto'
    );
    expect(lateRejection).toMatchObject({
      status: 'failed',
      evidenceStatus: 'unverified',
      classification: 'provider-rejection-observed-gallery-unverified',
      providerRejection: { httpStatus: 403, requestedTweetId: '456' },
    });

    const duplicate = makeObservation();
    duplicate.api.tweetResultByRestId.requests += 1;
    duplicate.api.tweetResultByRestId.responses.push(200);
    duplicate.api.observations.push(cResponse);
    expect(livePage.refreshNativePreviewObservation(duplicate)).toContain('exactCProviderPhoto');
    expect(duplicate).toMatchObject({ status: 'failed', evidenceStatus: 'unverified' });

    const lateError = makeObservation();
    lateError.productErrors.push({ kind: 'console' });
    lateError.pageErrors.push({ kind: 'page-error' });
    expect(livePage.refreshNativePreviewObservation(lateError)).toEqual([
      'noProductErrors',
      'noPageErrors',
    ]);
    expect(lateError).toMatchObject({ status: 'failed', evidenceStatus: 'unverified' });

    const lateHostDiagnostic = makeObservation();
    lateHostDiagnostic.hostDiagnostics.push({ kind: 'http-response', status: 500 });
    expect(livePage.refreshNativePreviewObservation(lateHostDiagnostic)).toEqual([]);
    expect(lateHostDiagnostic).toMatchObject({
      status: 'core-flow-observed',
      evidenceStatus: 'unverified',
    });

    const pendingResponse = makeObservation();
    pendingResponse.api.tweetResultByRestId.requests += 1;
    expect(livePage.refreshNativePreviewObservation(pendingResponse)).toContain(
      'exactCProviderPhoto'
    );
    expect(pendingResponse).toMatchObject({ status: 'failed', evidenceStatus: 'unverified' });
  });

  it('accepts only aborts from the selected, proven quoted video', () => {
    const source = { host: 'video.twimg.com', path: '/amplify_video/456/vid/clip.mp4' };
    const abort = {
      kind: 'request-failed',
      error: 'net::ERR_ABORTED',
      url: 'https://video.twimg.com/amplify_video/456/aud/chunk.m4s',
    };
    const observation = {
      requiredAssertions: Object.fromEntries(
        Array.from({ length: 13 }, (_, index) => [`assertion${index}`, true])
      ),
      gallery: {
        owner: { status: 'matched-direct-quote-variant', mediaId: '456' },
        opened: { selectedVideo: { source } },
      },
      hostDiagnostics: [abort],
      hostDiagnosticOverflow: 0,
      productErrors: [] as unknown[],
      productErrorOverflow: 0,
      pageErrors: [] as unknown[],
      pageErrorOverflow: 0,
      missingAssertions: [] as string[],
    };
    expect(livePage.classifyLiveHostDiagnostics(observation)).toEqual({
      expectedLifecycleCancellationCount: 1,
      evidenceStatus: 'observed',
    });
    const unverified = (override: Record<string, unknown>): void => {
      expect(
        livePage.classifyLiveHostDiagnostics({ ...observation, ...override }).evidenceStatus
      ).toBe('unverified');
    };
    unverified({
      hostDiagnostics: [
        { ...abort, url: 'https://video.twimg.com/amplify_video/789/aud/chunk.m4s' },
      ],
    });
    unverified({
      hostDiagnostics: [
        { ...abort, url: 'https://video.twimg.com/ext_tw_video/456/aud/chunk.m4s' },
      ],
    });
    unverified({ hostDiagnostics: [{ ...abort, error: 'HTTP 403' }] });
    unverified({ hostDiagnostics: [{ ...abort, hadQuery: true }] });
    unverified({ hostDiagnostics: [{ ...abort, hadCredentials: true }] });
    unverified({ hostDiagnostics: [{ ...abort, hadPort: true }] });
    unverified({ hostDiagnostics: [{ ...abort, url: `${abort.url}?private=redacted` }] });
    unverified({
      hostDiagnostics: [
        { ...abort, url: 'https://user:pass@video.twimg.com/amplify_video/456/aud/chunk.m4s' },
      ],
    });
    unverified({
      hostDiagnostics: [
        { ...abort, url: 'https://video.twimg.com:444/amplify_video/456/aud/chunk.m4s' },
      ],
    });
    unverified({
      hostDiagnostics: [
        { ...abort, url: 'https://video.twimg.com:443/amplify_video/456/aud/chunk.m4s' },
      ],
    });
    unverified({
      hostDiagnostics: [
        {
          kind: 'http-response',
          status: 403,
          url: 'https://x.com/i/api/graphql/TweetResultByRestId',
        },
      ],
    });
    unverified({
      hostDiagnostics: [
        { ...abort, url: 'https://foreign.example/amplify_video/456/aud/chunk.m4s' },
      ],
    });
    unverified({
      hostDiagnostics: [{ kind: 'console', location: 'https://x.com', text: 'Host failed' }],
    });
    unverified({
      requiredAssertions: { ...observation.requiredAssertions, playbackProgress: false },
    });
    unverified({ hostDiagnosticOverflow: 1 });
    unverified({
      gallery: {
        ...observation.gallery,
        opened: {
          selectedVideo: { source: { ...source, path: '/amplify_video/789/vid/clip.mp4' } },
        },
      },
    });

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

  it('binds a borrowed CSP baseline to the same profile, source, URLs, and restored inventory', () => {
    const url = 'https://x.com/tester/status/12345';
    const script =
      'https://abs.twimg.com/responsive-web/client-web/loader.TimelineRenderer.abc123.js';
    const fingerprint = {
      kind: 'console-error',
      script,
      sourceKind: 'x-host-script-location',
      inlineHandlerCsp: true,
      messageSha256: 'd'.repeat(64),
      messageByteLength: 100,
    };
    const baseline = {
      receiptSha256: '1'.repeat(64),
      sourceSha: 'a'.repeat(40),
      coreSha: 'b'.repeat(40),
      bundleSha256: 'c'.repeat(64),
      browserPid: 123,
      browserBirthUtcTicks: '639284716450486670',
      browserSessionId: 2,
      browserSidSha256: '6'.repeat(64),
      profilePathSha256: '2'.repeat(64),
      portReceiptSha256: '3'.repeat(64),
      status: 'baseline-observed',
      completedAtUtc: new Date().toISOString(),
      ownedPagesClosed: true,
      originalPagesPreserved: true,
      focusRestored: true,
      disconnected: true,
      inventory: {
        count: 5,
        developerMode: false,
        relatedCount: 0,
        unrelatedDigest: '4'.repeat(64),
      },
      pages: [
        {
          requestedUrl: url,
          finalUrl: url,
          responseStatus: 200,
          articleVisible: true,
          closed: true,
          consoleErrors: [fingerprint],
          consoleOverflow: 0,
          pageErrorCount: 0,
          pageErrorOverflow: 0,
        },
      ],
    };
    const current = {
      sourceSha: baseline.sourceSha,
      coreSha: baseline.coreSha,
      bundleSha256: baseline.bundleSha256,
      browserPid: baseline.browserPid,
      browserBirthUtcTicks: baseline.browserBirthUtcTicks,
      browserSessionId: baseline.browserSessionId,
      browserSidSha256: baseline.browserSidSha256,
      profilePathSha256: baseline.profilePathSha256,
      portReceiptSha256: baseline.portReceiptSha256,
      unrelatedCount: 5,
      unrelatedDigest: baseline.inventory.unrelatedDigest,
      targetCount: 1,
      runtimeResourceCount: 12,
      runtimeResourceBinding: 'matched',
      extensionSourcePathVerified: true,
    };
    const proof = { schemaVersion: 1, kind: 'BorrowedHostDiagnosticProof', baseline, current };
    expect(livePage.validateBorrowedHostProof(proof, [url])).toEqual(
      new Map([
        [
          url,
          [
            {
              script,
              messageSha256: fingerprint.messageSha256,
              messageByteLength: fingerprint.messageByteLength,
            },
          ],
        ],
      ])
    );
    const rejects = (change: (candidate: typeof proof) => void) => {
      const candidate = structuredClone(proof);
      change(candidate);
      expect(livePage.validateBorrowedHostProof(candidate, [url])).toBeNull();
    };
    rejects((item) => {
      item.current.profilePathSha256 = '5'.repeat(64);
    });
    rejects((item) => {
      item.baseline.completedAtUtc = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    });
    rejects((item) => {
      item.current.browserPid = 124;
    });
    rejects((item) => {
      item.current.browserSessionId = 3;
    });
    rejects((item) => {
      item.current.browserSidSha256 = '7'.repeat(64);
    });
    rejects((item) => {
      item.current.sourceSha = '0'.repeat(40);
    });
    rejects((item) => {
      item.current.bundleSha256 = '0'.repeat(64);
    });
    rejects((item) => {
      item.current.unrelatedCount = 6;
    });
    rejects((item) => {
      item.current.targetCount = 0;
    });
    rejects((item) => {
      item.current.runtimeResourceCount = 11;
    });
    rejects((item) => {
      item.baseline.inventory.relatedCount = 1;
    });
    rejects((item) => {
      item.baseline.pages[0]!.requestedUrl = 'https://x.com/other/status/12345';
    });
    rejects((item) => {
      item.baseline.pages[0]!.consoleErrors[0]!.messageSha256 = 'bad';
    });
    rejects((item) => {
      item.baseline.pages[0]!.consoleErrors[0]!.messageByteLength = 4097;
    });
    rejects((item) => {
      item.baseline.pages[0]!.consoleErrors.push({
        ...fingerprint,
        kind: 'http-response',
      });
    });
    rejects((item) => {
      item.baseline.pages[0]!.consoleOverflow = 1;
    });
    expect(
      livePage.validateBorrowedHostProof(proof, ['https://x.com/other/status/12345'])
    ).toBeNull();

    const canonicalProof = structuredClone(proof);
    Object.assign(canonicalProof.baseline.pages[0]!.consoleErrors[0]!, {
      nonceCanonical: {
        algorithm: 'script-src-quoted-nonce-v1',
        sha256: 'e'.repeat(64),
        count: 1,
        lengths: [48],
      },
    });
    expect(livePage.validateBorrowedHostProof(canonicalProof, [url])?.get(url)?.[0]).toMatchObject({
      nonceCanonical: {
        algorithm: 'script-src-quoted-nonce-v1',
        sha256: 'e'.repeat(64),
        count: 1,
        lengths: [48],
      },
    });
    for (const changed of [
      { algorithm: 'all-nonce-values-v1' },
      { sha256: 'bad' },
      { count: 0 },
      { lengths: [47, 48] },
      { lengths: [0] },
    ]) {
      const invalid = structuredClone(canonicalProof);
      Object.assign(invalid.baseline.pages[0]!.consoleErrors[0]!, {
        nonceCanonical: {
          algorithm: 'script-src-quoted-nonce-v1',
          sha256: 'e'.repeat(64),
          count: 1,
          lengths: [48],
          ...changed,
        },
      });
      expect(livePage.validateBorrowedHostProof(invalid, [url])).toBeNull();
    }
  });

  it('qualifies only a strict quoted script-src nonce change with full-message bounds', () => {
    const script =
      'https://abs.twimg.com/responsive-web/client-web/loader.TimelineRenderer.abc123.js';
    const csp = (nonce: string, tail = '', policy = "'self'") =>
      `Executing inline event handler violates the following Content Security Policy directive 'script-src ${policy} 'nonce-${nonce}' https://x.com/'. Either a nonce or a hash is required.${tail}`;
    const baselineRaw = csp('A'.repeat(48));
    const baseline = livePage.fingerprintKnownInlineHandlerCsp(baselineRaw, script);
    const current = livePage.fingerprintKnownInlineHandlerCsp(csp('B'.repeat(48)), script);
    expect(baseline?.nonceCanonical).toMatchObject({
      algorithm: 'script-src-quoted-nonce-v1',
      count: 1,
      lengths: [48],
    });
    expect(current?.messageSha256).not.toBe(baseline?.messageSha256);
    expect(current?.nonceCanonical?.sha256).toBe(baseline?.nonceCanonical?.sha256);
    if (!baseline?.nonceCanonical) {
      throw new Error('Nonce fixture was not parsed');
    }
    const finalNonce = livePage.fingerprintKnownInlineHandlerCsp(
      `Executing inline event handler violates the following Content Security Policy directive 'script-src 'self' 'nonce-${'A'.repeat(48)}''. Either a nonce is required.`,
      script
    );
    expect(finalNonce?.nonceCanonical?.count).toBe(1);
    const proof = {
      expectedCsp: [baseline],
      identities: {
        selectedVideo: null,
        apiVariants: [],
        apiVariantOverflow: false,
        requestUrls: [],
        requestUrlOverflow: false,
      },
    };
    const classify = (
      raw: string,
      rawScript = script,
      extra: unknown[] = [],
      candidateProof: unknown = proof
    ) => {
      const fingerprint = livePage.fingerprintKnownInlineHandlerCsp(raw, rawScript);
      const observation = {
        requiredAssertions: Object.fromEntries(
          Array.from({ length: 13 }, (_, index) => [`assertion${index}`, true])
        ),
        missingAssertions: [],
        gallery: { owner: null },
        api: { overflow: 0 },
        hostDiagnostics: [
          {
            kind: 'console',
            location: rawScript,
            inlineHandlerCsp: Boolean(fingerprint),
            messageSha256: fingerprint?.messageSha256,
            messageByteLength: fingerprint?.messageByteLength,
            ...(fingerprint?.nonceCanonical ? { nonceCanonical: fingerprint.nonceCanonical } : {}),
          },
          ...extra,
        ],
        hostDiagnosticOverflow: 0,
        productErrors: [],
        productErrorOverflow: 0,
        pageErrors: [],
        pageErrorOverflow: 0,
      };
      return livePage.classifyLiveHostDiagnostics(observation, candidateProof);
    };
    expect(classify(csp('B'.repeat(48)))).toMatchObject({
      qualifiedCspCount: 1,
      evidenceStatus: 'observed',
    });
    expect(classify(baselineRaw)).toMatchObject({
      qualifiedCspCount: 1,
      evidenceStatus: 'observed',
    });
    const forgedProof = {
      ...proof,
      expectedCsp: [
        {
          ...baseline,
          nonceCanonical: {
            ...baseline.nonceCanonical,
            sha256: 'f'.repeat(64),
          },
        },
      ],
    };
    expect(classify(csp('B'.repeat(48)), script, [], forgedProof).evidenceStatus).toBe(
      'unverified'
    );
    expect(
      classify(csp('B'.repeat(48)), script, [{ kind: 'http-response', status: 500 }]).evidenceStatus
    ).toBe('unverified');
    for (const raw of [
      csp('B'.repeat(47)),
      csp('B'.repeat(48), 'Other suffix'),
      csp('B'.repeat(48), '', "'sha256-other' 'self'"),
      csp('B'.repeat(48), '', "'unsafe-inline'"),
      csp('B'.repeat(48), ` Outside 'nonce-${'C'.repeat(48)}'`),
      csp('B'.repeat(48)).replace('https://x.com/', 'https://twitter.com/'),
      csp('B'.repeat(48)).replace("'nonce-", 'nonce-'),
      csp('B'.repeat(48)).replace("'nonce-", "'nonce-!!!"),
      csp('B'.repeat(48)).replace(" 'nonce-", "x'nonce-"),
      csp('B'.repeat(48)).replace(" 'nonce-", " https://evil/'nonce-"),
      csp('B'.repeat(48)).replace("' https://x.com/", "'suffix https://x.com/"),
      csp('B'.repeat(48)).replace("https://x.com/'", ` 'nonce-${'C'.repeat(48)}' https://x.com/'`),
    ]) {
      expect(classify(raw).evidenceStatus).toBe('unverified');
    }
    expect(classify(csp('B'.repeat(48)), script + '?variant=1').evidenceStatus).toBe('unverified');
    expect(
      classify(
        csp('B'.repeat(48)),
        `https://abs.twimg.com/responsive-web/client-web/loader.TimelineRenderer.${'a'.repeat(260)}.js`
      ).evidenceStatus
    ).toBe('unverified');
    expect(classify(csp('B'.repeat(48)) + 'x'.repeat(4096)).evidenceStatus).toBe('unverified');
    expect(
      livePage.classifyLiveHostDiagnostics({
        requiredAssertions: Object.fromEntries(
          Array.from({ length: 13 }, (_, index) => [`assertion${index}`, true])
        ),
        missingAssertions: [],
        gallery: { owner: null },
        api: { overflow: 0 },
        hostDiagnostics: [{ kind: 'console', location: script }],
        hostDiagnosticOverflow: 0,
        productErrors: [],
        productErrorOverflow: 0,
        pageErrors: [],
        pageErrorOverflow: 0,
      }).evidenceStatus
    ).toBe('unverified');
  });

  it('captures only bounded exact raw API video variants before retaining path-only evidence', () => {
    const path = '/amplify_video/456/vid/clip.mp4';
    const full = `https://video.twimg.com${path}?tag=opaque`;
    const secondQuery = `${full}&second=1`;
    expect(livePage.fullVideoUrlIdentity(full)).toEqual({
      rawUrl: full,
      source: { host: 'video.twimg.com', path },
      hadQuery: true,
    });
    for (const value of [
      full.replace('video.twimg.com/', 'video.twimg.com:443/'),
      full.replace('video.twimg.com/', 'user:pass@video.twimg.com/'),
      `${full}#fragment`,
      `${full}\n`,
      `${full}${'x'.repeat(2049)}`,
      full.replace('https:', 'http:'),
    ]) {
      expect(livePage.fullVideoUrlIdentity(value)).toBeNull();
    }
    const variants = [
      full,
      secondQuery,
      full.replace('video.twimg.com/', 'video.twimg.com:443/'),
      `${full}#fragment`,
    ].map((url) => ({ content_type: 'video/mp4', url }));
    const body = {
      data: {
        tweetResult: {
          result: {
            result: {
              rest_id: '123',
              quoted_status_result: {
                result: {
                  rest_id: '789',
                  legacy: {
                    extended_entities: {
                      media: [
                        {
                          id_str: '456',
                          type: 'video',
                          video_info: { variants },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const summary = livePage.summarizeTweetResultResponse(
      'https://x.com/i/api/graphql/TweetResultByRestId',
      200,
      body
    );
    expect(summary?.directQuote?.media[0]?.playableVariants).toHaveLength(4);
    if (!summary) {
      throw new Error('API fixture was not summarized');
    }
    const identities: Parameters<typeof livePage.captureApiVideoIdentities>[2] = {
      selectedVideo: null,
      apiVariants: [],
      apiVariantOverflow: false,
      requestUrls: [],
      requestUrlOverflow: false,
    };
    livePage.captureApiVideoIdentities(body, summary, identities);
    expect(identities.apiVariants.map((entry) => entry.rawUrl)).toEqual([full, secondQuery]);
    expect(JSON.stringify(summary)).not.toContain('opaque');
    // Repeated responses cannot grow the ephemeral identity set without bound.
    for (let index = 0; index < 49; index += 1) {
      livePage.captureApiVideoIdentities(body, summary, identities);
    }
    expect(identities.apiVariantOverflow).toBe(true);
    expect(identities.apiVariants.length).toBe(96);
  });

  it('qualifies only exact borrowed CSP and full selected API video URL identities', () => {
    const source = { host: 'video.twimg.com', path: '/amplify_video/456/vid/clip.mp4' };
    const fullUrl = `https://${source.host}${source.path}?tag=opaque`;
    const fullHash = createHash('sha256').update(fullUrl).digest('hex');
    const csp = {
      kind: 'console',
      location: 'https://abs.twimg.com/responsive-web/client-web/loader.TimelineRenderer.abc123.js',
      text: 'Executing inline event handler violates CSP',
      inlineHandlerCsp: true,
      messageSha256: 'd'.repeat(64),
      messageByteLength: 100,
    };
    const abort = {
      kind: 'request-failed',
      error: 'net::ERR_ABORTED',
      url: `https://${source.host}${source.path}`,
      hadQuery: true,
      hadFragment: false,
      hadCredentials: false,
      hadPort: false,
    };
    const observation = {
      requiredAssertions: Object.fromEntries(
        Array.from({ length: 13 }, (_, index) => [`assertion${index}`, true])
      ),
      missingAssertions: [] as string[],
      gallery: {
        owner: {
          status: 'matched-direct-quote-variant',
          ownerId: '789',
          mediaId: '456',
          mediaIndex: 0,
        },
        opened: { selectedVideo: { source } },
      },
      api: { overflow: 0 },
      hostDiagnostics: [csp, csp, abort],
      hostDiagnosticOverflow: 0,
      productErrors: [] as unknown[],
      productErrorOverflow: 0,
      pageErrors: [] as unknown[],
      pageErrorOverflow: 0,
    };
    const proof = {
      expectedCsp: [csp, csp].map((item) => ({
        script: item.location,
        messageSha256: item.messageSha256,
        messageByteLength: item.messageByteLength,
      })),
      identities: {
        selectedVideo: { source, rawUrl: fullUrl },
        apiVariants: [{ ownerId: '789', mediaId: '456', mediaIndex: 0, source, rawUrl: fullUrl }],
        apiVariantOverflow: false,
        requestUrls: [{ record: abort, rawUrl: fullUrl }],
        requestUrlOverflow: false,
      },
    };
    expect(livePage.classifyLiveHostDiagnostics(observation, proof)).toEqual({
      expectedLifecycleCancellationCount: 1,
      qualifiedCspCount: 2,
      evidenceStatus: 'observed',
    });
    expect(abort).toHaveProperty('queryIdentityMatched', true);
    expect(abort).toHaveProperty('urlIdentitySha256', fullHash);
    const rejects = (change: (candidate: typeof proof, observed: typeof observation) => void) => {
      const candidate = structuredClone(proof);
      const observed = structuredClone(observation);
      const observedAbort = observed.hostDiagnostics[2];
      if (!observedAbort || !('error' in observedAbort)) {
        throw new Error('Quoted-video abort fixture was not retained');
      }
      candidate.identities.requestUrls = [{ record: observedAbort, rawUrl: fullUrl }];
      change(candidate, observed);
      expect(livePage.classifyLiveHostDiagnostics(observed, candidate).evidenceStatus).toBe(
        'unverified'
      );
    };
    rejects((item) => {
      item.expectedCsp[0]!.messageSha256 = 'e'.repeat(64);
    });
    rejects((item) => {
      item.expectedCsp[0]!.messageByteLength = 101;
    });
    rejects((item) => {
      item.expectedCsp.pop();
    });
    rejects((_item, observed) => {
      observed.hostDiagnostics.push({
        ...csp,
        location: 'https://other.example/script.js',
      });
    });
    rejects((item) => {
      item.identities.selectedVideo.rawUrl += '&other=1';
    });
    rejects((item) => {
      item.identities.apiVariants[0]!.rawUrl += '&other=1';
    });
    rejects((item) => {
      item.identities.apiVariants.push({
        ...item.identities.apiVariants[0]!,
        rawUrl: `${fullUrl}&second=1`,
      });
    });
    rejects((item) => {
      item.identities.apiVariantOverflow = true;
    });
    rejects((item) => {
      item.identities.requestUrlOverflow = true;
    });
    rejects((item) => {
      item.identities.requestUrls.length = 0;
    });
    rejects((item) => {
      item.identities.requestUrls[0]!.rawUrl = fullUrl.replace(
        'video.twimg.com/',
        'video.twimg.com:443/'
      );
    });
    rejects((item) => {
      item.identities.requestUrls[0]!.rawUrl += '#fragment';
    });
    rejects((item) => {
      item.identities.requestUrls[0]!.rawUrl += '\n';
    });
    rejects((item) => {
      item.identities.requestUrls[0]!.rawUrl += 'x'.repeat(2049);
    });
    rejects((_item, observed) => {
      observed.hostDiagnosticOverflow = 1;
    });
    rejects((_item, observed) => {
      observed.requiredAssertions.playbackProgress = false;
    });
    rejects((_item, observed) => {
      observed.missingAssertions.push('playbackProgress');
    });
    rejects((_item, observed) => {
      observed.productErrors.push({ kind: 'console' });
    });
    rejects((_item, observed) => {
      observed.api.overflow = 1;
    });
    rejects((item) => {
      item.identities.requestUrls[0]!.rawUrl += '&other=1';
    });
    rejects((_item, observed) => {
      observed.hostDiagnostics[2]!.kind = 'console';
    });
    rejects((_item, observed) => {
      Object.assign(observed.hostDiagnostics[2]!, { error: 'HTTP 403' });
    });
    expect(livePage.classifyLiveHostDiagnostics(observation).evidenceStatus).toBe('unverified');
  });

  it('qualifies known CSP only within each validated main-frame document', () => {
    const firstUrl = 'https://x.com/owner/status/123';
    const nextUrl = 'https://x.com/owner/status/456';
    const location =
      'https://abs.twimg.com/responsive-web/client-web/loader.TimelineRenderer.abc123.js';
    const fingerprint = (sha: string) => ({
      script: location,
      messageSha256: sha.repeat(64),
      messageByteLength: 100,
    });
    const csp = (id: string, url: string, sha: string) => ({
      kind: 'console',
      location,
      inlineHandlerCsp: true,
      messageSha256: sha.repeat(64),
      messageByteLength: 100,
      documentId: id,
      documentUrl: url,
    });
    const observation = {
      requiredAssertions: Object.fromEntries(
        Array.from({ length: 13 }, (_, index) => [`assertion${index}`, true])
      ),
      missingAssertions: [] as string[],
      gallery: {},
      api: { overflow: 0 },
      hostDiagnostics: [
        csp('first-loader', firstUrl, 'a'),
        csp('first-reload', firstUrl, 'a'),
        csp('second-reload', firstUrl, 'a'),
        csp('destination', nextUrl, 'b'),
      ],
      hostDiagnosticOverflow: 0,
      productErrors: [],
      productErrorOverflow: 0,
      pageErrors: [] as unknown[],
      pageErrorOverflow: 0,
    };
    const proof = {
      expectedCsp: [fingerprint('a')],
      documentBaselines: new Map([
        [firstUrl, [fingerprint('a')]],
        [nextUrl, [fingerprint('b')]],
      ]),
      identities: {
        selectedVideo: null,
        apiVariants: [],
        apiVariantOverflow: false,
        requestUrls: [],
        requestUrlOverflow: false,
      },
    };
    expect(livePage.classifyLiveHostDiagnostics(observation, proof)).toEqual({
      expectedLifecycleCancellationCount: 0,
      qualifiedCspCount: 4,
      evidenceStatus: 'observed',
    });
    const rejects = (change: (candidate: typeof observation) => void) => {
      const candidate = structuredClone(observation);
      change(candidate);
      expect(livePage.classifyLiveHostDiagnostics(candidate, proof).evidenceStatus).toBe(
        'unverified'
      );
    };
    rejects((candidate) => {
      candidate.hostDiagnostics[0]!.documentId = '';
    });
    rejects((candidate) => {
      candidate.hostDiagnostics[3]!.documentUrl = 'https://x.com/other/status/999';
    });
    rejects((candidate) => {
      candidate.hostDiagnostics[3]!.documentId = 'first-loader';
    });
    rejects((candidate) => {
      candidate.hostDiagnostics[1]!.messageSha256 = 'c'.repeat(64);
    });
    rejects((candidate) => {
      candidate.hostDiagnostics.push(csp('first-reload', firstUrl, 'a'));
    });
    rejects((candidate) => {
      candidate.hostDiagnostics.push({
        ...csp('foreign', firstUrl, 'a'),
        location: 'https://other.example/script.js',
      });
    });
    rejects((candidate) => {
      candidate.hostDiagnostics.push({
        ...csp('foreign', firstUrl, 'a'),
        kind: 'request-failed',
      });
    });
    rejects((candidate) => {
      candidate.pageErrors.push({ kind: 'page-error' });
    });
  });

  it('uses only the indexed owner photo from parsed provider evidence as a canonical path', () => {
    const source = { host: 'pbs.twimg.com', path: '/media/target' };
    const api: Parameters<LivePageModule['canonicalOwnedPhotoPath']>[0] = {
      tweetResultByRestId: { requests: 1, responses: [200] },
      overflow: 0,
      observations: [
        {
          operation: 'TweetResultByRestId',
          requestedTweetId: '123',
          httpStatus: 200,
          providerErrors: false,
          bodyOutcome: 'parsed',
          directQuote: null,
          nestedQuoteId: null,
          result: {
            id: '123',
            media: [
              {
                id: '1',
                type: 'photo',
                poster: { host: 'pbs.twimg.com', path: '/media/target.jpg' },
                playableVariants: [],
              },
              {
                id: '2',
                type: 'photo',
                poster: { host: 'pbs.twimg.com', path: '/media/other.jpg' },
                playableVariants: [],
              },
            ],
          },
        },
      ],
    };
    const canonical = () => livePage.canonicalOwnedPhotoPath(api, '123', 1, source);
    expect(canonical()).toBe('/media/target.jpg');
    expect(livePage.canonicalOwnedPhotoPath(api, '123', 2, source)).toBeNull();
    expect(livePage.canonicalOwnedPhotoPath(api, '456', 1, source)).toBeNull();
    const parsed = api.observations[0]!;
    parsed.result!.media[0]!.poster = { host: 'pbs.twimg.com', path: '/media/targetx.jpg' };
    expect(canonical()).toBeNull();
    parsed.result!.media[0]!.poster = { host: 'other.example', path: '/media/target.jpg' };
    expect(canonical()).toBeNull();
    parsed.result!.media[0]!.poster = { host: 'pbs.twimg.com', path: '/media/target.jpg' };
    api.overflow = 1;
    expect(canonical()).toBeNull();
    api.overflow = 0;
    const video = parsed.result!.media[1]!;
    video.id = '456';
    video.type = 'video';
    video.playableVariants = [
      { host: 'video.twimg.com', path: '/ext_tw_video/456/pu/vid/720x1280/clip.mp4' },
    ];
    expect(
      livePage.ownedMixedPhotoVideo(api, '123', 1, {
        host: 'pbs.twimg.com',
        path: '/media/target.jpg',
      })
    ).toMatchObject({ mediaId: '456', mediaIndex: 1 });
    video.playableVariants = [
      { host: 'video.twimg.com', path: '/ext_tw_video/999/pu/vid/720x1280/clip.mp4' },
    ];
    expect(
      livePage.ownedMixedPhotoVideo(api, '123', 1, {
        host: 'pbs.twimg.com',
        path: '/media/target.jpg',
      })
    ).toBeNull();
  });

  it('summarizes direct quote API relationships and playable variants without response text', () => {
    const url =
      'https://x.com/i/api/graphql/query/TweetResultByRestId?variables=%7B%22tweetId%22%3A%22123%22%7D';
    const result = livePage.summarizeTweetResultResponse(url, 200, {
      data: {
        tweetResult: {
          result: {
            rest_id: '123',
            legacy: { full_text: 'Private text' },
            quoted_status_result: {
              result: {
                rest_id: '456',
                legacy: {
                  full_text: 'Another private text',
                  extended_entities: {
                    media: [
                      {
                        id_str: '789',
                        type: 'video',
                        media_url_https:
                          'https://pbs.twimg.com/ext_tw_video_thumb/456/pu/img/poster.jpg',
                        video_info: {
                          variants: [
                            {
                              content_type: 'video/mp4',
                              url: 'https://video.twimg.com/ext_tw_video/456/pu/vid/clip.mp4?token=secret',
                            },
                            {
                              content_type: 'application/x-mpegURL',
                              url: 'https://video.twimg.com/playlist.m3u8',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(result).toMatchObject({
      operation: 'TweetResultByRestId',
      requestedTweetId: '123',
      httpStatus: 200,
      result: { id: '123' },
      directQuote: {
        id: '456',
        media: [
          {
            id: '789',
            type: 'video',
            playableVariants: [
              { host: 'video.twimg.com', path: '/ext_tw_video/456/pu/vid/clip.mp4' },
            ],
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /Private text|Another private text|secret|playlist/u
    );
  });

  it('marks a rejected quote lookup without inferring login or product success', () => {
    const rejection = livePage.summarizeQuoteProviderRejection({
      tweetResultByRestId: { responses: [403] },
      observations: [
        {
          operation: 'TweetResultByRestId',
          requestedTweetId: '456',
          httpStatus: 403,
          providerErrors: false,
          result: null,
          bodyOutcome: 'not-readable',
        },
      ],
    });
    expect(rejection).toEqual({
      operation: 'TweetResultByRestId',
      kind: 'http-rejection',
      httpStatus: 403,
      requestedTweetId: '456',
    });
    expect(
      livePage.classifyLiveFailure(
        'controlled-media-click-did-not-open-gallery',
        'attempting',
        rejection
      )
    ).toBe('provider-rejection-observed-gallery-unverified');
    expect(
      livePage.classifyLiveFailure(
        'controlled-media-click-did-not-open-gallery',
        'attempting',
        null
      )
    ).toBe('controlled-media-click-did-not-open-gallery');
    expect(
      livePage.summarizeQuoteProviderRejection({
        tweetResultByRestId: { responses: [200] },
        observations: [
          {
            operation: 'TweetResultByRestId',
            requestedTweetId: '456',
            httpStatus: 200,
            providerErrors: true,
          },
        ],
      })
    ).toEqual({
      operation: 'TweetResultByRestId',
      kind: 'graphql-errors',
      httpStatus: 200,
      requestedTweetId: '456',
    });
    expect(
      livePage.summarizeQuoteProviderRejection({
        tweetResultByRestId: { responses: [403] },
        observations: [],
      })
    ).toEqual({
      operation: 'TweetResultByRestId',
      kind: 'http-rejection',
      httpStatus: 403,
      requestedTweetId: null,
    });
    expect(
      livePage.summarizeQuoteProviderRejection({
        tweetResultByRestId: { responses: [200] },
        observations: [],
      })
    ).toBeNull();
  });

  it('keeps a C gallery fallback unverified after C API rejection', () => {
    const owner = '7555555555555555555';
    const source = '/media/CompactQuoteSelected';
    const rejected = livePage.summarizeCompactImageEvidence(
      {
        tweetResultByRestId: { requests: 1, responses: [403] },
        overflow: 0,
        observations: [
          {
            operation: 'TweetResultByRestId',
            requestedTweetId: owner,
            httpStatus: 403,
            providerErrors: false,
            result: null,
            directQuote: null,
            nestedQuoteId: null,
          },
        ],
      },
      owner,
      source,
      0
    );
    expect(rejected).toMatchObject({
      providerConfirmed: false,
      providerRejection: { kind: 'http-rejection', requestedTweetId: owner, httpStatus: 403 },
    });
    const healthyApi = {
      tweetResultByRestId: { requests: 1, responses: [200] },
      overflow: 0,
      observations: [
        {
          operation: 'TweetResultByRestId',
          requestedTweetId: owner,
          httpStatus: 200,
          providerErrors: false,
          directQuote: null,
          nestedQuoteId: null,
          result: {
            id: owner,
            media: [
              {
                id: '101',
                type: 'photo',
                poster: { host: 'pbs.twimg.com', path: '/media/CompactQuoteFirst.jpg' },
                playableVariants: [],
              },
              {
                id: '102',
                type: 'photo',
                poster: { host: 'pbs.twimg.com', path: '/media/CompactQuoteSelected.jpg' },
                playableVariants: [],
              },
            ],
          },
        },
      ],
    };
    const healthy = livePage.summarizeCompactImageEvidence(healthyApi, owner, source, 1);
    expect(healthy).toEqual({ providerConfirmed: true, providerRejection: null, apiMediaIndex: 1 });
    expect(
      livePage.summarizeCompactImageEvidence({ ...healthyApi, overflow: 1 }, owner, source, 1)
        .providerConfirmed
    ).toBe(false);
    expect(
      livePage.summarizeCompactImageEvidence(
        {
          tweetResultByRestId: { requests: 0, responses: [] },
          observations: [],
          overflow: 0,
        },
        owner,
        source,
        0
      ).providerConfirmed
    ).toBe(false);
  });
});
