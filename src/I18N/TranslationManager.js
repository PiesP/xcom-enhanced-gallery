/**
 * 다국어 지원 핵심 클래스
 */
export class TranslationManager {
  constructor() {
    this.translations = {};
    this.currentLocale = 'en'; // 기본 언어 설정
    this.fallbackLocale = 'en';
  }

  /**
   * 언어 리소스 로드
   * @param {string} locale - 언어 코드
   * @param {Object} translations - 번역 객체
   */
  setTranslations(locale, translations) {
    this.translations[locale] = translations;
  }

  /**
   * 현재 언어 설정
   * @param {string} locale - 언어 코드
   */
  setLocale(locale) {
    if (this.translations[locale]) {
      this.currentLocale = locale;
    } else {
      console.warn(`Locale ${locale} not available, using ${this.fallbackLocale}`);
      this.currentLocale = this.fallbackLocale;
    }
  }

  /**
   * 번역 문자열 가져오기
   * @param {string} key - 점 표기법으로 된 키 (예: 'viewer.controls.next')
   * @param {Object} params - 대체할 변수 객체 (예: {current: 1, total: 5})
   * @returns {string} 번역된 문자열
   */
  translate(key, params = {}) {
    // 현재 언어의 번역 또는 대체 언어의 번역
    const translations = this.translations[this.currentLocale] || this.translations[this.fallbackLocale];
    
    if (!translations) {
      console.error('No translations available');
      return key;
    }

    // 점 표기법으로 객체 내부 값 찾기
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    // 번역 없을 경우 키 반환
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // 변수 대체
    return this._replaceParams(value, params);
  }

  /**
   * 문자열 내 변수 대체
   * @param {string} text - 원본 텍스트
   * @param {Object} params - 대체할 변수
   * @returns {string} 변수 대체된 텍스트
   */
  _replaceParams(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }

  /**
   * 사용자 언어 감지
   * @returns {string} 감지된 언어 코드
   */
  detectUserLocale() {
    const userLanguage = navigator.language || navigator.userLanguage;
    const baseLanguage = userLanguage.split('-')[0].toLowerCase();
    
    // 지원되는 언어면 반환, 아니면 기본 언어
    return this.translations[baseLanguage] ? baseLanguage : this.fallbackLocale;
  }
}