// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ACTION_TIMEOUT_MS = 15_000;
const NAVIGATION_TIMEOUT_MS = 45_000;
const READINESS_TIMEOUT_MS = 20_000;
const MAX_DIAGNOSTICS = 50;
const LIVE_URL_PATTERN = /^https:\/\/(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)$/u;

export function validateLiveUrls(values) {
  if (!Array.isArray(values)) throw new Error('X live URLs must be an array');
  if (values.length > 3) throw new Error('At most three X live URLs are supported');
  return values.map((value) => {
    if (typeof value !== 'string' || /[\s\\]/u.test(value) || !LIVE_URL_PATTERN.test(value)) {
      throw new Error('Live URL must be an exact public X or Twitter status HTTPS URL');
    }
    const url = new URL(value);
    if (url.username || url.password || url.port || url.search || url.hash) {
      throw new Error('Live URL must not contain credentials, ports, query, or fragment');
    }
    return value;
  });
}

export function validateLiveObservation(value) {
  if (value !== null) throw new Error('X live status validation does not support duration mode');
}

function targetIdentity(value) {
  const match = LIVE_URL_PATTERN.exec(value);
  if (!match) throw new Error('Validated live URL lost its status identity');
  return { handle: match[2], statusId: match[3] };
}

function sanitizedUrl(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'chrome-extension:', 'about:'].includes(url.protocol)) return url.protocol;
    if (url.protocol === 'about:') return 'about:blank';
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return '[invalid-url]';
  }
}

function sanitizedText(value, maximum = 600) {
  return String(value)
    .replace(/https?:\/\/[^\s<>"']+/giu, (match) => sanitizedUrl(match.replace(/[),.;]+$/u, '')))
    .replace(/\bBearer\s+[^\s,;]+/giu, 'Bearer [redacted]')
    .replace(/\b(token|authorization|auth|api[_-]?key|code|state|session|cookie)\s*([=:])\s*[^\s,;]+/giu, '$1$2[redacted]')
    .replace(/[A-Za-z]:\\[^\r\n\t]*/gu, '[path]')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, maximum);
}

function safeError(error) {
  return sanitizedText(error instanceof Error ? `${error.name}: ${error.message}` : error, 2_000);
}

function addBounded(list, value, observation, overflowKey) {
  if (list.length < MAX_DIAGNOSTICS) list.push(value);
  else observation[overflowKey] += 1;
}

function isProductConsoleError(record) {
  return record.location.startsWith('chrome-extension:') ||
    /\bXEG\b|X\.com Enhanced Gallery|\[(?:MediaExtractor|DOMFallbackExtractor|Gallery)\]/iu.test(
      record.text
    );
}

function attachDiagnostics(page, observation) {
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const record = {
      kind: 'console',
      location: sanitizedUrl(message.location().url || 'about:blank'),
      text: sanitizedText(message.text()),
    };
    const product = isProductConsoleError(record);
    addBounded(
      product ? observation.productErrors : observation.hostDiagnostics,
      record,
      observation,
      product ? 'productErrorOverflow' : 'hostDiagnosticOverflow'
    );
  });
  page.on('pageerror', (error) => {
    addBounded(
      observation.pageErrors,
      { kind: 'page-error', name: sanitizedText(error.name, 100), message: sanitizedText(error.message) },
      observation,
      'pageErrorOverflow'
    );
  });
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/TweetResultByRestId')) {
      observation.api.tweetResultByRestId.requests += 1;
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    const path = new URL(url).pathname;
    if (path.endsWith('/TweetResultByRestId')) {
      observation.api.tweetResultByRestId.responses.push(response.status());
    }
    if (response.status() >= 400) {
      addBounded(
        observation.hostDiagnostics,
        { kind: 'http-response', status: response.status(), url: sanitizedUrl(url) },
        observation,
        'hostDiagnosticOverflow'
      );
    }
  });
  page.on('requestfailed', (request) => {
    const record = {
      kind: 'request-failed',
      error: sanitizedText(request.failure()?.errorText ?? 'unknown', 200),
      url: sanitizedUrl(request.url()),
    };
    const product = record.url.startsWith('chrome-extension:');
    addBounded(
      product ? observation.productErrors : observation.hostDiagnostics,
      record,
      observation,
      product ? 'productErrorOverflow' : 'hostDiagnosticOverflow'
    );
  });
}

async function hostSnapshot(page) {
  return page.evaluate(() => {
    const style = document.body.style;
    return {
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
    };
  });
}

