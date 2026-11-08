// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { expect, type Page, type Route, test } from '@playwright/test';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

const FIRST_IMAGE_SIZES = [
  { width: 32, height: 24 },
  { width: 480, height: 320 },
  { width: 2400, height: 1600 },
] as const;

interface LayoutSnapshot {
  readonly at: number;
  readonly viewport: { width: number; height: number; devicePixelRatio: number; scale: number };
  readonly currentIndex: string | null;
  readonly focusedIndex: string | null;
  readonly selectedMediaId: string | null;
  readonly selectedActive: string | null;
  readonly selectedFocused: string | null;
  readonly selectedTop: number;
  readonly toolbarBottom: number;
  readonly selectedToolbarOffset: number;
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly documentScrollTop: number;
  readonly first: {
    readonly loaded: string | null;
    readonly error: string | null;
    readonly rowWidth: number;
    readonly rowHeight: number;
    readonly wrapperWidth: number;
    readonly wrapperHeight: number;
    readonly intrinsicReservation: string;
    readonly imageNaturalWidth: number;
    readonly imageNaturalHeight: number;
  };
}

async function createDecodedJpeg(page: Page, width: number, height: number): Promise<Buffer> {
  const encoded = await page.evaluate(
    async ({ width, height }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas 2D context unavailable');
      }
      context.fillStyle = '#37547a';
      context.fillRect(0, 0, width, height);
      context.fillStyle = '#d49c45';
      context.fillRect(8, 8, width - 16, height - 16);
      const jpeg = canvas.toDataURL('image/jpeg', 0.9);
      const image = new Image();
      image.src = jpeg;
      await image.decode();
      if (image.naturalWidth !== width || image.naturalHeight !== height) {
        throw new Error('Generated JPEG dimensions do not match media metadata');
      }
      return jpeg.split(',')[1]!;
    },
    { width, height }
  );
  return Buffer.from(encoded, 'base64');
}

async function snapshot(page: Page): Promise<LayoutSnapshot> {
  return page.evaluate(() => {
    const items = document.querySelector<HTMLElement>('[data-gallery-element="items"]');
    const first = items?.querySelector<HTMLElement>(
      '[data-gallery-element="item"][data-index="0"]'
    );
    const selected = items?.querySelector<HTMLElement>(
      '[data-gallery-element="item"][data-index="1"]'
    );
    const wrapper = first?.querySelector<HTMLElement>(':scope > div');
    const toolbar = document.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
    if (!items || !first || !selected || !wrapper || !toolbar) {
      throw new Error('Actual gallery layout is incomplete');
    }
    const firstRect = first.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const selectedTop = selected.getBoundingClientRect().top;
    const toolbarBottom = toolbar.getBoundingClientRect().bottom;
    const image = first.querySelector('img');
    return {
      at: performance.now(),
      viewport: {
        width: innerWidth,
        height: innerHeight,
        devicePixelRatio,
        scale: visualViewport?.scale ?? 1,
      },
      currentIndex: toolbar.getAttribute('data-current-index'),
      focusedIndex: toolbar.getAttribute('data-focused-index'),
      selectedMediaId: selected.getAttribute('data-media-id'),
      selectedActive: selected.getAttribute('data-media-active'),
      selectedFocused: selected.getAttribute('data-media-focused'),
      selectedTop,
      toolbarBottom,
      selectedToolbarOffset: selectedTop - toolbarBottom,
      scrollTop: items.scrollTop,
      scrollHeight: items.scrollHeight,
      documentScrollTop: document.scrollingElement?.scrollTop ?? 0,
      first: {
        loaded: first.getAttribute('data-media-loaded'),
        error: first.getAttribute('data-media-error'),
        rowWidth: firstRect.width,
        rowHeight: firstRect.height,
        wrapperWidth: wrapperRect.width,
        wrapperHeight: wrapperRect.height,
        intrinsicReservation: getComputedStyle(first).containIntrinsicSize,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        imageNaturalHeight: image?.naturalHeight ?? 0,
      },
    };
  });
}

