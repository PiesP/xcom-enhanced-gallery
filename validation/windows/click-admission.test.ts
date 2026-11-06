// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { resolveClickAdmissionSites, sanitizeClickAdmissionEvent } from './click-admission.ts';

// Frozen excerpt of the production unminified content bundle at the diagnostic source revision.
// Runtime binding separately requires byte-for-byte identity with the installed script.
const executableFixture = String.raw`	function isPhotoHit(target, image, event) {
		const photoLink = target.closest("a[href]");
		if (photoLink instanceof HTMLAnchorElement && photoLink.contains(image) && !photoLink.textContent?.trim()) {
			const href = tryParseUrl(photoLink.getAttribute("href") ?? "");
			if (href && isHostMatching(href, TWITTER_HOSTS) && STATUS_PHOTO_RE.test(href.pathname)) return true;
		}
		if (event && event.detail > 0) {
			const bounds = image.getBoundingClientRect();
			if (bounds.width > 0 && bounds.height > 0) return event.clientX >= bounds.left && event.clientX < bounds.right && event.clientY >= bounds.top && event.clientY < bounds.bottom;
		}
		if (target === image || target.closest("[data-testid=\"tweetPhoto\"]")?.contains(image)) return true;
		const link = target.closest("a[href]");
		if (!(link instanceof HTMLAnchorElement)) return false;
		if (link.contains(image)) return !link.textContent?.trim();
		const parent = link.parentElement;
		const imageLink = image.closest("a[href]");
		const matchesImageLink = imageLink instanceof HTMLAnchorElement && imageLink.getAttribute("href") === link.getAttribute("href");
		if (!link.getAttribute("aria-label")?.trim() && !matchesImageLink || link.textContent?.trim() || link.childElementCount > 0 || parent?.children.length !== 2 || !Array.from(parent.children).some((sibling) => sibling !== link && sibling.contains(image))) return false;
		const linkBounds = link.getBoundingClientRect();
		const imageBounds = image.getBoundingClientRect();
		if (linkBounds.width > 0 && linkBounds.height > 0 && imageBounds.width > 0 && imageBounds.height > 0) return Math.abs(linkBounds.left - imageBounds.left) <= 1 && Math.abs(linkBounds.right - imageBounds.right) <= 1 && Math.abs(linkBounds.top - imageBounds.top) <= 1 && Math.abs(linkBounds.bottom - imageBounds.bottom) <= 1;
		return true;
	}
	function shouldBlockMediaTrigger(target, event) {
		if (!target) return false;
		const videoMode = tryGetSettings() ? getTypedSettingOr("gallery.videoClickMode", DEFAULT_SETTINGS.gallery.videoClickMode) : DEFAULT_SETTINGS.gallery.videoClickMode;
		if (!isVideoClickAllowed(target, event ? () => event.composedPath() : void 0, videoMode)) return true;
		if (closestSafe(target, CSS.SELECTORS.ROOT) || closestSafe(target, CSS.SELECTORS.OVERLAY)) return true;
		const cardWrapper = target.closest("[data-testid=\"card.wrapper\"]");
		if (cardWrapper instanceof HTMLElement) return !isMediaCard(cardWrapper);
		const blockedContext = [
			"[data-testid=\"twitterArticleReadView\"]",
			"[data-testid=\"longformRichTextComponent\"]",
			"[data-testid=\"twitterArticleRichTextView\"]",
			"[data-testid=\"article-cover-image\"]",
			...MEDIA_VIEWER_SELECTORS,
			"[data-testid=\"swipe-to-dismiss\"]",
			"[data-testid=\"mask\"]"
		].join(", ");
		if (target.closest(blockedContext)) return true;
		const interactive = target.closest(INTERACTIVE_SELECTOR);
		if (interactive) {
			if (interactive instanceof HTMLAnchorElement && !isNativeStatusMediaLink(interactive.getAttribute("href"))) return true;
			return !(interactive instanceof HTMLAnchorElement ? isNativeStatusMediaLink(interactive.getAttribute("href")) : interactive.matches(MEDIA_LINK_SELECTOR) || interactive.matches(MEDIA_CONTAINER_SELECTOR) || interactive.querySelector(MEDIA_CONTAINER_SELECTOR) !== null) && !isAllowAllNativeVideoControl(target, videoMode);
		}
		return false;
	}
	function isProcessableMedia(target, event) {
		const htmlTarget = event ? getMediaClickTarget(event) : target instanceof HTMLElement ? target : null;
		if (event && target !== htmlTarget && target !== event.target) return false;
		if (!htmlTarget || gallerySignals.isOpen || shouldBlockMediaTrigger(htmlTarget, event)) return false;
		if (isAllowAllNativeVideoControl(htmlTarget, tryGetSettings() ? getTypedSettingOr("gallery.videoClickMode", DEFAULT_SETTINGS.gallery.videoClickMode) : DEFAULT_SETTINGS.gallery.videoClickMode)) return true;
		const mediaElement = findMediaElementInDOM(htmlTarget);
		if (mediaElement) {
			const url = extractMediaUrlFromElement(mediaElement);
			if (url && (url.startsWith("blob:") || isValidMediaUrl(url))) return !(mediaElement instanceof HTMLImageElement) || isPhotoHit(htmlTarget, mediaElement, event);
		}
		return !!htmlTarget.closest(MEDIA_CONTAINER_SELECTOR);
	}
	// src/extension/content-readiness.ts
	var MAX_ANCESTRY_DEPTH = 64;
	var MAX_SOURCE_ELEMENTS = 8;
	async function handleMediaClick(event, handlers, options) {
		if (!options.enableMediaDetection) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		if (isGalleryRecoveryActive()) return;
		if (gallerySignals.isOpen) {
			if (isGalleryInternalElement(target)) return;
			handlers.onGalleryClose();
			event.stopImmediatePropagation();
			event.preventDefault();
			return;
		}
		const mediaTarget = getMediaClickTarget(event);
		if (!mediaTarget) return;
		if (!isVideoClickAllowed(mediaTarget, () => event.composedPath(), resolveVideoClickMode())) return;
		if (!isProcessableMedia(mediaTarget, event)) return;
		event.stopImmediatePropagation();
		event.preventDefault();
		try {
			await handlers.onMediaClick(mediaTarget, event);
		} catch (error) {
			logger.warn("onMediaClick failed", error);
		}
	}
	// src/shared/utils/events/trusted-event.ts
	/** Admit browser-dispatched input at DOM callbacks; private lifecycle calls stay direct. */
function followingFunction() {}
`;

