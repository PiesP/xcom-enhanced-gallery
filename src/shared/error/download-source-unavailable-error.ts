// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/** A displayed photo cannot establish an original-quality save source. */
export class DownloadSourceUnavailableError extends Error {
  constructor() {
    super('The original image source could not be verified; this item was not downloaded.');
    this.name = 'DownloadSourceUnavailableError';
  }
}
