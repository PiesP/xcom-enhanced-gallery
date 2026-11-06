// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** Bounded, non-pausing diagnostics for one real installed-extension image click. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';

const MAX_EVENTS = 48;
const CONTENT_URL = (id: string) => `chrome-extension://${id}/content.js`;

type Stage = {
  readonly name: string;
  readonly functionName: string;
  readonly line: string;
  readonly occurrence?: number;
  readonly capture?: 'media' | 'photo';
};

// Match the executed, unminified production bundle. Any source drift fails closed.
const STAGES: readonly Stage[] = [
  {
    name: 'handler.enter',
    functionName: 'handleMediaClick',
    line: 'if (!options.enableMediaDetection) return;',
  },
  {
    name: 'handler.enabled',
    functionName: 'handleMediaClick',
    line: 'const target = event.target;',
  },
  {
    name: 'handler.target',
    functionName: 'handleMediaClick',
    line: 'if (isGalleryRecoveryActive()) return;',
  },
  {
    name: 'handler.recovery',
    functionName: 'handleMediaClick',
    line: 'if (gallerySignals.isOpen) {',
  },
  {
    name: 'handler.closed',
    functionName: 'handleMediaClick',
    line: 'const mediaTarget = getMediaClickTarget(event);',
  },
  {
    name: 'handler.mediaTarget',
    functionName: 'handleMediaClick',
    line: 'if (!isVideoClickAllowed(mediaTarget, () => event.composedPath(), resolveVideoClickMode())) return;',
  },
  {
    name: 'handler.videoAllowed',
    functionName: 'handleMediaClick',
    line: 'if (!isProcessableMedia(mediaTarget, event)) return;',
  },
  {
    name: 'handler.processable',
    functionName: 'handleMediaClick',
    line: 'event.stopImmediatePropagation();',
    occurrence: 1,
  },
  {
    name: 'handler.preventDefault',
    functionName: 'handleMediaClick',
    line: 'event.preventDefault();',
    occurrence: 1,
  },
  {
    name: 'handler.dispatch',
    functionName: 'handleMediaClick',
    line: 'await handlers.onMediaClick(mediaTarget, event);',
  },
  {
    name: 'processable.enter',
    functionName: 'isProcessableMedia',
    line: 'const htmlTarget = event ? getMediaClickTarget(event) : target instanceof HTMLElement ? target : null;',
  },
  {
    name: 'processable.targetAgreement',
    functionName: 'isProcessableMedia',
    line: 'if (event && target !== htmlTarget && target !== event.target) return false;',
  },
  {
    name: 'processable.blockCheck',
    functionName: 'isProcessableMedia',
    line: 'if (!htmlTarget || gallerySignals.isOpen || shouldBlockMediaTrigger(htmlTarget, event)) return false;',
  },
  {
    name: 'processable.blockPassed',
    functionName: 'isProcessableMedia',
    line: 'if (isAllowAllNativeVideoControl(htmlTarget, tryGetSettings() ? getTypedSettingOr("gallery.videoClickMode", DEFAULT_SETTINGS.gallery.videoClickMode) : DEFAULT_SETTINGS.gallery.videoClickMode)) return true;',
  },
  {
    name: 'processable.mediaLookup',
    functionName: 'isProcessableMedia',
    line: 'const mediaElement = findMediaElementInDOM(htmlTarget);',
  },
  {
    name: 'processable.mediaFound',
    functionName: 'isProcessableMedia',
    line: 'if (mediaElement) {',
    capture: 'media',
  },
  {
    name: 'processable.mediaUrl',
    functionName: 'isProcessableMedia',
    line: 'if (url && (url.startsWith("blob:") || isValidMediaUrl(url))) return !(mediaElement instanceof HTMLImageElement) || isPhotoHit(htmlTarget, mediaElement, event);',
  },
  {
    name: 'processable.fallback',
    functionName: 'isProcessableMedia',
    line: 'return !!htmlTarget.closest(MEDIA_CONTAINER_SELECTOR);',
  },
  {
    name: 'block.enter',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (!target) return false;',
  },
  {
    name: 'block.videoMode',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (!isVideoClickAllowed(target, event ? () => event.composedPath() : void 0, videoMode)) return true;',
  },
  {
    name: 'block.rootOverlay',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (closestSafe(target, CSS.SELECTORS.ROOT) || closestSafe(target, CSS.SELECTORS.OVERLAY)) return true;',
  },
  {
    name: 'block.cardWrapper',
    functionName: 'shouldBlockMediaTrigger',
    line: String.raw`const cardWrapper = target.closest("[data-testid=\"card.wrapper\"]");`,
  },
  {
    name: 'block.cardResult',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (cardWrapper instanceof HTMLElement) return !isMediaCard(cardWrapper);',
  },
  {
    name: 'block.blockedContext',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (target.closest(blockedContext)) return true;',
  },
  {
    name: 'block.interactive',
    functionName: 'shouldBlockMediaTrigger',
    line: 'const interactive = target.closest(INTERACTIVE_SELECTOR);',
  },
  {
    name: 'block.interactiveBranch',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (interactive) {',
  },
  {
    name: 'block.link',
    functionName: 'shouldBlockMediaTrigger',
    line: 'if (interactive instanceof HTMLAnchorElement && !isNativeStatusMediaLink(interactive.getAttribute("href"))) return true;',
  },
  { name: 'block.allowed', functionName: 'shouldBlockMediaTrigger', line: 'return false;' },
  {
    name: 'photo.enter',
    functionName: 'isPhotoHit',
    line: 'const photoLink = target.closest("a[href]");',
    capture: 'photo',
  },
  {
    name: 'photo.nativeLink',
    functionName: 'isPhotoHit',
    line: 'if (href && isHostMatching(href, TWITTER_HOSTS) && STATUS_PHOTO_RE.test(href.pathname)) return true;',
  },
  { name: 'photo.pointer', functionName: 'isPhotoHit', line: 'if (event && event.detail > 0) {' },
  {
    name: 'photo.pointerBounds',
    functionName: 'isPhotoHit',
    line: 'if (bounds.width > 0 && bounds.height > 0) return event.clientX >= bounds.left && event.clientX < bounds.right && event.clientY >= bounds.top && event.clientY < bounds.bottom;',
  },
  {
    name: 'photo.tweetPhoto',
    functionName: 'isPhotoHit',
    line: String.raw`if (target === image || target.closest("[data-testid=\"tweetPhoto\"]")?.contains(image)) return true;`,
  },
  {
    name: 'photo.link',
    functionName: 'isPhotoHit',
    line: 'const link = target.closest("a[href]");',
  },
  {
    name: 'photo.linkContainsImage',
    functionName: 'isPhotoHit',
    line: 'if (link.contains(image)) return !link.textContent?.trim();',
  },
  {
    name: 'photo.siblingOverlay',
    functionName: 'isPhotoHit',
    line: 'const matchesImageLink = imageLink instanceof HTMLAnchorElement && imageLink.getAttribute("href") === link.getAttribute("href");',
  },
  {
    name: 'photo.siblingRejected',
    functionName: 'isPhotoHit',
    line: 'if (!link.getAttribute("aria-label")?.trim() && !matchesImageLink || link.textContent?.trim() || link.childElementCount > 0 || parent?.children.length !== 2 || !Array.from(parent.children).some((sibling) => sibling !== link && sibling.contains(image))) return false;',
  },
  {
    name: 'photo.siblingGeometry',
    functionName: 'isPhotoHit',
    line: 'if (linkBounds.width > 0 && linkBounds.height > 0 && imageBounds.width > 0 && imageBounds.height > 0) return Math.abs(linkBounds.left - imageBounds.left) <= 1 && Math.abs(linkBounds.right - imageBounds.right) <= 1 && Math.abs(linkBounds.top - imageBounds.top) <= 1 && Math.abs(linkBounds.bottom - imageBounds.bottom) <= 1;',
  },
  { name: 'photo.fallbackTrue', functionName: 'isPhotoHit', line: 'return true;' },
];

export type ClickAdmissionSite = { name: string; lineNumber: number; capture?: 'media' | 'photo' };

/** Resolve every observed site against the exact executable, never source-map guesses. */
export function resolveClickAdmissionSites(source: string): ClickAdmissionSite[] {
  const lines = source.split(/\r?\n/u);
  const sections = new Map<string, { start: number; end: number }>();
  for (const name of new Set(STAGES.map((site) => site.functionName))) {
    const starts = lines.flatMap((line, index) =>
      line.trimStart().startsWith(`${name === 'handleMediaClick' ? 'async ' : ''}function ${name}(`)
        ? [index]
        : []
    );
    assert.equal(starts.length, 1, `Expected exactly one ${name} in the installed content script`);
    const start = starts[0]!;
    const next = lines.findIndex(
      (line, index) => index > start && /^\s*(?:async )?function [A-Za-z_$][\w$]*\(/u.test(line)
    );
    assert(next > start, `Missing bound for ${name}`);
    sections.set(name, { start, end: next });
  }
  return STAGES.map((site) => {
    const section = sections.get(site.functionName)!;
    const matches = lines.flatMap((line, index) =>
      index >= section.start && index < section.end && line.trim() === site.line ? [index] : []
    );
    const occurrence = site.occurrence ?? 0;
    assert.equal(
      matches.length,
      site.occurrence === undefined ? 1 : occurrence + 1,
      `Expected source line for ${site.name}`
    );
    return {
      name: site.name,
      lineNumber: matches[occurrence]!,
      ...(site.capture ? { capture: site.capture } : {}),
    };
  });
}

type ClickTraceEvent = {
  stage: string;
  timeStamp: number;
  detail: number;
  defaultPrevented: boolean;
  targetTag: string;
  targetTestId: string | null;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  mediaDetectionEnabled?: boolean;
  context?: string | null;
  videoClickMode?: 'allow-all' | 'block-all' | 'block-controls-only';
  media?: { tag: string; host: string | null; path: string | null; pointInside: boolean | null };
};

export function sanitizeClickAdmissionEvent(raw: unknown): ClickTraceEvent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (!STAGES.some((stage) => stage.name === record.stage)) {
    return null;
  }
  if (typeof record.timeStamp !== 'number' || !Number.isFinite(record.timeStamp)) {
    return null;
  }
  if (typeof record.detail !== 'number' || !Number.isInteger(record.detail)) {
    return null;
  }
  if (typeof record.defaultPrevented !== 'boolean') {
    return null;
  }
  if (typeof record.targetTag !== 'string' || !/^[A-Z]{1,16}$/u.test(record.targetTag)) {
    return null;
  }
  if (
    record.targetTestId !== null &&
    (typeof record.targetTestId !== 'string' || !/^[A-Za-z0-9_-]{1,60}$/u.test(record.targetTestId))
  ) {
    return null;
  }
  for (const key of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const) {
    if (typeof record[key] !== 'boolean') {
      return null;
    }
  }
  const event: ClickTraceEvent = {
    stage: record.stage as string,
    timeStamp: record.timeStamp,
    detail: record.detail,
    defaultPrevented: record.defaultPrevented,
    targetTag: record.targetTag,
    targetTestId: record.targetTestId,
    altKey: record.altKey as boolean,
    ctrlKey: record.ctrlKey as boolean,
    metaKey: record.metaKey as boolean,
    shiftKey: record.shiftKey as boolean,
  };
  if (record.mediaDetectionEnabled !== undefined) {
    if (typeof record.mediaDetectionEnabled !== 'boolean') {
      return null;
    }
    event.mediaDetectionEnabled = record.mediaDetectionEnabled;
  }
  if (record.context !== undefined) {
    if (
      record.context !== null &&
      (typeof record.context !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/u.test(record.context))
    ) {
      return null;
    }
    event.context = record.context;
  }
  if (record.videoClickMode !== undefined) {
    if (
      record.videoClickMode !== 'allow-all' &&
      record.videoClickMode !== 'block-all' &&
      record.videoClickMode !== 'block-controls-only'
    ) {
      return null;
    }
    event.videoClickMode = record.videoClickMode;
  }
  const media = record.media;
  if (media !== undefined) {
    if (!media || typeof media !== 'object' || Array.isArray(media)) {
      return null;
    }
    const item = media as Record<string, unknown>;
    if (item.tag !== 'IMG' && item.tag !== 'VIDEO') {
      return null;
    }
    if (item.host !== null && !['pbs.twimg.com', 'video.twimg.com'].includes(String(item.host))) {
      return null;
    }
    if (
      item.path !== null &&
      (typeof item.path !== 'string' || !/^\/[A-Za-z0-9/_.-]{1,200}$/u.test(item.path))
    ) {
      return null;
    }
    if (item.pointInside !== null && typeof item.pointInside !== 'boolean') {
      return null;
    }
    event.media = {
      tag: item.tag,
      host: item.host as string | null,
      path: item.path as string | null,
      pointInside: item.pointInside as boolean | null,
    };
  }
  return event;
}

function logpointCondition(
  site: ClickAdmissionSite,
  bindingName: string,
  statusPath: string,
  actionPath: string
): string {
  const mediaExpression =
    site.capture === 'media' ? 'mediaElement' : site.capture === 'photo' ? 'image' : null;
  const candidate = mediaExpression
    ? `const media = ${mediaExpression}; let selected = null; if (media instanceof HTMLImageElement || media instanceof HTMLVideoElement) { let url = null; try { url = new URL(media.currentSrc || media.src); } catch {} const rect = media.getBoundingClientRect(); selected = { tag: media.tagName, host: url && ['pbs.twimg.com','video.twimg.com'].includes(url.hostname.toLowerCase()) ? url.hostname.toLowerCase() : null, path: url && /^[\\/A-Za-z0-9_.-]{2,201}$/.test(url.pathname) ? url.pathname : null, pointInside: event ? event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom : null }; }`
    : 'const selected = null;';
  const settings =
    site.name === 'handler.enter'
      ? `const detected = typeof options.enableMediaDetection === 'boolean' ? options.enableMediaDetection : null; const context = typeof options.context === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(options.context) ? options.context : null;`
      : site.name === 'block.videoMode'
        ? `const mode = ['allow-all','block-all','block-controls-only'].includes(videoMode) ? videoMode : null;`
        : '';
  const settingsRecord =
    site.name === 'handler.enter'
      ? `...(detected === null ? {} : { mediaDetectionEnabled: detected }), context,`
      : site.name === 'block.videoMode'
        ? `...(mode ? { videoClickMode: mode } : {}),`
        : '';
  return `(() => { try { const e = event; if (!e?.isTrusted || e.button !== 0 || !(e.target instanceof Element) || location.pathname !== ${JSON.stringify(statusPath)}) return false; const p = e.composedPath(); if (!p.some(n => n instanceof HTMLAnchorElement && n.pathname === ${JSON.stringify(actionPath)})) return false; ${candidate} ${settings} const t = e.target; const id = t.getAttribute('data-testid'); globalThis[${JSON.stringify(bindingName)}](JSON.stringify({ stage: ${JSON.stringify(site.name)}, timeStamp: e.timeStamp, detail: e.detail, defaultPrevented: e.defaultPrevented, targetTag: t.tagName, targetTestId: id && /^[A-Za-z0-9_-]{1,60}$/.test(id) ? id : null, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, ${settingsRecord} ...(selected ? { media: selected } : {}) })); } catch {} return false; })()`;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function waitFor<T>(read: () => T | null, label: string): Promise<T> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const value = read();
    if (value !== null) {
      return value;
    }
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`${label} was not observed`);
}