async function waitForRestoredHostState(page, actionHandle, before) {
  const deadline = Date.now() + 3_000;
  let state;
  do {
    const after = await hostSnapshot(page);
    const focusRestored = await actionHandle.evaluate(
      (element) => document.activeElement === element
    ).catch(() => false);
    state = {
      after,
      focusRestored,
      bodyStylesRestored: JSON.stringify(after.bodyStyle) === JSON.stringify(before.bodyStyle),
      scrollRestorationRestored: after.scrollRestoration === before.scrollRestoration,
      scrollRestored: after.scrollY === before.scrollY,
    };
    if (state.focusRestored && state.bodyStylesRestored &&
        state.scrollRestorationRestored && state.scrollRestored) return state;
    await page.waitForTimeout(50);
  } while (Date.now() < deadline);
  return state;
}

async function captureScreenshot(page, output, filename) {
  await page.screenshot({ path: join(output, filename) });
  return filename;
}

async function waitForReadiness(page, identity) {
  return page.waitForFunction(
    ({ handle, statusId }) => {
      const exactPath = `/${handle}/status/${statusId}`.toLowerCase();
      const targetArticle = [...document.querySelectorAll('article')].some((article) =>
        [...article.querySelectorAll('a[href]')].some((anchor) => {
          try {
            const url = new URL(anchor.href, location.href);
            return anchor.closest('article') === article &&
              ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
              url.pathname.toLowerCase() === exactPath;
          } catch {
            return false;
          }
        })
      );
      const text = document.body?.innerText ?? '';
      return targetArticle || /verify you are human|unusual activity|captcha|this post is unavailable|page doesn.?t exist/iu.test(text);
    },
    identity,
    { timeout: READINESS_TIMEOUT_MS, polling: 200 }
  );
}

async function inspectTarget(page, identity) {
  return page.evaluate(({ handle, statusId }) => {
    const statusPath = `/${handle}/status/${statusId}`.toLowerCase();
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' &&
        Number(style.opacity) !== 0 && rectangle.width > 0 && rectangle.height > 0;
    };
    const parseLink = (anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        if (!['x.com', 'twitter.com'].includes(url.hostname.toLowerCase())) return null;
        return { host: url.hostname.toLowerCase(), path: url.pathname };
      } catch {
        return null;
      }
    };
    const parseMedia = (image) => {
      for (const value of [image.currentSrc, image.src, image.getAttribute('src')]) {
        try {
          const url = new URL(value, location.href);
          if (url.protocol === 'https:' && url.hostname.toLowerCase() === 'pbs.twimg.com' &&
              url.pathname.startsWith('/media/')) {
            return { host: url.hostname.toLowerCase(), path: url.pathname };
          }
        } catch {
          // Try the next image source candidate.
        }
      }
      return null;
    };

    const articles = [...document.querySelectorAll('article')];
    for (let articleIndex = 0; articleIndex < articles.length; articleIndex += 1) {
      const article = articles[articleIndex];
      const anchors = [...article.querySelectorAll('a[href]')];
      const ownsStatus = anchors.some((anchor) => {
        const link = parseLink(anchor);
        return anchor.closest('article') === article && link?.path.toLowerCase() === statusPath;
      });
      if (!ownsStatus) continue;

      const images = [...article.querySelectorAll('img')];
      for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
        const image = images[imageIndex];
        const source = parseMedia(image);
        if (image.closest('article') !== article || !source || !isVisible(image) ||
            !image.complete || image.naturalWidth <= 0) continue;
        return {
          articleIndex,
          imageIndex,
          imageLoaded: true,
          imageSource: source,
          imageVisible: true,
        };
      }
    }
    return null;
  }, identity);
}

async function waitForTarget(page, identity) {
  const deadline = Date.now() + READINESS_TIMEOUT_MS;
  let target;
  do {
    target = await inspectTarget(page, identity);
    if (target) return target;
    await page.waitForTimeout(200);
  } while (Date.now() < deadline);
  return null;
}

async function inspectHitTestedAction(image, identity) {
  return image.evaluate((element, { handle, statusId }) => {
    const article = element.closest('article');
    if (!(element instanceof HTMLImageElement) || !article) return null;
    const mediaPath = new RegExp(`^/${handle}/status/${statusId}/photo/\\d+$`, 'iu');
    const anchors = [...article.querySelectorAll('a[href]')];
    const parseLink = (anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        return ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) ? url : null;
      } catch {
        return null;
      }
    };
    const rectangle = element.getBoundingClientRect();
    if (rectangle.bottom <= 0 || rectangle.top >= innerHeight ||
        rectangle.right <= 0 || rectangle.left >= innerWidth) return null;
    const x = Math.max(0, Math.min(innerWidth - 1, rectangle.left + rectangle.width / 2));
    const y = Math.max(0, Math.min(innerHeight - 1, rectangle.top + rectangle.height / 2));
    const hitAnchors = [...new Set(document.elementsFromPoint(x, y)
      .map((candidate) => candidate.closest('a[href]')).filter(Boolean))];
    const action = hitAnchors.find((anchor) => {
      const url = parseLink(anchor);
      return anchor.closest('article') === article && url && mediaPath.test(url.pathname);
    });
    if (!action) return null;
    const actionUrl = parseLink(action);
    const duplicateActionCount = anchors.filter((anchor) => {
      const url = parseLink(anchor);
      return anchor.closest('article') === article && url?.pathname === actionUrl.pathname;
    }).length;
    return {
      actionAriaLabel: action.getAttribute('aria-label'),
      actionIndex: anchors.indexOf(action),
      actionPath: actionUrl.pathname,
      duplicateActionCount,
    };
  }, identity);
}