for (const firstSize of FIRST_IMAGE_SIZES) {
  test(`late ${firstSize.width}x${firstSize.height} image keeps its pending footprint after native load`, async ({
    page,
  }, testInfo) => {
    const IMAGE_SIZES = [
      firstSize,
      { width: 560, height: 360 },
      { width: 640, height: 400 },
    ] as const;
    if (!existsSync(DEV_USERSCRIPT_PATH)) {
      throw new Error('Required development userscript bundle is missing');
    }

    const jpegBodies = await Promise.all(
      IMAGE_SIZES.map(({ width, height }) => createDecodedJpeg(page, width, height))
    );
    const hostJpeg = await createDecodedJpeg(page, 320, 180);
    const held = new Map<number, Route>();
    const requests: Array<{ index: number; url: string }> = [];
    await page.route('https://pbs.twimg.com/**', async (route) => {
      const url = new URL(route.request().url());
      const index = Number(/^\/media\/E(\d)\.jpg$/.exec(url.pathname)?.[1] ?? 0) - 1;
      if (index >= 0 && index < IMAGE_SIZES.length && url.searchParams.get('name') === 'orig') {
        requests.push({ index, url: url.href });
        held.set(index, route);
        return;
      }
      if (/^\/media\/GkE[A-Za-z0-9]+\.jpg$/.test(url.pathname)) {
        await route.fulfill({ status: 200, contentType: 'image/jpeg', body: hostJpeg });
        return;
      }
      await route.abort();
    });

    await page.route('https://x.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
    );
    await page.route('https://x.com', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
    );
    await page.goto('https://x.com/author/status/1', { waitUntil: 'domcontentloaded' });
    await installGMMock(page);
    await injectDevUserscript(page);
    await waitForGalleryApp(page);

    await page.evaluate(() => {
      const observer = window as typeof window & {
        __lateImageEvents?: Array<Record<string, unknown>>;
        __lateImageOverflow?: number;
      };
      observer.__lateImageEvents = [];
      observer.__lateImageOverflow = 0;
      const record = (entry: Record<string, unknown>): void => {
        if (observer.__lateImageEvents!.length >= 128) {
          observer.__lateImageOverflow = (observer.__lateImageOverflow ?? 0) + 1;
          return;
        }
        observer.__lateImageEvents!.push(entry);
      };
      document.documentElement.setAttribute('data-xeg-scroll-trace', '');
      window.addEventListener('xeg:gallery-scroll-trace', (event) => {
        const detail = JSON.parse((event as CustomEvent<string>).detail) as Record<string, unknown>;
        record(detail);
      });
      document.addEventListener(
        'load',
        (event) => {
          const image = event.target;
          if (!(image instanceof HTMLImageElement)) {
            return;
          }
          if (!image.closest('[data-gallery-element="item"][data-index="0"]')) {
            return;
          }
          record({
            event: 'native-image-load',
            at: performance.now(),
            trusted: event.isTrusted,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
          });
        },
        true
      );
    });

    try {
      await page.evaluate((sizes) => {
        const app = (
          window as typeof window & {
            __XEG__: {
              main: { galleryApp: { openGallery: (items: unknown[], index: number) => void } };
            };
          }
        ).__XEG__.main.galleryApp;
        app.openGallery(
          sizes.map(({ width, height }, index) => {
            const url = `https://pbs.twimg.com/media/E${index + 1}.jpg?format=jpg&name=orig`;
            return {
              id: `img_${index + 1}`,
              type: 'image',
              url,
              originalUrl: url,
              thumbnailUrl: url,
              width,
              height,
              filename: `E${index + 1}.jpg`,
              alt: `Image ${index + 1}`,
              tweetUsername: 'u',
              tweetId: '1',
              tweetUrl: 'https://x.com/u/status/1',
              metadata: {},
            };
          }),
          1
        );
      }, IMAGE_SIZES);

      await expect(page.locator('[data-gallery-element="item"]')).toHaveCount(3);
      await expect(page.locator('[data-gallery-element="toolbar"]')).toHaveAttribute(
        'data-current-index',
        '1'
      );
      await expect(page.locator('[data-gallery-element="toolbar"]')).toHaveAttribute(
        'data-focused-index',
        '1'
      );
      await expect.poll(() => held.has(0)).toBe(true);
      await expect
        .poll(() =>
          page.evaluate(() =>
            Boolean(
              (
                window as typeof window & {
                  __lateImageEvents?: Array<Record<string, unknown>>;
                }
              ).__lateImageEvents?.some(
                (event) => event.event === 'align-done' && event.index === 1
              )
            )
          )
        )
        .toBe(true);

      const initial = await snapshot(page);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );
      const before = await snapshot(page);
      expect(Math.abs(before.selectedTop - initial.selectedTop)).toBeLessThanOrEqual(2);
      expect(Math.abs(before.scrollTop - initial.scrollTop)).toBeLessThanOrEqual(2);
      expect(before.first.loaded).toBe('false');
      expect(before.selectedMediaId).toBe('img_2');
      expect(before.selectedActive).toBe('true');
      expect(before.selectedFocused).toBe('true');
      if (firstSize.width === 32) {
        const spinnerPaint = await page.evaluate(() => {
          const row = document.querySelector<HTMLElement>(
            '[data-gallery-element="item"][data-index="0"]'
          );
          const wrapper = row?.querySelector<HTMLElement>(':scope > div');
          const spinner = wrapper?.querySelector<HTMLElement>('[role="status"]');
          const placeholder = spinner?.parentElement;
          if (!row || !wrapper || !spinner || !placeholder) {
            throw new Error('Actual pending image spinner is missing');
          }
          const box = (element: Element) => {
            const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
            return { left, top, right, bottom, width, height };
          };
          return {
            row: box(row),
            wrapper: box(wrapper),
            placeholder: box(placeholder),
            spinner: box(spinner),
            wrapperContain: getComputedStyle(wrapper).contain,
            spinnerSize: getComputedStyle(spinner).getPropertyValue('--xeg-spinner-size').trim(),
            spinnerBorderRadius: getComputedStyle(spinner).borderRadius,
            spinnerUsedWidth: spinner.offsetWidth,
            spinnerUsedHeight: spinner.offsetHeight,
          };
        });
        const spinnerBody = Buffer.from(JSON.stringify(spinnerPaint, null, 2));
        await testInfo.attach('pending-small-spinner.json', {
          body: spinnerBody,
          contentType: 'application/json',
        });
        const spinnerEvidenceDir = process.env.XEG_LAYOUT_EVIDENCE_DIR
          ? join(process.env.XEG_LAYOUT_EVIDENCE_DIR, '32x24')
          : undefined;
        if (spinnerEvidenceDir) {
          await mkdir(spinnerEvidenceDir, { recursive: true });
          await writeFile(join(spinnerEvidenceDir, 'spinner.json'), spinnerBody);
        }
        expect(spinnerPaint.wrapperContain).toContain('paint');
        expect(spinnerPaint.spinnerBorderRadius).not.toBe('0px');
        expect(spinnerPaint.placeholder.height).toBeLessThanOrEqual(
          spinnerPaint.wrapper.height + 0.5
        );
        // The animated circular border keeps its painted disc within its used
        // size; the rotated rectangle includes transparent corner overhang.
        const circleRadius =
          Math.max(spinnerPaint.spinnerUsedWidth, spinnerPaint.spinnerUsedHeight) / 2;
        const centerX = (spinnerPaint.spinner.left + spinnerPaint.spinner.right) / 2;
        const centerY = (spinnerPaint.spinner.top + spinnerPaint.spinner.bottom) / 2;
        expect(centerX - circleRadius).toBeGreaterThanOrEqual(spinnerPaint.wrapper.left - 0.5);
        expect(centerX + circleRadius).toBeLessThanOrEqual(spinnerPaint.wrapper.right + 0.5);
        expect(centerY - circleRadius).toBeGreaterThanOrEqual(spinnerPaint.wrapper.top - 0.5);
        expect(centerY + circleRadius).toBeLessThanOrEqual(spinnerPaint.wrapper.bottom + 0.5);
      }
      const firstRoute = held.get(0);
      if (!firstRoute) {
        throw new Error('Index 0 original response was not held');
      }
      await firstRoute.fulfill({ status: 200, contentType: 'image/jpeg', body: jpegBodies[0]! });
      held.delete(0);

      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (
                window as typeof window & { __lateImageEvents?: Array<Record<string, unknown>> }
              ).__lateImageEvents?.some((event) => event.event === 'native-image-load') ?? false
          )
        )
        .toBe(true);
      await expect(page.locator('[data-gallery-element="item"][data-index="0"]')).toHaveAttribute(
        'data-media-loaded',
        'true'
      );
      const after = await snapshot(page);
      const events = await page.evaluate(
        () =>
          (window as typeof window & { __lateImageEvents?: Array<Record<string, unknown>> })
            .__lateImageEvents ?? []
      );
      const eventOverflow = await page.evaluate(
        () => (window as typeof window & { __lateImageOverflow?: number }).__lateImageOverflow ?? 0
      );
      const layoutBody = Buffer.from(
        JSON.stringify(
          {
            sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
            sourceStatus: execFileSync('git', ['status', '--porcelain', '--', 'src'], {
              encoding: 'utf8',
            }).trim(),
            coreHead: execFileSync('git', ['-C', 'packages/core', 'rev-parse', 'HEAD'], {
              encoding: 'utf8',
            }).trim(),
            bundleSha256: createHash('sha256')
              .update(readFileSync(DEV_USERSCRIPT_PATH))
              .digest('hex'),
            imageBodies: jpegBodies.map((body, index) => ({
              index,
              bytes: body.length,
              sha256: createHash('sha256').update(body).digest('hex'),
              ...IMAGE_SIZES[index],
            })),
            requests,
            events,
            eventOverflow,
            initial,
            before,
            after,
          },
          null,
          2
        )
      );
      await testInfo.attach('late-image-layout.json', {
        body: layoutBody,
        contentType: 'application/json',
      });
      const evidenceDir = process.env.XEG_LAYOUT_EVIDENCE_DIR
        ? join(process.env.XEG_LAYOUT_EVIDENCE_DIR, `${firstSize.width}x${firstSize.height}`)
        : undefined;
      if (evidenceDir) {
        await mkdir(evidenceDir, { recursive: true });
        await writeFile(join(evidenceDir, 'layout.json'), layoutBody);
      }

      expect(after.first.error).toBeNull();
      expect(eventOverflow).toBe(0);
      expect(after.first.imageNaturalWidth).toBe(firstSize.width);
      expect(after.first.imageNaturalHeight).toBe(firstSize.height);
      expect(after.selectedMediaId).toBe(before.selectedMediaId);
      expect(after.currentIndex).toBe('1');
      expect(after.focusedIndex).toBe('1');
      const reservation = /^auto ([\d.]+)px auto ([\d.]+)px$/.exec(
        before.first.intrinsicReservation
      );
      expect(reservation).not.toBeNull();
      expect(Math.abs(Number(reservation?.[1]) - before.first.wrapperWidth)).toBeLessThanOrEqual(2);
      expect(Math.abs(Number(reservation?.[2]) - before.first.wrapperHeight)).toBeLessThanOrEqual(
        2
      );
      // A known-size pending row must reserve its loaded footprint. This assertion
      // also detects the mismatch when native scroll anchoring hides displacement.
      expect(Math.abs(after.first.rowHeight - before.first.rowHeight)).toBeLessThanOrEqual(2);
      expect(Math.abs(after.first.wrapperHeight - before.first.wrapperHeight)).toBeLessThanOrEqual(
        2
      );
      expect(
        Math.abs(after.selectedToolbarOffset - before.selectedToolbarOffset)
      ).toBeLessThanOrEqual(2);
    } finally {
      const releasedAtCleanup: number[] = [];
      for (const [index, route] of held) {
        await route.fulfill({ status: 200, contentType: 'image/jpeg', body: jpegBodies[index]! });
        held.delete(index);
        releasedAtCleanup.push(index);
      }
      const traceDisarmed = await page.evaluate(() => {
        document.documentElement.removeAttribute('data-xeg-scroll-trace');
        return !document.documentElement.hasAttribute('data-xeg-scroll-trace');
      });
      const cleanupBody = Buffer.from(
        JSON.stringify({ releasedAtCleanup, traceDisarmed, heldCount: held.size })
      );
      await testInfo.attach('late-image-cleanup.json', {
        body: cleanupBody,
        contentType: 'application/json',
      });
      const evidenceDir = process.env.XEG_LAYOUT_EVIDENCE_DIR
        ? join(process.env.XEG_LAYOUT_EVIDENCE_DIR, `${firstSize.width}x${firstSize.height}`)
        : undefined;
      if (evidenceDir) {
        await mkdir(evidenceDir, { recursive: true });
        await writeFile(join(evidenceDir, 'cleanup.json'), cleanupBody);
      }
    }
  });
}

