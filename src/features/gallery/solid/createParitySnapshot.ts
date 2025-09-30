/**
 * @fileoverview Gallery parity snapshot helper
 * @description Provides deterministic Solid vs Preact snapshot data for Stage B parity tests.
 */

import { GalleryRenderer } from '../GalleryRenderer';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import { galleryState, setGalleryState, closeGallery } from '@shared/state/signals/gallery.signals';
import { bridgeRegister, bridgeResetServices } from '@shared/container/service-bridge';
import { SERVICE_KEYS } from '@/constants';
import type { MediaInfo } from '@shared/types/media.types';
import { setFeatureFlagOverride, resetFeatureFlagOverrides } from '@shared/config/feature-flags';

interface GallerySnapshotItem {
  readonly mediaId: string;
  readonly mediaType: MediaInfo['type'];
  readonly active: boolean;
}

interface GallerySnapshot {
  readonly positionText: string;
  readonly statusText: string;
  readonly items: readonly GallerySnapshotItem[];
  readonly downloadDisabled: boolean;
}

export interface GalleryParitySnapshotOptions {
  readonly mediaItems: readonly MediaInfo[];
  readonly startIndex?: number;
}

export interface GalleryParitySnapshot {
  readonly solid: GallerySnapshot;
  readonly preact: GallerySnapshot;
}

type GalleryVariant = 'solid' | 'preact';

const MEDIA_ID_FALLBACK_PREFIX = 'media-index-';

/**
 * Public API — create snapshots for both Solid and Preact gallery implementations.
 */
export async function createGalleryParitySnapshot(
  options: GalleryParitySnapshotOptions
): Promise<GalleryParitySnapshot> {
  const { mediaItems, startIndex = 0 } = options;

  const solid = await renderAndCaptureVariant('solid', mediaItems, startIndex);
  const preact = await renderAndCaptureVariant('preact', mediaItems, startIndex);

  return { solid, preact };
}

async function renderAndCaptureVariant(
  variant: GalleryVariant,
  mediaItems: readonly MediaInfo[],
  startIndex: number
): Promise<GallerySnapshot> {
  const restoreServices = registerMediaServiceStub();

  resetFeatureFlagOverrides();
  setFeatureFlagOverride('solidGalleryShell', variant === 'solid');
  setFeatureFlagOverride('solidSettingsPanel', variant === 'solid');

  resetGalleryDom();

  const renderer = new GalleryRenderer();

  try {
    await renderer.render(mediaItems, { startIndex });

    const container = await waitForCondition(() => {
      const node = document.querySelector('.xeg-gallery-renderer');
      if (!node) {
        throw new Error('Gallery container has not been created yet');
      }

      const attribute = node.getAttribute('data-renderer-impl');
      if (attribute !== variant) {
        throw new Error(
          `Expected renderer variant "${variant}" but found "${attribute ?? 'unknown'}"`
        );
      }

      return node as HTMLElement;
    });

    const state = galleryState(); // Native SolidJS Accessor
    if (!state.isOpen) {
      throw new Error('Gallery state did not open during parity snapshot capture');
    }

    const snapshot =
      variant === 'solid'
        ? captureSolidSnapshot(container, mediaItems, state)
        : capturePreactSnapshot(container, mediaItems, state);

    return snapshot;
  } finally {
    try {
      closeGallery();
    } catch {
      // ignore close failures in test parity helpers
    }

    try {
      renderer.destroy();
    } catch {
      // ensure destruction does not interfere with cleanup
    }

    resetGalleryDom();
    resetFeatureFlagOverrides();
    restoreServices();
    resetGalleryState();
  }
}

