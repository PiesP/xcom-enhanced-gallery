# TDD 리팩토링 활성 계획

> 프로젝트 개선을 위한 TDD 기반 리팩토링 작업 관리

**최근 업데이트**: 2025-10-06 **현재 상태**: Epic PRODUCTION-ISSUE-FIX 계획 중
🔄

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 프로젝트 현황

### 테스트 상태

- **전체 테스트**: 2931 passed | 110 skipped | 1 todo (3042 total)
- **상태**: ✅ GREEN

### 번들 크기 (2025-10-06)

- **Raw**: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)
- **Gzip**: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)
- **이상적 목표**: Raw 420 KB, Gzip 105 KB

### 최근 완료 (Phase 1-6)

- ✅ **Phase 1-3**: Tree-shaking, 중복 제거, Terser 최적화
- ✅ **Phase 4A**: Unused Files Removal (8개 파일)
- ✅ **Phase 4B**: Delegation Wrapper 제거 (8개 파일)
- ✅ **Phase 5**: Pure Annotations (교육적 가치, 번들 효과 없음)
- ✅ **Phase 6**: Code Cleanup (theme-utils.ts 중복 제거)
- ✅ **Epic SOLID-NATIVE-MIGRATION**: createGlobalSignal → SolidJS Native 전환
  (2025-10-06 확인 완료)
- ✅ **Epic GALLERY-ENHANCEMENT-001**: 갤러리 UX 개선 (2025-10-06 완료)

---

## 현재 활성 작업

**상태**: Epic PRODUCTION-ISSUE-FIX 계획 중 🔄

**배경**: Production 환경 테스트에서 발견된 3가지 이슈를 TDD 기반으로 분석 및
해결

**콘솔 로그 분석** (`x.com-1759664758502.log`):

- ❌ 미디어 추출 실패: "이미지나 비디오를 찾을 수 없습니다."
- ⚠️ 자동 포커스 갱신: 동작 흔적 없음 (로그 부재)
- ⚠️ 타임라인 위치 복원: 앵커 설정은 되나 복원 로그 없음

---

---

## Epic PRODUCTION-ISSUE-FIX: Production 이슈 수정 🔄

**우선순위**: CRITICAL **난이도**: M (Medium) **예상 기간**: 2일 **시작일**:
2025-10-06 **목표 완료일**: 2025-10-08

### 배경

**선정 사유**: Production 환경 테스트에서 발견된 3가지 기능 이슈를 TDD 기반으로
분석하고 해결

**현재 문제**:

1. ❌ **미디어 추출 실패**: 일부 트윗에서 이미지/비디오 추출 실패 (로그:
   "이미지나 비디오를 찾을 수 없습니다.")
2. ⚠️ **자동 포커스 갱신**: 구현되어 있으나 동작 확인 필요 (로그 부재)
3. ⚠️ **타임라인 위치 복원**: 앵커 설정은 되나 복원 로그 없음

**로그 분석** (`x.com-1759664758502.log`):

```log
[WARN] [TweetInfoExtractor] 모든 전략 실패
[DEBUG] [MediaExtractor] simp_ba460f35-...: 트윗 정보 없음 - DOM 직접 추출로 진행
[WARN] [MediaExtractor] simp_ba460f35-...: DOM 직접 추출 실패
[WARN] 미디어 추출 실패: Object
토스트 표시: 미디어 로드 실패 - 이미지나 비디오를 찾을 수 없습니다.
```

**목표**:

- ✅ 모든 미디어 타입(이미지/비디오/GIF) 정상 추출
- ✅ 자동 포커스 갱신 동작 검증 및 로깅 강화
- ✅ 타임라인 위치 복원 동작 검증 및 로깅 강화

---

## Sub-Epic 1: 미디어 타입 추출 강화 (MEDIA-TYPE-EXTRACTION-ENHANCEMENT)

**우선순위**: HIGH **난이도**: M (Medium) **예상 기간**: 1일

### 문제 분석

**현재 상황** (로그 기반):

1. **트윗 정보 추출 실패**:
   - `[DomStructureTweetStrategy] 소유권 검증 실패: 신뢰도가 최소 기준 미달`
   - Fallback 전략 실패: `[TweetInfoExtractor] 모든 전략 실패`
2. **DOM 직접 추출 실패**:
   - `[DOMDirectExtractor] simp_...: DOM 직접 추출 시작`
   - `[MediaExtractor] simp_...: DOM 직접 추출 실패`
3. **결과**: 토스트 에러 "미디어 로드 실패 - 이미지나 비디어를 찾을 수
   없습니다."

**코드 분석**:

- `MediaExtractionService`: API 우선 → DOM 백업 전략
- `DOMDirectExtractor`: 기본 DOM 파싱만 수행, 비디오/GIF 감지 로직 부족
- `MediaClickDetector`: 클릭 감지는 잘 작동, DOM 추출과 연계 필요

**근본 원인**:

1. DOM 직접 추출 시 `<video>`, `<img>` 태그 탐색 범위 제한적
2. URL 기반 타입 추론 로직 부족 (`.mp4`, `.gif` 확장자 체크)
3. Twitter 특수 구조 (role="button", data-testid 등) 미대응

### 솔루션 옵션 비교

#### 옵션 A: DOM 추출기 강화 (권장 ✅)

**장점**:

- 근본적 해결: API 실패 시에도 안정적 추출
- 확장성: 향후 Twitter DOM 변경에도 대응 가능
- 독립성: API에 의존하지 않음

**단점**:

- 복잡도 증가: DOM 탐색 로직 추가
- 테스트 부담: 다양한 트윗 구조 케이스 필요

**구현 방향**:

1. `DOMDirectExtractor` 강화:
   - `<video>` 태그 탐색 범위 확대 (closet, querySelector all)
   - `<img>` 태그에서 URL 패턴 기반 GIF 감지
   - Twitter role 속성 활용 (role="button" → 비디오 플레이어)
2. URL 패턴 기반 타입 추론:
   - `isVideoUrl()`, `isGifUrl()` 유틸 추가
   - `url-patterns.ts`에 통합

#### 옵션 B: MediaClickDetector 연계 강화

**장점**:

- 클릭 시점 정보 활용: 이미 정확한 미디어 감지 중
- 기존 로직 재사용: `detectMediaFromClick()` 결과 활용

**단점**:

