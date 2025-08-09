/**
 * @fileoverview TDD RED: media-service 모듈은 최상위에서 싱글톤 인스턴스를 export 하지 않아야 한다
 * 목적: circular/TDZ를 유발하는 `export const mediaService = ...` 패턴 방지
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Refactoring guard: media-service top-level singleton export 금지', () => {
  it('media-service.ts는 `export const mediaService`를 포함하지 않아야 한다', () => {
    const filePath = join(process.cwd(), 'src', 'shared', 'services', 'media-service.ts');
    const content = readFileSync(filePath, 'utf8');

    // 엄격히 금지하는 패턴만 검사하여 오탐을 줄임
    expect(content).not.toMatch(/export\s+const\s+mediaService\b/);
  });
});
