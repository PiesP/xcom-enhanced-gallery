# TDD 리팩토링 활성 계획

> **최종 업데이트**: 2025-10-17 | **상태**: 다음 Phase 준비 중 ⏸️

## 프로젝트 현황

- **빌드**: prod **330.24 KB / 335 KB** (4.76 KB 여유, 98.6%) ⚠️
- **테스트**: **162개 파일**, 1018 passing / 10 skipped (99.0% 통과율) ✅
- **E2E 테스트**: 28 passed, 1 skipped (96.6% 통과율) ✅✅
- **타입**: TypeScript strict, 0 errors ✅
- **린트**: ESLint 0 warnings ✅
- **CSS 린트**: stylelint **0 warnings** (error 강화 완료) ✅✅✅
- **의존성**: 0 violations (263 modules, 736 dependencies) ✅
- **커버리지**: v8로 통일 완료 ✅
- **디자인 토큰**: px 0개, rgba 0개 ✅✅✅
- **브라우저 지원**: Safari 14+, Chrome 110+ (OKLCH 폴백 적용) ✅
- **로깅 일관성**: console 직접 사용 0건 ✅✅✅
- **CodeQL 성능**: 병렬 실행 29.5초 (Phase 85.1 캐시 + Phase 85.2 병렬화) ✅✅✅

## 현재 상태: 다음 Phase 준비 중 ⏸️

**최근 완료**:

- ✅ **Phase 82.7**: 키보드 비디오 컨트롤 E2E 테스트 (2025-10-17)
  - keyboard-video.spec.ts 3개 테스트 통과 (K4-K6)
  - E2E 테스트: 25/26 → 28/29 (96.2% → 96.6%, +0.4% 개선) ✅
  - 스킵 테스트: 10개 → 7개 (3개 E2E 이관) ✅
  - events.ts 크기 정책: 24KB → 26KB 조정 (25.03KB, 키보드 핸들러)
  - 빌드 크기: 330.24KB (변화 없음)
  - 교훈: 하네스 API 재사용, 브라우저 네이티브 기능 검증 범위 명확화 ✅
- ✅ **Phase 82.3**: 키보드 네비게이션 E2E 테스트 + 프로덕션 버그 수정
  (2025-10-17)
  - keyboard-navigation 4개 테스트 모두 통과 (K1-K3b)
  - 근본 원인: SAMPLE_MEDIA 1개 → SAMPLE_MEDIA_ARRAY 5개로 확장
  - 프로덕션 버그 수정: events.ts에 ArrowLeft/Right/Home/End/PageDown/PageUp
    핸들러 추가
  - E2E 테스트: 21/31 → 25/26 (67.7% → 96.2%, +28.5% 개선) ✅✅
  - 빌드 크기: 329.81KB → 330.24KB (+0.43KB)
  - 교훈: 디버깅 도구(getDebugInfo), 테스트 데이터 검증, E2E의 가치 ✅
- ✅ **Phase 82.6 (시도)**: 하네스 API 추가 완료, E2E 이관 보류 (2025-10-17)
  - 하네스 API 3개 추가: waitForFocusStable, getFocusIndicatorPosition,
    triggerFocusChange
  - E2E 이관 시도: 9개 테스트 작성 → 7개 실패
  - 실패 원인: Phase 82.5와 동일 (Solid.js 반응성 트리거 실패, 실제 FocusTracker
    서비스 미초기화)
  - 하네스 API는 유지 (향후 page API 패턴 연구 후 활용)
  - 스킵 테스트: 10개 유지 (E2E 이관 보류)
- ✅ **Phase 82.5 (부분)**: JSDOM 테스트 정리 완료 (2025-10-17)
  - toolbar-settings-toggle.test.tsx: 4개 스킵 제거 (2개 구조 테스트 유지)
  - toolbar-expandable-aria.test.tsx: 1개 스킵 제거 (7개 ARIA 테스트 유지)
  - 스킵 테스트: 15개 → 10개 (5개 제거) ✅
  - E2E 이관: 하네스 패턴 제약으로 보류 (별도 접근 필요)
  - 결론: JSDOM에서 제거 가능한 테스트 정리 완료
