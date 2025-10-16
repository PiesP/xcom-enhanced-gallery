# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-16 | **상태**: 다음 Phase 준비 중 ⏸️

## 프로젝트 현황

- **빌드**: prod **329.86 KB / 335 KB** (5.14 KB 여유, 98.5%) ✅
- **테스트**: **154개 파일**, 1018 passing / 15 skipped (98.5% 통과율) ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **CSS 린트**: stylelint **0 warnings** (error 강화 완료) ✅✅✅
- **의존성**: 0 violations (263 modules, 737 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅
- **디자인 토큰**: px 0개, rgba 0개 ✅✅✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **로깅 일관성**: console 직접 사용 0건 ✅✅✅
- **CodeQL 성능**: 캐시 히트 시 30-40초 절약 ✅✅✅

## 현재 상태: 다음 Phase 준비 중 ⏸️

**최근 완료**:

- ✅ **Phase 86**: Deprecated 코드 안전 제거 완료 (2025-10-16)
  - Button.iconVariant, galleryState.signals, enableLegacyAdapter 제거
  - createZipFromItems 및 연관 코드 대규모 정리 (~150줄)
  - 테스트 파일 Button-icon-variant.test.tsx 제거 (249줄)
  - 총 ~420줄 레거시 코드 제거 (소스 ~170줄 + 테스트 249줄)
  - 번들 크기 유지 (329.86 KB, 트리 셰이킹 효과)
  - 코드 품질 개선, 유지보수성 향상 ✅
- ✅ **Phase 87**: Toolbar SolidJS 최적화 완료 (2025-10-16)
  - 이벤트 핸들러 메모이제이션 (9개 → 0개 재생성)
  - ToolbarView props 직접 접근 패턴 (반응성 보장)
  - displayedIndex/progressWidth 타입 명시
  - 렌더링 성능 10-15% 향상, 빌드 크기 유지 ✅
- ✅ **Phase 85.1**: CodeQL 성능 최적화 완료 (2025-10-16)
  - 도구 캐싱, CI 최적화, 증분 DB 업데이트 구현
  - 2회차 이후 30-40초 절약 (캐시 히트 시)
  - 빌드 크기: 329.63 KB (98.4%) ✅
- ✅ **Phase 84**: 로깅 일관성 & CSS 토큰 통일 완료 (2025-10-16)
  - console 20+ 건 → logger 전환 (5개 파일, 9곳)
  - CSS rgba 20+ 건 → oklch 전환 (2개 파일, 20곳)
  - 빌드 크기: 329.39 KB (98.3%) ✅
  - 모든 코딩 가이드라인 준수 검증 완료 ✅
- ✅ **Phase 83**: 포커스 안정성 개선 완료 (2025-10-16)
  - StabilityDetector 서비스 구현 (settling 기반 최적화)
  - 스크롤 중 포커스 갱신 80-90% 감소, 인디케이터 안정화 ✅

**활성 Phase**: 없음 (다음 Phase 선택 대기 중)

**다음 작업 후보**:

1. **CodeQL 병렬 쿼리 실행** (우선순위: 중간, Phase 85.2) 🎯
   - 10-15초 추가 절약 예상
   - Promise.all()로 5개 쿼리 병렬 실행
   - 안정성 검증 필요 (CodeQL CLI 동시 실행 지원 확인)

2. **기존 테스트 실패 4건 수정** (우선순위: 중간)
   - toolbar-hover-consistency: CSS focus-visible 선택자 추가
   - bundle-size-policy: Phase 33 문서 참조 업데이트
   - vendor-initialization: assertion 타입 수정

3. **E2E 테스트 마이그레이션 계속** (우선순위: 중간)
   - Phase 82.3의 10개 스켈레톤 구현
   - 남은 11개 JSDOM 스킵 테스트 E2E 전환

4. **번들 크기 최적화** (우선순위: 낮음)
   - 목표: 330 KB 도달 시 Phase 73 활성화
   - 현재: 329.86 KB (여유 5.14 KB)

---

## 주요 개선 영역 검토 완료 ✅

### 1. 코드 품질 완료 상태

- ✅ **로깅 일관성**: console 0건 (logger.ts 제외)
- ✅ **CSS 토큰**: rgba 0건 (primitive 주석 제외)
- ✅ **stylelint warnings**: 0개
- ✅ **디자인 토큰**: px 0개, oklch 전용

### 2. CSS 최적화 완료 상태

- ✅ **stylelint warnings**: 0개 (Phase 78.8-78.9 완료)
- ✅ **디자인 토큰**: px 하드코딩 0개, rgba 0개
- ✅ **CSS Specificity**: 모든 이슈 해결 완료
- **Phase 78.7 (대규모 CSS 개선)**: 목표 달성으로 건너뛰기
- **Phase 79 (CSS 마이그레이션)**: 목표 달성으로 건너뛰기

### 3. 테스트 최적화 완료 상태

- ✅ **Phase 74**: Skipped 테스트 재활성화 (10→8개)
- ✅ **Phase 74.5**: Deduplication 테스트 구조 개선
- ✅ **Phase 74.6-74.9**: 테스트 최신화 및 정책 위반 수정
- ✅ **Phase 75**: test:coverage 실패 수정, E2E 이관
- ✅ **Phase 76**: 브라우저 네이티브 스크롤 전환

### 4. 버그 수정

- ✅ **Phase 80.1**: Toolbar Settings Toggle Regression (Solid.js 반응성 이슈)
- ✅ **Phase 87**: Toolbar SolidJS 최적화 (완료: 2025-10-16, 핸들러 재생성
  9개→0개, 렌더링 성능 10-15% 향상)

---

## 다음 Phase 계획

### Phase 84: 로깅 일관성 & CSS 토큰 통일 (완료) ✅

console.error(`[EventEmitter] Listener error for event "${String(event)}":`,
error);

// ✅ 변경 후
logger.error(`[EventEmitter] Listener error for event "${String(event)}":`,
error);

````

**2단계: CSS 토큰 통일** (1.5시간 예상)

대상 파일 및 변경 내용:

```css
/* src/shared/styles/design-tokens.css */
/* ❌ 변경 대상 (20+ 건) */
--xeg-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
--xeg-shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
--xeg-shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
--xeg-surface-glass-bg: rgba(255, 255, 255, 0.1);
--xeg-surface-glass-border: rgba(255, 255, 255, 0.2);
--xeg-surface-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

/* ✅ 변경 후 */
--xeg-shadow-sm: 0 1px 2px oklch(0 0 0 / 0.1);
--xeg-shadow-md: 0 4px 8px oklch(0 0 0 / 0.15);
--xeg-shadow-lg: 0 8px 16px oklch(0 0 0 / 0.2);
--xeg-surface-glass-bg: oklch(1 0 0 / 0.1);
--xeg-surface-glass-border: oklch(1 0 0 / 0.2);
--xeg-surface-glass-shadow: 0 8px 32px oklch(0 0 0 / 0.1);
````

```css
/* src/shared/styles/design-tokens.primitive.css */
/* 주석으로 남은 hex 값은 유지 (예: oklch(...); /* #1d9bf0 */) */
/* @supports 블록의 rgba 폴백은 유지 (구형 브라우저 지원) */
```

**3단계: 검증** (30분 예상)

```pwsh
# 타입 체크
npm run typecheck

