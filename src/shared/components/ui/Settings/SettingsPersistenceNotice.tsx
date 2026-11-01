// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { tryGetSettings } from '@shared/container/settings-registry';
import { useTranslation } from '@shared/hooks/use-translation';
import { getLanguageService } from '@shared/services/language-service';
import type { JSXElement } from 'solid-js';
import { createSignal, onCleanup, onMount, Show, splitProps } from 'solid-js';

import styles from './SettingsPersistenceNotice.module.css';

interface SettingsPersistenceNoticeProps {
  readonly expanded: boolean;
  readonly onOpen: (event: MouseEvent) => void;
}

/** The toolbar-lifetime entry to Settings' existing persistence status and retry. */
export function SettingsPersistenceNotice(props: SettingsPersistenceNoticeProps): JSXElement {
  const [local] = splitProps(props, ['expanded', 'onOpen']);
  const translate = useTranslation();
  const [unsavedSettings, setUnsavedSettings] = createSignal(false);
  const [unsavedLanguage, setUnsavedLanguage] = createSignal(false);

  onMount(() => {
    const settings = tryGetSettings();
    const language = getLanguageService();
    setUnsavedSettings(settings?.hasUnsavedChanges?.() ?? false);
    setUnsavedLanguage(language.hasUnsavedChanges());
    const unsubscribeSettings = settings?.subscribePersistence?.(setUnsavedSettings);
    const unsubscribeLanguage = language.subscribePersistence(setUnsavedLanguage);
    onCleanup(() => {
      unsubscribeSettings?.();
      unsubscribeLanguage();
    });
  });

  return (
    <Show when={unsavedSettings() || unsavedLanguage()}>
      {/* Keep this marker mounted while Settings is open so the toolbar stays reachable. */}
      <div class={styles.notice} data-xeg-settings-unsaved-indicator="">
        <Show when={!local.expanded}>
          <span role="status">{translate('st.unsavedSession')}</span>
          <button
            type="button"
            class={styles.open}
            aria-label={`${translate('tb.setOpen')}: ${translate('st.unsavedSession')}`}
            onClick={(event) => local.onOpen(event)}
          >
            {translate('tb.setOpen')}
          </button>
        </Show>
      </div>
    </Show>
  );
}
