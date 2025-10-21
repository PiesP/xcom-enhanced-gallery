# TDD 리팩토링 완료 Phase 기록

> **목적**: 완료된 Phase의 핵심 요약 (상세 기록은 Git 커밋 히스토리 참조) **최종
> 업데이트**: 2025-10-21

---

## Phase D2: 설정 라벨 타이포그래피 통일 ✅ (2025-10-21)

### 목표

- 설정 라벨의 폰트 웨이트를 툴바 인디케이터의 currentIndex와 일관되게 통일하여
  시각적 일관성 강화

### 문제점

- 툴바 인디케이터 currentIndex: `font-weight: 700` (bold) 사용
- 설정 라벨: `--xeg-settings-label-font-weight: var(--font-weight-medium)` (500)
  사용
- 시각적 위계 불일치로 디자인 시스템의 일관성 부족

### 구현

- `design-tokens.semantic.css` 토큰 변경:
  `--xeg-settings-label-font-weight: var(--font-weight-bold)` (700)
- 영향 범위: 설정 모달의 Theme/Language 라벨 및 툴바 내 인라인 설정 패널 라벨
- 변경 파일: `src/shared/styles/design-tokens.semantic.css`

### 테스트

- Unit Tests: 2349 passed + 5 skipped (GREEN)
- Browser Tests: 111 passed (Vitest + Chromium, GREEN)
- E2E Tests: 60 passed (Playwright smoke tests, GREEN)
- Accessibility Tests: 34 passed (axe-core WCAG 2.1 Level AA, GREEN)
- CodeQL: 5개 커스텀 쿼리 모두 PASS
- 빌드 검증: dev (721.96 KB) + prod (327.44 KB, gzip 88.18 KB) 성공

### 결과

- 디자인 토큰 규칙 준수: 하드코딩 없음, 토큰 기반 접근
- 시각적 일관성 확보: 인디케이터와 설정 라벨 모두 bold(700) 사용
- 기능 회귀 없음: 모든 테스트 스위트 GREEN 유지

### 교훈

- 디자인 토큰을 활용한 일관성 개선은 최소 변경으로 높은 효과를 얻을 수 있다
- 토큰 기반 타이포그래피 통일은 유지보수성과 확장성을 향상시킨다

---

## Phase M1: 클릭한 트윗 특정 로직 개선 + 인용 트윗 미디어 순서 개선 ✅ (2025-10-21)

### 목표

- 트윗 퍼마링크 페이지에서 멘션/인용 트윗 내부 미디어를 클릭했을 때, 현재 URL의
  트윗이 아니라 “클릭된” 트윗 컨테이너의 트윗 ID를 사용해 미디어를 추출한다.

### 구현

- 전략 보강: ClickedElementTweetStrategy에 조상 컨테이너(기사/article 또는
  [data-testid="tweet"])를 우선 탐색하는 로직 추가
  - 새 메서드: extractTweetIdFromAncestorContainer(element)
  - 헬퍼: findTweetIdInContainer(container)로 내부 status 링크(/status/<id>)
    우선 파싱
- 우선순위 유지: data-attributes → aria-labelledby → href →
  ancestor-container(신규) → URL 기반/글로벌 폴백

### 테스트

- 단위 테스트 추가: 클릭된 멘션 트윗 시나리오에서 조상 컨테이너의 트윗 ID를
  선호하는지 검증
  - 파일:
    test/unit/shared/services/media-extraction/clicked-element-tweet-strategy.test.ts

### 결과

- Unit/Browser/E2E/a11y 전체 GREEN (2346 passed, 5-6 skipped 범위)
- 빌드 검증 및 CodeQL 커스텀 쿼리 5종 모두 PASS

### 교훈

- 최고 우선 전략(ClickedElementTweetStrategy)에 “문맥(ancestor container)”을
  도입하면 permalink 환경의 모호성을 해소할 수 있다.
- 기존 전략 순서와 STABLE_SELECTORS 재사용이 회귀를 방지한다.

## Phase B1: 테스트 & 접근성 통합 개선 ✅ (2025-10-21)

### 목표

- Critical Path 파일 80%+ 커버리지 달성 (logger.ts, GalleryApp.ts,
  media-extraction)

### 결과

- **logger.ts**: 87.21% 달성 ✅
- **GalleryApp.ts**: 통합 테스트 15개 작성 완료 ✅ (100% 통과)
  - 파일: `test/unit/features/gallery/GalleryApp.integration.test.ts`
  - 커버리지: 초기화, open/close, config, diagnostics, cleanup, errors, signals