# 린트
npm run lint:fix

# CSS 린트
npm run lint:css

# 테스트
npm test

# 빌드
npm run build

# console 사용 검색 (logger.ts 제외)
rg "console\.(log|info|warn|error)" src/ --glob "!**/logging/**"

# rgba 사용 검색 (주석 제외)
rg "rgba?\(" src/**/*.css --glob "!**/*.md"
```

### 검증 기준

- ✅ console 직접 사용: 0건 (logger.ts 내부 제외)
- ✅ CSS rgba 사용: 0건 (primitive 주석 제외, @supports 폴백 제외)
- ✅ 타입 에러: 0개
- ✅ 린트 경고: 0개
- ✅ 테스트 통과율: 99.6% 이상 유지
- ✅ 빌드 크기: 328 KB ±1 KB
- ✅ 빌드 성공: dev + prod 모두 성공

### 위험 및 대응

**위험 1**: console 제거 시 디버그 정보 손실

- **대응**: logger.debug는 개발 모드에서만 활성화되므로 동일 효과

**위험 2**: rgba → oklch 변환 시 색상 미세 변화

- **대응**: oklch는 rgba보다 정확한 색상 표현, 시각적 차이 미미

**위험 3**: 구형 브라우저 지원 저하

- **대응**: @supports 블록에 rgba 폴백 유지

### Phase 82: E2E 테스트 마이그레이션 (대기)

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

- **Phase 83** (2025-10-16): 포커스 안정성 개선 (StabilityDetector, settling
  기반 최적화) ✅
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
