// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const PROJECT_ROOT = resolve(import.meta.dirname, '../../..');
export const DEV_USERSCRIPT_PATH = resolve(
  PROJECT_ROOT,
  'dist/xcom-enhanced-gallery.dev.user.js'
);
export const CHROME_EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist-extension');
export const FIREFOX_EXTENSION_DIR = resolve(PROJECT_ROOT, 'dist-extension-firefox');
export const MOCK_GALLERY_PAGE_PATH = resolve(import.meta.dirname, 'mock-gallery-page.html');
export const MOCK_GALLERY_HTML = readFileSync(MOCK_GALLERY_PAGE_PATH, 'utf8');
export const MOCK_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);