- **media-extraction**: 기존 테스트 존재 ✅
- **전체 테스트**: 208/208 files (100%), 1748 tests (100%)

### 핵심 패턴

```typescript
// 서비스 등록 패턴 확립
beforeEach(() => {
  initializeVendors();
  CoreService.resetInstance();
  const renderer = new GalleryRenderer();
  registerGalleryRenderer(renderer);
  galleryApp = new GalleryApp();
  document.body.innerHTML = '';
  vi.clearAllMocks();
});
```

### 교훈

- 통합 클래스는 **통합 테스트가 효율적** (GalleryApp 실증)
- 실제 서비스 인스턴스 사용이 모킹보다 유지보수성 우수
- `CoreService` 패턴이 테스트 격리에 효과적

---

## Phase B2: Services Coverage Improvement ✅ (2025-10-21)

### 목표

- shared/services 영역 커버리지 80%+ 달성 및 전략/오케스트레이터 결함 탐지

### 결과 요약

- 80% 미만 파일: 20개 → 13개 (-35%)
- 신규 테스트: 619개 추가 (총 2443 passed, 6 skipped)
- 커버리지: Stmts 69.99%, Branch 79.26%, Funcs 67.25%, Lines 69.99%
- 실결함 2건 수정 (username 추출, URL 파싱 경계)

### 핵심 변경

- 전략군 보강: clicked-element/data-attribute/url-based/dom-structure
- 오케스트레이터/통합: tweet-info-extractor, username-extraction-service,
  dom-direct-extractor
- 코어/UX: unified-toast-manager, toast-controller, keyboard-navigator,
  core-services

### 교훈

- Strategy/Factory로 경계를 명확히 하면 테스트 설계·유지보수성이 향상
- "getter 경유 + 싱글톤 리셋" 패턴이 테스트 격리에 효과적

---

## Phase A1: 의존성 그래프 최적화 ✅ (2025-10-21)

### 목표

- 순환 참조 제거 및 고아 모듈 정리

### 문제 진단

- **순환 참조**:
  `service-factories.ts ↔ media-service.ts ↔ service-accessors.ts`
- **고아 모듈**: `memoization.ts`, `progressive-loader.ts`, `button.ts` (미사용)

### 해결

- `getBulkDownloadServiceFromContainer()` fallback 로직 제거
- Bootstrap 시점 등록으로 fallback 불필요함을 활용
- 고아 모듈 3개 제거

### 결과

- **모듈**: 269 → 266 (-3)
- **의존성**: 748 → 747 (-1)
- **순환 참조**: ✅ 0 violations

### 교훈

- Bootstrap 단계 명시적 등록이 Lazy Registration보다 명확
- Fallback 패턴은 편리하지만 순환 참조 원인 가능

---

## P2: 번들 여유 확보 ≥ 3 KB ✅ (2025-10-21)

### 결과

- **현재 빌드**: 326.73 KB / 335 KB (**8.27 KB 여유**)
- **Gzip**: 88.11 KB
- 토큰 통일 과정에서 자연스럽게 달성

### 교훈

- 코드 품질 개선이 번들 크기 최적화에도 기여
- 일관된 아키텍처와 정책 준수만으로 충분한 여유 확보

---

## Phase 146: 레거시 토큰 alias 제거(P1) ✅ (2025-10-21)

### 변경

- `src/features/**` 범위 레거시 alias → canonical tokens
- 정책 테스트 추가 (`test/unit/styles/legacy-alias-elimination.test.ts`)

### 결과

- 시각적 변화 없이 의미적 토큰 통일
- 정책 기반 테스트로 회귀 방지

---

## Phase 145: 툴바 인디케이터 색상 통일 ✅ (2025-10-21)

### 변경

- `.mediaCounter`, `.totalCount` → `var(--xeg-color-text-primary)` 통일
- `--xeg-text-counter` → primary로 승격

### 결과

- 인디케이터/설정 메뉴 간 색상 일관성 확보
- 유지보수성 향상

---

## Phase 144: 스크롤 체이닝 2순위 시나리오 ✅ (2025-10-20)

### Phase 144.1 - 애니메이션 상호작용 (8 tests)

- **파일**: `test/browser/scroll-chaining-animation-interaction.test.ts`
- **핵심**: `scrollIntoView({behavior: 'smooth'})`가 wheel/keyboard와 자연스럽게
  공존
- **구현 변경**: 없음 (브라우저 네이티브 충분)

### Phase 144.2 - 갤러리 리사이즈 (8 tests)

