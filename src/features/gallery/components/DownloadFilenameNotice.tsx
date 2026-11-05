// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import styles from '@features/gallery/components/DownloadFilenameNotice.module.css';
import { useTranslation } from '@shared/hooks/use-translation';
import {
  downloadState,
  setSingleDownloadOutcome,
} from '@shared/state/signals/gallery-download-signals';
import type { JSXElement } from 'solid-js';
import { Show } from 'solid-js';

/** The native adapter's observed basename is displayed only after a successful single download. */
export function DownloadFilenameNotice(): JSXElement {
  const translate = useTranslation();
  return (
    <Show when={downloadState.singleOutcome}>
      {(outcome) => (
        <section
          class={styles.notice}
          data-gallery-element="download-filename-notice"
          data-filename-conforms={String(outcome().filenameConforms ?? 'unknown')}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          onClick={(event) => event.stopPropagation()}
        >
          <div class={styles.heading}>
            <span>
              {translate('msg.dl.filenameNotice.label')}: <bdi>{outcome().observedFilename}</bdi>
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget
                  .closest<HTMLElement>('[data-xeg-gallery-container]')
                  ?.focus({ preventScroll: true });
                setSingleDownloadOutcome(null);
              }}
            >
              {translate('msg.dl.filenameNotice.dismiss')}
            </button>
          </div>
          <Show when={outcome().filenameConforms === false}>
            <p>{translate('msg.dl.filenameNotice.mismatch')}</p>
          </Show>
        </section>
      )}
    </Show>
  );
}