test('failed fitWidth image keeps recovery actions visible and hittable', async ({ page }) => {
  if (!existsSync(DEV_USERSCRIPT_PATH)) {
    throw new Error('Required development userscript bundle is missing');
  }
  const hostJpeg = await createDecodedJpeg(page, 320, 180);
  let faultRequests = 0;
  await page.route('https://pbs.twimg.com/**', async (route) => {
    if (route.request().url().includes('/media/failed.jpg?')) {
      faultRequests += 1;
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'gallery image missing',
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/jpeg', body: hostJpeg });
  });
  await page.route('https://x.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
  );
  await page.route('https://x.com', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
  );
  await page.goto('https://x.com/author/status/1', { waitUntil: 'domcontentloaded' });
  await installGMMock(page);
  await injectDevUserscript(page);
  await waitForGalleryApp(page);

  await page.evaluate(() => {
    const app = (
      window as typeof window & {
        __XEG__: {
          main: { galleryApp: { openGallery: (items: unknown[], index: number) => void } };
        };
      }
    ).__XEG__.main.galleryApp;
    const url = 'https://pbs.twimg.com/media/failed.jpg?format=jpg&name=orig';
    app.openGallery(
      [
        {
          id: 'failed',
          type: 'image',
          url,
          originalUrl: url,
          thumbnailUrl: url,
          width: 480,
          height: 320,
          tweetUrl: 'https://x.com/u/status/1',
        },
      ],
      0
    );
  });
  const item = page.locator('[data-gallery-element="item"][data-index="0"]');
  await expect(item).toHaveAttribute('data-media-error', 'true');
  await expect(item).toHaveAttribute('data-media-loaded', 'false');
  const alert = item.getByRole('alert');
  await expect(alert).toBeVisible();
  const retry = alert.getByRole('button');
  const original = alert.getByRole('link');
  await expect(retry).toBeVisible();
  await expect(original).toHaveAttribute('href', 'https://x.com/u/status/1');
  for (const target of [retry, original]) {
    expect(
      await target.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        return hit === element || element.contains(hit);
      })
    ).toBe(true);
  }
  await retry.click();
  await expect(item).toHaveAttribute('data-media-error', 'true');
  expect(faultRequests).toBe(2);
  await expect(original).toBeVisible();
});

