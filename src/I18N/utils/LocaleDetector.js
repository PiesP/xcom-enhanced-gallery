/**
 * 사용자의 브라우저 언어 설정을 감지하는 유틸리티
 */
export class LocaleDetector {
  /**
   * 사용자의 브라우저 언어 설정 감지
   * @param {Array} supportedLocales - 지원되는 언어 코드 배열
   * @param {string} fallbackLocale - 기본 언어 코드
   * @returns {string} 감지된 언어 코드
   */
  static detectUserLocale(supportedLocales, fallbackLocale = 'en') {
    try {
      const userLanguage = navigator.language || navigator.userLanguage;
      
      if (!userLanguage) return fallbackLocale;
      
      // 전체 언어 코드 확인 (예: ko-KR)
      if (supportedLocales.includes(userLanguage)) {
        return userLanguage;
      }
      
      // 기본 언어 코드만 확인 (예: ko)
      const baseLanguage = userLanguage.split('-')[0].toLowerCase();
      if (supportedLocales.includes(baseLanguage)) {
        return baseLanguage;
      }
      
      // 지원되지 않는 언어인 경우 기본 언어 반환
      return fallbackLocale;
    } catch (e) {
      console.error('Error detecting user locale:', e);
      return fallbackLocale;
    }
  }
  
  /**
   * 로컬 스토리지에서 저장된 언어 설정 가져오기
   * @param {string} key - 로컬 스토리지 키
   * @param {string} fallbackLocale - 기본 언어 코드
   * @returns {string} 저장된 언어 코드 또는 기본값
   */
  static getSavedLocale(key = 'xcom-gallery-locale', fallbackLocale = 'en') {
    try {
      const savedLocale = localStorage.getItem(key);
      return savedLocale || fallbackLocale;
    } catch (e) {
      console.error('Error getting saved locale:', e);
      return fallbackLocale;
    }
  }
  
  /**
   * 언어 설정을 로컬 스토리지에 저장
   * @param {string} locale - 언어 코드
   * @param {string} key - 로컬 스토리지 키
   */
  static saveLocale(locale, key = 'xcom-gallery-locale') {
    try {
      localStorage.setItem(key, locale);
    } catch (e) {
      console.error('Error saving locale:', e);
    }
  }
}