const event = {
  stage: 'handler.enter',
  timeStamp: 42.5,
  detail: 1,
  defaultPrevented: false,
  targetTag: 'A',
  targetTestId: null,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

describe('installed live click admission diagnostic', () => {
  it('binds every required stage to one executable location and rejects source drift', () => {
    const sites = resolveClickAdmissionSites(executableFixture);
    expect(sites).toHaveLength(39);
    expect(new Set(sites.map((site) => site.name)).size).toBe(39);
    expect(sites.find((site) => site.name === 'handler.enter')?.lineNumber).toBeGreaterThan(0);
    expect(sites.find((site) => site.name === 'photo.enter')?.capture).toBe('photo');
    expect(() =>
      resolveClickAdmissionSites(
        executableFixture.replace(
          'const mediaElement = findMediaElementInDOM(htmlTarget);',
          'const mediaElement = null;'
        )
      )
    ).toThrow();
    expect(() =>
      resolveClickAdmissionSites(
        executableFixture.replace(
          'function followingFunction() {}',
          'async function handleMediaClick() {}'
        )
      )
    ).toThrow();
  });

  it('retains only bounded stage and media metadata', () => {
    expect(sanitizeClickAdmissionEvent(event)).toEqual(event);
    expect(sanitizeClickAdmissionEvent({ ...event, privateContent: 'never retained' })).toEqual(
      event
    );
    expect(
      sanitizeClickAdmissionEvent({ ...event, mediaDetectionEnabled: true, context: 'gallery' })
    ).toEqual({ ...event, mediaDetectionEnabled: true, context: 'gallery' });
    expect(
      sanitizeClickAdmissionEvent({ ...event, videoClickMode: 'block-controls-only' })
    ).toEqual({ ...event, videoClickMode: 'block-controls-only' });
    expect(sanitizeClickAdmissionEvent({ ...event, stage: 'unknown' })).toBeNull();
    expect(sanitizeClickAdmissionEvent({ ...event, targetTestId: 'private text' })).toBeNull();
    expect(
      sanitizeClickAdmissionEvent({
        ...event,
        media: {
          tag: 'IMG',
          host: 'pbs.twimg.com',
          path: '/media/HWXMF0bbcAEnfk6',
          pointInside: false,
        },
      })?.media?.path
    ).toBe('/media/HWXMF0bbcAEnfk6');
    expect(
      sanitizeClickAdmissionEvent({
        ...event,
        media: { tag: 'IMG', host: 'example.com', path: '/secret', pointInside: false },
      })
    ).toBeNull();
  });
});
