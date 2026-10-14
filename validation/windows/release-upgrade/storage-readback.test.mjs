// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readStoredLanguage } from '../live-page.mjs';

test('upgrade language readback decodes the persisted storage envelope', async () => {
  const raw = JSON.stringify({ __xegStorageEnvelope: 1, updatedAt: 42, value: 'ko' });
  const page = { evaluate: async () => raw };
  assert.deepEqual(await readStoredLanguage(page), {
    exists: true,
    rawType: 'string',
    language: 'ko',
  });
});

test('upgrade language readback does not treat malformed storage as a language', async () => {
  const page = { evaluate: async () => '{invalid' };
  assert.deepEqual(await readStoredLanguage(page), {
    exists: true,
    rawType: 'string',
    language: null,
  });
});
