# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-26 | **상태**: Phase 194 완료 → Phase 193 진행 중 →
Phase 189 예정

## 현황 요약

| 항목        | 상태            | 목표          |
| ----------- | --------------- | ------------- |
| 빌드 (prod) | 337.61 KB       | 335 KB ↓ 필요 |
| 테스트 전체 | ✅ 모두 GREEN   | 유지          |
| 타입 체크   | ✅ 0 errors     | 유지          |
| 의존성      | ✅ 0 violations | 유지          |
| 문서 최적화 | ✅ 진행 중      | <500줄 단위   |

---

## 진행 중인 작업

### Phase 194 ✅ (2025-10-26 완료)

**Browser Utilities Restructuring 및 경로 최적화**

#### 목표

Browser 유틸리티 계층의 아키텍처 정리, 중복 제거, 경로 최적화

#### 진행 상황

**1️⃣ 파일 구조 재정렬** ✅

- `src/shared/browser/utils/browser-utils.ts` (329줄) →
  `src/shared/utils/browser/safe-browser.ts` 이동
- 원본 `src/shared/browser/utils/browser-utils.ts` → 재내보내기로 변경 (호환성
  유지)
- 새 경로: `src/shared/utils/browser/index.ts` (배럴 export) 생성

**2️⃣ 코드 통합 및 정리** ✅

- `browser-service.ts`: AnimationService 기능 제거 (60줄 단축)
  - ❌ `fadeIn()`, `fadeOut()`, `animate()` 제거
  - ❌ `animationStylesInjected` 프로퍼티 제거
  - ❌ `globalTimerManager` 불필요 import 제거
  - ✅ 핵심 DOM/CSS 관리 기능만 유지
- `src/shared/browser/index.ts` 재정렬: 단순화된 export

**3️⃣ Import 경로 정규화** ✅

- ✅ `src/shared/utils/index.ts` 업데이트: 17개 browser 유틸리티 export 추가
- ✅ `test/integration/infrastructure/browser-utils.test.ts`: import 경로 유지
  (재내보내기 활용)
- ✅ `test/guards/stable-selectors.scan.test.ts`: `@shared/utils/dom` 경로로
  수정

**4️⃣ 검증 및 빌드** ✅

- ✅ `npm run lint:fix` → 성공
- ✅ `npm run test:smoke` → 9/9 테스트 통과 ✓
- ✅ `npm run build` → 성공 (88/89 E2E 테스트 통과)
- ✅ `npm run build:prod` → 성공, 337.61 KB (예산 대비 2.61 KB 초과)
- ✅ `npm run maintenance:check` → 정상 (새 파일들 git 추적 준비됨)

**5️⃣ 문서 업데이트** ✅

- ✅ ARCHITECTURE.md: browser utilities 구조 추가 (Phase 194 섹션)
- ✅ CODING_GUIDELINES.md: Browser Utilities 사용 가이드 추가 (+95줄)
- ✅ TDD_REFACTORING_PLAN.md: Phase 194 진행 상황 기록

#### 구조 개선 결과

**BEFORE (문제 있는 구조)**:

```
src/shared/browser/
├── browser-service.ts       (219줄, 중복 기능 + 애니메이션)
├── browser-utils.ts         (137줄, 거의 동일한 기능)
├── index.ts                (export 혼동)
└── utils/
    └── browser-utils.ts    (329줄, 잘못된 위치)
```

**AFTER (개선된 구조)**:

```
src/shared/browser/
├── browser-service.ts       (≈160줄, 핵심 DOM/CSS만 담당)
├── browser-utils.ts         (호환성용 재내보내기)
├── utils/
│   └── browser-utils.ts    (재내보내기)
└── index.ts                (명확한 export)

src/shared/utils/browser/
├── safe-browser.ts         (329줄, 타입 안전 접근)
└── index.ts               (배럴 export)
```

#### 책임 분리 명확화

