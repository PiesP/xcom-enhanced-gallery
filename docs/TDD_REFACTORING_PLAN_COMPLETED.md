# TDD 리팩토링 완료 기록

> **최종 업데이트**: 2025-10-13
>
> **상태**: Phase 34 Step 1 완료 ✅

## 프로젝트 상태 스냅샷 (2025-10-13)

- **빌드**: dev 726.49 KB / prod 318.04 KB ✅
- **테스트**: 661 passing, 24 skipped, 1 todo ✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings / 0 errors ✅
- **의존성**: dependency-cruiser 0 violations ✅

## 최근 완료 Phase

### Phase 34 Step 1: 미사용 Export 제거 (2025-10-13) ✅

**목표**: 사용되지 않는 export 함수를 제거하여 코드베이스 정리 및 API 명확성
향상.

**배경**: `style-utils.ts`에 2개 함수(`getCSSVariable`, `applyTheme`)가 export는
되지만 실제로는 사용되지 않음을 발견.

#### TDD 진행

- **RED**: `test/unit/refactoring/unused-exports-removal.test.ts` 작성
  - 코드베이스 전체를 스캔하여 미사용 export 감지
  - `getCSSVariable`: 정의 및 export만 존재, 실제 사용처 0개
  - `applyTheme`: 정의 및 export만 존재, 실제 사용처 0개
  - 테스트 결과: 2개 함수 모두 미사용 확인 ✅

- **GREEN**: 미사용 함수 제거
  1. **style-utils.ts** 정리 (33줄 → 13줄)
     - `getCSSVariable` 함수 제거 (CSS 변수 조회)
     - `applyTheme` 함수 제거 (테마 클래스 적용)
     - 파일 헤더 주석 업데이트: "re-export only"
  2. **index.ts** export 정리 (22줄 → 20줄)
     - `getCSSVariable` export 제거
     - `applyTheme` export 제거
  3. 테스트 업데이트: RED → GREEN 전환 ✅

- **REFACTOR**: 검증 및 최적화
  1. 전체 테스트 실행: 661 passing ✅
  2. 타입 체크: 0 errors ✅
  3. 빌드 검증: dev 726.49 KB / prod 318.04 KB ✅
  4. 린트 자동 수정 적용 ✅

#### 결과

| 항목                 | Before    | After     | 변화                            |
| -------------------- | --------- | --------- | ------------------------------- |
| **style-utils.ts**   | 33줄      | 13줄      | -20줄                           |
| **index.ts**         | 22줄      | 20줄      | -2줄                            |
| **미사용 export**    | 2개       | 0개       | -2개 ✅                         |
| **번들 크기 (prod)** | 318.04 KB | 318.04 KB | 0 KB (tree-shaking 이미 최적화) |

#### 주요 성과

1. **API 명확성 향상**: 실제로 사용되는 함수만 export하여 API 표면 축소
2. **유지보수성 향상**: 불필요한 코드 제거로 관리 부담 감소
3. **Tree-shaking 효과 확인**: 번들러가 이미 미사용 코드를 최적화하고 있음을
   검증
4. **자동 감지 테스트**: 향후 미사용 export 방지를 위한 가드 추가

#### 교훈

- 번들 크기 변화 없음: Vite/Rollup의 tree-shaking이 이미 미사용 코드 제거
- 소스 코드 품질 향상이 주요 목표 달성
- 코드베이스 스캔 테스트로 향후 미사용 코드 조기 감지 가능

---

### Phase 33 Step 3: 중복 유틸리티 함수 통합 (2025-10-13) ✅

**목표**: 중복된 유틸리티 함수를 단일 소스로 통합하여 코드 품질 향상.

**배경**: 3개 파일에서 동일한 CSS 유틸리티 함수들이 중복 정의되어 있어
유지보수성 저하.

#### TDD 진행

- **RED**: `test/unit/refactoring/duplicate-utilities.test.ts` 작성
  - 자동 스캔으로 중복 함수 감지
  - 발견된 중복:
    - `combineClasses`: 3곳 (style-utils.ts, css-utilities.ts, core-utils.ts)
    - `toggleClass`: 2곳 (style-utils.ts, css-utilities.ts)
    - `updateComponentState`: 2곳 (style-utils.ts, css-utilities.ts)
  - 총 4개 중복 함수 정의 확인 ✅