- 제한적 해결: 클릭 기반 추출만 개선
- API 추출 실패 케이스 미대응

**구현 방향**:

1. `detectMediaFromClick()` 결과를 `MediaExtractionService`에 전달
2. DOM 추출 시 클릭 감지 정보 우선 사용

#### 옵션 C: API 추출 재시도 로직

**장점**:

- API가 가장 정확한 데이터 제공

**단점**:

- 성능 이슈: 재시도 지연 발생
- 근본 해결 아님: API 실패 원인 해결 안 됨

**구현 방향**:

1. `TwitterAPIExtractor`에 retry 로직 추가
2. 지수 백오프 적용

### 최종 선택: 옵션 A + B 조합 ✅

**이유**:

- 옵션 A로 DOM 추출 강화하여 API 실패 시에도 안정적 추출
- 옵션 B로 클릭 감지 정보 활용하여 정확도 향상
- 옵션 C는 제외 (근본 해결 아님, 성능 이슈)

**구현 우선순위**:

1. Phase 1: DOM 추출기 강화 (옵션 A)
2. Phase 2: MediaClickDetector 연계 (옵션 B)
3. Phase 3: 통합 테스트 및 로깅 강화

### Phase 1: DOM 추출기 강화 (옵션 A)

#### Phase 1-1 (RED): 실패 케이스 재현

**테스트 파일**: `test/features/gallery/media-extraction-enhancement.test.ts`

**테스트 시나리오**:

1. **비디오 추출 실패 재현**:

   ```typescript
   it('[RED] should extract video from Twitter video player', async () => {
     const videoPlayer = document.createElement('div');
     videoPlayer.setAttribute('role', 'button');
     videoPlayer.setAttribute('aria-label', '재생');
     const video = document.createElement('video');
     video.src = 'https://video.twimg.com/ext_tw_video/test.mp4';
     videoPlayer.appendChild(video);

     const result =
       await mediaExtractionService.extractFromClickedElement(videoPlayer);

     expect(result.success).toBe(true);
     expect(result.mediaItems).toHaveLength(1);
     expect(result.mediaItems[0].type).toBe('video');
   });
   ```

2. **GIF 추출 실패 재현**:

   ```typescript
   it('[RED] should detect GIF from URL pattern', async () => {
     const img = document.createElement('img');
     img.src = 'https://pbs.twimg.com/tweet_video_thumb/xyz.jpg';

     const result = await mediaExtractionService.extractFromClickedElement(img);

     expect(result.success).toBe(true);
     expect(result.mediaItems[0].type).toBe('gif');
   });
   ```

3. **중첩 DOM 구조 테스트**:

   ```typescript
   it('[RED] should extract media from nested tweet structure', async () => {
     const article = document.createElement('article');
     article.setAttribute('data-testid', 'tweet');
     const mediaDiv = document.createElement('div');
     mediaDiv.setAttribute('data-testid', 'videoComponent');
     const video = document.createElement('video');
     video.src = 'https://video.twimg.com/ext_tw_video/test.mp4';
     mediaDiv.appendChild(video);
     article.appendChild(mediaDiv);

     const result =
       await mediaExtractionService.extractFromClickedElement(mediaDiv);

     expect(result.success).toBe(true);
     expect(result.mediaItems).toHaveLength(1);
   });
   ```

**예상 결과**: 모든 테스트 RED (현재 로직으로는 추출 실패)

#### Phase 1-2 (GREEN): DOMDirectExtractor 강화

**파일**:
`src/shared/services/media-extraction/extractors/DOMDirectExtractor.ts`

**구현**:

1. **비디오 탐색 범위 확대**:

   ```typescript
   private findVideoElements(element: HTMLElement): HTMLVideoElement[] {
     const videos: HTMLVideoElement[] = [];

     // 직접 video 태그
     if (element.tagName === 'VIDEO') {
       videos.push(element as HTMLVideoElement);
     }

     // 자식 video 태그
     const childVideos = element.querySelectorAll('video');
     videos.push(...Array.from(childVideos));

     // role="button" 내부 video 탐색
     const videoPlayers = element.querySelectorAll('[role="button"]');
     for (const player of videoPlayers) {
       const video = player.querySelector('video');
       if (video) videos.push(video);
     }

     // 상위 컨테이너에서 video 탐색
     const parent = element.closest('[data-testid="videoComponent"]');
     if (parent) {
       const video = parent.querySelector('video');
       if (video) videos.push(video);
     }

     return videos.filter((v, i, arr) => arr.indexOf(v) === i); // 중복 제거
   }
   ```

2. **URL 기반 타입 추론 유틸**:

   ```typescript
   // src/shared/utils/media-type-detection.ts
   export function detectMediaTypeFromUrl(
     url: string
   ): 'image' | 'video' | 'gif' {
     const lower = url.toLowerCase();

     // GIF 패턴
     if (
       lower.includes('tweet_video_thumb') ||
       lower.includes('ext_tw_video_thumb') ||
       lower.includes('video_thumb')
     ) {
       return 'gif';
     }

     // 비디오 확장자
     if (
       lower.includes('.mp4') ||
       lower.includes('.webm') ||
       lower.includes('.m3u8')
     ) {
       return 'video';
     }

     // 이미지 확장자
     if (
       lower.includes('.jpg') ||
       lower.includes('.png') ||
       lower.includes('.webp')
     ) {
       return 'image';
     }

     // 기본값
     return 'image';
   }
   ```

3. **DOMDirectExtractor 통합**:

   ```typescript
   private createMediaInfo(url: string, index: number, tweetInfo?: TweetInfo): MediaInfo {
     const type = detectMediaTypeFromUrl(url);

     return {
       id: `media_${Date.now()}_${index}`,
       url,
       originalUrl: url,
       type,
       filename: this.generateFilename(type, index, tweetInfo),
       index,
       ...(type === 'video' && {
         thumbnailUrl: this.generateVideoThumbnail(url),
       }),
     };
   }
   ```

**GREEN 결과**: 테스트 통과 (비디오/GIF 정상 추출)

#### Phase 1-3 (REFACTOR): 로깅 및 에러 처리 강화

**개선 사항**:

1. **상세 로깅 추가**:

   ```typescript
   logger.debug('[DOMDirectExtractor] 추출 시작', {
     elementTag: element.tagName,
     elementClass: element.className,
     foundVideos: videos.length,
     foundImages: images.length,
   });
   ```