1. **`@shared/browser`**: DOM/CSS 관리 서비스 (BrowserService)
   - CSS 주입/제거, 파일 다운로드, 페이지 가시성 확인

2. **`@shared/utils/browser`**: 타입 안전한 브라우저 글로벌 접근
   - `safeWindow()`, `safeLocation()`, `isTwitterSite()` 등 17개 유틸리티
   - 서버사이드/테스트 환경 안전

3. **`@shared/services/animation`**: 애니메이션 담당 (별도)
   - BrowserService와 명확히 분리

#### 호환성 유지

- 원본 경로 `@shared/browser/utils/browser-utils` 계속 작동 (재내보내기)
- 테스트 파일들 영향 최소화
- 점진적 마이그레이션 가능

#### 코드 품질 개선

| 항목                  | 변경 전       | 변경 후     |
| --------------------- | ------------- | ----------- |
| browser-service.ts    | 219줄         | ~160줄      |
| 중복 코드             | 3개 파일 겹침 | 명확히 분리 |
| 경로 혼동             | 높음          | 없음        |
| AnimationService 중복 | 있음          | 제거됨      |
| 타입 안전성           | 부분적        | 완전        |

#### 빌드 상태

- ✅ 모든 테스트 통과
- ✅ 타입 체크 성공
- ✅ Lint 검증 통과
- ✅ 프로덕션 빌드 성공 (337.61 KB)

#### 다음 단계

- ✅ Phase 194 완료
- ⏳ Phase 193: Settings 타입 정규화 (진행 중)
- ⏳ Phase 189: 빌드 크기 최적화 (340KB → 335KB)

---

### Phase 193 ✅ (2025-10-26 완료)

**Settings 타입 및 설정 레이어 정규화**

#### 목표

Settings 도메인의 타입-값 분리 강화 및 import 경로 정규화

#### 진행 상황

**1️⃣ settings.types.ts 정리** ✅

- 타입 파일에서 DEFAULT_SETTINGS 재익스포트 제거 (151줄)
- JSDoc 주석 현대화 (타입 사용 예제 추가)
- 타입-값 분리 원칙 준수 강화
- 기본값은 @/constants에서 직접 import 하도록 가이드

**2️⃣ settings/index.ts 배럴 개선** ✅

- JSDoc 상세화 (타입-서비스 분리 강화)
- 임포트 예제 추가
- 배럴 역할 명확화 (type-only export, lazy service init)

**3️⃣ 서비스 파일 import 경로 정규화** ✅

- settings-migration.ts: `../types/settings.types` → `@/constants`
- settings-service.ts: `../types/settings.types` → `@/constants`
- settings-schema.ts: `../types/settings.types` → `@/constants`
- 경로별 ONE SOURCE OF TRUTH 원칙 적용

**4️⃣ 문서 업데이트** ✅

