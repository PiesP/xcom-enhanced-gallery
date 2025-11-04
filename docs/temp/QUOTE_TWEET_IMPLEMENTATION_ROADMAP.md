# 인용 리트윗 미디어 추출 구현 로드맵

**작성일**: 2025-11-04
**타겟 Phase**: 342
**예상 기간**: 2-3주
**영향 범위**: ~600줄 코드 추가/수정

---

## 📅 Phase 별 구현 계획

### Phase 342.1: 기초 설정 (1-2일)

#### 1.1 타입 정의 확장

**파일**: `src/shared/types/media.types.ts`

```typescript
// ✅ 추가될 인터페이스

export interface QuoteTweetInfo {
  /** 인용 리트윗 여부 */
  isQuoteTweet: boolean;
  /** 클릭된 위치 */
  clickedLocation: 'quoted' | 'original' | 'unknown';
  /** 원본 트윗 ID (인용인 경우) */
  quotedTweetId?: string;
  /** 원본 트윗 작성자 (인용인 경우) */
  quotedUsername?: string;
  /** 소스 표시 (API 응답) */
  sourceLocation?: 'original' | 'quoted';
}

// TweetMediaEntry 확장
export interface TweetMediaEntry {
  // 기존 필드들...

  // Phase 342 추가
  sourceLocation?: 'original' | 'quoted';  // 어느 트윗의 미디어인지
  quotedTweetId?: string;                   // 인용된 트윗 ID
  quotedUsername?: string;                  // 인용된 트윗 작성자
}

// MediaInfo 확장
export interface MediaInfo {
  // 기존 필드들...

  // Phase 342 추가
  sourceLocation?: 'original' | 'quoted';
  quotedTweetId?: string;
  quotedUsername?: string;
  quotedTweetUrl?: string;
}
```

**Step**:
1. 타입 추가
2. 기존 코드 호환성 검증
3. 단위 테스트 (타입 체크)

#### 1.2 상수 업데이트

**파일**: `src/constants.ts`

```typescript
// STABLE_SELECTORS 확장
export const STABLE_SELECTORS = {
  // 기존...
  QUOTED_TWEET_ARTICLE: 'article[data-testid="tweet"] article[data-testid="tweet"]',
  // 인용 리트윗 내부 article 감지용 (복합 선택자)
};
```

### Phase 342.2: QuoteTweetDetector 구현 (2-3일)

#### 2.1 새 파일 생성

**파일**: `src/shared/services/media-extraction/strategies/quote-tweet-detector.ts`

