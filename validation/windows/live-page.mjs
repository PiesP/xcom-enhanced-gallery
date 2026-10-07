// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ACTION_TIMEOUT_MS = 15_000;
const NAVIGATION_TIMEOUT_MS = 45_000;
const READINESS_TIMEOUT_MS = 20_000;
const MAX_DIAGNOSTICS = 50;
const MAX_API_OBSERVATIONS = 12;
const MAX_API_BODY_BYTES = 2_000_000;
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

function mediaSource(value, kind) {
  try {
    const url = new URL(value);
    const allowed = kind === 'video'
      ? url.protocol === 'https:' && url.hostname === 'video.twimg.com'
      : url.protocol === 'https:' && url.hostname === 'pbs.twimg.com' &&
        (/^\/media\//u.test(url.pathname) || /^\/(?:ext_tw_video_thumb|amplify_video_thumb)\//u.test(url.pathname));
    return allowed ? { host: url.hostname, path: url.pathname } : null;
  } catch {
    return null;
  }
}

function unwrapTweet(value) {
  const result = value?.result ?? value;
  return result?.tweet ?? result;
}

function summarizeTweet(value) {
  const tweet = unwrapTweet(value);
  if (!tweet || typeof tweet !== 'object') return null;
  const id = tweet.rest_id ?? tweet.legacy?.id_str ?? tweet.id_str;
  const media = tweet.legacy?.extended_entities?.media ?? tweet.extended_entities?.media ?? [];
  return {
    id: typeof id === 'string' && /^\d+$/u.test(id) ? id : null,
    media: Array.isArray(media) ? media.slice(0, 12).map((item) => ({
      id: typeof item.id_str === 'string' && /^\d{1,40}$/u.test(item.id_str)
        ? item.id_str : null,
      type: ['photo', 'video', 'animated_gif'].includes(item.type) ? item.type : 'unknown',
      poster: mediaSource(item.media_url_https, 'image'),
      playableVariants: Array.isArray(item.video_info?.variants)
        ? item.video_info.variants.slice(0, 12).filter((variant) =>
          variant.content_type === 'video/mp4' && mediaSource(variant.url, 'video'))
          .map((variant) => mediaSource(variant.url, 'video'))
        : [],
    })) : [],
  };
}

export function summarizeTweetResultResponse(urlValue, status, body) {
  const url = new URL(urlValue);
  if (!url.pathname.endsWith('/TweetResultByRestId')) return null;
  let requestedTweetId = null;
  try {
    const variables = JSON.parse(url.searchParams.get('variables') ?? '{}');
    if (typeof variables.tweetId === 'string' && /^\d+$/u.test(variables.tweetId)) {
      requestedTweetId = variables.tweetId;
    }
  } catch {
    // Record a missing ID without retaining the request query.
  }
  const result = unwrapTweet(body?.data?.tweetResult?.result);
  const directQuote = unwrapTweet(result?.quoted_status_result);
  return {
    operation: 'TweetResultByRestId',
    requestedTweetId,
    httpStatus: status,
    providerErrors: Array.isArray(body?.errors) && body.errors.length > 0,
    result: summarizeTweet(result),
    directQuote: summarizeTweet(directQuote),
    nestedQuoteId: summarizeTweet(unwrapTweet(directQuote?.quoted_status_result))?.id ?? null,
  };
}

function isProductConsoleError(record) {
  return record.location.startsWith('chrome-extension:') ||
    /\bXEG\b|X\.com Enhanced Gallery|\[(?:MediaExtractor|DOMFallbackExtractor|Gallery)\]/iu.test(
      record.text
    );
}

function attachDiagnostics(page, observation) {
  const pendingResponses = new Set();
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
      if (observation.api.observations.length + pendingResponses.size < MAX_API_OBSERVATIONS) {
        const capture = (async () => {
          let body = null;
          let bodyOutcome = 'not-readable';
          const length = Number(response.headers()['content-length']);
          if (!Number.isFinite(length) || length <= MAX_API_BODY_BYTES) {
            try {
              const bytes = await response.body();
              if (bytes.length <= MAX_API_BODY_BYTES) {
                body = JSON.parse(bytes.toString('utf8'));
                bodyOutcome = 'parsed';
              } else bodyOutcome = 'too-large';
            } catch {
              bodyOutcome = 'not-readable';
            }
          } else bodyOutcome = 'too-large';
          observation.api.observations.push({
            ...summarizeTweetResultResponse(url, response.status(), body),
            bodyOutcome,
          });
        })();
        pendingResponses.add(capture);
        capture.finally(() => pendingResponses.delete(capture));
      } else observation.api.overflow += 1;
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
  return async () => { await Promise.allSettled([...pendingResponses]); };
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

export function inspectLiveTargetDocument({ handle, statusId }) {
  const statusPath = `/${handle}/status/${statusId}`.toLowerCase();
  const parseVideo = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'video.twimg.com'
        ? { host: url.hostname, path: url.pathname } : null;
    } catch {
      return null;
    }
  };
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
  const parsePoster = (value) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' && url.hostname.toLowerCase() === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(url.pathname)
        ? { host: url.hostname.toLowerCase(), path: url.pathname } : null;
    } catch {
      return null;
    }
  };

  const articles = [...document.querySelectorAll('article')];
  for (let articleIndex = 0; articleIndex < articles.length; articleIndex += 1) {
    const article = articles[articleIndex];
    const ownsStatus = [...article.querySelectorAll('a[href]')].some((anchor) => {
      const link = parseLink(anchor);
      return anchor.closest('article') === article && link?.path.toLowerCase() === statusPath;
    });
    if (!ownsStatus) continue;

    const directNestedArticles = [...article.querySelectorAll('article')]
      .filter((nested) => nested.parentElement?.closest('article') === article);
    const quoteCards = [...article.querySelectorAll('[data-testid="quoteTweet"]')]
      .filter((card) => card.closest('article') === article);
    const scopes = directNestedArticles.length ? directNestedArticles
      : quoteCards.length ? quoteCards : [article];
    const videoTargets = [];
    for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex += 1) {
      const quote = scopes[scopeIndex];
      const players = [...quote.querySelectorAll(
        '[data-testid="videoPlayer"], video, [data-testid="previewInterstitial"]')]
        .filter((candidate) => candidate.closest('article') ===
          (directNestedArticles.length ? quote : article) &&
          (candidate.matches('[data-testid="videoPlayer"]') ||
           !candidate.closest('[data-testid="videoPlayer"]')) &&
          (!candidate.matches('[data-testid="previewInterstitial"]') ||
            (candidate.closest('[data-testid="tweetPhoto"]') &&
              candidate.querySelector('[data-testid="playButton"]') &&
              !candidate.closest('[data-testid="videoPlayer"]'))));
      for (const player of players) {
        const video = player.matches('video') ? player : player.querySelector('video');
        const preview = player.matches('video') ? null : player.querySelector('img');
        const playButton = player.matches('[data-testid="previewInterstitial"]')
          ? player.querySelector('[data-testid="playButton"]') : null;
        const poster = parsePoster(video?.poster);
        const matchingPosters = poster ? [...quote.querySelectorAll('img')].filter((image) => {
          const source = parsePoster(image.currentSrc || image.src);
          return image.closest('article') === (directNestedArticles.length ? quote : article) &&
            source?.path === poster.path && isVisible(image) && image.complete &&
            image.naturalWidth > 0;
        }) : [];
        const matchingPoster = matchingPosters.length === 1 ? matchingPosters[0] : null;
        const hitTarget = playButton && isVisible(playButton) ? playButton
          : video && isVisible(video) ? video
          : preview && isVisible(preview) && preview.complete && preview.naturalWidth > 0
            ? preview : matchingPoster ?? (isVisible(player) ? player : null);
        if (!hitTarget) continue;
        const quoteLinks = [...quote.querySelectorAll('a[href]')].flatMap((anchor) => {
          if (directNestedArticles.length && anchor.closest('article') !== quote) return [];
          const link = parseLink(anchor);
          const match = link?.path.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)(?:\/|$)/u);
          return match && match[1] !== statusId ? [match[1]] : [];
        });
        const quoteStatusIds = [...new Set(quoteLinks)].slice(0, 8);
        const path = [];
        for (let node = hitTarget; node && node !== article && path.length < 10; node = node.parentElement) {
          path.push({
            tag: node.tagName.toLowerCase(),
            testId: ['quoteTweet', 'videoPlayer', 'tweetPhoto', 'videoComponent',
              'videoPlayerOverlay', 'videoPlayerControls'].includes(node.getAttribute('data-testid'))
              ? node.getAttribute('data-testid') : null,
          });
        }
        videoTargets.push({
          state: 'ready',
          target: {
            kind: 'quoted-video', articleIndex,
            quoteBoundary: directNestedArticles.length ? 'nested-article'
              : quoteCards.length ? 'quoteTweet' : 'unmarked-candidate',
            quoteIndex: quoteCards.length && !directNestedArticles.length ? scopeIndex : -1,
            nestedArticleIndex: directNestedArticles.length ?
              [...article.querySelectorAll('article')].indexOf(quote) : -1,
            quoteStatusIds, ownershipPath: path,
            videoIndex: [...article.querySelectorAll('video')].indexOf(video),
            playerIndex: [...article.querySelectorAll('[data-testid="videoPlayer"]')].indexOf(player),
            previewIndex: [...article.querySelectorAll('[data-testid="previewInterstitial"]')]
              .indexOf(player),
            posterIndex: matchingPoster
              ? [...article.querySelectorAll('img')].indexOf(matchingPoster)
              : hitTarget instanceof HTMLImageElement
                ? [...article.querySelectorAll('img')].indexOf(hitTarget) : -1,
            hitKind: hitTarget.tagName.toLowerCase(),
            posterSource: poster ?? parsePoster(preview?.currentSrc || preview?.src),
            hostVideoSource: video ? parseVideo(video.currentSrc || video.src) : null,
          },
        });
      }
    }
    if (videoTargets.length > 1) {
      return { state: 'ambiguous', reason: 'multiple-visible-video-candidates',
        candidateCount: Math.min(videoTargets.length, 20) };
    }
    if (videoTargets.length === 1) return videoTargets[0];
    if (scopes.some((quote) => quote.querySelector(
      '[data-testid="videoPlayer"], video, [data-testid="previewInterstitial"]'))) {
      return false;
    }

    const images = [...article.querySelectorAll('img')];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
      const image = images[imageIndex];
      const source = parseMedia(image);
      if (image.closest('article') !== article ||
          image.closest('[data-testid="videoPlayer"], [data-testid="previewInterstitial"]') ||
          !source || !isVisible(image) ||
          !image.complete || image.naturalWidth <= 0) continue;
      return {
        state: 'ready',
        target: {
          kind: 'image',
          articleIndex,
          imageIndex,
          imageLoaded: true,
          imageSource: source,
          imageVisible: true,
        },
      };
    }
  }
  const text = document.body?.innerText ?? document.body?.textContent ?? '';
  if (/verify you are human|unusual activity|captcha|this post is unavailable|page doesn.?t exist/iu.test(text)) {
    return { state: 'terminal', reason: 'host-challenge-or-unavailable' };
  }
  return false;
}

