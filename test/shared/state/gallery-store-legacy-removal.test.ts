import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

/**
 * Phase G-3-5: gallery-store.ts 레거시 제거 검증
 *
 * 목적:
 * - gallery-store.ts는 createGlobalSignal을 사용하는 레거시 facade
 * - gallery.signals.ts가 이미 SolidJS 네이티브 패턴으로 대체재 제공
 * - 실제 사용처는 테스트 파일에서만 동적 import로 사용
 * - 제거 후 테스트를 gallery.signals.ts로 마이그레이션
 */
describe('Phase G-3-5: gallery-store Legacy Removal', () => {
  const GALLERY_STORE_PATH = resolve(process.cwd(), 'src/shared/state/gallery-store.ts');

  describe('Legacy Removal Verification', () => {
    it('should remove legacy gallery-store.ts file', () => {
      // RED: 이 테스트는 파일이 존재하면 실패
      const fileExists = existsSync(GALLERY_STORE_PATH);

      expect(fileExists).toBe(false);
    });

    it('should have gallery.signals.ts as native replacement', () => {
      // GREEN: 대체재가 존재하는지 확인
      const GALLERY_SIGNALS_PATH = resolve(
        process.cwd(),
        'src/shared/state/signals/gallery.signals.ts'
      );

      const replacementExists = existsSync(GALLERY_SIGNALS_PATH);
      expect(replacementExists).toBe(true);
    });
  });

  describe('No Remaining Imports', () => {
    it('should not have any imports from gallery-store in src/', async () => {
      // 소스 코드에서 gallery-store import가 없어야 함
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      async function* walkFiles(dir: string): AsyncGenerator<string, void, undefined> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist') {
              yield* walkFiles(fullPath);
            }
          } else if (
            entry.isFile() &&
            (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
          ) {
            yield fullPath;
          }
        }
      }

      const importPattern = /from\s+['"].*gallery-store['"]/;
      const filesWithImports: string[] = [];

      const srcDir = resolve(process.cwd(), 'src');
      for await (const file of walkFiles(srcDir)) {
        const content = await fs.readFile(file, 'utf-8');
        if (importPattern.test(content)) {
          filesWithImports.push(file);
        }
      }

      expect(filesWithImports).toEqual([]);
    });
  });

  describe('Test Migration Strategy', () => {
    it('should confirm legacy test file has been removed or migrated', () => {
      // gallery-state-centralization.test.ts는 이미 제거되었거나 마이그레이션 완료
      // 더 이상 gallery-store.ts에 의존하는 테스트가 없어야 함

      const CENTRALIZATION_TEST_PATH = resolve(
        process.cwd(),
        'test/state/gallery-state-centralization.test.ts'
      );

      const testExists = existsSync(CENTRALIZATION_TEST_PATH);

      // Phase G-3-5 완료: 레거시 테스트 파일도 제거됨
      expect(testExists).toBe(false);

      // Note: gallery.signals.ts를 사용하는 새로운 테스트는
      // test/shared/state/gallery-signals-native.test.ts에 존재
    });
  });
});
