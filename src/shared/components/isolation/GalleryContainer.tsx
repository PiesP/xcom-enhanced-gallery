// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { CSS } from '@constants/css';
import type { ThemeSetting } from '@constants/setting-options';
import {
  activateGalleryHostState,
  type GalleryHostStateHandle,
} from '@shared/components/isolation/gallery-host-state';
import { useTranslation } from '@shared/hooks/use-translation';
import { closeGallery } from '@shared/state/signals/gallery.signals';
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

  let containerEl: HTMLDialogElement | undefined;
  let closeRequested = false;

  // H2: Safari iframe color-scheme workaround — set inline style because
  // Safari does not inherit color-scheme from CSS inside iframes.
  // Read from data-theme attribute and apply via style.setProperty.
  createEffect(() => {
    if (!containerEl) {
      return;
    }

    const applyColorScheme = (el: HTMLDialogElement) => {
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
      if (containerEl) {
        applyColorScheme(containerEl);
      }
    });
    observer.observe(containerEl, { attributes: true, attributeFilter: ['data-theme'] });

    onCleanup(() => {
      observer.disconnect();
    });
  });

  let hostState: GalleryHostStateHandle | null = null;

  createEffect(() => {
    if (!containerEl || hostState) {
      return;
    }
    hostState = activateGalleryHostState();
    containerEl.showModal();
    containerEl.focus({ preventScroll: true });
  });

  onCleanup(() => {
    closeRequested = true;
    if (containerEl?.open) {
      containerEl.close();
    }
    hostState?.restore();
    hostState = null;
  });

  const requestClose = (): void => {
    if (closeRequested) {
      return;
    }
    closeRequested = true;
    containerEl?.close();
    closeGallery();
  };

  return (
    <dialog
      ref={(el) => {
        containerEl = el;
      }}
      class={classes}
      data-xeg-gallery-container=""
      data-pp-product="xeg"
      data-pp-theme={local.theme ?? 'auto'}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        const focused = document.activeElement;
        if (
          focused instanceof HTMLElement &&
          (focused.matches('input, select, textarea, video') || focused.isContentEditable)
        ) {
          // Native editing and playback controls own Escape while focused.
          return;
        }
        requestClose();
      }}
      onClose={requestClose}
      aria-label={translate('msg.gal.imageGallery')}
      lang={local.lang ?? 'en'}
      dir={local.dir ?? 'ltr'}
    >
      {local.children}
    </dialog>
  );
}