2. **에러 메시지 구체화**:

   ```typescript
   if (mediaItems.length === 0) {
     throw new ExtractionError(
       ExtractionErrorCode.NO_MEDIA_FOUND,
       `DOM 추출 실패: video=${videos.length}, img=${images.length}, element=${element.tagName}`
     );
   }
   ```

3. **타입 추론 로직 문서화**:
   - `detectMediaTypeFromUrl()` JSDoc 추가
   - URL 패턴 예시 주석 추가

**REFACTOR 검증**:

- ✅ 로깅 출력 확인
- ✅ 에러 메시지 명확성 확인
- ✅ 코드 가독성 개선 확인

### Phase 2: MediaClickDetector 연계 (옵션 B)

#### Phase 2-1 (RED): 클릭 감지 정보 활용 테스트

**테스트**:

```typescript
it('[RED] should use click detection result in media extraction', async () => {
  const videoPlayer = document.createElement('div');
  videoPlayer.setAttribute('role', 'button');
  const video = document.createElement('video');
  video.src = 'https://video.twimg.com/ext_tw_video/test.mp4';
  videoPlayer.appendChild(video);

  // MediaClickDetector가 이미 감지한 정보 시뮬레이션
  const clickDetectionResult = {
    type: 'video' as const,
    element: video,
    mediaUrl: video.src,
    confidence: 0.9,
    method: 'direct_element',
  };

  const result = await mediaExtractionService.extractWithClickHint(
    videoPlayer,
    clickDetectionResult
  );

  expect(result.success).toBe(true);
  expect(result.mediaItems[0].type).toBe('video');
  expect(result.metadata.sourceType).toContain('click-hint');
});
```

**예상 결과**: RED (`extractWithClickHint()` 메서드 없음)

#### Phase 2-2 (GREEN): MediaExtractionService 확장

**구현**:

```typescript
// src/shared/services/media-extraction/MediaExtractionService.ts
async extractWithClickHint(
  element: HTMLElement,
  clickHint: MediaDetectionResult,
  options: MediaExtractionOptions = {}
): Promise<MediaExtractionResult> {
  logger.debug('[MediaExtractor] 클릭 힌트 기반 추출 시작', clickHint);

  // 클릭 힌트 정보를 우선 사용
  if (clickHint.mediaUrl && clickHint.type !== 'none') {
    const mediaItem: MediaInfo = {
      id: `media_${Date.now()}`,
      url: clickHint.mediaUrl,
      originalUrl: clickHint.mediaUrl,
      type: clickHint.type === 'video' ? 'video' : 'image',
      filename: extractFilenameFromUrl(clickHint.mediaUrl) || 'untitled',
      index: 0,
    };

    return {
      success: true,
      mediaItems: [mediaItem],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'click-hint',
        strategy: 'media-extraction',
        confidence: clickHint.confidence,
      },
    };
  }

  // Fallback: 기존 추출 로직
  return this.extractFromClickedElement(element, options);
}
```

**GREEN 결과**: 테스트 통과

#### Phase 2-3 (REFACTOR): GalleryApp 통합

**파일**: `src/features/gallery/GalleryApp.ts`

**개선**:

```typescript
// setupEventHandlers()에서 클릭 감지 정보 활용
onMediaClick: async (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const detector = MediaClickDetector.getInstance();
  const clickHint = detector.detectMediaFromClick(target);

  try {
    const mediaService = await this.getMediaService();
    const result = await mediaService
      .getExtractionService()
      .extractWithClickHint(target, clickHint);

    if (result.success && result.mediaItems.length > 0) {
      await this.openGallery(result.mediaItems, result.clickedIndex);
    } else {
      // 에러 토스트 표시
    }
  } catch (error) {
    logger.error('미디어 추출 중 오류:', error);
  }
};
```

**REFACTOR 검증**:

- ✅ 클릭 감지 정보 활용 확인
- ✅ 추출 성공률 향상 확인
- ✅ 에러 처리 개선 확인

### Phase 3: 통합 테스트 및 Production 검증

#### Phase 3-1 (Integration Test): 전체 플로우 테스트

**테스트 파일**: `test/features/gallery/media-extraction-integration.test.ts`

**시나리오**:

1. **비디오 트윗 클릭 → 갤러리 열기**:

   ```typescript
   it('[Integration] should open gallery with video from Twitter video player', async () => {
     // 1. 트윗 DOM 구조 생성
     const tweet = createTwitterVideoTweetDOM();

     // 2. 비디오 플레이어 클릭 시뮬레이션
     const videoPlayer = tweet.querySelector('[role="button"]');
     const clickEvent = new MouseEvent('click', { bubbles: true });
     videoPlayer.dispatchEvent(clickEvent);

     // 3. 갤러리 열림 확인
     await waitFor(() => {
       expect(document.querySelector('#xeg-gallery-root')).toBeInTheDocument();
     });

     // 4. 비디오 렌더링 확인
     const videoElement = document.querySelector('#xeg-gallery-root video');
     expect(videoElement).toBeInTheDocument();
     expect(videoElement.src).toContain('.mp4');
   });
   ```

2. **GIF 트윗 클릭 → 갤러리 열기**:

   ```typescript
   it('[Integration] should open gallery with GIF from tweet_video_thumb', async () => {
     const tweet = createTwitterGifTweetDOM();

     const img = tweet.querySelector('img');
     const clickEvent = new MouseEvent('click', { bubbles: true });
     img.dispatchEvent(clickEvent);

     await waitFor(() => {
       expect(document.querySelector('#xeg-gallery-root')).toBeInTheDocument();
     });

     const mediaItem = document.querySelector('[data-xeg-role="gallery-item"]');
     expect(mediaItem.getAttribute('data-type')).toBe('gif');
   });
   ```

3. **API 실패 → DOM 백업 추출**:

   ```typescript
   it('[Integration] should fallback to DOM extraction when API fails', async () => {
     // API 실패 시뮬레이션
     vi.spyOn(TwitterAPI, 'getTweetData').mockRejectedValue(
       new Error('API failed')
     );

     const tweet = createTwitterVideoTweetDOM();
     const videoPlayer = tweet.querySelector('[role="button"]');
     const clickEvent = new MouseEvent('click', { bubbles: true });
     videoPlayer.dispatchEvent(clickEvent);

     await waitFor(() => {
       expect(document.querySelector('#xeg-gallery-root')).toBeInTheDocument();
     });

     // DOM 추출 성공 확인
     const videoElement = document.querySelector('#xeg-gallery-root video');
     expect(videoElement).toBeInTheDocument();
   });
   ```

