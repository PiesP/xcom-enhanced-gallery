// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 Extension — Content Script Entry Point
 *
 * Boots the gallery app. Theme is applied by ThemeService after initialization
 * (data-theme attribute on .xeg-theme-scope elements).
 */

import { startApplication } from '@main';

// Boot the application
startApplication().catch((error: unknown) => {
  console.error('[XEG MV3] Failed to start application:', error);
});