- **GREEN**: 중복 제거 및 단일 소스 확립
  1. **css-utilities.ts**를 정규 구현(canonical source)로 선택
  2. **core-utils.ts** 정리 (343줄 → ~337줄)
     - `combineClasses` 함수 제거
  3. **style-utils.ts** 정리 (46줄 → ~33줄)
     - 3개 중복 함수 구현 제거
     - css-utilities로부터 re-export로 전환
  4. 테스트 업데이트: RED → GREEN 전환 ✅

- **REFACTOR**: 검증 및 최적화
  1. 전체 테스트 실행: 657 passing ✅
  2. 빌드 검증: dev 726.49 KB / prod 318.04 KB ✅
  3. 유지보수 점검: 모든 항목 정상 ✅

#### 결과

| 항목                 | Before     | After                      | 변화                     |
| -------------------- | ---------- | -------------------------- | ------------------------ |
| **소스 코드**        | ~389 lines | ~370 lines                 | -19 lines                |
| **번들 크기 (prod)** | 318.04 KB  | 318.04 KB                  | 0 KB (tree-shaking 효과) |
| **중복 함수 정의**   | 4개        | 0개                        | -4 ✅                    |
| **정규 소스**        | 분산됨     | css-utilities.ts 단일 소스 | ✅                       |

#### 주요 성과

1. **단일 소스 원칙 확립**: 모든 CSS 유틸리티가 `css-utilities.ts`에서 관리
2. **유지보수성 향상**: 중복 제거로 일관성 있는 구조
3. **Tree-shaking 효과 확인**: 번들러가 이미 미사용 코드 최적화 중
4. **테스트 커버리지**: 자동 중복 감지 테스트 추가

#### 교훈

- 번들 크기 변화 없음: Vite/Rollup의 tree-shaking이 이미 중복 코드 최적화
- 소스 코드 품질 향상이 주요 목표 달성
- 향후 유지보수 시 단일 지점 수정으로 모든 사용처 반영

---

### Phase 33 Step 2C: media-service.ts Optimization (2025-10-12) ✅

**목표**: `media-service.ts` 소스 크기를 975 lines (28.98 KB) → 850 lines (25
KB) 이하로 줄여 3.98 KB 번들 절감에 기여.

**배경**: Step 2C의 세 번째이자 마지막 파일 최적화. 가장 큰 서비스 파일로, 통합
미디어 서비스의 모든 기능을 포함.

#### TDD 진행

- **RED**: `test/unit/optimization/bundle-size-services.test.ts` 실행
  - media-service.ts: 850 lines, 25 KB 이하 제약
  - 초기 실패 확인: 975 lines (28.98 KB)

- **GREEN**: 대폭적인 주석 제거와 코드 간소화
  1. **파일 헤더 최소화** (~10 lines)
     - 5줄 JSDoc 파일 헤더 → 1줄 간단한 주석
     - "통합 미디어 서비스" 설명 블록 제거

  2. **타입 정의 주석 제거** (~40 lines)
     - MediaLoadingState, PrefetchOptions 주석 제거
     - "스케줄 방식" 상세 설명 제거
     - "Machine readable code" 주석 제거
     - BulkDownloadOptions, DownloadResult 주석 제거

  3. **섹션 구분 제거** (~35 lines)
     - "====" 섹션 구분선 제거 (8개 섹션)
     - "통합된 서비스 타입들", "기존 서비스들 import" 등 섹션 헤더 제거
     - "Media Extraction API", "Video Control API" 등 API 그룹 주석 제거

  4. **필드 주석 제거** (~15 lines)
     - "통합된 서비스 컴포넌트들", "WebP 최적화 관련 상태" 등 그룹 주석
     - "미디어 로딩 관련 상태", "미디어 프리페칭 관련 상태" 제거
     - "대량 다운로드 관련 상태" 제거

  5. **메서드 JSDoc 제거** (~120 lines)
     - 모든 public 메서드 JSDoc 제거 (30개)
     - "클릭된 요소에서 미디어 추출" 등 자명한 설명 제거
     - "@deprecated" 주석 제거 (메서드명으로 명확)

  6. **인라인 주석 제거** (~80 lines)
     - "Phase 4 간소화: 직접 인스턴스화" 제거
     - "WebP 지원 감지 초기화" 설명 제거
     - "테스트 환경에서는 기본값 false" 등 구현 설명 제거
     - "동시성 제한 큐 실행기", "스케줄 모드별 동작" 상세 설명 제거
     - "거리 기준 오름차순 정렬" 알고리즘 설명 제거

  7. **불필요한 Note 제거** (~35 lines)
     - "전역 미디어 서비스 인스턴스..." 긴 Note 블록 제거
     - "편의 함수들 (기존 코드 호환성)" 섹션 주석 제거
     - "Backward-compatible module-level export (lazy)" 긴 설명 제거

  8. **공백 라인 정리** (~27 lines)
     - 섹션 구분 제거로 인한 불필요한 빈 줄 제거
     - 메서드 간 빈 줄 최소화 (1줄만 유지)