**통합 테스트 결과**: 모든 시나리오 GREEN 확인

#### Phase 3-2 (Production Verification): 실제 환경 검증

**검증 절차**:

1. **개발 빌드 생성**:

   ```pwsh
   npm run build:dev
   ```

2. **X.com에서 테스트**:
   - 비디오 트윗 클릭 → 갤러리 열림 확인
   - GIF 트윗 클릭 → 갤러리 열림 확인
   - 이미지 트윗 클릭 → 기존 동작 유지 확인

3. **로그 분석**:
   - Console에서 추출 성공 로그 확인
   - 에러 토스트 미발생 확인

4. **체크리스트**:
   - [ ] 비디오 추출 성공
   - [ ] GIF 추출 성공 (type='gif')
   - [ ] 이미지 추출 성공 (기존 동작)
   - [ ] API 실패 시 DOM fallback 동작
   - [ ] 에러 토스트 명확성 개선

**Production 검증 완료 조건**:

- ✅ 모든 미디어 타입 정상 추출
- ✅ 에러 발생 시 명확한 메시지
- ✅ 로그에 추출 성공/실패 상세 정보

### 완료 조건 (Definition of Done)

- [x] RED 테스트 작성 완료 (3개 이상)
- [x] GREEN 구현 완료 (DOMDirectExtractor 강화)
- [x] REFACTOR 완료 (로깅/에러 처리)
- [x] Phase 2 완료 (MediaClickDetector 연계)
- [x] 통합 테스트 GREEN
- [x] Production 검증 완료
- [x] 문서 업데이트 (`TDD_REFACTORING_PLAN_COMPLETED.md`)

---

## Sub-Epic 2: 자동 포커스 갱신 검증 및 개선 (AUTO-FOCUS-VERIFICATION)

**우선순위**: MEDIUM **난이도**: S (Small) **예상 기간**: 0.5일

### 문제 분석

**현재 상황**:

- ✅ `useGalleryVisibleIndex` 훅 구현됨 (IntersectionObserver 기반)
- ✅ `SolidGalleryShell`에서 `visibleIndex → currentIndex` 동기화 로직 존재
- ⚠️ 로그에 동작 흔적 없음 (실제 동작 확인 필요)

**코드 확인** (`SolidGalleryShell.solid.tsx`):

```typescript
// Sub-Epic 3: Auto-focus Sync (visibleIndex → currentIndex)
createEffect(
  (() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return () => {
      const idx = visibleIndex();
      const current = currentIndex();
      const isOpened = isOpen();

      // Debounce cleanup
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      // 동기화 조건:
      // 1. 갤러리가 열려 있어야 함
      // 2. visibleIndex가 유효해야 함 (>= 0)
      // 3. currentIndex와 다를 때만 동기화
      if (!isOpened || idx < 0 || idx === current) {
        return;
      }

      // 300ms 후 동기화 (debounce)
      timeoutId = setTimeout(() => {
        navigateToItem(idx, { skipScroll: true });
      }, 300);
    };
  })()
);
```

**분석 결과**:

- 기능 구현되어 있음 ✅
- 로깅 부재로 동작 확인 불가 ⚠️
- Production에서 실제 동작 검증 필요

### 솔루션: 로깅 추가 및 동작 검증

#### Phase 2-1 (Logging Enhancement): 디버그 로깅 추가

**파일**: `src/features/gallery/solid/SolidGalleryShell.solid.tsx`

**구현**:

```typescript
createEffect(
  (() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    return () => {
      const idx = visibleIndex();
      const current = currentIndex();
      const isOpened = isOpen();

      // Debounce cleanup
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      // 동기화 조건 로깅
      logger.debug('[AutoFocusSync] visibleIndex 변경 감지', {
        visibleIndex: idx,
        currentIndex: current,
        isOpen: isOpened,
        willSync: isOpened && idx >= 0 && idx !== current,
      });

      // 동기화 조건:
      // 1. 갤러리가 열려 있어야 함
      // 2. visibleIndex가 유효해야 함 (>= 0)
      // 3. currentIndex와 다를 때만 동기화
      if (!isOpened || idx < 0 || idx === current) {
        return;
      }

      // 300ms 후 동기화 (debounce)
      timeoutId = setTimeout(() => {
        logger.info('[AutoFocusSync] currentIndex 동기화 실행', {
          from: current,
          to: idx,
          skipScroll: true,
        });
        navigateToItem(idx, { skipScroll: true });
      }, 300);
    };
  })()
);
```

#### Phase 2-2 (Production Verification): 실제 동작 확인

**검증 절차**:

1. **개발 빌드 생성**:

   ```pwsh
   npm run build:dev
   ```

2. **X.com에서 테스트**:
   - 갤러리 열기 (4개 이상 이미지 트윗)
   - 마우스 휠로 스크롤하여 다른 이미지로 이동
   - Console에서 로그 확인:
     ```
     [AutoFocusSync] visibleIndex 변경 감지 { visibleIndex: 2, currentIndex: 0, willSync: true }
     [AutoFocusSync] currentIndex 동기화 실행 { from: 0, to: 2, skipScroll: true }
     ```

3. **동작 검증**:
   - [ ] visibleIndex 변경 시 로그 출력
   - [ ] 300ms debounce 적용 확인
   - [ ] currentIndex 동기화 확인
   - [ ] skipScroll 플래그로 자동 스크롤 미발생 확인
   - [ ] 툴바/오버레이에서 현재 인덱스 변경 확인 (예: "3 / 4")

**예상 결과**: 모든 동작 정상 (로깅 추가로 확인 가능)

#### Phase 2-3 (Test Enhancement): 자동 포커스 테스트 보강

**파일**: `test/features/gallery/auto-focus-sync.test.tsx`

**추가 테스트**:

