/**
 * @fileoverview 안정적인 DOM 선택자 상수
 * @description 트위터 UI 변경에 대응하는 다중 fallback 전략
 *
 * 트위터/X.com은 주기적으로 UI를 변경하며, 이로 인해 DOM 구조와 선택자가 변경됩니다.
 * 이 파일은 가장 안정적이고 신뢰할 수 있는 선택자들을 우선순위에 따라 정의합니다.
 *
 * 각 선택자 배열은 다음 순서로 정렬되어 있습니다:
 * 1. data-testid 기반 선택자 (가장 안정적)
 * 2. role 속성 기반 선택자
 * 3. 구조적 선택자 (최후의 수단)
 */

/**
 * 안정적인 DOM 선택자 상수
 * 트위터 UI 변경에 대응하는 다중 fallback 전략
 */
export const STABLE_SELECTORS = {
  /**
   * 트윗 컨테이너 선택자 (우선순위 순)
   *
   * 용도: 개별 트윗을 찾기 위한 선택자
   * 변경 빈도: 낮음 (트위터의 핵심 구조)
   * 최적화 영향: 높음 (전체 갤러리 성능에 직접 영향)
   */
  TWEET_CONTAINERS: [
    'article[data-testid="tweet"]', // 표준 트윗 - 가장 안정적
    'article[role="article"]', // 접근성 기반 fallback
    'div[data-testid="tweet"]', // 임베드된 트윗
    'article', // 구조적 fallback (위험)
  ],

  /**
   * 미디어 컨테이너 선택자 (다중 전략)
   *
   * 용도: 미디어 요소들을 포함하는 컨테이너 감지
   * 변경 빈도: 중간 (미디어 기능 업데이트 시)
   * 성능 고려사항: 미디어 컨테이너는 DOM 변경이 빈번함
   */
  MEDIA_CONTAINERS: [
    '[data-testid="tweetPhoto"]', // 트윗 이미지 컨테이너
    '[data-testid="videoPlayer"]', // 비디오 플레이어 컨테이너
    '[data-testid="tweetVideo"]', // 트윗 내 비디오
    '.media-container', // 일반 미디어 컨테이너
    '[role="img"]', // 접근성 기반 이미지
  ],

  /**
   * 미디어 플레이어 선택자 (다중 전략)
   *
   * 용도: 비디오/이미지 미디어 요소 감지
   * 변경 빈도: 중간 (미디어 기능 업데이트 시)
   * 성능 고려사항: 비디오 요소는 DOM 변경이 빈번함
   */
  MEDIA_PLAYERS: [
    '[data-testid="videoPlayer"]', // 비디오 플레이어 - 최우선
    '[data-testid="tweetVideo"]', // 트윗 내 비디오
    '[data-testid="tweetPhoto"]', // 트윗 내 이미지
    'video', // 표준 비디오 태그
    '.media-container video', // 컨테이너 내 비디오
    '[role="button"][aria-label*="video"]', // 접근성 기반 비디오 버튼
  ],

  /**
   * 이미지 컨테이너 선택자
   *
   * 용도: 이미지 요소 및 컨테이너 감지
   * 변경 빈도: 낮음 (이미지 표시는 안정적)
   * CDN 고려사항: twimg.com 도메인 변경 가능성 있음
   */
  IMAGE_CONTAINERS: [
    '[data-testid="tweetPhoto"]', // 트윗 이미지 - 최우선
    'a[href*="/photo/"]', // 이미지 링크
    'img[src*="pbs.twimg.com"]', // 트위터 CDN 이미지
    'img[src*="twimg.com"]', // 레거시 CDN 도메인
  ],

  /**
   * 미디어 링크 선택자
   *
   * 용도: 미디어로 이어지는 링크 감지
   * 변경 빈도: 높음 (URL 구조 변경 가능)
   * 호환성: 신규/레거시 URL 패턴 모두 지원
   */
  MEDIA_LINKS: [
    'a[href*="/status/"][href*="/photo/"]', // 이미지 상세 링크
    'a[href*="/status/"][href*="/video/"]', // 비디오 상세 링크
    'a[data-testid="tweetPhoto"]', // 테스트 ID 기반 링크
  ],

  /**
   * 액션 버튼 선택자
   *
   * 용도: 트윗의 액션 버튼들 (좋아요, 리트윗, 답글 등) 감지
   * 변경 빈도: 중간 (UI 업데이트 시 변경 가능)
   */
  ACTION_BUTTONS: {
    like: '[data-testid="like"]',
    retweet: '[data-testid="retweet"]',
    reply: '[data-testid="reply"]',
    share: '[data-testid="share"]',
    bookmark: '[data-testid="bookmark"]',
  },
} as const;
