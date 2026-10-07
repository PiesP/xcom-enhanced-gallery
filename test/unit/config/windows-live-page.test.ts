// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

type LivePageModule = {
  inspectLiveTargetDocument(identity: {
    handle: string;
    statusId: string;
  }): false | { state: string; reason?: string; target?: { imageSource: { path: string } } };
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

describe('Windows X live page validation', () => {
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
