/**
 * @fileoverview CSS Global Prune P3 - 중복 스캐너 확장 테스트
 * 목표: 공통/경계 클래스를 스캔하여 isolated-gallery.css와 gallery-global.css 간 중복 정의를 차단
 * - isolated-only 셀렉터: isolated에만 존재, global에는 없어야 함
 * - global-only 셀렉터: global에만 존재, isolated에는 없어야 함
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

function stripCssComments(css: string): string {
  // /* ... */ 형태의 CSS 주석 제거 (멀티라인 포함)
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readCss(rel: string): string {
  const raw = readFileSync(resolve(process.cwd(), rel), 'utf8');
  return stripCssComments(raw);
}

function countSelectorOccurrences(css: string, selector: string): number {
  // '.selector' 뒤에 알파벳/숫자/하이픈이 오지 않는 경우만 카운트(부분 일치 회피)
  const pattern = new RegExp(`\\.${selector}(?![\\w-])`, 'g');
  return (css.match(pattern) || []).length;
}

describe('XEG-CSS-GLOBAL-PRUNE P3: Duplication Scanner Expanded', () => {
  const isolated = readCss('src/shared/styles/isolated-gallery.css');
  const global = readCss('src/features/gallery/styles/gallery-global.css');

  const isolatedOnlySelectors = [
    // 안전한 고유 셀렉터들 (isolated에만 존재해야 함)
    'glass-surface',
    'xeg-root',
    'button-primary',
    'button-danger',
  ];

  const globalOnlySelectors = [
    // 안전한 고유 셀렉터들 (global에만 존재해야 함)
    'xeg-gallery-overlay',
    'xeg-gallery-container',
    'xeg-gallery-toolbar',
    'xeg-gallery-viewer',
    'xeg-gallery-nav-left',
  ];

  it('isolated-only 셀렉터는 isolated에 존재하고 global에는 없어야 한다', () => {
    const failures: string[] = [];
    for (const sel of isolatedOnlySelectors) {
      const iso = countSelectorOccurrences(isolated, sel);
      const glob = countSelectorOccurrences(global, sel);
      if (iso < 1 || glob !== 0) {
        failures.push(`${sel} => isolated:${iso}, global:${glob}`);
      }
    }
    expect(
      failures,
      `isolated-only 셀렉터 중 중복/누락이 있습니다:\n${failures.join('\n')}`
    ).toEqual([]);
  });

  it('global-only 셀렉터는 global에 존재하고 isolated에는 없어야 한다', () => {
    const failures: string[] = [];
    for (const sel of globalOnlySelectors) {
      const iso = countSelectorOccurrences(isolated, sel);
      const glob = countSelectorOccurrences(global, sel);
      if (glob < 1 || iso !== 0) {
        failures.push(`${sel} => isolated:${iso}, global:${glob}`);
      }
    }
    expect(failures, `global-only 셀렉터 중 중복/누락이 있습니다:\n${failures.join('\n')}`).toEqual(
      []
    );
  });
});
