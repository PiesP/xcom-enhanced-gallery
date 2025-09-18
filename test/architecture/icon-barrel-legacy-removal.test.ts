import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// R4 RED 테스트
// 목적: Icon 배럴(index.ts)에 Hero* 아이콘 정적 재노출이 남아있는지 검출
// GREEN 단계에서는 해당 재노출을 제거하여 본 테스트가 통과해야 함

describe('architecture/icon-barrel-legacy-removal (R4 RED)', () => {
  it('Icon/index.ts 에 Hero* 재노출이 더 이상 존재하지 않아야 한다', () => {
    // ESM 환경에서 __dirname 대체
    // test/architecture/* 위치에서 ../../ 로 루트 접근 (현재 파일 경로: test/architecture/..)
    const currentFile = fileURLToPath(import.meta.url);
    // currentFile: <root>/test/architecture/icon-barrel-legacy-removal.test.ts
    const file = resolve(currentFile, '../../../src/shared/components/ui/Icon/index.ts');
    const content = readFileSync(file, 'utf8');

    // 금지 패턴 목록: 기존 계획 문서에 명시된 Hero 어댑터 재노출 alias
    const banned = [
      'HeroChevronLeft as ChevronLeft',
      'HeroChevronRight as ChevronRight',
      'HeroDownload as Download',
      'HeroSettings as Settings',
      'HeroX as X',
      'HeroZoomIn as ZoomIn',
      'HeroFileZip as FileZip',
      'HeroArrowAutofitWidth as ArrowAutofitWidth',
      'HeroArrowAutofitHeight as ArrowAutofitHeight',
      'HeroArrowsMaximize as ArrowsMaximize',
    ];

    const offenders = banned.filter(p => content.includes(p));
    // 현재 상태에서는 offenders.length > 0 이어서 RED (실패) 기대
    expect(offenders, `다음 재노출을 제거해야 합니다: ${offenders.join(', ')}`).toHaveLength(0);
  });
});
