// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { describe, it } from 'vitest';
import { createFilenameDecisionControlWorkerSource } from './filename-decision-control.ts';

const TARGET_ID = 'a'.repeat(32);
const SOURCE = 'https://pbs.twimg.com/media/GkE5678GHIJKL.jpg?format=jpg&name=orig';
const SUGGESTED = 'GkE5678GHIJKL.jpg';

type Suggestion = { filename?: string; conflictAction?: string } | undefined;
type Download = {
  id: number;
  byExtensionId: string;
  url: string;
  filename: string;
  mime: string;
};

function control() {
  type Listener = (item: Download, suggest: (value?: Suggestion) => void) => boolean | void;
  const listenerState: { value?: Listener } = {};
  const runtimeState: {
    value?: (message: { kind?: string }, sender: unknown, reply: (value: unknown) => void) => void;
  } = {};
  const stored: Record<string, unknown> = { mode: 'passive', observations: [], overflow: false };
  const chrome = {
    runtime: {
      onMessage: {
        addListener(value: NonNullable<typeof runtimeState.value>) {
          runtimeState.value = value;
        },
      },
    },
    downloads: {
      onDeterminingFilename: {
        addListener(value: Listener) {
          listenerState.value = value;
        },
      },
    },
    storage: {
      local: {
        async get(keys: string | string[]) {
          return Object.fromEntries(
            (Array.isArray(keys) ? keys : [keys]).map((key) => [key, stored[key]])
          );
        },
        async set(values: Record<string, unknown>) {
          Object.assign(stored, values);
        },
      },
    },
  };
  const source = createFilenameDecisionControlWorkerSource(TARGET_ID, SOURCE, SUGGESTED);
  new Script(source).runInNewContext({ chrome, URL });
  assert(listenerState.value);
  assert(runtimeState.value);
  let ping: unknown;
  runtimeState.value({ kind: 'xeg-filename-control-ping' }, null, (value) => {
    ping = value;
  });
  assert.deepEqual(JSON.parse(JSON.stringify(ping)), { ready: true });
  const invoke = listenerState.value;
  return {
    stored,
    async determine(item: Download): Promise<{ returned: boolean | void; calls: Suggestion[] }> {
      const calls: Suggestion[] = [];
      let finish: (() => void) | undefined;
      const completed = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const returned = invoke(item, (suggestion) => {
        calls.push(suggestion ? JSON.parse(JSON.stringify(suggestion)) : undefined);
        finish?.();
      });
      await completed;
      return { returned, calls };
    },
  };
}

const owned: Download = {
  id: 41,
  byExtensionId: TARGET_ID,
  url: SOURCE,
  filename: 'C:\\Private\\Downloads\\middle_fixture_9555555555555555555_0.jpg',
  mime: 'image/jpeg',
};

describe('task-owned filename decision control', () => {
  it('leaves unrelated initiators and URLs untouched', async () => {
    const fixture = control();
    for (const item of [
      { ...owned, byExtensionId: 'b'.repeat(32) },
      { ...owned, url: SOURCE.replace('GkE5678GHIJKL', 'GkE9012MNOPQR') },
    ]) {
      const result = await fixture.determine(item);
      assert.deepEqual(result.calls, [undefined]);
    }
    assert.deepEqual(fixture.stored.observations, []);
  });

  it('records the native tentative basename and distinguishes passive from active suggestions', async () => {
    const fixture = control();
    const passive = await fixture.determine(owned);
    assert.equal(passive.returned, true);
    assert.deepEqual(passive.calls, [undefined]);

    fixture.stored.mode = 'filename';
    const active = await fixture.determine({ ...owned, id: 42 });
    assert.deepEqual(active.calls, [{ filename: SUGGESTED }]);

    fixture.stored.mode = 'conflict-action';
    const conflict = await fixture.determine({ ...owned, id: 43 });
    assert.deepEqual(conflict.calls, [{ filename: SUGGESTED, conflictAction: 'uniquify' }]);
    assert.deepEqual(JSON.parse(JSON.stringify(fixture.stored.observations)), [
      {
        id: 41,
        mode: 'passive',
        tentativeBasename: 'middle_fixture_9555555555555555555_0.jpg',
        suggestedFilename: null,
        conflictAction: null,
        sourcePath: '/media/GkE5678GHIJKL.jpg',
        mime: 'image/jpeg',
        initiatorMatches: true,
      },
      {
        id: 42,
        mode: 'filename',
        tentativeBasename: 'middle_fixture_9555555555555555555_0.jpg',
        suggestedFilename: SUGGESTED,
        conflictAction: null,
        sourcePath: '/media/GkE5678GHIJKL.jpg',
        mime: 'image/jpeg',
        initiatorMatches: true,
      },
      {
        id: 43,
        mode: 'conflict-action',
        tentativeBasename: 'middle_fixture_9555555555555555555_0.jpg',
        suggestedFilename: SUGGESTED,
        conflictAction: 'uniquify',
        sourcePath: '/media/GkE5678GHIJKL.jpg',
        mime: 'image/jpeg',
        initiatorMatches: true,
      },
    ]);
  });
});
