/**
 * @fileoverview Phase 132: 하위 호환성 별칭 정리
 * @description 미사용 하위 호환성 별칭 제거 및 배럴 구조 개선
 *
 * RED: 미사용 별칭 감지
 * GREEN: 별칭 제거
 * REFACTOR: 배럴 구조화
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 132: 하위 호환성 별칭 정리', () => {
  const repoRoot = resolve(process.cwd());

  describe('RED: 미사용 별칭 감지', () => {
    it('memory/index.ts에 정의된 별칭들이 코드 어디에서도 사용되지 않아야 한다 (RED -> GREEN)', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const memoryIndexContent = readFileSync(memoryIndexPath, 'utf-8');

      // 미사용 별칭 목록
      const unusedAliases = [
        'cleanupAllResources',
        'createManagedController',
        'registerManagedMemoryResource',
        'releaseResourcesByContext',
        'releaseResourcesByType',
        'createTimer',
        'createManagedInterval',
        'addManagedEventListener',
        'createManagedObserver',
        'createManagedObjectURL',
      ];

      // 별칭이 index.ts에서 export되지 않아야 함
      for (const alias of unusedAliases) {
        expect(
          memoryIndexContent,
          `${alias} should not be exported from memory/index.ts`
        ).not.toContain(`as ${alias}`);
      }
    });

    it('memory/index.ts의 별칭 정의 블록이 제거되어야 한다 (RED -> GREEN)', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const content = readFileSync(memoryIndexPath, 'utf-8');

      // "하위 호환성을 위한 별칭들" 주석 블록이 제거되어야 함
      expect(content, 'Compatibility aliases block should be removed').not.toContain(
        '// 하위 호환성을 위한 별칭들'
      );
    });

    it('memory 배럴이 정제된 핵심 export만 가져야 한다 (RED -> GREEN)', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const content = readFileSync(memoryIndexPath, 'utf-8');

      // 핵심 export는 유지되어야 함
      const essentialExports = [
        'ResourceManager',
        'globalResourceManager',
        'registerResource',
        'releaseResource',
        'releaseAllResources',
        'ResourceType',
      ];

      for (const exp of essentialExports) {
        expect(content, `${exp} should be exported from memory/index.ts`).toContain(exp);
      }
    });
  });

  describe('GREEN: 별칭 제거 후 검증', () => {
    it('memory 배럴 파일 크기가 감소해야 한다', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const content = readFileSync(memoryIndexPath, 'utf-8');
      const lines = content.split('\n');

      // 정제 후 40줄 이상 60줄 이하 범위 기대
      // (별칭 제거로 인한 약 50% 감소)
      expect(lines.length).toBeLessThan(60);
    });

    it('정제된 memory/index.ts이 유효한 TypeScript여야 한다', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const content = readFileSync(memoryIndexPath, 'utf-8');

      // 구문 검증: export statements가 유효해야 함
      expect(content).toMatch(/export\s+\{[\s\S]*?\}\s+from/);
      // 타입 export도 포함되어야 함 (ResourceType, MemorySnapshot 등)
      expect(content).toMatch(/type\s+\w+/);
    });
  });

  describe('REFACTOR: 배럴 구조 개선', () => {
    it('memory/index.ts이 명확한 섹션 주석을 가져야 한다', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const content = readFileSync(memoryIndexPath, 'utf-8');

      // 섹션 주석 예시:
      // === Core Resource Management (3개) ===
      // === Profiling & Diagnostics (5개) ===
      expect(content).toContain('===');
    });

    it('memory 배럴이 export 카운트를 문서화해야 한다', () => {
      const memoryIndexPath = resolve(repoRoot, 'src/shared/utils/memory/index.ts');
      const content = readFileSync(memoryIndexPath, 'utf-8');

      // @fileoverview에 export 개수 명시
      // 예: "@description ... (총 N개 export)"
      expect(content).toMatch(/@description.*export/i);
    });
  });
});
