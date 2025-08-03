/**
 * @fileoverview 실제 X.com 페이지 구조를 모방한 통합 DOM Mock
 * @description TDD로 구현된 샘플 페이지 기반 테스트 환경
 * @version 1.0.0
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 실제 X.com 페이지 구조를 모방한 DOM Mock
 */
export const PAGE_STRUCTURES = {
  bookmark: {
    name: 'Bookmark Page',
    html: () => loadSampleHTML('bookmark_page.html'),
    selectors: {
      tweets: '[data-testid="tweet"], [role="article"]',
      media: '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"]',
      userInfo: '[data-testid="User-Name"], [data-testid="UserAvatar-Container-"]',
      timeline: '[data-testid="primaryColumn"]',
      images: 'img[src*="pbs.twimg.com/media/"]',
      videos: 'video, [data-testid="videoPlayer"]',
    },
    expectedMediaCount: 5, // 북마크 페이지 예상 미디어 수
    pageType: 'BOOKMARK',
  },
  media: {
    name: 'Media Page',
    html: () => loadSampleHTML('media_page.html'),
    selectors: {
      tweets: '[data-testid="tweet"], [role="article"]',
      media: '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"]',
      mediaContainer: '[data-testid="primaryColumn"]',
      imageElements: 'img[src*="pbs.twimg.com"]',
      videoElements: 'video',
    },
    expectedMediaCount: 1, // 미디어 페이지는 보통 단일 미디어
    pageType: 'MEDIA',
  },
  timeline: {
    name: 'Timeline Page',
    html: () => loadSampleHTML('my_timeline_page.html'),
    selectors: {
      tweets: '[data-testid="tweet"], [role="article"]',
      media: '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"]',
      timeline: '[data-testid="primaryColumn"]',
      timelineItems: '[data-testid="cellInnerDiv"]',
    },
    expectedMediaCount: 10, // 타임라인은 여러 미디어
    pageType: 'TIMELINE',
  },
  post: {
    name: 'Post Page',
    html: () => loadSampleHTML('post_page.html'),
    selectors: {
      tweets: '[data-testid="tweet"], [role="article"]',
      media: '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"]',
      postContainer: '[data-testid="primaryColumn"]',
      replies: '[data-testid="reply"]',
    },
    expectedMediaCount: 3, // 포스트 + 답글들의 미디어
    pageType: 'POST',
  },
  userTimeline: {
    name: 'User Timeline Page',
    html: () => loadSampleHTML('user_timeline_page.html'),
    selectors: {
      tweets: '[data-testid="tweet"], [role="article"]',
      media: '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"]',
      userInfo: '[data-testid="UserName"]',
      profileHeader: '[data-testid="UserProfileHeader"]',
    },
    expectedMediaCount: 8, // 사용자 타임라인의 미디어들
    pageType: 'PROFILE',
  },
} as const;

/**
 * 샘플 HTML 파일 로드 함수
 */
function loadSampleHTML(filename: string): string {
  try {
    const samplePath = join(process.cwd(), 'sample_pages', filename);
    return readFileSync(samplePath, 'utf-8');
  } catch (error) {
    console.warn(`샘플 페이지 로드 실패: ${filename}`, error);
    // 폴백으로 기본 HTML 구조 반환
    return getFallbackHTML(filename);
  }
}

/**
 * 샘플 페이지 로드 실패시 폴백 HTML
 */
function getFallbackHTML(filename: string): string {
  const pageType = filename.replace('_page.html', '');

  return `
<!DOCTYPE html>
<html dir="ltr" lang="ko">
<head>
  <meta charset="UTF-8">
  <title>X.com - ${pageType}</title>
</head>
<body>
  <div id="react-root">
    <div dir="ltr">
      <div class="css-1dbjc4n r-13qz1uu r-417010">
        <main role="main" class="css-1dbjc4n r-1habvwh r-13qz1uu">
          <div data-testid="primaryColumn" class="css-1dbjc4n r-1jgb5lz r-1ye8kvj r-13qz1uu">
            <!-- ${pageType} 페이지 폴백 구조 -->
            <article data-testid="tweet" role="article" class="css-1dbjc4n r-1loqt21">
              <div class="css-1dbjc4n r-1iusvr4 r-16y2uox">
                <div data-testid="tweetPhoto" class="css-1dbjc4n">
                  <img src="https://pbs.twimg.com/media/fallback_image.jpg" alt="Fallback media">
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 페이지 타입별 URL 패턴
 */
export const PAGE_URL_PATTERNS = {
  bookmark: /\/i\/bookmarks/,
  media: /\/\w+\/status\/\d+\/photo\/\d+/,
  timeline: /^\/(home|$)/,
  post: /\/\w+\/status\/\d+$/,
  userTimeline: /\/\w+$/,
} as const;

export type PageType = keyof typeof PAGE_STRUCTURES;
export type PageStructure = (typeof PAGE_STRUCTURES)[PageType];
