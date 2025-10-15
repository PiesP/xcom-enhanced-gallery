# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-15 | **상태**: Phase 77 계획됨 �

## 프로젝트 현황

- **빌드**: prod **319.91 KB / 325 KB** (5.09 KB 여유, 1.6%) ✅
- **테스트**: **775 passing**, 9 skipped ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **의존성**: 0 violations (259 modules, 725 dependencies) ✅

## 현재 상태: Phase 77 - 네비게이션 상태 머신 도입 �

**계획됨** (Phase 76 완료 후)

- Phase 77: 네비게이션 상태 머신 도입 (focusedIndex/currentIndex 불일치 해결) 📋
  (2025-10-15) — NavigationSource 추적 시스템으로 자동 포커스와 수동 네비게이션
  분리, "Already at index 0" 반복 버그 수정
- Phase 76: 스크롤 로직 단순화 및 일관성 개선 ✅ (2025-10-15 완료) — 브라우저
  네이티브 스크롤 전면 도입, 자동 스크롤은 네비게이션 버튼에만 제한, wheel
  이벤트 개입 최소화

**최근 완료**

- Phase 75: Toolbar 설정 로직 모듈화 ✅ (2025-10-16) — 컨테이너/뷰 분리,
  useToolbarSettingsController 훅 도입, Playwright 하네스
  보강(evaluateToolbarHeadless, **DEV** 및 localStorage 가드), smoke·e2e·build
  검증 완료
- Phase 72: 코드 품질 개선 - 하드코딩 제거 ✅ (2025-10-15) — semantic 디자인
  토큰 추가 및 Button.module.css 하드코딩 제거
- Phase 71: 문서 최적화 및 간소화 ✅ (2025-01-25) — ARCHITECTURE.md 중복 제거와
  문서 역할 분리

**백로그**

- 번들 최적화 및 테스트 개선

---

## Phase 76: 스크롤 로직 단순화 및 일관성 개선 🚧

**상태**: 진행 중

**목표**: 브라우저 네이티브 스크롤을 최대한 활용하고, 자동 스크롤은 네비게이션
버튼에만 제한

**시작일**: 2025-10-15 **예상 소요**: 2-3일 **우선순위**: 높음

### 배경 및 동기

현재 스크롤 구현의 문제점:

1. **불필요한 wheel 이벤트 개입**
   - `VerticalGalleryView`에서 `wheel → scrollBy` 변환 로직 존재
   - 브라우저 네이티브 스크롤과 중복/충돌 가능성
   - 사용자의 OS/브라우저 스크롤 설정을 무시

2. **Twitter 스크롤 차단의 부작용**
   - `passive: false` + `preventDefault()` 사용
   - 갤러리 활성 시 Twitter 페이지 스크롤이 완전히 차단됨
   - 예상치 못한 사용자 경험

3. **일관성 부족**
   - 일부는 `passive: true` (네이티브), 일부는 `passive: false` (개입)
   - 자동 스크롤이 여러 곳에서 발생 (버튼 외에도)

4. **미사용 설정**
   - `autoScrollSpeed`, `infiniteScroll` 설정이 정의되어 있으나 미사용

### 솔루션 옵션 분석

#### 옵션 A: 최소 개입 (Passive-Only) ⭐ **권장**

**개요**

- 모든 wheel 이벤트를 `passive: true`로 전환
- 브라우저/OS 네이티브 스크롤만 사용
- 자동 스크롤은 오직 네비게이션 버튼(이전/다음)에서만
- Twitter 스크롤 차단 완전 제거

**장점**

- ✅ 사용자의 OS/브라우저 스크롤 설정 완전 준수
- ✅ 코드 복잡도 최소화 (wheel 이벤트 핸들러 제거 가능)
- ✅ 성능 최적화 (passive 리스너는 메인 스레드 블로킹 없음)
- ✅ 접근성 향상 (브라우저 기본 동작 보장)
- ✅ 번들 크기 감소 (~2-3 KB 예상)

**단점**

- ⚠️ Twitter 페이지가 갤러리 뒤에서 스크롤될 수 있음
  - **대응**: CSS `pointer-events` + 높은 `z-index`로 해결
- ⚠️ 스크롤 방향 감지 불가
  - **대응**: 현재 기능에서 사용되지 않음 (제거 가능)

**구현 복잡도**: 낮음 (2-3일) **유지보수성**: 매우 높음 **사용자 경험**: 최상
(네이티브 동작)

---

#### 옵션 B: 하이브리드 (Selective Control)

**개요**

- 기본은 `passive: true`
- Twitter 스크롤 차단은 CSS 레이어 전략으로 대체
  - `position: fixed` + `overflow: hidden on body`
- 자동 스크롤은 버튼 클릭만

**장점**

