// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import { useVerticalGallery } from '@features/gallery/components/vertical-gallery-view/hooks/use-vertical-gallery';
import {
  closeGallery,
  gallerySignals,
  openGallery,
  setFocusedIndexOnly,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { render } from 'solid-js/web';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import {
  finishSourceImageTrace,
  observedSelectedAlignment,
  startSourceImageTrace,
} from '../../../../../validation/windows/source-image-trace.ts';

const lifecycleProbe = vi.hoisted(() => ({
  onViewportApplied: undefined as (() => void) | undefined,
}));

// The lifecycle callback is only the viewport trigger. The composed gallery hook,
// focus tracker, item scroller, emitter, collector, and predicate all run unchanged.
vi.mock('@features/gallery/components/vertical-gallery-view/hooks/use-gallery-lifecycle', () => ({
  useGalleryLifecycle: (options: { onViewportApplied?: () => void }) => {
    lifecycleProbe.onViewportApplied = options.onViewportApplied;
  },
}));

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));
vi.mock('@shared/container/settings-registry', () => ({
  getTypedSettingOr: (_key: string, fallback: unknown) => fallback,
}));
vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence',
  () => ({
    useVideoVolumePersistence: () => ({
      applyMutedProgrammatically: vi.fn(),
      applyVolumeProgrammatically: vi.fn(),
      handleVolumeChange: vi.fn(),
    }),
  })
);

const selectedUrl = 'https://pbs.twimg.com/media/selected.jpg?name=orig';
const selectedMedia: MediaInfo = {
  id: 'selected-media',
  type: 'image',
  url: selectedUrl,
  downloadSource: { url: selectedUrl, quality: 'cdn-original', provenance: 'api' },
  width: 560,
  height: 360,
};
const neighborMedia: MediaInfo = {
  ...selectedMedia,
  id: 'neighbor-media',
  url: 'https://pbs.twimg.com/media/neighbor.jpg?name=orig',
  downloadSource: {
    url: 'https://pbs.twimg.com/media/neighbor.jpg?name=orig',
    quality: 'cdn-original',
    provenance: 'api',
  },
};
const precedingMedia: MediaInfo = {
  ...selectedMedia,
  id: 'preceding-media',
  url: 'https://pbs.twimg.com/media/preceding.jpg?name=orig',
  downloadSource: {
    url: 'https://pbs.twimg.com/media/preceding.jpg?name=orig',
    quality: 'cdn-original',
    provenance: 'api',
  },
};

const page = {
  evaluate: async <T, A>(callback: (arg: A) => T, argument: A) => callback(argument),
} as Parameters<typeof startSourceImageTrace>[0];

let dispose: (() => void) | undefined;
let host: HTMLDivElement | undefined;

afterEach(async () => {
  if (Object.hasOwn(window, '__xegSourceImageTrace')) {
    await finishSourceImageTrace(page);
  }
  dispose?.();
  dispose = undefined;
  host?.remove();
  host = undefined;
  closeGallery();
  lifecycleProbe.onViewportApplied = undefined;
});

test('the real item supplies its media ID to the source-image collector', async () => {
  host = document.createElement('div');
  document.body.append(host);
  dispose = render(
    () => (
      <div data-xeg-gallery-container>
        <div data-gallery-element="toolbar" />
        <div data-gallery-element="items">
          <VerticalImageItem
            media={selectedMedia}
            index={1}
            isActive
            isFocused
            fitMode="fitWidth"
            onClick={vi.fn()}
            scrollRoot={() => host!}
            scrollRootHeight={() => 800}
          />
        </div>
      </div>
    ),
    host
  );
  await startSourceImageTrace(page, 1);
  const trace = await finishSourceImageTrace(page);
  const beforeClick = trace.samples[0]?.state as {
    activeMediaId: string | null;
    focusedMediaId: string | null;
  };
  expect(beforeClick.activeMediaId).toBe('selected-media');
  expect(beforeClick.focusedMediaId).toBe('selected-media');
});