export function inspectLiveCandidateDocument({ handle, statusId }) {
  const path = `/${handle}/status/${statusId}`.toLowerCase();
  const articles = [...document.querySelectorAll('article')];
  const statusPath = (value) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' && ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
        /^\/[A-Za-z0-9_]{1,15}\/status\/\d+(?:\/|$)/u.test(url.pathname)
        ? url.pathname : null;
    } catch {
      return null;
    }
  };
  const mediaPath = (value) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' && url.hostname === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(url.pathname)
        ? { host: url.hostname, path: url.pathname } : null;
    } catch {
      return null;
    }
  };
  const nodePath = (element, article) => {
    const nodes = [];
    for (let node = element; node && node !== article && nodes.length < 12; node = node.parentElement) {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const testId = node.getAttribute('data-testid');
      const role = node.getAttribute('role');
      nodes.push({
        tag: node.tagName.toLowerCase(),
        testId: ['quoteTweet', 'tweetPhoto', 'videoPlayer', 'videoComponent',
          'previewInterstitial', 'playButton', 'card.wrapper'].includes(testId) ? testId : null,
        role: ['link', 'button', 'presentation', 'application'].includes(role) ? role : null,
        statusPath: node instanceof HTMLAnchorElement ? statusPath(node.href) : null,
        visibleBox: rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && Number(style.opacity) !== 0,
        bounds: { x: Math.round(rect.x), y: Math.round(rect.y),
          width: Math.round(rect.width), height: Math.round(rect.height) },
      });
    }
    return nodes;
  };
  const articleOwnership = (element, outerArticle) => {
    const ancestorArticleIndexes = [];
    for (let node = element.closest('article'); node && outerArticle.contains(node);
      node = node.parentElement?.closest('article')) {
      ancestorArticleIndexes.push(articles.indexOf(node));
      if (node === outerArticle || ancestorArticleIndexes.length >= 6) break;
    }
    const nearest = element.closest('article');
    const ownStatusPaths = nearest ? [...nearest.querySelectorAll('a[href]')]
      .filter((anchor) => anchor.closest('article') === nearest)
      .flatMap((anchor) => {
        const path = statusPath(anchor.href);
        return path ? [path] : [];
      }).slice(0, 8) : [];
    return { nearestArticleIndex: articles.indexOf(nearest),
      ancestorArticleIndexes, ownStatusPaths };
  };
  const article = articles.find((candidate) => [...candidate.querySelectorAll('a[href]')]
    .some((anchor) => {
      try {
        const url = new URL(anchor.href, location.href);
        return ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase()) &&
          url.pathname.toLowerCase() === path && anchor.closest('article') === candidate;
      } catch {
        return false;
      }
    }));
  if (!article) return { exactArticleFound: false, articleCount: Math.min(articles.length, 50) };
  const videoDetails = [...article.querySelectorAll('video')].slice(0, 6).map((video) => {
      const rect = video.getBoundingClientRect();
      const x = Math.min(innerWidth - 1, Math.max(0, rect.x + rect.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(0, rect.y + rect.height / 2));
      return {
        sourceKind: video.currentSrc?.startsWith('blob:') || video.src.startsWith('blob:')
          ? 'blob' : video.currentSrc || video.src ? 'other' : 'none',
        poster: mediaPath(video.poster),
        ...articleOwnership(video, article),
        nodePath: nodePath(video, article),
        hitPath: rect.width > 0 && rect.height > 0 && typeof document.elementsFromPoint === 'function'
          ? document.elementsFromPoint(x, y).slice(0, 4).map((node) => ({
            tag: node.tagName.toLowerCase(),
            testId: ['videoPlayer', 'videoComponent', 'playButton', 'previewInterstitial']
              .includes(node.getAttribute('data-testid')) ? node.getAttribute('data-testid') : null,
          })) : [],
      };
    });
  const thumbnailDetails = [];
  for (const element of [...article.querySelectorAll('*')].slice(0, 800)) {
    if (thumbnailDetails.length >= 8) break;
    const image = element instanceof HTMLImageElement
      ? mediaPath(element.currentSrc || element.src) : null;
    const background = getComputedStyle(element).backgroundImage;
    const backgroundUrl = background.match(/^url\(["']?(.*?)["']?\)$/u)?.[1];
    const backgroundSource = backgroundUrl ? mediaPath(backgroundUrl) : null;
    if (!image && !backgroundSource) continue;
    thumbnailDetails.push({
      source: image ?? backgroundSource,
      sourceKind: image ? 'image' : 'background',
      ...articleOwnership(element, article),
      nodePath: nodePath(element, article),
    });
  }
  const statusIds = [...new Set([...article.querySelectorAll('a[href]')].flatMap((anchor) => {
    try {
      const url = new URL(anchor.href, location.href);
      const match = ['x.com', 'twitter.com'].includes(url.hostname.toLowerCase())
        ? url.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)(?:\/|$)/u) : null;
      return match ? [match[1]] : [];
    } catch {
      return [];
    }
  }))].slice(0, 12);
  return {
    exactArticleFound: true,
    articleIndex: articles.indexOf(article),
    quoteCardCount: Math.min(article.querySelectorAll('[data-testid="quoteTweet"]').length, 20),
    videoPlayerCount: Math.min(article.querySelectorAll('[data-testid="videoPlayer"]').length, 20),
    previewInterstitialCount: Math.min(article.querySelectorAll('[data-testid="previewInterstitial"]').length, 20),
    playButtonCount: Math.min(article.querySelectorAll('[data-testid="playButton"]').length, 20),
    videoCount: Math.min(article.querySelectorAll('video').length, 20),
    statusIds,
    videoDetails,
    thumbnailDetails,
  };
}

async function waitForTarget(page, identity) {
  const handle = await page.waitForFunction(inspectLiveTargetDocument, identity, {
    timeout: READINESS_TIMEOUT_MS,
    polling: 100,
  });
  try {
    return await handle.jsonValue();
  } finally {
    await handle.dispose();
  }
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

export function inspectSelectedGalleryDocument({ expectedIndex, expectedPath }) {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const position = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const selectedItems = items.filter((candidate) =>
    candidate.getAttribute('data-index') === String(expectedIndex - 1));
  const item = selectedItems.length === 1 ? selectedItems[0] : null;
  if (!(gallery instanceof HTMLElement) || !(toolbar instanceof HTMLElement) ||
      !(position instanceof HTMLElement) || !(item instanceof HTMLElement)) return false;

  const total = Number(position.getAttribute('data-total'));
  if (!Number.isSafeInteger(expectedIndex) || expectedIndex < 1 ||
      !Number.isSafeInteger(total) || total !== items.length || expectedIndex > total ||
      position.getAttribute('data-position') !== String(expectedIndex) ||
      position.getAttribute('data-current-index') !== String(expectedIndex - 1) ||
      position.getAttribute('data-focused-index') !== String(expectedIndex - 1) ||
      toolbar.getAttribute('data-current-index') !== String(expectedIndex - 1) ||
      toolbar.getAttribute('data-focused-index') !== String(expectedIndex - 1)) return false;

  const isVisible = (element) => {
    const style = getComputedStyle(element);
    const rectangle = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 && rectangle.bottom > 0 && rectangle.top < innerHeight &&
      rectangle.right > 0 && rectangle.left < innerWidth;
  };
  const matchingImages = [...gallery.querySelectorAll('[data-gallery-element="item"] img')].filter((candidate) => {
    if (!(candidate instanceof HTMLImageElement) || !candidate.complete ||
        candidate.naturalWidth <= 0 || !isVisible(candidate)) return false;
    try {
      const url = new URL(candidate.currentSrc || candidate.src);
      return url.hostname === 'pbs.twimg.com' && url.pathname === expectedPath;
    } catch {
      return false;
    }
  });
  const selectedImage = matchingImages.length === 1 ? matchingImages[0] : null;
  if (item.getAttribute('data-media-loaded') !== 'true' || !isVisible(item) ||
      !(selectedImage instanceof HTMLImageElement) || !item.contains(selectedImage)) {
    return false;
  }
  const source = new URL(selectedImage.currentSrc || selectedImage.src);
  return {
    imageSource: { host: source.hostname, path: source.pathname },
    itemIndex: Number(item.getAttribute('data-index')),
    itemVisible: true,
    positionValue: Number(position.getAttribute('data-position')),
  };
}

export function inspectSelectedGalleryVideoDocument() {
  const galleries = document.querySelectorAll('[data-xeg-gallery-container]');
  const gallery = galleries.length === 1 ? galleries[0] : null;
  const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
  const position = toolbar?.querySelector('#xeg-toolbar-counter[data-gallery-element="position"]');
  const items = [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])];
  const current = Number(position?.getAttribute('data-current-index'));
  const total = Number(position?.getAttribute('data-total'));
  const item = Number.isSafeInteger(current) && current >= 0 ? items[current] : null;
  const video = item?.querySelector('video');
  if (!(gallery instanceof HTMLElement) || !(toolbar instanceof HTMLElement) ||
      !(position instanceof HTMLElement) || !(item instanceof HTMLElement) ||
      !(video instanceof HTMLVideoElement) || !Number.isSafeInteger(total) ||
      total !== items.length || current >= total ||
      position.getAttribute('data-position') !== String(current + 1) ||
      position.getAttribute('data-focused-index') !== String(current) ||
      toolbar.getAttribute('data-current-index') !== String(current) ||
      toolbar.getAttribute('data-focused-index') !== String(current)) return false;
  const style = getComputedStyle(video);
  const rect = video.getBoundingClientRect();
  const visible = style.display !== 'none' && style.visibility !== 'hidden' &&
    Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0 &&
    rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  let source = null;
  try {
    const url = new URL(video.currentSrc || video.src);
    if (url.protocol === 'https:' && url.hostname === 'video.twimg.com') {
      source = { host: url.hostname, path: url.pathname };
    }
  } catch {
    // An unrecognized or blob-only source cannot establish video identity.
  }
  return {
    index: current,
    position: current + 1,
    total,
    itemLoaded: item.getAttribute('data-media-loaded') === 'true',
    visible,
    source,
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    mediaErrorCode: video.error?.code ?? null,
    currentTime: video.currentTime,
  };
}