- ✅ Twitter 스크롤 차단 유지 (CSS로)
- ✅ 네이티브 스크롤 활용
- ✅ wheel 이벤트 개입 제거

**단점**

- ⚠️ body `overflow: hidden`이 Twitter UI와 충돌 가능
- ⚠️ 모바일/태블릿에서 예상치 못한 동작
- ⚠️ CSS 레이어 관리 복잡도 증가

**구현 복잡도**: 중간 (3-4일) **유지보수성**: 중간 **사용자 경험**: 양호

---

#### 옵션 C: 완전 네이티브 (Full Native)

**개요**

- CSS `overflow`만 사용
- JS 스크롤 개입 완전 제거
- 자동 스크롤도 CSS `scroll-behavior: smooth` + `scroll-snap` 활용

**장점**

- ✅ 최소한의 JS 코드
- ✅ 완전한 네이티브 동작
- ✅ 접근성 최상

**단점**

- ❌ 자동 스크롤을 CSS만으로 구현 불가 (버튼 클릭 시)
- ❌ `scrollIntoView()` 여전히 필요
- ❌ 크로스 브라우저 호환성 이슈 (scroll-snap 지원)

**구현 복잡도**: 높음 (4-5일) **유지보수성**: 매우 높음 **사용자 경험**: 최상
(단, 일부 기능 제약)

---

### 선택된 솔루션: **옵션 A (Passive-Only)** ⭐

**선택 이유**

1. **요구사항과 완벽히 일치**
   - "마우스 휠의 스크롤 속도 등은 유저스크립트에서 별도로 제어하지 않도록"
   - "자동 스크롤은 이전/다음 미디어 버튼 이외에는 존재해서는 안 됨"

2. **최소 코드 변경으로 최대 효과**
   - wheel 이벤트 핸들러 제거만으로 목표 달성
   - 번들 크기 감소 부가 효과

3. **유지보수성 극대화**
   - 브라우저 네이티브 동작에 의존 → 버그 최소화
   - 코드 단순화 → 이해하기 쉬움

4. **Twitter 스크롤 차단 대안 검증됨**
   - CSS `z-index` + `pointer-events`로 충분
   - 현재도 `position: fixed`로 Twitter 위에 렌더링됨

### 구현 계획

#### Step 1: RED - 실패하는 테스트 작성 ⏳

**새 테스트 파일**: `test/features/gallery/scroll-behavior.test.ts`

```typescript
describe('Gallery Scroll Behavior - Native Only', () => {
  it('should use passive wheel listeners only', () => {
    // wheel 이벤트가 passive: true로만 등록되는지 검증
  });

  it('should not intercept wheel events with preventDefault', () => {
    // preventDefault 호출이 없는지 검증
  });

  it('should not manually control scroll speed', () => {
    // scrollBy, scrollTo의 수동 호출이 버튼 외에는 없는지 검증
  });

  it('should auto-scroll only on navigation button clicks', () => {
    // 이전/다음 버튼 클릭 시에만 scrollIntoView 호출
  });
});
```

**수정 테스트**: 기존 스크롤 관련 테스트 업데이트

- `test/features/gallery/hooks/use-gallery-scroll.test.ts`
  - Twitter 스크롤 차단 테스트 제거
  - passive 리스너 검증 추가

#### Step 2: GREEN - 최소 구현 🔧

**제거할 코드**

1. **`useGalleryScroll.ts`**
   - `preventTwitterScroll` 함수 제거
   - `blockTwitterScroll` 옵션 제거
   - Twitter 컨테이너 감지 로직 제거
   - `handleGalleryWheel` 함수 간소화 (상태 추적만)

2. **`VerticalGalleryView.tsx`**
   - `onScroll` 콜백에서 `scrollBy` 호출 제거
   - wheel → scrollBy 변환 로직 완전 제거

3. **`scroll-utils.ts`**
   - `preventScrollPropagation` 함수 제거
   - `createScrollHandler`에서 non-passive 옵션 제거

4. **`wheel.ts`**
   - `ensureWheelLock` 함수 제거 (passive: false 사용처 없음)
   - `addWheelListener`만 유지

**유지할 코드**

1. **`useGalleryItemScroll.ts`**
   - `scrollIntoView()` 로직 유지 (버튼 클릭용)
   - 자동 스크롤 플래그는 유지 (IntersectionObserver와 충돌 방지)

2. **CSS 스크롤 스타일**
   - `scroll-behavior: smooth`
   - `overscroll-behavior: contain`
   - 스크롤바 커스텀

**수정할 코드**

1. **`useGalleryScroll.ts`**

