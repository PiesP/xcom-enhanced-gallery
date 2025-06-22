/**
 * 전역 스타일 초기화 모듈
 *
 * 모든 전역 CSS 파일을 중앙집중식으로 관리
 */

// Auto theme 시스템
import '@assets/styles/auto-theme.css';

// 갤러리 전역 스타일
import '@features/gallery/styles/gallery-global.css';

// 컴포넌트별 전역 스타일
import '@assets/styles/video-trigger.css';

// 메인 전역 스타일 (변수 포함, 반드시 마지막에 import)
import '@assets/styles/globals.css';

/**
 * 전역 스타일 관련 추가 초기화 로직
 */
export function initializeGlobalStyles(): void {
  // 다크모드 감지
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // 시스템 테마 변경 감지
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });
}

// 자동 초기화
initializeGlobalStyles();