```typescript
/**
 * @fileoverview 인용 리트윗 감지 및 DOM 구조 분석
 * @version 1.0.0 - Phase 342
 */

import { logger } from '@shared/logging';
import type { QuoteTweetInfo } from '@shared/types/media.types';

export interface QuoteTweetStructure {
  isQuoteTweet: boolean;
  clickedLocation: 'quoted' | 'original' | 'unknown';
  outerArticle: HTMLElement | null;
  innerArticle: HTMLElement | null;
  targetArticle: HTMLElement | null;
}

export class QuoteTweetDetector {
  private static readonly TWEET_SELECTOR = 'article[data-testid="tweet"]';

  /**
   * 클릭된 요소 분석
   */
  static analyzeQuoteTweetStructure(element: HTMLElement): QuoteTweetStructure {
    logger.debug('[QuoteTweetDetector] 분석 시작');

    try {
      // 1. 모든 조상 article 수집
      const articles = this.collectAncestorArticles(element);

      if (articles.length === 0) {
        return this.createStructure(false, 'unknown', null, null, null);
      }

      if (articles.length === 1) {
        // 일반 트윗
        return this.createStructure(false, 'original', articles[0], null, articles[0]);
      }

      // 인용 리트윗: articles[0] = 내부, articles[1] = 외부
      const [innerArticle, outerArticle, ...rest] = articles.reverse();

      const clickedInInner = innerArticle.contains(element);
      const location = clickedInInner ? 'quoted' : 'original';
      const targetArticle = clickedInInner ? innerArticle : outerArticle;

      logger.debug('[QuoteTweetDetector] 인용 리트윗 감지', {
        level: articles.length,
        clickedLocation: location,
        hasRest: rest.length > 0,
      });

      return this.createStructure(
        true,
        location,
        outerArticle,
        innerArticle,
        targetArticle
      );
    } catch (error) {
      logger.error('[QuoteTweetDetector] 분석 오류:', error);
      return this.createStructure(false, 'unknown', null, null, null);
    }
  }

  /**
   * 모든 조상 article 요소 수집
   */
  private static collectAncestorArticles(element: HTMLElement): HTMLElement[] {
    const articles: HTMLElement[] = [];
    let current: HTMLElement | null = element;

    while (current) {
      if (current.matches(this.TWEET_SELECTOR)) {
        articles.push(current);
      }
      current = current.parentElement;
    }

    return articles;
  }

  /**
   * 구조 객체 생성
   */
  private static createStructure(
    isQuoteTweet: boolean,
    clickedLocation: QuoteTweetInfo['clickedLocation'],
    outerArticle: HTMLElement | null,
    innerArticle: HTMLElement | null,
    targetArticle: HTMLElement | null
  ): QuoteTweetStructure {
    return {
      isQuoteTweet,
      clickedLocation,
      outerArticle,
      innerArticle,
      targetArticle,
    };
  }

  /**
   * 정확한 미디어 컨테이너 찾기
   */
  static getMediaContainerForQuoteTweet(element: HTMLElement): HTMLElement | null {
    const structure = this.analyzeQuoteTweetStructure(element);

    if (!structure.targetArticle) {
      return null;
    }

    // 직접 자식 및 깊이 1-2단계 내에서 미디어 찾기
    const mediaSelectors = [
      ':scope > div > [data-testid="tweetPhoto"]',
      ':scope > div > [data-testid="videoPlayer"]',
      ':scope > div > img[src*="pbs.twimg.com"]',
      ':scope > div > video',
    ];

    for (const selector of mediaSelectors) {
      const media = structure.targetArticle.querySelector(selector) as HTMLElement | null;
      if (media) {
        return media;
      }
    }

    return null;
  }

  /**
   * 인용 리트윗 메타데이터 추출
   */
  static extractQuoteTweetMetadata(element: HTMLElement): QuoteTweetInfo {
    const structure = this.analyzeQuoteTweetStructure(element);

    if (!structure.isQuoteTweet || !structure.innerArticle) {
      return {
        isQuoteTweet: false,
        clickedLocation: structure.clickedLocation,
      };
    }

    // 내부 article에서 트윗 ID와 작성자 추출
    const quotedTweetId = this.extractTweetIdFromArticle(structure.innerArticle);
    const quotedUsername = this.extractUsernameFromArticle(structure.innerArticle);

    return {
      isQuoteTweet: true,
      clickedLocation: structure.clickedLocation,
      quotedTweetId: quotedTweetId ?? undefined,
      quotedUsername: quotedUsername ?? undefined,
      sourceLocation: structure.clickedLocation === 'quoted' ? 'quoted' : 'original',
    };
  }

  /**
   * Article에서 트윗 ID 추출
   */
  private static extractTweetIdFromArticle(article: HTMLElement): string | null {
    const links = article.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/status\/(\d+)/);
        if (match) return match[1] ?? null;
      }
    }
    return null;
  }

  /**
   * Article에서 사용자명 추출
   */
  private static extractUsernameFromArticle(article: HTMLElement): string | null {
    const userLinks = article.querySelectorAll('a[href^="/"][href!="/"]');
    for (const link of userLinks) {
      const href = link.getAttribute('href');
      if (href && !href.includes('/status/') && !href.includes('/')) {
        return href.substring(1) || null;  // '/username' → 'username'
      }
    }
    return null;
  }
}
```