```typescript
export function useGalleryScroll({
  container,
  enabled = true,
}: Simplified UseGalleryScrollOptions): UseGalleryScrollReturn {
  const [isScrolling, setIsScrolling] = createSignal(false);
  const [lastScrollTime, setLastScrollTime] = createSignal(0);

  createEffect(() => {
    const containerElement = containerAccessor();
    if (!enabledAccessor() || !containerElement) return;

    const eventManager = new EventManager();

    // 100% passive - 상태 추적만
    const wheelHandler = () => {
      setIsScrolling(true);
      setLastScrollTime(Date.now());
      // 디바운스 타이머로 idle 전환
    };

    eventManager.addEventListener(document, 'wheel', wheelHandler, {
      capture: true,
      passive: true, // ✅ 항상 passive
    });

    onCleanup(() => eventManager.cleanup());
  });

  return { lastScrollTime, isScrolling };
}
```

2. **`VerticalGalleryView.tsx`**

```typescript
// ❌ 제거: onScroll 콜백에서 scrollBy 호출
const { isScrolling } = useGalleryScroll({
  container: () => containerEl(),
  enabled: isVisible,
  // blockTwitterScroll 옵션 제거
});

// 브라우저 네이티브 스크롤만 사용
// CSS overflow: auto가 모든 스크롤 처리
```

#### Step 3: REFACTOR - 코드 정리 및 최적화 🧹

1. **사용하지 않는 함수 제거**
   - `findTwitterScrollContainer`
   - `preventScrollPropagation`
   - `ensureWheelLock`
   - `createScrollHandler` (단순화 또는 제거)

2. **설정 정리**
   - `autoScrollSpeed` 제거 (미사용)
   - `infiniteScroll` 제거 (미사용)

3. **문서 업데이트**
   - `ARCHITECTURE.md`: 스크롤 정책 명시
   - `CODING_GUIDELINES.md`: 네이티브 스크롤 원칙 추가

4. **타입 정리**
   - `UseGalleryScrollOptions` 인터페이스 간소화
   - `blockTwitterScroll`, `onScrollDirectionChange` 등 제거

### 성공 기준

- [ ] 모든 wheel 이벤트가 `passive: true`로 등록됨
- [ ] `preventDefault()` 호출이 스크롤 관련 코드에 없음
- [ ] 자동 스크롤은 네비게이션 버튼에서만 발생 (`scrollIntoView` 호출)
- [ ] Twitter 스크롤 차단 로직 완전 제거
- [ ] 기존 테스트 775개 모두 통과
- [ ] 번들 크기 2-3 KB 감소 (목표: 317 KB 이하)
- [ ] E2E 스모크 테스트 통과 (브라우저 네이티브 스크롤 동작 확인)

### 위험 요소 및 대응

| 위험                                  | 가능성 | 영향 | 대응 방안                            |
| ------------------------------------- | ------ | ---- | ------------------------------------ |
| Twitter 페이지가 갤러리 뒤에서 스크롤 | 중간   | 낮음 | CSS `pointer-events: none` 추가 검증 |
| 사용자가 Twitter 스크롤 차단을 기대   | 낮음   | 낮음 | 릴리즈 노트에 변경사항 명시          |
| 일부 브라우저에서 스크롤 동작 차이    | 낮음   | 낮음 | E2E 테스트로 크로스 브라우저 검증    |

### 예상 효과

**코드 품질**

- 복잡도 감소: ~150 LOC 제거 예상
- 유지보수성 향상: wheel 이벤트 로직 단순화
- 테스트 커버리지 향상: 네이티브 동작은 브라우저가 보장

**성능**

- 번들 크기: -2~3 KB (317 KB 목표)
- 런타임 성능: passive 리스너로 메인 스레드 블로킹 제거
- 메모리 사용: 이벤트 핸들러 감소

**사용자 경험**

- 스크롤 품질 향상: 사용자의 OS/브라우저 설정 준수
- 접근성 향상: 브라우저 기본 동작 보장
- 일관성 향상: 네이티브 스크롤만 사용

### 타임라인

| 단계     | 작업                     | 예상 시간       | 담당   |
| -------- | ------------------------ | --------------- | ------ |
| 1        | RED: 테스트 작성         | 4h              | TDD    |
| 2        | GREEN: 코드 제거 및 수정 | 8h              | 구현   |
| 3        | REFACTOR: 정리 및 문서화 | 4h              | 최적화 |
| 4        | 검증: E2E + 번들 분석    | 2h              | QA     |
| **총계** |                          | **18h (2-3일)** |        |

### 체크리스트

**준비**

- [ ] Phase 76 브랜치 생성: `feature/phase-76-scroll-simplification`
- [ ] 현재 스크롤 동작 E2E 녹화 (비교용)

**RED**

- [ ] `test/features/gallery/scroll-behavior.test.ts` 작성
- [ ] 기존 테스트 수정 (passive 검증)
- [ ] 테스트 실패 확인

