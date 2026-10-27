// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { Locator, Page } from '@playwright/test';

export const TWEET_ID = '1234567890123456789';
export const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;

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

export function fixtureFilename(index: number) {
  return `testuser_${TWEET_ID}_${index}.jpg`;
}

export function fixtureZipEntries<T extends Uint8Array>(images: T[]) {
  return images.map((bytes, index) => ({ filename: fixtureFilename(index), bytes }));
}

export function requireManagerDownloadsHeading(actual: string, localizedDownloads: string) {
  if (actual.trim() !== `${localizedDownloads} BETA`) {
    throw new Error('Manager Downloads section label differs');
  }
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

export async function inspectFirstCurrentDownload(page: Page, expectedUrl = FIXTURE_URL) {
  if (page.url() !== expectedUrl) {
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
  }, expectedUrl);
  return page.url() === expectedUrl ? observation : { scope: 'navigated-away' };
}
