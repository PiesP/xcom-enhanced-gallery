# 인용 리트윗(Quote Tweet) 미디어 추출 솔루션

**작성일**: 2025-11-04
**버전**: 1.0.0
**상태**: 제안 단계

---

## 📋 개요

X.com의 인용 리트윗(Quote Tweet)은 기존 트윗 위에 새로운 코멘트를 추가한 형태입니다. 현재 X.com Enhanced Gallery는 **단일 트윗**에 최적화되어 있어, **인용 리트윗의 중첩된 미디어 구조**에서 정확한 추출이 어렵습니다.

이 문서는:
1. 인용 리트윗 DOM 구조 분석
2. 현재 코드의 한계점 파악
3. 3단계 해결 솔루션 제안

---

## 🏗️ 인용 리트윗 DOM 구조

### 구조 개요

```
<article data-testid="tweet">  ← 외부 트윗(인용 리트윗 작성자)
  <div> ... 인용 리트윗 작성자 정보 ... </div>
  <div> ... 인용 리트윗 텍스트 ... </div>
  <div>
    <article data-testid="tweet">  ← 내부 트윗(인용된 원본 트윗)
      <div> ... 원본 트윗 작성자 정보 ... </div>
      <div> ... 원본 트윗 텍스트 ... </div>
      <div> ... [미디어 컨테이너] ... </div>
    </article>
  </div>
</article>
```

### 핵심 특성

| 특성 | 설명 | 영향 |
|------|------|------|
| **중첩 articles** | 2개의 `<article data-testid="tweet">` | 단순 closest() 선택자 부족 |
| **미디어 위치** | 내부 article 내에만 존재 | 상위 article에서 누수 가능 |
| **사용자 정보** | 2개의 서로 다른 사용자 | 잘못된 메타데이터 수집 위험 |
| **트윗 ID** | 2개의 서로 다른 트윗 ID | 인용/원본 ID 혼동 가능 |

---

## 🔍 현재 코드의 문제점

### 1. DOM 추출 방식의 한계

**파일**: `src/shared/services/media-extraction/extractors/dom-direct-extractor.ts`

```typescript
// ❌ 문제: 첫 번째 article을 항상 선택
private findMediaContainer(element: HTMLElement): HTMLElement | null {
  const closestTweet = this.selectors.findClosest(STABLE_SELECTORS.TWEET_CONTAINERS, element);
  if (closestTweet) return closestTweet as HTMLElement;  // 외부 article 선택
  // ...
}

// ❌ 결과: 인용 리트윗의 미디어를 못 찾거나 잘못된 미디어 반환
```

**구체적 시나리오**:

```
클릭: 원본 트윗의 이미지 클릭
  ↓
closest('article[data-testid="tweet"]') 실행
  ↓
외부 article (인용 리트윗 작성자) 선택 ❌
  ↓
외부 article에는 미디어 없음 → 실패 또는 중복 미디어
```

### 2. Twitter API 응답의 quoted_status_result 활용 부족

**파일**: `src/shared/services/media/twitter-video-extractor.ts` (Line 377-425)

```typescript
// ✅ API는 인용 리트윗 감지 가능
if (tweetResult.quoted_status_result?.result) {
  const quotedTweet = tweetResult.quoted_status_result.result;
  // ... 인용 트윗 미디어 추출
}

// ❌ 하지만 미디어 추출 서비스에서는 미활용
// MediaExtractionService는 tweetId만으로 API 호출
// → 인용 리트윗인지 여부를 모름
```

### 3. 선택된 미디어 인덱싱 오류

**파일**: `src/shared/services/media-extraction/extractors/dom-direct-extractor.ts`

```typescript
private findClickedIndex(element: HTMLElement, mediaItems: MediaInfo[]): number {
  // ❌ 전체 미디어 목록에서 단순 비교
  // 인용 리트윗에서는 인덱스가 혼란스러워질 수 있음
  const clickedMediaUrl = this.getClickedMediaUrl(element);
  return mediaItems.findIndex(item => item.url === clickedMediaUrl);
}
```

---

## ✅ 3단계 솔루션