function quotedOwnerForSource(apiObservations, outerId, source) {
  if (!source) return { status: 'missing-video-source', ownerId: null, mediaId: null };
  const matches = new Map();
  const quotedIds = new Set();
  for (const entry of apiObservations) {
    if (entry.result?.id === outerId && entry.directQuote?.id) quotedIds.add(entry.directQuote.id);
  }
  for (const entry of apiObservations) {
    for (const tweet of [entry.result, entry.directQuote]) {
      if (!tweet?.id) continue;
      const directlyQuoted = quotedIds.has(tweet.id) ||
        entry.requestedTweetId === outerId && entry.directQuote === tweet;
      if (!directlyQuoted) continue;
      tweet.media.forEach((media, mediaIndex) => {
        if (media.playableVariants.some((variant) =>
          variant.host === source.host && variant.path === source.path)) {
          matches.set(`${tweet.id}:${mediaIndex}`, {
            ownerId: tweet.id, mediaId: media.id, mediaIndex,
          });
        }
      });
    }
  }
  return matches.size === 1
    ? { status: 'matched-direct-quote-variant', ...[...matches.values()][0] }
    : { status: matches.size > 1 ? 'ambiguous-media' : 'no-direct-quote-variant',
      ownerId: null, mediaId: null };
}

export function inspectHitTestedVideoActionDocument(element, { posterPath }) {
  if (!(element instanceof HTMLElement) || typeof document.elementsFromPoint !== 'function') return null;
  const quoteArticle = element.closest('article');
  if (!quoteArticle) return null;
  if (posterPath) {
    const value = element instanceof HTMLImageElement ? element.currentSrc || element.src
      : element instanceof HTMLVideoElement ? element.poster
      : element.querySelector('video')?.poster || element.querySelector('img')?.currentSrc ||
        element.querySelector('img')?.src;
    try {
      const url = new URL(value, location.href);
      if (url.protocol !== 'https:' || url.hostname !== 'pbs.twimg.com' ||
          url.pathname !== posterPath) return null;
    } catch {
      return null;
    }
  }
  const rect = element.getBoundingClientRect();
  const samples = [[0.2, 0.2], [0.8, 0.2], [0.2, 0.4], [0.8, 0.4],
    [0.5, 0.25], [0.5, 0.45], [0.2, 0.6], [0.8, 0.6], [0.5, 0.7]];
  let rejectedControls = 0;
  let nativePlay = null;
  for (const [fx, fy] of samples) {
    const x = Math.round(rect.left + rect.width * fx);
    const y = Math.round(rect.top + rect.height * fy);
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
    const top = document.elementsFromPoint(x, y)[0];
    if (!top || top.closest('article') !== quoteArticle) continue;
    const control = top.closest('button, [role="button"], input, select, textarea, [data-testid="videoPlayerControls"]');
    if (control) {
      rejectedControls += 1;
      if (!nativePlay && control.matches('button, [role="button"]')) {
        let mediaScope = element;
        for (let depth = 0; mediaScope && depth <= 5 && mediaScope !== quoteArticle;
          depth += 1, mediaScope = mediaScope.parentElement) {
          if (mediaScope.contains(control)) {
            nativePlay = { x, y, topTag: top.tagName.toLowerCase(), mediaScopeDepth: depth };
            break;
          }
        }
      }
      continue;
    }
    let mediaScope = element;
    for (let depth = 0; mediaScope && depth <= 3 && mediaScope !== quoteArticle;
      depth += 1, mediaScope = mediaScope.parentElement) {
      if (mediaScope.contains(top)) {
        return {
          inQuote: true, x, y, topTag: top.tagName.toLowerCase(),
          topTestId: ['videoPlayer', 'videoComponent', 'previewInterstitial', 'tweetPhoto']
            .includes(top.getAttribute('data-testid')) ? top.getAttribute('data-testid') : null,
          mediaScopeDepth: depth,
          rejectedControls,
          nativePlay,
        };
      }
    }
  }
  return { inQuote: false, x: null, y: null, topTag: null,
    topTestId: null, mediaScopeDepth: null, rejectedControls, nativePlay };
}

