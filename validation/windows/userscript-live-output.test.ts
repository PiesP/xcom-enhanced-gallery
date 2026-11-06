// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  truncate,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { flattenUserscriptLiveEvidence } from './userscript-live-output.ts';

async function owned() {
  const root = await mkdtemp(join(tmpdir(), 'xeg-live-flat-test-'));
  const output = join(root, 'output');
  await mkdir(output);
  const stage = await mkdtemp(join(root, 'xeg-userscript-live-stage-'));
  return { root, output, stage };
}

describe('flat installed userscript evidence', () => {
  it('copies and verifies regular stage files with a flat artifact index', async () => {
    const paths = await owned();
    try {
      await writeFile(join(paths.stage, 'proof.json'), '{"status":"observed"}');
      const index = await flattenUserscriptLiveEvidence({
        ...paths,
        phaseStatus: 'observed',
      });
      expect(index.files).toEqual([
        expect.objectContaining({
          source: 'proof.json',
          file: 'userscript-live-proof.json',
          bytes: 21,
        }),
      ]);
      expect(await readFile(join(paths.output, 'userscript-live-proof.json'), 'utf8')).toBe(
        '{"status":"observed"}'
      );
      expect((await readdir(paths.output)).sort()).toEqual([
        'userscript-live-artifacts.json',
        'userscript-live-proof.json',
      ]);
      expect(await readFile(join(paths.stage, 'proof.json'), 'utf8')).toBe('{"status":"observed"}');
    } finally {
      await rm(paths.root, { recursive: true, force: true });
    }
  });

  it('rejects a duplicate flattened name and keeps failed stage evidence', async () => {
    const paths = await owned();
    try {
      await writeFile(join(paths.stage, 'proof.json'), 'original');
      await writeFile(join(paths.stage, 'userscript-live-proof.json'), 'other');
      await expect(
        flattenUserscriptLiveEvidence({ ...paths, phaseStatus: 'failed' })
      ).rejects.toThrow('names collide');
      expect((await readdir(paths.stage)).length).toBe(2);
      expect(await readdir(paths.output)).toEqual([]);
    } finally {
      await rm(paths.root, { recursive: true, force: true });
    }
  });

  it('rejects nested directories and oversized stage files', async () => {
    const paths = await owned();
    try {
      await mkdir(join(paths.stage, 'nested'));
      await expect(
        flattenUserscriptLiveEvidence({ ...paths, phaseStatus: 'failed' })
      ).rejects.toThrow('non-file');
      await rm(join(paths.stage, 'nested'), { recursive: true });
      const oversized = join(paths.stage, 'large.bin');
      await writeFile(oversized, '');
      await truncate(oversized, 64 * 1024 * 1024 + 1);
      await expect(
        flattenUserscriptLiveEvidence({ ...paths, phaseStatus: 'failed' })
      ).rejects.toThrow('bounded read');
    } finally {
      await rm(paths.root, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform === 'win32')('rejects a symlink in the stage', async () => {
    const paths = await owned();
    try {
      await writeFile(join(paths.root, 'outside.txt'), 'unowned');
      await symlink(join(paths.root, 'outside.txt'), join(paths.stage, 'alias.txt'));
      await expect(
        flattenUserscriptLiveEvidence({ ...paths, phaseStatus: 'failed' })
      ).rejects.toThrow('non-file');
    } finally {
      await rm(paths.root, { recursive: true, force: true });
    }
  });

  it('preserves the failed stage when an output collision prevents copying', async () => {
    const paths = await owned();
    try {
      await writeFile(join(paths.stage, 'proof.json'), 'retain-me');
      await writeFile(join(paths.output, 'userscript-live-proof.json'), 'fixture');
      await expect(
        flattenUserscriptLiveEvidence({ ...paths, phaseStatus: 'failed' })
      ).rejects.toThrow('collides');
      expect(await readFile(join(paths.stage, 'proof.json'), 'utf8')).toBe('retain-me');
      expect(await readFile(join(paths.output, 'userscript-live-proof.json'), 'utf8')).toBe(
        'fixture'
      );
    } finally {
      await rm(paths.root, { recursive: true, force: true });
    }
  });
});
