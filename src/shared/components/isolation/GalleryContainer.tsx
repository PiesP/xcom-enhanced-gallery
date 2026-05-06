import type { JSXElement } from '@shared/external/vendors';

import { EventManager } from '@shared/services/event-manager';
import { cx } from '@shared/utils/text/formatting';
import { onCleanup, onMount, splitProps } from 'solid-js';
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
  const [local] = splitProps(props, ['children', 'onClose', 'className']);

  const classes = cx('xeg-gallery-overlay', 'xeg-gallery-container', local.className);

  // Register the Escape key listener once on mount.
  // local.onClose is a reactive getter, so it always reads the latest callback value at invocation time.
  onMount(() => {
    const handler = (event: Event): void => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        local.onClose?.();
      }
    };

    const eventManager = EventManager.getInstance();
    const listenerId = eventManager.addEventListener(document, 'keydown', handler);

    onCleanup(() => {
      if (listenerId) {
        eventManager.removeListener(listenerId);
      }
    });
  });

  return (
    <div class={classes} data-xeg-gallery-container="">
      {local.children}
    </div>
  );
}
