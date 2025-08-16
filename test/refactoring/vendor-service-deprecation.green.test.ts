/**
 * 🟢 TDD GREEN: vendor-service 참조 제거 검증 테스트
 * 목표: barrel 파일(vendors.ts, vendors/index.ts)에서 'vendor-service' 문자열이 존재하지 않는다.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function read(p: string): string {
  return readFileSync(resolve(__dirname, '../../src/shared/external', p), 'utf-8');
}

describe('🟢 vendor-service deprecation (barrel references 제거)', () => {
  it('vendors.ts 파일에 vendor-service 경로가 존재하지 않는다', () => {
    const content = read('vendors.ts');
    expect(content.includes('vendor-service')).toBe(false);
  });

  it('vendors/index.ts 파일에 vendor-service 경로가 존재하지 않는다', () => {
    const content = read('vendors/index.ts');
    expect(content.includes('vendor-service')).toBe(false);
  });
});
