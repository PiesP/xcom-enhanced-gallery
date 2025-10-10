/**
 * TDD: Settings Header Alignment
 * - 설정 모달 헤더의 수직 정렬과 닫기 버튼 클릭 타겟 일관성을 CSS 레벨에서 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SETTINGS_MODAL_CSS_PATH = 'src/shared/components/ui/SettingsModal/SettingsModal.module.css';

function read(path: string) {
  return readFileSync(path, 'utf-8');
}

describe('Settings Header Alignment', () => {
  it('header가 flex 정렬로 중앙 정렬되어야 함', () => {
    const css = read(SETTINGS_MODAL_CSS_PATH);
    expect(css.includes('.header')).toBe(true);
    expect(css.includes('display: flex;')).toBe(true);
    expect(css.includes('align-items: center;')).toBe(true);
    expect(css.includes('justify-content: space-between;')).toBe(true);
  });

  it('closeButton이 2.5em 클릭 타겟을 보장해야 함', () => {
    const css = read(SETTINGS_MODAL_CSS_PATH);
    expect(css.includes('.closeButton')).toBe(true);
    expect(css.includes('width: 2.5em;')).toBe(true);
    expect(css.includes('height: 2.5em;')).toBe(true);
    expect(css.includes('min-width: 2.5em;')).toBe(true);
    expect(css.includes('min-height: 2.5em;')).toBe(true);
    // 정렬이 버튼 자체에서도 유지
    expect(css.includes('display: inline-flex;')).toBe(true);
    expect(css.includes('align-items: center;')).toBe(true);
    expect(css.includes('justify-content: center;')).toBe(true);
  });
});
