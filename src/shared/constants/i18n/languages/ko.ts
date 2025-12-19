import type { LanguageStrings } from '@shared/constants/i18n/language-types';

export const ko: LanguageStrings = {
  toolbar: {
    previous: '이전',
    previousWithShortcut: '이전 (왼쪽 화살표)',
    next: '다음',
    nextWithShortcut: '다음 (오른쪽 화살표)',
    download: '다운로드',
    downloadCurrentWithShortcut: '현재 파일 다운로드',
    downloadAll: 'ZIP 다운로드',
    downloadAllWithCount: '모든 {count}개 파일을 ZIP으로 다운로드',
    settings: '설정',
    openSettings: '설정 열기',
    close: '닫기',
    closeWithShortcut: '닫기 (Esc)',
    tweetText: '트윗 텍스트',
    tweetTextPanel: '트윗 텍스트 패널',
    fitOriginal: '원본',
    fitOriginalTitle: '원본 크기 (1:1)',
    fitWidth: '너비 맞춤',
    fitWidthTitle: '너비에 맞춤',
    fitHeight: '높이 맞춤',
    fitHeightTitle: '높이에 맞춤',
    fitContainer: '창 맞춤',
    fitContainerTitle: '창에 맞춤',
  },
  settings: {
    title: '설정',
    theme: '테마',
    language: '언어',
    themeAuto: '자동',
    themeLight: '라이트',
    themeDark: '다크',
    languageAuto: 'Auto / 자동 / 自動',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: '닫기',
    gallery: {
      sectionTitle: '갤러리',
    },
  },
  messages: {
    errorBoundary: {
      title: '오류가 발생했습니다',
      body: '예상치 못한 오류가 발생했습니다: {error}',
    },
    keyboardHelp: {
      title: '키보드 단축키',
      navPrevious: 'ArrowLeft: 이전 미디어',
      navNext: 'ArrowRight: 다음 미디어',
      close: 'Escape: 갤러리 닫기',
      toggleHelp: '?: 이 도움말 표시',
    },
    download: {
      single: {
        error: {
          title: '다운로드 실패',
          body: '파일을 가져올 수 없습니다: {error}',
        },
      },
      allFailed: {
        title: '다운로드 실패',
        body: '모든 항목을 다운로드할 수 없었습니다.',
      },
      partial: {
        title: '일부 실패',
        body: '{count}개 항목을 가져올 수 없었습니다.',
      },
      retry: {
        action: '다시 시도',
        success: {
          title: '다시 시도 성공',
          body: '실패했던 모든 항목을 가져왔습니다.',
        },
      },
      cancelled: {
        title: '다운로드가 취소되었습니다',
        body: '요청한 다운로드가 취소되었습니다.',
      },
    },
    gallery: {
      emptyTitle: '미디어 없음',
      emptyDescription: '표시할 이미지 또는 동영상이 없습니다.',
      mediaItemLabel: '미디어 {index}: {filename}',
      failedToLoadImage: '{type} 로드 실패',
    },
  },
};
