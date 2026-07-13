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
      ).filter(
        (el) =>
          !el.hasAttribute('aria-hidden') &&
          (el.getClientRects().length > 0 ||
            (!el.hasAttribute('disabled') && getComputedStyle(el).visibility !== 'hidden'))
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
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

  let scrollRestoration: {
    scrollY: number;
    overflow: string;
    position: string;
    top: string;
    left: string;
    right: string;
  } | null = null;
  let previousScrollRestoration: ScrollRestoration | null = null;
  let previouslyFocusedElement: HTMLElement | null = null;
  let hiddenBackgroundElements: HTMLElement[] = [];
  const ariaHiddenRestore = new Map<HTMLElement, string | null>();

  createEffect(() => {
    if (!scrollRestoration) {
      // Save currently focused element for restoration on close
      previouslyFocusedElement = document.activeElement as HTMLElement | null;
      // W1: Save and override browser's scroll restoration behavior
      if ('scrollRestoration' in window.history) {
        previousScrollRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
      }
      // Lock background scroll without inert (inert blocks ALL mouse events on descendants)
      scrollRestoration = {
        scrollY: window.scrollY,
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
      };
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollRestoration.scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';

      // A3: Hide background content from assistive technology.
      // aria-modal="true" has uneven screen-reader support; explicitly
      // setting aria-hidden on sibling elements ensures AT cannot reach
      // background content regardless of aria-modal implementation.
      // L3: Use document.body.querySelectorAll(':scope > :not([data-xeg-gallery-container])')
      // to avoid assuming the container is a direct body child.
      const children = Array.from(document.body.children);
      const containerElement = containerEl; // local copy for type narrowing
      if (!containerElement || containerElement.parentElement === document.body) {
        // Container is a direct body child or doesn't exist
        hiddenBackgroundElements = children.filter(
          (el) => el !== containerElement && el instanceof HTMLElement
        ) as HTMLElement[];
      } else {
        // Container is nested — hide body-level siblings that don't contain it
        hiddenBackgroundElements = children.filter(
          (el) => el instanceof HTMLElement && !el.contains(containerElement)
        ) as HTMLElement[];
      }
      for (const el of hiddenBackgroundElements) {
        // Save pre-existing value before overriding
        ariaHiddenRestore.set(el, el.getAttribute('aria-hidden'));
        el.setAttribute('aria-hidden', 'true');
      }

      // A11y: Move focus into the dialog so keyboard trap receives events.
      // Focus must move AFTER aria-hidden is set on background elements
      // so that the dialog is the only focusable landmark.
      if (containerElement) {
        containerElement.focus();
        // If dialog itself didn't receive focus, try first focusable child
        if (document.activeElement !== containerElement) {
          const firstFocusable = containerElement.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }
    }
  });

  onCleanup(() => {
    if (scrollRestoration) {
      document.body.style.overflow = scrollRestoration.overflow;
      document.body.style.position = scrollRestoration.position;
      document.body.style.top = scrollRestoration.top;
      document.body.style.left = scrollRestoration.left;
      document.body.style.right = scrollRestoration.right;
      window.scrollTo(0, scrollRestoration.scrollY);
      // W1: Restore browser's scroll restoration to its previous value
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration ?? 'auto';
      }
      scrollRestoration = null;
    }
    // A3: Restore background elements' accessibility state
    for (const el of hiddenBackgroundElements) {
      const previous = ariaHiddenRestore.get(el);
      if (previous === null || previous === undefined) {
        el.removeAttribute('aria-hidden');
      } else {
        el.setAttribute('aria-hidden', previous);
      }
    }
    ariaHiddenRestore.clear();
    hiddenBackgroundElements = [];
    // Return focus to the element that was focused before the gallery opened
    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      try {
        previouslyFocusedElement.focus();
      } catch {
        // Element may have been removed from DOM — safe to ignore
      }
      previouslyFocusedElement = null;
    }
  });

  return (
    <div
      ref={(el) => {
        containerEl = el;
      }}
      class={classes}
      data-xeg-gallery-container=""
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
