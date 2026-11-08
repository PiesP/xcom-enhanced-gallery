// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { startAmbientVideoGuard } from '@shared/utils/media/ambient-video-coordinator';

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
  private readonly previousFocus: HTMLElement | null;
  private readonly previousScrollRestoration: ScrollRestoration | undefined;
  private readonly scrollY: number;
  private restored = false;
  private disposeAmbientVideoGuard: (() => void) | null = null;

  constructor() {
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
    this.activate();
  }

  restore(): void {
    if (this.restored) {
      return;
    }
    this.restored = true;
    this.disposeAmbientVideoGuard?.();
    this.disposeAmbientVideoGuard = null;

    document.body.style.overflow = this.bodyStyle.overflow;
    document.body.style.position = this.bodyStyle.position;
    document.body.style.top = this.bodyStyle.top;
    document.body.style.left = this.bodyStyle.left;
    document.body.style.right = this.bodyStyle.right;
    if (this.previousScrollRestoration !== undefined) {
      window.history.scrollRestoration = this.previousScrollRestoration;
    }
    window.scrollTo(0, this.scrollY);

    if (this.previousFocus?.isConnected && typeof this.previousFocus.focus === 'function') {
      try {
        this.previousFocus.focus({ preventScroll: true });
      } catch {
        // The host element may have been removed during SPA navigation.
      }
    }
    if (activeHostState === this) {
      activeHostState = null;
    }
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

    this.disposeAmbientVideoGuard = startAmbientVideoGuard();
  }
}

let activeHostState: GalleryHostState | null = null;

export function activateGalleryHostState(): GalleryHostStateHandle {
  activeHostState?.restore();
  const state = new GalleryHostState();
  activeHostState = state;
  return state;
}

export function restoreActiveGalleryHostState(): void {
  activeHostState?.restore();
}
