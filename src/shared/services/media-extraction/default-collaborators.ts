// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import { extractClickContext } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import type { MediaExtractionCollaborators } from '@shared/types/media.types';

/** One provider cache and flight owner per extraction session. */
export function createDefaultMediaExtractionCollaborators(): MediaExtractionCollaborators {
  return {
    readContext: extractClickContext,
    api: new TwitterAPIExtractor(),
    dom: new DOMFallbackExtractor(),
  };
}
