// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { hideBackgroundElement, restoreBackgroundElement } from '@shared/dom/background-visibility';

interface BodyStyleSnapshot {
  readonly left: string;
  readonly overflow: string;
  readonly position: string;
  readonly right: string;
  readonly top: string;
}

export interface GalleryHostStateHandle {
  restore(): void;
}

class GalleryHostState implements GalleryHostStateHandle {
  private readonly bodyStyle: BodyStyleSnapshot;
  private readonly hiddenBackgroundElements: HTMLElement[] = [];
  private readonly previousFocus: HTMLElement | null;
  private readonly previousScrollRestoration: ScrollRestoration | undefined;
  private readonly scrollY: number;
  private readonly backgroundObserver: MutationObserver;
  private restored = false;

  constructor(private readonly container: HTMLElement) {
    this.bodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
    };
    this.scrollY = window.scrollY;
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.previousScrollRestoration =
      'scrollRestoration' in window.history ? window.history.scrollRestoration : undefined;
    this.backgroundObserver = new MutationObserver((records) => this.hideAddedBackground(records));

    this.activate();
  }

  restore(): void {
    if (this.restored) return;
    this.restored = true;
    this.backgroundObserver.disconnect();

    document.body.style.overflow = this.bodyStyle.overflow;
    document.body.style.position = this.bodyStyle.position;
    document.body.style.top = this.bodyStyle.top;
    document.body.style.left = this.bodyStyle.left;
    document.body.style.right = this.bodyStyle.right;
    if (this.previousScrollRestoration !== undefined) {
      window.history.scrollRestoration = this.previousScrollRestoration;
    }
    for (const element of this.hiddenBackgroundElements) restoreBackgroundElement(element);
    this.hiddenBackgroundElements.length = 0;
    window.scrollTo(0, this.scrollY);

    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      try {
        this.previousFocus.focus();
      } catch {
        // The host element may have been removed during SPA navigation.
      }
    }
    if (activeHostState === this) activeHostState = null;
  }

  private activate(): void {
    if (this.previousScrollRestoration !== undefined) {
      window.history.scrollRestoration = 'manual';
    }
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child === this.container || child.contains(this.container)) continue;
      this.hideBackground(child);
    }
    this.backgroundObserver.observe(document.body, { childList: true });

    this.container.focus();
    if (document.activeElement !== this.container) {
      this.container
        .querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        ?.focus();
    }
  }

  private hideAddedBackground(records: MutationRecord[]): void {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node === this.container || node.contains(this.container)) continue;
        this.hideBackground(node);
      }
    }
  }

  private hideBackground(element: HTMLElement): void {
    if (this.hiddenBackgroundElements.includes(element)) return;
    this.hiddenBackgroundElements.push(element);
    hideBackgroundElement(element);
  }
}

let activeHostState: GalleryHostState | null = null;

export function activateGalleryHostState(container: HTMLElement): GalleryHostStateHandle {
  activeHostState?.restore();
  const state = new GalleryHostState(container);
  activeHostState = state;
  return state;
}

export function restoreActiveGalleryHostState(): void {
  activeHostState?.restore();
}