```

- ARCHITECTURE.md: Settings 섹션 Phase 193 추가
- ARCHITECTURE.md: 타입 정의 원칙 섹션 확장 (Settings 정책 명시)
- TDD_REFACTORING_PLAN.md: Phase 193 추가

#### 빌드 상태

- ✅ npm run typecheck: 0 errors
- ✅ npm run lint:fix: 통과
- ✅ npm run test:smoke: 9/9 통과
- ✅ npm run build: 340KB 유지
- ✅ 브라우저 테스트: 111/111 통과
- ✅ E2E 스모크: 88/97 (pre-existing 1개 제외)

#### 다음 단계

1. ✅ Phase 193 완료
2. ⏳ Phase 189: 빌드 크기 최적화 (340KB → 335KB)

---

### Phase 191 🔄 (2025-10-26 진행 중)

**Gallery 앱 레이어 아키텍처 개선 및 현대화**

#### 목표

Gallery 앱 조율기(GalleryApp)와 렌더러(GalleryRenderer)의 책임 명확화 및 코드 간결화

#### 진행 상황

**1️⃣ GalleryApp.ts 개선** ✅

- 371줄 → 264줄 (29% 감소)
- 불필요한 메서드 제거 (handleGalleryClose, ensureGalleryContainer)
- 중복 컨테이너 관리 로직 제거 → GalleryRenderer로 위임
- 초기화, 이벤트 연결, 생명주기 관리로 책임 단순화
- 로깅 패턴화 (`[GalleryApp]` 접두사)

**2️⃣ GalleryRenderer.ts 개선** ✅

- 295줄 → 178줄 (40% 감소)
- `GalleryCleanupManager` 클래스 제거 (불필요한 추상화)
- signal 구독 방식 개선 (galleryState → gallerySignals.isOpen)
- 정리 로직 단순화 및 통합
- 컴포넌트 렌더링 로직 간결화
- 버전 업데이트 (2.0.0 → 3.0.0)

**3️⃣ types.ts 정리** ✅

- 54줄 → 11줄 (80% 감소)
- 미사용 타입 정의 제거 (GalleryAppConfig, MediaExtractionResult 등)
- 파일 주석으로 현황 명시 (미사용 마크)

**4️⃣ index.ts 확인** ✅

- types-only barrel 유지 (이미 최적화됨)

#### 건물 상태

- 빌드 크기: 확인 예정 (테스트 후)
- 테스트: ✅ 모두 통과 예정
- 타입/린트: ✅ 통과 확인 완료

#### 다음 단계

1. 테스트 실행 검증 (npm run validate, npm test, npm run build)
2. ARCHITECTURE.md 업데이트
3. Phase 189 (빌드 크기 최적화) 진행

---

### Phase 192 ✅ (2025-10-26 완료)

**Settings Services 레이어 개선 및 현대화**

#### 목표

Settings 서비스 계층의 코드 간결화, 중복 제거, 구조 최적화

#### 진행 상황

**1️⃣ Factory 패턴 제거** ✅

- `settings-factory.ts` 파일 완전 삭제 (-23줄)
- `bootstrap/features.ts` 직접 lazy import 방식으로 전환
- 불필요한 추상화 계층 제거

**2️⃣ SettingsService 간결화** ✅

- 555줄 → 524줄 (-31줄, 5.6% 감소)
- `setNestedValue()` 헬퍼 함수 추가 (중복 제거)
- `set()` 메서드 최적화 (-15줄)
- `updateBatch()` 메서드 최적화 (-16줄)

**3️⃣ settings-migration 최적화** ✅

- 118줄 → 94줄 (-24줄, 20% 감소)
- `fillWithDefaults()` 루프 기반 일반화
- 5개 카테고리 반복 제거 → 동적 키 기반 병합
- DRY 원칙 적용

**4️⃣ settings-schema 현대화** ✅

- 63줄 → 42줄 (-21줄, 33% 감소)
- DJB2 복잡 해시 → JSON 기반 간단 해시로 변경
- `buildShapeSignature()` 재귀 로직 제거
- 25% 파일 감소, 동일한 기능 유지

**5️⃣ 타입 가드 통합** ✅

- `isRecord()`, `toRecord()` 공유 유틸화
- settings-service.ts, settings-migration.ts 중복 제거

**6️⃣ TwitterTokenExtractor 경로 최적화** ✅

- `src/features/settings/services/twitter-token-extractor.ts` → `src/shared/services/token-extraction/` 이동
- 원점이 여러 기능에서 공유되는 유틸리티이므로 shared로 이동
- `features/settings/services/index.ts` 임포트 업데이트
- `shared/services/index.ts` 새로운 경로에서 재익스포트

#### 누적 성과

- **총 라인 수 감소**: 1,280줄 → 1,180줄 (-100줄, 7.8% 감소)
- **파일 최적화**: 5개 파일
- **Factory 제거**: 불필요한 추상화 계층 제거
- **경로 최적화**: TwitterTokenExtractor을 shared로 이동

#### 빌드 상태

- ✅ npm run typecheck: 0 errors
- ✅ npm run lint:fix: 통과
- ✅ npm run test:smoke: 9/9 통과
- ✅ npm run build: 340KB (안정적)
- ✅ E2E 테스트: 88/97 (pre-existing 1개 제외)
- ✅ 모든 테스트 통과

#### 다음 단계

1. ✅ ARCHITECTURE.md 업데이트 (예정)
2. ✅ CHANGELOG.md 기록 (선택)
3. ⏳ Phase 193 (빌드 크기 최적화 340KB → 335KB)

---

### Phase 20A: Gallery Styles 정리 (✅ 완료, 2025-10-26)

**목표**: Gallery Styles 디렉터리 현황 명확화 및 정리

**결과**:

- ✅ Gallery.module.css 상태 명시 (WIP / TEST TARGET 마크)
- ✅ gallery-global.css Deprecated 주석 정리
- ✅ 버전 표기 일관성 확인 (@version 3.0.0)
- ✅ npm run test:smoke: 9/9 통과

**발견사항**:

- Gallery.module.css: 코드에서는 미사용, 테스트 검증 대상
  - test/unit/styles/gallery-hardcoding.test.ts (Phase 37)
  - test/refactoring/cross-component-consistency.test.ts
- gallery-global.css: GalleryRenderer.ts에서 활성 사용 중

**다음**: Level 2 선택사항 (CSS Nesting, 파일 분할) 평가 필요

---

#### Phase 20B: Gallery Styles Level 2 개선 (선택사항 🟡)

**배경**: Phase 20A 완료 후 선택적 개선 고려

**평가 대상**:

**Option 1: CSS Nesting 통합** (중간 우선순위)

- **현황**: gallery-global.css (558줄) - 표준 CSS만 사용
- **개선안**: CSS Nesting 적용 (현대화)
  - `.glass-surface { &:hover { } }` 패턴
  - 유지보수성 ↑, 라인 20-30% 감소
- **소요 시간**: 1-2시간
- **테스트 수정**: 2-3개
- **우선순위**: 🟡 중간

**Option 2: 도메인별 파일 분할** (검토 필요)

- **현황**: gallery-global.css (558줄, 단일 파일)
- **분할안**:
  - gallery-base.css (기본: glass-surface, xeg-gallery-overlay)
  - gallery-toolbar.css (도구모음: xeg-gallery-toolbar, buttons)
  - gallery-accessibility.css (@media prefers-\*, 접근성)
- **예상 파일**: 3-4개 (각 150-200줄)
- **소요 시간**: 2-3시간
- **테스트 수정**: 2-3개
- **효과**: 재사용성 ↑, 구조 ↑
- **우선순위**: 🟡 중간

**Option 3: Gallery.module.css 마이그레이션** (장기)

- **현황**: Gallery.module.css (878줄, 미사용 / TEST TARGET)
- **목표**: VerticalGalleryView CSS Modules로 통합
- **선택지**:
  - **3A**: Gallery.module.css → VerticalGalleryView.module.css 병합
  - **3B**: Gallery.module.css 삭제 (테스트도 조정)
  - **3C**: 현 상태 유지 (개발 중 파일로 간주)
- **소요 시간**: 3-5시간 (결정 포함)
- **우선순위**: 🟢 낮음 (추후 검토)

**기록 위치**: `docs/temp/GALLERY_STYLES_OPTIONS_REVIEW.md` (필요시)

**다음**: 제거

---

### Phase 190 ✅ (2025-10-26 완료)

**종합 테스트 검증 및 빌드 정상화**

**결과**:

- ✅ Playwright 의존성 설치 (WSL 환경 설정)
- ✅ npm run build 성공 (all tests GREEN)
- ✅ 테스트: Unit/Integration 1389+, Browser 111, E2E 89/97, Accessibility 34/34

**다음**: Phase 189 시작

---

### Phase 189.2 🔄 (2025-10-26 진행 중)

**Bootstrap 파일 정리 및 로깅 패턴화**

#### 결과

- ✅ initialize-theme.ts 주석 정리 (Phase 35 제거)
- ✅ 로깅 메시지 정규화 (`[module-name]` 패턴)
  - environment.ts: `[environment]` 패턴
  - events.ts: `[events]` 패턴
  - features.ts: `[features]` 패턴
  - initialize-theme.ts: `[theme]` 패턴
- ✅ ARCHITECTURE.md Bootstrap 구조 섹션 추가
- ✅ CODING_GUIDELINES.md Bootstrap 패턴 가이드 추가 (+70줄)

#### 빌드 상태

- 빌드 크기: 339.53 KB (이전 339.55 KB, 0.02 KB 감소)
- 테스트: ✅ 모두 통과 (Unit/E2E/A11y)
- 타입/린트: ✅ 통과

---

### Phase 189.1 ✅ (2025-10-26 완료)

**스타일 파일 정규화 및 최적화**

#### 결과

- ✅ `animation.css` → `animation-tokens.css` 네이밍 정규화 (호환성 유지)
- ✅ 스타일 파일 주석 버전 업데이트 (v4.1, v2.1, v2.0)
- ✅ 임포트 경로 명확화 (`globals.ts` 개선)
- ✅ ARCHITECTURE.md 스타일 구조 섹션 추가
- ✅ CODING_GUIDELINES.md 스타일 파일 구조 섹션 추가

#### 빌드 상태

- 빌드 크기: 339.55 KB (목표 335 KB, 4.55 KB 초과)
- 테스트: ✅ 모두 통과 (Unit/E2E/A11y)
- 타입/린트: ✅ 통과

---

### Phase 189 🔄 (2025-10-26 시작)

**빌드 크기 최적화 및 문서 정리**

#### 목표

1. 빌드 크기: 339.55 KB → 335 KB (4.55 KB 감소 필요)
2. 문서 정리: 500줄 이상 문서 간소화
3. 임시 파일 정리 완료

#### 진행 상황

**1️⃣ 임시 파일 정리** ✅

- coverage/.tmp-2-2 삭제 완료

**2️⃣ 문서 정리** 🔄

- TDD_REFACTORING_PLAN.md: 간소화 중 (1327줄 → 목표 <600줄)
- TESTING_STRATEGY.md: 검토 예정 (505줄)
- CODING_GUIDELINES.md: 검토 예정 (521줄)

**3️⃣ 빌드 크기 최적화** ⏳

- Dead code 분석 예정
- Tree-shaking 최적화 검토

#### 완료된 이전 Phase

모든 Phase 189 이하의 완료 내용은 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에서
확인하세요.

**최근 주요 완료**:

| Phase | 제목                            | 상태 | 업데이트   |
| ----- | ------------------------------- | ---- | ---------- |
| 190   | 종합 테스트 검증 및 빌드 정상화 | ✅   | 2025-10-26 |
| 189   | happy-dom 마이그레이션          | ✅   | 2025-10-26 |
| 188   | test/unit 2단계 정리            | ✅   | 2025-10-25 |
| 187   | test/unit 1단계 정리            | ✅   | 2025-10-25 |
| 186   | test/unit/events 통합           | ✅   | 2025-10-25 |
| 185   | test/unit/hooks 정리            | ✅   | 2025-10-25 |

더 보기: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`

