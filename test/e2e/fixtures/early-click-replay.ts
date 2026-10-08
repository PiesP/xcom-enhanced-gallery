// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { installEarlyMediaClickReplay } from '../../../src/extension/content-readiness';

/** Browser-only observer for the actual readiness gate; never included in the app. */
export function observeEarlyClicks() {
  const gate = installEarlyMediaClickReplay();
  const resumed: Array<{ trusted: boolean; target: string }> = [];
  return {
    complete: () => gate.complete(async (event) => {
      resumed.push({ trusted: event.isTrusted, target: (event.target as HTMLElement).id });
    }),
    dispose: () => gate.dispose(),
    observations: () => [...resumed],
  };
}
