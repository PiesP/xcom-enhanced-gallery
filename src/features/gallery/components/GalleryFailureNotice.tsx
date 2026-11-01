// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import styles from '@features/gallery/components/GalleryFailureNotice.module.css';
import { useTranslation } from '@shared/hooks/use-translation';
import { gallerySignals, setError } from '@shared/state/signals/gallery.signals';
import { shouldAllowWheelDefault } from '@shared/utils/events/wheel-scroll-guard';
import type { JSXElement } from 'solid-js';
import { Show } from 'solid-js';

/** Visible error detail shares the session/error lifetime, without starting retries. */
export function GalleryFailureNotice(): JSXElement {
  const translate = useTranslation();
  return (
    <Show when={gallerySignals.error && gallerySignals.errorOwner !== 'bulkDownload'}>
      <section
        class={styles.notice}
        data-gallery-element="gallery-failure-notice"
        data-gallery-scrollable="true"
        onWheel={(event) => {
          event.stopPropagation();
          if (
            !shouldAllowWheelDefault(event, {
              scrollableSelector: '[data-gallery-scrollable="true"]',
            })
          ) {
            event.preventDefault();
          }
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <p>{gallerySignals.error}</p>
        <p>{translate('msg.gal.downloadFailureNext')}</p>
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget
              .closest<HTMLElement>('[data-xeg-gallery-container]')
              ?.focus({ preventScroll: true });
            setError(null);
          }}
        >
          {translate('msg.gal.dismissFailure')}
        </button>
      </section>
    </Show>
  );
}