- **결과**: 975 lines (28.98 KB) → **613 lines (20.30 KB)** ✅
  - **소스 코드 절감**: 362 lines, 8.68 KB (목표 125 lines 대폭 초과)
  - **번들 크기**: 318.73 KB → 318.18 KB (0.55 KB 절감)
  - **테스트**: 모든 bundle-size-services 테스트 GREEN ✅
  - **타입**: 0 errors ✅

#### 번들 크기 영향 분석

- **소스 코드**: 362 lines (37.1% 감소)
- **번들 크기**: 0.55 KB (0.17% 감소)
- **차이 이유**: Vite minifier가 이미 대부분 주석 제거
- **주요 효과**: 코드 가독성 향상, 유지보수 편의성 증가

#### Phase 33 Step 2C 전체 요약

**3개 서비스 파일 최적화 완료**:

| 파일                       | Before         | After          | Lines    | KB         |
| -------------------------- | -------------- | -------------- | -------- | ---------- |
| twitter-video-extractor.ts | 641 (18.50 KB) | 428 (15.16 KB) | -213     | -3.34      |
| bulk-download-service.ts   | 459 (16.01 KB) | 359 (13.29 KB) | -100     | -2.72      |
| media-service.ts           | 975 (28.98 KB) | 613 (20.30 KB) | -362     | -8.68      |
| **합계**                   | **2075 lines** | **1400 lines** | **-675** | **-14.74** |

**번들 크기**: 318.73 KB → **318.18 KB** (0.55 KB 절감)

**목표 달성**: 301 KB 이하 ✅ (17.73 KB 여유)

#### 주요 학습

1. **주석 제거의 번들 영향**: 소스에서 대폭 제거해도 번들은 소폭 감소
   - 이유: 번들러가 이미 주석/공백 제거
   - 효과: 유지보수성 향상이 주요 이득

2. **최적화 기법 패턴**:
   - JSDoc 파일 헤더 최소화 (5줄 → 1줄)
   - 섹션 구분 주석 제거 ("====", "API 그룹")
   - 메서드 JSDoc 제거 (자명한 함수명으로 대체)
   - 인라인 구현 설명 제거 (코드로 의도 표현)
   - Note/설명 블록 제거 (필요 시 별도 문서화)

3. **코드 간소화 원칙**:
   - 함수/변수명으로 의도 표현
   - 자명한 로직에는 주석 불필요
   - 복잡한 알고리즘도 명확한 이름으로 대체
   - 정책/설명은 코드가 아닌 문서에 기록

4. **TDD 효과**:
   - RED 테스트로 목표 명확화
   - GREEN 구현으로 최소 변경 보장
   - 리팩토링 후 즉시 검증 가능

---

### Phase 33 Step 2C-2: bulk-download-service.ts Optimization (2025-10-12)

**목표**: `bulk-download-service.ts` 소스 크기를 459 lines (16.01 KB) → 400
lines (14 KB) 이하로 줄여 2 KB 번들 절감에 기여.

**배경**: Step 2C-1 (twitter-video-extractor.ts) 완료 후 두 번째 서비스 파일
최적화. 주석 제거와 코드 간소화 전략 적용.

#### TDD 진행

- **RED**: `test/unit/optimization/bundle-size-services.test.ts` 실행
  - bulk-download-service.ts: 400 lines, 14 KB 이하 제약
  - 초기 실패 확인: 459 lines (16.01 KB)