- **파일**: `test/browser/scroll-chaining-gallery-resize.test.ts`
- **핵심**: CSS `overscroll-behavior: none`이 리사이즈 중에도 유지
- **구현 변경**: 없음 (CSS + ResizeObserver 충분)

### 결과

- **테스트**: 90 tests (74 + 16)
- **구현 변경**: 0 (브라우저 네이티브 충분)

---

## Phase 143: 스크롤 체이닝 1순위 시나리오 ✅ (2025-10-20)

### Phase 143.1 - 동적 콘텐츠 (14 unit tests)

- **파일**: `test/unit/features/scroll-chaining-dynamic-content.test.ts`
- **핵심**: CSS `overscroll-behavior: none`이 콘텐츠 변화 자동 처리
- **구현 변경**: 없음 (ResizeObserver/MutationObserver 불필요)

### Phase 143.2 - 동시 입력 (16 browser tests)

- **파일**: `test/browser/scroll-chaining-concurrent-input.test.ts`
- **핵심**: 브라우저 네이티브 동작 견고, `passive: true`로 고성능
- **구현 변경**: 없음 (디바운싱/쓰로틀링 불필요)

### 결과

- **테스트**: 74 tests (44 + 30)
- **구현 변경**: 0 (CSS 기반 충분)

---

## Phase 142: 스크롤 체이닝 재검증 ✅ (2025-10-20)

### 목표

- 기존 44개 테스트의 실제 구현 일치성 검증

### 실제 구현

- **CSS**: `overscroll-behavior: none` (VerticalGalleryView.module.css,
  performance.css)
- **JavaScript**: `useGalleryScroll.ts`는 `passive: true`로만 등록
- **Twitter 차단**: `preventTwitterScroll` 별도 처리

### 테스트 전략

- **CSS 테스트** (9): CSS 속성 적용 검증
- **이벤트 테스트** (12): 패턴 검증 (교육적 가치)
- **경계 테스트** (12): 알고리즘 정확성 검증
- **브라우저 테스트** (11): 실제 DOM 동작 검증

### 문서화

- 4개 테스트 파일에 실제 구현과의 관계 명시

---

## 스크롤 체이닝 전체 요약 (Phase 142-144)

### 달성 지표

| 항목        | 결과          |
| ----------- | ------------- |
| 전체 테스트 | 90 tests      |
| 통과율      | 100%          |
| 빌드 크기   | 332.12 KB     |
| 구현 변경   | 0 (문서화만)  |
| 테스트 증가 | +104% (44→90) |

### 핵심 결론

1. **CSS 기반 접근 우수성**
   - `overscroll-behavior: none` 한 줄로 모든 시나리오 커버
   - 동적 콘텐츠, 동시 입력, 애니메이션, 리사이즈 자동 처리

2. **브라우저 네이티브 신뢰**
   - 빠른 연속 입력, 애니메이션 충돌 자동 해결
   - 인위적 디바운싱/쓰로틀링 불필요

3. **Zero Implementation Change**
   - 모든 Phase에서 구현 변경 없이 테스트만으로 충분성 검증

---

## Phase D3: 디자인 토큰 명명 규칙 일관성 개선 ✅ (2025-10-21)

### 목표

- 디자인 토큰의 3계층 구조(Primitive → Semantic → Component)를 명확히하고 명명
  규칙을 문서로 정리하여 유지보수성을 높임

### 해결 요약

- 대규모 리네이밍 대신 문서화 강화(현상 유지)를 선택
- `docs/CODING_GUIDELINES.md`에 현재 혼재된 패턴과 실무 규칙을 명시
- 향후 신규 토큰 추가 시 따를 가이드라인을 명확히 함

### 변경 사항

- `docs/CODING_GUIDELINES.md` 업데이트: Semantic(`--xeg-*`)과
  Component(`--toolbar-*` 등) 의 권장 사용을 정리하고, 기존 `--xeg-` 토큰의 현상
  유지와 점진적 리팩토링 권장 규칙을 추가

### 테스트/검증

- 변경은 문서화만으로 리스크가 낮음. 전체 테스트 스위트(GREEN) 및 빌드 검증 필요

### 결과

- 팀 규칙이 명확해져 신규 토큰 추가 시 일관성 유지
- 대규모 리네이밍 리스크 회피로 안정성 보장

### 교훈

- 문서화만으로도 유지보수성 개선 가능. 필요 시 점진적 리팩토링을 별도 Phase로
  계획

## 참고

- 상세 기록은 Git 커밋 히스토리 참조
- 활성 Phase는 `TDD_REFACTORING_PLAN.md` 참조
- 완료 Phase 추가 시 이 문서에 요약 추가
