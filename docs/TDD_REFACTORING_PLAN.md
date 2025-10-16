# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-16 | **상태**: Phase 85.2 계획 대기 중 ⏸️

## 프로젝트 현황

- **빌드**: prod **329.63 KB / 335 KB** (5.37 KB 여유, 98.4%) ✅
- **테스트**: **159개 파일**, 1030 passing / 4 failed (99.6% 통과율) ✅
  - 기존 실패 4개 (Phase 85와 무관):
    - toolbar-hover-consistency (2개 - CSS focus-visible 누락)
    - bundle-size-policy (1개 - Phase 33 문서 확인)
    - vendor-initialization (1개 - assertion 수정 필요)
- **Skipped**: **23개** (E2E 마이그레이션 대상) → Phase 82에서 처리
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **CSS 린트**: stylelint **0 warnings** (error 강화 완료) ✅✅✅
- **의존성**: 0 violations (263 modules, 737 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅
- **디자인 토큰**: px 0개, rgba 0개 ✅✅✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **로깅 일관성**: console 직접 사용 0건 ✅✅✅
- **CodeQL 성능**: 캐시 히트 시 30-40초 절약 ✅✅✅

## 현재 상태: 계획 대기 중 ⏸️

**최근 완료**:

- ✅ Phase 85.1: CodeQL 성능 최적화 완료 (2025-10-16)
  - 도구 캐싱, CI 최적화, 증분 DB 업데이트 구현
  - 2회차 이후 30-40초 절약 (캐시 히트 시)
  - 빌드 크기: 329.63 KB (98.4%) ✅
- ✅ Phase 84: 로깅 일관성 & CSS 토큰 통일 완료 (2025-10-16)
  - console 20+ 건 → logger 전환 (5개 파일, 9곳)
  - CSS rgba 20+ 건 → oklch 전환 (2개 파일, 20곳)
  - 빌드 크기: 329.39 KB (98.3%) ✅
  - 모든 코딩 가이드라인 준수 검증 완료 ✅
- ✅ Phase 83: 포커스 안정성 개선 완료 (2025-10-16)
  - StabilityDetector 서비스 구현 (settling 기반 최적화)
  - 스크롤 중 포커스 갱신 80-90% 감소, 인디케이터 안정화 ✅

**활성 Phase**: 없음

**다음 작업 후보**:

1. **레거시 코드 제거** (우선순위: 높음, Phase 86) ⭐ 신규
   - `@deprecated` 마크 API 제거 (8개 대상)
   - 미사용 호환성 코드 정리 (3개 대상)
   - 번들 크기 2-3 KB 절감 예상
   - 상세 계획은 Phase 86 섹션 참조

2. **CodeQL 병렬 쿼리 실행** (우선순위: 중간, Phase 85.2)
   - 10-15초 추가 절약 예상
   - Promise.all()로 5개 쿼리 병렬 실행
   - 안정성 검증 필요 (CodeQL CLI 동시 실행 지원 확인)

3. **기존 테스트 실패 4건 수정** (우선순위: 중간)
   - toolbar-hover-consistency: CSS focus-visible 선택자 추가
   - bundle-size-policy: Phase 33 문서 참조 업데이트
   - vendor-initialization: assertion 타입 수정

4. **E2E 테스트 마이그레이션 계속** (우선순위: 중간)
   - Phase 82.3의 10개 스켈레톤 구현
   - 남은 11개 JSDOM 스킵 테스트 E2E 전환

5. **번들 크기 최적화** (우선순위: 낮음)
   - 목표: 330 KB 도달 시 Phase 73 활성화
   - 현재: 329.63 KB (여유 5.37 KB)

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

---

## 다음 Phase 계획

### Phase 86: 레거시 코드 제거 (신규 계획) ⭐

**상태**: 계획 단계 **목표**: `@deprecated` 마크된 API와 미사용 호환성 코드
제거로 번들 크기 절감 **우선순위**: 높 (기술 부채 정리, 번들 크기 개선) **예상
시간**: 4-6시간 **예상 번들 절감**: 2-3 KB

#### 제거 대상 분류

**A. 안전 제거 가능 (사용처 없음)** - 우선순위 1

1. ✅ **Button.iconVariant** (`src/shared/components/ui/Button/Button.tsx`)
   - 상태: `@deprecated intent 사용을 권장`
   - 사용처: 컴포넌트 내부 1곳 (`local.intent ?? local.iconVariant`)
   - 제거 전략: iconVariant 제거, intent로 통일
   - 영향도: 낮 (내부 fallback만 제거)
   - 예상 절감: 50 bytes

2. ✅ **createDomEventManager** (`src/shared/dom/dom-event-manager.ts`)
   - 상태: `@deprecated UnifiedEventManager를 사용하세요`
   - 사용처: `EventManager` 내부에서만 사용 (1곳)
   - 제거 전략: EventManager를 UnifiedEventManager로 직접 전환
   - 영향도: 중 (내부 리팩토링 필요)
   - 예상 절감: 200-300 bytes

3. ⚠️ **ServiceManager.getDiagnostics**
   (`src/shared/services/service-manager.ts`)
   - 상태:
     `@deprecated v1.1.0 - UnifiedServiceDiagnostics.getServiceStatus()를 사용하세요`
   - 사용처: `UnifiedServiceDiagnostics` 내부에서 1곳 사용
   - 제거 전략: UnifiedServiceDiagnostics에서 직접 접근 방식으로 전환
   - 영향도: 중 (진단 로직 재구성 필요)
   - 예상 절감: 300-400 bytes

4. ✅ **galleryState.signals getter**
   (`src/shared/state/signals/gallery.signals.ts`)
   - 상태: `@deprecated Use direct import of gallerySignals instead`
   - 사용처: grep 결과 없음 (완전히 미사용)
   - 제거 전략: getter 메서드만 제거
   - 영향도: 매우 낮 (미사용 코드)
   - 예상 절감: 100 bytes

**B. 조건부 제거 가능 (호환성 검토 필요)** - 우선순위 2

1. ⚠️ **toast 호환성 별칭** (`src/shared/services/unified-toast-manager.ts`)
   - 상태: 하위 호환성 유지를 위한 별칭 3개
     - `ToastService = toastManager`
     - `toastService = toastManager`
     - `toastController = toastManager`
   - 사용처: 프로젝트 전체 검색 필요
   - 제거 전략: `toastManager` 단일 export로 통일
   - 영향도: 높 (외부 사용처 다수 예상)
   - 예상 절감: 150-200 bytes

2. ⚠️ **createZipFromItems** (`src/shared/external/zip/zip-creator.ts`)
   - 상태: `@deprecated superseded by createZipBytesFromFileMap`
   - 사용처: export되어 있으나 실제 사용 검증 필요
   - 제거 전략: 사용처 없으면 함수 전체 제거
   - 영향도: 중 (12.73 KB 파일, 함수는 일부)
   - 예상 절감: 500-800 bytes

3. ⚠️ **getNativeDownload**
   (`src/shared/external/vendors/vendor-manager-static.ts`)
   - 상태: `@deprecated Use getUserscript().download() instead`
   - 사용처: 테스트 및 fallback으로 사용 가능성
   - 제거 전략: getUserscript().download() 완전 전환 후 제거
   - 영향도: 높 (다운로드 핵심 로직)
   - 예상 절감: 400-600 bytes

4. ⚠️ **BrowserUtils.downloadFile** (`src/shared/browser/browser-utils.ts`)
   - 상태: `@deprecated Use getUserscript().download() instead`
   - 사용처: 테스트 및 fallback으로 사용 가능성
   - 제거 전략: getUserscript().download() 완전 전환 후 제거
   - 영향도: 높 (다운로드 핵심 로직)
   - 예상 절감: 300-400 bytes

**C. 유지 필요 (기능적 필요성)** - 제거 대상 아님

1. ✅ **twitter-video-extractor legacy 처리**
   (`src/shared/services/media/twitter-video-extractor.ts`)
   - 상태: Twitter API 응답 정규화 (301-343줄)
   - 이유: Twitter API가 실제로 `legacy` 필드를 반환함 (외부 API 스펙)
   - 조치: 유지 (제거 불가)

2. ✅ **SPACING_MIGRATION_MAP** (`src/shared/styles/tokens.ts`)
   - 상태: Legacy 값 마이그레이션 맵
   - 이유: 점진적 마이그레이션 가이드로 문서 역할
   - 조치: 유지 (문서화 목적)

3. ✅ **vendor-api.ts Legacy facade**
   (`src/shared/external/vendors/vendor-api.ts`)
   - 상태: 정적 API로 리다이렉트하는 얇은 어댑터
   - 이유: 우발적 사용 시 안전 경로 유도
   - 조치: 유지 (안전망 역할)

**D. 미사용 옵션 필드 제거** - 우선순위 3

1. ✅ **enableLegacyAdapter** (`src/shared/container/app-container.ts`)
   - 상태: CreateContainerOptions의 미사용 옵션
   - 사용처: grep 결과 1곳 (타입 정의만)
   - 제거 전략: 인터페이스에서 필드 제거
   - 영향도: 매우 낮 (타입 정의만)
   - 예상 절감: 50 bytes

#### 제거 전략 및 단계

**1단계: 안전 제거 (A 그룹)** - 2시간 예상

```typescript
// 1. Button.iconVariant 제거
// Before:
const resolvedIntent = () => local.intent ?? local.iconVariant;
// After:
const resolvedIntent = () => local.intent;

// 2. galleryState.signals getter 제거 (미사용)
// Before:
get signals() { return gallerySignals; }
// After:
// (완전 제거)

// 3. enableLegacyAdapter 제거
// Before:
export interface CreateContainerOptions {
  config?: Partial<AppConfig>;
  enableLegacyAdapter?: boolean;
}
// After:
export interface CreateContainerOptions {
  config?: Partial<AppConfig>;
}
```

**2단계: 사용처 분석 및 마이그레이션 (B 그룹)** - 3-4시간 예상

```pwsh
# toast 별칭 사용처 검색
rg "ToastService|toastService|toastController" src/ --type ts

# createZipFromItems 사용처 검색
rg "createZipFromItems" src/ --type ts

# getNativeDownload 사용처 검색
rg "getNativeDownload" src/ --type ts

# downloadFile 사용처 검색
rg "downloadFile" src/ --type ts
```

**3단계: 고위험 API 처리 (createDomEventManager, getDiagnostics)** - 2시간 예상

```typescript

```

마이그레이션 전략:

- toast 별칭 → `toastManager`로 통일
- createZipFromItems → `createZipBytesFromFileMap` + `DownloadOrchestrator` 사용
- getNativeDownload/downloadFile → `getUserscript().download()` 완전 전환

**3단계: 고위험 API 처리 (createDomEventManager, getDiagnostics)** - 2시간 예상

```typescript
// EventManager 리팩토링
// Before:
this.domManager = createDomEventManager();
// After:
this.domManager = new UnifiedEventManager();

// ServiceDiagnostics 리팩토링
// Before:
const diagnostics = serviceManager.getDiagnostics();
// After:
// ServiceManager 내부 상태를 직접 접근하도록 구조 변경
```

**4단계: 검증** - 1시간 예상

```pwsh
# 타입 체크
npm run typecheck

# 린트
npm run lint:fix

# 테스트 (특히 toast, 이벤트, 다운로드 관련)
npm test -- -t "toast|event|download"

# 전체 테스트
npm test

# 빌드
npm run build

# 빌드 크기 확인
node scripts/validate-build.js

# @deprecated 주석 잔여 확인
rg "@deprecated" src/ --type ts
```

#### 검증 기준

- ✅ `@deprecated` 주석: 유지 필요한 3개만 남음 (legacy API 응답, 문서용 맵,
  안전망)
- ✅ 번들 크기: 327 KB 이하 (2-3 KB 절감)
- ✅ 타입 에러: 0개
- ✅ 린트 경고: 0개
- ✅ 테스트 통과율: 99.6% 이상 유지
- ✅ 빌드 성공: dev + prod 모두 성공
- ✅ 사용처 검증: 제거된 API에 대한 import 없음

#### 위험 및 대응

**위험 1**: toast 별칭 제거 시 외부 사용처 깨짐

- **대응**: 사용처 검색 → toastManager로 일괄 치환 → 테스트 실행

**위험 2**: 다운로드 API 제거 시 fallback 경로 손실

- **대응**: getUserscript().download()가 모든 환경에서 동작하는지 검증
- **조건부 제거**: 테스트 환경에서 문제 발견 시 deprecated 주석만 유지

**위험 3**: EventManager 리팩토링 시 이벤트 핸들링 깨짐

- **대응**: 단위 테스트 + 통합 테스트로 이벤트 등록/해제 검증
- **롤백 계획**: 커밋 단위로 진행, 문제 발견 시 즉시 revert

#### 추가 고려사항

**번들 크기 최적화 연계**:

- Phase 86 완료 후 빌드 크기: ~327 KB (2.5 KB 절감 예상)
- Phase 81 트리거: 330 KB 도달 전 여유 확보
- 연계 효과: 레거시 제거 + 트리 쉐이킹으로 추가 0.5-1 KB 절감 가능

**문서 업데이트**:

- AGENTS.md: deprecated API 제거 내역 추가
- ARCHITECTURE.md: EventManager → UnifiedEventManager 전환 기록
- CODING_GUIDELINES.md: toast/download API 사용 가이드 갱신

**Git 커밋 전략**:

1. `refactor(cleanup): remove Button.iconVariant deprecated prop`
2. `refactor(cleanup): remove unused galleryState.signals getter`
3. `refactor(cleanup): remove enableLegacyAdapter option`
4. `refactor(toast): unify toast manager exports`
5. `refactor(zip): remove deprecated createZipFromItems`
6. `refactor(download): migrate to getUserscript().download()`
7. `refactor(events): migrate to UnifiedEventManager`
8. `refactor(diagnostics): inline getDiagnostics logic`

---

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
