/**
 * Twitter(X.com) DOM 구조 모의 구현
 * 실제 X.com 페이지의 HTML 구조를 모방하여 테스트 환경에서 사용
 */

// mock-action-simulator에서 함수들을 import
import { simulateClick, simulateKeypress } from '../utils/helpers/mock-action-simulator.js';

// 다시 export해서 다른 테스트에서 사용할 수 있도록 함
export { simulateClick, simulateKeypress };

// ================================
// Twitter DOM 템플릿들
// ================================

/**
 * 기본 Twitter 페이지 구조
 */
export const TWITTER_BASE_DOM = `
  <div id="react-root">
    <div dir="ltr">
      <div class="css-1dbjc4n r-13qz1uu r-417010">
        <main role="main" class="css-1dbjc4n r-1habvwh r-13qz1uu">
          <div class="css-1dbjc4n r-1jgb5lz r-1ye8kvj r-13qz1uu">
            <!-- 트윗 컨테이너가 여기에 들어감 -->
          </div>
        </main>
      </div>
    </div>
  </div>
`;

/**
 * 이미지가 포함된 트윗 DOM 구조
 */
export const TWEET_WITH_IMAGES_DOM = `
  <article data-testid="tweet" role="article" tabindex="-1"
           class="css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1j3t67a r-o7ynqc r-6416eg r-13qz1uu">
    <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu">
      <div class="css-1dbjc4n r-1awozwy r-18u37iz r-1h0z5md">
        <!-- 프로필 영역 -->
        <div class="css-1dbjc4n r-1wbh5a2 r-dnmrzs">
          <a href="/username" role="link" tabindex="-1">
            <img src="https://pbs.twimg.com/profile_images/123/avatar.jpg"
                 class="css-9pa8cd" draggable="true" alt="Profile">
          </a>
        </div>

        <!-- 트윗 내용 -->
        <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-1h8ys4a">
          <div class="css-1dbjc4n r-zl2h9q">
            <div class="css-1dbjc4n r-k4xj1c r-18u37iz r-1wtj0ep">
              <div class="css-1dbjc4n r-1s2bzr4">
                <div class="css-1dbjc4n r-16y2uox r-1wbh5a2 r-1777fci">
                  <span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">
                    Test tweet content with images
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 미디어 컨테이너 -->
          <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af">
            <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af"
                 style="padding-bottom: 56.25%;">
              <div class="css-1dbjc4n r-1niwhzg r-vvn7in" style="position: absolute;">
                <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af">
                  <img src="https://pbs.twimg.com/media/test1.jpg"
                       alt="Image 1"
                       draggable="true"
                       class="css-9pa8cd">
                </div>
                <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af">
                  <img src="https://pbs.twimg.com/media/test2.jpg"
                       alt="Image 2"
                       draggable="true"
                       class="css-9pa8cd">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
`;

/**
 * 비디오가 포함된 트윗 DOM 구조
 */
export const TWEET_WITH_VIDEO_DOM = `
  <article data-testid="tweet" role="article" tabindex="-1"
           class="css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1j3t67a r-o7ynqc r-6416eg r-13qz1uu">
    <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu">
      <div class="css-1dbjc4n r-1awozwy r-18u37iz r-1h0z5md">
        <!-- 트윗 내용 -->
        <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-1h8ys4a">
          <div class="css-1dbjc4n r-zl2h9q">
            <span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">
              Test tweet with video
            </span>
          </div>

          <!-- 비디오 컨테이너 -->
          <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af">
            <div class="css-1dbjc4n" data-testid="videoPlayer">
              <video src="https://video.twimg.com/ext_tw_video/test.mp4"
                     poster="https://pbs.twimg.com/ext_tw_video_thumb/test.jpg"
                     preload="none"
                     class="css-1dbjc4n"
                     style="object-fit: cover;">
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
`;

/**
 * GIF가 포함된 트윗 DOM 구조
 */
export const TWEET_WITH_GIF_DOM = `
  <article data-testid="tweet" role="article" tabindex="-1">
    <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu">
      <div class="css-1dbjc4n r-1awozwy r-18u37iz r-1h0z5md">
        <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-1h8ys4a">
          <!-- GIF 컨테이너 -->
          <div class="css-1dbjc4n r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af">
            <div class="css-1dbjc4n" data-testid="gif">
              <video src="https://video.twimg.com/tweet_video/test.mp4"
                     poster="https://pbs.twimg.com/tweet_video_thumb/test.jpg"
                     loop
                     autoplay
                     muted
                     class="css-1dbjc4n">
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
`;