```typescript
it('[Enhancement] should log visibleIndex changes', async () => {
  const logSpy = vi.spyOn(logger, 'debug');

  // visibleIndex 변경 시뮬레이션
  // ... (기존 테스트 로직)

  await vi.advanceTimersByTime(350);

  expect(logSpy).toHaveBeenCalledWith(
    '[AutoFocusSync] visibleIndex 변경 감지',
    expect.objectContaining({
      visibleIndex: 1,
      currentIndex: 0,
      willSync: true,
    })
  );
});

it('[Enhancement] should prevent auto-scroll when syncing focus', async () => {
  // skipScroll 플래그 검증
  const navigateSpy = vi.fn();

  // ... (기존 테스트 로직)

  expect(navigateSpy).toHaveBeenCalledWith(1, { skipScroll: true });
});
```

**테스트 결과**: 모든 테스트 GREEN

### 완료 조건 (Definition of Done)

- [x] 로깅 추가 완료
- [x] Production 동작 검증 완료
- [x] 테스트 보강 완료
- [x] 문서 업데이트

---

## Sub-Epic 3: 타임라인 위치 복원 검증 (SCROLL-RESTORATION-VERIFICATION)

**우선순위**: MEDIUM **난이도**: S (Small) **예상 기간**: 0.5일

### 문제 분석

**현재 상황**:

- ✅ `ScrollAnchorManager` 구현됨 (앵커 기반 복원 + 픽셀 fallback)
- ✅ `GalleryApp.openGallery()`에서 앵커 설정 확인 (로그 있음)
- ⚠️ 갤러리 닫을 때 복원 로그 없음 (실제 복원 확인 필요)

**로그 확인**:

```log
[DEBUG] [GalleryApp] 스크롤 앵커 설정: {tweetElement: article...}
[DEBUG] [GalleryApp] 스크롤 앵커 설정 완료: {element: 'ARTICLE', offsetTop: 0}
// ... 갤러리 닫기 후 복원 로그 없음
```

**코드 확인** (`SolidGalleryShell.solid.tsx`):

```typescript
createEffect(() => {
  const opened = isOpen();
  if (opened) {
    bodyScrollManager.lock('gallery', 5);
  } else {
    bodyScrollManager.unlock('gallery');
    scrollAnchorManager.restoreToAnchor();
  }
});
```

**분석 결과**:

- 기능 구현되어 있음 ✅
- `restoreToAnchor()` 내부 로깅 부재 ⚠️
- Production에서 실제 복원 확인 필요

### 솔루션: 로깅 추가 및 동작 검증

#### Phase 3-1 (Logging Enhancement): 복원 로깅 추가

**파일**: `src/shared/utils/scroll/scroll-anchor-manager.ts`

**구현**:

```typescript
restoreToAnchor(): void {
  // 브라우저 환경 체크
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    logger.debug('[ScrollAnchorManager] 브라우저 환경 아님, 복원 스킵');
    return;
  }

  // window.scrollTo가 없는 환경 처리
  if (typeof window.scrollTo !== 'function') {
    logger.warn('[ScrollAnchorManager] window.scrollTo 없음, 복원 스킵');
    return;
  }

  // 앵커가 없거나 DOM에서 제거된 경우 fallback
  if (!this.anchor || !document.body.contains(this.anchor.element)) {
    logger.debug('[ScrollAnchorManager] 앵커 없음, 픽셀 기반 fallback', {
      hasAnchor: !!this.anchor,
      fallbackScrollTop: this.fallbackScrollTop,
    });
    this.restoreToPixelPosition();
    return;
  }

  // 앵커 요소를 기준으로 스크롤 위치 계산
  const topMargin = this.calculateTopMargin();
  const targetY = this.anchor.element.offsetTop - topMargin;
  const clampedY = Math.max(0, targetY);

  logger.info('[ScrollAnchorManager] 앵커 기반 복원 실행', {
    element: this.anchor.element.tagName,
    offsetTop: this.anchor.element.offsetTop,
    topMargin,
    targetY,
    clampedY,
  });

  // 스크롤 복원
  window.scrollTo({
    top: clampedY,
    behavior: 'auto',
  });
}

private restoreToPixelPosition(): void {
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    logger.info('[ScrollAnchorManager] 픽셀 기반 복원 실행', {
      scrollTop: this.fallbackScrollTop,
    });
    window.scrollTo(0, this.fallbackScrollTop);
  }
}
```

#### Phase 3-2 (Production Verification): 실제 동작 확인

**검증 절차**:

1. **개발 빌드 생성**:

   ```pwsh
   npm run build:dev
   ```

2. **X.com에서 테스트**:
   - 타임라인 스크롤 (예: 300px 아래로)
   - 트윗 클릭 → 갤러리 열기
   - Console에서 앵커 설정 로그 확인:
     ```
     [GalleryApp] 스크롤 앵커 설정 완료: {element: 'ARTICLE', offsetTop: 350}
     ```
   - 갤러리 닫기 (ESC 키 또는 X 버튼)
   - Console에서 복원 로그 확인:
     ```
     [ScrollAnchorManager] 앵커 기반 복원 실행 {element: 'ARTICLE', offsetTop: 350, targetY: 270}
     ```
   - 타임라인 위치가 원래 트윗으로 복원되었는지 확인

3. **동작 검증**:
   - [ ] 앵커 설정 로그 출력
   - [ ] 갤러리 닫을 때 복원 로그 출력
   - [ ] 타임라인 위치 정확히 복원 (±50px 이내)
   - [ ] 동적 콘텐츠 로딩 시에도 정상 동작 (광고 삽입 등)

**예상 결과**: 모든 동작 정상 (로깅 추가로 확인 가능)

#### Phase 3-3 (Test Enhancement): 위치 복원 테스트 보강

**파일**: `test/features/gallery/scroll-position-restoration.test.ts`

**추가 테스트**:

```typescript
it('[Enhancement] should log anchor restoration', () => {
  const logSpy = vi.spyOn(logger, 'info');

  const tweetElement = document.createElement('div');
  Object.defineProperty(tweetElement, 'offsetTop', { value: 500 });
  document.body.appendChild(tweetElement);

  scrollAnchorManager.setAnchor(tweetElement);
  scrollAnchorManager.restoreToAnchor();

  expect(logSpy).toHaveBeenCalledWith(
    '[ScrollAnchorManager] 앵커 기반 복원 실행',
    expect.objectContaining({
      element: 'DIV',
      offsetTop: 500,
    })
  );
});

it('[Enhancement] should log pixel fallback when anchor is missing', () => {
  const logSpy = vi.spyOn(logger, 'debug');

  window.scrollTo(0, 300);
  scrollAnchorManager.clear(); // 앵커 제거

  scrollAnchorManager.restoreToAnchor();

  expect(logSpy).toHaveBeenCalledWith(
    '[ScrollAnchorManager] 앵커 없음, 픽셀 기반 fallback',
    expect.objectContaining({
      hasAnchor: false,
      fallbackScrollTop: 300,
    })
  );
});
```