export function inspectHostVideoDocument(video, { posterPath }) {
  if (!(video instanceof HTMLVideoElement) || !video.closest('article')) return null;
  const parsePoster = (value) => {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' && url.hostname === 'pbs.twimg.com' &&
        /^\/(?:amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb|video_thumb)\//u.test(url.pathname)
        ? { host: url.hostname, path: url.pathname } : null;
    } catch {
      return null;
    }
  };
  const ownArticle = video.closest('article');
  const attributePoster = video.poster ? parsePoster(video.poster) : null;
  const matchingSiblings = [...ownArticle.querySelectorAll('img')].filter((image) =>
    image.closest('article') === ownArticle &&
    parsePoster(image.currentSrc || image.src)?.path === posterPath);
  const posterEvidence = video.poster && attributePoster?.path !== posterPath
    ? 'conflict' : attributePoster?.path === posterPath ? 'video-attribute'
      : matchingSiblings.length === 1 ? 'unique-sibling-image'
        : matchingSiblings.length > 1 ? 'ambiguous-sibling-images' : 'missing';
  const poster = ['video-attribute', 'unique-sibling-image'].includes(posterEvidence)
    ? { host: 'pbs.twimg.com', path: posterPath } : null;
  const sourceValue = video.currentSrc || video.src;
  let sourceKind = 'none';
  let source = null;
  if (sourceValue.startsWith('blob:')) sourceKind = 'blob';
  else if (sourceValue) {
    try {
      const url = new URL(sourceValue);
      if (url.protocol === 'https:' && url.hostname === 'video.twimg.com') {
        sourceKind = 'trusted-video-cdn';
        source = { host: url.hostname, path: url.pathname };
      } else sourceKind = 'other';
    } catch {
      sourceKind = 'other';
    }
  }
  return {
    poster,
    posterEvidence,
    matchingSiblingCount: Math.min(matchingSiblings.length, 20),
    sourceKind,
    source,
    readyState: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    mediaErrorCode: video.error?.code ?? null,
    currentTime: video.currentTime,
    paused: video.paused,
  };
}