test('fitWidth video keeps the full-width row and reservation', async ({ page }) => {
  if (!existsSync(DEV_USERSCRIPT_PATH)) {
    throw new Error('Required development userscript bundle is missing');
  }
  const hostJpeg = await createDecodedJpeg(page, 320, 180);
  const videoBytes = readFileSync(
    resolve(import.meta.dirname, '../fixtures/installed-quote-one.mp4')
  );
  let videoRoute: Route | undefined;
  await page.route('https://video.twimg.com/**', (route) => {
    videoRoute = route;
  });
  await page.route('https://pbs.twimg.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/jpeg', body: hostJpeg })
  );
  await page.route('https://x.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
  );
  await page.route('https://x.com', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
  );
  await page.goto('https://x.com/author/status/1', { waitUntil: 'domcontentloaded' });
  await installGMMock(page);
  await injectDevUserscript(page);
  await waitForGalleryApp(page);

  try {
    await page.evaluate(() => {
      const app = (
        window as typeof window & {
          __XEG__: {
            main: { galleryApp: { openGallery: (items: unknown[], index: number) => void } };
          };
        }
      ).__XEG__.main.galleryApp;
      const url = 'https://video.twimg.com/ext_tw_video/1/pu/vid/gallery.mp4';
      app.openGallery([{ id: 'video', type: 'video', url, width: 640, height: 360 }], 0);
    });
    const row = page.locator('[data-gallery-element="item"][data-index="0"]');
    await expect(row).toHaveAttribute('data-video-admitted', 'true');
    const geometry = await row.evaluate((item) => {
      const list = item.closest<HTMLElement>('[data-gallery-element="items"]');
      if (!list) {
        throw new Error('Gallery scrollport missing');
      }
      return {
        rowWidth: item.getBoundingClientRect().width,
        listClientWidth: list.clientWidth,
        reservation: getComputedStyle(item).containIntrinsicSize,
      };
    });
    expect(Math.abs(geometry.rowWidth - geometry.listClientWidth)).toBeLessThanOrEqual(2);
    expect(geometry.reservation).toMatch(/^auto [\d.]+px auto [\d.]+px$/);
  } finally {
    if (videoRoute) {
      await videoRoute.fulfill({ status: 200, contentType: 'video/mp4', body: videoBytes });
    }
  }
});

