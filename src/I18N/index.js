import { TranslationManager } from './TranslationManager.js';
import { LocaleDetector } from './utils/LocaleDetector.js';
import { StringFormatter } from './utils/StringFormatter.js';

// 번역 매니저 인스턴스 생성
const i18n = new TranslationManager();

// 지원 언어 목록 - 새로운 언어 추가
const SUPPORTED_LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'es', 'fr'];

// 언어 감지 및 설정
const initI18N = async () => {
  try {
    // JSON 파일 로드 (빌드 스크립트에서 실제 데이터로 대체됨)
    for (const locale of SUPPORTED_LOCALES) {
      try {
        const translations = await loadLocaleFile(locale);
        i18n.setTranslations(locale, translations);
      } catch (e) {
        console.error(`Failed to load locale: ${locale}`, e);
      }
    }

    // 저장된 언어 설정 확인
    let userLocale = LocaleDetector.getSavedLocale();
    
    // 저장된 설정이 없으면 브라우저 언어 감지
    if (!SUPPORTED_LOCALES.includes(userLocale)) {
      userLocale = LocaleDetector.detectUserLocale(SUPPORTED_LOCALES);
      if (userLocale) {
        LocaleDetector.saveLocale(userLocale);
      }
    }
    
    // 언어 설정
    i18n.setLocale(userLocale);
    
    console.log(`Initialized i18n with locale: ${userLocale}`);
  } catch (e) {
    console.error('Failed to initialize i18n:', e);
  }
};

/**
 * 번역 함수
 * @param {string} key - 번역 키 (점 표기법, 예: 'viewer.controls.next')
 * @param {...any} params - 대체할 변수들
 * @returns {string} 번역된 문자열
 */
export const translate = (key, ...params) => {
  // 파라미터가 객체인 경우와 순서대로 값만 넘긴 경우 모두 지원
  if (params.length === 1 && typeof params[0] === 'object') {
    return i18n.translate(key, params[0]);
  } else if (params.length > 0) {
    // 순서대로 값만 넘긴 경우, 파라미터 객체 생성
    const paramObj = {};
    params.forEach((value, index) => {
      // 1부터 시작하는 숫자 키 사용하거나, 특정 패턴에 따라 키 이름 생성
      paramObj[index + 1] = value;
    });
    return i18n.translate(key, paramObj);
  }
  return i18n.translate(key);
};

/**
 * 로케일 변경 함수
 * @param {string} locale - 변경할 언어 코드
 */
export const setLocale = (locale) => {
  if (SUPPORTED_LOCALES.includes(locale)) {
    i18n.setLocale(locale);
    LocaleDetector.saveLocale(locale);
    return true;
  }
  return false;
};

/**
 * 현재 로케일 가져오기
 * @returns {string} 현재 설정된 언어 코드
 */
export const getLocale = () => {
  return i18n.currentLocale;
};

/**
 * 지원 언어 목록 가져오기
 * @returns {Array} 지원되는 언어 코드 배열
 */
export const getSupportedLocales = () => {
  return [...SUPPORTED_LOCALES];
};

/**
 * JSON 파일 로드 함수 (빌드 프로세스에서 실제 구현으로 대체됨)
 * @param {string} locale - 로드할 언어 코드
 * @returns {Object} 번역 데이터 객체
 */
const loadLocaleFile = async (locale) => {
  // 빌드 프로세스에서 이 부분은 실제 JSON 내용으로 대체됨
  return {}; // 실제 구현은 빌드 스크립트에서 처리
};

// 초기화 수행
initI18N();

export default {
  translate,
  setLocale,
  getLocale,
  getSupportedLocales
};