- ✅ **Phase 85.2**: CodeQL 쿼리 병렬 실행 최적화 완료 (2025-10-16)
  - Promise.all()로 5개 쿼리 병렬 실행 (forEach → Promise.all())
  - runQuery/runCodeQLQueries/main 함수 async/await 변환
  - test-samples/ 디렉토리 필터링 추가 (intentional violations 제외)
  - 실행 시간: 순차 90-100초 → 병렬 29.5초 (60-70초 절약, ~70% 개선)
  - Phase 85.1 캐시와 누적 효과: 75-105초 총 절약 (2회차 이후) ✅
- ✅ **Phase 86**: Deprecated 코드 안전 제거 완료 (2025-10-16)
  - Button.iconVariant, galleryState.signals, enableLegacyAdapter 제거
  - createZipFromItems 및 연관 코드 대규모 정리 (~150줄)
  - 테스트 파일 Button-icon-variant.test.tsx 제거 (249줄)
  - 총 ~420줄 레거시 코드 제거 (소스 ~170줄 + 테스트 249줄)
  - 번들 크기 유지 (329.86 KB, 트리 셰이킹 효과)
  - 코드 품질 개선, 유지보수성 향상 ✅
- ✅ **Phase 88**: 번들 분석 완료 (2025-10-17)
  - rollup-plugin-visualizer로 140개 모듈 분석
  - Top 10 모듈 32.07% 차지 (160.50 KB)
  - 최적화 우선순위 수립: events.ts (16.21 KB), useGalleryFocusTracker.ts (12.86
    KB)
  - 예상 절감: 5-9 KB (빌드 한도 여유 2-3배 확보)
  - Phase 73 교훈 적용: 데이터 기반 접근 ✅

**활성 Phase**: Phase 89: events.ts 리팩토링 (시작 예정)

**다음 작업 후보**:

1. **번들 크기 최적화** (우선순위: 높음 ⚠️)
   - **Phase 89**: events.ts 리팩토링 (16.21 KB → 13-14 KB, 2-3 KB 절감)
   - **Phase 90**: useGalleryFocusTracker.ts 알고리즘 최적화 (12.86 KB → 11 KB,
     1-2 KB 절감)
   - **목표**: 빌드 한도 여유 4.76 KB → 10-15 KB (안정 확보)
   - **배경**: Phase 88 번들 분석으로 실제 큰 모듈 식별 완료

2. **E2E 테스트 마이그레이션 상황 정리** (우선순위: 중간, 장기 보류)
   - **Phase 82.3**: ✅ 키보드 네비게이션 4개 완료 (2025-10-17)
   - **Phase 82.7**: ✅ 키보드 비디오 컨트롤 3개 완료 (2025-10-17)
   - **Phase 82.5**: ✅ JSDOM 정리 완료, E2E 이관 보류 (하네스 패턴 제약)
   - **Phase 82.6**: ⏸️ 하네스 API 추가 완료, E2E 이관 보류 (Solid.js 반응성
     트리거 실패)
   - **Phase 82.8**: ⛔ 이관 불가 (LazyIcon JSX 구조 검증은 JSDOM/E2E 모두 제약
     존재)
   - **현재 스킵 테스트**: 10개 (Focus Tracker 6개, icon-optimization 3개,
     toolbar 1개)
   - **E2E 통과율**: 28/29 (96.6%)
   - **결론**: 현재 E2E 마이그레이션 가능한 케이스 대부분 완료, 나머지는 기술적
     제약으로 보류

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

### 5. 번들 크기 최적화

- ✅ **Phase 88**: 번들 분석 완료 (2025-10-17, 최적화 전략 수립)
- ⏳ **Phase 89**: events.ts 리팩토링 (시작 예정)

---

## 다음 Phase 계획

### Phase 89: events.ts 리팩토링 (시작 예정)

**목표**: events.ts (16.21 KB → 13-14 KB, 2-3 KB 절감) **배경**: Phase 88 번들
분석 결과, events.ts가 16.21 KB로 최적화 우선순위 1위

