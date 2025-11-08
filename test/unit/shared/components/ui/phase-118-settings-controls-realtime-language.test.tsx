/**
 * @fileoverview Phase 118: SettingsControls 언어 변경 실시간 반영 테스트
 * @description 언어 설정 변경 시 SettingsControls UI가 즉시 업데이트되는지 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SETTINGS_CONTROLS_TSX_PATH = 'src/shared/components/ui/Settings/SettingsControls.tsx';

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('Phase 118: SettingsControls 언어 변경 실시간 반영', () => {
  it('[RED] SettingsControls가 getSolid를 사용하여 Solid.js API를 가져와야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // getSolid import가 있어야 함
    const hasGetSolid = /import.*getSolid.*from.*vendors/.test(controlsTSX);

    expect(
      hasGetSolid,
      '❌ SettingsControls가 getSolid를 import해야 합니다 (Solid.js API 사용)'
    ).toBe(true);

    // const solid = getSolid() 패턴 확인
    const usesGetSolid = /const\s+solid\s*=\s*getSolid\s*\(\s*\)/.test(controlsTSX);

    expect(usesGetSolid, '❌ SettingsControls가 getSolid()를 호출해야 합니다').toBe(true);
  });

  it('[RED] SettingsControls가 Solid.js의 createSignal을 사용해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const { createSignal, ... } = solid; 패턴 확인
    const destructuresSolid = /const\s*\{[^}]*createSignal[^}]*\}\s*=\s*solid/.test(controlsTSX);

    expect(
      destructuresSolid,
      '❌ SettingsControls가 solid에서 createSignal을 destructure해야 합니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 Solid.js의 createEffect를 사용해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const { createEffect, ... } = solid; 패턴 확인
    const destructuresEffect = /const\s*\{[^}]*createEffect[^}]*\}\s*=\s*solid/.test(controlsTSX);

    expect(
      destructuresEffect,
      '❌ SettingsControls가 solid에서 createEffect를 destructure해야 합니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 onLanguageChange를 구독하는 createEffect가 있어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // createEffect(() => { ... languageService.onLanguageChange ... })
    const hasLanguageChangeEffect =
      /createEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?languageService\.onLanguageChange/.test(
        controlsTSX
      );

    expect(
      hasLanguageChangeEffect,
      '❌ SettingsControls가 languageService.onLanguageChange를 구독하는 createEffect가 없습니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 createMemo를 사용하여 문자열을 동적으로 생성해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const { createMemo, ... } = solid; 패턴 확인
    const destructuresMemo = /const\s*\{[^}]*createMemo[^}]*\}\s*=\s*solid/.test(controlsTSX);

    expect(
      destructuresMemo,
      '❌ SettingsControls가 solid에서 createMemo를 destructure해야 합니다'
    ).toBe(true);
  });

  it('[RED] 테마/언어 라벨이 createMemo로 감싸져 반응적으로 생성되어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const themeTitle = createMemo(() => i18n.getString('settings.theme'));
    const hasThemeTitleMemo = /const\s+themeTitle\s*=\s*createMemo\s*\(\s*\(\)\s*=>/.test(
      controlsTSX
    );

    expect(hasThemeTitleMemo, '❌ themeTitle이 createMemo로 감싸져 있지 않습니다').toBe(true);

    // const languageTitle = createMemo(() => i18n.getString('settings.language'));
    const hasLanguageTitleMemo = /const\s+languageTitle\s*=\s*createMemo\s*\(\s*\(\)\s*=>/.test(
      controlsTSX
    );

    expect(hasLanguageTitleMemo, '❌ languageTitle이 createMemo로 감싸져 있지 않습니다').toBe(true);
  });

  it('[RED] 모든 옵션 텍스트가 createMemo나 getter로 감싸져 있어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // 옵션 텍스트가 정적 문자열이 아니라 함수 호출이어야 함
    // {i18n.getString('settings.themeAuto')} 같은 패턴이 있으면 안 됨
    // 대신 {themeAutoText()} 같은 패턴이어야 함

    // 정적 i18n.getString 호출이 JSX 내에 있는지 확인
    const hasStaticI18nInJSX = /<[^>]+>\s*\{i18n\.getString\(/g.test(controlsTSX);

    expect(
      !hasStaticI18nInJSX,
      '❌ JSX 내에 정적 i18n.getString() 호출이 있습니다. createMemo로 감싸야 합니다.'
    ).toBe(true);
  });

  it('[RED] onCleanup을 사용하여 언어 변경 리스너를 정리해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const { onCleanup, ... } = solid; 패턴 확인
    const destructuresCleanup = /const\s*\{[^}]*onCleanup[^}]*\}\s*=\s*solid/.test(controlsTSX);

    expect(
      destructuresCleanup,
      '❌ SettingsControls가 solid에서 onCleanup을 destructure해야 합니다'
    ).toBe(true);

    // createEffect 내에서 onCleanup 호출
    const hasCleanupInEffect = /createEffect[\s\S]*?onCleanup\s*\(\s*\(\)\s*=>/.test(controlsTSX);

    expect(
      hasCleanupInEffect,
      '❌ createEffect 내에서 onCleanup으로 리스너를 정리해야 합니다'
    ).toBe(true);
  });
});
