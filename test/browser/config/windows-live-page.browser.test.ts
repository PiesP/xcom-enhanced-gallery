// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import * as livePage from '../../../validation/windows/live-page-document.ts';
import * as userscriptInstall from '../../../validation/windows/userscript-document.ts';
import galleryFixtureHtml from '../../e2e/fixtures/installed-gallery-page.html?raw';
import unavailableFixtureHtml from '../../e2e/fixtures/installed-unavailable-sequence-page.html?raw';
import compactFixtureHtml from '../../e2e/fixtures/installed-compact-quote-photo-page.html?raw';
import { describe, expect, it, vi } from 'vite-plus/test';

type LivePageModule = typeof import('../../../validation/windows/live-page.ts');
type Page = import('@playwright/test').Page;

function managerSettingRow(scope: unknown, label: string) {
  return userscriptInstall.managerSettingRow(scope as Page, label);
}

function inspectFirstCurrentDownload(page: unknown, expectedUrl: string) {
  return userscriptInstall.inspectFirstCurrentDownload(page as Page, expectedUrl);
}

describe('Windows X live page DOM validation', () => {
  it('admits only galleries containing two to four image-only items', () => {
    document.body.innerHTML = `<div data-xeg-gallery-container>
      <div data-gallery-element="item"><img src="https://pbs.twimg.com/media/a.jpg"></div>
      <div data-gallery-element="item"><img src="https://pbs.twimg.com/media/b.jpg"></div>
    </div>`;
    const gallery = document.querySelector('[data-xeg-gallery-container]');
    if (!gallery) {
      throw new Error('Gallery fixture missing');
    }
    expect(livePage.eligibleLiveImageGalleryCountDocument(gallery)).toBe(2);
    gallery.querySelectorAll('[data-gallery-element="item"]')[1]!.innerHTML =
      '<video src="https://video.twimg.com/clip.mp4"></video>';
    expect(livePage.eligibleLiveImageGalleryCountDocument(gallery)).toBe(0);
    gallery.querySelectorAll('[data-gallery-element="item"]')[1]!.innerHTML =
      '<img src="https://pbs.twimg.com/media/b.jpg"><video src="https://video.twimg.com/clip.mp4"></video>';
    expect(livePage.eligibleLiveImageGalleryCountDocument(gallery)).toBe(0);
  });

  it('matches the bundled Downloads BETA heading in localized options markup', () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr class="settingstr" id="general-outer"><td>
          <div class="section type_general"><table class="section_content"><tbody>
            <tr class="settingstr" id="config-setting"><td><div>
              <span class="optiondesc">설정 모드: </span>
              <select><option value="50">초보자</option></select>
            </div></td></tr>
            <tr class="settingstr" id="loglevel-setting"><td><div>
              <span class="optiondesc">로그 수준: </span>
              <select><option value="60">정보</option></select>
            </div></td></tr>
          </tbody></table></div>
        </td></tr>
        <tr class="settingstr" id="downloads-outer"><td>
          <div class="section type_downloads"><div class="section_head">다운로드 BETA</div>
            <table class="section_content"><tbody>
              <tr class="settingstr" id="download-mode-setting"><td><div>
                <span class="optiondesc">다운로드 모드: </span>
                <select><option value="chrome">브라우저 API</option></select>
              </div></td></tr>
              <tr class="settingstr" id="whitelist-setting"><td><div>
                <span>파일 확장자 화이트리스트:</span>
                <textarea>/\\.(jpe?g|png)$/\n/\\.(zip|tar)$/</textarea>
              </div></td></tr>
            </tbody></table>
          </div>
        </td></tr>
      </tbody></table>`;
    const heading = document.querySelector('.section.type_downloads .section_head');
    expect(heading).not.toBeNull();
    expect(() =>
      userscriptInstall.requireManagerDownloadsHeading(heading?.textContent ?? '', '다운로드')
    ).not.toThrow();
    expect(() => userscriptInstall.requireManagerDownloadsHeading('다운로드', '다운로드')).toThrow(
      'Manager Downloads section label differs'
    );
    const domScope = (root: Element) => ({
      getByText(label: string, options: { exact: boolean }) {
        expect(options).toEqual({ exact: true });
        const matches = [...root.querySelectorAll('span')].filter(
          (span) => span.textContent?.trim() === label
        );
        expect(matches).toHaveLength(1);
        const labelElement = matches[0];
        if (!labelElement) {
          throw new Error('Missing exact manager setting label');
        }
        return {
          locator(selector: string) {
            expect(selector).toMatch(/^xpath=ancestor::tr\[/u);
            return document.evaluate(
              selector.slice('xpath='.length),
              labelElement,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
          },
        };
      },
    });
    const downloads = document.querySelector('.section.type_downloads');
    expect(downloads).not.toBeNull();
    expect(
      [...document.querySelectorAll('tr.settingstr')].filter((row) =>
        row.textContent?.includes('설정 모드:')
      )
    ).toHaveLength(2);
    for (const [scope, label, expectedId] of [
      [document.body, '설정 모드', 'config-setting'],
      [document.querySelector('.section.type_general'), '로그 수준', 'loglevel-setting'],
      [downloads, '다운로드 모드', 'download-mode-setting'],
      [downloads, '파일 확장자 화이트리스트', 'whitelist-setting'],
    ] as const) {
      expect(managerSettingRow(domScope(scope as Element), label)).toBe(
        document.getElementById(expectedId)
      );
    }
  });

  it('bounds and redacts the owned fixture download error live region', async () => {
    // The browser iframe owns a same-origin URL; the validation helper keeps
    // the installed X fixture URL as its default for real acceptance runs.
    const fixtureUrl = location.href;
    const page = {
      url: () => fixtureUrl,
      evaluate: async (callback: (url: string) => unknown, url: string) => callback(url),
    };
    document.body.innerHTML = `<div data-xeg-gallery-container>
      <div data-gallery-element="toolbar">
        <button aria-label="Download" aria-busy="false"></button>
        <span role="status" data-download-status="error">private failure text</span>
      </div>
      <div class="xeg-sr-only" aria-live="polite" aria-atomic="true">Failed https://private.example/media?key=secret
      C:\\Users\\Alice\\secret.jpg
      Bearer rawCredentialValue</div>
      <li data-gallery-element="item" data-index="0">
        <img src="https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=large">
      </li>
    </div>`;
    try {
      expect(await inspectFirstCurrentDownload(page, fixtureUrl)).toEqual({
        scope: 'owned-fixture',
        galleryPresent: true,
        currentControlPresent: true,
        currentControlDisabled: false,
        currentControlBusy: false,
        selectedFirstFixtureMedia: true,
        downloadStatus: 'error',
        errorLiveRegionPresent: true,
        errorLiveRegionText: 'Failed [url] [path] [credential]',
      });
      const liveRegion = document.querySelector('.xeg-sr-only[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
      liveRegion!.textContent = 'failure '.repeat(100);
      const bounded = (await inspectFirstCurrentDownload(page, fixtureUrl)) as {
        errorLiveRegionText: string;
      };
      expect(bounded.errorLiveRegionText).toHaveLength(256);
      liveRegion!.textContent = 'token=privateValue';
      const token = (await inspectFirstCurrentDownload(page, fixtureUrl)) as {
        errorLiveRegionText: string;
      };
      expect(token.errorLiveRegionText).toBe('[credential]');
      const status = document.querySelector('[data-download-status]');
      status?.setAttribute('data-download-status', 'working');
      const working = (await inspectFirstCurrentDownload(page, fixtureUrl)) as {
        errorLiveRegionText: string | null;
      };
      expect(working.errorLiveRegionText).toBeNull();
      status?.setAttribute('data-download-status', 'error');
      await expect(
        inspectFirstCurrentDownload(
          {
            ...page,
            url: () => 'https://private.example/',
          },
          fixtureUrl
        )
      ).resolves.toEqual({ scope: 'unowned-page' });
      document.body.insertAdjacentHTML(
        'beforeend',
        '<div data-xeg-gallery-container><div class="xeg-sr-only" aria-live="polite">secret</div></div>'
      );
      await expect(inspectFirstCurrentDownload(page, fixtureUrl)).resolves.toEqual({
        scope: 'unowned-gallery',
      });
      document.body.lastElementChild?.remove();
      history.replaceState(null, '', '/navigated-away');
      await expect(inspectFirstCurrentDownload(page, fixtureUrl)).resolves.toEqual({
        scope: 'navigated-away',
      });
    } finally {
      history.replaceState(null, '', fixtureUrl);
      document.body.innerHTML = '';
    }
  });

  it('keeps same-document userscript phases on distinct media cache keys with stable ZIP entries', () => {
    const html = galleryFixtureHtml;
    const allMarkers: string[] = [];
    for (const [phase, markers] of Object.entries(userscriptInstall.MEDIA_COHORTS)) {
      expect(html).toMatch(
        new RegExp(
          String.raw`\[data-fixture-phase=(['"])${phase}\1\] \[data-phase\]:not\(\[data-phase=(['"])${phase}\2\]\)`,
          'u'
        )
      );
      const article = html.match(
        new RegExp(`<article data-route="classic" data-phase="${phase}"[\\s\\S]*?</article>`, 'u')
      );
      expect(article, `Missing ${phase} article`).not.toBeNull();
      const phaseDocument = new DOMParser().parseFromString(article?.[0] ?? '', 'text/html');
      if (phase === 'normal') {
        expect(phaseDocument.querySelector('img[src]')?.getAttribute('src')).toBe(
          'https://pbs.twimg.com/media/GkE1234ABCDEF.jpg?format=jpg&name=large'
        );
      }
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
    expect(
      html.replace('<body data-fixture-route="classic">', '<body data-fixture-route="public">')
    ).toContain('<body data-fixture-route="public">');
    const entries = userscriptInstall.fixtureZipEntries([
      Uint8Array.of(0),
      Uint8Array.of(1),
      Uint8Array.of(2),
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
    const html = galleryFixtureHtml;
    const document = new DOMParser().parseFromString(html, 'text/html');
    const avatar = document.querySelector<HTMLImageElement>(
      'article[data-route="public"] img.public-avatar'
    );
    expect(avatar).not.toBeNull();
    const url = avatar?.src ?? '';
    expect(new URL(url).pathname).toBe(userscriptInstall.PUBLIC_AVATAR_PATH);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(url)).toBe(true);
    const mediaMarkers = Object.values(userscriptInstall.MEDIA_COHORTS).flat();
    const fixtureImages = [...document.querySelectorAll<HTMLImageElement>('img[src]')];
    expect(
      fixtureImages.filter((image) => userscriptInstall.isPublicAvatarFixtureUrl(image.src))
    ).toHaveLength(1);
    expect(
      fixtureImages.every(
        (image) =>
          userscriptInstall.isPublicAvatarFixtureUrl(image.src) ||
          mediaMarkers.some((marker) => new URL(image.src).pathname.includes(marker))
      )
    ).toBe(true);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(`${url}?name=large`)).toBe(false);
    expect(
      userscriptInstall.isPublicAvatarFixtureUrl(url.replace('pbs.twimg.com', 'other.example'))
    ).toBe(false);
    expect(
      userscriptInstall.isPublicAvatarFixtureUrl(url.replace('public-avatar', 'other-avatar'))
    ).toBe(false);
    expect(userscriptInstall.isPublicAvatarFixtureUrl(url.replace('https:', 'http:'))).toBe(false);
  });

  it('admits only the declared unavailable-page preview URLs', () => {
    const html = unavailableFixtureHtml;
    const document = new DOMParser().parseFromString(html, 'text/html');
    const urls = [
      ...document.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img[src], video[poster]'),
    ].map((element) => element.getAttribute(element.tagName === 'VIDEO' ? 'poster' : 'src'));
    expect(urls).toHaveLength(6);
    expect(urls.every((url) => url && userscriptInstall.isUnavailablePreviewFixtureUrl(url))).toBe(
      true
    );
    const first = urls[0];
    expect(first).not.toBeNull();
    if (!first) {
      throw new Error('Missing unavailable preview fixture');
    }
    expect(userscriptInstall.isUnavailablePreviewFixtureUrl(`${first}?name=large`)).toBe(false);
    expect(userscriptInstall.isUnavailablePreviewFixtureUrl(`${first}#fragment`)).toBe(false);
    expect(
      userscriptInstall.isUnavailablePreviewFixtureUrl(
        first.replace('pbs.twimg.com', 'other.example')
      )
    ).toBe(false);
    expect(userscriptInstall.isUnavailablePreviewFixtureUrl(first.replace('https:', 'http:'))).toBe(
      false
    );
    expect(
      userscriptInstall.isUnavailablePreviewFixtureUrl(
        first.replace('unavailable.jpg', 'other.jpg')
      )
    ).toBe(false);
  });

  it('waits when the exact article precedes its image and terminates on a challenge', () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/public_user/status/9876543210987654321">Status</a>
        <img src="https://pbs.twimg.com/media/delayed.jpg" alt="Delayed media">
      </article>
    `;
    const image = document.querySelector('img');
    if (!(image instanceof HTMLImageElement)) {
      throw new Error('Delayed media fixture missing');
    }
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

  it('admits an opacity-zero photo only through its matching painted sibling', () => {
    const identity = { handle: 'NASA', statusId: '2040059770237849635' };
    const mediaUrl = 'https://pbs.twimg.com/media/HE-_ijrXYAA_Wiq';
    document.body.innerHTML = `
      <article>
        <a id="status" href="https://x.com/NASA/status/2040059770237849635">Status</a>
        <a href="https://x.com/NASA/status/2040059770237849635/photo/1">
          <div data-testid="tweetPhoto" id="photo">
            <div id="surface"></div><img id="image" src="${mediaUrl}" alt="Photo">
          </div>
        </a>
      </article>`;
    const article = document.querySelector('article');
    const photo = document.querySelector<HTMLElement>('#photo');
    const surface = document.querySelector<HTMLElement>('#surface');
    const image = document.querySelector<HTMLImageElement>('#image');
    const status = document.querySelector<HTMLAnchorElement>('#status');
    if (!article || !photo || !surface || !image || !status) {
      throw new Error('Painted photo fixture is incomplete');
    }
    const rect = (width = 180) => ({
      bottom: 200,
      height: 120,
      left: 20,
      right: 20 + width,
      toJSON: () => ({}),
      top: 80,
      width,
      x: 20,
      y: 80,
    });
    photo.getBoundingClientRect = () => rect();
    surface.getBoundingClientRect = () => rect();
    image.getBoundingClientRect = () => rect();
    image.style.opacity = '0';
    surface.style.backgroundImage = `url("${mediaUrl}")`;
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 180 },
    });
    const originalHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => image });
    try {
      const ready = livePage.inspectLiveTargetDocument(identity);
      expect(ready).toMatchObject({
        state: 'ready',
        target: { kind: 'image', imageSource: { path: '/media/HE-_ijrXYAA_Wiq' } },
      });
      if (!ready || ready.state !== 'ready' || ready.target.kind !== 'image') {
        throw new Error('Painted photo readiness was not established');
      }
      expect(livePage.resolveLiveImageDocument({ identity, target: ready.target })).toBe(image);

      const rejected = () => expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      surface.style.backgroundImage = `url("${mediaUrl}x")`;
      rejected();
      surface.style.backgroundImage = 'url("https://other.example/media/HE-_ijrXYAA_Wiq")';
      rejected();
      surface.style.backgroundImage = '';
      rejected();
      surface.style.backgroundImage = `url("${mediaUrl}")`;
      surface.style.opacity = '0';
      rejected();
      surface.style.opacity = '';
      surface.getBoundingClientRect = () => rect(150);
      rejected();
      surface.getBoundingClientRect = () => rect();
      const overlay = document.createElement('div');
      document.body.append(overlay);
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: () => overlay,
      });
      rejected();
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: () => image,
      });
      const duplicate = surface.cloneNode() as HTMLElement;
      photo.prepend(duplicate);
      rejected();
      duplicate.remove();
      photo.style.visibility = 'hidden';
      rejected();
      photo.style.visibility = '';
      status.href = 'https://x.com/foreign/status/2040059770237849635';
      rejected();
      status.href = 'https://x.com/NASA/status/2040059770237849635';
      const nested = document.createElement('article');
      nested.innerHTML = '<a href="https://x.com/foreign/status/123">Foreign</a>';
      article.append(nested);
      nested.append(photo.parentElement!);
      rejected();
    } finally {
      if (originalHitTest) {
        Object.defineProperty(document, 'elementFromPoint', originalHitTest);
      } else {
        Reflect.deleteProperty(document, 'elementFromPoint');
      }
    }
  });

  it('keeps the requested image bound when an earlier thread article appears', async () => {
    const identity = { handle: 'NASA', statusId: '2040059770237849635' };
    const statusPath = '/NASA/status/2040059770237849635';
    document.body.innerHTML = `
      <article id="requested">
        <a id="status" href="https://x.com${statusPath}">Status</a>
        <a id="action" href="https://x.com${statusPath}/photo/1">
          <img id="requested-image" src="https://pbs.twimg.com/media/HE-_ijrXYAA_Wiq?format=jpg" alt="Image">
        </a>
      </article>`;
    const image = document.querySelector<HTMLImageElement>('#requested-image');
    const action = document.querySelector<HTMLAnchorElement>('#action');
    const status = document.querySelector<HTMLAnchorElement>('#status');
    if (!image || !action || !status) {
      throw new Error('Requested image fixture is incomplete');
    }
    image.getBoundingClientRect = () => ({
      bottom: 180,
      height: 160,
      left: 20,
      right: 180,
      toJSON: () => ({}),
      top: 20,
      width: 160,
      x: 20,
      y: 20,
    });
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 160 },
    });
    const ready = livePage.inspectLiveTargetDocument(identity);
    if (!ready || ready.state !== 'ready' || ready.target.kind !== 'image') {
      throw new Error('Requested image readiness was not established');
    }
    const boundTarget = ready.target;
    expect(ready.target.articleIndex).toBe(0);

    const preceding = document.createElement('article');
    preceding.innerHTML = `
      <a href="https://x.com/NASA/status/2040059740848283920">Earlier status</a>
      <a href="https://x.com/NASA/status/2040059740848283920/photo/1">
        <img src="https://pbs.twimg.com/media/HE-_hJkWgAApuRC" alt="Earlier image">
      </a>`;
    document.querySelector('#requested')?.before(preceding);
    expect(document.querySelectorAll('article')[ready.target.articleIndex]).toBe(preceding);

    const previousHitTest = Object.getOwnPropertyDescriptor(document, 'elementsFromPoint');
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [action],
    });
    try {
      const selected = livePage.resolveLiveImageDocument({ identity, target: ready.target });
      expect(selected).toBe(image);
      image.src = 'https://pbs.twimg.com/media/temporarily-replaced';
      const rebound = vi.waitFor(
        () =>
          expect(livePage.resolveLiveImageDocument({ identity, target: boundTarget })).toBe(image),
        { interval: 10, timeout: 250 }
      );
      setTimeout(() => {
        image.src = 'https://pbs.twimg.com/media/HE-_ijrXYAA_Wiq?format=jpg';
      }, 20);
      await rebound;
      const boundImage = {
        evaluate: async (
          callback: (element: HTMLImageElement, value: unknown) => unknown,
          value: unknown
        ) => callback(image, value),
      };
      const actionIdentity = await livePage.inspectHitTestedAction(
        boundImage as unknown as Parameters<LivePageModule['inspectHitTestedAction']>[0],
        identity,
        ready.target
      );
      expect(actionIdentity).toMatchObject({ actionPath: `${statusPath}/photo/1`, actionIndex: 1 });
      expect(
        livePage.resolveLiveImageActionDocument(image, {
          actionIndex: actionIdentity?.actionIndex ?? -1,
          compactQuote: false,
        })
      ).toBe(action);

      const duplicate = image.cloneNode() as HTMLImageElement;
      action.append(duplicate);
      expect(livePage.resolveLiveImageDocument({ identity, target: ready.target })).toBeNull();
      duplicate.remove();

      const requestedArticle = document.querySelector('#requested');
      if (!requestedArticle) {
        throw new Error('Requested article detached');
      }
      expect(livePage.isBoundLiveImageOwnerDocument(image, requestedArticle)).toBe(true);
      const movedOwner = document.createElement('article');
      movedOwner.innerHTML = `<a href="https://x.com${statusPath}">Status copy</a>`;
      movedOwner.append(action);
      document.body.append(movedOwner);
      expect(livePage.isBoundLiveImageOwnerDocument(image, requestedArticle)).toBe(false);
      requestedArticle.append(action);

      status.href = 'https://x.com/NASA/status/2040059740848283920';
      expect(livePage.resolveLiveImageDocument({ identity, target: ready.target })).toBeNull();
      expect(
        await livePage.inspectHitTestedAction(
          boundImage as unknown as Parameters<LivePageModule['inspectHitTestedAction']>[0],
          identity,
          ready.target
        )
      ).toBeNull();
      status.href = `https://x.com${statusPath}`;

      image.src = 'https://pbs.twimg.com/media/changed';
      expect(livePage.resolveLiveImageDocument({ identity, target: ready.target })).toBeNull();
      expect(
        await livePage.inspectHitTestedAction(
          boundImage as unknown as Parameters<LivePageModule['inspectHitTestedAction']>[0],
          identity,
          ready.target
        )
      ).toBeNull();
      image.remove();
      expect(livePage.resolveLiveImageDocument({ identity, target: ready.target })).toBeNull();
    } finally {
      if (previousHitTest) {
        Object.defineProperty(document, 'elementsFromPoint', previousHitTest);
      } else {
        Reflect.deleteProperty(document, 'elementsFromPoint');
      }
    }
  });

  it('uses only a real preceding same-author status anchor for SPA evidence', () => {
    document.body.innerHTML = `
      <article><a id="parent" href="https://x.com/NASA/status/2040059740848283920">Parent</a></article>
      <article><a href="https://x.com/NASA/status/2040059770237849635">Requested</a>
        <img id="requested" src="https://pbs.twimg.com/media/HE-_ijrXYAA_Wiq"></article>`;
    const image = document.querySelector<HTMLImageElement>('#requested');
    const parent = document.querySelector<HTMLAnchorElement>('#parent');
    if (!image || !parent) {
      throw new Error('SPA status-link fixture is incomplete');
    }
    const argument = {
      identity: { handle: 'NASA', statusId: '2040059770237849635' },
      host: 'x.com',
    };
    expect(livePage.findPrecedingLiveStatusAnchorDocument(image, argument)).toBe(parent);
    parent.href = 'https://x.com/other/status/2040059740848283920';
    expect(livePage.findPrecedingLiveStatusAnchorDocument(image, argument)).toBeNull();
    parent.href = 'https://x.com/NASA/status/2040059740848283920?context=unsafe';
    expect(livePage.findPrecedingLiveStatusAnchorDocument(image, argument)).toBeNull();
  });

  it('reads mixed gallery selected and focused media without treating a hidden playing video as selected', () => {
    document.body.innerHTML = `
      <div data-xeg-gallery-container>
        <div data-gallery-element="toolbar" data-current-index="1" data-focused-index="1">
          <span id="xeg-toolbar-counter" data-gallery-element="position" data-position="2"
            data-total="2" data-current-index="1" data-focused-index="1"></span>
        </div>
        <div data-gallery-element="item" data-index="0" data-media-loaded="true">
          <img id="photo" src="https://pbs.twimg.com/media/mixed-photo"></div>
        <div data-gallery-element="item" data-index="1" data-media-loaded="true">
          <video id="video" src="https://video.twimg.com/ext_tw_video/mixed.mp4"></video></div>
      </div>`;
    const video = document.querySelector<HTMLVideoElement>('#video');
    const photo = document.querySelector<HTMLImageElement>('#photo');
    const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
    const counter = document.querySelector('#xeg-toolbar-counter');
    if (!video || !photo || !toolbar || !counter) {
      throw new Error('Mixed gallery fixture is incomplete');
    }
    Object.defineProperties(video, {
      readyState: { configurable: true, value: 2 },
      paused: { configurable: true, value: false },
    });
    Object.defineProperties(photo, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 20 },
    });
    expect(livePage.inspectLiveMixedGallerySelectionDocument()).toMatchObject({
      index: 1,
      kind: 'video',
      source: { path: '/ext_tw_video/mixed.mp4' },
      otherPlayingVideos: 0,
    });
    toolbar.setAttribute('data-current-index', '0');
    toolbar.setAttribute('data-focused-index', '0');
    counter.setAttribute('data-position', '1');
    counter.setAttribute('data-current-index', '0');
    counter.setAttribute('data-focused-index', '0');
    expect(livePage.inspectLiveMixedGallerySelectionDocument()).toMatchObject({
      index: 0,
      kind: 'image',
      otherPlayingVideos: 1,
    });
    Object.defineProperty(video, 'paused', { configurable: true, value: true });
    expect(livePage.inspectLiveMixedGallerySelectionDocument()).toMatchObject({
      index: 0,
      kind: 'image',
      otherPlayingVideos: 0,
    });
  });

  it.each(['', '/photo/1'])(
    'recognizes only the bounded A > B > C compact photo with its same-owner %s overlay',
    async (photoSuffix) => {
      document.body.innerHTML = compactFixtureHtml;
      for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')) {
        anchor.href = `https://x.com${anchor.getAttribute('href')}`;
      }
      const image = document.querySelector<HTMLImageElement>('#c-photo');
      const overlay = document.querySelector<HTMLAnchorElement>('#c-overlay');
      if (!image || !overlay) {
        throw new Error('Compact fixture is incomplete');
      }
      const imageLink = image.closest('a');
      if (!imageLink) {
        throw new Error('Compact image link is missing');
      }
      const ownerPath = '/inner_fixture/status/7555555555555555555';
      imageLink.href = `https://x.com${ownerPath}${photoSuffix}`;
      overlay.href = imageLink.href;
      image.style.display = 'block';
      image.getBoundingClientRect = () => ({
        x: 20,
        y: 20,
        left: 20,
        top: 20,
        right: 82,
        bottom: 82,
        width: 62,
        height: 62,
        toJSON: () => ({}),
      });
      Object.defineProperties(image, {
        complete: { configurable: true, value: true },
        naturalWidth: { configurable: true, value: 62 },
      });
      const previousHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: () => overlay,
      });
      try {
        const identity = { handle: 'outer_fixture', statusId: '8555555555555555555' };
        const ready = livePage.inspectLiveTargetDocument(identity);
        expect(ready).toMatchObject({
          state: 'ready',
          target: {
            kind: 'image',
            quoteBoundary: 'compact-two-level',
            directQuoteId: '9555555555555555555',
            ownerStatusId: '7555555555555555555',
            ownerHandle: 'inner_fixture',
            imageSource: { path: '/media/CompactQuoteSelected' },
          },
        });
        if (!ready || ready.state !== 'ready' || !ready.target || ready.target.kind !== 'image') {
          throw new Error('Compact image readiness was not established');
        }
        const preceding = document.createElement('article');
        preceding.innerHTML =
          '<a href="https://x.com/other_fixture/status/6555555555555555555">Earlier status</a>';
        document.body.prepend(preceding);
        expect(document.querySelectorAll('article')[ready.target.articleIndex]).toBe(preceding);
        expect(livePage.resolveLiveImageDocument({ identity, target: ready.target })).toBe(image);
        const locator = {
          evaluate: async (
            callback: (image: HTMLImageElement, value: unknown) => unknown,
            value: unknown
          ) => callback(image, value),
        };
        const actionIdentity = await livePage.inspectHitTestedAction(
          locator as unknown as Parameters<LivePageModule['inspectHitTestedAction']>[0],
          identity,
          ready.target as Parameters<LivePageModule['inspectHitTestedAction']>[2]
        );
        expect(actionIdentity).toMatchObject({ actionPath: `${ownerPath}${photoSuffix}` });
        expect(
          livePage.resolveLiveImageActionDocument(image, {
            actionIndex: actionIdentity?.actionIndex ?? -1,
            compactQuote: true,
          })
        ).toBe(overlay);

        const bSlot = document.querySelector('#b-media-slot');
        if (!bSlot) {
          throw new Error('B media slot missing');
        }
        const bImage = document.createElement('img');
        bImage.src = 'https://pbs.twimg.com/media/CompactQuoteMiddle.jpg';
        bSlot.append(bImage);
        expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
          state: 'ready',
          target: { ownerStatusId: '7555555555555555555' },
        });
        bImage.remove();

        overlay.href = 'https://x.com/other_fixture/status/6555555555555555555';
        expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
        overlay.href = `https://x.com${ownerPath}/photo/2`;
        expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
        expect(
          await livePage.inspectHitTestedAction(
            locator as unknown as Parameters<LivePageModule['inspectHitTestedAction']>[0],
            identity,
            ready.target as Parameters<LivePageModule['inspectHitTestedAction']>[2]
          )
        ).toBeNull();
        overlay.href = imageLink.href;
        const title = document.querySelector('#c-header');
        Object.defineProperty(document, 'elementFromPoint', {
          configurable: true,
          value: () => title,
        });
        expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
        Object.defineProperty(document, 'elementFromPoint', {
          configurable: true,
          value: () => overlay,
        });
        const duplicate = image.cloneNode() as HTMLImageElement;
        image.parentElement?.append(duplicate);
        expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      } finally {
        if (previousHitTest) {
          Object.defineProperty(document, 'elementFromPoint', previousHitTest);
        } else {
          Reflect.deleteProperty(document, 'elementFromPoint');
        }
      }
    }
  );

  it('selects only a unique hit-tested flat native C photo action without an image', async () => {
    document.body.innerHTML = `
      <article>
        <a href="https://x.com/outer_fixture/status/8555555555555555555"><time>A</time></a>
        <div role="link" id="b-wrapper">
          <div role="link" data-testid="nestedQuotePreview">
            <a role="link" data-testid="nestedQuotePreviewMedia"
              href="https://x.com/inner_fixture/status/7555555555555555555/photo/1">
              <div><div><div id="native-hit"></div></div></div>
            </a>
          </div>
        </div>
      </article>
    `;
    const identity = { handle: 'outer_fixture', statusId: '8555555555555555555' };
    const action = document.querySelector<HTMLAnchorElement>(
      'a[data-testid="nestedQuotePreviewMedia"]'
    );
    const hit = document.querySelector('#native-hit');
    if (!action || !hit) {
      throw new Error('Native preview fixture is incomplete');
    }
    action.getBoundingClientRect = () => ({
      x: 20,
      y: 20,
      left: 20,
      top: 20,
      right: 84,
      bottom: 84,
      width: 64,
      height: 64,
      toJSON: () => ({}),
    });
    const previousHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => hit,
    });
    const locator = {
      evaluate: async (
        callback: (element: HTMLAnchorElement, value: unknown) => unknown,
        value: unknown
      ) => callback(action, value),
    };
    try {
      const ready = livePage.inspectLiveTargetDocument(identity);
      expect(ready).toMatchObject({
        state: 'ready',
        target: {
          kind: 'native-preview-photo',
          articleIndex: 0,
          actionPath: '/inner_fixture/status/7555555555555555555/photo/1',
          ownerStatusId: '7555555555555555555',
          photoNumber: 1,
          quoteBoundary: 'flat-nested-preview',
        },
      });
      expect(document.querySelector('article img')).toBeNull();
      if (!ready || ready.state !== 'ready' || !ready.target) {
        throw new Error('Native preview was not ready');
      }
      const check = () =>
        livePage.inspectHitTestedNativePreviewAction(
          locator as unknown as Parameters<
            LivePageModule['inspectHitTestedNativePreviewAction']
          >[0],
          identity,
          ready.target as Parameters<LivePageModule['inspectHitTestedNativePreviewAction']>[2]
        );
      expect(await check()).toBe(true);

      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: () => document.querySelector('time'),
      });
      expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      expect(await check()).toBe(false);
      Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => hit });
      action.href = 'https://x.com/outer_fixture/status/8555555555555555555/photo/1';
      expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      action.href = 'https://x.com/inner_fixture/status/7555555555555555555/photo/1';
      action.href += '?private=1';
      expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      action.href = 'https://x.com/inner_fixture/status/7555555555555555555/photo/1';
      action.style.display = 'none';
      expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      action.style.display = '';
      action.closest('[data-testid="nestedQuotePreview"]')?.after(action);
      expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
    } finally {
      if (previousHitTest) {
        Object.defineProperty(document, 'elementFromPoint', previousHitTest);
      } else {
        Reflect.deleteProperty(document, 'elementFromPoint');
      }
    }
  });

  it('rejects duplicate native C actions and duplicate exact A articles', async () => {
    document.body.innerHTML = `
      <article><a href="https://x.com/outer/status/123">A</a>
        <div role="link"><div role="link" data-testid="nestedQuotePreview">
          <a role="link" data-testid="nestedQuotePreviewMedia"
            href="https://x.com/inner/status/456/photo/1"><div>photo</div></a>
        </div></div>
      </article>`;
    const action = document.querySelector<HTMLAnchorElement>(
      'a[data-testid="nestedQuotePreviewMedia"]'
    );
    if (!action) {
      throw new Error('Native preview action missing');
    }
    action.getBoundingClientRect = () => ({
      x: 20,
      y: 20,
      left: 20,
      top: 20,
      right: 84,
      bottom: 84,
      width: 64,
      height: 64,
      toJSON: () => ({}),
    });
    const originalHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => action.firstElementChild,
    });
    try {
      const identity = { handle: 'outer', statusId: '123' };
      const ready = livePage.inspectLiveTargetDocument(identity);
      expect(ready).toMatchObject({
        state: 'ready',
        target: { kind: 'native-preview-photo' },
      });
      if (!ready || ready.state !== 'ready' || !ready.target) {
        throw new Error('Native preview was not ready');
      }
      const duplicate = action.cloneNode(true);
      action.after(duplicate);
      expect(livePage.inspectLiveTargetDocument(identity)).toEqual({
        state: 'ambiguous',
        reason: 'multiple-native-preview-actions',
        candidateCount: 2,
      });
      duplicate.parentNode?.removeChild(duplicate);
      const outer = document.querySelector('article');
      outer?.after(outer.cloneNode(true));
      expect(livePage.inspectLiveTargetDocument(identity)).toBe(false);
      const locator = {
        evaluate: async (
          callback: (element: HTMLAnchorElement, value: unknown) => unknown,
          value: unknown
        ) => callback(action, value),
      };
      expect(
        await livePage.inspectHitTestedNativePreviewAction(
          locator as unknown as Parameters<
            LivePageModule['inspectHitTestedNativePreviewAction']
          >[0],
          identity,
          ready.target as Parameters<LivePageModule['inspectHitTestedNativePreviewAction']>[2]
        )
      ).toBe(false);
    } finally {
      if (originalHitTest) {
        Object.defineProperty(document, 'elementFromPoint', originalHitTest);
      } else {
        Reflect.deleteProperty(document, 'elementFromPoint');
      }
    }
  });

  it('reads only a unique canonical gallery owner link from the opened panel', () => {
    document.body.innerHTML = `<div data-xeg-gallery-container>
      <section data-gallery-element="tweet-panel">
        <a href="https://x.com/inner/status/456">C</a>
      </section>
    </div>`;
    expect(livePage.inspectNativePreviewOwnerDocument()).toBe('/inner/status/456');
    const owner = document.querySelector<HTMLAnchorElement>('section a');
    if (!owner) {
      throw new Error('Owner link missing');
    }
    owner.href += '/photo/1';
    expect(livePage.inspectNativePreviewOwnerDocument()).toBeNull();
    owner.href = 'https://x.com/inner/status/456';
    owner.after(owner.cloneNode(true));
    expect(livePage.inspectNativePreviewOwnerDocument()).toBeNull();
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
    if (!video) {
      throw new Error('Video fixture missing');
    }
    video.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    const identity = { handle: 'outer', statusId: '123' };
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready',
      target: {
        kind: 'quoted-video',
        quoteBoundary: 'quoteTweet',
        quoteStatusIds: ['456'],
        posterSource: { host: 'pbs.twimg.com', path: '/ext_tw_video_thumb/456/pu/img/poster.jpg' },
        ownershipPath: [
          { tag: 'video', testId: null },
          { tag: 'div', testId: 'videoPlayer' },
          { tag: 'div', testId: 'quoteTweet' },
        ],
      },
    });
    expect(
      livePage.inspectLiveTargetDocument({ ...identity, preferOwnedPhoto: true })
    ).toMatchObject({
      state: 'ready',
      target: { kind: 'quoted-video', quoteBoundary: 'quoteTweet' },
    });
    expect(livePage.inspectLiveCandidateDocument(identity)).toMatchObject({
      exactArticleFound: true,
      statusIds: ['123', '456'],
      quoteCardCount: 1,
      videoPlayerCount: 1,
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
    if (!video) {
      throw new Error('Video fixture missing');
    }
    video.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    expect(livePage.inspectLiveTargetDocument({ handle: 'outer', statusId: '123' })).toMatchObject({
      state: 'ready',
      target: {
        kind: 'quoted-video',
        quoteBoundary: 'unmarked-candidate',
        quoteStatusIds: [],
      },
    });
    const photo = document.createElement('a');
    photo.href = 'https://x.com/outer/status/123/photo/1';
    photo.innerHTML = '<img src="https://pbs.twimg.com/media/direct-photo" alt="Direct photo">';
    document.querySelector('article')?.append(photo);
    const image = photo.querySelector('img');
    if (!image) {
      throw new Error('Mixed photo fixture missing');
    }
    image.getBoundingClientRect = video.getBoundingClientRect;
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 160 },
    });
    expect(livePage.inspectLiveTargetDocument({ handle: 'outer', statusId: '123' })).toMatchObject({
      state: 'ready',
      target: { kind: 'quoted-video' },
    });
    expect(
      livePage.inspectLiveTargetDocument({
        handle: 'outer',
        statusId: '123',
        preferOwnedPhoto: true,
      })
    ).toMatchObject({
      state: 'ready',
      target: { kind: 'image', imageSource: { path: '/media/direct-photo' } },
    });
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
    if (!button) {
      throw new Error('Play button fixture missing');
    }
    button.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    const identity = { handle: 'outer', statusId: '123' };
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready',
      target: {
        kind: 'quoted-video',
        quoteBoundary: 'quoteTweet',
        previewIndex: 0,
        posterSource: { path: '/amplify_video_thumb/456/img/poster.jpg' },
      },
    });
    expect(livePage.inspectLiveCandidateDocument(identity)).toMatchObject({
      previewInterstitialCount: 1,
      playButtonCount: 1,
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
        bottom: 200,
        height: 100,
        left: 0,
        right: 200,
        toJSON: () => ({}),
        top: 100,
        width: 200,
        x: 0,
        y: 100,
      });
    }
    expect(livePage.inspectLiveTargetDocument(identity)).toEqual({
      state: 'ambiguous',
      reason: 'multiple-visible-video-candidates',
      candidateCount: 2,
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
      videoDetails: [
        {
          sourceKind: 'blob',
          poster: { host: 'pbs.twimg.com', path: '/amplify_video_thumb/456/img/poster.jpg' },
        },
      ],
      thumbnailDetails: [
        {
          sourceKind: 'image',
          source: { host: 'pbs.twimg.com', path: '/amplify_video_thumb/456/img/poster.jpg' },
        },
      ],
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
    if (!image) {
      throw new Error('Quoted poster fixture missing');
    }
    image.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 200 },
    });
    const identity = { handle: 'outer', statusId: '123' };
    expect(livePage.inspectLiveTargetDocument(identity)).toMatchObject({
      state: 'ready',
      target: {
        kind: 'quoted-video',
        quoteBoundary: 'nested-article',
        quoteStatusIds: ['456'],
        posterIndex: 0,
        posterSource: { path: '/amplify_video_thumb/456/img/b.jpg' },
      },
    });
    const candidate = livePage.inspectLiveCandidateDocument(identity);
    expect(candidate).toMatchObject({
      outerArticleOwnStatusAnchors: [
        {
          path: '/outer/status/123',
          containsTime: true,
          nearestArticleIndex: 0,
          structure: [{ tag: 'a', role: null, testId: null }],
        },
      ],
      videoDetails: [
        {
          nearestArticleIndex: 1,
          ancestorArticleIndexes: [1, 0],
          ownStatusPaths: ['/quoted/status/456'],
        },
        {
          nearestArticleIndex: 2,
          ancestorArticleIndexes: [2, 1, 0],
          ownStatusPaths: ['/deeper/status/789'],
        },
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
    expect(observation).toMatchObject({
      videoDetails: [
        {
          nearestArticleIndex: 1,
          ownStatusPaths: ['/quoted/status/456', '/other/status/457'],
          ownStatusAnchors: [
            {
              path: '/quoted/status/456',
              containsTime: false,
              nearestArticleIndex: 1,
              structure: [
                { tag: 'a', role: null, testId: null },
                { tag: 'div', role: 'link', testId: null },
              ],
            },
            {
              path: '/other/status/457',
              containsTime: true,
              nearestArticleIndex: 1,
              structure: [
                { tag: 'a', role: null, testId: null },
                { tag: 'div', role: null, testId: 'User-Name' },
              ],
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(observation)).not.toMatch(/token=private|evil\.example|timestamp/u);
  });

  it('uses a non-control poster point within the quote media scope', () => {
    document.body.innerHTML = `
      <article><img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
        <button>Native play control</button></article>
    `;
    const image = document.querySelector<HTMLImageElement>('img');
    const button = document.querySelector<HTMLButtonElement>('button');
    if (!image || !button) {
      throw new Error('Hit-test fixture missing');
    }
    image.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: (x: number) => (x < 100 ? [button] : [image]),
    });
    try {
      expect(
        livePage.inspectHitTestedVideoActionDocument(image, {
          posterPath: '/amplify_video_thumb/456/img/b.jpg',
        })
      ).toMatchObject({
        inQuote: true,
        x: 160,
        y: 120,
        rejectedControls: 1,
        mediaScopeDepth: 0,
      });
      expect(
        livePage.inspectHitTestedVideoActionDocument(image, {
          posterPath: '/amplify_video_thumb/other/img/b.jpg',
        })
      ).toBeNull();
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [button],
      });
      expect(
        livePage.inspectHitTestedVideoActionDocument(image, {
          posterPath: '/amplify_video_thumb/456/img/b.jpg',
        })
      ).toMatchObject({ inQuote: false, rejectedControls: 9 });
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('retains the identified video when native playback removes its sibling poster', () => {
    document.body.innerHTML = `<article><div>
      <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
      <button>Native play</button>
      <video src="blob:https://x.com/playing" poster="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg"></video>
    </div></article>`;
    const target = {
      playerIndex: -1,
      previewIndex: -1,
      posterIndex: 0,
      videoIndex: 0,
      hitKind: 'video',
    };
    const article = document.querySelector('article')!;
    const video = article.querySelector('video')!;
    const button = article.querySelector('button')!;
    const selected = () => {
      const surface = livePage.quotedVideoSurface(target);
      return article.querySelectorAll<HTMLElement>(surface.selector)[surface.index]!;
    };
    video.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [button],
    });
    try {
      expect(selected()).toBe(video);
      article.querySelector('img')!.remove();
      expect(selected()).toBe(video);
      const expected = { posterPath: '/amplify_video_thumb/456/img/b.jpg' };
      const hit = livePage.inspectHitTestedVideoActionDocument(selected(), expected);
      expect(hit?.nativePlay).toBeTruthy();
      expect(
        livePage.findHitTestedVideoControlDocument(selected(), {
          x: hit!.nativePlay!.x,
          y: hit!.nativePlay!.y,
          posterPath: expected.posterPath,
        })
      ).toBe(button);
      video.poster = 'https://pbs.twimg.com/amplify_video_thumb/999/img/other.jpg';
      expect(
        livePage.inspectHitTestedVideoActionDocument(selected(), expected)?.nativePlay
      ).toBeFalsy();
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
    if (!image || !button || !video) {
      throw new Error('Native play fixture missing');
    }
    let top = 100;
    image.getBoundingClientRect = () => ({
      bottom: top + 100,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top,
      width: 200,
      x: 0,
      y: top,
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
        nativePlay: {
          x: 40,
          y: 120,
          mediaScopeDepth: 1,
          scopeCounts: {
            scopeDepth: 1,
            videoCount: 1,
            totalImageCount: 2,
            trustedVideoThumbnailCount: 1,
            ordinaryImageCount: 1,
          },
        },
      });
      expect(JSON.stringify(hit)).not.toMatch(/avatar|token=private|nested\.jpg|outside\.jpg/u);
      const focusTarget = livePage.findHitTestedVideoControlDocument(image, {
        x: 40,
        y: 120,
        posterPath: '/amplify_video_thumb/456/img/b.jpg',
      });
      expect(focusTarget).toBe(button);
      focusTarget?.focus();
      expect(document.activeElement).toBe(button);
      expect(
        livePage.findHitTestedVideoControlDocument(image, {
          x: 40,
          y: 120,
          posterPath: '/amplify_video_thumb/999/img/other.jpg',
        })
      ).toBeNull();
      const outside = document.createElement('button');
      document.body.append(outside);
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [outside],
      });
      expect(
        livePage.findHitTestedVideoControlDocument(image, {
          x: 40,
          y: 120,
          posterPath: '/amplify_video_thumb/456/img/b.jpg',
        })
      ).toBeNull();
      expect(
        livePage.inspectHostVideoDocument(video, {
          posterPath: '/amplify_video_thumb/456/img/b.jpg',
        })
      ).toMatchObject({
        sourceKind: 'blob',
        poster: { host: 'pbs.twimg.com', path: '/amplify_video_thumb/456/img/b.jpg' },
      });
      Object.defineProperty(document, 'elementsFromPoint', {
        configurable: true,
        value: () => [button],
      });
      const scope = document.querySelector<HTMLElement>('article > div');
      if (!scope) {
        throw new Error('Native play scope missing');
      }
      for (let index = 0; index < 25; index += 1) {
        const avatar = document.createElement('img');
        avatar.src = `https://pbs.twimg.com/profile_images/${index}/avatar.jpg?token=private`;
        scope.append(avatar);
      }
      expect(
        livePage.inspectHitTestedVideoActionDocument(image, {
          posterPath: '/amplify_video_thumb/456/img/b.jpg',
        })
      ).toMatchObject({
        nativePlay: {
          scopeCounts: {
            videoCount: 1,
            totalImageCount: 20,
            trustedVideoThumbnailCount: 1,
            ordinaryImageCount: 20,
          },
        },
      });
      top = 260;
      expect(
        livePage.inspectHitTestedVideoActionDocument(image, {
          posterPath: '/amplify_video_thumb/456/img/b.jpg',
        })
      ).toMatchObject({
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
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
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
        x: initialHit?.nativePlay?.x ?? -1,
        y: initialHit?.nativePlay?.y ?? -1,
        ...expected,
      });
      expect(initialHit).toMatchObject({
        inQuote: false,
        nativePlay: { x: 40, y: 120, mediaScopeDepth: 1 },
      });
      expect(control).toBe(mediaButton);
      control?.focus();
      const finalHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      const evidence = {
        controlledVideoClickMode: 'allow-all',
        galleryActionKind: 'media-scoped-control-under-allow-all',
        initialHit,
        finalHit,
        identityBeforeClick: true,
        focusPrepared: document.activeElement === control,
        meaningfulFocusTarget: control instanceof HTMLElement,
        focusedControlStillOwnsClick:
          document.activeElement === control &&
          document
            .elementsFromPoint(finalHit?.nativePlay?.x ?? -1, finalHit?.nativePlay?.y ?? -1)[0]
            ?.closest('button') === control,
      };
      expect(livePage.quotedVideoHitTestPassed(evidence)).toBe(true);
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          controlledVideoClickMode: 'block-controls-only',
        })
      ).toBe(false);
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          focusedControlStillOwnsClick: false,
        })
      ).toBe(false);
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          focusPrepared: false,
        })
      ).toBe(false);
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          identityBeforeClick: false,
        })
      ).toBe(false);

      top = otherMediaButton;
      const changedControlHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      expect(changedControlHit).toMatchObject({
        inQuote: false,
        nativePlay: { mediaScopeDepth: 1 },
      });
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          finalHit: changedControlHit,
          focusedControlStillOwnsClick:
            document
              .elementsFromPoint(
                changedControlHit?.nativePlay?.x ?? -1,
                changedControlHit?.nativePlay?.y ?? -1
              )[0]
              ?.closest('button') === control,
        })
      ).toBe(false);

      top = otherButton;
      const outOfScopeHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      expect(outOfScopeHit).toMatchObject({ inQuote: false, nativePlay: null });
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          finalHit: outOfScopeHit,
        })
      ).toBe(false);

      top = image;
      const ordinaryHit = livePage.inspectHitTestedVideoActionDocument(image, expected);
      expect(ordinaryHit).toMatchObject({ inQuote: true, nativePlay: null });
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          finalHit: ordinaryHit,
        })
      ).toBe(false);
      expect(
        livePage.quotedVideoHitTestPassed({
          ...evidence,
          controlledVideoClickMode: null,
          galleryActionKind: 'non-control-media-surface',
          initialHit: ordinaryHit,
          finalHit: ordinaryHit,
          focusedControlStillOwnsClick: undefined,
        })
      ).toBe(true);
    } finally {
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('captures a trusted activation on the verified sibling play control of an unmarked poster', () => {
    document.body.innerHTML = `<article><div class="unmarked-media">
      <img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">
      <button id="play"><svg><path></path></svg></button>
      <button id="changed">Changed media control</button>
    </div><button id="adjacent">Adjacent</button></article>
    <article><button id="foreign">Foreign</button></article>`;
    const image = document.querySelector<HTMLImageElement>('img');
    const play = document.querySelector<HTMLButtonElement>('#play');
    const icon = play?.querySelector<SVGElement>('svg');
    const changed = document.querySelector<HTMLButtonElement>('#changed');
    const adjacent = document.querySelector<HTMLButtonElement>('#adjacent');
    const foreign = document.querySelector<HTMLButtonElement>('#foreign');
    if (!image || !play || !icon || !changed || !adjacent || !foreign) {
      throw new Error('Unmarked poster control fixture missing');
    }
    image.getBoundingClientRect = () => ({
      bottom: 200,
      height: 100,
      left: 0,
      right: 200,
      toJSON: () => ({}),
      top: 100,
      width: 200,
      x: 0,
      y: 100,
    });
    let top: Element = icon;
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [top],
    });
    const add = vi.spyOn(window, 'addEventListener');
    let capture: ReturnType<LivePageModule['captureActivationFocusDocument']> | undefined;
    try {
      const point = { x: 40, y: 120 };
      const posterPath = '/amplify_video_thumb/456/img/b.jpg';
      expect(livePage.inspectHitTestedVideoActionDocument(image, { posterPath })).toMatchObject({
        inQuote: false,
        nativePlay: { ...point, mediaScopeDepth: 1 },
      });
      const control = livePage.findHitTestedVideoControlDocument(image, { ...point, posterPath });
      expect(control).toBe(play);
      expect(
        livePage.findHitTestedVideoControlDocument(image, {
          ...point,
          posterPath: '/amplify_video_thumb/999/img/other.jpg',
        })
      ).toBeNull();
      control?.focus();
      expect(document.activeElement).toBe(play);
      expect(livePage.findActivationHitDocument(image, { articleIndex: 0, point })).toBeNull();
      const hit = livePage.findActivationHitDocument(play, { articleIndex: 0, point });
      expect(hit).toBe(icon);
      if (!(hit instanceof Element)) {
        throw new Error('Activation hit missing');
      }
      capture = livePage.captureActivationFocusDocument(hit, { articleIndex: 0, point });
      const listener = add.mock.calls.find(([type]) => type === 'click')?.[1];
      if (typeof listener !== 'function') {
        throw new Error('Activation listener missing');
      }
      listener({
        isTrusted: false,
        button: 0,
        clientX: point.x,
        clientY: point.y,
        target: icon,
      } as unknown as MouseEvent);
      expect(capture.captured).toBe(false);
      listener({
        isTrusted: true,
        button: 0,
        clientX: point.x,
        clientY: point.y,
        target: icon,
      } as unknown as MouseEvent);
      expect(capture.captured).toBe(true);
      expect(capture.focus).toBe(play);
      for (const other of [changed, adjacent, foreign]) {
        top = other;
        expect(livePage.findActivationHitDocument(play, { articleIndex: 0, point })).toBeNull();
      }
    } finally {
      capture?.dispose();
      add.mockRestore();
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
      configurable: true,
      value: () => [top],
    });
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    let capture: ReturnType<LivePageModule['captureActivationFocusDocument']> | undefined;
    try {
      prepared.focus();
      expect(document.activeElement).toBe(prepared);
      const hit = livePage.findActivationHitDocument(player, {
        articleIndex: 0,
        point: { x: 40, y: 120 },
      });
      expect(hit).toBe(overlay);
      if (!(hit instanceof HTMLElement)) {
        throw new Error('Activation hit missing');
      }
      capture = livePage.captureActivationFocusDocument(hit, {
        articleIndex: 0,
        point: { x: 40, y: 120 },
      });
      const listener = add.mock.calls.find(([type]) => type === 'click')?.[1];
      if (typeof listener !== 'function') {
        throw new Error('Activation listener missing');
      }
      player.focus(); // Native pointer behavior before the click event.
      listener({
        isTrusted: true,
        button: 0,
        clientX: 40,
        clientY: 120,
        target: overlay,
      } as unknown as MouseEvent);
      expect(capture.captured).toBe(true);
      expect(capture.focus).toBe(player);
      expect(capture.focus).not.toBe(prepared);
      prepared.focus(); // Gallery focus while open.
      player.focus(); // Escape restores the actual activation focus.
      expect(document.activeElement).toBe(capture.focus);
      capture.dispose();
      expect(remove).toHaveBeenCalledWith('click', listener, true);
      top = adjacent;
      expect(
        livePage.findActivationHitDocument(player, {
          articleIndex: 0,
          point: { x: 40, y: 120 },
        })
      ).toBeNull();
      top = foreign;
      expect(
        livePage.findActivationHitDocument(player, {
          articleIndex: 0,
          point: { x: 40, y: 120 },
        })
      ).toBeNull();
    } finally {
      capture?.dispose();
      add.mockRestore();
      remove.mockRestore();
      Reflect.deleteProperty(document, 'elementsFromPoint');
    }
  });

  it('rejects missing, untrusted, out-of-scope, and non-meaningful activation focus', () => {
    document.body.innerHTML =
      '<article><button>Inside</button></article><article><button>Outside</button></article>';
    const article = document.querySelector('article');
    const inside = article?.querySelector('button');
    const outside = document.querySelectorAll('article')[1]?.querySelector('button');
    if (!article || !inside || !outside) {
      throw new Error('Activation fixture missing');
    }
    const add = vi.spyOn(window, 'addEventListener');
    const capture = livePage.captureActivationFocusDocument(article, {
      articleIndex: 0,
      point: { x: 40, y: 120 },
    });
    try {
      const listener = add.mock.calls.find(([type]) => type === 'click')?.[1];
      if (typeof listener !== 'function') {
        throw new Error('Activation listener missing');
      }
      expect(capture.captured).toBe(false);
      inside.focus();
      inside.click();
      expect(capture.captured).toBe(false);
      const click = (target: Element, x = 40, y = 120, button = 0): void => {
        listener({
          isTrusted: true,
          button,
          clientX: x,
          clientY: y,
          target,
        } as unknown as MouseEvent);
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

  it('requires the selected video currentSrc for full URL identity', () => {
    document.body.innerHTML = `
      <div data-xeg-gallery-container>
        <div data-gallery-element="toolbar" data-current-index="0"></div>
        <div data-gallery-element="item"><video src="https://video.twimg.com/amplify_video/456/vid/clip.mp4?configured=1"></video></div>
      </div>`;
    const video = document.querySelector('video');
    if (!video) {
      throw new Error('Video fixture missing');
    }
    Object.defineProperty(video, 'currentSrc', { configurable: true, value: '' });
    expect(livePage.readSelectedCurrentVideoUrlDocument(0)).toBeNull();
    Object.defineProperty(video, 'currentSrc', {
      configurable: true,
      value: 'https://video.twimg.com/amplify_video/456/vid/clip.mp4?active=1',
    });
    expect(livePage.readSelectedCurrentVideoUrlDocument(0)).toBe(
      'https://video.twimg.com/amplify_video/456/vid/clip.mp4?active=1'
    );
    expect(livePage.readSelectedCurrentVideoUrlDocument(1)).toBeNull();
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
    if (!video || !sibling) {
      throw new Error('Sibling poster fixture missing');
    }
    const expected = { posterPath: '/amplify_video_thumb/456/img/b.jpg' };
    expect(livePage.inspectHostVideoDocument(video, expected)).toMatchObject({
      poster: { host: 'pbs.twimg.com', path: expected.posterPath },
      posterEvidence: 'unique-sibling-image',
      matchingSiblingCount: 1,
    });
    video.poster = 'https://pbs.twimg.com/amplify_video_thumb/999/img/other.jpg';
    expect(livePage.inspectHostVideoDocument(video, expected)).toMatchObject({
      poster: null,
      posterEvidence: 'conflict',
    });
    video.removeAttribute('poster');
    sibling.insertAdjacentHTML(
      'afterend',
      '<img src="https://pbs.twimg.com/amplify_video_thumb/456/img/b.jpg">'
    );
    expect(livePage.inspectHostVideoDocument(video, expected)).toMatchObject({
      poster: null,
      posterEvidence: 'ambiguous-sibling-images',
      matchingSiblingCount: 2,
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
    if (!selectedImage) {
      throw new Error('Selected gallery image fixture missing');
    }
    selectedImage.src = 'https://pbs.twimg.com/media/target.jpg?name=orig';
    const wrongImage = document.querySelector<HTMLImageElement>(
      '[data-gallery-element="item"][data-index="0"] img'
    );
    if (!wrongImage) {
      throw new Error('Other gallery image fixture missing');
    }
    wrongImage.src = 'https://pbs.twimg.com/media/other.jpg';
    expect(livePage.inspectSelectedGalleryDocument(expected)).toEqual({
      imageSource: { host: 'pbs.twimg.com', path: '/media/target.jpg' },
      itemIndex: 1,
      itemVisible: true,
      positionValue: 2,
    });
    expect(
      livePage.inspectSelectedGalleryDocument({
        expectedIndex: null,
        expectedPath: '/media/target',
        allowPhotoFormatVariant: true,
      })
    ).toMatchObject({ itemIndex: 1, positionValue: 2 });

    const position = document.querySelector<HTMLElement>('#xeg-toolbar-counter');
    const toolbar = document.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
    if (!position || !toolbar) {
      throw new Error('Gallery context fixture missing');
    }

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
      if (original === null) {
        element.removeAttribute(attribute);
      } else {
        element.setAttribute(attribute, original);
      }
    }

    wrongImage.src = 'https://pbs.twimg.com/media/target.jpg';
    expect(livePage.inspectSelectedGalleryDocument(expected)).toBe(false);
  });
});
