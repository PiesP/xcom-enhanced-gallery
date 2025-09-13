import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Guard: 레거시 Tabler 아이콘 경로에 대한 "사용처"가 없어야 한다.
// 물리 파일은 단계적 제거 대상일 수 있으나, import/참조가 0이어야 한다.
describe('deps: legacy icon path usage removal', () => {
  it('should not import from src/shared/components/ui/Icon/icons anywhere', async () => {
    // Vite import.meta.glob는 Windows에서 절대 경로/드라이브 문자 혼합으로 import-analysis 에러가 발생할 수 있다.
    // 안전하게 Node fs로 src 트리를 직접 순회하여 문자열 검색을 수행한다.
    const SRC_DIR = path.resolve(process.cwd(), 'src');
    const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

    const listFiles = (dir: string, acc: string[] = []): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // skip node_modules/dist if ever under src (defensive)
          if (entry.name === 'node_modules' || entry.name === 'dist') continue;
          listFiles(full, acc);
        } else if (exts.has(path.extname(entry.name))) {
          acc.push(full);
        }
      }
      return acc;
    };

    const files = listFiles(SRC_DIR);
    const offenders: string[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (
          content.includes('shared/components/ui/Icon/icons/') ||
          content.includes('shared\\components\\ui\\Icon\\icons\\')
        ) {
          offenders.push(path.relative(process.cwd(), file));
        }
      } catch {
        // ignore unreadable files
      }
    }

    expect(offenders, `legacy icon path referenced in: ${offenders.join(', ')}`).toHaveLength(0);
  });
});
