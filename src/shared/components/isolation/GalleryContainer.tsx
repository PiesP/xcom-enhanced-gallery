// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { CSS } from '@constants/css';
import type { ThemeSetting } from '@constants/setting-options';
import {
  activateGalleryHostState,
  type GalleryHostStateHandle,
} from '@shared/components/isolation/gallery-host-state';
import { useTranslation } from '@shared/hooks/use-translation';
import type { ComponentChildren } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';
import { createEffect, onCleanup, splitProps } from 'solid-js';
import { render } from 'solid-js/web';

export interface GalleryContainerProps {
  readonly children: ComponentChildren;
  readonly className?: string;
  readonly lang?: string;
  readonly dir?: 'ltr' | 'rtl';
  readonly theme?: ThemeSetting;
}

const DISPOSE_SYMBOL = Symbol();

type HostElement = HTMLElement & {
  [DISPOSE_SYMBOL]?: () => void;
};

type GalleryRenderable = JSXElement | null | undefined | (() => JSXElement | null | undefined);

export function mountGallery(container: Element, element: GalleryRenderable): Element {
  const host = container as HostElement;
  host[DISPOSE_SYMBOL]?.();
  const factory =
    typeof element === 'function'
      ? (element as () => JSXElement | null | undefined)
      : () => element ?? null;
  host[DISPOSE_SYMBOL] = render(factory, host);
  return container;
}

export function unmountGallery(container: Element): void {
  const host = container as HostElement;
  host[DISPOSE_SYMBOL]?.();
  delete host[DISPOSE_SYMBOL];
  container.replaceChildren();
}

export function GalleryContainer(props: GalleryContainerProps): JSXElement {
  const [local] = splitProps(props, ['children', 'className', 'lang', 'dir', 'theme']);
  const translate = useTranslation();

  const classes = cx(CSS.CLASSES.OVERLAY, CSS.CLASSES.CONTAINER, 'pp-design', local.className);

  let containerEl: HTMLDivElement | undefined;

  // H2: Safari iframe color-scheme workaround — set inline style because
  // Safari does not inherit color-scheme from CSS inside iframes.
  // Read from data-theme attribute and apply via style.setProperty.
  createEffect(() => {
    if (!containerEl) return;

    const applyColorScheme = (el: HTMLDivElement) => {
      const theme = el.getAttribute('data-theme');
      if (theme === 'dark') {
        el.style.setProperty('color-scheme', 'dark');
      } else if (theme === 'light') {
        el.style.setProperty('color-scheme', 'light');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        el.style.setProperty('color-scheme', prefersDark ? 'dark' : 'light');
      }
    };

    applyColorScheme(containerEl);

    const observer = new MutationObserver(() => {
      if (containerEl) applyColorScheme(containerEl);
    });
    observer.observe(containerEl, { attributes: true, attributeFilter: ['data-theme'] });

    onCleanup(() => {
      observer.disconnect();
    });
  });

  // W2: Standardized focus trap — traps Tab/Shift+Tab within the gallery dialog.
  // Uses a single keydown listener on the container root that wraps focus
  // from last → first and first → last focusable element.
  createEffect(() => {
    if (!containerEl) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'iframe',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        containerEl!.querySelectorAll<HTMLElement>(focusableSelectors)
      ).filter((el) => {
        const style = getComputedStyle(el);
        return (
          el.tabIndex >= 0 &&
          el.getClientRects().length > 0 &&
          style.visibility === 'visible' &&
          style.display !== 'none' &&
          !el.closest('[hidden], [inert], [aria-hidden="true"]')
        );
      });

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey) {
        if (document.activeElement === containerEl || document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerEl.addEventListener('keydown', handleKeyDown);
    onCleanup(() => {
      containerEl?.removeEventListener('keydown', handleKeyDown);
    });
  });

  let hostState: GalleryHostStateHandle | null = null;

  createEffect(() => {
    if (!containerEl || hostState) return;
    hostState = activateGalleryHostState(containerEl);
  });

  onCleanup(() => {
    hostState?.restore();
    hostState = null;
  });

  return (
    <div
      ref={(el) => {
        containerEl = el;
      }}
      class={classes}
      data-xeg-gallery-container=""
      data-pp-product="xeg"
      data-pp-theme={local.theme ?? 'auto'}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      aria-label={translate('msg.gal.imageGallery')}
      lang={local.lang ?? 'en'}
      dir={local.dir ?? 'ltr'}
    >
      {local.children}
    </div>
  );
}
