import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

// ESM 환경에서 __dirname 대체
const __DIRNAME = path.dirname(new URL(import.meta.url).pathname);

// RED: Glass / backdrop-filter 관련 토큰 및 스타일 잔존 여부 탐지
// 목표 GREEN 단계: 모든 glass 변수/클래스 제거 또는 alias+deprecation 주석 처리 후 이 테스트 통과
// 현재는 반드시 실패해야 함

describe('Phase22 Glass usage deprecation (RED)', () => {
  it('should have no remaining glass/backdrop-filter tokens or usages', () => {
    const root = path.resolve(__DIRNAME, '../../../../..');
    const files = globSync('src/shared/styles/**/*.{css,ts,tsx}', { cwd: root, absolute: true });
    const patterns = [
      /--xeg-glass/,
      /glassmorphism/,
      /backdrop-filter\s*:/,
      /surface-glass/,
      /color-glass/,
    ];
    const hits: Array<{ file: string; line: number; match: string }> = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8').split(/\r?\n/);
      content.forEach((line, idx) => {
        for (const p of patterns) {
          if (p.test(line)) {
            hits.push({ file: path.relative(root, file), line: idx + 1, match: line.trim() });
            break;
          }
        }
      });
    }
    // 현재 단계에서는 glass 관련 잔존이 있으므로 실패 유지
    expect(hits, 'Glass related references should be removed').toEqual([]);
  });
});