**GREEN**

- [ ] `useGalleryScroll.ts` 간소화
- [ ] `VerticalGalleryView.tsx` wheel 로직 제거
- [ ] `scroll-utils.ts` 함수 제거
- [ ] `wheel.ts` 간소화
- [ ] 테스트 통과 확인

**REFACTOR**

- [ ] 사용하지 않는 코드 제거
- [ ] 타입 정리
- [ ] 설정 제거 (`autoScrollSpeed` 등)
- [ ] 문서 업데이트
- [ ] 린트/포맷 통과

**검증**

- [ ] `npm run validate` 통과
- [ ] `npm test` 통과 (775개)
- [ ] `npm run e2e:smoke` 통과
- [ ] 번들 크기 확인 (< 320 KB)
- [ ] 수동 테스트: 갤러리 스크롤 품질 확인

**완료**

- [ ] PR 생성 및 리뷰
- [ ] master 머지
- [ ] 릴리즈 노트 작성

### 참고 자료

#### 관련 파일

- `src/features/gallery/hooks/useGalleryScroll.ts`
- `src/features/gallery/hooks/useGalleryItemScroll.ts`
- `src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx`
- `src/shared/utils/scroll/scroll-utils.ts`
- `src/shared/utils/events/wheel.ts`

#### 관련 문서

- [MDN: Passive Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)
- [Web.dev: Passive Event Listeners](https://web.dev/uses-passive-event-listeners/)
- [WICG: Scroll Behavior](https://drafts.csswg.org/cssom-view/#smooth-scrolling)

#### 결정 기록

- 2025-10-15: Phase 76 시작, 옵션 A (Passive-Only) 선택
- 근거: 요구사항 완벽 일치, 최소 변경, 유지보수성 극대화

---

## Phase 73: 번들 최적화 재평가 (백로그)

**상태**: 대기 (번들 322 KB 도달 시 활성화)

### 트리거 조건

- 프로덕션 빌드 **322 KB (99%)** 도달

### 후보 작업

| 항목              | 예상 효과 | 시간  | ROI | 우선순위 |
| ----------------- | --------- | ----- | --- | -------- |
| Lazy Loading 확장 | ~5 KB     | 1-2일 | 0.8 | 중간     |
| CSS 토큰 정리     | ~1-2 KB   | 2-3h  | 0.4 | 낮음     |
| events.ts 재검토  | ~2-3 KB   | 1일   | 0.3 | 낮음     |

**총 예상 효과**: ~8-10 KB 절감

---

## Phase 74: Skipped 테스트 재활성화 (백로그)

**상태**: 대기 (선택적 활성화)

### 현재 Skipped 테스트 현황

- **총 9개**: 1개 E2E 이관 + 8개 debounce 타이밍 조정 필요
- **테스트 통과율**: 98.8% (775/784)
- **기능 상태**: 모두 정상 작동 중

### 테스트 분류

1. **E2E 이관 (1개)**: toolbar-layout-stability.test.tsx:80
   - 이유: JSDOM에서 Solid.js Signal 기반 data-expanded 속성 미작동
   - 상태: playwright/smoke/toolbar-settings.spec.ts에서 검증 중
   - 조치: skip 유지 (정당한 이유)
2. **Debounce 타이밍 조정 필요 (8개)**:
   - use-gallery-focus-tracker-deduplication.test.ts: 1개
   - use-gallery-focus-tracker-events.test.ts: 3개
   - use-gallery-focus-tracker-global-sync.test.ts: 4개
   - 이유: Phase 69 debounce 도입 후 vi.useFakeTimers() 타이밍 불일치
   - 예상 시간: 2-3시간

### 활성화 조건

- 테스트 통과율 95% 미만 시 즉시 검토
- 또는 focus tracker 기능 변경 시 함께 수정

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 322 KB (99%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 15개 이상 시 즉시 검토
- **테스트 통과율**: 95% 미만 시 Phase 74 활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 기록 (33, 67, 69, 71, 72, 75)
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트

---

## 히스토리

- **2025-10-15**: Phase 77 계획 수립 (네비게이션 상태 머신 도입 -
  NavigationSource 추적)
- **2025-10-15**: Phase 76 완료 (스크롤 로직 단순화 - 브라우저 네이티브 전환)
- **2025-10-16**: Phase 75 완료 (Toolbar 컨테이너/뷰 분리, 하네스 보강)
- **2025-10-15**: Phase 71, 72 계획 수립 (문서 최적화 + 코드 품질)
- **2025-10-14**: Phase 33, 67, 69 완료 → 유지보수 모드 전환
- **2025-10-13**: Phase 67 번들 최적화 1차 완료 (319 KB 달성)
- **2025-10-12**: Phase 69 성능 개선 완료