/**
 * 갤러리 모달 DOM 구조
 */
export const GALLERY_MODAL_DOM = `
  <div id="layers">
    <div class="css-1dbjc4n r-1p0dtai r-1d2f490 r-1xcajam r-zchlnj">
      <div class="css-1dbjc4n r-1awozwy r-1p0dtai r-6koalj r-18u37iz"
           role="dialog" aria-modal="true" data-testid="photoModal">
        <div class="css-1dbjc4n r-1kqtdi0 r-1867qdf r-1phboty r-rs99b7 r-1ifxtd0">
          <img src="https://pbs.twimg.com/media/large_image.jpg"
               alt="Gallery image"
               class="css-9pa8cd"
               style="object-fit: contain;">
        </div>

        <!-- 갤러리 네비게이션 -->
        <div class="css-1dbjc4n r-1awozwy r-1p0dtai">
          <button aria-label="Previous photo" class="css-18t94o4 css-1dbjc4n">
            <div class="css-901oao r-1awozwy">‹</div>
          </button>
          <button aria-label="Next photo" class="css-18t94o4 css-1dbjc4n">
            <div class="css-901oao r-1awozwy">›</div>
          </button>
        </div>
      </div>
    </div>
  </div>
`;

// ================================
// DOM 설정 헬퍼 함수들
// ================================

/**
 * 기본 Twitter DOM 구조를 설정 (선택적)
 * DOM 환경이 없으면 조용히 반환
 */
export function setupTwitterDOM() {
  const doc = globalThis.document;
  if (!doc || !doc.body || typeof doc.querySelector !== 'function') {
    // DOM 환경이 없으면 조용히 반환 (서버 환경 테스트 시)
    return null;
  }

  doc.body.innerHTML = TWITTER_BASE_DOM;

  // 트윗 컨테이너 찾기
  const container = doc.querySelector('main .css-1dbjc4n.r-1jgb5lz');
  if (!container) {
    // 트윗 컨테이너를 찾을 수 없을 때도 조용히 처리
    return null;
  }

  return container;
}

/**
 * 이미지 트윗을 DOM에 추가
 */
export function addTweetWithImages(container, tweetId = 'tweet-1') {
  const doc = globalThis.document;
  const tweetElement = doc.createElement('div');
  tweetElement.innerHTML = TWEET_WITH_IMAGES_DOM;
  tweetElement.setAttribute('data-tweet-id', tweetId);

  container.appendChild(tweetElement);
  return tweetElement;
}

/**
 * 비디오 트윗을 DOM에 추가
 */
export function addTweetWithVideo(container, tweetId = 'tweet-video-1') {
  const doc = globalThis.document;
  const tweetElement = doc.createElement('div');
  tweetElement.innerHTML = TWEET_WITH_VIDEO_DOM;
  tweetElement.setAttribute('data-tweet-id', tweetId);

  container.appendChild(tweetElement);
  return tweetElement;
}

/**
 * GIF 트윗을 DOM에 추가
 */
export function addTweetWithGIF(container, tweetId = 'tweet-gif-1') {
  const doc = globalThis.document;
  const tweetElement = doc.createElement('div');
  tweetElement.innerHTML = TWEET_WITH_GIF_DOM;
  tweetElement.setAttribute('data-tweet-id', tweetId);

  container.appendChild(tweetElement);
  return tweetElement;
}

/**
 * 갤러리 모달을 DOM에 추가
 */
export function addGalleryModal() {
  const doc = globalThis.document;
  const modalElement = doc.createElement('div');
  modalElement.innerHTML = GALLERY_MODAL_DOM;

  doc.body.appendChild(modalElement);
  return modalElement;
}

/**
 * DOM을 완전히 정리
 */
/**
 * Twitter DOM 구조 완전 정리
 */
export function clearTwitterDOM() {
  const doc = globalThis.document;
  if (doc && doc.body) {
    doc.body.innerHTML = '';
  }
}

/**
 * 특정 요소에 데이터 속성 추가 (트윗 ID, 미디어 URL 등)
 */
export function addDataAttributes(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(`data-${key}`, value);
  });
}

