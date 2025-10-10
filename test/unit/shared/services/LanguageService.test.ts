/**
 * @fileoverview LanguageService 테스트
 * @description TDD 기반 다국어 지원 서비스 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LanguageService } from '../../../../src/shared/services/LanguageService';
import { createMockBrowserInfo } from '../../../utils/fixtures/test-factories';

describe('LanguageService', () => {
  let languageService: LanguageService;
  type MutableNavigator = ReturnType<typeof createMockBrowserInfo>;

  let mockNavigator: MutableNavigator;

  beforeEach(() => {
    // Navigator mock 설정
    mockNavigator = createMockBrowserInfo('chrome', { language: 'ko-KR' });
    vi.stubGlobal('navigator', mockNavigator);

    languageService = new LanguageService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('초기화 시 자동 언어가 기본값으로 설정되어야 함', () => {
      expect(languageService.getCurrentLanguage()).toBe('auto');
    });

    it('초기화 시 브라우저 언어를 감지할 수 있어야 함', () => {
      const detected = languageService.detectLanguage();
      expect(detected).toBe('ko');
    });
  });

  describe('language detection', () => {
    it('한국어 브라우저에서 "ko"를 감지해야 함', () => {
      mockNavigator.language = 'ko-KR';
      const detected = languageService.detectLanguage();
      expect(detected).toBe('ko');
    });

    it('영어 브라우저에서 "en"을 감지해야 함', () => {
      mockNavigator.language = 'en-US';
      const detected = languageService.detectLanguage();
      expect(detected).toBe('en');
    });

    it('일본어 브라우저에서 "ja"를 감지해야 함', () => {
      mockNavigator.language = 'ja-JP';
      const detected = languageService.detectLanguage();
      expect(detected).toBe('ja');
    });

    it('지원하지 않는 언어에서 "en"으로 fallback해야 함', () => {
      mockNavigator.language = 'fr-FR';
      const detected = languageService.detectLanguage();
      expect(detected).toBe('en');
    });
  });

  describe('language setting', () => {
    it('언어 설정이 올바르게 저장되어야 함', () => {
      languageService.setLanguage('ko');
      expect(languageService.getCurrentLanguage()).toBe('ko');
    });

    it('지원하지 않는 언어 코드 시 "en"으로 fallback해야 함', () => {
      languageService.setLanguage('invalid' as any);
      expect(languageService.getCurrentLanguage()).toBe('en');
    });

    it('auto 설정 시 올바르게 저장되어야 함', () => {
      languageService.setLanguage('auto');
      expect(languageService.getCurrentLanguage()).toBe('auto');
    });
  });

  describe('string translation', () => {
    it('한국어 문자열을 올바르게 반환해야 함', () => {
      languageService.setLanguage('ko');
      const result = languageService.getString('toolbar.previous');
      expect(result).toBe('이전');
    });

    it('영어 문자열을 올바르게 반환해야 함', () => {
      languageService.setLanguage('en');
      const result = languageService.getString('toolbar.previous');
      expect(result).toBe('Previous');
    });

    it('일본어 문자열을 올바르게 반환해야 함', () => {
      languageService.setLanguage('ja');
      const result = languageService.getString('toolbar.previous');
      expect(result).toBe('前へ');
    });

    it('존재하지 않는 키에 대해 키 자체를 반환해야 함', () => {
      languageService.setLanguage('ko');
      const result = languageService.getString('non.existent.key');
      expect(result).toBe('non.existent.key');
    });

    it('auto 언어 설정 시 감지된 언어의 문자열을 반환해야 함', () => {
      mockNavigator.language = 'ko-KR';
      languageService.setLanguage('auto');
      const result = languageService.getString('toolbar.previous');
      expect(result).toBe('이전');
    });
  });

  describe('event system', () => {
    it('언어 변경 시 리스너가 호출되어야 함', () => {
      const mockListener = vi.fn();
      languageService.onLanguageChange(mockListener);

      languageService.setLanguage('ko');

      expect(mockListener).toHaveBeenCalledWith('ko');
    });

    it('여러 리스너가 모두 호출되어야 함', () => {
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();

      languageService.onLanguageChange(mockListener1);
      languageService.onLanguageChange(mockListener2);

      languageService.setLanguage('en');

      expect(mockListener1).toHaveBeenCalledWith('en');
      expect(mockListener2).toHaveBeenCalledWith('en');
    });

    it('구독 해제 함수가 올바르게 작동해야 함', () => {
      const mockListener = vi.fn();
      const unsubscribe = languageService.onLanguageChange(mockListener);

      unsubscribe();
      languageService.setLanguage('ja');

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('nested key access', () => {
    it('중첩된 키에 접근할 수 있어야 함', () => {
      languageService.setLanguage('ko');
      const result = languageService.getString('settings.title');
      expect(result).toBe('설정');
    });

    it('깊게 중첩된 키에 접근할 수 있어야 함', () => {
      languageService.setLanguage('en');
      const result = languageService.getString('settings.themeAuto');
      expect(result).toBe('Auto');
    });
  });
});
