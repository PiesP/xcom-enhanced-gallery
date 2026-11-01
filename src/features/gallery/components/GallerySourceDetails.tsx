// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import styles from '@features/gallery/components/GallerySourceDetails.module.css';
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals, getDisplayedMediaIndex } from '@shared/state/signals/gallery.signals';
import type { JSXElement } from 'solid-js';
import { createMemo, Show } from 'solid-js';

/** Only material, validated limitations need an additional persistent surface. */
export function GallerySourceDetails(): JSXElement {
  const translate = useTranslation();
  const displayedMedia = createMemo(() => {
    const index = getDisplayedMediaIndex();
    return index === null ? null : (gallerySignals.mediaItems[index] ?? null);
  });
  const isPartial = () => gallerySignals.recoveryScope === 'visible-tile';
  const quality = () => displayedMedia()?.downloadSource?.quality;
  const hasLimitation = () =>
    isPartial() || quality() === 'observed' || quality() === 'unverified-original';

  return (
    <Show when={hasLimitation() && displayedMedia()} keyed>
      {(media) => (
        <details
          class={styles.details}
          data-gallery-element="source-details"
          data-media-id={media.id}
          onClick={(event) => event.stopPropagation()}
        >
          <summary>
            <Show when={isPartial()}>
              <span>
                {translate('msg.gal.sourceDetails.shown', {
                  count: gallerySignals.mediaItems.length,
                })}
              </span>
            </Show>
            <Show when={quality() === 'observed'}>
              <span>{translate('msg.gal.sourceDetails.observed')}</span>
            </Show>
            <Show when={quality() === 'unverified-original'}>
              <span>{translate('msg.gal.sourceDetails.unavailable')}</span>
            </Show>
          </summary>
          <h2>{translate('msg.gal.sourceDetails.title')}</h2>
          <Show when={isPartial()}>
            <p>{translate('msg.gal.partialRecovery.body')}</p>
          </Show>
          <p>
            {quality() === 'observed'
              ? translate('msg.gal.sourceDetails.observedDetail')
              : quality() === 'unverified-original'
                ? translate('msg.gal.sourceDetails.unavailableDetail')
                : quality() === 'best-mp4'
                  ? translate('msg.gal.sourceDetails.bestMp4')
                  : quality() === 'cdn-original'
                    ? translate('msg.gal.sourceDetails.cdnOriginal')
                    : ''}
          </p>
        </details>
      )}
    </Show>
  );
}
