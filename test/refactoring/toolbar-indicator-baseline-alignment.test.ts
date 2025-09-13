/**
 * TDD: Toolbar Indicator Baseline Alignment
 * - 미디어 카운터(숫자/숫자)와 아이콘의 수직 중심 정렬을 보장하는 CSS 규칙을 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOOLBAR_CSS_PATH = 'src/shared/components/ui/Toolbar/Toolbar.module.css';

function read(path: string) {
  return readFileSync(path, 'utf-8');
}

describe('Toolbar Indicator Baseline Alignment', () => {
  it('mediaCounterWrapper가 inline-flex + center 정렬 및 진행 바 오버레이를 사용해야 함', () => {
    const css = read(TOOLBAR_CSS_PATH);

    // 래퍼 정렬 규칙
    expect(css.includes('.mediaCounterWrapper')).toBe(true);
    expect(css.includes('display: inline-flex;')).toBe(true);
    expect(css.includes('align-items: center;')).toBe(true);
    expect(css.includes('min-height: 2.5em')).toBe(true);
    // 진행 바 공간 확보 (오버레이 하단 간격)
    expect(css.includes('padding-bottom: 0.5em')).toBe(true);

    // 진행 바는 오버레이 배치로 수직 중심에 영향을 주지 않아야 함
    expect(css.includes('.progressBar')).toBe(true);
    expect(css.includes('position: absolute;')).toBe(true);
    expect(css.includes('bottom: 0.125em')).toBe(true);
  });

  it('mediaCounter 텍스트가 inline-flex + line-height:1로 베이스라인 동기화되어야 함', () => {
    const css = read(TOOLBAR_CSS_PATH);

    expect(css.includes('.mediaCounter')).toBe(true);
    expect(css.includes('display: inline-flex;')).toBe(true);
    expect(css.includes('align-items: center;')).toBe(true);
    expect(css.includes('line-height: 1;')).toBe(true);
  });
});
