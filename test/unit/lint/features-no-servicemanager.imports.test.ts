/**
 * RED: features 레이어에서 ServiceManager 직접 import 금지
 * - 목표: U2 컨테이너 슬리밍 정책 가드
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function listFilesRecursive(dir: string, exts = ['.ts', '.tsx']): string[] {
  const acc: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      acc.push(...listFilesRecursive(full, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

describe('[RED] features layer must not import ServiceManager directly', () => {
  it('src/features/** must not import @shared/services/ServiceManager', () => {
    const files = statSync('src/features').isDirectory() ? listFilesRecursive('src/features') : [];
    const offenders: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('@shared/services/ServiceManager')) {
        offenders.push(file);
      }
    }

    expect(
      offenders,
      `features 레이어에서 ServiceManager 직접 import 금지. 수정 대상: \n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