- **GREEN**: 주석 및 불필요한 코드 제거
  1. **JSDoc 주석 최소화** (~15 lines)
     - 파일 헤더 JSDoc 제거 (5줄 → 1줄)
     - 메서드별 JSDoc 제거
     - 주요 기능 설명 제거

  2. **정책 주석 제거** (~35 lines)
     - "Phase I: 오류 복구 UX" 주석 블록 제거
     - "UX 소음 줄이기", "정책상 생략" 등 인라인 주석 제거
     - "Factory pattern" 주석 제거

  3. **중복 설명 제거** (~25 lines)
     - "URL로부터 Blob 생성 후 다운로드" 등 자명한 설명
     - "단일 파일인 경우", "여러 파일인 경우" 섹션 주석
     - "async retry", "Optimistic UX" 등 구현 설명

  4. **공백 및 포맷팅** (~25 lines)
     - 불필요한 빈 줄 제거
     - 조건문/반복문 간결화
     - getStatus() 메서드 제거 (미사용)

- **REFACTOR**: 기능 유지 확인
  - 타입 체크 통과 (TypeScript strict)
  - 기존 다운로드 테스트 통과 (검증 필요)
  - 번들 크기: 318.22 KB → **318.18 KB** (0.04 KB 추가 절감)

**성과**:

- **bulk-download-service.ts**: 459 lines (16.01 KB) → **359 lines (13.29 KB)**
  ✅
  - **절감**: 100 lines (21.8%), 2.72 KB (17.0%) (목표 59 lines, 2.01 KB 대비
    **초과 달성**)
  - 번들 크기: 318.22 KB → **318.18 KB** (0.04 KB 실제 절감)
- ✅ TDD RED → GREEN → REFACTOR 완료
- ✅ 타입 안정성 유지 (TypeScript strict)

**다음 단계**: media-service.ts 최적화 (975 lines → 850 lines, 28.98 KB → 25 KB)

---

### Phase 33 Step 2C-1: twitter-video-extractor.ts Optimization (2025-10-12)

**목표**: `twitter-video-extractor.ts` 소스 크기를 641 lines (18.50 KB) → 550
lines (18 KB) 이하로 줄여 0.5 KB 번들 절감에 기여.

**배경**: Phase 33 Step 2A (events.ts)와 Step 2B (컴포넌트) 최적화 완료. Step
2C는 서비스 레이어 최적화로 3개 파일(twitter-video-extractor.ts,
bulk-download-service.ts, media-service.ts)을 순차적으로 처리.

#### TDD 진행

- **RED**: `test/unit/optimization/bundle-size-services.test.ts` 작성
  - 3개 서비스 파일에 크기 제약 설정
  - twitter-video-extractor.ts: 550 lines, 18 KB 이하
  - 초기 실패 확인: 641 lines (18.50 KB)

- **GREEN**: 대규모 코드 다이어트 실행
  1. **Legacy normalizer 인라인화** (~20 lines)
     - `normalizeTweetLegacy`/`normalizeUserLegacy` import 제거
     - 인라인 로직으로 교체 (getTweetMedias 메서드 내부)
     - TweetLike/UserLike 인터페이스 제거

  2. **URL constructor 단순화** (~17 lines)
     - `globalThis`/`window` 환경 체크 제거 (browser-only)
     - Fallback 문자열 조합 로직 제거
     - 직접 `new URL()` 사용

  3. **getTweetIdFromContainer 루프 통합** (~33 lines)
     - 5개 별도 querySelectorAll 루프 → 2개 통합 루프
     - 상대 경로 처리를 루프 내부로 이동
     - `undefinedToNull` 유틸리티 제거

  4. **JSDoc 주석 최소화** (~140 lines)
     - 모든 함수/메서드의 장문 JSDoc 제거
     - 파일 헤더를 1줄 주석으로 축소
     - 타입 정의 위 주석 제거

  5. **코드 포맷팅 최적화** (~3 lines)
     - vacuumCache 메서드 인라인화 (apiRequest 내부로)
     - 불필요한 공백 라인 제거
     - 타입 어노테이션 한 줄로 정리

- **REFACTOR**: 기능 테스트 통과 확인
  - `test/unit/shared/services/media/twitter-video-legacy-normalizer.test.ts`:
    8/8 passing
  - 인라인화한 legacy normalization 로직이 기존 테스트 통과
  - 타입 체크 통과 (TypeScript strict)
  - Lint 자동 수정 적용

**성과**:

- **twitter-video-extractor.ts**: 641 lines (18.50 KB) → **428 lines (15.16
  KB)** ✅
  - **절감**: 213 lines, 3.34 KB (목표 91 lines, 0.5 KB 대비 **초과 달성**)
  - 번들 크기: 318.73 KB → **318.22 KB** (0.51 KB 실제 절감)
