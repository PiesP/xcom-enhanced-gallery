/**
 * Phase 109.2 RED Test: Settings Dropdown Label Accessibility
 * @description 설정 드롭다운이 compact 모드에서도 레이블을 인식할 수 있는지 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SETTINGS_CONTROLS_TSX_PATH = 'src/shared/components/ui/Settings/SettingsControls.tsx';

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('Phase 109.2: Settings Dropdown Label Accessibility', () => {
  it('테마 선택 드롭다운에 aria-label이 있어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // id='theme-select'인 select 요소에 aria-label 속성 확인 (여러 줄 지원)
    const themeSelectPattern = /id=['"]theme-select['"][\s\S]*?aria-label=/;

    expect(
      themeSelectPattern.test(controlsTSX),
      '❌ 테마 선택 드롭다운에 aria-label이 없습니다 (compact 모드에서 필수)'
    ).toBe(true);
  });

  it('언어 선택 드롭다운에 aria-label이 있어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // id='language-select'인 select 요소에 aria-label 속성 확인 (여러 줄 지원)
    const languageSelectPattern = /id=['"]language-select['"][\s\S]*?aria-label=/;

    expect(
      languageSelectPattern.test(controlsTSX),
      '❌ 언어 선택 드롭다운에 aria-label이 없습니다 (compact 모드에서 필수)'
    ).toBe(true);
  });

  it('compact 모드일 때도 라벨이 표시되어야 함 (Phase 113에서 변경)', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // Phase 113: compact 모드에서도 라벨이 항상 표시됨
    // <label for='theme-select' class={labelClass}> 패턴 확인
    const themeLabel = /<label for=['"]theme-select['"] class=\{labelClass\}>/.test(controlsTSX);
    const languageLabel = /<label for=['"]language-select['"] class=\{labelClass\}>/.test(
      controlsTSX
    );

    expect(
      themeLabel && languageLabel,
      '✅ Phase 113: compact 모드에서도 라벨이 항상 표시됩니다'
    ).toBe(true);

    // select에는 항상 aria-label이 있어야 함
    const themeHasAriaLabel = /id=['"]theme-select['"][\s\S]*?aria-label=/.test(controlsTSX);
    const languageHasAriaLabel = /id=['"]language-select['"][\s\S]*?aria-label=/.test(controlsTSX);

    expect(
      themeHasAriaLabel && languageHasAriaLabel,
      '❌ compact 모드에서도 select 요소에 aria-label이 있어야 합니다'
    ).toBe(true);
  });

  it('드롭다운이 의미 있는 aria-label 텍스트를 가져야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // Phase 118 업데이트: themeTitle()과 languageTitle()은 createMemo로 생성된 getter 함수
    // 테마 드롭다운: aria-label={themeTitle()} 형식 확인
    const themeAriaLabelPattern = /id=['"]theme-select['"][\s\S]*?aria-label=\{themeTitle\(\)\}/;

    expect(
      themeAriaLabelPattern.test(controlsTSX),
      '❌ 테마 드롭다운의 aria-label이 themeTitle()을 통해 제공되지 않습니다'
    ).toBe(true);

    // 언어 드롭다운: aria-label={languageTitle()} 형식 확인
    const languageAriaLabelPattern =
      /id=['"]language-select['"][\s\S]*?aria-label=\{languageTitle\(\)\}/;

    expect(
      languageAriaLabelPattern.test(controlsTSX),
      '❌ 언어 드롭다운의 aria-label이 languageTitle()을 통해 제공되지 않습니다'
    ).toBe(true);
  });
});
