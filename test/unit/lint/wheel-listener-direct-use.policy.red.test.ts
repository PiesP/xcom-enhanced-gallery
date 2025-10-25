import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Wheel listener policy: disallow direct addEventListener('wheel', ...) usages
 * outside of the central utility, to guarantee passive/consumption rules.
 *
 * **Rule R2**: 모든 wheel 이벤트 리스너는 중앙화된 이벤트 관리 유틸리티를 통해서만
 * 등록되어야 하며, 직접 addEventListener('wheel', ...)을 사용할 수 없습니다.
 * 이는 passive 옵션과 이벤트 소비 규칙을 일관되게 적용하기 위함입니다.
 *
 * **Allowed list**:
 * - `src/shared/utils/events.ts` (중앙 이벤트 관리)
 * - `src/shared/utils/scroll/scroll-utils.ts` (스크롤 특화 헬퍼)
 */
describe('R2: wheel-listener-direct-use policy (no direct addEventListener)', () => {
  const SRC_ROOT = join(cwd(), 'src');

  // Allow list: central wheel utility file(s)
  const allowList = new Set<string>([
    join(SRC_ROOT, 'shared', 'utils', 'events.ts').replace(/\\/g, '/'),
    join(SRC_ROOT, 'shared', 'utils', 'scroll', 'scroll-utils.ts').replace(/\\/g, '/'),
  ]);

  function* walk(dir: string): Generator<string> {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, name.name);
      if (name.isDirectory()) {
        yield* walk(abs);
      } else if (name.isFile() && /\.(ts|tsx)$/.test(name.name)) {
        yield abs;
      }
    }
  }

  it('should not contain direct addEventListener("wheel", ...) in src (except allowlist)', () => {
    const offenders: string[] = [];
    for (const filePath of walk(SRC_ROOT)) {
      const normalized = filePath.replace(/\\/g, '/');
      if (allowList.has(normalized)) continue;
      const content = readFileSync(filePath, 'utf8');
      if (content.match(/addEventListener\(\s*['"]wheel['"]/)) {
        offenders.push(normalized.replace(SRC_ROOT.replace(/\\/g, '/') + '/', ''));
      }
    }

    expect(offenders).toEqual([]);
  });
});