async function observeQuotedVideo(page, observation, identity, output, index, settleApi) {
  const target = observation.target;
  const article = page.locator('article').nth(target.articleIndex);
  let clickSurface = target.playerIndex >= 0
    ? article.locator('[data-testid="videoPlayer"]').nth(target.playerIndex)
    : target.previewIndex >= 0
      ? article.locator('[data-testid="previewInterstitial"]').nth(target.previewIndex)
    : target.posterIndex >= 0
      ? article.locator('img').nth(target.posterIndex)
    : article.locator('video').nth(target.videoIndex);
  await clickSurface.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
  if ((await hostSnapshot(page)).scrollY === 0) await page.mouse.wheel(0, 160);
  let hit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument,
    { posterPath: target.posterSource?.path ?? null });
  observation.target.initialHitTest = hit;
  if (!hit?.inQuote && hit?.nativePlay && target.videoIndex >= 0) {
    const hostVideo = article.locator('video').nth(target.videoIndex);
    const beforeNative = await hostVideo.evaluate(inspectHostVideoDocument,
      { posterPath: target.posterSource?.path ?? null });
    const confirmation = await clickSurface.evaluate(inspectHitTestedVideoActionDocument,
      { posterPath: target.posterSource?.path ?? null });
    observation.target.nativePlayback = {
      status: 'preflight',
      before: beforeNative,
      confirmation: confirmation ? {
        inQuote: confirmation.inQuote,
        nativePlay: confirmation.nativePlay,
        rejectedControls: confirmation.rejectedControls,
      } : null,
    };
    if (!beforeNative?.poster || !confirmation?.nativePlay ||
        confirmation.nativePlay.mediaScopeDepth > 5) {
      throw new Error('Native quote play action changed before click');
    }
    observation.target.nativePlayback.status = 'attempting';
    observation.target.nativePlayback.action = confirmation.nativePlay;
    observation.target.nativePlayback.pointShift = {
      x: confirmation.nativePlay.x - hit.nativePlay.x,
      y: confirmation.nativePlay.y - hit.nativePlay.y,
    };
    await page.mouse.click(confirmation.nativePlay.x, confirmation.nativePlay.y);
    observation.target.nativePlayback.galleryOpenedOnControlClick =
      await page.locator('[data-xeg-gallery-container]').count() > 0;
    if (observation.target.nativePlayback.galleryOpenedOnControlClick) {
      throw new Error('Native play control unexpectedly opened the gallery');
    }
    await page.waitForFunction(({ articleIndex, videoIndex, startTime }) => {
      const article = document.querySelectorAll('article')[articleIndex];
      const video = article?.querySelectorAll('video')[videoIndex];
      return video && !video.error && video.readyState >= 2 &&
        video.videoWidth > 0 && video.videoHeight > 0 &&
        video.currentTime >= startTime + 0.15;
    }, { articleIndex: target.articleIndex, videoIndex: target.videoIndex,
      startTime: beforeNative.currentTime }, { timeout: 8_000, polling: 100 }).catch(() => {});
    const afterNative = await hostVideo.evaluate(inspectHostVideoDocument,
      { posterPath: target.posterSource?.path ?? null }).catch(() => null);
    observation.target.nativePlayback = {
      ...observation.target.nativePlayback,
      status: afterNative && afterNative.readyState >= 2 &&
        afterNative.width > 0 && afterNative.height > 0 &&
        afterNative.mediaErrorCode === null &&
        afterNative.currentTime >= beforeNative.currentTime + 0.15 ? 'playing' : 'unverified',
      after: afterNative,
    };
    if (observation.target.nativePlayback.status !== 'playing') {
      observation.classification = 'host-video-provider-unavailable';
      throw new Error('Native quote video did not play after ordinary control click');
    }
    clickSurface = hostVideo;
    hit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument,
      { posterPath: target.posterSource?.path ?? null });
    observation.target.hitTestAfterNativePlayback = hit;
  }
  if (!hit?.inQuote) throw new Error('No non-control quoted video gallery action was hit-tested');
  const actionHandle = await clickSurface.elementHandle();
  if (!actionHandle) throw new Error('Quoted video detached before interaction');
  let focusHandle;
  try {
    focusHandle = await actionHandle.evaluateHandle((element) => {
      const focusable = element.closest('a[href], button, [tabindex]');
      if (focusable instanceof HTMLElement) focusable.focus();
      return document.activeElement;
    });
    const before = await hostSnapshot(page);
    const focusPrepared = await actionHandle.evaluate((element) => document.activeElement === element);
    observation.gallery = { status: 'attempting', before, focusPrepared };
    observation.screenshots.before = await captureScreenshot(page, output, `live-page-${index}-before.png`);
    const finalHit = await clickSurface.evaluate(inspectHitTestedVideoActionDocument,
      { posterPath: target.posterSource?.path ?? null });
    observation.gallery.identityBeforeClick = Boolean(finalHit?.inQuote);
    observation.gallery.hitTestBeforeClick = finalHit;
    if (!observation.gallery.identityBeforeClick) {
      throw new Error('Quoted video hit target changed before click');
    }
    await page.mouse.click(finalHit.x, finalHit.y);
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: ACTION_TIMEOUT_MS });
    const selectedHandle = await page.waitForFunction(() => {
      const item = document.querySelector('[data-xeg-gallery-container] [data-gallery-element="item"] video');
      return item?.readyState >= 2 && item.videoWidth > 0 && item.videoHeight > 0;
    }, null, { timeout: ACTION_TIMEOUT_MS, polling: 100 }).catch(() => null);
    await selectedHandle?.dispose();
    const opened = await page.evaluate(inspectSelectedGalleryVideoDocument);
    observation.gallery.opened = {
      ariaModal: await gallery.getAttribute('aria-modal'),
      role: await gallery.getAttribute('role'),
      selectedVideo: opened || null,
    };
    observation.screenshots.open = await captureScreenshot(page, output, `live-page-${index}-gallery.png`);
    const selectedVideo = gallery.locator('[data-gallery-element="item"]')
      .nth(opened?.index ?? 0).locator('video');
    const startTime = opened?.currentTime ?? 0;
    if (opened && opened.readyState >= 2) {
      await page.waitForTimeout(400);
      const inProgress = await page.evaluate(inspectSelectedGalleryVideoDocument);
      if (!inProgress || inProgress.currentTime < startTime + 0.15) {
        await selectedVideo.click({ timeout: ACTION_TIMEOUT_MS }).catch(() => {});
      }
      await page.waitForFunction(({ index, start }) => {
        const item = document.querySelectorAll('[data-xeg-gallery-container] [data-gallery-element="item"]')[index];
        const video = item?.querySelector('video');
        return video && !video.error && video.currentTime >= start + 0.15;
      }, { index: opened.index, start: startTime }, { timeout: 5_000, polling: 100 }).catch(() => {});
    }
    const afterPlayback = await page.evaluate(inspectSelectedGalleryVideoDocument);
    observation.gallery.playback = {
      startTime,
      endTime: afterPlayback?.currentTime ?? null,
      progressed: Boolean(afterPlayback && afterPlayback.currentTime >= startTime + 0.15),
    };
    await settleApi();
    observation.gallery.owner = quotedOwnerForSource(
      observation.api.observations, identity.statusId, afterPlayback?.source);
    await page.keyboard.press('Escape');
    const detached = await gallery.waitFor({ state: 'detached', timeout: ACTION_TIMEOUT_MS })
      .then(() => true, () => false);
    const restored = await waitForRestoredHostState(page, focusHandle, before);
    observation.gallery = {
      ...observation.gallery, status: 'observed', closeMethod: 'Escape', detached,
      focusRestored: restored.focusRestored, after: restored.after,
      bodyStylesRestored: restored.bodyStylesRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      scrollRestored: restored.scrollRestored,
    };
    observation.screenshots.after = await captureScreenshot(page, output, `live-page-${index}-after.png`);
    const video = observation.gallery.opened.selectedVideo;
    const finalUrl = new URL(page.url());
    const required = {
      exactFinalStatus: ['x.com', 'twitter.com'].includes(finalUrl.hostname.toLowerCase()) &&
        finalUrl.pathname.toLowerCase() === `/${identity.handle}/status/${identity.statusId}`.toLowerCase(),
      quotedVideoHitTest: hit.inQuote,
      galleryDialog: observation.gallery.opened.role === 'dialog' &&
        observation.gallery.opened.ariaModal === 'true',
      selectedPlayableVideo: Boolean(video?.visible && video.itemLoaded && video.readyState >= 2 &&
        video.width > 0 && video.height > 0 && video.mediaErrorCode === null),
      directQuotedOwner: observation.gallery.owner.status === 'matched-direct-quote-variant' &&
        (target.quoteStatusIds.length === 0 || target.quoteStatusIds.includes(observation.gallery.owner.ownerId)),
      playbackProgress: observation.gallery.playback.progressed,
      escapeClosed: detached,
      exactFocusRestored: restored.focusRestored,
      scrollRestored: restored.scrollRestored,
      scrollRestorationRestored: restored.scrollRestorationRestored,
      bodyStylesRestored: restored.bodyStylesRestored,
      noProductErrors: observation.productErrors.length === 0 && observation.productErrorOverflow === 0,
      noPageErrors: observation.pageErrors.length === 0 && observation.pageErrorOverflow === 0,
    };
    observation.requiredAssertions = required;
    observation.missingAssertions = Object.entries(required).filter(([, passed]) => !passed)
      .map(([name]) => name);
    if (observation.missingAssertions.length) {
      throw new Error(`Missing live quoted-video assertions: ${observation.missingAssertions.join(', ')}`);
    }
  } finally {
    await focusHandle?.dispose().catch(() => {});
    await actionHandle.dispose().catch(() => {});
  }
}

