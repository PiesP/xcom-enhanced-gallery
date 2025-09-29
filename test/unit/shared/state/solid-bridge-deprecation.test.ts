import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function resolve(...paths: string[]): string {
  return join(ROOT, ...paths);
}

function readSource(relativePath: string): string | null {
  const absolutePath = resolve(relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }
  return readFileSync(absolutePath, 'utf8');
}

describe('Stage D Phase 4 — Solid bridge deprecation', () => {
  it('removes the legacy solidSignalBridge utility implementation', () => {
    const bridgePath = resolve('src', 'shared', 'utils', 'solidSignalBridge.ts');
    if (!existsSync(bridgePath)) {
      expect(true).toBe(true);
      return;
    }
    const content = readSource('src/shared/utils/solidSignalBridge.ts');
    expect(content?.trim().length).toBe(0);
  });

  it('removes the legacy solid-adapter helper', () => {
    const adapterPath = resolve('src', 'shared', 'state', 'solid-adapter.ts');
    if (!existsSync(adapterPath)) {
      expect(true).toBe(true);
      return;
    }
    const content = readSource('src/shared/state/solid-adapter.ts');
    expect(content?.trim().length).toBe(0);
  });

  it('ensures Solid Toast components no longer import solidSignalBridge', () => {
    const source = readSource('src/shared/components/ui/Toast/ToastContainer.tsx');
    expect(source).not.toBeNull();
    expect(source).not.toContain('solidSignalBridge');
  });
});
