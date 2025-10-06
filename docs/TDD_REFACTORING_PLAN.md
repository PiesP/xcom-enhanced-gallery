# TDD 리팩토링 활성 계획

> 프로젝트 개선을 위한 TDD 기반 리팩토링 작업 관리

**최근 업데이트**: 2025-10-06 **현재 상태**: Production 환경 검증 필요 ⚠️

완료된 내용은
[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서
확인하실 수 있습니다.

---

## 프로젝트 현황

### 테스트 상태

- **전체 테스트**: 2954 passed | 110 skipped | 1 todo (3065 total)
- **상태**: ✅ GREEN (테스트 환경)
- **Production 상태**: ⚠️ 실제 X.com 환경에서 일부 기능 미작동 보고됨

### 번들 크기 (2025-10-06)

- **Raw**: 495.86 KB (목표: ≤473 KB, **22.86 KB 초과** ⚠️)
- **Gzip**: 123.95 KB (목표: ≤118 KB, **5.95 KB 초과** ⚠️)
- **이상적 목표**: Raw 420 KB, Gzip 105 KB

### 최근 완료 (2025-10-06)

- ✅ **Epic GALLERY-ENHANCEMENT-001**: 갤러리 UX 개선
  - Sub-Epic 1: 타임라인 스크롤 위치 복원 (scrollAnchorManager)
  - Sub-Epic 2: 비디오 미디어 렌더링 검증
  - Sub-Epic 3: 자동 포커스 동기화 (자동 스크롤 없이)

---

## 🔥 긴급: Production 환경 이슈

### 문제 상황

**보고일**: 2025-10-06 **심각도**: High **영향 범위**: 실제 X.com 환경 사용자

**증상**:

1. 이미지 외 미디어(비디오/GIF)가 갤러리에 표시되지 않음
2. 자동 포커스 동기화가 실제 환경에서 작동하지 않음
3. 타임라인 위치 복원이 일부 케이스에서 실패

**테스트 상태**: ✅ 모든 테스트 통과 (2954/3065) **근본 원인**: 테스트 환경
DOM과 실제 X.com DOM 구조 불일치 추정

---

## 현재 활성 작업

### Epic PRODUCTION-ENVIRONMENT-VALIDATION

**목표**: 실제 X.com 환경에서 구현된 기능들이 정상 작동하도록 보장 **우선순위**:
🔥 Urgent **난이도**: M **예상 기간**: 2-3일 **담당**: Core Team

#### 컨텍스트

Epic GALLERY-ENHANCEMENT-001에서 구현된 세 가지 핵심 기능이 테스트 환경에서는
모두 GREEN이지만, 실제 X.com 환경에서는 제대로 작동하지 않는 문제가 보고됨.

**참고 커밋**:

- 68ae6dbc: Epic GALLERY-ENHANCEMENT-001 완료
- 897ad74d: Auto-focus sync 구현
- 5c8b8d33: Scroll anchor 통합
- 434bb7b4: Video rendering 검증

#### Sub-Epic 1: 실제 DOM 구조 기반 미디어 추출 강화

**목표**: X.com의 실제 DOM 구조를 기반으로 비디오/GIF 추출 로직 개선

**현재 상황**:

- ✅ DOMDirectExtractor: 비디오 추출 로직 구현됨
- ✅ TwitterAPIExtractor: API 기반 추출 지원
- ❌ 실제 X.com에서 작동 안 함 (테스트는 통과)

**솔루션 옵션 비교**:

| 옵션                                     | 장점                                                          | 단점                                                          | 난이도 | 추천도            |
| ---------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------ | ----------------- |
| **A. 실제 DOM 구조 분석 후 셀렉터 보강** | - 근본적 해결<br>- 안정적 동작 보장<br>- 장기적 유지보수 용이 | - X.com 접근 필요<br>- 분석 시간 소요<br>- DOM 변경 시 재작업 | M      | ⭐⭐⭐⭐⭐        |
| **B. 폴백 전략 추가 (다중 셀렉터)**      | - 빠른 구현<br>- 여러 패턴 대응                               | - 코드 복잡도 증가<br>- 완벽한 해결 아님                      | S      | ⭐⭐⭐            |
| **C. 로깅 강화 후 사용자 피드백 수집**   | - 정확한 원인 파악<br>- 데이터 기반 개선                      | - 해결까지 시간 소요<br>- 사용자 불편 지속                    | S      | ⭐⭐              |
| **D. E2E 테스트 환경 구축 (Playwright)** | - 실제 브라우저 테스트<br>- 회귀 방지 강화                    | - 초기 구축 비용 큼<br>- CI 시간 증가                         | L      | ⭐⭐⭐⭐ (장기적) |

**최적 솔루션**: **Option A + B 조합**

1. 실제 X.com DOM 구조를 분석하여 정확한 셀렉터 식별
2. 기존 셀렉터를 fallback으로 유지하여 다중 패턴 지원
3. 상세 로깅 추가하여 향후 문제 추적 용이성 확보

**Phase 1-1 (RED): 실제 DOM 기반 테스트 케이스 추가**

```typescript
// test/integration/production-dom-extraction.test.ts

describe('Production DOM Extraction', () => {
  describe('X.com 실제 비디오 구조', () => {
    it('[RED] should extract video from current X.com video player structure', async () => {
      // 실제 X.com 비디오 트윗 DOM 구조 재현
      const container = createProductionVideoDOMStructure();
      const extractor = new DOMDirectExtractor();

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].type).toBe('video');
    });

    it('[RED] should extract animated GIF from video element', async () => {
      // X.com GIF 구조 (video 태그로 렌더링됨)
      const container = createProductionGifDOMStructure();
      const extractor = new DOMDirectExtractor();

      const result = await extractor.extract(container, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(result.mediaItems[0].type).toBe('gif');
    });
  });

  describe('셀렉터 폴백 전략', () => {
    it('[RED] should try multiple selectors for video elements', async () => {
      // 다양한 X.com 레이아웃 패턴 테스트
      const patterns = [
        createCurrentVideoStructure(),
        createLegacyVideoStructure(),
        createQuoteTweetVideoStructure(),
      ];

      for (const container of patterns) {
        const result = await extractor.extract(container, {}, 'test-id');
        expect(result.success).toBe(true);
      }
    });
  });
});
```

**Phase 1-2 (GREEN): 개선된 추출 로직 구현**

```typescript
// src/shared/services/media-extraction/extractors/DOMDirectExtractor.ts

private findVideoElements(element: HTMLElement): HTMLVideoElement[] {
  const videos: HTMLVideoElement[] = [];
  const seen = new Set<HTMLVideoElement>();

  const addUnique = (video: HTMLVideoElement | null) => {
    if (video && !seen.has(video)) {
      seen.add(video);
      videos.push(video);
    }
  };

  // Production 환경 우선 셀렉터 (2025-10-06 기준)
  const productionSelectors = [
    // 현재 X.com 비디오 플레이어 구조
    'div[data-testid="videoPlayer"] video',
    '[data-testid="videoComponent"] video',

    // 인라인 비디오
    'div[role="progressbar"] + video',

    // GIF (video 태그로 렌더링)
    'video[playsinline][loop][autoplay]',
  ];

  // 우선순위 순서대로 탐색
  for (const selector of productionSelectors) {
    const matches = element.querySelectorAll<HTMLVideoElement>(selector);
    matches.forEach(v => addUnique(v));
  }

  // Fallback: 기존 로직 (호환성 유지)
  if (videos.length === 0) {
    logger.debug('[DOMDirectExtractor] Production 셀렉터 실패, fallback 시도');
    this.findVideoElementsLegacy(element, addUnique);
  }

  logger.info(`[DOMDirectExtractor] 비디오 ${videos.length}개 발견 (Production mode)`);
  return videos;
}
```

**Phase 1-3 (REFACTOR): 로깅 및 모니터링 강화**

```typescript
// src/shared/services/media-extraction/MediaExtractionService.ts

async extractFromClickedElement(
  element: HTMLElement,
  options: MediaExtractionOptions = {}
): Promise<MediaExtractionResult> {
  const extractionId = this.generateExtractionId();

  // Production 환경 감지
  const isProduction = typeof window !== 'undefined' &&
                       window.location.hostname.includes('x.com');

  logger.info(`[MediaExtractor] ${extractionId}: 추출 시작`, {
    environment: isProduction ? 'production' : 'test',
    elementTag: element.tagName,
    elementClasses: element.className,
  });

  try {
    // ... 기존 로직

    if (isProduction && result.mediaItems.length === 0) {
      // Production 환경에서 추출 실패 시 상세 디버그 정보 수집
      logger.error(`[MediaExtractor] ${extractionId}: Production 추출 실패`, {
        tweetInfo: tweetInfo?.tweetId ?? 'unknown',
        domStructure: this.captureDOMStructureSnapshot(element),
        selectorResults: this.testAllSelectors(element),
      });
    }

    return result;
  } catch (error) {
    logger.error(`[MediaExtractor] ${extractionId}: 오류 발생`, { error });
    throw error;
  }
}

// Production 환경 디버깅 헬퍼
private captureDOMStructureSnapshot(element: HTMLElement): object {
  return {
    tagName: element.tagName,
    classes: element.className,
    attributes: Array.from(element.attributes).map(a => ({
      name: a.name,
      value: a.value.substring(0, 50), // 보안: 긴 값은 잘라냄
    })),
    childrenTags: Array.from(element.children).map(c => c.tagName),
    videoElements: element.querySelectorAll('video').length,
    imgElements: element.querySelectorAll('img').length,
  };
}
```

**완료 조건**:

- [ ] 실제 X.com 비디오 트윗 DOM 구조 분석 완료
- [ ] Production 우선 셀렉터 추가 및 테스트 GREEN
- [ ] Fallback 로직 유지 확인
- [ ] 상세 로깅 추가 (DOM 구조 스냅샷)
- [ ] 회귀 테스트: 기존 2954 테스트 여전히 GREEN
- [ ] Manual 테스트: 실제 X.com에서 비디오 추출 확인

---

#### Sub-Epic 2: 자동 포커스 동기화 Production 검증

**목표**: visibleIndex → currentIndex 자동 동기화가 실제 환경에서 작동하도록
보장

**현재 상황**:

- ✅ useGalleryVisibleIndex 훅 구현됨 (IntersectionObserver 기반)
- ✅ 300ms debounce 적용
- ✅ skipScroll 옵션으로 자동 스크롤 방지
- ❌ 실제 X.com에서 visibleIndex 변경 감지 안 됨 가능성

**솔루션 옵션 비교**:

| 옵션                                          | 장점                                     | 단점                                      | 난이도 | 추천도              |
| --------------------------------------------- | ---------------------------------------- | ----------------------------------------- | ------ | ------------------- |
| **A. IntersectionObserver threshold 조정**    | - 간단한 설정 변경<br>- 즉시 적용 가능   | - 근본 원인 해결 아닐 수 있음             | XS     | ⭐⭐⭐              |
| **B. Scroll 이벤트 기반 폴백 추가**           | - 더 넓은 브라우저 지원<br>- 안정적 동작 | - 성능 오버헤드<br>- 코드 복잡도 증가     | S      | ⭐⭐⭐⭐            |
| **C. RAF(requestAnimationFrame) 기반 재작성** | - 최적 성능<br>- 더 정확한 가시성 추적   | - 대규모 리팩토링 필요<br>- 테스트 재작성 | M      | ⭐⭐⭐⭐⭐ (장기적) |
| **D. 수동 포커스 모드 추가**                  | - 사용자 선택권 제공<br>- 폴백으로 활용  | - UX 복잡도 증가<br>- 근본 해결 아님      | S      | ⭐⭐                |

**최적 솔루션**: **Option A + B 조합**

1. IntersectionObserver threshold를 조정하여 더 민감하게 감지
2. Scroll 이벤트 기반 폴백 추가 (IntersectionObserver 실패 시)
3. 상세 로깅으로 실제 환경 동작 추적

**완료 조건**:

- [ ] IntersectionObserver threshold 조정 및 테스트
- [ ] Scroll 이벤트 기반 폴백 구현
- [ ] Production 환경 메트릭 수집 추가
- [ ] 회귀 테스트: 기존 auto-focus-sync 테스트 GREEN
- [ ] Manual 테스트: 실제 X.com에서 자동 포커스 확인

---

#### Sub-Epic 3: 타임라인 위치 복원 Production 검증

**목표**: 갤러리 닫을 때 타임라인 원래 위치로 정확히 복원

**현재 상황**:

- ✅ scrollAnchorManager 구현됨
- ✅ 앵커 기반 + 픽셀 기반 fallback 지원
- ❌ 실제 X.com에서 일부 케이스에서 복원 실패 (동적 콘텐츠 로드)

**솔루션 옵션 비교**:

| 옵션                                    | 장점                                      | 단점                                           | 난이도 | 추천도   |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------- | ------ | -------- |
| **A. scrollIntoView 폴백 추가**         | - 브라우저 네이티브 지원<br>- 안정적 동작 | - 애니메이션 제어 어려움<br>- 오프셋 조정 필요 | S      | ⭐⭐⭐⭐ |
| **B. 여러 앵커 포인트 저장 (상/중/하)** | - 더 정확한 복원<br>- 동적 콘텐츠 대응    | - 복잡도 증가<br>- 메모리 사용 증가            | M      | ⭐⭐⭐   |
| **C. MutationObserver로 DOM 변화 감지** | - 동적 콘텐츠 감지<br>- 자동 재계산       | - 성능 오버헤드<br>- 구현 복잡도 높음          | L      | ⭐⭐     |
| **D. 지연 복원 (requestIdleCallback)**  | - 콘텐츠 로드 후 복원<br>- 정확도 향상    | - UX 지연 발생<br>- 브라우저 지원 제한         | S      | ⭐⭐⭐⭐ |

**최적 솔루션**: **Option A + D 조합**

1. scrollIntoView를 추가 폴백으로 제공
2. requestIdleCallback으로 콘텐츠 로드 후 복원 시도
3. 복원 성공 여부 검증 및 재시도 로직

**완료 조건**:

- [ ] scrollIntoView 폴백 구현 및 테스트
- [ ] 재시도 로직 구현 (requestIdleCallback 기반)
- [ ] 복원 성공 검증 로직 추가
- [ ] Production 환경 메트릭 수집
- [ ] 회귀 테스트: scroll-anchor-integration 테스트 GREEN
- [ ] Manual 테스트: 실제 X.com에서 위치 복원 확인

---

### 통합 검증 계획

**Phase 4: End-to-End Production 테스트**

1. **테스트 시나리오**:

   ```
   1. X.com 타임라인 열기
   2. 비디오 트윗 클릭
   3. 갤러리에서 비디오 재생 확인 ✅
   4. 키보드로 다른 미디어 이동
   5. 자동 포커스 동기화 확인 ✅
   6. 갤러리 닫기 (Escape)
   7. 타임라인 원래 위치 복원 확인 ✅
   ```

2. **체크리스트**:
   - [ ] 비디오/GIF 추출 및 표시 정상 동작
   - [ ] 자동 포커스 동기화 정상 동작
   - [ ] 타임라인 위치 복원 정상 동작
   - [ ] 로깅 데이터 수집 및 분석
   - [ ] 성능 메트릭 확인 (추출 속도, 동기화 지연 등)

3. **성공 기준**:
   - 모든 테스트 케이스 통과 (2954+ tests GREEN)
   - Production 환경 수동 테스트 3회 이상 성공
   - 로그에서 에러 없음
   - 번들 크기 회귀 없음 (≤500 KB raw)

---

## 다음 단계

**Epic 완료 후**:

1. Production 환경 모니터링 (1주일)
2. 사용자 피드백 수집
3. 필요시 추가 개선 작업
4. Epic BUNDLE-SIZE-OPTIMIZATION 재검토

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
