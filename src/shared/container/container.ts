// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

export { getEventManager, resetEventManager } from '@shared/container/event-manager-accessor';
export {
  getDownloadOrchestrator,
  resetDownloadOrchestratorForTests,
} from '@shared/services/download/download-orchestrator';
export {
  getLanguageService,
  resetLanguageServiceForTests,
} from '@shared/services/language-service';
export { getMediaService, resetMediaServiceForTests } from '@shared/services/media-service';
export { getThemeService, resetThemeServiceForTests } from '@shared/services/theme-service';