/**
 * 테스트용 이벤트 트리거
 */
export function triggerEvent(element, eventType, eventData) {
  const event = new globalThis.Event(eventType, { bubbles: true, cancelable: true });
  if (eventData) {
    Object.assign(event, eventData);
  }
  element.dispatchEvent(event);
}

/**
 * 마우스 클릭 이벤트 시뮬레이션
 */
/**
 * 트윗 이미지 클릭 시뮬레이션
 */
export function simulateTweetImageClick() {
  const doc = globalThis.document;
  doc.addEventListener('click', event => {
    const target = event.target;
    if (target && target.tagName === 'IMG' && target.src.includes('pbs.twimg.com')) {
      const galleryModal = createGalleryModal(target.src);
      return galleryModal;
    }
  });
}

/**
 * 대량 다운로드 모드 생성 함수 (통합 테스트용)
 */
export function createBulkDownloadMode() {
  const existingUI = globalThis.document.querySelector('[data-testid="bulk-download-mode"]');
  if (existingUI) {
    existingUI.remove();
  }

  const bulkUI = globalThis.document.createElement('div');
  bulkUI.setAttribute('data-testid', 'bulk-download-mode');
  bulkUI.innerHTML = `
    <div class="bulk-download-toolbar">
      <button data-testid="select-all">모두 선택</button>
      <button data-testid="download-selected">선택한 항목 다운로드</button>
      <button data-testid="download-all-btn">모두 다운로드</button>
    </div>
  `;

  globalThis.document.body.appendChild(bulkUI);
  return bulkUI;
}

/**
 * 다운로드 진행률 생성 함수 (통합 테스트용)
 */
export function createDownloadProgress(percentage = 0) {
  const existingProgress = globalThis.document.querySelector('[data-testid="download-progress"]');
  if (existingProgress) {
    existingProgress.remove();
  }

  const progressElement = globalThis.document.createElement('div');
  progressElement.setAttribute('data-testid', 'download-progress');
  progressElement.textContent = `${percentage}%`;
  progressElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px;
    background: #1da1f2;
    color: white;
    border-radius: 4px;
  `;

  globalThis.document.body.appendChild(progressElement);
  return progressElement;
}

/**
 * 갤러리 모달 생성 함수 (통합 테스트용)
 * 환경 격리 원칙에 따라 안전한 DOM 조작 보장
 */
export function createGalleryModal(
  mediaUrl = 'https://pbs.twimg.com/media/test.jpg',
  isVideo = false
) {
  const existingModal = globalThis.document.querySelector('[data-testid="photoModal"]');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = globalThis.document.createElement('div');
  modal.setAttribute('data-testid', 'photoModal');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', '이미지 갤러리');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const mediaElement = globalThis.document.createElement(isVideo ? 'video' : 'img');
  mediaElement.src = mediaUrl;
  mediaElement.alt = '갤러리 이미지';
  mediaElement.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;';

  if (isVideo) {
    mediaElement.controls = true;
  }

  modal.appendChild(mediaElement);
  globalThis.document.body.appendChild(modal);
  return modal;
}

/**
 * 이미지 클릭 이벤트 핸들러 등록 (행위 중심 테스트)
 */
export function setupImageClickHandlers() {
  const doc = globalThis.document;
  doc.addEventListener('click', event => {
    const target = event.target;

    // 트위터 이미지 클릭 처리
    if (target.tagName === 'IMG' && target.src && target.src.includes('pbs.twimg.com')) {
      // Ctrl+클릭 시 대량 다운로드 모드
      if (event.ctrlKey) {
        createBulkDownloadMode();
      } else {
        // 일반 클릭 시 갤러리 모달
        createGalleryModal(target.src);
      }
    }

    // 다운로드 버튼 클릭 처리
    if (target.getAttribute('data-testid') === 'download-all-btn') {
      // 진행률 표시 생성
      createDownloadProgress();
    }
  });

  // 키보드 이벤트 핸들러
  doc.addEventListener('keydown', event => {
    const modal = doc.querySelector('[data-testid="photoModal"]');

    if (event.key === 'Escape' && modal) {
      // ESC키로 모달 닫기
      modal.remove();
    }

    if (event.key === 'd' && modal) {
      // D키로 다운로드 (실제 다운로드는 mock에서 처리)
      createDownloadProgress();
    }
  });
}