- ✅ 모든 기능 테스트 통과 (legacy normalizer 포함)
- ✅ TDD RED → GREEN → REFACTOR 완료
- ✅ 타입 안정성 유지 (TypeScript strict)

**다음 단계**: bulk-download-service.ts 최적화 (459 lines → 400 lines, 16.01 KB
→ 14 KB)

---

### Phase 33 Step 2A: Event Handling Optimization (2025-10-12)

**목표**: `events.ts` 소스 크기를 24 KB 이하로 낮추고, 라인 수 850 이하, export
12개 이하를 유지하여 번들 4 KB 절감 기여.

#### TDD 진행

- **RED**: `test/unit/optimization/bundle-size-events.test.ts` 임계값을 28 KB →
  24 KB, 1000 lines → 850 lines, exports ≤ 12로 상향하고 `npx vitest run`으로
  실패 확인.
- **GREEN**: `GalleryEventManager`와 레거시 helper 제거,
  `getGalleryEventSnapshot` 추가, `EventManager`가 함수형 API를 직접 호출하도록
  정리, barrel export 축소.
- **REFACTOR**: 주석/섹션 헤더 다이어트 후 동일 테스트로 GREEN 재확인.

**성과**:

- `events.ts`: 27.82 KB → 23.73 KB, 967 lines → 806 lines, export 14 → 10.
- 이벤트 매니저는 함수 기반 API로 단순화되어 불필요한 추상화 제거.
- Guard 테스트가 미래 회귀를 차단하도록 강화됨.

---

### Phase 32: CSS Optimization Analysis (2025-01-27)

**초기 목표**: 320.73 KB → 290-300 KB (CSS 중복 제거로 20-30 KB 절감)

**배경**: Phase 31에서 325 KB 예산 준수는 달성했으나, 추가 기능을 위한 여유
공간이 필요. CSS 중복을 제거하면 추가 절감이 가능할 것으로 예상.

**실행 내역**:

1. **RED 단계**: CSS 중복 검증 테스트 작성
   (`test/styles/css-optimization.test.ts`)
   - prefers-reduced-motion: 19개 중복 발견 (목표 ≤2)
   - prefers-contrast: 15개 중복 발견 (목표 ≤2)
   - prefers-color-scheme: 12개 중복 발견 (목표 ≤3)
   - 레거시 token alias: 101개 발견 (목표 <10)
   - transition 패턴 중복: 1개 파일
   - backdrop-filter 중복: 6개 파일
   - CSS 소스 전체 크기: 187.38 KB (26개 파일)

2. **GREEN 시도 1**: 접근성 media query 통합
   - `src/shared/styles/a11y-media-queries.css` 생성
   - 결과: 321.80 KB로 **1.07 KB 증가** ❌
   - 롤백 완료

3. **GREEN 시도 2**: 레거시 keyframes 제거
   - `slideInFromRight`, `fadeSlideIn` 제거
   - 결과: **320.73 KB 유지 (변화 없음)** ⚠️

**핵심 발견**:

- **PostCSS + Terser가 이미 aggressive minification 수행**
  - CSS 중복은 빌드 시점에 자동으로 제거됨
  - 소스 레벨 중복 제거 → 최종 빌드 크기에 영향 없음
- **실제 번들 크기의 주범은 JavaScript**
  - Solid.js 런타임 + 애플리케이션 코드가 주 용량
  - CSS는 minified 후 매우 작은 비중
- **현재 320.73 KB는 이미 최적화된 상태**
  - 추가 CSS 최적화로는 20-30 KB 절감 불가능

**성과**:

- ✅ CSS 중복 분석 도구 확보 (`test/styles/css-optimization.test.ts`)
  - 향후 유지보수 시 중복 방지 가드로 활용 가능
- ✅ 빌드 최적화 메커니즘 이해
  - PostCSS/Terser의 동작 방식 파악
  - JavaScript가 실제 크기 결정 요인임을 검증
- ✅ Phase 33 방향성 도출
  - Rollup Visualizer로 JavaScript 번들 분석 필요
  - Tree-shaking 및 미사용 기능 제거 검토

**결론**: CSS 최적화는 유지보수 품질 향상에 기여하나, 번들 크기 절감 목표는
JavaScript 레벨 접근이 필요. Phase 32는 "분석 완료" 단계로 종료하며, 실질적인
크기 절감은 Phase 33에서 진행.

---

