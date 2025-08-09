/**
 * Barrel Export Hygiene Test (TDD)
 * 목표: 특정 배럴에서 상위/타 모듈 전체를 재-export하는 패턴 방지
 *  - 1차 타겟: src/shared/styles/index.ts 가 '@shared/utils'를 export * 하는 것 금지
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('Barrel Export Hygiene', () => {
  it('shared/styles/index.ts should not re-export entire @shared/utils', async () => {
    const file = resolve(process.cwd(), 'src/shared/styles/index.ts');
    const content = await readFile(file, 'utf-8');

    // 금지 패턴: export * from '@shared/utils'
    const forbidden = /export\s*\*\s*from\s*['"]@shared\/utils['"];?/;
    const hasForbidden = forbidden.test(content);

    if (hasForbidden) {
      // 실패 시 참고를 위해 해당 라인 출력
      const lines = content.split('\n').map((l, i) => ({ no: i + 1, l }));
      const bad = lines.filter(x => forbidden.test(x.l));
      console.warn('❌ shared/styles/index.ts에서 금지된 재-export 감지', bad);
    }

    expect(hasForbidden).toBe(false);
  });

  it('shared/utils/styles/index.ts should not re-export from @shared/styles/style-service (wildcard or default)', async () => {
    const file = resolve(process.cwd(), 'src/shared/utils/styles/index.ts');
    const content = await readFile(file, 'utf-8');

    // 금지 패턴 1: export * from '@shared/styles/style-service'
    const forbiddenWildcard = /export\s*\*\s*from\s*['"]@shared\/styles\/style-service['"];?/;
    // 금지 패턴 2: export default re-export from '@shared/styles/style-service'
    const forbiddenDefault =
      /export\s+\{?\s*default\s*\}?\s*from\s*['"]@shared\/styles\/style-service['"];?/;

    const hasForbiddenWildcard = forbiddenWildcard.test(content);
    const hasForbiddenDefault = forbiddenDefault.test(content);

    if (hasForbiddenWildcard || hasForbiddenDefault) {
      const lines = content.split('\n').map((l, i) => ({ no: i + 1, l }));
      const bad = lines.filter(x => forbiddenWildcard.test(x.l) || forbiddenDefault.test(x.l));
      console.warn('❌ shared/utils/styles/index.ts에서 금지된 재-export 감지', bad);
    }

    expect(hasForbiddenWildcard || hasForbiddenDefault).toBe(false);
  });

  it('shared/services/index.ts should not use wildcard re-export from @shared/dom', async () => {
    const file = resolve(process.cwd(), 'src/shared/services/index.ts');
    const content = await readFile(file, 'utf-8');

    // 금지 패턴: export * from '@shared/dom'
    const forbidden = /export\s*\*\s*from\s*['"]@shared\/dom['"];?/;
    const hasForbidden = forbidden.test(content);

    if (hasForbidden) {
      const lines = content.split('\n').map((l, i) => ({ no: i + 1, l }));
      const bad = lines.filter(x => forbidden.test(x.l));
      console.warn('❌ shared/services/index.ts에서 금지된 재-export 감지', bad);
    }

    expect(hasForbidden).toBe(false);
  });
});
