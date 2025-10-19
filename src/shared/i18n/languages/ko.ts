import type { LanguageStrings } from '../language-types';

export const ko: LanguageStrings = {
  toolbar: {
    previous: '이전',
    next: '다음',
    download: '다운로드',
    downloadAll: 'ZIP 다운로드',
    settings: '설정',
    close: '닫기',
  },
  settings: {
    title: '설정',
    theme: '테마',
    language: '언어',
    themeAuto: '자동',
    themeLight: '라이트',
    themeDark: '다크',
    languageAuto: '자동 / Auto / 自動',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: '닫기',
    gallery: {
      sectionTitle: '갤러리',
    },
  },
  messages: {
    errorBoundary: { title: '오류 발생', body: '예기치 않은 오류가 발생했습니다: {error}' },
    keyboardHelp: {
      title: '키보드 단축키',
      navPrevious: 'ArrowLeft: 이전 미디어',
      navNext: 'ArrowRight: 다음 미디어',
      close: 'Escape: 갤러리 닫기',
      toggleHelp: '?: 이 도움말 표시',
    },
    download: {
      // NOTE: i18n literal 스캐너 예외: 리소스 테이블 내부 허용
      single: { error: { title: '다운로드 실패', body: '파일을 받을 수 없습니다: {error}' } },
      allFailed: { title: '다운로드 실패', body: '모든 항목을 다운로드하지 못했습니다.' },
      partial: { title: '일부 실패', body: '{count}개 항목을 받지 못했습니다.' },
      retry: {
        action: '재시도',
        success: { title: '재시도 성공', body: '실패했던 항목을 모두 받았습니다.' },
      },
      cancelled: { title: '다운로드 취소됨', body: '요청한 다운로드가 취소되었습니다.' },
    },
    gallery: {
      emptyTitle: '미디어가 없습니다',
      emptyDescription: '표시할 이미지나 비디오가 없습니다.',
      failedToLoadImage: '{type} 로드에 실패했습니다',
    },
  },
};

export default ko;