/** The click remains a normal Playwright action; observation cannot change admission. */
export async function withClickAdmissionTrace<T>(options: {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  root: string;
  output: string;
  index: string | number;
  statusPath: string;
  actionPath: string;
  action: () => Promise<T>;
}): Promise<T> {
  const name = `__xegClickAdmission482${randomUUID().replaceAll('-', '')}`;
  const receipt: Record<string, unknown> = {
    schemaVersion: 1,
    kind: 'installed-extension-live-click-admission',
    status: 'incomplete',
    source: null,
    target: { statusPath: options.statusPath, actionPath: options.actionPath },
    events: [],
    overflow: false,
    invalidEvents: 0,
    cleanup: {
      breakpointsRemoved: false,
      bindingRemoved: false,
      globalBinding: 'not-installed',
      sessionDetached: false,
    },
  };
  const events = receipt.events as ClickTraceEvent[];
  const cleanup = receipt.cleanup as Record<string, boolean | string>;
  let cdp: CDPSession | null = null;
  const breakpoints: string[] = [];
  let bindingAdded = false;
  let result!: T;
  let failure: unknown;
  const cleanupErrors: string[] = [];
  let realmId: number | null = null;
  let realmDestroyed = false;
  try {
    assert.equal(options.page.context(), options.context);
    assert(
      isAbsolute(options.root) && isAbsolute(options.output),
      'Click diagnostic paths must be absolute'
    );
    assert(/^[a-p]{32}$/u.test(options.extensionId), 'Invalid installed extension ID');
    assert(/^\/[A-Za-z0-9_/-]+$/u.test(options.statusPath), 'Invalid status path');
    assert(/^\/[A-Za-z0-9_/-]+$/u.test(options.actionPath), 'Invalid photo action path');
    assert.equal(new URL(options.page.url()).pathname, options.statusPath);
    assert(/^[A-Za-z0-9-]{1,48}$/u.test(String(options.index)), 'Invalid observation index');
    const source = await readFile(join(options.root, 'dist-extension/content.js'), 'utf8');
    const sites = resolveClickAdmissionSites(source);
    cdp = await options.context.newCDPSession(options.page);
    const scripts: Array<{ scriptId: string; url: string }> = [];
    const realms: Array<{
      id: number;
      origin: string;
      auxData?: { frameId?: string; isDefault?: boolean };
    }> = [];
    cdp.on('Debugger.scriptParsed', (item: { scriptId: string; url: string }) => {
      if (item.url === CONTENT_URL(options.extensionId)) {
        scripts.push(item);
      }
    });
    cdp.on(
      'Runtime.executionContextCreated',
      (item: {
        context: {
          id: number;
          origin: string;
          auxData?: { frameId?: string; isDefault?: boolean };
        };
      }) => {
        if (realms.length < 64) {
          realms.push(item.context);
        }
      }
    );
    cdp.on('Runtime.executionContextDestroyed', (item: { executionContextId: number }) => {
      if (item.executionContextId === realmId) {
        realmDestroyed = true;
      }
    });
    cdp.on(
      'Runtime.bindingCalled',
      (item: { name: string; payload: string; executionContextId: number }) => {
        if (item.name !== name) {
          return;
        }
        if (item.payload.length > 2048 || item.executionContextId !== realmId) {
          receipt.invalidEvents = Number(receipt.invalidEvents ?? 0) + 1;
          return;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(item.payload);
        } catch {
          receipt.invalidEvents = Number(receipt.invalidEvents ?? 0) + 1;
          return;
        }
        const event = sanitizeClickAdmissionEvent(parsed);
        if (!event) {
          receipt.invalidEvents = Number(receipt.invalidEvents ?? 0) + 1;
          return;
        }
        if (events.length === MAX_EVENTS) {
          receipt.overflow = true;
        } else {
          events.push(event);
        }
      }
    );
    const { frameTree } = await cdp.send('Page.getFrameTree');
    await cdp.send('Runtime.enable');
    await cdp.send('Debugger.enable');
    await waitFor(() => scripts[0] ?? null, 'Installed content script');
    assert.equal(scripts.length, 1, 'Installed content script identity is ambiguous');
    const script = scripts[0]!;
    const executed = await cdp.send('Debugger.getScriptSource', { scriptId: script.scriptId });
    assert.equal(
      sha256(executed.scriptSource),
      sha256(source),
      'Executed content script differs from installed artifact'
    );
    const findMatchingRealms = () =>
      realms.filter(
        (realm) =>
          (realm.origin === `chrome-extension://${options.extensionId}` ||
            realm.origin === `chrome-extension://${options.extensionId}/`) &&
          realm.auxData?.frameId === frameTree.frame.id &&
          realm.auxData.isDefault === false
      );
    await waitFor(() => findMatchingRealms()[0] ?? null, 'Installed content realm');
    const matchingRealms = findMatchingRealms();
    assert.equal(matchingRealms.length, 1, 'Installed content realm is ambiguous');
    const realm = matchingRealms[0]!;
    realmId = realm.id;
    receipt.source = {
      artifactSha256: sha256(source),
      executedSha256: sha256(executed.scriptSource),
      siteCount: sites.length,
    };
    const bodyObject = await cdp.send('Runtime.evaluate', {
      expression: 'document.body',
      contextId: realm.id,
      objectGroup: name,
    });
    assert(bodyObject.result.objectId, 'Installed page body was not observed');
    try {
      const inventory = await cdp.send('DOMDebugger.getEventListeners', {
        objectId: bodyObject.result.objectId,
        depth: 0,
      });
      const clickListeners = inventory.listeners.filter(
        (item: { type: string }) => item.type === 'click'
      );
      const product = clickListeners.filter(
        (item: { scriptId: string }) => item.scriptId === script.scriptId
      );
      receipt.listenerInventory = {
        bodyClickCount: clickListeners.length,
        productBodyClick: product.map(
          (item: {
            lineNumber: number;
            columnNumber: number;
            useCapture: boolean;
            passive: boolean;
            once: boolean;
          }) => ({
            lineNumber: item.lineNumber,
            columnNumber: item.columnNumber,
            capture: item.useCapture,
            passive: item.passive,
            once: item.once,
          })
        ),
      };
    } finally {
      await cdp.send('Runtime.releaseObjectGroup', { objectGroup: name });
    }
    await cdp.send('Runtime.addBinding', { name, executionContextId: realm.id });
    bindingAdded = true;
    cleanup.globalBinding = 'pending';
    for (const site of sites) {
      const bound: {
        breakpointId: string;
        locations?: Array<{ scriptId: string; lineNumber: number }>;
      } = await cdp.send('Debugger.setBreakpointByUrl', {
        url: script.url,
        lineNumber: site.lineNumber,
        condition: logpointCondition(site, name, options.statusPath, options.actionPath),
      });
      assert(
        bound.locations?.some(
          (point: { scriptId: string; lineNumber: number }) =>
            point.scriptId === script.scriptId && point.lineNumber === site.lineNumber
        ),
        `Click logpoint did not bind: ${site.name}`
      );
      breakpoints.push(bound.breakpointId);
    }
    result = await options.action();
    await new Promise((done) => setTimeout(done, 100));
    receipt.status =
      events.length && !receipt.overflow && !receipt.invalidEvents ? 'captured' : 'incomplete';
  } catch (error) {
    failure = error;
    receipt.failure = error instanceof Error ? error.name : 'Error';
  } finally {
    if (cdp) {
      for (const breakpointId of breakpoints) {
        try {
          await cdp.send('Debugger.removeBreakpoint', { breakpointId });
        } catch {
          cleanupErrors.push('breakpoint');
        }
      }
      cleanup.breakpointsRemoved = cleanupErrors.every((value) => value !== 'breakpoint');
      if (bindingAdded) {
        if (realmDestroyed) {
          cleanup.globalBinding = 'context-destroyed';
        } else {
          try {
            const removed = await cdp.send('Runtime.callFunctionOn', {
              executionContextId: realmId!,
              functionDeclaration:
                'function(key) { const removed = delete globalThis[key]; return removed && !Object.prototype.hasOwnProperty.call(globalThis, key); }',
              arguments: [{ value: name }],
              returnByValue: true,
            });
            assert.equal(removed.result.value, true, 'Click diagnostic global binding remained');
            cleanup.globalBinding = 'removed';
          } catch {
            cleanup.globalBinding = realmDestroyed ? 'context-destroyed' : 'failed';
            if (!realmDestroyed) {
              cleanupErrors.push('global-binding');
            }
          }
        }
        try {
          await cdp.send('Runtime.removeBinding', { name });
          cleanup.bindingRemoved = true;
        } catch {
          cleanupErrors.push('binding');
        }
      } else {
        cleanup.bindingRemoved = true;
      }
      try {
        await cdp.detach();
        cleanup.sessionDetached = true;
      } catch {
        cleanupErrors.push('session');
      }
    }
    receipt.cleanupErrors = cleanupErrors;
    if (cleanupErrors.length) {
      receipt.status = 'incomplete';
    }
    try {
      await writeFile(
        join(options.output, `live-click-admission-${options.index}.json`),
        `${JSON.stringify(receipt, null, 2)}\n`,
        { flag: 'wx', mode: 0o600 }
      );
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure) {
    throw failure;
  }
  assert.equal(receipt.status, 'captured', 'Live click admission diagnostic was incomplete');
  return result;
}