test('actual viewport decisions retain independent active and focused identities through collection and alignment', async () => {
  openGallery([precedingMedia, selectedMedia, neighborMedia], 1);
  host = document.createElement('div');
  host.dataset.xegGalleryContainer = '';
  host.style.cssText = 'position:fixed;top:0;left:0;width:640px;height:420px';
  const toolbar = document.createElement('div');
  toolbar.dataset.galleryElement = 'toolbar';
  const port = document.createElement('ol');
  port.dataset.galleryElement = 'items';
  port.style.cssText =
    'height:360px;width:600px;overflow-y:auto;scroll-padding-top:0px;display:flex;flex-direction:column;margin:0;padding:0;list-style:none';
  host.append(toolbar, port);
  document.body.append(host);

  const item = (media: MediaInfo, index: number) => (
    <VerticalImageItem
      media={media}
      index={index}
      isActive={index === gallerySignals.currentIndex}
      isFocused={index === gallerySignals.focusedIndex}
      fitMode="fitWidth"
      style={{ height: '200px', 'min-height': '200px', 'box-sizing': 'border-box' }}
      onClick={vi.fn()}
      scrollRoot={() => port}
      scrollRootHeight={() => 360}
    />
  );
  const HookProbe = () => {
    useVerticalGallery({
      isVisible: () => true,
      currentIndex: () => gallerySignals.currentIndex,
      mediaItemsCount: () => 3,
      containerEl: () => host ?? null,
      toolbarWrapperEl: () => null,
      itemsContainerEl: () => port,
    });
    return null;
  };
  dispose = render(
    () => (
      <>
        <HookProbe />
        {item(precedingMedia, 0)}
        {item(selectedMedia, 1)}
        {item(neighborMedia, 2)}
      </>
    ),
    port
  );
  const viewportApplied = lifecycleProbe.onViewportApplied;
  expect(viewportApplied).toBeTypeOf('function');
  if (!viewportApplied) {
    throw new Error('Viewport callback was not registered');
  }

  const rawDetails: string[] = [];
  const onRaw = (event: Event) => {
    if (event instanceof CustomEvent && typeof event.detail === 'string') {
      rawDetails.push(event.detail);
    }
  };
  window.addEventListener('xeg:gallery-scroll-trace', onRaw);
  try {
    viewportApplied();
    expect(rawDetails).toEqual([]);
    await startSourceImageTrace(page, 1);

    const focus = (index: number | null) => setFocusedIndexOnly(index);
    focus(null);
    viewportApplied();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    focus(2);
    viewportApplied();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    focus(1);
    viewportApplied();
    viewportApplied();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const trace = await finishSourceImageTrace(page);
    const emittedBeforeDisarm = rawDetails.length;
    viewportApplied();
    expect(rawDetails).toHaveLength(emittedBeforeDisarm);
    expect(document.documentElement.hasAttribute('data-xeg-scroll-trace')).toBe(false);
    expect(trace.productMalformedCount).toBe(0);
    expect(trace.productOverflow).toBe(false);
    expect(trace.overflow).toBe(false);
    expect(trace.productEvents).toEqual(rawDetails.map((detail) => JSON.parse(detail)));
    const decisions = trace.productEvents.filter((event) => event.event === 'viewport-decision');
    expect(decisions).toHaveLength(4);
    expect(decisions[0]).toMatchObject({
      decision: 'accepted',
      reason: 'eligible',
      index: 1,
      currentIndex: 1,
      focusedIndex: null,
    });
    expect(decisions[1]).toMatchObject({
      decision: 'accepted',
      reason: 'eligible',
      index: 2,
      currentIndex: 1,
      focusedIndex: 2,
    });
    expect(decisions[2]).toMatchObject({
      decision: 'accepted',
      reason: 'eligible',
      index: 1,
      currentIndex: 1,
      focusedIndex: 1,
    });
    expect(decisions[3]).toMatchObject({
      decision: 'accepted',
      reason: 'eligible',
      index: 1,
      currentIndex: 1,
      focusedIndex: 1,
    });
    const sampledStates = trace.samples.map((sample) => sample.state) as Array<{
      identityValid: boolean;
      selectedMediaId: string | null;
      activeMediaId: string | null;
      focusedMediaId: string | null;
      currentIndex: string | null;
      focusedIndex: string | null;
    }>;
    expect(sampledStates).toContainEqual(
      expect.objectContaining({
        identityValid: false,
        selectedMediaId: selectedMedia.id,
        activeMediaId: selectedMedia.id,
        focusedMediaId: null,
        currentIndex: '1',
        focusedIndex: null,
      })
    );
    expect(sampledStates).toContainEqual(
      expect.objectContaining({
        identityValid: true,
        selectedMediaId: selectedMedia.id,
        activeMediaId: selectedMedia.id,
        focusedMediaId: neighborMedia.id,
        currentIndex: '1',
        focusedIndex: '2',
      })
    );

    expect(
      observedSelectedAlignment(trace.productEvents.slice(0, 4), trace.alignmentFrames, selectedUrl)
    ).toBeNull();
    const secondMatchingDecision = trace.productEvents.indexOf(decisions[3]!);
    expect(
      observedSelectedAlignment(
        trace.productEvents.slice(0, secondMatchingDecision),
        trace.alignmentFrames,
        selectedUrl
      )
    ).toBeNull();
    const aligned = observedSelectedAlignment(
      trace.productEvents,
      trace.alignmentFrames,
      selectedUrl
    );
    expect(aligned).not.toBeNull();
    expect(trace.alignmentFrames).toHaveLength(2);
    expect(
      trace.alignmentFrames.every(
        (frame) =>
          frame.identityValid &&
          frame.selectedMediaId === selectedMedia.id &&
          frame.activeMediaId === selectedMedia.id &&
          frame.focusedMediaId === selectedMedia.id
      )
    ).toBe(true);

    const [before, after] = trace.alignmentFrames;
    if (!before || !after || !aligned) {
      throw new Error('Observed alignment frames were unavailable');
    }
    const rejected = (changedBefore: typeof before, changedAfter = after) =>
      observedSelectedAlignment(trace.productEvents, [changedBefore, changedAfter], selectedUrl);
    expect(rejected({ ...before, atMs: aligned.alignDoneAtMs })).toBeNull();
    expect(rejected({ ...before, itemTop: (before.portBottom ?? 0) + 1 })).toBeNull();
    expect(rejected({ ...before, scrollTop: (before.scrollTop ?? 0) + 1 })).toBeNull();
    expect(rejected({ ...before, imageSrc: 'https://pbs.twimg.com/media/wrong.jpg' })).toBeNull();
    expect(rejected({ ...before, identityValid: false })).toBeNull();
    expect(
      rejected({
        ...before,
        selectedMediaId: neighborMedia.id,
        activeMediaId: neighborMedia.id,
        focusedMediaId: neighborMedia.id,
      })
    ).toBeNull();
    expect(rejected({ ...before, focusedMediaId: neighborMedia.id })).toBeNull();
  } finally {
    window.removeEventListener('xeg:gallery-scroll-trace', onRaw);
  }
});
