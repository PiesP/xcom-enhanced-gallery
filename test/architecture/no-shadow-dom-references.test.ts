/**
 * @fileoverview Shadow DOM 참조 금지 테스트 (RED)
 * @description Phase 2: Light DOM 전환 후 테스트에서 shadowRoot 참조 제거 검증
 */

/// <reference types="node" />

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const TEST_DIR = join(process.cwd(), 'test');

/**
 * 디렉터리 재귀 탐색 헬퍼
 */
function* walkFiles(dir: string): Generator<string> {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // node_modules나 숨김 디렉터리 제외
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        yield* walkFiles(fullPath);
      }
    } else if (stat.isFile() && /\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      yield fullPath;
    }
  }
}

/**
 * Shadow DOM 관련 테스트 파일 허용 목록
 * (이 파일들은 Shadow DOM 동작 자체를 테스트하므로 예외)
 */
const ALLOWED_SHADOW_DOM_TEST_FILES = [
  'GalleryContainer.shadow-style.isolation.red.test.tsx', // Shadow DOM 스타일 주입 테스트
  'GalleryContainer.light-dom.test.tsx', // Light DOM 테스트 (Shadow DOM 없음 검증)
  'no-shadow-dom-references.test.ts', // 이 파일 자체
];

describe('Phase 2: Shadow DOM 참조 제거 검증', () => {
  it('테스트 파일에서 shadowRoot 속성 접근이 제거되어야 한다', () => {
    const violations: Array<{ file: string; lines: number[] }> = [];

    for (const filePath of walkFiles(TEST_DIR)) {
      // 허용 목록에 있는 파일은 스킵
      const fileName = filePath.split(/[\\/]/).pop() ?? '';
      if (ALLOWED_SHADOW_DOM_TEST_FILES.includes(fileName)) {
        continue;
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const violatingLines: number[] = [];

      lines.forEach((line, index) => {
        // 주석이 아닌 실제 코드에서 shadowRoot 참조 확인
        if (!/^\s*\/\/|^\s*\*/.test(line) && line.includes('shadowRoot')) {
          violatingLines.push(index + 1);
        }
      });

      if (violatingLines.length > 0) {
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        violations.push({ file: relativePath, lines: violatingLines });
      }
    }

    if (violations.length > 0) {
      const message = [
        '\n❌ Shadow DOM 참조가 발견되었습니다:',
        '',
        ...violations.map(({ file, lines }) => `  ${file}:${lines.join(', ')}`),
        '',
        '🔧 수정 방법:',
        '  1. container.shadowRoot?.querySelector(...) → container.querySelector(...)',
        '  2. shadowRoot 변수 선언 제거',
        '  3. Light DOM 방식으로 테스트 수정',
      ].join('\n');

      expect.fail(message);
    }

    expect(violations).toHaveLength(0);
  });

  it('mountGallery 함수 호출 시 useShadowDOM 플래그가 false이거나 생략되어야 한다', () => {
    const violations: Array<{ file: string; lines: number[] }> = [];

    for (const filePath of walkFiles(TEST_DIR)) {
      const fileName = filePath.split(/[\\/]/).pop() ?? '';
      if (ALLOWED_SHADOW_DOM_TEST_FILES.includes(fileName)) {
        continue;
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const violatingLines: number[] = [];

      lines.forEach((line, index) => {
        // mountGallery 호출에서 useShadowDOM: true 확인
        if (
          !/^\s*\/\/|^\s*\*/.test(line) &&
          line.includes('mountGallery') &&
          /useShadowDOM\s*:\s*true/.test(line)
        ) {
          violatingLines.push(index + 1);
        }
      });

      if (violatingLines.length > 0) {
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        violations.push({ file: relativePath, lines: violatingLines });
      }
    }

    if (violations.length > 0) {
      const message = [
        '\n❌ useShadowDOM: true 플래그가 발견되었습니다:',
        '',
        ...violations.map(({ file, lines }) => `  ${file}:${lines.join(', ')}`),
        '',
        '🔧 수정 방법:',
        '  - useShadowDOM: true → useShadowDOM: false 또는 파라미터 제거',
      ].join('\n');

      expect.fail(message);
    }

    expect(violations).toHaveLength(0);
  });
});