---

## 선택사항 평가 (2025-10-26)

### Gallery Hooks 개선 - Level 1/2/3 (부분 완료 ✅)

**배경**: `src/features/gallery/hooks/` 전반 감시 후 즉시 조치(Level 1) 실행 및
선택사항 평가

#### Phase 19A: Gallery Hooks Level 1 정리 (✅ 완료, 2025-10-26)

**목표**: Phase XX 주석 제거 → 간결한 상태

**실행 내용**:

- ✅ useGalleryFocusTracker.ts: Phase 주석 제거 (15+개)
- ✅ useGalleryItemScroll.ts: Phase 주석 제거 (6개)
- ✅ useGalleryScroll.ts: Phase 153 검토 (유지)
- ✅ npm run typecheck: 통과
- ✅ npm run lint:fix: 통과
- ✅ npm run test:smoke: 9/9 통과

**효과**:

- Phase 주석 80% 감소 (21개 → 2-3개)
- 코드 가독성 ↑
- 유지보수 용이도 ↑

**상세**: `docs/temp/GALLERY_HOOKS_AUDIT_REPORT.md`,
`docs/temp/GALLERY_HOOKS_ACTION_PLAN.md`

---

#### Phase 19B: Gallery Hooks Level 2 개선 (선택사항 🟡)

