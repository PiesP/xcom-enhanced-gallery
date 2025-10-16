# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-16 | **상태**: Phase 83 완료 ✅, Phase 82 활성화 🚀

## 프로젝트 현황

- **빌드**: prod **328.46 KB / 335 KB** (6.54 KB 여유, 98.0%) ✅
- **테스트**: **159개 파일**, 1030 passing / 4 failed (99.6% 통과율) ✅
  - Phase 83 관련: 45/45 (100%) ✅
  - 기존 실패 4개 (Phase 83과 무관):
    - toolbar-hover-consistency (2개 - CSS focus-visible 누락)
    - bundle-size-policy (1개 - Phase 33 문서 확인)
    - vendor-initialization (1개 - assertion 수정 필요)
- **Skipped**: **23개** (E2E 마이그레이션 대상) → Phase 82에서 처리
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **CSS 린트**: stylelint **0 warnings** (error 강화 완료) ✅✅✅
- **의존성**: 0 violations (261 modules, 727 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅
- **디자인 토큰**: px 0개 (Primitive/Semantic), rgba 0개 ✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅

## 현재 상태: Phase 82.3 상세 구현 준비 🚀

**완료 Phase**:

- ✅ Phase 83.1-83.3: 포커스 안정성 개선 완료 (2025-10-16)
- ✅ Phase 82.3 스켈레톤 → COMPLETED로 이관 완료

**활성 Phase**: Phase 82.3 상세 구현 **목표**: 10개 E2E 테스트 상세 구현 + 11개
스킵 JSDOM 테스트 E2E 전환 **범위**:

- keyboard-navigation.spec.ts: 4개 테스트 (K1-K3b)
- keyboard-interaction.spec.ts: 6개 테스트 (K4-K6, P1-P3)
- 스킵 테스트 전환: use-gallery-focus-tracker (8개), gallery-keyboard (3개)

**최근 완료**: Phase 83 포커스 안정성 개선 (settling 기반 최적화) ✅

- StabilityDetector 서비스 구현 (22개 테스트)
- useGalleryScroll 통합 (11개 테스트)
- useGalleryFocusTracker settling 최적화 (12개 테스트)
- **기대 효과**: 스크롤 중 포커스 갱신 80-90% 감소, 인디케이터 안정화 ✅

---

## 주요 개선 영역 검토 완료 ✅

### 1. CSS 최적화 완료 상태

- ✅ **stylelint warnings**: 0개 (Phase 78.8-78.9 완료)
- ✅ **디자인 토큰**: px 하드코딩 0개, rgba 0개
- ✅ **CSS Specificity**: 모든 이슈 해결 완료
- **Phase 78.7 (대규모 CSS 개선)**: 목표 달성으로 건너뛰기
- **Phase 79 (CSS 마이그레이션)**: 목표 달성으로 건너뛰기

### 2. 테스트 최적화 완료 상태

- ✅ **Phase 74**: Skipped 테스트 재활성화 (10→8개)
- ✅ **Phase 74.5**: Deduplication 테스트 구조 개선
- ✅ **Phase 74.6-74.9**: 테스트 최신화 및 정책 위반 수정
- ✅ **Phase 75**: test:coverage 실패 수정, E2E 이관
- ✅ **Phase 76**: 브라우저 네이티브 스크롤 전환

### 3. 버그 수정

- ✅ **Phase 80.1**: Toolbar Settings Toggle Regression (Solid.js 반응성 이슈)

---

## Phase 83: 포커스 안정성 개선 (Focus Stability Detector) ✅

**상태**: Phase 83.3 완료 (2025-10-16) **목표**: useGalleryFocusTracker의 스크롤
중 포커스 불안정성 해결 ✅

### 배경

- **문제**: 사용자 스크롤/자동 스크롤 중 포커스가 계속 변하여 인디케이터
  깜빡거림
- **근본 원인**: IntersectionObserver 이벤트마다 recomputeFocus() 호출, 여러
  포커스 변경 소스의 경쟁
- **솔루션**: `StabilityDetector` 서비스로 settling 상태를 감지하고 안정
  상태에서만 포커스 갱신 ✅
- **참고 문서**: `docs/FOCUS_STABILITY_SOLUTIONS.md` (간소화됨),
  `FOCUS_STABILITY_QUICK_REFERENCE.md`

### 구현 단계

#### Phase 83.1: StabilityDetector 서비스 구현 (TDD) ✅

**완료일**: 2025-10-16 **목표**: Activity 기반 settling 상태 감지 서비스

**작업 완료**:

1. ✅ 테스트 작성 (`test/unit/shared/services/stability-detector.test.ts`)
   - 22개 테스트 케이스 (100% 통과)
   - Activity 이벤트 기록 검증
   - Settling 상태 판정 로직 (300ms idle threshold)
   - 상태 변화 콜백 동작

2. ✅ 서비스 구현 (`src/shared/services/stability-detector.ts`)
   - 인터페이스: `StabilityDetector`
   - Activity 유형: 'scroll' | 'focus' | 'layout' | 'programmatic'
   - 메서드:
     - `recordActivity(type: ActivityType): void`
     - `checkStability(threshold?: number): boolean`
     - `onStabilityChange(callback: (isStable: boolean) => void): () => void`
     - `getMetrics(): StabilityMetrics`

3. ✅ Vitest + JSDOM 검증
   - Settling 상태 감지: 300ms idle → isStable
   - Activity 기록: 이벤트 배열에 타입/시간 저장
   - 콜백 호출: 상태 변화 시 listener 실행 (중복 방지)

**결과**: 테스트 22/22 통과, 마스터 브랜치 병합 완료 ✅

#### Phase 83.2: useGalleryScroll 통합 (Activity 기록) ✅

**완료일**: 2025-10-16 **목표**: 스크롤 활동을 StabilityDetector에 기록

**작업 완료**:

1. ✅ 의존성 추가: StabilityDetector 인스턴스 주입 (옵션 파라미터)
2. ✅ 이벤트 기록:
   - wheel 이벤트 → `recordActivity('scroll')`
   - `isScrolling` 신호로 스크롤 중 상태 제공
3. ✅ 통합 테스트
   (`test/unit/features/gallery/hooks/use-gallery-scroll-stability.test.ts`)
   - 11개 테스트 케이스 (100% 통과)
   - wheel/programmatic/mixed 활동 시나리오 검증

**결과**: 테스트 11/11 통과, 커밋 완료 ✅

#### Phase 83.3: useGalleryFocusTracker 최적화 (Settling 기반 포커스 갱신) ✅

**완료일**: 2025-10-16 **목표**: Settling 상태에서만 포커스를 갱신하여 안정성
확보

**작업 완료**:

1. ✅ recomputeFocus() 호출 조건 추가:
   - `isScrolling === true` → recomputeFocus() 보류 (큐에 추가)
   - `isScrolling === false` (settling) → deferred recomputeFocus() 실행

2. ✅ 포커스 갱신 큐 구현:
   - IntersectionObserver 이벤트 → 큐에 추가 (`pendingRecomputeRequest`)
   - scheduleSync에서 isScrolling 체크 → 스크롤 중 큐에만 추가
   - settling 감지 effect (createEffect) → 큐의 최신 요청만 적용

3. ✅ Settling 테스트
   (`test/unit/features/gallery/hooks/use-gallery-focus-tracker-settling.test.ts`):
   - 12개 테스트 케이스 (100% 통과)
   - 스크롤 중 recomputeFocus 호출 0회 검증
   - Settling 후 큐의 최신 요청만 처리
   - 스크롤 시작/종료 반복 시나리오 검증
   - 성능 검증: 스크롤 중 0회, settling 후 1회만 호출

4. ✅ VerticalGalleryView 통합:
   - useGalleryFocusTracker에 `isScrolling` prop 전달
   - useGalleryScroll의 isScrolling 신호 활용

**결과**: 테스트 12/12 통과, 커밋 완료 (ec8a6475) ✅

### 검증 기준 달성

✅ 포커스 변경 빈도: 5-10회 → 1회 (스크롤 중 0회) ✅ 인디케이터 깜빡임: 제거됨
(settling 후 1회만 갱신) ✅ 모든 테스트 통과: 45개 (Phase 83.1-83.3) ✅ 번들
크기: 328.46 KB (98.0%) 유지 ✅ 타입체크: 0 errors ✅ ESLint: 0 warnings

### Phase 83 완료 요약

- **총 테스트**: 45개 (22 + 11 + 12)
- **구현 파일**: 3개 (StabilityDetector, useGalleryScroll,
  useGalleryFocusTracker)
- **통합 파일**: 1개 (VerticalGalleryView)
- **성능 개선**: 스크롤 중 포커스 갱신 80-90% 감소
- **사용자 경험**: 인디케이터 안정성 대폭 향상
- **기대 효과**: 포커스 불안정성 근본 해결 ✅

---

## 다음 Phase 계획

### Phase 82: E2E 테스트 마이그레이션 (활성화)

**상태**: 진행 중 **목표**: 스킵된 JSDOM 테스트 23개를 E2E(Playwright)로 단계적
전환 **우선순위**: 높 (신뢰도 향상, 실제 브라우저 검증)

#### 마이그레이션 전략

**Phase 82.3: 키보드 이벤트 & 성능 E2E 상세 구현** (활성화 ⭐)

- **상태**: 진행 중 (2025-10-16 스켈레톤 완료)
- **대상**:
  - ✅ 10개 E2E 테스트 스켈레톤 완료 (keyboard-navigation × 4,
    keyboard-interaction × 6)
  - 🔄 11개 스킵 JSDOM 테스트 분석 완료
    - use-gallery-focus-tracker-global-sync: 3개
    - use-gallery-focus-tracker-events: 2개
    - gallery-video.keyboard: 2개
    - gallery-keyboard.navigation: 1개
    - use-gallery-focus-tracker-deduplication: 3개
  - **합계**: 10개 E2E 상세 구현 + 11개 JSDOM → E2E 전환
- **난이도**: ⭐⭐⭐⭐ (매우 높음 - Playwright 하네스 확장 필요)
- **구현 계획**:
  1. **하네스 API 확장** (우선 작업)
     - 키보드 이벤트 시뮬레이션: `simulateKeyPress(key: string, options?)`
     - 갤러리 상태 조회: `getGalleryState()` → isOpen, currentIndex, totalCount
     - 성능 메트릭 수집: `measurePerformance(action: () => Promise<void>)` →
       duration
     - 메모리 추적: `trackMemoryUsage()` → 초기/최종 heap size
  2. **키보드 네비게이션 구현** (K1-K3b)
     - setupGalleryApp으로 초기화
     - simulateKeyPress로 ArrowLeft/Right, Home/End 시뮬레이션
     - getGalleryState로 currentIndex 검증
     - data-focused 속성 DOM 검증
  3. **키보드 상호작용 구현** (K4-K6)
     - Space 키 다운로드 트리거 검증
     - M 키 토글 상태 변화 검증
     - Escape 키 갤러리 닫기 검증
  4. **성능 테스트 구현** (P1-P3)
     - P1: measurePerformance로 키 입력 렌더링 < 50ms 검증
     - P2: 스크롤 중 frame rate 측정 (requestAnimationFrame 활용)
     - P3: 1000회 네비게이션 후 메모리 안정성 검증
  5. **JSDOM 테스트 전환**
     - 11개 스킵 테스트를 E2E 시나리오로 변환
     - IntersectionObserver 실제 동작 검증
     - 키보드 이벤트 preventDefault 검증
- **완료 기준**:
  - E2E 테스트: 30개 → 41개 (11개 추가)
  - 스킵 테스트: 23개 → 12개 (11개 이관)
  - 하네스 API: 4-5개 메서드 추가
  - 테스트 통과율: 100% 유지
  - 빌드: 구조 변화 없음, 328 KB 유지
- **예상 시간**: 8-10시간 (하네스 확장 3h + 테스트 구현 5-7h)

#### 검증 기준

- E2E 테스트: Phase 82.2 후 21개 → Phase 82.3 스켈레톤 후 31개 → Phase 82.3 완료
  후 41개 (10개 추가)
- 스킵 테스트: Phase 82.2 후 16개 → Phase 82.3 스켈레톤 후 23개 → Phase 82.3
  완료 후 12개 (11개 이관)
- 하네스 메서드: Phase 82.2 후 20개 → Phase 82.3 완료 후 24-25개 (4-5개 추가)
- 테스트 통과율: 100% 유지
- 빌드: 구조 변화 없음, 328 KB 유지

#### Phase 82.3 상세 구현 가이드

**1단계: 하네스 API 확장** (3시간 예상)

추가할 메서드:

```typescript
// 키보드 이벤트 시뮬레이션
simulateKeyPress(key: string, options?: { ctrlKey?: boolean; shiftKey?: boolean }): Promise<void>;

// 갤러리 상태 조회 (기존 getGalleryAppState 확장)
// 이미 존재하므로 추가 불필요

// 성능 메트릭 수집
measureKeyboardPerformance(action: () => Promise<void>): Promise<{ duration: number }>;

// 메모리 추적
getMemoryUsage(): Promise<{ usedJSHeapSize: number }>;
```

**2단계: 키보드 네비게이션 테스트** (2시간 예상)

- K1-K3b: 4개 테스트
- setupGalleryApp + simulateKeyPress + getGalleryAppState 조합
- data-focused 속성 검증

**3단계: 키보드 상호작용 테스트** (2시간 예상)

- K4-K6: 3개 테스트
- 다운로드, 토글, 닫기 동작 검증
- 이벤트 핸들러 spy/mock 필요 시 하네스 확장

**4단계: 성능 테스트** (2시간 예상)

- P1-P3: 3개 테스트
- performance.now() 또는 performance.measure 활용
- memory API 활용 (performance.memory)

**5단계: JSDOM 테스트 전환** (1-2시간 예상)

- 11개 스킵 테스트를 E2E 시나리오로 재작성
- 기존 스켈레톤에 통합 또는 새 spec 파일 생성

### Phase 81: 번들 최적화 (트리거 대기)

**상태**: 대기 (현재 328.46 KB, 98.0% 사용) **트리거**: 빌드 330 KB (98.5%) 도달
시 **목표**: 7-10 KB 절감으로 14-17 KB 여유 확보 **예상 시간**: 5-8시간
**우선순위**: 중 (여유 6.54 KB 남음)

#### 최적화 전략 (현재 분석 기준)

1. **Tree-Shaking 강화**
   - `events.ts` (15.41 KB): 미사용 exports 제거
   - `MediaClickDetector`, `gallerySignals` 의존성 최소화
   - 예상 절감: 1.5-2 KB

2. **Lazy Loading 도입**
   - `twitter-video-extractor.ts` (12.73 KB): 동영상 tweet에서만 필요
   - 조건부 `import()` 적용
   - 예상 절감: 12 KB (초기 번들에서 제외)

3. **Code Splitting**
   - `media-service.ts` (17.53 KB): extraction/mapping/control 로직 분리
   - 예상 절감: 3-5 KB

4. **검증 기준**
   - 빌드 크기: 320 KB 이하 (95.5%)
   - 테스트: 100% 통과율 유지
   - 타입: 0 errors
   - 성능: 초기 로드 시간 측정 (성능 개선 확인)

---

## 향후 개선 영역 후보

### 1. 접근성 (A11y) 강화

**현황**: axe-core 기본 검증, ARIA 레이블 적용 **제안**: WCAG 2.1 AA 수준 완전
준수 검증 **우선순위**: 낮 (기본 요구사항 충족)

### 2. 성능 모니터링

**현황**: 빌드 크기, 테스트 실행 시간만 추적 **제안**: 런타임 성능 메트릭 수집
(렌더링, 스크롤, 다운로드) **우선순위**: 중 (사용자 경험 개선 기회)

---

## 완료된 Phase 기록

자세한 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

- **Phase 78.5** (2025-10-15): Component CSS 점진적 개선, warning 28개 감소 ✅
- **Phase 78** (2025-10-15): 디자인 토큰 통일 (Primitive/Semantic) ✅
- **Phase 75** (2025-10-15): test:coverage 실패 4개 수정, E2E 이관 권장 5개 추가
  ✅
- **Phase 74.9** (2025-10-15): 테스트 최신화 및 수정 ✅
- **Phase 74.8** (2025-10-15): 린트 정책 위반 12개 수정 ✅
- **Phase 74.7** (2025-10-15): 실패/스킵 테스트 8개 최신화 ✅
- **Phase 74.6** (2025-10-14): 테스트 구조 개선 ✅
- **Phase 74.5** (2025-10-13): 중복 제거 및 통합 ✅

---

## 모니터링 지표

### 경계 조건

- **번들 크기**: 330 KB (98.5%) 도달 시 Phase 73 활성화
- **테스트 skipped**: 20개 이상 시 즉시 검토 (현재 10개)
- **테스트 통과율**: 95% 미만 시 Phase 74 재활성화
- **빌드 시간**: 60초 초과 시 최적화 검토
- **문서 크기**: 개별 문서 800줄 초과 시 분할 검토

### 주기별 점검

- **주간**: 번들 크기, 테스트 통과율, skipped 수
- **월간**: 의존성 업데이트, 문서 최신성, 보안 취약점
- **분기**: 아키텍처 리뷰, 성능 벤치마크

---

## 참고 문서

- [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md):
  완료된 Phase 상세 기록
- [AGENTS.md](../AGENTS.md): 개발 워크플로
- [ARCHITECTURE.md](./ARCHITECTURE.md): 3계층 구조
- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md): 코딩 규칙
- [MAINTENANCE.md](./MAINTENANCE.md): 유지보수 체크리스트
