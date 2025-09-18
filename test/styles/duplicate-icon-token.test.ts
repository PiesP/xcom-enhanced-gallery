import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * RED 테스트 (TBAR-O P1: tbar-audit)
 * 목적: icon size 관련 핵심 토큰(--xeg-icon-size / stroke-width / variant) 중복 정의 감지
 * 기대: 현재는 design-tokens.css와 design-tokens.component.css 양쪽에 정의되어 FAIL해야 함.
 * GREEN 조건: component layer( design-tokens.component.css ) 단일 선언 후 design-tokens.css에서는 alias 혹은 제거 → 정의 source 1곳만.
 */

describe('TBAR-O P1 · duplicate icon token audit', () => {
  // ESM 환경에서 경로 계산(fileURLToPath 사용으로 lint no-undef 회피)
  const __filename = fileURLToPath(import.meta.url);
  const __dirnameSafe = path.dirname(__filename);
  const root = path.resolve(__dirnameSafe, '../../src/shared/styles');
  const baseTokensPath = path.join(root, 'design-tokens.css');
  const componentTokensPath = path.join(root, 'design-tokens.component.css');

  const baseContent = fs.readFileSync(baseTokensPath, 'utf-8');
  const componentContent = fs.readFileSync(componentTokensPath, 'utf-8');

  const TOKEN_NAMES = [
    '--xeg-icon-size',
    '--xeg-icon-stroke-width',
    '--xeg-icon-size-sm',
    '--xeg-icon-size-md',
    '--xeg-icon-size-lg',
  ];

  function countDefinitions(css: string, token: string): number {
    // 정의 패턴: --token-name: <value>;
    const regex = new RegExp(`${token}\\s*:`, 'g');
    return css.match(regex)?.length ?? 0;
  }

  it('중복 정의(>1 file)된 아이콘 토큰이 없어야 한다 (현재는 실패 예상)', () => {
    const duplicates: string[] = [];

    TOKEN_NAMES.forEach(token => {
      const inBase = countDefinitions(baseContent, token) > 0;
      const inComponent = countDefinitions(componentContent, token) > 0;
      if (inBase && inComponent) {
        duplicates.push(token);
      }
    });

    // 현재 상태: duplicates.length > 0 이어서 FAIL (RED)
    expect(duplicates, `중복 정의된 아이콘 토큰: ${duplicates.join(', ') || '없음'}`).toEqual([]);
  });
});
