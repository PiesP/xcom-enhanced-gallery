/**
 * @file Phase 67: 디자인 토큰 최적화 TDD 테스트
 * @description 미사용 토큰 제거, 중복 정의 통합, 적게 사용되는 토큰 검토
 *
 * 목표:
 * - 미사용 토큰 14개 제거 검증
 * - 중복 정의 24개 통합 검증
 * - 토큰 참조 체인 무결성 보장
 * - 번들 크기 절감 측정
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

// 파일 재귀 검색 헬퍼
function findFiles(dir: string, extensions: string[] = ['.css', '.ts', '.tsx']): string[] {
  const results: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results.push(...findFiles(fullPath, extensions));
      } else if (extensions.includes(extname(item))) {
        results.push(fullPath);
      }
    }
  } catch {
    // 접근 오류 무시
  }

  return results;
}

describe('Phase 67 Step 1: 미사용 토큰 제거 (RED→GREEN)', () => {
  let semanticTokensCSS = '';
  let allSourceFiles: string[] = [];

  beforeAll(() => {
    const srcPath = resolve(process.cwd(), 'src');

    try {
      semanticTokensCSS = readFileSync(
        resolve(srcPath, 'shared/styles/design-tokens.semantic.css'),
        'utf-8'
      );
    } catch {
      semanticTokensCSS = '';
    }

    // 소스 파일 목록 수집
    allSourceFiles = findFiles(srcPath);
  });

  describe('미사용 토큰 제거 검증', () => {
    const UNUSED_TOKENS = [
      '--xeg-focus-ring-color',
      '--xeg-focus-ring-width',
      '--xeg-modal-bg-dark',
      '--xeg-modal-bg-light',
      '--xeg-modal-border-dark',
      '--xeg-modal-border-light',
      '--xeg-toolbar-bg-high-contrast-dark',
      '--xeg-toolbar-bg-high-contrast-light',
      '--xeg-toolbar-border-high-contrast-dark',
      '--xeg-toolbar-border-high-contrast-light',
      '--xeg-toolbar-button-bg-high-contrast-dark',
      '--xeg-toolbar-button-bg-high-contrast-light',
      '--xeg-toolbar-button-border-high-contrast-dark',
      '--xeg-toolbar-button-border-high-contrast-light',
    ];

    test.each(UNUSED_TOKENS)('토큰 %s는 design-tokens.semantic.css에 정의되지 않아야 함', token => {
      // GREEN: 제거되어 정의되지 않음
      const tokenDefPattern = new RegExp(`^\\s*${token}\\s*:`, 'm');
      const isDefined = tokenDefPattern.test(semanticTokensCSS);

      // GREEN 단계
      expect(isDefined).toBe(false);
    });

    test.each(UNUSED_TOKENS)('토큰 %s는 소스 코드에서 사용되지 않아야 함', token => {
      if (allSourceFiles.length === 0) {
        expect.soft(true).toBe(true);
        return;
      }

      let usageCount = 0;
      const varPattern = new RegExp(
        `var\\(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
        'g'
      );

      for (const file of allSourceFiles) {
        try {
          const content = readFileSync(file, 'utf-8');
          // design-tokens.semantic.css 자체는 제외
          if (file.includes('design-tokens.semantic.css')) continue;

          const matches = content.match(varPattern);
          if (matches) {
            usageCount += matches.length;
          }
        } catch {
          // 파일 읽기 실패 시 무시
        }
      }

      // 미사용 토큰이므로 사용 횟수는 0이어야 함
      expect(usageCount).toBe(0);
    });
  });

  describe('토큰 참조 체인 무결성', () => {
    test('제거 후에도 필수 토큰들은 유지되어야 함', () => {
      const ESSENTIAL_TOKENS = [
        '--xeg-modal-bg', // 실제 사용되는 통합 토큰
        '--xeg-modal-border',
        '--xeg-toolbar-bg-high-contrast', // 실제 사용되는 통합 토큰
        '--xeg-toolbar-border-high-contrast',
        '--xeg-toolbar-button-bg-high-contrast',
        '--xeg-toolbar-button-border-high-contrast',
        '--xeg-focus-ring', // 실제 사용되는 통합 토큰
      ];

      for (const token of ESSENTIAL_TOKENS) {
        const tokenDefPattern = new RegExp(`^\\s*${token}\\s*:`, 'm');
        const isDefined = tokenDefPattern.test(semanticTokensCSS);

        expect(isDefined).toBe(true);
      }
    });

    test('중요 토큰 참조가 끊어지지 않았는지 확인', () => {
      // --xeg-modal-bg가 유효한 값을 참조하는지
      const modalBgMatch = semanticTokensCSS.match(/--xeg-modal-bg:\s*var\((--[^)]+)\)/);
      if (modalBgMatch) {
        const refToken = modalBgMatch[1];
        // 참조된 토큰도 정의되어 있어야 함
        // refToken은 --color-* (primitive) 또는 --xeg-* (semantic) 가능
        const refPattern = new RegExp(`^\\s*${refToken}\\s*:`, 'm');
        const isRefDefined = refPattern.test(semanticTokensCSS);

        // primitive 토큰일 경우 design-tokens.primitive.css에 정의되어 있을 수 있음
        // semantic 토큰일 경우 현재 파일에 정의되어 있어야 함
        if (!isRefDefined && refToken.startsWith('--xeg-')) {
          // xeg 토큰이 없으면 문제
          expect(isRefDefined).toBe(true);
        }
        // color-* 토큰은 primitive 파일에 있으므로 체크 생략
      } else {
        // var() 참조가 없다면 직접 값이거나 다른 형식이므로 통과
        expect(true).toBe(true);
      }
    });
  });
});

describe('Phase 67 Step 2: 중복 정의 통합 (✅ 완료)', () => {
  let semanticTokensCSS = '';

  beforeAll(() => {
    const srcPath = resolve(process.cwd(), 'src');

    try {
      semanticTokensCSS = readFileSync(
        resolve(srcPath, 'shared/styles/design-tokens.semantic.css'),
        'utf-8'
      );
    } catch {
      semanticTokensCSS = '';
    }
  });

  test('중복 정의된 토큰이 없어야 함 (Step 2 목표)', () => {
    // CSS를 스코프별로 분할
    const scopes: { name: string; content: string }[] = [];
    const lines = semanticTokensCSS.split(/\r?\n/);
    let currentScope = { name: ':root', content: '' };
    let inScope = false;
    let braceCount = 0;

    for (const line of lines) {
      // 스코프 시작 감지
      if (
        /^\s*:root\s*\{/.test(line) ||
        /^\s*\[data-theme=['"]\w+['"]\]\s*\{/.test(line) ||
        /^\s*@media\s+\([^)]+\)\s*\{/.test(line)
      ) {
        // 이전 스코프 저장
        if (inScope && currentScope.content.trim()) {
          scopes.push(currentScope);
        }
        // 새 스코프 시작
        const scopeMatch = line.match(/^(\s*)(.+?)\s*\{/);
        currentScope = {
          name: scopeMatch ? scopeMatch[2].trim() : line.trim(),
          content: '',
        };
        inScope = true;
        braceCount = 1;
        continue;
      }

      // 중첩된 스코프 처리 (예: @media 안의 :root)
      if (inScope && /\{/.test(line)) {
        braceCount += (line.match(/\{/g) || []).length;
      }
      if (inScope && /\}/.test(line)) {
        braceCount -= (line.match(/\}/g) || []).length;
        if (braceCount === 0) {
          scopes.push(currentScope);
          inScope = false;
          currentScope = { name: '', content: '' };
          continue;
        }
      }

      if (inScope) {
        currentScope.content += line + '\n';
      }
    }

    // 마지막 스코프 저장
    if (inScope && currentScope.content.trim()) {
      scopes.push(currentScope);
    }

    // 각 스코프 내에서 중복 토큰 찾기
    const allDuplicates: { scope: string; duplicates: [string, number][] }[] = [];

    for (const scope of scopes) {
      const tokenDefinitions = new Map<string, number>();
      const scopeLines = scope.content.split(/\r?\n/);

      for (const line of scopeLines) {
        const match = line.match(/^\s*(--xeg-[a-z0-9-]+)\s*:/);
        if (match) {
          const token = match[1];
          tokenDefinitions.set(token, (tokenDefinitions.get(token) || 0) + 1);
        }
      }

      const duplicates = Array.from(tokenDefinitions.entries()).filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        allDuplicates.push({ scope: scope.name, duplicates });
      }
    }

    // 중복 출력 (디버깅)
    if (allDuplicates.length > 0) {
      console.log('스코프별 중복 토큰:');
      for (const { scope, duplicates } of allDuplicates) {
        console.log(
          `  ${scope}:`,
          duplicates.map(([token, count]) => `${token} (${count}회)`)
        );
      }
    }

    // GREEN 목표: 각 스코프 내에서 0개 중복
    expect(allDuplicates.length).toBe(0);
  });
});

describe('Phase 67 Step 3: 적게 사용되는 토큰 검토 (대기 중)', () => {
  test.skip('1-2회만 사용되는 토큰 목록 확인 (Step 3 대기)', () => {
    // 이 테스트는 Step 3에서 활성화
    expect(true).toBe(true);
  });
});
