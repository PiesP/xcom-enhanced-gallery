// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type FirefoxUiSession = {
  readonly context: string;
  command(method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<unknown>;
  evaluateJson(expression: string, timeoutMs?: number): Promise<unknown>;
  navigate(url: string): Promise<void>;
  waitFor(expression: string, description: string, timeoutMs?: number): Promise<void>;
  captureScreenshot(): Promise<Buffer>;
};

type Point = { x: number; y: number };
type Host = { scrollY: number; bodyStyle: string; scrollRestoration: string; opener: boolean };
type Tooltip = {
  text: string;
  direction: string;
  describedBy: boolean;
  inDialog: boolean;
  anchorName: string;
  positionAnchor: string;
  lines: number;
  fontLineHeight: string;
  lineBoxes: Array<{ left: number; top: number; width: number; height: number }>;
  rect: { left: number; top: number; right: number; bottom: number; width: number; height: number };
  trigger: { left: number; top: number; right: number; bottom: number };
  horizontalGap: number;
  hit: boolean;
  viewport: { width: number; height: number };
};

const EXPERIENCE_IMAGES = [
  { path: '/media/XegExperienceTall.jpg', width: 300, height: 900 },
  { path: '/media/XegExperiencePanorama.jpg', width: 1200, height: 200 },
  { path: '/media/XegExperienceSmall.jpg', width: 120, height: 80 },
] as const;

/** Generated inside the installed Firefox session so intrinsic media sizes match the fixture. */
export async function prepareFirefoxNativeUiImages(
  session: FirefoxUiSession,
  longScroll = false
): Promise<Record<string, Buffer>> {
  const images: Record<string, Buffer> = {};
  for (const image of EXPERIENCE_IMAGES) {
    const { path, width } = image;
    const height = longScroll && image.path.endsWith('Tall.jpg') ? 6000 : image.height;
    const data = await session.evaluateJson(`(() => {
      const canvas = document.createElement('canvas');
      canvas.width = ${width}; canvas.height = ${height};
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Firefox fixture canvas is unavailable');
      context.fillStyle = '#346888'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#f5f5f5'; context.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
      return canvas.toDataURL('image/jpeg', 0.8);
    })()`);
    assert(typeof data === 'string' && data.startsWith('data:image/jpeg;base64,'));
    images[path] = Buffer.from(data.slice('data:image/jpeg;base64,'.length), 'base64');
    assert(images[path]!.length > 100, 'Firefox fixture JPEG is empty');
  }
  return images;
}

export async function performFirefoxPointerActions(
  session: FirefoxUiSession,
  actions: Array<Record<string, unknown>>
): Promise<void> {
  try {
    await session.command('input.performActions', {
      context: session.context,
      actions: [
        {
          type: 'pointer',
          id: 'xeg-firefox-ui-pointer',
          parameters: { pointerType: 'mouse' },
          actions,
        },
      ],
    });
  } finally {
    await session.command('input.releaseActions', { context: session.context });
  }
}

