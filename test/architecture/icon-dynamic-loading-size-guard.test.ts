import { describe, it, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// R5 RED: 번들 사이즈 회귀 + 정적 포함 검출 (간략 버전)
// 실제 gzip 비교는 build 단계 스크립트에 위임. 여기서는 iconRegistry 정의 검증.

describe('architecture/icon-dynamic-loading-size-guard (R5 RED)', () => {
  it('iconRegistry ICON_IMPORTS 내 선언된 아이콘만 존재하며 직접 Hero* 재노출이 없어야 한다', () => {
    const current = fileURLToPath(import.meta.url);
    const root = resolve(dirname(dirname(current))); // ../../ (test/architecture -> project root)
    const registryPath = resolve(root, 'src/shared/services/iconRegistry.ts');
    const content = readFileSync(registryPath, 'utf8');
    // ICON_IMPORTS key 수 집계
    const keyMatches = content.match(/^[ \t]*([A-Za-z0-9_]+): \(\)/gm) || [];
    // 기대: 최소 5개 이상 (현재 10개). 감소 시 누락 위험, 증가 시 문서/테스트 갱신 필요.
    expect(keyMatches.length).toBeGreaterThanOrEqual(5);
    // 정적 배럴 패턴이 registry 파일 외 다른 곳에 남아있지 않아야 함 (index.ts에서 제거됨)
    const iconIndex = resolve(root, 'src/shared/components/ui/Icon/index.ts');
    const indexContent = readFileSync(iconIndex, 'utf8');
    const banned = /Hero[A-Za-z0-9]+\s+as\s+/;
    expect(banned.test(indexContent)).toBe(false);
  });

  test.todo('prod 번들 gzip 사이즈 회귀 측정 (ICN-R5 GREEN에서 구현)');
});