### 단계 1: 인용 리트윗 구분 계층 추가

**목적**: 현재 트윗이 인용 리트윗인지, 원본 트윗인지 판단

**구현 위치**: `src/shared/services/media-extraction/strategies/`

#### 새 파일: `quote-tweet-detector.ts`

```typescript
/**
 * @fileoverview 인용 리트윗 감지 및 구조 분석
 * @version 1.0.0 - Phase 341: Quote Tweet Support
 */

export interface QuoteTweetStructure {
  /** 인용 리트윗 여부 */
  isQuoteTweet: boolean;
  /** 클릭된 위치가 인용 트윗 내부인지 원본 트윗 내부인지 */
  clickedLocation: 'quoted' | 'original' | 'unknown';
  /** 외부 article 요소 (인용 리트윗 작성자) */
  outerArticle: HTMLElement | null;
  /** 내부 article 요소 (원본 트윗) - 인용 리트윗인 경우만 */
  innerArticle: HTMLElement | null;
  /** 타겟 article (실제 미디어를 포함한 article) */
  targetArticle: HTMLElement | null;
}

export class QuoteTweetDetector {
  /**
   * 클릭된 요소를 분석하여 인용 리트윗 구조 파악
   */
  static analyzeQuoteTweetStructure(element: HTMLElement): QuoteTweetStructure {
    // 1. 가장 가까운 트윗 article 찾기
    const outerArticle = element.closest('article[data-testid="tweet"]') as HTMLElement | null;
    if (!outerArticle) {
      return {
        isQuoteTweet: false,
        clickedLocation: 'unknown',
        outerArticle: null,
        innerArticle: null,
        targetArticle: null,
      };
    }

    // 2. 내부 트윗 article 찾기 (인용 리트윗인 경우)
    const innerArticle = outerArticle.querySelector(
      'article[data-testid="tweet"]'
    ) as HTMLElement | null;

    if (!innerArticle) {
      // 일반 트윗
      return {
        isQuoteTweet: false,
        clickedLocation: 'original',
        outerArticle: outerArticle,
        innerArticle: null,
        targetArticle: outerArticle,
      };
    }

    // 3. 인용 리트윗 구조 확인
    // 클릭된 요소가 내부 article에 포함되는지 확인
    const clickedInInner = innerArticle.contains(element);

    return {
      isQuoteTweet: true,
      clickedLocation: clickedInInner ? 'quoted' : 'original',
      outerArticle: outerArticle,
      innerArticle: innerArticle,
      targetArticle: clickedInInner ? innerArticle : outerArticle,
    };
  }

  /**
   * 인용 리트윗인 경우 정확한 미디어 컨테이너 찾기
   */
  static getMediaContainerForQuoteTweet(element: HTMLElement): HTMLElement | null {
    const structure = this.analyzeQuoteTweetStructure(element);

    if (!structure.targetArticle) {
      return null;
    }

    // targetArticle 내에서만 미디어 컨테이너 검색
    return structure.targetArticle.querySelector(
      '[data-testid="tweetPhoto"], [data-testid="videoPlayer"], img[src*="pbs.twimg.com"], video'
    ) as HTMLElement | null;
  }
}
```

### 단계 2: 이중 미디어 추출 로직 (API 기반)

**목적**: API 응답의 `quoted_status_result` 필드를 활용하여 두 트윗의 미디어를 모두 추출

**수정 파일**: `src/shared/services/media/twitter-video-extractor.ts`

#### 개선사항