async function pointer(
  session: FirefoxUiSession,
  selector: string,
  activate: boolean
): Promise<Point> {
  const point = (await session.evaluateJson(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement)) throw new Error('Missing Firefox native input target');
    element.scrollIntoView({ block: 'center', inline: 'center' });
    const rect = element.getBoundingClientRect();
    const x = Math.floor(rect.left + rect.width / 2);
    const y = Math.floor(rect.top + rect.height / 2);
    if (!rect.width || !rect.height || !element.contains(document.elementFromPoint(x, y))) {
      throw new Error('Firefox native input target is hidden or obscured');
    }
    return { x, y };
  })()`)) as Point;
  const actions: Array<Record<string, unknown>> = [
    { type: 'pointerMove', origin: 'viewport', x: point.x, y: point.y },
  ];
  if (activate) {
    actions.push({ type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 });
  }
  await performFirefoxPointerActions(session, actions);
  return point;
}

export async function firefoxNativeKey(
  session: FirefoxUiSession,
  value: string,
  modifier?: string
): Promise<void> {
  const actions: Array<Record<string, unknown>> = [];
  if (modifier) {
    actions.push({ type: 'keyDown', value: modifier });
  }
  actions.push({ type: 'keyDown', value }, { type: 'keyUp', value });
  if (modifier) {
    actions.push({ type: 'keyUp', value: modifier });
  }
  try {
    await session.command('input.performActions', {
      context: session.context,
      actions: [{ type: 'key', id: 'xeg-firefox-ui-keyboard', actions }],
    });
  } finally {
    await session.command('input.releaseActions', { context: session.context });
  }
}

async function screenshot(session: FirefoxUiSession, output: string, name: string) {
  const bytes = await session.captureScreenshot();
  await writeFile(join(output, name), bytes, { flag: 'wx' });
  return { name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

async function tooltip(session: FirefoxUiSession, trigger: string): Promise<Tooltip> {
  return (await session.evaluateJson(`(() => {
    const button = document.querySelector(${JSON.stringify(trigger)});
    const tip = button?.parentElement?.querySelector('[role="tooltip"]:popover-open');
    if (!(button instanceof HTMLElement) || !(tip instanceof HTMLElement)) throw new Error('Focused tooltip is absent');
    const range = document.createRange(); range.selectNodeContents(tip);
    const lineBoxes = Array.from(range.getClientRects());
    const style = getComputedStyle(tip);
    const rect = tip.getBoundingClientRect(), anchor = button.getBoundingClientRect();
    return {
      text: tip.textContent?.trim() ?? '',
      direction: style.direction,
      describedBy: button.getAttribute('aria-describedby')?.split(/\\s+/).includes(tip.id) ?? false,
      inDialog: Boolean(tip.closest('dialog[data-xeg-gallery-container]')),
      anchorName: getComputedStyle(button).getPropertyValue('anchor-name').trim(),
      positionAnchor: getComputedStyle(tip).getPropertyValue('position-anchor').trim(),
      lines: lineBoxes.length,
      fontLineHeight: style.lineHeight,
      lineBoxes: lineBoxes.map(box => ({ left: box.left, top: box.top, width: box.width, height: box.height })),
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      trigger: { left: anchor.left, top: anchor.top, right: anchor.right, bottom: anchor.bottom },
      horizontalGap: Math.max(anchor.left - rect.right, rect.left - anchor.right, 0),
      hit: document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === tip,
      viewport: { width: innerWidth, height: innerHeight },
    };
  })()`)) as Tooltip;
}

function assertTooltip(tip: Tooltip, label: string): void {
  assert(tip.text.length > 0, `${label}: empty tooltip`);
  assert(tip.describedBy && tip.inDialog, `${label}: accessibility or modal subtree lost`);
  assert(tip.anchorName.startsWith('--xeg-tooltip-'), `${label}: missing native anchor`);
  assert.equal(tip.positionAnchor, tip.anchorName, `${label}: tooltip anchor mismatch`);
  assert(tip.lines > 0 && tip.hit, `${label}: tooltip text or hit target missing`);
  assert(tip.rect.width > 0 && tip.rect.height > 0, `${label}: tooltip collapsed`);
  assert(tip.horizontalGap <= 12, `${label}: tooltip drifted away from its trigger`);
  assert(
    tip.rect.left >= -1 && tip.rect.right <= tip.viewport.width + 1,
    `${label}: horizontal clipping`
  );
  assert(
    tip.rect.top >= -1 && tip.rect.bottom <= tip.viewport.height + 1,
    `${label}: vertical clipping`
  );
}

async function host(session: FirefoxUiSession): Promise<Host> {
  return (await session.evaluateJson(`(() => ({
    scrollY: Math.round(window.scrollY),
    bodyStyle: document.body.getAttribute('style') ?? '',
    scrollRestoration: history.scrollRestoration,
    opener: document.activeElement === document.querySelector('[data-testid="tweetPhoto"] img'),
  }))()`)) as Host;
}

/** Focused installed-browser UI route. It never performs a native download. */
export async function runFirefoxNativeUi(
  session: FirefoxUiSession,
  url: string,
  output: string,
  afterUi?: () => Promise<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  const observations: Record<string, unknown> = {};
  try {
    await session.command('browsingContext.setViewport', {
      context: session.context,
      viewport: { width: 900, height: 700 },
    });
    await session.navigate(url);
    await session.waitFor(
      "document.documentElement.getAttribute('data-xeg-gallery-ready') === 'true'",
      'installed gallery bridge'
    );
    await session.waitFor(
      "document.querySelectorAll('[data-testid=tweetPhoto] img').length === 3 && [...document.querySelectorAll('[data-testid=tweetPhoto] img')].every(image => image.complete && image.naturalWidth > 0)",
      'loaded experience images'
    );
    await session.evaluateJson(`(() => { window.scrollTo(0, 600); history.scrollRestoration = 'auto';
      const opener = document.querySelector('[data-testid="tweetPhoto"] img');
      opener?.addEventListener('pointerdown', () => { opener.dataset.openingScrollY = String(Math.round(scrollY)); }, { once: true, capture: true });
      return true;
    })()`);
    await pointer(session, '[data-testid="tweetPhoto"] img', true);
    await session.waitFor(
      "Boolean(document.querySelector('dialog[data-xeg-gallery-container][open]'))",
      'native gallery dialog'
    );
    const opening = (await session.evaluateJson(`(() => ({
      modal: document.querySelector('dialog[data-xeg-gallery-container]')?.matches(':modal') ?? false,
      focusInDialog: Boolean(document.activeElement?.closest('dialog[data-xeg-gallery-container]')),
      initialFocus: { tag: document.activeElement?.tagName ?? null, id: document.activeElement?.id ?? null },
      hostInert: (() => {
        document.querySelector('[data-testid="tweetPhoto"] img')?.focus();
        return !document.querySelector('main')?.contains(document.activeElement);
      })(),
      openingScrollY: Number(document.querySelector('[data-testid="tweetPhoto"] img')?.getAttribute('data-opening-scroll-y')),
      bodyPosition: document.body.style.position,
      toolbarTransforms: [...document.querySelectorAll('[data-gallery-element="toolbar"], [data-gallery-element="toolbar"] button')].map(element => getComputedStyle(element).transform),
    }))()`)) as {
      modal: boolean;
      focusInDialog: boolean;
      initialFocus: { tag: string | null; id: string | null };
      hostInert: boolean;
      openingScrollY: number;
      bodyPosition: string;
      toolbarTransforms: string[];
    };
    observations.opening = opening;
    assert(
      opening.modal && opening.focusInDialog && opening.hostInert,
      'Firefox native modal focus or inertness failed'
    );
    assert.equal(opening.initialFocus.tag, 'DIALOG', 'Gallery did not initially focus its dialog');
    assert(
      opening.openingScrollY > 0 && opening.bodyPosition === 'fixed',
      'Host scroll lock did not engage'
    );
    assert(
      opening.toolbarTransforms.length > 2 &&
        opening.toolbarTransforms.every((value) => value === 'none'),
      'Toolbar transform is not neutral'
    );
    await firefoxNativeKey(session, '\uE004');
    const tab = await session.evaluateJson(
      "Boolean(document.activeElement?.closest('dialog[data-xeg-gallery-container]'))"
    );
    observations.keyboardFocus = { tab };
    assert.equal(tab, true, 'Tab escaped native modal');
    await firefoxNativeKey(session, '\uE004', '\uE008');
    const shiftTab = await session.evaluateJson(
      "Boolean(document.activeElement?.closest('dialog[data-xeg-gallery-container]') || document.activeElement === document.body || document.activeElement === document.documentElement)"
    );
    observations.keyboardFocus = { tab, shiftTab };
    assert.equal(shiftTab, true, 'Shift+Tab focused background content');

    await pointer(session, '#settings-button', false);
    await session.waitFor(
      "Boolean(document.querySelector('#settings-button + [role=tooltip]:popover-open, #settings-button ~ [role=tooltip]:popover-open'))",
      'settings tooltip'
    );
    const wide = await tooltip(session, '#settings-button');
    observations.scrolledTooltip = wide;
    assertTooltip(wide, 'scrolled host');
    observations.scrolledScreenshot = await screenshot(
      session,
      output,
      'firefox-native-ui-scrolled.png'
    );

    await session.command('browsingContext.setViewport', {
      context: session.context,
      viewport: { width: 420, height: 600 },
    });
    const resized = await tooltip(session, '#settings-button');
    observations.resizedTooltip = resized;
    assertTooltip(resized, 'resized viewport');
    await pointer(session, '#settings-button', true);
    await session.waitFor(
      "document.querySelector('#settings-button')?.getAttribute('aria-expanded') === 'true'",
      'settings panel'
    );
    const settingsTransform = await session.evaluateJson(
      "getComputedStyle(document.querySelector('#toolbar-settings-panel')).transform"
    );
    observations.settingsTransform = settingsTransform;
    assert.equal(settingsTransform, 'none', 'Settings panel transform is not neutral');

    await pointer(session, '#settings-language-select', true);
    await firefoxNativeKey(session, '\uE010'); // End selects Arabic, the final native option.
    await firefoxNativeKey(session, '\uE007'); // Commit the native select before inspecting product state.
    await session.waitFor(
      "document.querySelector('#settings-language-select')?.value === 'ar'",
      'Arabic language selection'
    );
    await session.waitFor(
      "document.querySelector('dialog[data-xeg-gallery-container]')?.getAttribute('dir') === 'rtl' || getComputedStyle(document.querySelector('#settings-button')).direction === 'rtl'",
      'RTL gallery direction'
    );
    await pointer(session, '#settings-button', false);
    await session.waitFor(
      "Boolean(document.querySelector('#settings-button + [role=tooltip]:popover-open, #settings-button ~ [role=tooltip]:popover-open'))",
      'RTL settings tooltip'
    );
    const rtlImmediate = await tooltip(session, '#settings-button');
    observations.rtl = { language: 'ar', immediate: rtlImmediate };
    await session.evaluateJson(`(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      return true;
    })()`);
    const rtl = await tooltip(session, '#settings-button');
    observations.rtl = { language: 'ar', immediate: rtlImmediate, tooltip: rtl };
    if (
      rtl.horizontalGap > 12 ||
      rtl.rect.left < -1 ||
      rtl.rect.right > rtl.viewport.width + 1 ||
      rtl.rect.top < -1 ||
      rtl.rect.bottom > rtl.viewport.height + 1
    ) {
      try {
        observations.rtlDiagnostic = await session.evaluateJson(`(async () => {
          const button = document.querySelector('#settings-button');
          const tip = button?.parentElement?.querySelector('[role="tooltip"]:popover-open');
          const toolbar = button?.closest('[data-gallery-element="toolbar"]');
          const wrapper = toolbar?.parentElement;
          if (!(button instanceof HTMLElement) || !(tip instanceof HTMLElement) || !(wrapper instanceof HTMLElement)) {
            throw new Error('RTL diagnostic elements are missing');
          }
          const measure = () => {
            const rect = tip.getBoundingClientRect(), anchor = button.getBoundingClientRect();
            const tipStyle = getComputedStyle(tip), wrapperStyle = getComputedStyle(wrapper);
            return {
              tip: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
              anchor: { left: anchor.left, top: anchor.top, right: anchor.right, bottom: anchor.bottom },
              horizontalGap: Math.max(anchor.left - rect.right, rect.left - anchor.right, 0),
              tipStyle: { direction: tipStyle.direction, positionArea: tipStyle.getPropertyValue('position-area'), justifySelf: tipStyle.justifySelf, positionTryFallbacks: tipStyle.getPropertyValue('position-try-fallbacks'), left: tipStyle.left, right: tipStyle.right, top: tipStyle.top, bottom: tipStyle.bottom, transform: tipStyle.transform },
              wrapperStyle: { willChange: wrapperStyle.willChange, contain: wrapperStyle.contain, transform: wrapperStyle.transform },
            };
          };
          const ancestors = [];
          for (let element = button; element && ancestors.length < 10; element = element.parentElement) {
            const style = getComputedStyle(element), rect = element.getBoundingClientRect();
            ancestors.push({ tag: element.tagName, className: String(element.className).slice(0, 120), direction: style.direction, position: style.position, willChange: style.willChange, contain: style.contain, transform: style.transform, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom } });
            if (element.matches('dialog[data-xeg-gallery-container]')) break;
          }
          const baseline = measure();
          const inlineBefore = { wrapper: wrapper.style.cssText, tip: tip.style.cssText };
          const popoverOpenBefore = tip.matches(':popover-open');
          const variations = [];
          const settle = async () => {
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => requestAnimationFrame(resolve));
          };
          const variation = async (name, changes) => {
            const original = changes.map(({ element, property }) => ({ element, property, value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property) }));
            try {
              for (const { element, property, value } of changes) element.style.setProperty(property, value);
              await settle();
              variations.push({ name, measured: measure() });
            } finally {
              for (const { element, property, value, priority } of original) {
                if (value) element.style.setProperty(property, value, priority);
                else element.style.removeProperty(property);
              }
              await settle();
            }
          };
          await variation('wrapper-will-change-auto', [{ element: wrapper, property: 'will-change', value: 'auto' }]);
          await variation('wrapper-contain-none', [{ element: wrapper, property: 'contain', value: 'none' }]);
          await variation('wrapper-combined', [{ element: wrapper, property: 'will-change', value: 'auto' }, { element: wrapper, property: 'contain', value: 'none' }]);
          await variation('tooltip-anchor-center', [{ element: tip, property: 'justify-self', value: 'anchor-center' }]);
          await variation('tooltip-ltr', [{ element: tip, property: 'direction', value: 'ltr' }]);
          await variation('tooltip-y-end', [{ element: tip, property: 'position-area', value: 'y-end span-all' }]);
          await variation('native-anchor-insets', [
            { element: tip, property: 'position-area', value: 'none' },
            { element: tip, property: 'left', value: 'anchor(left)' },
            { element: tip, property: 'right', value: 'auto' },
            { element: tip, property: 'top', value: 'anchor(bottom)' },
            { element: tip, property: 'bottom', value: 'auto' },
            { element: tip, property: 'justify-self', value: 'auto' },
            { element: tip, property: 'margin', value: '6px' },
            { element: tip, property: 'transform', value: 'none' },
          ]);
          if (popoverOpenBefore && variations.every(({ measured }) => Math.abs(measured.tip.left - baseline.tip.left) < 0.5)) {
            try {
              tip.hidePopover();
              await settle();
              tip.showPopover();
              await settle();
              variations.push({ name: 'popover-reopen', measured: measure() });
            } finally {
              if (!tip.matches(':popover-open')) tip.showPopover();
              await settle();
            }
          }
          const restored = measure();
          const inlineAfter = { wrapper: wrapper.style.cssText, tip: tip.style.cssText };
          return { baseline, ancestors, variations, restored, inlineRestored: inlineBefore.wrapper === inlineAfter.wrapper && inlineBefore.tip === inlineAfter.tip, popoverRestored: tip.matches(':popover-open') === popoverOpenBefore };
        })()`);
      } catch (error) {
        observations.rtlDiagnosticError =
          error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      }
    }
    assertTooltip(rtl, 'Arabic narrow viewport');
    assert.equal(rtl.direction, 'rtl', 'Arabic tooltip did not inherit RTL');
    assert(rtl.lines <= 3, 'Arabic tooltip wrapped into too many lines');
    assert(
      rtl.rect.width + 1 >= rtl.trigger.right - rtl.trigger.left,
      'Arabic tooltip is narrower than its trigger'
    );
    observations.rtl = {
      language: 'ar',
      immediate: rtlImmediate,
      tooltip: rtl,
      screenshot: await screenshot(session, output, 'firefox-native-ui-rtl.png'),
    };

    await firefoxNativeKey(session, '\uE00C');
    await session.waitFor(
      "document.querySelector('#settings-button')?.getAttribute('aria-expanded') === 'false' && Boolean(document.querySelector('dialog[data-xeg-gallery-container][open]'))",
      'Settings Escape ownership'
    );
    observations.settingsEscape = true;
    await pointer(session, '#keyboard-help-button', true);
    await session.waitFor(
      "document.querySelector('#keyboard-help-button')?.getAttribute('aria-expanded') === 'true'",
      'keyboard help panel'
    );
    await firefoxNativeKey(session, '\uE00C');
    await session.waitFor(
      "document.querySelector('#keyboard-help-button')?.getAttribute('aria-expanded') === 'false' && Boolean(document.querySelector('dialog[data-xeg-gallery-container][open]'))",
      'help Escape ownership'
    );
    observations.helpEscape = true;
    if (afterUi) {
      // Restore the fixture's English/LTR controls before native right-gutter input.
      await pointer(session, '#settings-button', true);
      await session.waitFor(
        "document.querySelector('#settings-button')?.getAttribute('aria-expanded') === 'true'",
        'settings before scrollbar probe'
      );
      await pointer(session, '#settings-language-select', true);
      await firefoxNativeKey(session, '\uE011');
      await firefoxNativeKey(session, '\uE007');
      await session.waitFor(
        "document.querySelector('#settings-language-select')?.value === 'auto'",
        'fixture language restoration'
      );
      await firefoxNativeKey(session, '\uE00C');
      await session.waitFor(
        "document.querySelector('#settings-button')?.getAttribute('aria-expanded') === 'false'",
        'settings closed before native scrollbar input'
      );
      await session.command('browsingContext.setViewport', {
        context: session.context,
        viewport: { width: 900, height: 700 },
      });
      observations.scrollbarTakeover = await afterUi();
    }
    await firefoxNativeKey(session, '\uE00C');
    await session.waitFor(
      "!document.querySelector('dialog[data-xeg-gallery-container]')",
      'gallery Escape'
    );
    const closed = await host(session);
    observations.closed = closed;
    assert.equal(closed.scrollY, opening.openingScrollY, 'Host scroll position was not restored');
    assert.equal(closed.bodyStyle, '', 'Host body inline state was not restored');
    assert.equal(closed.scrollRestoration, 'auto', 'History scroll restoration was not restored');
    assert(closed.opener, 'Native dialog did not restore opener focus');

    await pointer(session, '[data-testid="tweetPhoto"] img', true);
    await session.waitFor(
      "Boolean(document.querySelector('dialog[data-xeg-gallery-container][open]'))",
      'gallery reopen'
    );
    await firefoxNativeKey(session, '\uE00C');
    await session.waitFor(
      "!document.querySelector('dialog[data-xeg-gallery-container]')",
      'reopened gallery Escape'
    );
    observations.reopen = { closed: await host(session) };
    return observations;
  } catch (error) {
    observations.failure =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    try {
      observations.failureScreenshot = await screenshot(
        session,
        output,
        'firefox-native-ui-failure.png'
      );
    } catch {
      /* outer receipt retains the original failure */
    }
    await writeFile(
      join(output, 'firefox-native-ui-observations.json'),
      `${JSON.stringify(observations, null, 2)}\n`,
      { flag: 'wx' }
    );
    throw error;
  } finally {
    if (!('failure' in observations)) {
      await writeFile(
        join(output, 'firefox-native-ui-observations.json'),
        `${JSON.stringify(observations, null, 2)}\n`,
        { flag: 'wx' }
      );
    }
  }
}
