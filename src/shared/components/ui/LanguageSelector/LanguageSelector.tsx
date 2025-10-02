/**
 * @fileoverview LanguageSelector Component (Phase 3 GREEN)
 * @description Epic LANG_ICON_SELECTOR Phase 3
 *
 * RadioGroup을 래핑하여 언어 선택 UI 제공
 * - 4개 언어 옵션: auto, ko, en, ja
 * - 각 언어별 아이콘 자동 매핑
 * - LanguageService 통합 (다국어 라벨)
 * - WAI-ARIA 준수 (RadioGroup 상속)
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import { RadioGroup } from '@shared/components/ui/RadioGroup';
import type { RadioOption } from '@shared/components/ui/RadioGroup';
import { languageService } from '@shared/services/LanguageService';
import type { SupportedLanguage } from '@shared/services/LanguageService';

/**
 * LanguageSelector Props
 */
export interface LanguageSelectorProps {
  /** 현재 선택된 언어 */
  readonly value: SupportedLanguage;
  /** 언어 변경 콜백 */
  readonly onChange: (language: SupportedLanguage) => void;
  /** 비활성화 상태 */
  readonly disabled?: boolean;
  /** 커스텀 CSS 클래스 */
  readonly className?: string;
  /** 레이아웃 방향 (기본: vertical) */
  readonly orientation?: 'vertical' | 'horizontal';
  /** RadioGroup에 전달할 aria-label */
  readonly 'aria-label'?: string;
  /** RadioGroup에 전달할 aria-labelledby */
  readonly 'aria-labelledby'?: string;
}

/**
 * 언어별 아이콘 이름 매핑
 */
const LANGUAGE_ICON_MAP: Record<SupportedLanguage, string> = {
  auto: 'language-auto',
  ko: 'language-ko',
  en: 'language-en',
  ja: 'language-ja',
};

/**
 * 언어별 표시 이름 매핑
 * LanguageService가 언어 이름 API를 제공하지 않으므로 로컬 매핑 사용
 */
const LANGUAGE_LABEL_MAP: Record<
  SupportedLanguage,
  Record<Exclude<SupportedLanguage, 'auto'>, string>
> = {
  auto: {
    ko: '자동',
    en: 'Auto',
    ja: '自動',
  },
  ko: {
    ko: '한국어',
    en: 'Korean',
    ja: '韓国語',
  },
  en: {
    ko: '영어',
    en: 'English',
    ja: '英語',
  },
  ja: {
    ko: '일본어',
    en: 'Japanese',
    ja: '日本語',
  },
};

/**
 * LanguageSelector Component
 *
 * RadioGroup을 사용하여 언어 선택 UI를 제공합니다.
 * 각 언어는 고유한 아이콘과 다국어 라벨을 가집니다.
 *
 * @example
 * ```tsx
 * <LanguageSelector
 *   value={currentLanguage}
 *   onChange={handleLanguageChange}
 *   aria-label="언어 선택"
 * />
 * ```
 */
export function LanguageSelector(props: LanguageSelectorProps): JSX.Element {
  const solid = getSolidCore();
  const { createMemo } = solid;

  /**
   * RadioGroup 옵션 생성
   * LanguageService에서 현재 언어를 가져와 적절한 라벨 표시
   */
  const options = createMemo<readonly RadioOption[]>(() => {
    const languages: SupportedLanguage[] = ['auto', 'ko', 'en', 'ja'];
    const currentLanguage: Exclude<SupportedLanguage, 'auto'> =
      languageService.getCurrentLanguage() === 'auto'
        ? languageService.detectLanguage()
        : (languageService.getCurrentLanguage() as Exclude<SupportedLanguage, 'auto'>);

    return languages.map(lang => ({
      value: lang,
      label: LANGUAGE_LABEL_MAP[lang][currentLanguage],
      iconName: LANGUAGE_ICON_MAP[lang],
    }));
  });

  /**
   * RadioGroup onChange 핸들러
   * SupportedLanguage 타입으로 onChange 콜백 호출
   */
  const handleChange = (newValue: string): void => {
    if (props.onChange && newValue !== props.value) {
      props.onChange(newValue as SupportedLanguage);
    }
  };

  return (
    <RadioGroup
      name='language-selector'
      value={props.value}
      options={options()}
      onChange={handleChange}
      disabled={props.disabled ?? false}
      orientation={props.orientation ?? 'vertical'}
      {...(props.className ? { className: props.className } : {})}
      {...(props['aria-label'] ? { 'aria-label': props['aria-label'] } : {})}
      {...(props['aria-labelledby'] ? { 'aria-labelledby': props['aria-labelledby'] } : {})}
    />
  );
}
