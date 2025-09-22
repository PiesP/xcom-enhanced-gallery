import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 이 테스트는 .dependency-cruiser.cjs 설정이 벤더 직접 import 금지를 오류로 강제하고,
// vendor 래퍼 폴더(shared/external/vendors, infrastructure/external/vendors)만 예외로 허용하는지 확인합니다.

describe('dependency-cruiser vendor getter enforcement', () => {
  it("'no-direct-vendor-imports' rule must be error and allow only vendor wrapper folders", () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const configPath = join(__dirname, '../../.dependency-cruiser.cjs');
    const text = readFileSync(configPath, 'utf-8');

    // severity: 'error'
    expect(text).toMatch(/name:\s*'no-direct-vendor-imports'[\s\S]*?severity:\s*'error'/);

    // pathNot includes shared/external/vendors and infrastructure/external/vendors
    expect(text).toMatch(/pathNot:\s*\[[\s\S]*\^src\/shared\/external\/vendors[\s\S]*\]/);
    expect(text).toMatch(/pathNot:\s*\[[\s\S]*\^src\/infrastructure\/external\/vendors[\s\S]*\]/);

    // forbidden target modules include fflate|preact|@preact
    expect(text).toMatch(/to:\s*\{\s*path:\s*'\^\(fflate\|preact\|@preact\)'\s*\}/);
  });
});