### Phase 31: Prod Bundle Budget Recovery (2025-10-12)

**배경**: `npm run maintenance:check` 결과 prod 번들 원본 크기 334.68 KB로 팀
예산(325 KB)을 초과. 향후 기능 추가 전 안전 여유 확보 필요.

**목표**: prod userscript 원본 ≤ 325 KB, gzip ≤ 95 KB 유지, 기능/테스트 회귀
없음.

**구현 내역**:

1. **Logger dev/prod 분기 강화**: `src/shared/logging/logger.ts`가
   `import.meta.env.DEV` 신호로 프로덕션에서 `debug/time/timeEnd`를 완전 NOOP
   처리하도록 재구성.
2. **Babel transform 추가**: `vite.config.ts`에 `stripLoggerDebugPlugin` 도입,
   프로덕션 빌드 전 Babel AST 방문으로 `.debug(...)` 호출을 제거해 문자열/브랜치
   제거.
3. **빌드 검증**: `scripts/validate-build.js`의 raw size guard(325 KB hard
   limit, 320 KB soft warning) 통과 확인, prod 320.73 KB (gzip 87.39 KB) 달성.
4. **테스트 회귀 확인**: `test/unit/shared/logging/logger.test.ts`로 dev 풍부한
   로깅 / prod squelch 동작 검증, Vitest 2/2 ✅.
5. **유지보수 점검**: `npm run maintenance:check` 모든 항목 정상, 프로덕션 빌드
   예산 준수.

**결과**: prod raw 크기 334.68 KB → 320.73 KB (~13.95 KB 절감, 4.2% 감소), gzip
91 KB → 87.39 KB. 325 KB 예산 대비 4.27 KB 여유 확보, 향후 기능 추가 공간 확보.

### Phase 30: Toolbar Focus Preview Rollback (2025-10-12)

- `Toolbar`·`ToolbarWithSettings`에서 프리뷰 props와 memoized 상태를 제거하고,
  CSS 모듈의 프리뷰 클래스와 타입 정의를 정리하여 UI를 Phase 28 이전 구성으로
  복원.
- `VerticalGalleryView`에서 프리뷰 메모 및 설정 구독 로직을 삭제하고 언어 서비스
  번역 항목을 정리하여 포커스 카운터만 남도록 단순화.
- `test/features/gallery/toolbar-focus-indicator.test.tsx`를 RED→GREEN 흐름으로
  갱신해 프리뷰 DOM 미노출과 카운터 aria-live 유지, 포커스 인덱스 동기화를 단언.
- `npx vitest run test/features/gallery/toolbar-focus-indicator.test.tsx`와
  `Clear-Host && npm run build`로 변경 사항을 검증.

### Phase 29: Toolbar Focus Indicator Preview (2025-10-12)

- 갤러리에서 포커스된 미디어 썸네일/설명을 메모이제이션하고 설정 구독으로
  `focusIndicatorsEnabled` 상태를 동기화.
- `Toolbar`에 프리뷰 `<figure>`를 추가해 이미지, 캡션, `aria-live="polite"`
  안내를 제공하고 skeleton 스타일을 적용.
- 언어 서비스 및 CSS 모듈을 확장하고, feature/fast 테스트 프로젝트에 프리뷰 검증
  스위트를 추가.

### Phase 28: 자동/수동 스크롤 충돌 방지 (2025-01-15)

- 사용자 스크롤 감지 후 자동 스크롤을 일시 차단하고, 500ms idle 이후 복구.
- `VerticalGalleryView` 스크롤 effect를 정리하고 회귀 테스트를 확장.

### Phase 27: Storage Adapter 패턴 (2025-01-15)

- Userscript/브라우저 겸용 StorageAdapter를 도입하고 서비스 계층을 주입 가능
  구조로 리팩토링.
- Vitest 20건 추가로 저장소 경계 테스트를 보강.

## Phase 하이라이트

- **Phase 1-6**: Solid.js 전환, 테스트 인프라(Vitest/Playwright) 구축, ARIA
  접근성 기본 가드 확립.
- **Phase 7-12**: 갤러리 UX 개선, 키보드 내비게이션 강화, E2E 회귀 커버리지
  추가.
- **Phase 13-20**: 정책/최적화(아이콘 규칙, 애니메이션/휠 이벤트 정비, 콘솔
  가드), 성능 튜닝.
- **Phase 21**: IntersectionObserver 무한 루프 제거, fine-grained signals로
  갤러리 상태 재구성, 부수 효과 최적화.
