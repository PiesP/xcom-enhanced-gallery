// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { installEarlyMediaClickReplay } from '../../../src/extension/content-readiness';
import { clearSettings, registerSettings } from '../../../src/shared/container/settings-registry';
import type { VideoClickMode } from '../../../src/shared/types/settings.types';
import { getMediaClickTarget } from '../../../src/shared/utils/media/media-click-target';

/** Browser-only observer for the actual readiness gate; never included in the app. */
export function observeEarlyClicks() {
  const gate = installEarlyMediaClickReplay();
  const resumed: Array<{ trusted: boolean; target: string; mediaTarget: string | null }> = [];
  return {
    complete: () =>
      gate.complete(async (event) => {
        resumed.push({
          trusted: event.isTrusted,
          target: event.target instanceof Element ? event.target.id : '',
          mediaTarget: getMediaClickTarget(event)?.id ?? null,
        });
      }),
    setMode: (mode: VideoClickMode) => {
      registerSettings({ get: () => mode, set: async () => undefined });
    },
    dispose: () => {
      gate.dispose();
      clearSettings();
    },
    observations: () => [...resumed],
  };
}