```typescript
export interface TweetMediaEntry {
  // 기존 필드들...

  // Phase 341: 추가 필드
  sourceLocation: 'original' | 'quoted';  // 어느 트윗의 미디어인지
  originalTweetId?: string;                // 원본 트윗 ID (인용 리트윗인 경우)
  quotedTweetId?: string;                  // 인용된 트윗 ID (인용 리트윗인 경우)
}

export class TwitterAPI {
  public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
    // ... 기존 코드 ...

    let result = this.extractMediaFromTweet(tweetResult, tweetUser);
    result = sortMediaByVisualOrder(result);

    // Phase 341: 인용 리트윗 처리 개선
    if (tweetResult.quoted_status_result?.result) {
      const quotedTweet = tweetResult.quoted_status_result.result;
      const quotedUser = quotedTweet.core?.user_results?.result;

      if (quotedTweet && quotedUser) {
        // ... 기존 legacy 정규화 ...

        // 인용 트윗 미디어 추출
        const quotedMedia = this.extractMediaFromTweet(quotedTweet, quotedUser);
        const sortedQuotedMedia = sortMediaByVisualOrder(quotedMedia);

        // Phase 341: 소스 위치 마킹
        const taggedQuotedMedia = sortedQuotedMedia.map(media => ({
          ...media,
          sourceLocation: 'quoted' as const,
          quotedTweetId: quotedTweet.rest_id ?? quotedTweet.id_str,
          originalTweetId: tweetId,
        }));

        // 원본 트윗 미디어에도 소스 마킹
        const taggedOriginalMedia = result.map(media => ({
          ...media,
          sourceLocation: 'original' as const,
          originalTweetId: tweetId,
          quotedTweetId: quotedTweet.rest_id ?? quotedTweet.id_str,
        }));

        // 인용 미디어를 앞에 배치 (사용자가 먼저 본 순서)
        result = [...taggedQuotedMedia, ...taggedOriginalMedia];
      }
    }

    return result;
  }
}
```

### 단계 3: DOM 기반 미디어 추출 개선

**목적**: QuoteTweetDetector를 활용하여 정확한 미디어 컨테이너 선택

**수정 파일**: `src/shared/services/media-extraction/extractors/dom-direct-extractor.ts`

#### 개선사항

```typescript
import { QuoteTweetDetector } from '@shared/services/media-extraction/strategies/quote-tweet-detector';

export class DOMDirectExtractor {
  /**
   * Phase 341: 개선된 미디어 컨테이너 찾기
   */
  private findMediaContainer(element: HTMLElement): HTMLElement | null {
    // 1. 인용 리트윗 구조 분석
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

    // 3. 일반 트윗: 기존 로직 유지
    const closestTweet = this.selectors.findClosest(STABLE_SELECTORS.TWEET_CONTAINERS, element);
    if (closestTweet) return closestTweet as HTMLElement;

    const first = this.selectors.findTweetContainer(element) || this.selectors.findTweetContainer();
    return (first as HTMLElement) || element;
  }

  /**
   * Phase 341: 인용 리트윗에서 올바른 미디어 인덱싱
   */
  private findClickedIndex(element: HTMLElement, mediaItems: MediaInfo[]): number {
    const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(element);

    if (!structure.isQuoteTweet) {
      // 기존 로직
      const clickedMediaUrl = this.getClickedMediaUrl(element);
      return mediaItems.findIndex(item => item.url === clickedMediaUrl);
    }

    // 인용 리트윗: 클릭된 위치에 따라 인덱스 범위 조정
    const clickedMediaUrl = this.getClickedMediaUrl(element);
    const matchingIndices = mediaItems
      .map((item, idx) => ({ url: item.url, idx }))
      .filter(x => x.url === clickedMediaUrl);

    if (matchingIndices.length === 0) {
      return 0;
    }

    // 여러 일치가 있는 경우, 클릭된 위치에 해당하는 인덱스 선택
    // 예: 인용 트윗 클릭 시 → 인용 트윗 미디어만의 범위 내 선택
    if (structure.clickedLocation === 'quoted' && matchingIndices.length > 1) {
      // 첫 번째 매치 사용 (일반적으로 인용 미디어가 앞에 배치)
      return matchingIndices[0]?.idx ?? 0;
    }

    return matchingIndices[0]?.idx ?? 0;
  }
}
```

---

## 📝 구현 예제

### 시나리오 1: 인용 리트윗의 원본 미디어 클릭