async function waitForCondition<T>(
  callback: () => T,
  timeoutMs = 2000,
  intervalMs = 16
): Promise<T> {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeoutMs) {
    try {
      return callback();
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw (lastError as Error | undefined) ?? new Error('Timed out waiting for condition');
}

function registerMediaServiceStub(): () => void {
  bridgeResetServices();

  const mediaServiceStub = {
    async prepareForGallery(): Promise<void> {
      // no-op stub ensures GalleryRenderer can proceed
    },
    restoreBackgroundVideos(): void {
      // no-op
    },
  } satisfies Record<string, unknown>;

  bridgeRegister(SERVICE_KEYS.MEDIA_SERVICE, mediaServiceStub);

  return () => {
    bridgeResetServices();
  };
}

function captureSolidSnapshot(
  container: HTMLElement,
  mediaItems: readonly MediaInfo[],
  state: GalleryState
): GallerySnapshot {
  const root = container.shadowRoot ?? container;
  const host: ParentNode = root instanceof ShadowRoot ? root : container;

  const shell = host.querySelector('[data-xeg-solid-shell]') as HTMLElement | null;
  if (!shell) {
    throw new Error('Solid gallery shell was not rendered');
  }

  const derived = deriveStateSnapshot(state);
  const counter = host.querySelector('[data-gallery-element="counter"]') as HTMLElement | null;
  const positionText = extractCounterText(counter) ?? derived.positionText;

  if (positionText !== derived.positionText) {
    throw new Error(
      `Solid position text mismatch: expected "${derived.positionText}" but received "${positionText}"`
    );
  }

  const downloadButton = host.querySelector(
    '[data-gallery-element="download-all"]'
  ) as HTMLButtonElement | null;
  const downloadDisabled = Boolean(
    downloadButton?.disabled ?? downloadButton?.getAttribute('aria-disabled') === 'true'
  );

  const itemsRoot = host.querySelector('[data-xeg-role="items-container"]') as HTMLElement | null;
  if (!itemsRoot) {
    throw new Error('Solid gallery items container missing');
  }

  const elements = Array.from(
    itemsRoot.querySelectorAll('[data-xeg-component="vertical-image-item"]')
  ) as HTMLElement[];
  if (elements.length !== mediaItems.length) {
    throw new Error(
      `Solid gallery rendered ${elements.length} items but expected ${mediaItems.length}`
    );
  }

  const items = elements.map((element, index) => {
    const indexAttr = element.getAttribute('data-index');
    const resolvedIndex = indexAttr ? Number.parseInt(indexAttr, 10) : index;
    const safeIndex = Number.isFinite(resolvedIndex) ? resolvedIndex : index;
    const media = mediaItems[safeIndex] ?? mediaItems[index];

    const active =
      element.getAttribute('data-xeg-gallery') === 'true' && safeIndex === state.currentIndex;

    return {
      mediaId: resolveMediaId(media, safeIndex),
      mediaType: media?.type ?? 'image',
      active,
    } satisfies GallerySnapshotItem;
  });

  return {
    positionText,
    statusText: derived.statusText,
    items,
    downloadDisabled,
  } satisfies GallerySnapshot;
}

function capturePreactSnapshot(
  container: HTMLElement,
  mediaItems: readonly MediaInfo[],
  state: GalleryState
): GallerySnapshot {
  const root = container.shadowRoot ?? container;
  const host: ParentNode = root instanceof ShadowRoot ? root : container;

  const counter = host.querySelector('[data-gallery-element="counter"]') as HTMLElement | null;
  const derived = deriveStateSnapshot(state);
  const positionText = extractCounterText(counter) ?? derived.positionText;

  if (positionText !== derived.positionText) {
    throw new Error(
      `Preact position text mismatch: expected "${derived.positionText}" but received "${positionText}"`
    );
  }

  const downloadButton = host.querySelector(
    '[data-gallery-element="download-all"]'
  ) as HTMLButtonElement | null;
  const downloadDisabled = Boolean(
    downloadButton?.disabled ?? downloadButton?.getAttribute('aria-disabled') === 'true'
  );

  const itemsRoot = host.querySelector('[data-xeg-role="items-container"]') as HTMLElement | null;
  if (!itemsRoot) {
    throw new Error('Preact items container missing');
  }

  const elements = Array.from(itemsRoot.children) as HTMLElement[];
  if (elements.length !== mediaItems.length) {
    throw new Error(
      `Preact gallery rendered ${elements.length} items but expected ${mediaItems.length}`
    );
  }

  const items = elements.map((element, index) => {
    const indexAttr = element.getAttribute('data-index');
    const resolvedIndex = indexAttr ? Number.parseInt(indexAttr, 10) : index;
    const safeIndex = Number.isFinite(resolvedIndex) ? resolvedIndex : index;
    const media = mediaItems[safeIndex] ?? mediaItems[index];

    return {
      mediaId: resolveMediaId(media, safeIndex),
      mediaType: media?.type ?? 'image',
      active: safeIndex === state.currentIndex,
    } satisfies GallerySnapshotItem;
  });

  return {
    positionText,
    statusText: derived.statusText,
    items,
    downloadDisabled,
  } satisfies GallerySnapshot;
}

function deriveStateSnapshot(state: GalleryState): { positionText: string; statusText: string } {
  const total = state.mediaItems.length;
  const clampedIndex = Math.max(0, Math.min(state.currentIndex, Math.max(total - 1, 0)));
  const positionText = total === 0 ? '0/0' : `${clampedIndex + 1}/${total}`;
  const statusText = state.error ? `error:${state.error}` : state.isLoading ? 'loading' : 'idle';
  return { positionText, statusText };
}

function resolveMediaId(media: MediaInfo | undefined, index: number): string {
  if (media?.id) {
    return media.id;
  }
  if (media?.url) {
    return media.url;
  }
  return `${MEDIA_ID_FALLBACK_PREFIX}${index}`;
}

function extractCounterText(counter: HTMLElement | null): string | null {
  if (!counter) {
    return null;
  }
  const text = counter.textContent ?? '';
  const normalized = text.replace(/\s+/g, '');
  return normalized.length > 0 ? normalized : null;
}

function resetGalleryDom(): void {
  const nodes = document.querySelectorAll('.xeg-gallery-renderer');
  nodes.forEach(node => {
    try {
      node.remove();
    } catch {
      /* ignore DOM cleanup errors during tests */
    }
  });
}

function resetGalleryState(): void {
  const current = galleryState(); // Native SolidJS Accessor
  setGalleryState({
    ...current,
    isOpen: false,
    mediaItems: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
  });
}
