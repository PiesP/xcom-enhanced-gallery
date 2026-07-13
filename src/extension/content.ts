// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 Extension — Content Script Entry Point
 *
 * Boots the gallery app. Theme is applied by ThemeService after initialization
 * (data-theme attribute on .xeg-theme-scope elements).
 */

import { startApplication } from '@main';
import { createLogger } from '@shared/logging/logger';

const log = createLogger('ContentScript');

// Boot the application
startApplication().catch((error: unknown) => {
  log.error('content.start-failed', { error: String(error) });
});
