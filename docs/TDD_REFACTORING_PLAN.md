# TDD 리팩토링 활성 계획

> 프로젝트 개선을 위한 TDD 기반 리팩토링 작업 관리

**최근 업데이트**: 2025-10-06 **현재 상태**: Epic SOLID-NATIVE-MIGRATION 확인
완료, 현재 활성 Epic 없음

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

---

## 현재 활성 작업

**상태**: 현재 활성 Epic 없음 ✅

**최근 완료**:

- ✅ **Epic SOLID-NATIVE-MIGRATION** (2025-10-06 확인 완료)
- ✅ **Epic GALLERY-ENHANCEMENT-001** (2025-10-06 완료 - 3 Sub-Epics 모두 구현)

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
