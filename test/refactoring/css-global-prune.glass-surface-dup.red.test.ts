/**
 * @fileoverview CSS Global Prune - glass-surface 중복 정의 RED 테스트
 * @description isolated-gallery.css와 gallery-global.css 사이의 공통 클래스 중복 정의를 금지
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

function getCss(path: string) {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

function countOccurrences(source: string, selector: string): number {
  // 간단한 패턴: `.selector {` 블록 시작을 카운트 (주석/의미없는 매치 최소화)
  const pattern = new RegExp(`\\.${selector}\\s*{`, 'g');
  return (source.match(pattern) || []).length;
}

describe('XEG-CSS-GLOBAL-PRUNE P1 (RED)', () => {
  it('glass-surface 클래스 정의가 단일 출처(shared/isolated)에서만 1회 정의되어야 한다', () => {
    const isolated = getCss('src/shared/styles/isolated-gallery.css');
    const global = getCss('src/features/gallery/styles/gallery-global.css');

    // 각 파일 내 정의 수
    const isolatedCount = countOccurrences(isolated, 'glass-surface');
    const globalCount = countOccurrences(global, 'glass-surface');

    // 총합 1회여야 함 (현재는 중복으로 2회일 가능성 HIGH → RED 기대)
    const total = isolatedCount + globalCount;
    expect({ isolatedCount, globalCount, total }).toEqual(
      {
        isolatedCount: 1,
        globalCount: 0,
        total: 1,
      },
      'glass-surface는 shared/styles/isolated-gallery.css에서만 정의되어야 한다'
    );
  });
});