#### 실행 계획

1. **현재 상태 분석**
   - events.ts 크기: 16.21 KB (렌더링), 3.55 KB (gzip)
   - 전체 번들의 3.24% 차지
   - 갤러리/도구바 이벤트 처리 로직 포함

2. **최적화 영역 식별**
   - 사용되지 않는 유틸리티 함수 검색
   - 이벤트 핸들러 중복 코드 탐지
   - 갤러리/도구바 간 공통 로직 추출 가능성

3. **리팩토링 실행**
   - Tree-shaking 기회: 미사용 exports 제거
   - 중복 제거: 동일 패턴 핸들러 통합
   - 공통 로직 분리: 재사용 가능한 헬퍼 함수 생성

4. **검증**
   - 빌드 크기 검증: 330.24 KB → 327-328 KB 목표
   - 테스트 통과: 1018 passing 유지
   - E2E 테스트: 28/29 유지

#### 예상 결과

- **목표 크기**: 13-14 KB (현재 16.21 KB에서 2-3 KB 절감)
- **빌드 영향**: 330.24 KB → 327-328 KB (2-3 KB 절감)
- **빌드 한도 여유**: 4.76 KB → 7-8 KB (안정성 확보)

#### 다음 단계

**Phase 90**: useGalleryFocusTracker.ts 알고리즘 최적화 (12.86 KB → 11 KB, 1-2
KB 절감)

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

**상태**: 진행 중 **목표**: 스킵된 JSDOM 테스트 7개를 E2E(Playwright)로 단계적
전환 **우선순위**: 높음 (신뢰도 향상, 실제 브라우저 검증)

#### 완료된 Phase

**Phase 82.7**: 키보드 비디오 컨트롤 (3개, 2시간) - 완료 ✅ (2025-10-17)

- **대상**: gallery-video.keyboard.red.test.ts 2개 +
  gallery-keyboard.navigation.red.test.ts 1개
- **결과**: keyboard-video.spec.ts 3개 테스트 통과 (K4-K6)
- **성과**: E2E 25/26 → 28/29 (96.2% → 96.6%), 스킵 10개 → 7개

#### 마이그레이션 전략

**Phase 82.8**: 아이콘 최적화 테스트 (3개, 2-3시간) - 다음 후보

- **대상**: icon-optimization 3개 (lazy loading, memoization)
- **난이도**: ⭐⭐ (낮음 - 기존 패턴 활용)

#### 검증 기준

- E2E 테스트: 28 passed → 목표 31 passed (3개 추가)
- 스킵 테스트: 7개 → 4개 (3개 이관)
- 테스트 통과율: 96.6% → 97% 유지
- 빌드: 구조 변화 없음, 330 KB 유지

---

## 향후 개선 영역 후보

### 1. 번들 크기 최적화 (보류)

**현황**: 330.24 KB / 335 KB (98.6% 사용, 4.76 KB 여유) ⚠️

**Phase 73 시도 결과** (2025-10-17):

- Lazy Loading 시도: TwitterAPIExtractor 동적 import() 적용
- 결과: **실패** (330.24 KB → 330.60 KB, +360 bytes)
- 실패 원인:
  1. Userscript는 단일 파일 번들로 빌드되어 code splitting 효과 없음
  2. `import()` 구문이 추가 런타임 코드(Promise 래퍼) 생성
  3. 작은 모듈(12.73 KB)에 대한 lazy loading은 오버헤드가 더 큼
- 교훈:
  - 단일 파일 번들 환경에서는 lazy loading이 비효율적
  - 최적화 전 번들 분석 필수 (rollup-plugin-visualizer)
  - 실제 큰 모듈 식별 후 전략 수립 필요

**우선순위**: 낮 (여유 4.76 KB, 급박하지 않음)

**다음 접근**:

- 번들 분석 리포트로 실제 큰 모듈 식별
- Tree-shaking: 미사용 exports 제거
- Minification 설정 최적화

### 2. 접근성 (A11y) 강화

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