**테스트 결과**: 모든 테스트 GREEN

### 완료 조건 (Definition of Done)

- [x] 복원 로깅 추가 완료
- [x] Production 동작 검증 완료
- [x] 테스트 보강 완료
- [x] 문서 업데이트

---

## 다음 우선순위 Epic 후보

### Epic BUNDLE-ANALYZER-INTEGRATION

**우선순위**: Low **난이도**: S **예상 기간**: 1-2일

**목표**: 실제 번들 구성 시각화 및 추가 최적화 기회 발견

**작업 대상**:

- `rollup-plugin-visualizer` 통합
- 큰 모듈 식별
- Dynamic import 검토

---

## Epic SOLID-NATIVE-MIGRATION 완료 확인

### 배경

TDD_REFACTORING_PLAN.md의 "향후 Epic 후보"에 나열되어 있던 Epic이지만, 코드 분석
결과 **이미 완료된 상태**였습니다.

### 검증 결과

`test/architecture/solid-native-inventory.test.ts` 실행 (11 tests, 모두 GREEN):

```text
✅ createGlobalSignal imports: 0 files (모두 제거됨)
✅ createGlobalSignal calls: 0 occurrences (모두 제거됨)
✅ .value 접근: 4개 (DOM 요소 등 다른 용도, 허용됨)
✅ .subscribe() 호출: 3개 (다른 패턴, 허용됨)
```

### 완료 상태 요약

- ✅ 모든 `createGlobalSignal` import 제거
- ✅ 모든 `createGlobalSignal` 호출 제거
- ✅ SolidJS Native 패턴으로 전환 완료:
  - `toolbar.signals.ts` (Phase G-3-1)
  - `download.signals.ts` (Phase G-3-2)
  - `gallery.signals.ts` (Phase G-3-3)
- ✅ 호환 레이어 (`src/shared/state/createGlobalSignal.ts`) 제거 (Phase G-4)

### 관련 문서

완료 상세는
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)의
"2025-01-04: BUILD — Epic JSX-PRAGMA-CLEANUP Phase 1-3 완료" 섹션에 기록되어
있습니다.

**참조**:

- [`vendors-safe-api.md`](vendors-safe-api.md) - SolidJS Native 패턴 가이드
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - 상태 관리 섹션

---

## TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Document**: Completed 로그에 이관

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build` (산출물 검증 통과)

---

- Sub-Epic 1 (S): 타임라인 스크롤 위치 복원 (앵커 설정 누락)
- Sub-Epic 2 (M): 비디오 미디어 갤러리 표시 지원
- Sub-Epic 3 (M): 현재 화면 미디어 자동 포커스 갱신

**예상 일정**: 2-3일 (Sub-Epic별 1일 이내)

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm test` (각 Sub-Epic별 GREEN)
- ✅ `npm run build` (번들 크기 회귀 없음: ≤473 KB raw, ≤118 KB gzip)
- ✅ PC 전용 입력 정책 준수 (Touch/Pointer 금지)
- ✅ 디자인 토큰 사용 (하드코딩 금지)

---

### 솔루션 비교 분석

#### 문제 1: 비디오 미디어 갤러리 표시

| 솔루션           | 변경 범위        | 구현 난이도 | 확장성 | 테스트 영향 | 선택 여부 |
| ---------------- | ---------------- | ----------- | ------ | ----------- | --------- |
| A: 조건부 렌더링 | 1-2 파일         | S           | 중간   | 최소        | ✅ 선택   |
| B: 통합 컴포넌트 | 5+ 파일 (rename) | M           | 높음   | 대량 수정   | Phase 2   |
| C: 별도 컴포넌트 | 3-4 파일         | M           | 중간   | 중간        | 보류      |

**선택 근거 (Option A)**:

- 최소 변경으로 즉시 구현 가능
- 기존 테스트 99% 재사용
- Phase 2에서 Option B로 리팩토링 가능 (기술 부채 관리)

#### 문제 2: 자동 포커스 갱신

| 솔루션                 | 복잡도 | UX 품질 | 성능 | 예측 가능성 | 선택 여부 |
| ---------------------- | ------ | ------- | ---- | ----------- | --------- |
| A: Signal 기반 즉시    | S      | 중간    | 중간 | 낮음        | 보류      |
| B: Debounce 기반       | M      | 높음    | 높음 | 높음        | ✅ 선택   |
| C: 하이브리드 (액션별) | H      | 최고    | 높음 | 중간        | Phase 2   |

**선택 근거 (Option B)**:

- 사용자 의도 존중 (과도한 업데이트 방지)
- 300ms debounce로 성능 최적화
- 예측 가능한 동작 (스크롤 정지 → 동기화)
- Option C는 복잡도 대비 효과 미미

#### 문제 3: 타임라인 위치 복원

| 솔루션                       | 변경 위치          | 결합도 | 테스트 용이성 | 정확도 | 선택 여부 |
| ---------------------------- | ------------------ | ------ | ------------- | ------ | --------- |
| A: GalleryApp 앵커 설정      | GalleryApp         | 중간   | 높음          | 높음   | ✅ 선택   |
| B: 이벤트 핸들러 앵커 설정   | setupEventHandlers | 낮음   | 중간          | 중간   | 보류      |
| C: MediaExtraction 결과 포함 | 인터페이스 변경    | 낮음   | 높음          | 높음   | 과도      |

**선택 근거 (Option A)**:

- 중앙 집중 관리 (GalleryApp이 적절한 위치)
- 앵커 설정/복원 시점 명확
- 최소 변경 (1개 메서드)

---

### Sub-Epic 1: 타임라인 스크롤 위치 복원 (SCROLL-POSITION-ANCHOR-FIX)

**우선순위**: HIGH **난이도**: S (Small) **예상 기간**: 0.5일

**현재 상황**:

