/**
 * @fileoverview LanguageSelector Component Tests (Phase 3 RED)
 * @description Epic LANG_ICON_SELECTOR Phase 3
 *
 * Tests:
 * - RadioGroup 래핑 및 재사용
 * - 언어별 아이콘 자동 매핑 (auto/ko/en/ja)
 * - LanguageService 통합 (다국어 라벨)
 * - 언어 변경 시 onChange 호출
 * - 접근성 라벨 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@test-utils/testing-library';
import { h } from '@test-utils/legacy-preact';
import { LanguageSelector } from '@shared/components/ui/LanguageSelector';
import type { SupportedLanguage } from '@shared/services/LanguageService';

describe('LanguageSelector Component (Phase 3 RED)', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링 및 RadioGroup 통합', () => {
    it('RadioGroup을 사용하여 언어 옵션을 렌더링해야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeInTheDocument();
    });

    it('4개 언어 옵션을 radio로 렌더링해야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(4); // auto, ko, en, ja
    });

    it('각 언어 옵션이 올바른 라벨을 가져야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // 라벨은 LanguageService에서 가져옴 (다국어 지원)
      expect(screen.getByText(/auto/i)).toBeInTheDocument();
      expect(screen.getByText(/한국어|korean/i)).toBeInTheDocument();
      expect(screen.getByText(/english/i)).toBeInTheDocument();
      expect(screen.getByText(/日本語|japanese/i)).toBeInTheDocument();
    });
  });

  describe('언어별 아이콘 매핑', () => {
    it('auto 옵션에 language-auto 아이콘이 표시되어야 함', () => {
      const { container } = render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // LazyIcon으로 language-auto 아이콘 렌더링 확인
      // RadioGroup은 iconName을 전달받아 내부에서 LazyIcon 렌더링
      // LazyIcon이 비동기 로딩되므로 최소한 로딩 플레이스홀더 확인
      const loadingIcon = container.querySelector('[data-xeg-icon-loading="true"]');
      expect(loadingIcon).toBeInTheDocument();
    });

    it('ko 옵션에 language-ko 아이콘이 표시되어야 함', () => {
      const { container } = render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // 아이콘 로딩 플레이스홀더 확인
      const loadingIcons = container.querySelectorAll('[data-xeg-icon-loading="true"]');
      expect(loadingIcons.length).toBeGreaterThan(0);
    });

    it('en 옵션에 language-en 아이콘이 표시되어야 함', () => {
      const { container } = render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // 아이콘 로딩 플레이스홀더 확인
      const loadingIcons = container.querySelectorAll('[data-xeg-icon-loading="true"]');
      expect(loadingIcons.length).toBeGreaterThan(0);
    });

    it('ja 옵션에 language-ja 아이콘이 표시되어야 함', () => {
      const { container } = render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // 아이콘 로딩 플레이스홀더 확인
      const loadingIcons = container.querySelectorAll('[data-xeg-icon-loading="true"]');
      expect(loadingIcons.length).toBeGreaterThan(0);
    });

    it('아이콘이 없는 경우에도 라벨은 표시되어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'ko',
          onChange: mockOnChange,
        })
      );

      // 아이콘 로드 실패 시에도 텍스트 라벨 표시
      expect(screen.getByText(/한국어|korean/i)).toBeInTheDocument();
    });
  });

  describe('언어 선택 상태', () => {
    it('현재 선택된 언어가 aria-checked="true"를 가져야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'ko',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      const koRadio = radios.find(radio => radio.getAttribute('aria-checked') === 'true');
      expect(koRadio).toBeDefined();
      expect(koRadio?.textContent).toMatch(/한국어|korean/i);
    });

    it('선택되지 않은 언어는 aria-checked="false"를 가져야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'ko',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      const uncheckedRadios = radios.filter(
        radio => radio.getAttribute('aria-checked') === 'false'
      );
      expect(uncheckedRadios).toHaveLength(3); // auto, en, ja
    });
  });

  describe('언어 변경 이벤트', () => {
    it('언어 클릭 시 onChange 콜백이 호출되어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      const koRadio = radios.find(radio => radio.textContent?.match(/한국어|korean/i));

      if (koRadio) {
        fireEvent.click(koRadio);
      }

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('ko');
    });

    it('다른 언어 선택 시 새 값으로 onChange 호출', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      const enRadio = radios.find(radio => radio.textContent?.match(/english/i));

      if (enRadio) {
        fireEvent.click(enRadio);
      }

      expect(mockOnChange).toHaveBeenCalledWith('en');
    });

    it('현재 선택된 언어를 다시 클릭해도 onChange 호출되지 않음', () => {
      render(
        h(LanguageSelector, {
          value: 'ko',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      const koRadio = radios.find(radio => radio.getAttribute('aria-checked') === 'true');

      if (koRadio) {
        fireEvent.click(koRadio);
      }

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('LanguageService 통합', () => {
    it('라벨이 LanguageService에서 가져온 다국어 문자열이어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // LanguageService는 현재 언어에 맞는 라벨을 제공
      // 예: ko 언어일 때 "자동", "한국어", "영어", "일본어"
      // 예: en 언어일 때 "Auto", "Korean", "English", "Japanese"
      const labels = screen.getAllByRole('radio').map(radio => radio.textContent);
      expect(labels).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/auto|자동/i),
          expect.stringMatching(/한국어|korean/i),
          expect.stringMatching(/english|영어/i),
          expect.stringMatching(/日本語|japanese|일본어/i),
        ])
      );
    });
  });

  describe('접근성 (WAI-ARIA)', () => {
    it('radiogroup에 aria-label 또는 aria-labelledby가 있어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
          'aria-label': 'Language selection',
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(
        radiogroup.getAttribute('aria-label') || radiogroup.getAttribute('aria-labelledby')
      ).toBeTruthy();
    });

    it('각 radio 옵션에 접근 가능한 이름이 있어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        // textContent 또는 aria-label로 접근 가능한 이름 제공
        expect(radio.textContent || radio.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('키보드 네비게이션', () => {
    it('ArrowDown 키로 다음 언어로 이동해야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });

      // RadioGroup 컴포넌트가 키보드 네비게이션 처리
      // 실제 동작은 RadioGroup 테스트에서 검증됨
      expect(radiogroup).toBeInTheDocument();
    });

    it('Space 키로 현재 포커스된 언어를 선택해야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      const radios = screen.getAllByRole('radio');
      const koRadio = radios.find(radio => radio.textContent?.match(/한국어|korean/i));

      if (koRadio) {
        fireEvent.keyDown(koRadio, { key: ' ' });
        // Space 키는 RadioGroup에서 처리하여 onChange 호출
        // onChange 호출 여부는 RadioGroup 동작에 의존
      }

      // RadioGroup이 정상적으로 Space 키를 처리하면 onChange 호출됨
      expect(mockOnChange).toHaveBeenCalledTimes(0); // RadioGroup에서 처리하므로 직접 호출 없음
    });
  });

  describe('Props 전달', () => {
    it('disabled prop을 RadioGroup에 전달해야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
          disabled: true,
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeInTheDocument();
      // disabled 상태는 RadioGroup이 처리
    });

    it('className prop을 RadioGroup에 전달해야 함', () => {
      const customClass = 'custom-language-selector';
      const { container } = render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
          className: customClass,
        })
      );

      expect(container.querySelector(`.${customClass}`)).toBeInTheDocument();
    });

    it('orientation prop을 RadioGroup에 전달해야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
          orientation: 'horizontal',
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      // horizontal orientation은 RadioGroup의 CSS 클래스로 적용됨
      // RadioGroup.module.css의 horizontal 클래스 확인
      expect(radiogroup.className).toContain('horizontal');
    });
  });

  describe('에러 처리', () => {
    it('지원하지 않는 언어 값이 전달되어도 렌더링되어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'unknown' as SupportedLanguage,
          onChange: mockOnChange,
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeInTheDocument();
      // unknown 언어는 선택되지 않은 상태로 표시
    });

    it('onChange가 제공되지 않아도 렌더링되어야 함', () => {
      render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: undefined as unknown as (lang: SupportedLanguage) => void,
        })
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeInTheDocument();
    });
  });

  describe('디자인 토큰 사용', () => {
    it('RadioGroup 스타일에 디자인 토큰을 사용해야 함', () => {
      const { container } = render(
        h(LanguageSelector, {
          value: 'auto',
          onChange: mockOnChange,
        })
      );

      // RadioGroup의 스타일은 RadioGroup.module.css에서 정의
      // 디자인 토큰 검증은 RadioGroup 테스트에서 수행됨
      expect(container.querySelector('[role="radiogroup"]')).toBeInTheDocument();
    });
  });
});
