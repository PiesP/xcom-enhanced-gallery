/**
 * Epic VENDOR-GETTER-MIGRATION 검증 테스트
 *
 * 목적: solid-js 직접 import 제거 및 getter 패턴 전환 검증
 *
 * Acceptance Criteria:
 * 1. 모든 solid-js 직접 import를 getSolidCore() getter 패턴으로 전환
 * 2. 타입만 import하는 경우는 `import type { ... } from 'solid-js'` 형태로 유지
 * 3. vendor-manager-static.ts는 예외 (벤더 관리자)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const SRC_DIR = join(process.cwd(), 'src');

// solid-js 직접 import 패턴 (타입 import 제외)
const DIRECT_SOLID_IMPORT_PATTERN = /^import\s+(?!type\s)[^;]*from\s+['"]solid-js['"]/gm;

// 검사 대상 파일들
const TARGET_FILES = [
  'shared/hooks/useSettingsModal.ts',
  'shared/hooks/useFocusScope.ts',
  'shared/components/ui/Toolbar/ToolbarHeadless.tsx',
];

// 예외 파일들 (벤더 관리자)
const EXCEPTION_FILES = ['shared/external/vendors/vendor-manager-static.ts'];

describe('Epic VENDOR-GETTER-MIGRATION', () => {
  describe('Acceptance 1: solid-js 직접 import 제거', () => {
    TARGET_FILES.forEach(file => {
      it(`${file}: solid-js 직접 import 없이 getSolidCore() 사용해야 함`, () => {
        const filePath = join(SRC_DIR, file);
        const content = readFileSync(filePath, 'utf-8');

        // solid-js 직접 import가 없어야 함
        const matches = content.match(DIRECT_SOLID_IMPORT_PATTERN);
        expect(matches, `${file}에서 solid-js 직접 import 발견: ${matches?.join(', ')}`).toBeNull();

        // getSolidCore() 사용 확인
        expect(content).toContain('getSolidCore()');
      });
    });
  });

  describe('Acceptance 2: 타입 import는 유지', () => {
    it('ToolbarHeadless.tsx: JSX 타입 import는 허용', () => {
      const filePath = join(SRC_DIR, 'shared/components/ui/Toolbar/ToolbarHeadless.tsx');
      const content = readFileSync(filePath, 'utf-8');

      // 타입 import는 허용
      const typeImportPattern = /import\s+type\s+{[^}]+}\s+from\s+['"]solid-js['"]/;
      const hasTypeImport = typeImportPattern.test(content);

      if (hasTypeImport) {
        // 타입 import가 있다면 런타임 import는 없어야 함
        const runtimeMatches = content.match(DIRECT_SOLID_IMPORT_PATTERN);
        expect(runtimeMatches).toBeNull();
      }
    });
  });

  describe('Acceptance 3: 벤더 관리자 예외 처리', () => {
    it('vendor-manager-static.ts: 직접 import 허용 (벤더 관리자)', () => {
      const filePath = join(SRC_DIR, EXCEPTION_FILES[0]);
      const content = readFileSync(filePath, 'utf-8');

      // 벤더 관리자는 직접 import 허용
      expect(content).toContain("import * as solid from 'solid-js'");
    });
  });

  describe('Acceptance 4: getSolidCore() 사용 검증', () => {
    TARGET_FILES.forEach(file => {
      it(`${file}: getSolidCore() 분해 할당 패턴 사용`, () => {
        const filePath = join(SRC_DIR, file);
        const content = readFileSync(filePath, 'utf-8');

        // const solid = getSolidCore() 패턴
        const getterPattern = /const\s+solid\s+=\s+getSolidCore\(\)/;
        expect(content).toMatch(getterPattern);

        // 분해 할당 패턴
        const destructurePattern = /const\s+{\s*[^}]+\s*}\s+=\s+solid/;
        expect(content).toMatch(destructurePattern);
      });
    });
  });
});
