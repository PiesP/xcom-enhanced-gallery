import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';
import { splitProps } from 'solid-js';
import { render } from 'solid-js/web';

import type { GalleryContainerProps } from './GalleryContainer.types';

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
  const [local] = splitProps(props, ['children', 'className']);

  const classes = cx('xeg-gallery-overlay', 'xeg-gallery-container', local.className);

  return (
    <div class={classes} data-xeg-gallery-container="">
      {local.children}
    </div>
  );
}