async function observeOne(context, extensionId, targetUrl, output, index) {
  const identity = targetIdentity(targetUrl);
  const page = await context.newPage();
  const observation = {
    schemaVersion: 1,
    kind: 'public-x-status-observation',
    requestedUrl: targetUrl,
    finalUrl: null,
    responseStatus: null,
    extension: { id: extensionId, readinessMarker: false },
    target: null,
    gallery: { status: 'not-run' },
    api: { tweetResultByRestId: { requests: 0, responses: [] } },
    productErrors: [],
    productErrorOverflow: 0,
    pageErrors: [],
    pageErrorOverflow: 0,
    hostDiagnostics: [],
    hostDiagnosticOverflow: 0,
    screenshots: {},
    missingAssertions: [],
    evidenceStatus: 'unverified',
    status: 'pending',
  };
  attachDiagnostics(page, observation);
  let actionHandle;
  try {
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    observation.responseStatus = response?.status() ?? null;
    observation.finalUrl = sanitizedUrl(page.url());
    await waitForReadiness(page, identity);
    observation.target = await waitForTarget(page, identity);
    if (!observation.target) {
      observation.missingAssertions.push('loadedTargetImage');
      throw new Error('Exact target article with a loaded host media action was not found');
    }
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached',
      timeout: ACTION_TIMEOUT_MS,
    }).catch(() => {});
    observation.extension.readinessMarker = await page.locator(
      'html[data-xeg-gallery-ready="true"]'
    ).count() === 1;
    if (!observation.extension.readinessMarker) {
      observation.missingAssertions.push('extensionInjected');
      throw new Error('Installed extension readiness marker was not observed');
    }

    const article = page.locator('article').nth(observation.target.articleIndex);
    const image = article.locator('img').nth(observation.target.imageIndex);
    await image.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
    const actionIdentity = await inspectHitTestedAction(image, identity);
    if (!actionIdentity) throw new Error('No owned top media action was found by hit test');
    observation.target = { ...observation.target, ...actionIdentity };
    const action = article.locator('a[href]').nth(actionIdentity.actionIndex);
    actionHandle = await action.elementHandle();
    if (!actionHandle) throw new Error('Selected target action detached before interaction');
    await action.focus({ timeout: ACTION_TIMEOUT_MS });
    if ((await hostSnapshot(page)).scrollY === 0) await page.mouse.wheel(0, 160);
    await action.focus({ timeout: ACTION_TIMEOUT_MS });
    const before = await hostSnapshot(page);
    const focusPrepared = await actionHandle.evaluate((element) => document.activeElement === element);
    observation.gallery = { status: 'attempting', before, focusPrepared };
    observation.screenshots.before = await captureScreenshot(
      page,
      output,
      `live-page-${index}-before.png`
    );

    const identityBeforeClick = await actionHandle.evaluate((element, expected) => {
      const article = element.closest('article');
      if (!(element instanceof HTMLAnchorElement) || !article) return false;
      const rectangle = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rectangle.left + rectangle.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rectangle.top + rectangle.height / 2));
      const topAction = document.elementsFromPoint(x, y)
        .map((candidate) => candidate.closest('a[href]')).find(Boolean);
      return topAction === element && element.closest('article') === article &&
        new URL(element.href, location.href).pathname === expected.actionPath;
    }, { actionPath: observation.target.actionPath });
    observation.gallery.identityBeforeClick = identityBeforeClick;
    if (!identityBeforeClick) throw new Error('Top media action identity changed before click');

    await actionHandle.click({ timeout: ACTION_TIMEOUT_MS });
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
    const imageReady = await page.waitForFunction((expectedPath) =>
      [...document.querySelectorAll('[data-xeg-gallery-container] [data-gallery-element="item"] img')]
        .some((candidate) => {
          if (!(candidate instanceof HTMLImageElement) || !candidate.complete ||
              candidate.naturalWidth <= 0) return false;
          try {
            const url = new URL(candidate.currentSrc || candidate.src);
            return url.hostname === 'pbs.twimg.com' && url.pathname === expectedPath;
          } catch {
            return false;
          }
        }),
    observation.target.imageSource.path, {
      timeout: ACTION_TIMEOUT_MS,
      polling: 100,
    }).then(() => true, () => false);
    observation.gallery.opened = {
      ariaModal: await gallery.getAttribute('aria-modal'),
      imageReady,
      imageSource: observation.target.imageSource,
      role: await gallery.getAttribute('role'),
    };
    observation.screenshots.open = await captureScreenshot(
      page,
      output,
      `live-page-${index}-gallery.png`
    );

    await page.keyboard.press('Escape');
    const detached = await gallery.waitFor({ state: 'detached', timeout: ACTION_TIMEOUT_MS })
      .then(() => true, () => false);
    const restored = await waitForRestoredHostState(page, actionHandle, before);
    const { after, focusRestored } = restored;
    observation.gallery = {
      ...observation.gallery,
      status: 'observed',
      closeMethod: 'Escape',
      detached,
      focusRestored,
      after,
      bodyStylesRestored: restored.bodyStylesRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      scrollRestored: restored.scrollRestored,
    };
    observation.screenshots.after = await captureScreenshot(
      page,
      output,
      `live-page-${index}-after.png`
    );
    await page.waitForTimeout(100);

    const finalUrl = new URL(page.url());
    const finalPath = finalUrl.pathname.toLowerCase();
    const expectedPath = `/${identity.handle}/status/${identity.statusId}`.toLowerCase();
    const required = {
      exactFinalStatus: ['x.com', 'twitter.com'].includes(finalUrl.hostname.toLowerCase()) &&
        finalPath === expectedPath,
      extensionInjected: observation.extension.readinessMarker,
      loadedTargetImage: observation.target.imageLoaded && observation.target.imageVisible,
      topActionIdentity: identityBeforeClick,
      galleryDialog: observation.gallery.opened.role === 'dialog' &&
        observation.gallery.opened.ariaModal === 'true',
      galleryHostImage: observation.gallery.opened.imageReady,
      escapeClosed: detached,
      exactFocusRestored: focusRestored,
      nonzeroScrollPrepared: before.scrollY > 0,
      scrollRestored: after.scrollY === before.scrollY,
      scrollRestorationRestored: after.scrollRestoration === before.scrollRestoration,
      bodyStylesRestored: JSON.stringify(after.bodyStyle) === JSON.stringify(before.bodyStyle),
      noProductErrors: observation.productErrors.length === 0 &&
        observation.productErrorOverflow === 0,
      noPageErrors: observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0,
    };
    observation.requiredAssertions = required;
    observation.missingAssertions = Object.entries(required)
      .filter(([, passed]) => !passed).map(([name]) => name);
    if (observation.missingAssertions.length) {
      throw new Error(`Missing live assertions: ${observation.missingAssertions.join(', ')}`);
    }
    observation.status = 'core-flow-observed';
    observation.evidenceStatus = observation.hostDiagnostics.length ||
      observation.hostDiagnosticOverflow > 0
      ? 'unverified'
      : 'observed';
  } catch (error) {
    observation.status = 'failed';
    observation.error = safeError(error);
    const errorScreenshot = `live-page-${index}-error.png`;
    if (await page.screenshot({ path: join(output, errorScreenshot) })
      .then(() => true, () => false)) {
      observation.screenshots.error = errorScreenshot;
    }
  } finally {
    if (actionHandle) await actionHandle.dispose().catch(() => {});
    observation.finalUrl = sanitizedUrl(page.url());
    await writeFile(
      join(output, `live-page-${index}.json`),
      JSON.stringify(observation, null, 2)
    );
    await page.close().catch(() => {});
  }
  return observation;
}

export async function observeLiveUrls({ context, extensionId, liveUrls, output }) {
  const urls = validateLiveUrls(liveUrls);
  if (!urls.length) {
    return { status: 'not-requested', evidenceStatus: 'not-applicable', pages: [] };
  }
  const pages = [];
  for (let index = 0; index < urls.length; index += 1) {
    pages.push(await observeOne(context, extensionId, urls[index], output, index + 1));
  }
  const failed = pages.filter((page) => page.status === 'failed');
  const summary = {
    status: failed.length ? 'failed' : 'core-flow-observed',
    evidenceStatus: pages.every((page) => page.evidenceStatus === 'observed')
      ? 'observed'
      : 'unverified',
    pages,
  };
  await writeFile(join(output, 'live-observations.json'), JSON.stringify(summary, null, 2));
  if (failed.length) {
    const error = new AggregateError(
      failed.map((page) => new Error(page.error)),
      `${failed.length} live X observation(s) missed required assertions`
    );
    error.summary = summary;
    throw error;
  }
  return summary;
}
