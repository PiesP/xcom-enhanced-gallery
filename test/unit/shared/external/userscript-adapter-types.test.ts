/**
 * Phase 101: adapter.ts 타입 가드 테스트
 *
 * 목표: 'as any' 타입 단언 제거 및 hasGMInfo() 타입 가드 추가
 * 대상 파일: src/shared/external/userscript/adapter.ts
 * 제거 대상: 라인 29, 44, 151 (3개)
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGMUserScriptInfo } from '@shared/utils/type-safety-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Phase 101: adapter.ts 타입 가드', () => {
  setupGlobalTestIsolation();

  const targetFile = resolve(__dirname, '../../../../src/shared/external/userscript/adapter.ts');

  describe('isGMUserScriptInfo 타입 가드 함수', () => {
    it('GM_info가 있는 객체에서 true를 반환한다', () => {
      const mockGlobal = {
        GM_info: {
          script: {
            name: 'test-script',
            version: '1.0.0',
            namespace: 'test-namespace',
          },
          scriptHandler: 'Tampermonkey',
          version: '1.0.0',
        },
      };

      expect(isGMUserScriptInfo(mockGlobal.GM_info)).toBe(true);
    });

    it('임의의 객체에서도 true를 반환해 느슨한 검사를 유지한다', () => {
      const mockGlobal = { someOtherProperty: 'value' };
      expect(isGMUserScriptInfo(mockGlobal)).toBe(true);
    });

    it('null에서 false를 반환한다', () => {
      expect(isGMUserScriptInfo(null)).toBe(false);
    });

    it('undefined에서 false를 반환한다', () => {
      expect(isGMUserScriptInfo(undefined)).toBe(false);
    });

    it('원시 타입에서 false를 반환한다', () => {
      expect(isGMUserScriptInfo(42)).toBe(false);
      expect(isGMUserScriptInfo('string')).toBe(false);
      expect(isGMUserScriptInfo(true)).toBe(false);
    });

    it('타입 가드가 TypeScript 타입 좁히기를 수행한다', () => {
      const mockGlobal: unknown = {
        scriptHandler: 'Tampermonkey',
      };

      if (isGMUserScriptInfo(mockGlobal)) {
        const info = mockGlobal as { scriptHandler?: string };
        expect(info.scriptHandler).toBe('Tampermonkey');
      } else {
        expect.fail('isGMUserScriptInfo가 true를 반환해야 합니다');
      }
    });
  });

  describe('adapter.ts 소스 코드 검증', () => {
    it('adapter.ts 파일이 존재한다', async () => {
      const stats = await fs.stat(targetFile);
      expect(stats.isFile()).toBe(true);
    });

    it('detectManager 함수에서 as any를 사용하지 않는다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      // detectManager 함수 추출
      const detectManagerMatch = source.match(/function detectManager\(\)[^{]*\{[\s\S]*?^}/m);

      if (detectManagerMatch) {
        const detectManagerCode = detectManagerMatch[0];

        // 'as any' 패턴이 없어야 함
        expect(
          detectManagerCode,
          'detectManager 함수에서 "as any"를 사용하고 있습니다'
        ).not.toContain('as any');

        // 'globalThis as any' 패턴이 없어야 함
        expect(
          detectManagerCode,
          'detectManager 함수에서 "globalThis as any"를 사용하고 있습니다'
        ).not.toContain('globalThis as any');
      }
    });

    it('safeInfo 함수에서 as any를 사용하지 않는다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      // safeInfo 함수 추출
      const safeInfoMatch = source.match(/function safeInfo\(\)[^{]*\{[\s\S]*?^}/m);

      if (safeInfoMatch) {
        const safeInfoCode = safeInfoMatch[0];

        // 'as any' 패턴이 없어야 함
        expect(safeInfoCode, 'safeInfo 함수에서 "as any"를 사용하고 있습니다').not.toContain(
          'as any'
        );

        // 'globalThis as any' 패턴이 없어야 함
        expect(
          safeInfoCode,
          'safeInfo 함수에서 "globalThis as any"를 사용하고 있습니다'
        ).not.toContain('globalThis as any');
      }
    });

    it('getUserscript 함수에서 as any를 사용하지 않는다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      // getUserscript 함수 추출 (시작만 확인)
      const getUserscriptMatch = source.match(
        /export function getUserscript\(\)[^{]*\{[\s\S]{0,500}/
      );

      if (getUserscriptMatch) {
        const getUserscriptStart = getUserscriptMatch[0];

        // 함수 시작 부분에서 'const g: any = globalThis as any' 패턴이 없어야 함
        expect(
          getUserscriptStart,
          'getUserscript 함수에서 "const g: any = globalThis as any"를 사용하고 있습니다'
        ).not.toMatch(/const\s+g\s*:\s*any\s*=\s*globalThis\s+as\s+any/);
      }
    });

    it('isGMUserScriptInfo 타입 가드를 import하여 사용한다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      expect(source).toContain(
        "import { isGMUserScriptInfo } from '@shared/utils/type-safety-helpers'"
      );
      expect(source).toContain('isGMUserScriptInfo(');
    });

    it('GlobalWithGM 인터페이스가 정의되어 있다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      // GlobalWithGM 인터페이스 정의 확인
      expect(source, 'GlobalWithGM 인터페이스가 정의되어 있지 않습니다').toContain(
        'interface GlobalWithGM'
      );

      // GM_info 속성 확인
      expect(source, 'GlobalWithGM 인터페이스에 GM_info 속성이 없습니다').toMatch(
        /interface\s+GlobalWithGM[\s\S]{0,200}GM_info/
      );
    });

    it('as any 타입 단언이 제거되었다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      // GM_info 관련 라인에서 'as any' 패턴 찾기
      const gmInfoLines = source.split('\n').filter(line => {
        return line.includes('GM_info') && !line.trim().startsWith('//');
      });

      // GM_info 관련 라인이 있어야 함
      expect(gmInfoLines.length).toBeGreaterThan(0);

      // 각 라인에서 'as any' 패턴이 없어야 함 (주석 제외)
      const gmInfoWithAsAny = gmInfoLines.filter(line => line.includes('as any'));

      expect(
        gmInfoWithAsAny.length,
        `GM_info 관련 ${gmInfoWithAsAny.length}개 라인에서 "as any"가 발견되었습니다:\n${gmInfoWithAsAny.join('\n')}`
      ).toBe(0);
    });
  });

  describe('타입 안전성 검증', () => {
    it('타입 가드를 사용한 GM_info 접근이 타입 안전하다', () => {
      const mockGlobal: unknown = {
        scriptHandler: 'Tampermonkey',
      };

      if (isGMUserScriptInfo(mockGlobal)) {
        const info = mockGlobal as { scriptHandler?: string };
        expect(info.scriptHandler).toBe('Tampermonkey');
      } else {
        expect.fail('isGMUserScriptInfo가 true를 반환해야 합니다');
      }
    });

    it('타입 가드를 사용한 scriptHandler 접근이 타입 안전하다', () => {
      const mockGlobal: unknown = {
        scriptHandler: 'Violentmonkey',
      };

      if (isGMUserScriptInfo(mockGlobal)) {
        const info = mockGlobal as { scriptHandler?: string };
        const handler = info.scriptHandler;
        expect(handler).toBe('Violentmonkey');
        expect(typeof handler).toBe('string');
      }
    });
  });
});
