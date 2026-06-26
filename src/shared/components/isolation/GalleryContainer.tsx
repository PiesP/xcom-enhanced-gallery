// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { CSS } from '@constants/css';
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
  const [local] = splitProps(props, ['children', 'className', 'lang', 'dir']);
  const translate = useTranslation();

  const classes = cx(CSS.CLASSES.OVERLAY, CSS.CLASSES.CONTAINER, local.className);

  let scrollRestoration: { scrollY: number; overflow: string; position: string } | null = null;

  createEffect(() => {
    if (!scrollRestoration) {
      // Lock background scroll without inert (inert blocks ALL mouse events on descendants)
      scrollRestoration = {
        scrollY: window.scrollY,
        overflow: document.body.style.overflow,
        position: document.body.style.position,
      };
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollRestoration.scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    }
  });

  onCleanup(() => {
    if (scrollRestoration) {
      document.body.style.overflow = scrollRestoration.overflow;
      document.body.style.position = scrollRestoration.position;
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollRestoration.scrollY);
      scrollRestoration = null;
    }
  });

  return (
    <div
      class={classes}
      data-xeg-gallery-container=""
      role="dialog"
      aria-modal="true"
      aria-label={translate('msg.gal.imageGallery')}
      lang={local.lang ?? 'en'}
      dir={local.dir ?? 'ltr'}
    >
      {local.children}
    </div>
  );
}
