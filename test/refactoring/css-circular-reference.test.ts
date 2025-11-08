/**
 * CSS 변수 순환 참조 탐지 테스트
 *
 * TDD RED 단계: 순환 참조를 탐지하고 실패하는 테스트 작성
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CSSVariable {
  name: string;
  value: string;
  references: string[];
  lineNumber: number;
}

/**
 * CSS 파일에서 CSS 변수들을 파싱하는 함수
 */
function parseCSSVariables(cssContent: string): Map<string, CSSVariable> {
  const variables = new Map<string, CSSVariable>();
  const lines = cssContent.split('\n');

  lines.forEach((line, index) => {
    // CSS 변수 정의 패턴: --variable-name: value;
    const match = line.match(/\s*--([a-zA-Z0-9-]+)\s*:\s*([^;]+);?/);
    if (match) {
      const name = match[1];
      const value = match[2].trim();

      // var() 함수로 참조하는 다른 변수들 찾기
      const varMatches = value.matchAll(/var\(--([a-zA-Z0-9-]+)\)/g);
      const references = Array.from(varMatches, m => m[1]);

      variables.set(name, {
        name,
        value,
        references,
        lineNumber: index + 1,
      });
    }
  });

  return variables;
}

/**
 * 순환 참조를 탐지하는 함수
 */
function detectCircularReferences(variables: Map<string, CSSVariable>): string[] {
  const circularPaths: string[] = [];

  function findCircular(
    varName: string,
    path: string[] = [],
    visited: Set<string> = new Set()
  ): void {
    if (visited.has(varName)) {
      // 순환 참조 발견
      const cycleStart = path.indexOf(varName);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart).concat([varName]);
        circularPaths.push(cycle.join(' → '));
      }
      return;
    }

    const variable = variables.get(varName);
    if (!variable) return;

    visited.add(varName);
    const newPath = [...path, varName];

    variable.references.forEach(ref => {
      findCircular(ref, newPath, new Set(visited));
    });
  }

  // 모든 변수에 대해 순환 참조 검사
  variables.forEach((_, varName) => {
    findCircular(varName);
  });

  return [...new Set(circularPaths)]; // 중복 제거
}

describe('CSS 변수 순환 참조 탐지', () => {
  setupGlobalTestIsolation();

  const designTokensPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');

  it('design-tokens.css 파일이 존재해야 함', () => {
    expect(() => readFileSync(designTokensPath, 'utf-8')).not.toThrow();
  });

  it('통합된 surface glass 변수들이 순환 참조 없이 정의되어야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const variables = parseCSSVariables(cssContent);

    // 통합된 surface glass 변수들 확인
    const surfaceGlassBg = variables.get('xeg-surface-glass-bg');
    const surfaceGlassBorder = variables.get('xeg-surface-glass-border');
    const surfaceGlassShadow = variables.get('xeg-surface-glass-shadow');

    expect(surfaceGlassBg).toBeDefined();
    expect(surfaceGlassBorder).toBeDefined();
    expect(surfaceGlassShadow).toBeDefined();

    console.log('📋 통합된 변수 정보:');
    console.log(
      `  --xeg-surface-glass-bg: ${surfaceGlassBg?.value} (라인 ${surfaceGlassBg?.lineNumber})`
    );
    console.log(
      `  --xeg-surface-glass-border: ${surfaceGlassBorder?.value} (라인 ${surfaceGlassBorder?.lineNumber})`
    );
    console.log(
      `  --xeg-surface-glass-shadow: ${surfaceGlassShadow?.value} (라인 ${surfaceGlassShadow?.lineNumber})`
    );
    console.log(`  surfaceGlassBg references:`, surfaceGlassBg?.references);

    // 통합 이후에는 toolbar-specific 변수가 제거되었으므로 순환 참조가 불가능함
    // 대신 surface glass 변수들이 잘 정의되었는지 확인
    const surfaceVariables = [
      'xeg-surface-glass-bg',
      'xeg-surface-glass-border',
      'xeg-surface-glass-shadow',
      'xeg-surface-glass-blur',
    ];

    // 각 surface glass 변수가 다른 surface glass 변수를 순환 참조하지 않는지 확인
    let directCircular = false;
    for (const varName of surfaceVariables) {
      const variable = variables.get(varName);
      if (variable) {
        const hasCircularRef = variable.references.some(
          ref => surfaceVariables.includes(ref) && ref !== varName
        );
        if (hasCircularRef) {
          directCircular = true;
        }
      }
    }

    // 전체 순환 참조 탐지
    const circularRefs = detectCircularReferences(variables);

    // surface glass 관련 순환 참조가 없어야 함
    const hasSurfaceCircularRef = circularRefs.some(ref =>
      surfaceVariables.some(varName => ref.includes(varName))
    );

    if (hasSurfaceCircularRef || directCircular) {
      console.log('🔴 발견된 순환 참조:', circularRefs);
      console.log('🔴 직접적인 순환 참조:', directCircular);
    }

    expect(hasSurfaceCircularRef || directCircular).toBe(false); // GREEN 단계: 순환 참조 제거됨
  });

  it('모든 CSS 변수에 순환 참조가 없어야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const variables = parseCSSVariables(cssContent);
    const circularRefs = detectCircularReferences(variables);

    if (circularRefs.length > 0) {
      console.log('🔴 발견된 모든 순환 참조:', circularRefs);
    }

    expect(circularRefs).toHaveLength(0);
  });

  it('xeg-surface-glass-bg는 실제 색상 값 또는 기본 토큰을 참조해야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const variables = parseCSSVariables(cssContent);

    const surfaceGlassBg = variables.get('xeg-surface-glass-bg');
    expect(surfaceGlassBg).toBeDefined();

    // xeg-surface-glass-bg는 다음 중 하나여야 함:
    // 1. rgba() 또는 hsla() 등의 실제 색상 값
    // 2. xeg-glass-bg-* 와 같은 기본 글래스 토큰
    // 3. 절대로 xeg-toolbar-glass-bg를 참조하면 안 됨

    const isValidValue =
      surfaceGlassBg!.value.includes('rgba(') ||
      surfaceGlassBg!.value.includes('hsla(') ||
      surfaceGlassBg!.value.includes('var(--xeg-glass-bg-') ||
      !surfaceGlassBg!.references.includes('xeg-toolbar-glass-bg');

    expect(isValidValue).toBe(true);
  });
});
