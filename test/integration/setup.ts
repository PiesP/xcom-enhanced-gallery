import '@testing-library/jest-dom/vitest';

/**
 * 통합 테스트 설정 및 초기화
 *
 * @description 통합 테스트 실행을 위한 환경 설정과 공통 유틸리티를 제공합니다.
 * 갤러리 컴포넌트 간의 상호작용을 테스트하기 위한 DOM 환경을 준비합니다.
 */

/**
 * 테스트용 미디어 데이터 생성
 */
export function createTestMediaData() {
  const mediaType = 'image' as const;
  return {
    url: 'https://pbs.twimg.com/media/test.jpg',
    type: mediaType,
    originalUrl: 'https://pbs.twimg.com/media/test.jpg?name=orig',
    thumbnailUrl: 'https://pbs.twimg.com/media/test.jpg?name=small',
    filename: 'test.jpg',
    width: 1200,
    height: 800,
  };
}

/**
 * DOM 업데이트 대기
 */
export function waitForDOMUpdate(timeout = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * 테스트 환경을 위한 DOM 초기화
 */
export function setupTestEnvironment() {
  const galleryRoot = document.createElement('div');
  galleryRoot.id = 'xeg-gallery-root';
  galleryRoot.style.left = '0';
  galleryRoot.style.width = '100%';
  galleryRoot.style.height = '100%';
  document.body.appendChild(galleryRoot);
  return galleryRoot;
}

/**
 * 테스트 후 환경 정리
 */
export function cleanupTestEnvironment() {
  const galleryRoot = document.getElementById('xeg-gallery-root');
  if (galleryRoot) {
    galleryRoot.remove();
  }
}

/**
 * 모킹된 미디어 크롤러 함수
 */
export function mockExtractMediaFromCurrentTweet() {
  return [createTestMediaData()];
}

/**
 * 모킹된 갤러리 초기화 함수
 */
export function mockInitializeGallery() {
  return Promise.resolve();
}