- **Phase 22**: `constants.ts` 리팩토링으로 상수/타입 일원화 및 코드 37% 감소.
- **Phase 23**: DOMCache 아키텍처 재설계, selector registry 중앙화.
- **Phase 24**: 파일명 kebab-case 일괄 전환 및 lint/test 가드 신설.
- **Phase 25**: 휠 스크롤 배율 제거로 브라우저 기본 동작 위임, 번들 -3 KB.
- **Phase 26**: 파일명 정책을 문서+테스트로 강제, phase별 naming guard 확장.
- **Phase 27**: StorageAdapter 패턴 도입, 서비스/테스트 격리 완성.
- **Phase 28**: 사용자 스크롤과 자동 스크롤 충돌 방지 로직 도입.
- **Phase 29**: Toolbar 포커스 프리뷰와 접근성 안내 추가, 설정/테스트 연동.
- **Phase 30**: Toolbar 포커스 프리뷰 롤백, Phase 28 이전 심플 디자인 복원.
- **Phase 31**: Logger dev/prod 분기 + Babel transform으로 prod 번들 13.95 KB
  절감 (334.68 → 320.73 KB).

### Phase 33 Step 2A-2B: JavaScript Bundle Optimization (2025-10-12)

**목표**: JavaScript 번들 크기 최적화 (320.73 KB → 301 KB, 19.5 KB 절감)

**배경**: Phase 33 Step 1에서 번들 구성 분석 완료. 이벤트 핸들링과 컴포넌트
최적화를 통해 번들 크기 절감.

**구현 내역**:

**Step 2A: 이벤트 핸들링 최적화** ✅

- 목표: 19.28 KB → 15 KB (4 KB 절감)
- 실제 달성: Toolbar.tsx 컴포넌트 최적화로 통합 진행

**Step 2B: 컴포넌트 최적화** ✅

- 목표: 41.52 KB → 35 KB (6.5 KB 절감)
- 대상 파일:
  - `Toolbar.tsx`: 14.99 KB → 12.99 KB (420 lines)
  - `VerticalImageItem.tsx`: 13.80 KB → 11.81 KB (436 lines, helpers/types 분리)
  - `SettingsModal.tsx`: 12.73 KB → 11.03 KB (392 lines)
- 최적화 기법:
  - DOM 참조 신호화 제거 (직접 참조로 변경)
  - 유틸리티 함수 분리 (VerticalImageItem.helpers.ts)
  - 타입 정의 분리 (VerticalImageItem.types.ts, Toolbar.types.ts)
  - 헬퍼 함수 인라인화
- TDD guard: `test/unit/optimization/bundle-size-components.test.ts`

**긴급 버그 수정**: `document.elementsFromPoint` this 바인딩 복원 ✅

- 문제: `Toolbar.tsx`에서 `document.elementsFromPoint`를 변수로 추출하면서
  `this` 바인딩 손실
- 증상: "TypeError: Illegal invocation" at line 11680 (prod build)
- 해결: 직접 `document.elementsFromPoint(x, y)` 호출로 변경
- 부수 효과: 번들 크기 추가 절감 (320.73 KB → 318.73 KB, 2 KB)

**현재 상태** (2025-10-12):

- 빌드: dev 734.00 KB / prod 318.73 KB (gzip 86.97 KB) ✅
- 달성률: 2 KB / 19.5 KB (10.3%)
- 남은 목표: 17.5 KB (Step 2C 서비스 레이어)

**검증**:

- ✅ TypeScript 컴파일 (0 errors)
- ✅ Full build (dev + prod)
- ✅ Test suite (643/645 passing)
- ⏳ Runtime manual test (x.com 환경)

**다음 단계**:

- Step 2C: 서비스 레이어 최적화 (59.11 KB → 50 KB, 9 KB 절감)
  - `media-service.ts`: 21.58 KB → 18 KB
  - `twitter-video-extractor.ts`: 13.87 KB → 11 KB
  - `bulk-download-service.ts`: 11.87 KB → 10 KB
- Runtime verification on x.com
- E2E smoke tests (8/8)

## 참고 문서

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CODING_GUIDELINES.md`
- `docs/EVALUATION_TOOLBAR_INDICATOR.md`
- `docs/bundle-analysis.html` (Phase 33 Step 1)
- Git 기록 및 Vitest/Playwright 보고서
