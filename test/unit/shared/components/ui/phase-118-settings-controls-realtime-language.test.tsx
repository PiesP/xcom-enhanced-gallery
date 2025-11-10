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
  it('[RED] SettingsControls가 getSolid에서 Solid.js API를 구조 분해해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // getSolid import가 있어야 함
    const hasGetSolid = /import\s*\{\s*getSolid\s*\}\s*from/.test(controlsTSX);

    expect(
      hasGetSolid,
      '❌ SettingsControls가 getSolid를 import해야 합니다 (Solid.js API 사용)'
    ).toBe(true);

    // const { createMemo, createSignal, onCleanup, onMount } = getSolid(); 패턴 확인
    const usesDestructuredGetSolid =
      /const\s*\{[\s\S]*?createMemo[\s\S]*?createSignal[\s\S]*?onCleanup[\s\S]*?onMount[\s\S]*?\}\s*=\s*getSolid\s*\(\s*\)/.test(
        controlsTSX
      );

    expect(
      usesDestructuredGetSolid,
      '❌ SettingsControls가 getSolid()에서 Solid.js API를 직접 구조 분해해야 합니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 언어 변경 반응성을 위해 createSignal을 사용해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const [revision, setRevision] = createSignal(0); 패턴 확인
    const usesRevisionSignal =
      /const\s*\[\s*revision\s*,\s*setRevision\s*\]\s*=\s*createSignal\s*\(\s*0\s*\)/.test(
        controlsTSX
      );

    expect(
      usesRevisionSignal,
      '❌ SettingsControls가 언어 변경 감지를 위한 revision 시그널을 생성해야 합니다'
    ).toBe(true);

    const incrementsRevision = /setRevision\s*\(\s*v\s*=>\s*v\s*\+\s*1\s*\)/.test(controlsTSX);

    expect(
      incrementsRevision,
      '❌ SettingsControls가 언어 변경 시 revision 시그널을 증가시켜야 합니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 onMount로 languageService를 구독해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    const hasOnMountSubscription =
      /onMount\s*\(\s*\(\s*\)\s*=>\s*\{\s*const\s+unsubscribe\s*=\s*languageService\.onLanguageChange/.test(
        controlsTSX
      );

    expect(
      hasOnMountSubscription,
      '❌ SettingsControls가 onMount에서 languageService.onLanguageChange를 구독해야 합니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 onCleanup으로 언어 변경 리스너를 정리해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    const hasCleanupInOnMount = /onMount[\s\S]*onCleanup\s*\(\s*unsubscribe\s*\)/.test(controlsTSX);

    expect(
      hasCleanupInOnMount,
      '❌ SettingsControls가 onCleanup으로 언어 변경 리스너를 정리해야 합니다'
    ).toBe(true);
  });

  it('[RED] SettingsControls가 createMemo를 사용하여 문자열을 동적으로 생성해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // const strings = createMemo(() => { ... }) 패턴 확인
    const hasStringsMemo = /const\s+strings\s*=\s*createMemo\s*\(\s*\(\)\s*=>\s*\{/.test(
      controlsTSX
    );

    expect(
      hasStringsMemo,
      '❌ SettingsControls가 createMemo로 문자열 리소스를 memoize해야 합니다'
    ).toBe(true);
  });

  it('[RED] createMemo가 revision 시그널을 의존성으로 사용해야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    const memoUsesRevision = /createMemo\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?revision\s*\(\s*\)\s*;/.test(
      controlsTSX
    );

    expect(
      memoUsesRevision,
      '❌ createMemo가 revision() 호출을 통해 언어 변경에 반응해야 합니다'
    ).toBe(true);
  });

  it('[RED] 테마/언어 라벨 접근자가 memoized getter로 정의되어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    const hasThemeStringsGetter = /const\s+themeStrings\s*=\s*\(\)\s*=>\s*strings\(\)\.theme/.test(
      controlsTSX
    );
    const hasLanguageStringsGetter =
      /const\s+languageStrings\s*=\s*\(\)\s*=>\s*strings\(\)\.language/.test(controlsTSX);

    expect(
      hasThemeStringsGetter,
      '❌ themeStrings() getter가 정의되어 memoized 문자열에 접근해야 합니다'
    ).toBe(true);

    expect(
      hasLanguageStringsGetter,
      '❌ languageStrings() getter가 정의되어 memoized 문자열에 접근해야 합니다'
    ).toBe(true);
  });

  it('[RED] JSX에서는 memoized getter를 사용하고 정적 languageService 호출이 없어야 함', () => {
    const controlsTSX = read(SETTINGS_CONTROLS_TSX_PATH);

    // 정적 languageService.getString 호출이 JSX 내에 있는지 확인
    const hasStaticLanguageServiceInJSX = /<[^>]+>\s*\{\s*languageService\.getString\(/g.test(
      controlsTSX
    );

    expect(
      !hasStaticLanguageServiceInJSX,
      '❌ JSX 내에 정적 languageService.getString() 호출이 있습니다. memoized getter를 사용해야 합니다.'
    ).toBe(true);

    const usesMemoizedTheme = /themeStrings\(\)\.title/.test(controlsTSX);
    const usesMemoizedLanguage = /languageStrings\(\)\.labels\[option\]/.test(controlsTSX);

    expect(
      usesMemoizedTheme,
      '❌ JSX에서 themeStrings() getter를 사용해 제목을 렌더링해야 합니다'
    ).toBe(true);

    expect(
      usesMemoizedLanguage,
      '❌ JSX에서 languageStrings() getter를 사용해 옵션 라벨을 렌더링해야 합니다'
    ).toBe(true);
  });

  // onCleanup 검증은 onMount 테스트에서 수행됨
});