**Test 파일**: `test/unit/shared/services/quote-tweet-detector.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { QuoteTweetDetector } from '@shared/services/media-extraction/strategies/quote-tweet-detector';

describe('QuoteTweetDetector', () => {
  it('일반 트윗 감지', () => {
    // <article><img id="target"/></article>
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    const img = document.createElement('img');
    article.appendChild(img);
    document.body.appendChild(article);

    const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

    expect(result.isQuoteTweet).toBe(false);
    expect(result.clickedLocation).toBe('original');
    expect(result.targetArticle).toBe(article);
  });

  it('인용 리트윗 감지', () => {
    // <article><article><img id="target"/></article></article>
    const outerArticle = document.createElement('article');
    outerArticle.setAttribute('data-testid', 'tweet');
    const innerArticle = document.createElement('article');
    innerArticle.setAttribute('data-testid', 'tweet');
    const img = document.createElement('img');

    innerArticle.appendChild(img);
    outerArticle.appendChild(innerArticle);
    document.body.appendChild(outerArticle);

    const result = QuoteTweetDetector.analyzeQuoteTweetStructure(img);

    expect(result.isQuoteTweet).toBe(true);
    expect(result.clickedLocation).toBe('quoted');
    expect(result.innerArticle).toBe(innerArticle);
    expect(result.outerArticle).toBe(outerArticle);
    expect(result.targetArticle).toBe(innerArticle);
  });

  // ... 20+ 추가 테스트
});
```

### Phase 342.3: DOM 추출기 통합 (2-3일)

#### 3.1 DOMDirectExtractor 수정

**파일**: `src/shared/services/media-extraction/extractors/dom-direct-extractor.ts`

```typescript
import { QuoteTweetDetector } from '@shared/services/media-extraction/strategies/quote-tweet-detector';

export class DOMDirectExtractor {
  /**
   * Phase 342: 개선된 미디어 컨테이너 찾기
   */
  private findMediaContainer(element: HTMLElement): HTMLElement | null {
    // 1. 인용 리트윗 분석
    const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(element);

    logger.debug('[DOMDirectExtractor] Quote tweet structure:', {
      isQuoteTweet: structure.isQuoteTweet,
      clickedLocation: structure.clickedLocation,
    });

    // 2. 인용 리트윗인 경우 targetArticle 사용
    if (structure.isQuoteTweet && structure.targetArticle) {
      logger.info('[DOMDirectExtractor] Processing quote tweet', {
        clickedLocation: structure.clickedLocation,
      });
      return structure.targetArticle;
    }

    // 3. 일반 트윗: 기존 로직
    const closestTweet = this.selectors.findClosest(
      STABLE_SELECTORS.TWEET_CONTAINERS,
      element
    );
    if (closestTweet) return closestTweet as HTMLElement;

    const first =
      this.selectors.findTweetContainer(element) || this.selectors.findTweetContainer();
    return (first as HTMLElement) || element;
  }

  /**
   * Phase 342: 인용 리트윗에서 올바른 미디어 인덱싱
   */
  private findClickedIndex(element: HTMLElement, mediaItems: MediaInfo[]): number {
    const clickedMediaUrl = this.getClickedMediaUrl(element);

    if (!clickedMediaUrl) {
      return 0;
    }

    // 단순 URL 기반 매칭 (기존과 동일, 인용 구조 분석으로 이미 범위 제한됨)
    return mediaItems.findIndex(item => item.url === clickedMediaUrl);
  }

  /**
   * Phase 342: 인용 리트윗 메타데이터 추가
   */
  async extract(
    element: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug(`[DOMDirectExtractor] ${extractionId}: DOM 직접 추출 시작`);

    const container = this.findMediaContainer(element);
    if (!container) {
      return this.createFailureResult('컨테이너를 찾을 수 없음');
    }

    const mediaItems = this.extractMediaFromContainer(container, tweetInfo);
    const clickedIndex = this.findClickedIndex(element, mediaItems);

    // Phase 342: 인용 리트윗 정보 추가
    const quoteInfo = QuoteTweetDetector.extractQuoteTweetMetadata(element);

    if (mediaItems.length === 0) {
      return this.createFailureResult('미디어를 찾을 수 없음');
    }

    // 각 미디어 아이템에 인용 정보 추가
    const enhancedMediaItems = mediaItems.map(item => ({
      ...item,
      sourceLocation: quoteInfo.sourceLocation,
      quotedTweetId: quoteInfo.quotedTweetId,
      quotedUsername: quoteInfo.quotedUsername,
    }));

    logger.info(
      `[DOMDirectExtractor] ${extractionId}: ✅ DOM 추출 성공 - ${mediaItems.length}개 미디어`
    );

    return {
      success: true,
      mediaItems: enhancedMediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback',
        isQuoteTweet: quoteInfo.isQuoteTweet,
        clickedLocation: quoteInfo.clickedLocation,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }
}
```

