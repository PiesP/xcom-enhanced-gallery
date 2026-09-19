// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseComputedRgb(value) {
  const match = /^rgba?\((.*)\)$/i.exec(value.trim());
  assert(match, `Expected computed rgb color, received ${value}`);
  const parts = match[1].replace('/', ' ').split(/[,\s]+/).filter(Boolean);
  assert(parts.length >= 3, `Expected three RGB channels, received ${value}`);
  const channels = parts.slice(0, 3).map((part) =>
    part.endsWith('%') ? (Number.parseFloat(part) / 100) * 255 : Number.parseFloat(part)
  );
  assert(channels.every((channel) => Number.isFinite(channel) && channel >= 0 && channel <= 255));
  if (parts[3] !== undefined) {
    const alpha = parts[3].endsWith('%')
      ? Number.parseFloat(parts[3]) / 100
      : Number.parseFloat(parts[3]);
    assert.equal(alpha, 1, `Contrast check requires an opaque computed color: ${value}`);
  }
  return channels;
}

function relativeLuminance(value) {
  const [red, green, blue] = parseComputedRgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function assertTextContrast(label, foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const ratio =
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  assert(ratio >= 4.5, `${label} contrast ${ratio.toFixed(3)} must be at least 4.5:1`);
  return ratio;
}

/** Artifact injection validates rendering, not userscript-manager installation. */
export async function run({ browser, root, output }) {
  const faultMessages = [
    `XEG_WINDOWS_ACCEPTANCE_RENDER_FAULT_RETRY: ${'bounded-long-recovery-message-'.repeat(18)}`,
    'XEG_WINDOWS_ACCEPTANCE_RENDER_FAULT_CLOSE',
  ];
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    acceptDownloads: true,
  });
  const runtimeErrors = [];
  try {
    await mkdir(output, { recursive: true });
    const page = await context.newPage();
    page.on('pageerror', (error) =>
      runtimeErrors.push({ source: 'pageerror', message: error.message })
    );
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push({ source: 'console', message: message.text() });
      }
    });
    const html = await readFile(
      path.join(root, 'test/e2e/fixtures/mock-gallery-page.html'),
      'utf8'
    );
    const script = await readFile(path.join(root, 'dist/xcom-enhanced-gallery.user.js'), 'utf8');
    // Generate visible, nontrivial PNG fixtures with the browser's own Canvas encoder.
    await page.goto('about:blank');
    const images = await page.evaluate(() =>
      [
        [480, 720],
        [1200, 360],
        [640, 480],
      ].map(([width, height], index) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = ['#154c72', '#73501b', '#254b39'][index];
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e5ecf2';
        ctx.lineWidth = 8;
        ctx.strokeRect(12, 12, width - 24, height - 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Segoe UI';
        ctx.fillText(`Windows fixture ${index + 1}`, 30, 60);
        return canvas.toDataURL('image/png').split(',')[1];
      })
    );
    const pngs = images.map((value) => Buffer.from(value, 'base64'));
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
        return route.fulfill({ contentType: 'text/html', body: html });
      }
      if (url.hostname === 'pbs.twimg.com') {
        const index = url.pathname.includes('5678') ? 1 : url.pathname.includes('9012') ? 2 : 0;
        return route.fulfill({
          contentType: 'image/png',
          body: pngs[index],
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
      return route.abort('blockedbyclient');
    });
    await page.goto('https://x.com/testuser/status/1234567890123456789');
    const { installGMMock } = await import(
      pathToFileURL(path.join(root, 'test/e2e/fixtures/gm-mock.ts')).href
    );
    await installGMMock(page);
    await page.evaluate((encodedFixtures) => {
      // Keep production media extraction deterministic: bypass the callback-only
      // GM_cookie fallback and make the unavailable fixture API fail into DOM extraction.
      document.cookie = 'ct0=windows-acceptance-fixture; path=/; SameSite=Lax';
      window.GM_xmlhttpRequest = (details) => {
        queueMicrotask(() =>
          details.onerror?.({ status: 503, statusText: 'Fixture API disabled' })
        );
        return { abort: () => undefined };
      };
      // Exercise an actual browser download through an explicitly mocked GM host.
      window.GM_download = (details, name) => {
        const options = typeof details === 'string' ? { url: details, name } : details;
        document.documentElement.dataset.xegAcceptanceDownload = options.url;
        const index = options.url.includes('5678') ? 1 : options.url.includes('9012') ? 2 : 0;
        const binary = atob(encodedFixtures[index]);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        try {
          const blob = new Blob([bytes], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = options.filename ?? options.name ?? 'fixture.png';
          (document.querySelector('.xeg-gallery-root') ?? document.body).append(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          options.onload?.();
        } catch (error) {
          options.onerror?.(error);
        }
      };
    }, images);
    await page.addScriptTag({ content: script });
    // Wait for public UI behavior; the production artifact has no debug globals.
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-xeg-gallery-ready') === 'true',
      undefined,
      { timeout: 15_000 }
    );

    const installGalleryRenderFault = async (message) => {
      await page.evaluate((faultMessage) => {
        const prototype = CSSStyleDeclaration.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'setProperty');
        if (!descriptor || typeof descriptor.value !== 'function') {
          throw new Error('CSSStyleDeclaration.setProperty descriptor unavailable');
        }
        const original = descriptor.value;
        const evidence = {
          message: faultMessage,
          property: '--xeg-viewport-w',
          restoredBeforeThrow: false,
          throwCount: 0,
        };
        const records = (window.__xegAcceptanceRenderFaults ??= []);
        records.push(evidence);
        Object.defineProperty(prototype, 'setProperty', {
          ...descriptor,
          value(property, value, priority) {
            if (property === evidence.property && evidence.throwCount === 0) {
              evidence.throwCount += 1;
              Object.defineProperty(prototype, 'setProperty', descriptor);
              evidence.restoredBeforeThrow = prototype.setProperty === original;
              throw new Error(faultMessage);
            }
            return Reflect.apply(original, this, [property, value, priority]);
          },
        });
      }, message);
    };

    const prepareHostSnapshot = () =>
      page.evaluate(() => {
        const trigger = document.querySelector('[data-testid="tweetPhoto"] img');
        if (!(trigger instanceof HTMLElement)) throw new Error('Missing gallery trigger');
        trigger.id = 'recovery-trigger';
        trigger.tabIndex = 0;
        trigger.scrollIntoView({ block: 'center' });
        trigger.focus({ preventScroll: true });
        const main = document.querySelector('main');
        const snapshot = () => ({
          activeId: document.activeElement?.id ?? null,
          bodyStyle: {
            left: document.body.style.left,
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            right: document.body.style.right,
            top: document.body.style.top,
          },
          mainAriaHidden: main?.getAttribute('aria-hidden') ?? null,
          mainInert: main?.hasAttribute('inert') ?? false,
          scrollY,
        });
        // Pointer input can scroll the fixture before the app handles its click.
        // Bind the expectation to the actual interaction, not test setup time.
        window.__xegAcceptanceOpeningHostState = null;
        trigger.addEventListener('pointerdown', () => {
          window.__xegAcceptanceOpeningHostState = snapshot();
        }, { once: true });
      });

    const assertHostRestored = async (expected) => {
      const actual = await page.evaluate(() => {
        const main = document.querySelector('main');
        return {
          activeId: document.activeElement?.id ?? null,
          bodyStyle: {
            left: document.body.style.left,
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            right: document.body.style.right,
            top: document.body.style.top,
          },
          mainAriaHidden: main?.getAttribute('aria-hidden') ?? null,
          mainInert: main?.hasAttribute('inert') ?? false,
          scrollY,
        };
      });
      assert.deepEqual(actual, expected, 'Recovery must restore the exact host state and focus');
    };

    const openFaultedGallery = async (faultMessage) => {
      await prepareHostSnapshot();
      await installGalleryRenderFault(faultMessage);
      await page.locator('[data-testid="tweetPhoto"] img').first().click();
      const expectedHost = await page.evaluate(() => window.__xegAcceptanceOpeningHostState);
      assert(expectedHost, 'Opening interaction must capture the host snapshot');
      const recovery = page.locator('[data-xeg-error-boundary]');
      await recovery.waitFor({ state: 'visible', timeout: 15_000 });
      await assertHostRestored(expectedHost);
      return recovery;
    };

    const inspectRecoveryAppearance = (recovery) =>
      recovery.evaluate((element) => {
        const panel = element.firstElementChild;
        const title = element.querySelector('h2');
        const body = element.querySelector('[role="alert"] p');
        const retry = element.querySelector('[data-xeg-error-action="retry"]');
        const close = element.querySelector('[data-xeg-error-action="close"]');
        if (
          !(panel instanceof HTMLElement) ||
          !(title instanceof HTMLElement) ||
          !(body instanceof HTMLElement) ||
          !(retry instanceof HTMLElement) ||
          !(close instanceof HTMLElement)
        ) {
          throw new Error('Missing recovery appearance target');
        }
        const rootStyle = getComputedStyle(element);
        const panelStyle = getComputedStyle(panel);
        const retryStyle = getComputedStyle(retry);
        const closeStyle = getComputedStyle(close);
        return {
          ariaModal: element.getAttribute('aria-modal'),
          bodyColor: getComputedStyle(body).color,
          bodyText: body.textContent ?? '',
          closeBackground: closeStyle.backgroundColor,
          closeColor: closeStyle.color,
          colorScheme: rootStyle.colorScheme,
          dataTheme: element.getAttribute('data-theme'),
          panelBackground: panelStyle.backgroundColor,
          panelPointerEvents: panelStyle.pointerEvents,
          position: rootStyle.position,
          retryBackground: retryStyle.backgroundColor,
          retryColor: retryStyle.color,
          rootPointerEvents: rootStyle.pointerEvents,
          semanticSection: element.matches('section[aria-labelledby][aria-describedby]'),
          titleColor: getComputedStyle(title).color,
        };
      });

    const keyboardReachRecoveryAction = async (action) => {
      const visited = [];
      for (let step = 0; step < 8; step += 1) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => ({
          action: document.activeElement?.getAttribute('data-xeg-error-action'),
          id: document.activeElement?.id,
          tag: document.activeElement?.tagName,
        }));
        visited.push(focused);
        if (focused.action === action) return visited;
      }
      const targets = await page.evaluate(() =>
        [...document.querySelectorAll('[data-xeg-error-action]')].map((element) => ({
          action: element.getAttribute('data-xeg-error-action'),
          disabled: element.disabled,
          tabIndex: element.tabIndex,
          display: getComputedStyle(element).display,
          visibility: getComputedStyle(element).visibility,
          inertAncestor: element.closest('[inert]')?.outerHTML.slice(0, 300),
          rect: element.getBoundingClientRect().toJSON(),
        }))
      );
      assert.fail(`Keyboard cannot reach recovery ${action}: ${JSON.stringify({ visited, targets })}`);
    };

    await page.emulateMedia({ colorScheme: 'dark' });
    const retryRecovery = await openFaultedGallery(faultMessages[0]);
    const darkRecovery = await inspectRecoveryAppearance(retryRecovery);
    assert.equal(darkRecovery.semanticSection, true);
    assert.equal(darkRecovery.ariaModal, null, 'Recovery surface must remain modeless');
    assert.equal(darkRecovery.dataTheme, 'dark');
    assert.equal(darkRecovery.colorScheme, 'dark');
    assert.equal(darkRecovery.position, 'fixed');
    assert.equal(darkRecovery.rootPointerEvents, 'none');
    assert.equal(darkRecovery.panelPointerEvents, 'auto');
    assert(
      darkRecovery.bodyText.includes(faultMessages[0]),
      'Normalized recovery body must include the complete injected fault message'
    );
    const darkContrast = {
      body: assertTextContrast(
        'Dark recovery body',
        darkRecovery.bodyColor,
        darkRecovery.panelBackground
      ),
      close: assertTextContrast(
        'Dark recovery close button',
        darkRecovery.closeColor,
        darkRecovery.closeBackground
      ),
      retry: assertTextContrast(
        'Dark recovery retry button',
        darkRecovery.retryColor,
        darkRecovery.retryBackground
      ),
      title: assertTextContrast(
        'Dark recovery title',
        darkRecovery.titleColor,
        darkRecovery.panelBackground
      ),
    };
    await page.screenshot({ path: path.join(output, 'gallery-recovery-dark.png') });

    await page.setViewportSize({ width: 320, height: 640 });
    const narrowRecovery = await retryRecovery.evaluate((element) => {
      const panel = element.firstElementChild;
      const body = element.querySelector('[role="alert"] p');
      if (!(panel instanceof HTMLElement) || !(body instanceof HTMLElement)) {
        throw new Error('Missing narrow recovery content');
      }
      const panelRect = panel.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      return {
        bodyRight: bodyRect.right,
        bodyScrollWidth: body.scrollWidth,
        bodyWidth: body.clientWidth,
        panelLeft: panelRect.left,
        panelRight: panelRect.right,
        viewportWidth: innerWidth,
      };
    });
    assert(narrowRecovery.panelLeft >= 0 && narrowRecovery.panelRight <= narrowRecovery.viewportWidth,
      'Recovery panel must fit a 320px viewport');
    assert(narrowRecovery.bodyRight <= narrowRecovery.viewportWidth,
      'Long recovery text must remain inside the viewport');
    assert(narrowRecovery.bodyScrollWidth <= narrowRecovery.bodyWidth,
      'Long recovery text must wrap without horizontal overflow');
    await page.screenshot({ path: path.join(output, 'gallery-recovery-narrow-dark.png') });

    const localizedExpansionLabel = '더 이상 재시도할 수 없음';
    const largeTextRecovery = await retryRecovery.evaluate((element, label) => {
      const retry = element.querySelector('[data-xeg-error-action="retry"]');
      if (!(retry instanceof HTMLButtonElement)) throw new Error('Missing recovery retry action');
      const originalLabel = retry.textContent ?? '';
      element.style.setProperty('--xeg-font-size-base', '2rem');
      retry.textContent = label;
      const buttonStyle = getComputedStyle(retry);
      const rect = retry.getBoundingClientRect();
      return {
        blockSize: rect.height,
        bottom: rect.bottom,
        clientHeight: retry.clientHeight,
        clientWidth: retry.clientWidth,
        fontSize: buttonStyle.fontSize,
        label: retry.textContent,
        originalLabel,
        overflowWrap: buttonStyle.overflowWrap,
        right: rect.right,
        scrollHeight: retry.scrollHeight,
        scrollWidth: retry.scrollWidth,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        whiteSpace: buttonStyle.whiteSpace,
      };
    }, localizedExpansionLabel);
    assert.equal(largeTextRecovery.label, localizedExpansionLabel);
    assert.equal(largeTextRecovery.whiteSpace, 'normal');
    assert.equal(largeTextRecovery.overflowWrap, 'anywhere');
    assert(Number.parseFloat(largeTextRecovery.fontSize) >= 30, 'Recovery must honor 200% text');
    assert(largeTextRecovery.right <= largeTextRecovery.viewportWidth,
      'Large localized recovery action must remain inside the viewport');
    assert(largeTextRecovery.scrollWidth <= largeTextRecovery.clientWidth,
      'Large localized recovery action must not overflow horizontally');
    assert(largeTextRecovery.scrollHeight <= largeTextRecovery.clientHeight,
      'Large localized recovery action must grow to contain wrapped text');
    assert(largeTextRecovery.blockSize >= 44, 'Wrapped recovery action must retain its target size');
    assert(largeTextRecovery.bottom <= largeTextRecovery.viewportHeight,
      'Long error details must not push the recovery action below the viewport');
    await retryRecovery.locator('[data-xeg-error-action="retry"]').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, 'gallery-recovery-narrow-large-text-dark.png'),
    });
    await retryRecovery.evaluate((element, originalLabel) => {
      const retry = element.querySelector('[data-xeg-error-action="retry"]');
      if (!(retry instanceof HTMLButtonElement)) throw new Error('Missing recovery retry action');
      element.style.removeProperty('--xeg-font-size-base');
      retry.textContent = originalLabel;
    }, largeTextRecovery.originalLabel);

    const outside = page.locator('#outside-button');
    await outside.evaluate((element) => {
      window.__xegAcceptanceHostInput = { clicks: 0, keys: [] };
      element.addEventListener('click', () => window.__xegAcceptanceHostInput.clicks++);
      element.addEventListener('keydown', (event) => {
        window.__xegAcceptanceHostInput.keys.push({
          key: event.key,
          prevented: event.defaultPrevented,
        });
      });
    });
    await outside.click();
    assert.equal(await outside.isEnabled(), true, 'Host must remain interactive during recovery');
    assert.equal(await retryRecovery.count(), 1, 'Host interaction must retain modeless recovery');
    await outside.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    const hostInput = await page.evaluate(() => window.__xegAcceptanceHostInput);
    assert.deepEqual(hostInput, {
      clicks: 1,
      keys: [
        { key: 'ArrowRight', prevented: false },
        { key: 'Escape', prevented: false },
      ],
    }, 'Recovery must not swallow host clicks or keyboard navigation');
    assert.equal(await retryRecovery.count(), 1, 'Host Escape must not close modeless recovery');
    const retryKeyboardPath = await keyboardReachRecoveryAction('retry');
    await page.keyboard.press('Enter');
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    assert.equal(await gallery.getAttribute('data-theme'), 'dark');
    assert.equal(
      await page.evaluate(() => document.body.style.position),
      'fixed',
      'Retry must remount the normal gallery and restore its host lock'
    );
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: 'light' });
    const closeRecovery = await openFaultedGallery(faultMessages[1]);
    const lightRecovery = await inspectRecoveryAppearance(closeRecovery);
    assert.equal(lightRecovery.dataTheme, 'light');
    assert.equal(lightRecovery.colorScheme, 'light');
    assert(
      lightRecovery.bodyText.includes(faultMessages[1]),
      'Light recovery body must include the injected fault message'
    );
    const lightContrast = {
      body: assertTextContrast(
        'Light recovery body',
        lightRecovery.bodyColor,
        lightRecovery.panelBackground
      ),
      close: assertTextContrast(
        'Light recovery close button',
        lightRecovery.closeColor,
        lightRecovery.closeBackground
      ),
      retry: assertTextContrast(
        'Light recovery retry button',
        lightRecovery.retryColor,
        lightRecovery.retryBackground
      ),
      title: assertTextContrast(
        'Light recovery title',
        lightRecovery.titleColor,
        lightRecovery.panelBackground
      ),
    };
    await page.screenshot({ path: path.join(output, 'gallery-recovery-light.png') });
    await outside.focus();
    const closeKeyboardPath = await keyboardReachRecoveryAction('close');
    await page.keyboard.press('Enter');
    await closeRecovery.waitFor({ state: 'detached' });
    assert.equal(await page.locator('[data-renderer="gallery"]').count(), 0);
    assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'recovery-trigger');
    await page.keyboard.press('Enter');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
    assert.equal(
      await page.locator('[data-renderer="gallery"]').count(),
      0,
      'Closed recovery controls must not retain keyboard listeners'
    );

    const faultEvidence = await page.evaluate(() => window.__xegAcceptanceRenderFaults ?? []);
    assert.deepEqual(
      faultEvidence,
      faultMessages.map((message) => ({
        message,
        property: '--xeg-viewport-w',
        restoredBeforeThrow: true,
        throwCount: 1,
      })),
      'Each bounded fault must fire once and restore the original DOM API before throwing'
    );

    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    await gallery.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[data-xeg-gallery-container] img')].some(
        (image) => image.complete && image.naturalWidth > 1
      )
    );
    await page.screenshot({ path: path.join(output, 'gallery-portrait.png') });
    const progress = gallery.locator('[role="progressbar"]');
    const initial = await progress.getAttribute('aria-valuenow');
    assert.equal(initial, '1', 'Gallery must open on the clicked first image');

    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    await toolbar.locator('button[aria-label="Fit Window"]').click();
    const selectedFit = toolbar.locator('button[aria-label="Fit Window"][aria-pressed="true"]');
    const selectedStyle = () =>
      selectedFit.evaluate(async (element) => {
        await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderStyle: style.borderStyle,
          borderWidth: style.borderWidth,
          boxShadow: style.boxShadow,
          focusVisible: element.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
    const forcedColorReference = () =>
      page.evaluate(() => {
        const reference = document.createElement('span');
        reference.style.forcedColorAdjust = 'none';
        reference.style.color = 'HighlightText';
        reference.style.backgroundColor = 'Highlight';
        document.body.append(reference);
        const style = getComputedStyle(reference);
        const colors = {
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
        reference.remove();
        return colors;
      });
    assert.equal(await selectedFit.isEnabled(), true, 'Selected fit mode must remain focusable');
    const selectedResting = await selectedStyle();
    assert.notEqual(
      selectedResting.backgroundColor,
      'rgba(0, 0, 0, 0)',
      'Selected fit mode must retain a visible background'
    );
    assert.notEqual(selectedResting.boxShadow, 'none', 'Selected fit mode must retain an inset ring');
    await selectedFit.hover();
    const selectedHovered = await selectedStyle();
    assert.equal(
      selectedHovered.backgroundColor,
      selectedResting.backgroundColor,
      'Hover must not erase selected state'
    );
    assert.equal(
      selectedHovered.boxShadow,
      selectedResting.boxShadow,
      'Hover must not erase the selected ring'
    );
    await page.keyboard.press('Tab');
    await selectedFit.focus();
    const selectedFocused = await selectedStyle();
    assert.equal(
      selectedFocused.backgroundColor,
      selectedResting.backgroundColor,
      'Focus must not erase selected state'
    );
    assert.notEqual(selectedFocused.outlineStyle, 'none', 'Selected focus must remain visible');
    assert.equal(selectedFocused.focusVisible, true, 'Selected focus must use keyboard modality');
    assert(
      Number.parseFloat(selectedFocused.outlineWidth) >= 2,
      'Selected focus outline must be at least 2px'
    );
    await page.emulateMedia({ forcedColors: 'active' });
    await selectedFit.evaluate((element) => element.blur());
    await selectedFit.hover();
    const systemHighlight = await forcedColorReference();
    const selectedForcedHovered = await selectedStyle();
    assert.equal(
      selectedForcedHovered.backgroundColor,
      systemHighlight.backgroundColor,
      'Forced-colors hover must retain the system highlight background'
    );
    assert.equal(
      selectedForcedHovered.color,
      systemHighlight.color,
      'Forced-colors hover must retain the system highlight text'
    );
    await page.keyboard.press('Tab');
    await selectedFit.focus();
    const selectedForced = await selectedStyle();
    assert.equal(
      selectedForced.backgroundColor,
      systemHighlight.backgroundColor,
      'Forced-colors focus must retain the system highlight background'
    );
    assert.equal(
      selectedForced.color,
      systemHighlight.color,
      'Forced-colors focus must retain the system highlight text'
    );
    assert.equal(
      selectedForced.focusVisible,
      true,
      'Forced-colors focus must use keyboard modality'
    );
    assert.equal(selectedForced.borderStyle, 'solid', 'Forced colors must expose a selected border');
    assert(
      Number.parseFloat(selectedForced.borderWidth) >= 2,
      'Forced-colors selected border must be at least 2px'
    );
    assert.notEqual(
      selectedForced.outlineStyle,
      'none',
      'Forced-colors selected focus must remain visible'
    );
    await page.emulateMedia({ forcedColors: 'none' });
    await toolbar.evaluate((element) => element.setAttribute('disabled', ''));
    assert.equal(await selectedFit.isDisabled(), true, 'Disabled toolbar must disable selected fit mode');
    const selectedDisabled = await selectedStyle();
    assert.equal(
      selectedDisabled.backgroundColor,
      selectedResting.backgroundColor,
      'Disabled state must retain selected background'
    );
    assert.equal(
      selectedDisabled.boxShadow,
      selectedResting.boxShadow,
      'Disabled state must retain selected ring'
    );
    await toolbar.evaluate((element) => element.removeAttribute('disabled'));

    // A focused toolbar must survive gallery scrolling. After keyboard focus
    // returns to the image, auto-hide must expose the content beneath it.
    await selectedFit.focus();
    await page.mouse.move(600, 500);
    const items = gallery.locator('[data-gallery-element="items"]');
    const scrollBeforeWheel = await items.evaluate((element) => element.scrollTop);
    await page.mouse.wheel(0, 40);
    await page.waitForFunction((previous) => {
      const items = document.querySelector('[data-gallery-element="items"]');
      return items && items.scrollTop > previous;
    }, scrollBeforeWheel);
    const focusedToolbar = await selectedFit.evaluate((element) => {
      const wrapper = element.closest('[data-gallery-element="toolbar"]').parentElement;
      return {
        focused: document.activeElement === element,
        visibility: getComputedStyle(wrapper).visibility,
        opacity: getComputedStyle(wrapper).opacity,
      };
    });
    assert.equal(focusedToolbar.focused, true);
    assert.equal(focusedToolbar.visibility, 'visible', 'Scrolling must preserve focused toolbar');
    assert.equal(focusedToolbar.opacity, '1');
    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => Boolean(document.activeElement?.closest('[data-gallery-element="item"]')))) break;
    }
    assert.equal(
      await page.evaluate(() => Boolean(document.activeElement?.closest('[data-gallery-element="item"]'))),
      true,
      'Keyboard users must be able to return focus to gallery content'
    );
    await page.waitForFunction(() => {
      const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
      return toolbar && getComputedStyle(toolbar.parentElement).visibility === 'hidden'
        && getComputedStyle(toolbar.parentElement).opacity === '0';
    }, undefined, { timeout: 6000 });
    await page.screenshot({ path: path.join(output, 'gallery-content-uncovered.png') });

    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      (previous) =>
        document
          .querySelector('[data-xeg-gallery-container] [role="progressbar"]')
          ?.getAttribute('aria-valuenow') !== previous,
      initial
    );
    const next = await progress.getAttribute('aria-valuenow');
    assert.equal(next, '2', 'ArrowRight must select the second image');
    await page.screenshot({ path: path.join(output, 'gallery-panorama.png') });
    await page.setViewportSize({ width: 401, height: 592 });
    await page.waitForFunction(() => {
      const items = document.querySelector('[data-gallery-element="items"]');
      const selected = items?.querySelector('[data-gallery-element="item"][data-index="1"]');
      const gallery = items?.parentElement;
      if (!(items instanceof HTMLElement) || !(selected instanceof HTMLElement) || !gallery) {
        return false;
      }
      const selectedTop = selected.getBoundingClientRect().top;
      const itemsTop = items.getBoundingClientRect().top;
      return gallery.style.getPropertyValue('--xeg-viewport-w') === '401px'
        && Math.abs(selectedTop - itemsTop) <= 1;
    });
    assert.equal(
      await progress.getAttribute('aria-valuenow'),
      '2',
      'Viewport resize must preserve the selected second image'
    );
    assert.equal(
      await toolbar.getAttribute('data-current-index'),
      '1',
      'Viewport resize must not change the selected download item'
    );
    assert.equal(
      await toolbar.getAttribute('data-focused-index'),
      '1',
      'Viewport resize must keep the visible item synchronized with the toolbar'
    );
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.mouse.move(200, 4);
    await toolbar.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
      return toolbar && getComputedStyle(toolbar.parentElement).opacity === '1';
    });
    await page.screenshot({ path: path.join(output, 'gallery-narrow-dark.png') });
    const narrowGeometry = await toolbar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: innerWidth };
    });
    assert(narrowGeometry.left >= 0 && narrowGeometry.right <= narrowGeometry.viewport,
      'Toolbar must fit the narrow viewport');
    await page.mouse.move(200, 500);
    await page.waitForFunction(() => {
      const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
      return toolbar && getComputedStyle(toolbar.parentElement).visibility === 'hidden'
        && getComputedStyle(toolbar.parentElement).opacity === '0';
    }, undefined, { timeout: 6000 });
    const narrowContent = await gallery.locator('[data-gallery-element="item"][data-index="1"] img').evaluate((image) => {
      const rect = image.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, naturalWidth: image.naturalWidth };
    });
    assert(narrowContent.top >= -1 && narrowContent.bottom <= 592,
      'The selected panorama must be visible after the narrow toolbar hides');
    assert.equal(narrowContent.naturalWidth, 1200);
    await page.screenshot({ path: path.join(output, 'gallery-narrow-content-uncovered.png') });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.mouse.move(600, 4);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      (async () => {
        await page
          .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
          .click();
        await page.waitForFunction(() =>
          Boolean(document.documentElement.dataset.xegAcceptanceDownload)
        );
      })(),
    ]);
    const requestedUrl = await page.locator('html').getAttribute('data-xeg-acceptance-download');
    assert(requestedUrl?.includes('5678'), 'Download must request the selected second fixture');
    assert.equal(await download.failure(), null);
    const filename = 'downloaded-fixture.png';
    await download.saveAs(path.join(output, filename));
    const bytes = await readFile(path.join(output, filename));
    assert(pngs[1].equals(bytes), 'Downloaded bytes must match the selected second fixture');
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const expectedRuntimeErrors = runtimeErrors.filter(({ message }) =>
      faultMessages.some((fault) => message === fault || message === `Error: ${fault}`)
    );
    const unexpectedRuntimeErrors = runtimeErrors.filter(
      ({ message }) => !faultMessages.some((fault) => message === fault || message === `Error: ${fault}`)
    );
    assert.deepEqual(unexpectedRuntimeErrors, []);
    return {
      checks: [
        'production-userscript-injection',
        'bounded-reactive-render-fault',
        'modeless-host-restoration',
        'recovery-dark-light-theme',
        'recovery-320px-long-message',
        'keyboard-retry-close',
        'recovery-listener-cleanup',
        'gallery-open',
        'toolbar-selected-state',
        'toolbar-selected-focus',
        'toolbar-forced-colors',
        'keyboard-next',
        'focused-toolbar-survives-scroll',
        'keyboard-content-auto-hide',
        'narrow-selected-content',
        'narrow-dark-toolbar',
        'mock-GM-browser-download',
        'escape-close',
      ],
      browserVersion: browser.version(),
      download: {
        file: filename,
        suggestedFilename: download.suggestedFilename(),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      },
      recovery: {
        hostInput,
        keyboardPaths: { retry: retryKeyboardPath, close: closeKeyboardPath },
        contrast: { dark: darkContrast, light: lightContrast },
        expectedRuntimeErrors,
        faultEvidence,
        rawRuntimeErrors: runtimeErrors,
      },
      scope:
        'fixture userscript rendering and mocked-GM browser download; no extension installation or live X.com',
      visualReview: 'pending',
    };
  } finally {
    await context.close();
  }
}
