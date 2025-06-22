/**
 * @fileoverview Tweet Extraction Strategy Interface
 * @description 트윗 정보 추출 전략의 공통 인터페이스 정의
 */

export interface TweetInfo {
  username: string;
  tweetId: string;
  tweetUrl: string;
  /** @deprecated Use tweetUrl instead */
  url?: string | undefined;
  /** 추출 방법 정보 */
  extractionMethod?: string | undefined;
  /** 미디어 타입 */
  mediaType?: 'photo' | 'video' | undefined;
  /** 미디어 인덱스 */
  mediaIndex?: number | undefined;
}

/**
 * 부분적 트윗 정보 (추출 과정에서 사용)
 */
export interface PartialTweetInfo {
  username?: string | undefined;
  tweetId?: string | undefined;
  tweetUrl?: string | undefined;
  url?: string | undefined;
  extractionMethod?: string | undefined;
  mediaType?: 'photo' | 'video' | undefined;
  mediaIndex?: number | undefined;
}

/**
 * 트윗 정보 추출 전략 인터페이스
 */
export interface TweetExtractionStrategy {
  /** 전략의 고유 이름 */
  readonly name: string;

  /** 우선순위 (낮을수록 먼저 실행) */
  readonly priority: number;

  /**
   * 트윗 정보 추출 실행
   * @param tweetContainer 트윗 컨테이너 요소
   * @param clickedElement 클릭된 요소 (선택사항)
   * @returns 추출된 트윗 정보 또는 null
   */
  extract(tweetContainer: HTMLElement, clickedElement?: HTMLElement): TweetInfo | null;
}

/**
 * 트윗 정보 유효성 검증
 */
export function isValidTweetInfo(info: TweetInfo | null): info is TweetInfo {
  return (
    info !== null &&
    typeof info.username === 'string' &&
    info.username.length > 0 &&
    typeof info.tweetId === 'string' &&
    info.tweetId.length > 0 &&
    typeof info.tweetUrl === 'string' &&
    info.tweetUrl.includes(info.tweetId)
  );
}

/**
 * 합성 트윗 정보 생성
 */
export function generateSyntheticTweetInfo(): TweetInfo {
  const timestamp = Date.now();
  return {
    username: 'unknown_user',
    tweetId: `synthetic_${timestamp}`,
    tweetUrl: `https://x.com/unknown_user/status/synthetic_${timestamp}`,
  };
}