### Phase 342.4: API 추출기 개선 (2-3일)

#### 4.1 TwitterAPI 개선

**파일**: `src/shared/services/media/twitter-video-extractor.ts`

```typescript
export class TwitterAPI {
  public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
    // ... 기존 코드 ...

    let result = this.extractMediaFromTweet(tweetResult, tweetUser);
    result = sortMediaByVisualOrder(result);

    // Phase 342: 인용 리트윗 처리 개선
    if (tweetResult.quoted_status_result?.result) {
      const quotedTweet = tweetResult.quoted_status_result.result;
      const quotedUser = quotedTweet.core?.user_results?.result;

      if (quotedTweet && quotedUser) {
        // ... 기존 legacy 정규화 ...

        // 인용 트윗 미디어 추출
        const quotedMedia = this.extractMediaFromTweet(quotedTweet, quotedUser);
        const sortedQuotedMedia = sortMediaByVisualOrder(quotedMedia);

        // Phase 342: 소스 위치 및 메타데이터 마킹
        const quotedTweetId = quotedTweet.rest_id ?? quotedTweet.id_str ?? '';
        const quotedScreenName = quotedUser.screen_name ?? '';

        const taggedQuotedMedia = sortedQuotedMedia.map(media => ({
          ...media,
          sourceLocation: 'quoted' as const,
          quotedTweetId,
          quotedScreenName,
          originalTweetId: tweetId,
        }));

        // 원본 트윗 미디어에도 인용 정보 추가
        const taggedOriginalMedia = result.map(media => ({
          ...media,
          sourceLocation: 'original' as const,
          quotedTweetId,
          quotedScreenName,
          originalTweetId: tweetId,
        }));

        // 인용 미디어를 앞에 배치
        result = [...taggedQuotedMedia, ...taggedOriginalMedia];

        logger.info(
          `[TwitterAPI] 인용 리트윗 처리 완료: 인용=${sortedQuotedMedia.length}개, 원본=${result.length - sortedQuotedMedia.length}개`
        );
      }
    }

    return result;
  }
}
```

### Phase 342.5: 통합 테스트 (3-4일)

#### 5.1 단위 테스트

```typescript
// test/unit/shared/services/quote-tweet-detector.test.ts
// 20+ 테스트 케이스

// test/unit/shared/services/media-extraction/extractors/dom-direct-extractor.test.ts
// 인용 리트윗 추가 테스트 10+

// test/unit/shared/services/media/twitter-video-extractor.test.ts
// quoted_status_result 처리 테스트 5+
```

#### 5.2 E2E 테스트