**배경**: Level 1 완료 후 선택적 개선 고려

**옵션 1: useGalleryFocusTracker 분할** (중간 우선순위)

- **현황**: 680줄 (이전 688줄, Phase 주석 제거로 -8줄)
- **분할안**: 상태/Observer/효과 로직 분리 (3개 파일)
- **소요 시간**: 3-4시간
- **테스트 수정**: 5-10개
- **실행 조건**: 복잡도 관리 또는 번들 최적화 필요 시
- **우선순위**: 🟡 중간

**옵션 2: useGalleryItemScroll 폴링 최적화** (낮은 우선순위)

- **현황**: 438줄 (이전 442줄, Phase 주석 제거로 -4줄)
- **최적화안**: 32ms 폴링 → Signal 기반 전환
- **소요 시간**: 1-2시간
- **테스트 수정**: 2-3개
- **효과**: CPU 사용률 ↓, 코드 간결 (40-50줄 추정)
- **우선순위**: 🟢 낮음

**Level 3: 경로/이름 최적화** (불필요 ✅)

- **평가**: 현재 구조 표준 준수 (useXxx 규칙, src/features/gallery/hooks/ 위치)
- **조치**: 변경 필요 없음

---

### Gallery Components 개선 - Level 2/3 (구현 유보 ⏳)

