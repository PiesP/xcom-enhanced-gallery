/**
 * Phase 101: adapter.ts 타입 가드 테스트
 *
 * 목표: 'as any' 타입 단언 제거 및 hasGMInfo() 타입 가드 추가
 * 대상 파일: src/shared/external/userscript/adapter.ts
 * 제거 대상: 라인 29, 44, 151 (3개)
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 타입 가드 인터페이스 (adapter.ts와 동일)
interface GlobalWithGM {
  GM_info?: {
    script: {
      name: string;
      version: string;
      namespace: string;
    };
    scriptHandler: string;
    version: string;
  };
  GM_download?: (url: string, filename: string) => void;
  GM_xmlhttpRequest?: (options: unknown) => { abort: () => void };
  GM_setValue?: (key: string, value: unknown) => Promise<void> | void;
  GM_getValue?: <T>(key: string, defaultValue?: T) => Promise<T> | T;
  GM_deleteValue?: (key: string) => Promise<void> | void;
  GM_listValues?: () => Promise<string[]> | string[];
}

// 타입 가드 함수 (adapter.ts에 추가될 예정)
function hasGMInfo(g: unknown): g is GlobalWithGM {
  return typeof g === 'object' && g !== null && 'GM_info' in g;
}

describe('Phase 101: adapter.ts 타입 가드', () => {
  const targetFile = resolve(__dirname, '../../../../src/shared/external/userscript/adapter.ts');

  describe('hasGMInfo 타입 가드 함수', () => {
    it('GM_info가 있는 객체에서 true를 반환한다', () => {
      const mockGlobal: GlobalWithGM = {
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

      expect(hasGMInfo(mockGlobal)).toBe(true);
    });

    it('GM_info가 없는 객체에서 false를 반환한다', () => {
      const mockGlobal = { someOtherProperty: 'value' };
      expect(hasGMInfo(mockGlobal)).toBe(false);
    });

    it('null에서 false를 반환한다', () => {
      expect(hasGMInfo(null)).toBe(false);
    });

    it('undefined에서 false를 반환한다', () => {
      expect(hasGMInfo(undefined)).toBe(false);
    });

    it('원시 타입에서 false를 반환한다', () => {
      expect(hasGMInfo(42)).toBe(false);
      expect(hasGMInfo('string')).toBe(false);
      expect(hasGMInfo(true)).toBe(false);
    });

    it('타입 가드가 TypeScript 타입 좁히기를 수행한다', () => {
      const mockGlobal: unknown = {
        GM_info: {
          script: { name: 'test', version: '1.0', namespace: 'test' },
          scriptHandler: 'Tampermonkey',
          version: '1.0',
        },
      };

      if (hasGMInfo(mockGlobal)) {
        // 타입 가드가 성공하면 GM_info 접근 가능
        expect(mockGlobal.GM_info).toBeDefined();
        expect(mockGlobal.GM_info?.script.name).toBe('test');
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

    it('hasGMInfo 타입 가드 함수가 정의되어 있다', async () => {
      const source = await fs.readFile(targetFile, 'utf-8');

      // hasGMInfo 함수 정의 확인
      expect(source, 'hasGMInfo 타입 가드 함수가 정의되어 있지 않습니다').toContain(
        'function hasGMInfo'
      );

      // 타입 가드 시그니처 확인
      expect(source, 'hasGMInfo의 타입 가드 시그니처(g is GlobalWithGM)가 없습니다').toMatch(
        /function hasGMInfo\s*\([^)]*\)\s*:\s*[^{]*is\s+GlobalWithGM/
      );
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
        GM_info: {
          script: { name: 'xcom-enhanced-gallery', version: '1.0.0', namespace: 'test' },
          scriptHandler: 'Tampermonkey',
          version: '1.0.0',
        },
      };

      // 타입 가드 사용 후 안전하게 접근 가능
      if (hasGMInfo(mockGlobal)) {
        const afterGuard = mockGlobal.GM_info;
        expect(afterGuard).toBeDefined();
        expect(afterGuard?.script.name).toBe('xcom-enhanced-gallery');
      } else {
        // 타입 가드가 실패하면 이 테스트도 실패
        expect.fail('hasGMInfo가 true를 반환해야 합니다');
      }
    });

    it('타입 가드를 사용한 scriptHandler 접근이 타입 안전하다', () => {
      const mockGlobal: unknown = {
        GM_info: {
          script: { name: 'test', version: '1.0', namespace: 'test' },
          scriptHandler: 'Violentmonkey',
          version: '1.0',
        },
      };

      if (hasGMInfo(mockGlobal)) {
        const handler = mockGlobal.GM_info?.scriptHandler;
        expect(handler).toBe('Violentmonkey');
        expect(typeof handler).toBe('string');
      }
    });
  });
});
