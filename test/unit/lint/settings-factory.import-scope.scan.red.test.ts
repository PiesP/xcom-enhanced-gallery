/**
 * SETTINGS-FACTORY-IMPORT-GUARD-01 — settings-factory import scope guard (GREEN)
 *
 * 정책:
 * - settings-factory(@features/settings/services/settings-factory)는 Feature 지연 등록 지점
 *   (src/bootstrap/feature-registration.ts)에서만 import 되어야 한다.
 * - 다른 어떤 소스 파일에서도 import 되면 안 된다(직접 접근 금지, 레이어 경계 유지).
 *
 * 방식:
 * - 정적 스캔으로 소스 파일(ts/tsx)의 import 구문을 조사하고, 대상 경로를 import 하는
 *   파일이 허용된 화이트리스트에만 속하는지 검사한다.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('settings-factory import scope guard', () => {
  it('only src/bootstrap/feature-registration.ts may import settings-factory', () => {
    const cwd = (globalThis as unknown as { process?: { cwd(): string } }).process?.cwd() || '';
    const SRC_ROOT = join(cwd, 'src');
    const ALLOWED_IMPORTER = resolve(cwd, 'src', 'bootstrap', 'feature-registration.ts').replace(
      /\\/g,
      '/'
    );

    const TARGET_PATH_FRAGMENT = 'features/settings/services/settings-factory';

    const files = collectSourceFiles(SRC_ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const norm = file.replace(/\\/g, '/');
      if (norm === ALLOWED_IMPORTER) continue; // 허용된 파일은 건너뜀

      const content = readFileSync(file, 'utf8');
      // import 구문에서 from '...'; 또는 from "..."; 패턴 매칭
      // 또한 dynamic import('...')도 검사
      const importSpecifiers = [
        ...content.matchAll(/from\s+['"]([^'"]+)['"];?/g),
        ...content.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g),
      ];

      for (const m of importSpecifiers) {
        const spec = String(m[1]);
        // 별칭/상대경로 모두 허용: 경로 조각에 대상이 포함되면 타격
        if (spec.includes(TARGET_PATH_FRAGMENT)) {
          offenders.push(norm);
          break;
        }
      }
    }

    if (offenders.length > 0) {
      const list = offenders.map(f => ` - ${f}`).join('\n');
      throw new Error(
        '\n[SETTINGS-FACTORY IMPORT SCOPE VIOLATIONS]\n' +
          `settings-factory 는 다음 파일에서 import 되어서는 안 됩니다:\n${list}\n` +
          `허용된 파일: ${ALLOWED_IMPORTER}\n`
      );
    }
  });
});