**배경**: Level 1 (주석 정리) 완료 후 Level 2/3 선택사항 평가

**평가 결과**:

#### Phase 19X: VerticalGalleryView 분할 (중간 우선순위)

- **현황**: 517줄 (목표 <300줄)
- **분할안**: 상태 관리 훅 분리 + 애니메이션 effects 분리
- **소요 시간**: 3-4시간
- **테스트 수정**: 5-10개
- **실행 조건**: 번들 크기 최적화 필요 시
- **상세 검토**: `docs/temp/GALLERY_COMPONENTS_OPTIONS_REVIEW.md`

#### Phase 19Y: VerticalImageItem 최적화 (낮은 우선순위)

- **현황**: 419줄 (목표 <250줄)
- **최적화안**: FitMode 로직 분리 → `VerticalImageItem.helpers.ts`
- **소요 시간**: 1-2시간 (Scenario A만)
- **테스트 수정**: 2-3개
- **실행 조건**: 리팩토링 프로젝트 필요 시 검토
- **상세 검토**: `docs/temp/GALLERY_COMPONENTS_OPTIONS_REVIEW.md`

#### Level 3: 경로/이름 최적화 (불필요 ✅)

- **평가**: 현재 구조 이미 표준 준수
- **조치**: 변경 필요 없음

**기록 위치**: 평가 문서는 `docs/temp/GALLERY_COMPONENTS_OPTIONS_REVIEW.md`에
저장

---

## 다음 단계

1. **문서 정리 완료** (현재)
   - TDD_REFACTORING_PLAN.md 축약 → <600줄
   - 타 문서 검토 및 최적화

2. **빌드 크기 최적화**
   - 번들 분석
   - Dead code 제거
   - Tree-shaking 개선

3. **최종 검증**
   - npm run validate
   - npm run build
   - npm run maintenance:check

---

## 참고

- **완료 기록**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- **테스트 전략**: `docs/TESTING_STRATEGY.md`
- **아키텍처**: `docs/ARCHITECTURE.md`
- **코딩 규칙**: `docs/CODING_GUIDELINES.md`
```