test('a distant skipped image reserves its actual loaded footprint', async ({ page }, testInfo) => {
  if (!existsSync(DEV_USERSCRIPT_PATH)) {
    throw new Error('Required development userscript bundle is missing');
  }
  const imageBytes = await createDecodedJpeg(page, 480, 320);
  const hostBytes = await createDecodedJpeg(page, 320, 180);
  const mediaRequests: number[] = [];
  await page.route('https://pbs.twimg.com/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const match = /^\/media\/stack-(\d+)\.jpg$/.exec(path);
    if (match) {
      mediaRequests.push(Number(match[1]));
      await route.fulfill({ status: 200, contentType: 'image/jpeg', body: imageBytes });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/jpeg', body: hostBytes });
  });
  await page.route('https://x.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
  );
  await page.route('https://x.com', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML })
  );
  await page.goto('https://x.com/author/status/1', { waitUntil: 'domcontentloaded' });
  await installGMMock(page);
  await injectDevUserscript(page);
  await waitForGalleryApp(page);

  await page.evaluate(() => {
    const app = (
      window as typeof window & {
        __XEG__: {
          main: { galleryApp: { openGallery: (items: unknown[], index: number) => void } };
        };
      }
    ).__XEG__.main.galleryApp;
    app.openGallery(
      Array.from({ length: 20 }, (_, index) => {
        const url = `https://pbs.twimg.com/media/stack-${index}.jpg?format=jpg&name=orig`;
        return {
          id: `stack_${index}`,
          type: 'image',
          url,
          originalUrl: url,
          thumbnailUrl: url,
          width: 480,
          height: 320,
          alt: `Image ${index}`,
          tweetUrl: 'https://x.com/u/status/1',
        };
      }),
      1
    );
  });

  const near = page.locator('[data-gallery-element="item"][data-index="1"]');
  const distant = page.locator('[data-gallery-element="item"][data-index="18"]');
  await expect(page.locator('[data-gallery-element="item"]')).toHaveCount(20);
  await expect(near).toHaveAttribute('data-media-loaded', 'true');
  await expect(distant).toHaveAttribute('data-media-loaded', 'false');
  const readiness = await distant.evaluate((row) => {
    const rect = row.getBoundingClientRect();
    const image = row.querySelector('img');
    return {
      top: rect.top,
      height: rect.height,
      contentVisibility: getComputedStyle(row).contentVisibility,
      rowVisibilityCheck: row.checkVisibility({ contentVisibilityAuto: true }),
      childSkipped: image ? !image.checkVisibility({ contentVisibilityAuto: true }) : null,
      childOrdinarilyVisible: image?.checkVisibility() ?? null,
    };
  });
  await testInfo.attach('offscreen-readiness.json', {
    body: Buffer.from(JSON.stringify(readiness)),
    contentType: 'application/json',
  });
  if (process.env.XEG_LAYOUT_EVIDENCE_DIR) {
    await mkdir(process.env.XEG_LAYOUT_EVIDENCE_DIR, { recursive: true });
    await writeFile(
      join(process.env.XEG_LAYOUT_EVIDENCE_DIR, 'offscreen-readiness.json'),
      JSON.stringify(readiness)
    );
  }
  await expect
    .poll(() =>
      distant.evaluate((row) =>
        row.querySelector('img')?.checkVisibility({ contentVisibilityAuto: true })
      )
    )
    .toBe(false);

  // Read only the skipped row's own box and computed style. Descendant layout
  // would force content-visibility to reveal the row and invalidate this check.
  const measurements = await page.evaluate(() => {
    const list = document.querySelector<HTMLElement>('[data-gallery-element="items"]');
    const near = list?.querySelector<HTMLElement>('[data-gallery-element="item"][data-index="1"]');
    const distant = list?.querySelector<HTMLElement>(
      '[data-gallery-element="item"][data-index="18"]'
    );
    if (!list || !near || !distant) {
      throw new Error('Gallery rows missing');
    }
    const nearImage = near.querySelector('img');
    const nearWrapper = near.querySelector<HTMLElement>(':scope > div');
    if (!nearImage || !nearWrapper) {
      throw new Error('Visible control is missing image layout');
    }
    const rowStyle = getComputedStyle(distant);
    const rowBox = distant.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    const nearBox = near.getBoundingClientRect();
    const wrapperBox = nearWrapper.getBoundingClientRect();
    return {
      distant: {
        skipped: !distant.querySelector('img')?.checkVisibility({ contentVisibilityAuto: true }),
        ordinaryVisibility: distant.querySelector('img')?.checkVisibility() ?? false,
        contentVisibility: rowStyle.contentVisibility,
        loaded: distant.getAttribute('data-media-loaded'),
        width: rowBox.width,
        height: rowBox.height,
        top: rowBox.top,
        reservation: rowStyle.containIntrinsicSize,
        inlineInsets:
          Number.parseFloat(rowStyle.paddingLeft) +
          Number.parseFloat(rowStyle.paddingRight) +
          Number.parseFloat(rowStyle.borderLeftWidth) +
          Number.parseFloat(rowStyle.borderRightWidth),
        blockInsets:
          Number.parseFloat(rowStyle.paddingTop) +
          Number.parseFloat(rowStyle.paddingBottom) +
          Number.parseFloat(rowStyle.borderTopWidth) +
          Number.parseFloat(rowStyle.borderBottomWidth),
      },
      list: {
        clientWidth: list.clientWidth,
        bottom: listBox.bottom,
        scrollTop: list.scrollTop,
        scrollHeight: list.scrollHeight,
      },
      near: {
        loaded: near.getAttribute('data-media-loaded'),
        mediaId: near.getAttribute('data-media-id'),
        width: nearBox.width,
        height: nearBox.height,
        wrapperWidth: wrapperBox.width,
        wrapperHeight: wrapperBox.height,
        naturalWidth: nearImage.naturalWidth,
        naturalHeight: nearImage.naturalHeight,
      },
    };
  });
  const evidence = Buffer.from(
    JSON.stringify(
      {
        sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        sourceStatus: execFileSync('git', ['status', '--porcelain', '--', 'src'], {
          encoding: 'utf8',
        }).trim(),
        coreHead: execFileSync('git', ['-C', 'packages/core', 'rev-parse', 'HEAD'], {
          encoding: 'utf8',
        }).trim(),
        bundleSha256: createHash('sha256').update(readFileSync(DEV_USERSCRIPT_PATH)).digest('hex'),
        imageSha256: createHash('sha256').update(imageBytes).digest('hex'),
        mediaRequests,
        measurements,
      },
      null,
      2
    )
  );
  await testInfo.attach('offscreen-image-layout.json', {
    body: evidence,
    contentType: 'application/json',
  });
  const evidenceDir = process.env.XEG_LAYOUT_EVIDENCE_DIR;
  if (evidenceDir) {
    await mkdir(evidenceDir, { recursive: true });
    await writeFile(join(evidenceDir, 'offscreen-layout.json'), evidence);
  }

  expect(measurements.distant.skipped).toBe(true);
  expect(measurements.distant.ordinaryVisibility).toBe(true);
  expect(measurements.distant.contentVisibility).toBe('auto');
  expect(measurements.distant.top).toBeGreaterThan(measurements.list.bottom);
  expect(measurements.distant.loaded).toBe('false');
  expect(measurements.near.loaded).toBe('true');
  expect(measurements.near.mediaId).toBe('stack_1');
  expect(measurements.near.naturalWidth).toBe(480);
  expect(measurements.near.naturalHeight).toBe(320);
  const availableContentWidth = Math.max(
    0,
    measurements.list.clientWidth - measurements.distant.inlineInsets
  );
  const expectedContentWidth = Math.min(480, availableContentWidth);
  const expectedContentHeight = expectedContentWidth / (480 / 320);
  expect(
    Math.abs(
      measurements.distant.width - (expectedContentWidth + measurements.distant.inlineInsets)
    )
  ).toBeLessThanOrEqual(2);
  expect(
    Math.abs(
      measurements.distant.height - (expectedContentHeight + measurements.distant.blockInsets)
    )
  ).toBeLessThanOrEqual(2);
  expect(Math.abs(measurements.distant.width - measurements.near.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(measurements.distant.height - measurements.near.height)).toBeLessThanOrEqual(2);
  expect(measurements.near.wrapperWidth).toBe(480);
  expect(measurements.near.wrapperHeight).toBe(320);
});