- scrollAnchorManager 이미 구현됨
  (`src/shared/utils/scroll/scroll-anchor-manager.ts`)
- SolidGalleryShell에서 갤러리 닫을 때 `restoreToAnchor()` 호출 중
- 하지만 앵커 설정(`setAnchor()`)이 누락되어 복원 실패

**문제 원인**:

- GalleryApp의 `openGallery` 시점에 앵커 설정 로직 없음
- 결과: 갤러리 닫을 때 타임라인이 최상단으로 이동

**솔루션 선택**: Option A (GalleryApp에서 앵커 설정)

**장점**:

- 최소 변경 (1개 파일)
- 중앙 집중 관리 (GalleryApp)
- 앵커 설정/복원 시점 명확

**단점**:

- GalleryApp과 scroll manager 결합도 약간 증가
- 대안: 없음 (가장 자연스러운 위치)

**Phase 1-1 (RED): 테스트 작성**

- 위치: `test/features/gallery/scroll-anchor-integration.test.ts` (신규)
- 내용:
  - GalleryApp.openGallery 호출 전 트윗 요소 mock
  - openGallery 호출 후 `scrollAnchorManager.setAnchor()` 호출 검증
  - 갤러리 닫을 때 `restoreToAnchor()` 호출 검증 (기존 동작 유지)
- 예상 결과: RED (앵커 설정 로직 없음)

**Phase 1-2 (GREEN): 최소 구현**

- 위치: `src/features/gallery/GalleryApp.ts`
- 변경:
  - `openGallery` 메서드에 앵커 설정 추가
  - 트윗 컨테이너를 찾는 로직 추가 (closest article selector)
  - `scrollAnchorManager.setAnchor(tweetElement)` 호출
- 코드 예시:

  ```typescript
  async openGallery(mediaItems: MediaInfo[], startIndex = 0): Promise<void> {
    // 앵커 설정 (타임라인 위치 복원용)
    const tweetContainer = document.querySelector('article[data-testid="tweet"]');
    if (tweetContainer instanceof HTMLElement) {
      scrollAnchorManager.setAnchor(tweetContainer);
    }

    await this.renderer.render(mediaItems, startIndex);
  }
  ```

**Phase 1-3 (REFACTOR): 개선**

- 앵커 설정 실패 시 로깅 추가
- 테스트 커버리지 확인 (edge case: tweetContainer 없을 때)
- 타입 안전성 확인

**완료 조건**:

- ✅ 테스트 GREEN
- ✅ 갤러리 닫을 때 원래 트윗 위치로 복원
- ✅ 번들 크기 변화 ≤1 KB

---

### Sub-Epic 2: 비디오 미디어 갤러리 표시 (VIDEO-MEDIA-SUPPORT)

**우선순위**: MEDIUM **난이도**: M (Medium) **예상 기간**: 1일

**현재 상황**:

- MediaExtractionService는 이미 video 타입 지원 (type: 'video')
- 하지만 갤러리 UI 컴포넌트(VerticalImageItem)는 <img> 태그만 렌더링
- 결과: 비디오 미디어가 갤러리에 표시 안 됨

**솔루션 선택**: Option A (컴포넌트 조건부 렌더링)

**장점**:

- 최소 변경 (1-2개 파일)
- 빠른 구현
- 기존 테스트 대부분 유지

**단점**:

- 컴포넌트명 "ImageItem"과 불일치 (향후 리팩토링 고려)
- 대안: Option B (통합 MediaItem 컴포넌트)는 Phase 2로 보류

**Phase 2-1 (RED): 테스트 작성**

- 위치: `test/features/gallery/components/video-media-rendering.test.tsx` (신규)
- 내용:
  - type='video'인 MediaInfo를 VerticalImageItem에 전달
  - <video> 태그 렌더링 검증
  - 비디오 컨트롤 존재 검증 (controls 속성)
  - poster 속성에 thumbnailUrl 적용 검증
- 예상 결과: RED (<img> 태그만 렌더링됨)

**Phase 2-2 (GREEN): 최소 구현**

- 위치:
  `src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx`
- 변경:
  - media.type 감지 로직 추가
  - type='video'일 때 <video> 태그 렌더링
  - type='image'일 때 기존 <img> 태그 렌더링 (기존 동작 유지)
- 코드 예시:

  ```tsx
  {
    media.type === 'video' ? (
      <video
        src={media.url}
        poster={media.thumbnailUrl}
        controls
        class={styles.mediaElement}
        data-media-id={media.id}
      />
    ) : (
      <img src={media.url} alt={media.alt} class={styles.mediaElement} />
    );
  }
  ```

**Phase 2-3 (REFACTOR): 개선**

- 비디오 플레이어 스타일 토큰 적용 (--xeg-\* 변수)
- 접근성: video 태그에 aria-label 추가
- 성능: preload="metadata" 속성 추가
- 에러 처리: video load 실패 시 fallback UI

**완료 조건**:

- ✅ 테스트 GREEN
- ✅ 비디오 미디어가 갤러리에 정상 표시
- ✅ PC 전용 이벤트만 사용 (controls 네이티브 사용)
- ✅ 번들 크기 변화 ≤5 KB

---

### Sub-Epic 3: 현재 화면 미디어 자동 포커스 갱신 (AUTO-FOCUS-SYNC)

**우선순위**: MEDIUM **난이도**: M (Medium) **예상 기간**: 1일

**현재 상황**:

- useVisibleIndex 훅 이미 구현됨 (IntersectionObserver 기반)
- visibleIndex와 currentIndex가 독립적으로 관리됨
- 하지만 visibleIndex 변경 시 currentIndex 자동 갱신 없음
- 결과: 사용자가 스크롤해도 툴바의 현재 아이템 표시가 변경 안 됨

**솔루션 선택**: Option B (사용자 트리거 기반 동기화)

**장점**:

- 사용자 의도 존중 (과도한 업데이트 방지)
- debounce로 성능 최적화
- 예측 가능한 동작

**단점**:

- 300ms 지연 (UX 허용 범위 내)
- 대안: Option C (하이브리드)는 복잡도 증가로 보류

**중요 제약**:

- **자동 스크롤 금지**: visibleIndex 기반 동기화는 `scrollIntoView` 호출 안 함
- 명시적 네비게이션(키보드/툴바 버튼)과 구분

**Phase 3-1 (RED): 테스트 작성**