function photoIndexFromActionPath(path) {
  const match = path.match(/\/photo\/([1-9]\d*)$/u);
  const value = Number(match?.[1]);
  if (!Number.isSafeInteger(value)) throw new Error('Selected media action has no safe photo index');
  return value;
}

async function observeOne(context, extensionId, targetUrl, output, index) {
  const identity = targetIdentity(targetUrl);
  const page = await context.newPage();
  const observation = {
    schemaVersion: 2,
    kind: 'public-x-status-observation',
    requestedUrl: targetUrl,
    finalUrl: null,
    responseStatus: null,
    extension: { id: extensionId, readinessMarker: null },
    target: null,
    gallery: { status: 'not-run' },
    api: { tweetResultByRestId: { requests: 0, responses: [] }, observations: [], overflow: 0 },
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
  const settleApi = attachDiagnostics(page, observation);
  let actionHandle;
  try {
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    observation.responseStatus = response?.status() ?? null;
    observation.finalUrl = sanitizedUrl(page.url());
    observation.extension.readinessMarkerAtNavigation = await page.locator(
      'html[data-xeg-gallery-ready="true"]'
    ).count() === 1;
    observation.targetCandidatesBefore = await page.evaluate(inspectLiveCandidateDocument, identity)
      .catch(() => null);
    let readiness;
    try {
      readiness = await waitForTarget(page, identity);
    } catch (error) {
      observation.missingAssertions.push('targetMediaReady');
      observation.classification = 'quote-unavailable-or-page-blocked';
      observation.extension.readinessMarker = await page.locator(
        'html[data-xeg-gallery-ready="true"]'
      ).count() === 1;
      observation.targetCandidates = await page.evaluate(inspectLiveCandidateDocument, identity)
        .catch(() => null);
      throw error;
    }
    if (readiness.state !== 'ready') {
      observation.missingAssertions.push('targetMediaReady');
      observation.classification = 'provider-or-page-unavailable';
      throw new Error(`Live target stopped before media readiness: ${readiness.reason}`);
    }
    observation.target = readiness.target;
    observation.targetCandidates = await page.evaluate(inspectLiveCandidateDocument, identity)
      .catch(() => null);
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

    if (observation.target.kind === 'quoted-video') {
      await observeQuotedVideo(page, observation, identity, output, index, settleApi);
      observation.status = 'core-flow-observed';
      observation.evidenceStatus = observation.hostDiagnostics.length ||
        observation.hostDiagnosticOverflow > 0 ? 'unverified' : 'observed';
      return observation;
    }

    const article = page.locator('article').nth(observation.target.articleIndex);
    const image = article.locator('img').nth(observation.target.imageIndex);
    await image.scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
    const actionIdentity = await inspectHitTestedAction(image, identity);
    if (!actionIdentity) throw new Error('No owned top media action was found by hit test');
    const selectedPhotoIndex = photoIndexFromActionPath(actionIdentity.actionPath);
    observation.target = { ...observation.target, ...actionIdentity, selectedPhotoIndex };
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
    const selectedGalleryHandle = await page.waitForFunction(inspectSelectedGalleryDocument, {
      expectedIndex: selectedPhotoIndex,
      expectedPath: observation.target.imageSource.path,
    }, {
      timeout: ACTION_TIMEOUT_MS,
      polling: 100,
    }).catch(() => null);
    const selectedGallery = selectedGalleryHandle
      ? await selectedGalleryHandle.jsonValue()
      : null;
    await selectedGalleryHandle?.dispose();
    observation.gallery.opened = {
      ariaModal: await gallery.getAttribute('aria-modal'),
      selectedGallery,
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
      galleryHostImage: observation.gallery.opened.selectedGallery !== null,
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
    await settleApi();
    if (!observation.classification) {
      observation.classification = observation.api.tweetResultByRestId.responses.some((status) => status >= 400)
        ? 'provider-failure-with-unverified-product-flow'
        : observation.gallery.status === 'attempting' || observation.gallery.status === 'observed'
          ? 'product-flow-unverified' : 'target-or-product-unverified';
    }
    const errorScreenshot = `live-page-${index}-error.png`;
    if (await page.screenshot({ path: join(output, errorScreenshot) })
      .then(() => true, () => false)) {
      observation.screenshots.error = errorScreenshot;
    }
  } finally {
    await settleApi();
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