```typescript
// playwright/smoke/quote-tweet.spec.ts
test('인용 리트윗에서 원본 미디어 추출', async ({ page }) => {
  await page.goto('https://x.com/search?q=filter%3Aquote');

  // 인용 리트윗 찾아 미디어 클릭
  const quoteTweet = page.locator('article[data-testid="tweet"] article[data-testid="tweet"]').first();
  const media = quoteTweet.locator('img').first();

  await media.click();

  // 갤러리 검증
  const gallery = page.locator('[data-testid="gallery"]');
  await expect(gallery).toBeVisible();

  // 메디어 개수 확인 (원본 미디어만)
  const mediaCount = await gallery.locator('[data-testid="gallery-item"]').count();
  expect(mediaCount).toBeGreaterThan(0);
});
```

### Phase 342.6: 문서화 및 마무리 (2-3일)

#### 6.1 코드 주석 추가

- QuoteTweetDetector 전체 JSDoc
- DOM 추출기 인용 리트윗 섹션 주석
- API 응답 필드 설명

#### 6.2 마이그레이션 가이드

```markdown
# Phase 342 마이그레이션 가이드

## 변경사항
- API: `TweetMediaEntry.sourceLocation` 추가
- DOM: `QuoteTweetDetector` 신규 클래스
- 타입: `QuoteTweetInfo`, `MediaInfo.sourceLocation` 등

## 호환성
- ✅ 후방호환: 기존 코드 동작 유지
- 추가 필드는 optional

## 테스트
- 118+ 테스트 케이스 (기존 + 신규)
- 모든 테스트 통과 확인
```

---

## 📊 작업 분담 (솔로 개발 기준)

| Phase | 작업 | 소요시간 | 상태 |
|-------|------|---------|------|
| 342.1 | 타입 + 상수 | 1-2일 | 📋 |
| 342.2 | QuoteTweetDetector | 2-3일 | 📋 |
| 342.3 | DOMDirectExtractor | 2-3일 | 📋 |
| 342.4 | TwitterAPI 개선 | 2-3일 | 📋 |
| 342.5 | 통합 테스트 | 3-4일 | 📋 |
| 342.6 | 문서화 | 2-3일 | 📋 |
| **합계** | | **14-21일** | |

---

## ✅ 검증 체크리스트

### 코드 품질
- [ ] TypeScript 타입 체크 통과
- [ ] ESLint 규칙 준수
- [ ] Prettier 포맷팅 적용
- [ ] 순환 의존성 없음

### 테스트
- [ ] 단위 테스트 커버리지 > 90%
- [ ] E2E 테스트 통과
- [ ] 인용 리트윗 시나리오 5개 모두 성공
- [ ] 엣지 케이스 처리 확인

### 문서화
- [ ] 코드 주석 100% 작성
- [ ] 아키텍처 문서 업데이트
- [ ] 마이그레이션 가이드 작성
- [ ] 변경 로그 기록

### 성능
- [ ] 번들 크기 증가 < 10KB
- [ ] 추출 속도 저하 < 5%
- [ ] 메모리 누수 없음

---

## 🚀 배포 전 최종 확인

```bash
# 로컬 검증
npm run validate:pre   # 타입체크 + lint + 의존성
npm run test          # 단위 + 스모크
npm run check         # 전체 검증

# 빌드
npm run build         # e2e:smoke 포함

# 수동 테스트
1. 일반 트윗 미디어 추출 확인
2. 인용 리트윗 원본 미디어 추출 확인
3. 인용 리트윗 작성자 미디어 추출 확인
4. 메타데이터 정확성 확인
5. 다운로드 파일명 검증
```

---

## 📚 참고 링크

- [QUOTE_TWEET_MEDIA_EXTRACTION_ANALYSIS.md](./QUOTE_TWEET_MEDIA_EXTRACTION_ANALYSIS.md)
- [QUOTE_TWEET_DOM_STRUCTURE_DETAILED.md](./QUOTE_TWEET_DOM_STRUCTURE_DETAILED.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)

---