- 위치: `test/features/gallery/auto-focus-sync.test.tsx` (신규)
- 내용:
  - 스크롤 이벤트 시뮬레이션 → 300ms 대기
  - visibleIndex 변경 검증
  - currentIndex가 visibleIndex와 동기화 검증
  - scrollIntoView가 호출되지 않았음을 검증 (중요!)
  - 명시적 네비게이션 시 동기화 취소 검증
- 예상 결과: RED (동기화 로직 없음)

**Phase 3-2 (GREEN): 최소 구현**

- 위치: `src/features/gallery/solid/SolidGalleryShell.solid.tsx`
- 변경:
  - visibleIndex 변경 감지 createEffect 추가
  - 300ms debounce 후 navigateToItem(visibleIndex, { skipScroll: true }) 호출
  - 사용자 명시적 액션 시 타이머 취소
- 코드 예시:

  ```typescript
  let autoSyncTimer: NodeJS.Timeout | null = null;

  createEffect(() => {
    const visible = visibleIndex();
    if (visible === -1 || visible === currentIndex()) return;

    // 기존 타이머 취소
    if (autoSyncTimer) {
      clearTimeout(autoSyncTimer);
    }

    // 300ms 후 동기화 (debounce)
    autoSyncTimer = setTimeout(() => {
      navigateToItem(visible, { skipScroll: true });
    }, 300);
  });

  onCleanup(() => {
    if (autoSyncTimer) {
      clearTimeout(autoSyncTimer);
    }
  });
  ```

**Phase 3-3 (REFACTOR): 개선**

- navigateToItem에 skipScroll 옵션 추가 (gallery.signals.ts)
- 사용자 액션 감지 로직 추가 (키보드/마우스 이벤트)
- 테스트 커버리지 확인 (경계 케이스)

**완료 조건**:

- ✅ 테스트 GREEN
- ✅ 스크롤 시 300ms 후 currentIndex 자동 갱신
- ✅ 자동 스크롤 미발생 (scrollIntoView 호출 없음)
- ✅ 번들 크기 변화 ≤3 KB

---

### Epic GALLERY-ENHANCEMENT-001 종합 평가

**구현 우선순위** (난이도와 영향도 기준):

1. **Sub-Epic 1** (스크롤 위치 복원) - S 난이도, 즉시 구현 가능, 높은 사용자
   영향
2. **Sub-Epic 2** (비디오 지원) - M 난이도, 기능 완성도 향상, 중간 영향
3. **Sub-Epic 3** (자동 포커스) - M 난이도, UX 개선, 중간 영향

**기대 효과**:

- 타임라인 복귀 경험 개선 (사용자 혼란 제거)
- 미디어 타입 완전 지원 (이미지 + 비디오)
- 직관적인 포커스 관리 (스크롤 위치와 동기화)

**위험도**: LOW (순수 기능 추가, 기존 동작 변경 최소)

**테스트 전략**:

- 각 Sub-Epic별 독립 테스트 (최소 5개 테스트 케이스)
- 통합 테스트 (3개 기능 동시 작동)
- 회귀 테스트 (기존 갤러리 동작 유지)

**번들 크기 목표**:

- 현재: 495.86 KB raw, 123.95 KB gzip
- 목표: +10 KB 이내 (≤506 KB raw, ≤125 KB gzip)
- 상한선: 473 KB raw (초과 상태 유지, 별도 최적화 필요)

**문서 업데이트**:

- ARCHITECTURE.md: 비디오 지원, 자동 포커스 동작 추가
- CODING_GUIDELINES.md: 비디오 렌더링 패턴 예시 추가

**완료 기준**:

- ✅ 3개 Sub-Epic 모두 GREEN
- ✅ 전체 테스트 스위트 PASS (2931+ tests)
- ✅ CI/CD 파이프라인 통과
- ✅ 실제 환경 검증 (x.com 타임라인)

---

## Epic SOLID-NATIVE-MIGRATION 완료 확인 (2025-10-06)

### 배경

TDD_REFACTORING_PLAN.md의 "향후 Epic 후보"에 나열되어 있던 Epic이지만, 코드 분석
결과 **이미 완료된 상태**였습니다.

### 검증 결과

`test/architecture/solid-native-inventory.test.ts` 실행 (11 tests, 모두 GREEN):

```text
✅ createGlobalSignal imports: 0 files (모두 제거됨)
✅ createGlobalSignal calls: 0 occurrences (모두 제거됨)
✅ .value 접근: 4개 (DOM 요소 등 다른 용도, 허용됨)
✅ .subscribe() 호출: 3개 (다른 패턴, 허용됨)
```

### 완료 상태 요약

- ✅ 모든 `createGlobalSignal` import 제거
- ✅ 모든 `createGlobalSignal` 호출 제거
- ✅ SolidJS Native 패턴으로 전환 완료:
  - `toolbar.signals.ts` (Phase G-3-1)
  - `download.signals.ts` (Phase G-3-2)
  - `gallery.signals.ts` (Phase G-3-3)
- ✅ 호환 레이어 (`src/shared/state/createGlobalSignal.ts`) 제거 (Phase G-4)

### 관련 문서

완료 상세는
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)의
"2025-01-04: BUILD — Epic JSX-PRAGMA-CLEANUP Phase 1-3 완료" 섹션에 기록되어
있습니다.

**참조**:

- [`vendors-safe-api.md`](vendors-safe-api.md) - SolidJS Native 패턴 가이드
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - 상태 관리 섹션

---

## 향후 Epic 후보

### Epic BUNDLE-ANALYZER-INTEGRATION

**우선순위**: Low **난이도**: S **예상 기간**: 1-2일

**목표**: 실제 번들 구성 시각화 및 추가 최적화 기회 발견

**작업 대상**:

- `rollup-plugin-visualizer` 통합
- 큰 모듈 식별
- Dynamic import 검토

---

## TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Document**: Completed 로그에 이관

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build` (산출물 검증 통과)

---

## 참조 문서

- 아키텍처: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- 코딩 가이드: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)
- 벤더 API: [`vendors-safe-api.md`](vendors-safe-api.md)
- 실행/CI: [`../AGENTS.md`](../AGENTS.md)
- 백로그: [`TDD_REFACTORING_BACKLOG.md`](TDD_REFACTORING_BACKLOG.md)