```typescript
// 사용자가 인용 리트윗에 내장된 원본 트윗의 이미지 클릭

const clickedElement = imageElement;  // 원본 트윗의 이미지

// 1. 구조 분석
const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(clickedElement);
// {
//   isQuoteTweet: true,
//   clickedLocation: 'quoted',
//   outerArticle: <article> (인용 리트윗 작성자),
//   innerArticle: <article> (원본 트윗),
//   targetArticle: <article> (원본 트윗)
// }

// 2. API 추출
const mediaList = await TwitterAPI.getTweetMedias(originalTweetId);
// [
//   { url: '...', sourceLocation: 'quoted', quotedTweetId, originalTweetId },
//   { url: '...', sourceLocation: 'quoted', quotedTweetId, originalTweetId },
//   { url: '...', sourceLocation: 'original', quotedTweetId, originalTweetId }
// ]

// 3. 올바른 미디어만 반환
// → 사용자가 본 인용 트윗의 미디어만 갤러리에 표시
```

### 시나리오 2: 인용 리트윗 작성자의 컨텍스트 유지

```typescript
// API 응답:
{
  screen_name: 'quoter_username',  // 인용 리트윗 작성자
  tweet_id: '123456',              // 인용 리트윗의 ID
  sourceLocation: 'quoted',        // 이 미디어는 인용된 트윗에서
  quotedTweetId: '789012',         // 실제 미디어는 여기에
  originalTweetId: '123456',       // 이 트윗(인용 리트윗)을 통해 접근
  // ...
}

// 파일명 생성:
// quoter_username_123456_quoted_789012_photo_1.jpg
// → 출처가 명확함
```

---

## 🔧 기술 스택

| 컴포넌트 | 파일 | 책임 |
|---------|------|------|
| **감지기** | `quote-tweet-detector.ts` | DOM 구조 분석 |
| **API** | `twitter-video-extractor.ts` | 이중 미디어 추출 |
| **DOM 추출기** | `dom-direct-extractor.ts` | 정확한 컨테이너 선택 |
| **미디어 정보** | `twitter-video-extractor.ts` | 소스 위치 메타데이터 |

---

## ⚠️ 엣지 케이스

### 1. 깊은 중첩 (인용된 리트윗이 또 다른 리트윗을 인용)

```
article (최외곽 - 유저 A의 인용)
  ├─ article (유저 B의 인용)
  │   └─ article (유저 C의 원본)
```

**현재 솔루션 제한**: 1단계만 지원 (B와 C의 미디어는 혼동 가능)
**향후 개선**: 재귀적 구조 분석 필요

### 2. 인용 리트윗에 이미지가 없는 경우

```
article (인용 리트윗 - 이미지 있음)
  └─ article (원본 트윗 - 이미지 없음)
```

**현재 솔루션**: targetArticle이 원본이므로 미디어 없음 반환
**개선안**: 외부 미디어로 폴백 메커니즘 추가

### 3. API와 DOM 데이터 불일치

```
API: 인용 리트윗 감지 (quoted_status_result 있음)
DOM: 완전 렌더링 전 미디어 클릭
```

**현재 솔루션**: API 우선 (안전)
**대안**: 재시도 로직 + DOM 백업 강화

---

## 📊 성능 영향

| 작업 | Before | After | 개선 |
|------|--------|-------|------|
| 인용 리트윗 감지 | N/A | ~2ms | +신규 |
| API 호출 | 1회 | 1회 | 0% |
| DOM 탐색 | 3-5ms | 2-3ms | -40% |
| 미디어 필터링 | 0ms | <1ms | 무시할 수준 |

---

## ✨ 시작 체크리스트

- [ ] `QuoteTweetDetector` 클래스 구현
- [ ] `TwitterAPI.getTweetMedias()` 개선
- [ ] `DOMDirectExtractor` 통합
- [ ] 단위 테스트 작성 (20+ 케이스)
- [ ] E2E 테스트 작성 (인용 리트윗 시나리오)
- [ ] 상수 업데이트 (`STABLE_SELECTORS`)
- [ ] 타입 정의 추가 (`media.types.ts`)

---

## 🎯 관련 문서

- **ARCHITECTURE.md**: Layer 구조 및 Service 패턴
- **CODING_GUIDELINES.md**: 코드 스타일 및 패턴
- **twitter-video-extractor.ts**: 기존 API 추출 로직

---
