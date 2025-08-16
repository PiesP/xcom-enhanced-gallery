/**
 * 🔴 TDD RED: vendor-service 참조 제거 테스트 (전환 단계)
 * 목표: barrel 파일(vendors.ts, vendors/index.ts)에서 'vendor-service' 문자열이 존재하지 않아야 한다.
 * 현재 단계에서는 실패(문자열 존재) -> 이후 refactor에서 제거하여 GREEN 달성.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(p: string): string {
  return readFileSync(resolve(__dirname, '../../src/shared/external', p), 'utf-8');
}

describe('� vendor-service deprecation (barrel references 제거)', () => {
  it('vendors.ts 파일에 vendor-service 경로가 존재하지 않아야 한다', () => {
    const content = read('vendors.ts');
    expect(content.includes('vendor-service')).toBe(false);
  });

  it('vendors/index.ts 파일에 vendor-service 경로가 존재하지 않아야 한다', () => {
    const content = read('vendors/index.ts');
    expect(content.includes('vendor-service')).toBe(false);
  });
});
