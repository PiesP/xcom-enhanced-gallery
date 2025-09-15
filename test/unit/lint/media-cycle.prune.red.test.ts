/**
 * MEDIA-CYCLE-PRUNE-01 — shared/media 인근 순환 제거 RED 테스트
 * 목적: shared/utils/media/media-url.util.ts에서 배럴 import(../../media 또는 @shared/media)를 금지
 * 기대: 현재는 배럴 import가 존재하면 이 테스트가 FAIL → 구현 후 GREEN
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('MEDIA-CYCLE-PRUNE-01 — forbid barrel import in media-url.util.ts', () => {
  it('media-url.util.ts should not import from shared/media barrel', () => {
    const file = resolve(process.cwd(), 'src/shared/utils/media/media-url.util.ts');
    const content = readFileSync(file, 'utf-8');

    // 금지 패턴: 배럴 import
    const forbidden = [
      /from\s+['"]@shared\/media['"];?/g,
      /from\s+['"]\.\.\/\.\.\/media['"];?/g,
      /from\s+['"]\.\.\/\.\.\/media\/["'][^"']*["']?;?/g, // 여유 패턴
    ];

    const violations = forbidden.flatMap(re => content.match(re) || []);

    if (violations.length > 0) {
      // RED 단계: 현재 위반이 존재하면 실패
      expect(
        `Forbidden barrel import detected in media-url.util.ts:\n${violations.join('\n')}`
      ).toBe('');
    }
  });
});
