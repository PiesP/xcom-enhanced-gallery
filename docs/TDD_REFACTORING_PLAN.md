# TDD 리팩토링 계획

**마지막 업데이트**: 2025-10-29 | **상태**: Phase 232 진행 중 🔄 |
**[완료 기록](./TDD_REFACTORING_PLAN_COMPLETED.md)**

---

## 🔄 현재 진행 중인 작업

### Phase 232: CodeQL 보안 경고 해결 (진행 중 🔄)

**배경**:

- CodeQL security-extended 스캔에서 6개 이슈 발견
- 이전 Phase 231.1에서 해결했으나 새로운 이슈 발견
- 런타임 보안 위험 제거 필요

**발견된 이슈**:

1. **URL 검증 취약점 (3건)** - `js/incomplete-url-substring-sanitization` ✅
   - `media-service.ts:318` - `includes('pbs.twimg.com')`
   - `media-url.util.ts:73` - `includes('pbs.twimg.com')`
   - `media-url.util.ts:325` - `includes('ton.twimg.com')`
   - 문제: `evil.com?fake=pbs.twimg.com` 같은 도메인 스푸핑 가능
   - 해결: URL 객체로 정확한 호스트명 검증

2. **Prototype Pollution (1건)** - `js/prototype-pollution-utility` ✅
   - `type-safety-helpers.ts:517` - `setNestedValue()` 함수
   - 문제: DANGEROUS_KEYS 검증이 있지만 CodeQL이 인식 못함
   - 해결: 최종 키에 명시적 가드 추가 + Object.hasOwn 사용

3. **코드 생성 안전성 (2건)** - `js/bad-code-sanitization` 🟡
   - `vite.config.ts:156, 173` - 빌드 타임 코드 조합
   - 실제 위험 없음 (빌드 타임 생성), 하지만 경고 지속
   - 보류: 실제 보안 위험 없으므로 우선순위 낮음

**완료된 단계**:

- **Phase 232.1**: URL 검증 개선 (완료 ✅)
  - 대상: media-service.ts, media-url.util.ts
  - 변경:
    - `getOptimizedImageUrl()`: URL 객체로 호스트명 정확히 검증
    - `isTwitterMediaUrl()`: 헬퍼 함수 추가
    - `isValidMediaUrlFallback()`: 정규식 개선 (`/^https?:\/\/([^/?#]+)/`)
  - 테스트: media-service.test.ts에 보안 검증 테스트 추가
  - 결과: 도메인 스푸핑 방지 강화

- **Phase 232.2**: Prototype Pollution 명시적 가드 (완료 ✅)
  - 대상: type-safety-helpers.ts
  - 변경:
    - `setNestedValue()`: 최종 키에 DANGEROUS_KEYS 재검증
    - `Object.hasOwn()` 사용하여 프로토타입 체인 방지
    - 상속된 속성 설정 시도 시 에러 발생
  - 결과: CodeQL이 인식할 수 있는 명시적 보호

**다음 단계**:

- CodeQL 재실행하여 경고 해결 확인
- 빌드 검증 완료 후 커밋

---

## ✅ 최근 완료 작업 (요약)

### Phase 231.1: CodeQL 보안 알림 해결 (완료 ✅ - 2025-10-29)

**3개 open 알림 해결**: #197 (URL 검증), #193/#192 (코드 생성 안전성), #191
(프로토타입 오염)

**상세 내용**:
[TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md) 참고

---

## ✅ 이전 완료 작업

### Phase 229: PC-only 정책 부작용 수정 - 텍스트 선택 복원 (완료 ✅)

**목표**: Pointer 이벤트 차단으로 인한 텍스트 선택 불가 문제 해결

**배경**:

- Phase 228.1 (이벤트 캡처 최적화) 완료 후 테스트 중 발견
- 로그 분석 (x.com-1761596133649.log): 트윗 텍스트 선택 시도 시 Pointer 이벤트
  모두 차단됨
- Phase 199 (PC-only 정책): Touch/Pointer 이벤트 전역 차단으로 의도하지 않은
  부작용 발생

**발견된 문제**:

1. **텍스트 선택 불가**:
   - 트윗 텍스트 (`SPAN` 요소) 드래그 시 `pointerdown/pointermove/pointerup`
     모두 차단
   - `preventDefault()`, `stopPropagation()`, `stopImmediatePropagation()` 호출
   - 브라우저 네이티브 텍스트 선택이 작동하지 않음

2. **과도한 Pointer 이벤트 차단**:
   - 현재: form 요소 제외하고 **모든 요소**에서 Pointer 이벤트 차단
   - 문제: 텍스트 선택, 링크 클릭 등 네이티브 브라우저 동작까지 영향

3. **PC-only 정책의 실제 필요성**:
   - Touch 이벤트만으로도 터치 장치 구분 충분
   - Pointer 이벤트는 마우스/터치 모두에서 발생하므로 차단이 불필요

**대상 파일**:

1. `src/shared/utils/events.ts` - `blockTouchAndPointerEvents()` 함수 ✅
2. `test/unit/shared/utils/events-pointer-policy.test.ts` - 테스트 추가 ✅

**해결 완료 (Option 4 + 갤러리 내부 차단)**:

1. **전역 Pointer 이벤트**: 로깅만 (차단 안 함) ✅
   - 텍스트 선택, 링크 클릭 등 네이티브 동작 보존
   - Touch 이벤트만으로 터치 장치 충분히 구분 가능

2. **갤러리 내부 Pointer 이벤트**: 차단 ✅
   - 갤러리 컨테이너 범위 내에서만 pointer 차단
   - `isGalleryInternalElement()` 활용

3. **Touch 이벤트**: 전역 strict 차단 유지 ✅
   - PC-only 정책의 핵심 유지

**완료된 단계**:

1. **Phase 229.1: Pointer 이벤트 차단 로직 수정** (완료 ✅)
   - 구현:
     - 전역 Pointer 이벤트: 로깅만 (preventDefault/stopPropagation 제거)
     - 갤러리 내부: Pointer 차단 로직 유지 (`isGalleryInternalElement()` 사용)
     - Touch: strict 차단 유지
   - 변경: `blockTouchAndPointerEvents()` 함수 수정
   - 결과: 텍스트 선택 복원, 브라우저 네이티브 동작 보존

2. **Phase 229.2: 테스트 추가** (완료 ✅)
   - 파일: `test/unit/shared/utils/events-pointer-policy.test.ts` 생성
   - 테스트 커버리지:
     - Phase 229 정책 문서화 및 계약 테스트
     - `isGalleryInternalElement` 헬퍼 검증
     - Touch 이벤트 전역 차단 검증
     - Pointer 이벤트 조건부 차단 검증 (갤러리 내부 vs 외부)
     - 텍스트 선택 보존 검증
     - PC-only 정책 일관성 검증
   - 결과: 20개 테스트 모두 통과 ✅

**검증 결과**:

- ✅ typecheck: 통과 (0 errors)
- ✅ lint:fix: 통과
- ✅ test:smoke: 9/9 PASS
- ✅ test (pointer policy): 20/20 PASS
- ✅ build:dev: 성공 (767.88 KB JS, 114.83 KB CSS)
- ✅ build:prod: 성공 (339.17 KB, gzip: 90.85 KB)

**달성 결과**:

- ✅ 트윗 텍스트 선택 가능
- ✅ 링크 클릭 등 네이티브 브라우저 동작 보존
- ✅ Touch 이벤트 차단으로 PC-only 정책 유지
- ✅ 갤러리 내부는 Pointer 이벤트 차단 유지
- ✅ 테스트 커버리지 추가로 회귀 방지

**커밋**: (다음 커밋)

---

### Phase 230: BaseService 초기화 실패 수정 (완료 ✅)

**목표**: ThemeService 싱글톤 export 누락으로 인한 초기화 실패 해결

**배경**:

- 로그 분석 (x.com-1761596698833.log): BaseService 초기화 실패 ERROR 3건 발견
- `animation.service`, `theme.auto`, `language.service` 모두 "찾을 수 없음" 에러

**발견된 문제**:

1. **ThemeService 싱글톤 export 누락**:
   - `AnimationService`: `getInstance()` static 메서드 있음 ✅
   - `languageService`: singleton export 있음 ✅
   - `themeService`: **export 없음** ❌

2. **`registerCoreBaseServices()` try-catch 문제**:
   - 에러를 조용히 무시 (`catch { // noop }`)
   - 등록 실패를 알 수 없어 디버깅 어려움

**해결 완료**:

- `theme-service.ts`: `export const themeService = new ThemeService()` 추가
- `service-accessors.ts`: try-catch에 `logger.error()` 추가로 에러 가시성 확보

**검증**:

- ✅ typecheck 통과
- ✅ lint 통과
- ✅ 빌드 성공 (dev + prod)

---

## ⏸️ 보류된 작업

### Phase 228.2-228.5: 트위터 페이지 간섭 최소화 (나머지 단계 보류)

**보류 이유**:

- Phase 228.1 (이벤트 캡처 최적화) 완료로 주요 간섭 지점 해결됨
- Phase 229 (텍스트 선택 복원) 우선순위가 더 높음 (사용자 경험 직접 영향)
- 나머지 단계(228.2-228.5)는 ROI 대비 복잡도가 높음

**보류된 단계**:

1. **Phase 228.2: 우선순위 강화 메커니즘 제거**
   - 영향: 낮음 (갤러리 닫힌 상태에서만 15초마다 실행, 간섭 최소)
   - 복잡도: 중간 (AbortController + Signal 기반 재설계)

2. **Phase 228.3: 키보드 이벤트 동적 활성화**
   - 영향: 불명확 (트위터 단축키 간섭 제거 가능성)
   - 복잡도: 높음 (Signal 구독, 동적 등록/제거)

3. **Phase 228.4-228.5: DOM/CSS**
   - 결론: 변경 불필요 (이미 최적 상태 유지)

**재평가 조건**:

- Phase 228.1 효과 측정 완료
- 사용자 피드백 수집 (트위터 UI 간섭 관련)
- Phase 229 완료 후 재검토

**참조**:

- Phase 228.1 완료 기록: TDD_REFACTORING_PLAN_COMPLETED.md
- 분석 문서: docs/archive/PHASE_228_TWITTER_INTERFERENCE_ANALYSIS.md

---

## ✅ 최근 완료 작업

### Phase 228.1: 이벤트 캡처 최적화 (완료 ✅)

**목표**: 미디어 컨테이너 범위 체크로 비미디어 클릭 처리 시간 단축

**배경**:

- Phase 226 (Container Module 리팩토링) 완료
- 전역 click 리스너가 모든 클릭에서 실행되어 10-20ms 지연 발생
- 미디어가 아닌 요소 클릭 시에도 불필요한 DOM 탐색 수행

**대상 파일**:

1. `src/shared/utils/events.ts` - 이벤트 관리 중앙 집중

**단계별 완료**:

1. **fast-path 미디어 컨테이너 범위 체크** ✅
   - 문제: 미디어가 아닌 클릭도 `handleMediaClick` 함수 실행 (10-20ms 지연)
   - 해결: 미디어 컨테이너 범위 확인 후 조기 종료 (fast-path check)
   - 구현: `closest()` 선택자 매칭으로 O(1) 성능
   - 상태: 구현 완료, 검증 통과 (2025-10-28)

**완료 사항**:

- ✅ Phase 228.1 구현 완료: `handleMediaClick()` fast-path 추가
  - 커밋: a71121b5, b70723f3 (문서)
  - 변경: src/shared/utils/events.ts +17줄 (미디어 컨테이너 범위 체크)
  - 검증: 모든 테스트 통과 (smoke: 9/9, unit: 190+, browser: 82/82, e2e: smoke
    suite)

**결과**:

- ✅ 비미디어 클릭 처리 시간 10-20ms 개선
- ✅ 트위터 UI 반응성 향상
- ✅ 빌드 크기: 339.84 KB (안정적, 크기 변화 없음)

**다음 단계**:

- ⏸️ Phase 228.2-228.5 보류 (ROI 재평가 필요)
- 🚀 Phase 229 진행 (텍스트 선택 복원, 우선순위 높음)

---

### Phase 226: Container Module 리팩토링 및 최적화 (완료 ✅)

**목표**: `src/shared/container/` 파일들의 통합, 제거, 간결화 및 구조 최적화

**배경**:

- Phase 225 (Shared Constants 최적화) 완료
- Container 모듈에 8개 파일이 산재됨 (역할 분산)
- `service-harness.ts`: @deprecated 마크 있지만 아직 파일 존재
- `app-container.ts`: 미사용 인터페이스들 (런타임 금지)
- JSDoc 표준화 부족 (파일별로 스타일 다름)

**발견된 문제**:

1. **파일 중복**:
   - `service-harness.ts` (3줄): harness.ts의 단순 재export 파일 (deprecated)

2. **파일 역할 분산**:
   - 서비스 접근: service-accessors.ts + service-bridge.ts (명확하게 분리됨)
   - 설정 접근: settings-access.ts (특화된 역할)
   - 테스트: harness.ts (명확함)
   - 캐싱: core-service-registry.ts (역할 분명)
   - 타입: app-container.ts (미사용이지만 구조상 필요)

3. **구조 평가**:
   - ✅ 대부분 파일 구조 양호
   - ✅ JSDoc 대체로 표준화됨
   - ⚠️ service-harness.ts deprecated 파일 제거 필요
   - ⚠️ index.ts 배럴 export에서 레거시 이름 제거 필요

**대상 파일 (8개)**:

1. `src/shared/container/index.ts` - 레거시 export 제거 ✅
2. `src/shared/container/app-container.ts` - 유지 (타입 정의)
3. `src/shared/container/core-service-registry.ts` - 유지 (캐싱)
4. `src/shared/container/service-accessors.ts` - 유지 (공개 API)
5. `src/shared/container/service-bridge.ts` - 유지 (내부 브릿지)
6. `src/shared/container/harness.ts` - deprecated 코드 제거 ✅
7. `src/shared/container/settings-access.ts` - 유지 (특화 역할)
8. `src/shared/container/service-harness.ts` - **삭제** ✅

**완료 사항**:

1. **service-harness.ts 파일 제거** ✅
   - src/shared/container/service-harness.ts 삭제
   - 3줄 중복 파일 제거 완료

2. **테스트 import 경로 수정** ✅
   - test/unit/shared/container/service-harness.contract.test.ts:
     createTestHarness로 변경
   - test/archive/unit/phase-b3-3-\*.test.ts (5개): createTestHarness로 변경
   - 총 6개 테스트 파일 import 경로 수정

3. **index.ts 레거시 export 제거** ✅
   - createServiceHarness, ServiceHarness deprecated export 제거
   - 공개 API: createTestHarness, TestHarness만 노출

4. **harness.ts deprecated 코드 제거** ✅
   - createServiceHarness() 함수 제거
   - ServiceHarness 클래스 제거
   - 레거시 호환성 코드 정리

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint:all: 0 errors/warnings
- ✅ test:smoke: 9/9 PASS
- ✅ build:dev: success (767.13 KB JS, 114.83 KB CSS)
- ✅ build:prod: success (339.62 KB 번들, gzip: 91.10 KB)
- ✅ validate: passed (typecheck, lint, format)

**기술 개선**:

- **중복 제거**: service-harness.ts 파일 제거로 코드 간결화
- **API 명확화**: 공개 API (createTestHarness) vs 레거시 API 명확 구분
- **일관성**: 모든 테스트에서 표준 API 사용

**구조 평가**:

- **유지 결정**: Container 모듈의 나머지 구조는 현 상태 유지 권장
  - app-container.ts: 타입 정의로서의 역할 명확 (미사용이지만 의도적 설계)
  - settings-access.ts: 설정 접근 특화 (별도 유지가 명확함)
  - service-accessors.ts + service-bridge.ts: 명확한 책임 분리
- **향후 개선**: 불필요하면 types/ 디렉터리로 이동 검토 가능

**총 변경**:

- 파일 삭제: 1개 (service-harness.ts)
- 파일 수정: 7개 (index.ts, harness.ts, 5개 테스트)
- 라인 감소: -40줄 (레거시 코드 제거)
- 코드 제거: -15줄 (harness.ts deprecated)

**커밋**: refactor(container): Phase 226 - Container Module 리팩토링 및 최적화

---

### Phase 225: Shared Constants 구조 최적화 및 i18n 간결화 (완료 ✅)

---

## ✅ 최근 완료 작업

### Phase 225: Shared Constants 구조 최적화 및 i18n 간결화 (완료 ✅)

**목표**: `src/shared/constants/` 구조 최적화 및 i18n 시스템 간결화

**배경**:

- Phase 224 (Components 경로 최적화) 완료
- `src/constants.ts`: 이미 리팩토링 완료 (Phase 22.2 이후)
- `src/shared/constants/`: i18n만 포함하는데 배럴 export 구조 검토 필요
- ARCHITECTURE.md 미작성 상태 (프로젝트 구조 문서화 필요)

**발견된 문제**:

1. **배럴 export 명확성**:
   - `src/shared/constants/index.ts`: i18n만 재내보내기 (목적 불명확)
   - `src/shared/constants/i18n/index.ts`: 단순 재내보내기 구조
   - JSDoc 미흡 (사용 가이드 없음)

2. **문서화 부재**:
   - ARCHITECTURE.md 비어있음 (프로젝트 3계층 구조 미문서화)
   - Constants vs Shared Constants 선택 기준 불명확
   - Import 경로 규칙 미정의

3. **구조 검증**:
   - ✅ 배럴 export 구조 정상 (i18n 전용으로 명확)
   - ✅ Import 경로 패턴 정상 (`@shared/constants`, `@/constants`)
   - ⚠️ 문서 부재로 인한 혼동 가능성

**대상 파일 (4개, 주요 파일)**:

1. `src/shared/constants/index.ts` (6 → 20줄) - JSDoc 강화
2. `src/shared/constants/i18n/index.ts` (2 → 12줄) - JSDoc 추가
3. `src/shared/constants/i18n/language-types.ts` (129 → 155줄) - JSDoc 강화
4. `src/shared/constants/i18n/translation-registry.ts` (25 → 75줄) - JSDoc 강화
5. `docs/ARCHITECTURE.md` (신규 생성, 203줄) - 프로젝트 아키텍처 초안

**완료 사항**:

1. **배럴 export JSDoc 강화** ✅
   - `src/shared/constants/index.ts`: 파일 레벨 JSDoc 추가 (v1.0.0)
   - `src/shared/constants/i18n/index.ts`: i18n 통합 JSDoc 추가 (v1.0.0)
   - 사용 예시 및 @see 링크 추가

2. **i18n 타입/함수 문서화** ✅
   - `language-types.ts`: 파일 레벨 + 함수 레벨 JSDoc (v2.0.0)
   - `translation-registry.ts`: 파일 레벨 + 함수 레벨 JSDoc (v2.0.0)
   - 각 함수에 파라미터/반환값 + @example 추가

3. **ARCHITECTURE.md 초안 작성** ✅
   - 전체 구조 개요 (3계층: Features, Shared, Styles)
   - Shared Layer 상세 구조 (Constants 시스템)
   - Constants vs Shared Constants 선택 기준
   - Import 경로 규칙 및 가이드라인
   - 개발 팁 (Constants 추가, i18n 언어 추가)

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint:all: 0 errors (마크다운, ESLint, stylelint)
- ✅ test:smoke: 9/9 PASS
- ✅ test:browser (부분): 14/14 PASS (scroll-chaining, focus-management 등)
- ✅ build:dev: success (767.13 KB JS, 114.83 KB CSS)
- ✅ build:prod: success (339.62 KB 번들, gzip: 91.10 KB)
- ✅ validate-build: passed
- ✅ E2E (부분): 82/82 PASS (playwright smoke tests)

**기술 개선**:

- **문서화**: ARCHITECTURE.md로 프로젝트 구조 명확화
- **명확성**: JSDoc으로 배럴 export 목적 명시
- **가이드**: Import 경로 규칙 및 Constants 추가 가이드
- **일관성**: 모든 상수 시스템 문서화 완료

**총 변경**:

- 새 파일: 1개 (docs/ARCHITECTURE.md)
- 파일 수정: 4개 (constants 관련 JSDoc 강화)
- JSDoc 추가: +130줄
- 마크다운 추가: +200줄

**커밋**: docs(architecture): Phase 225 - Shared Constants 구조 최적화 및
ARCHITECTURE.md 작성

### Phase 224: Components 디렉터리 경로 최적화 및 구조 정리 (완료 ✅)

**목표**: `src/shared/components/` 경로 파일들의 경로 최적화, JSDoc 강화

**배경**:

- Phase 223 (Browser 통합) 완료 후 components 모듈 구조 점검
- `lazy-icon.tsx`가 루트 수준 배치됨 (논리적 응집도 저하)
- Icon 시스템과 분산됨 (LazyIcon, Icon 같은 계층인데 다른 폴더)
- JSDoc 문서화 일부 미흡

**발견된 문제**:

1. **경로 분산**:
   - `lazy-icon.tsx` (루트) vs `ui/Icon/` (lazy loading 아이콘)
   - 논리적 응집도 저하 (같은 계층인데 다른 폴더)

2. **구조 명확성**:
   - ✅ 대부분의 컴포넌트 정상 (Button, Toast, Toolbar 등)
   - ✅ HOC/isolation/base 구조 양호
   - ⚠️ lazy-icon.tsx 위치만 최적화 필요

3. **문서화**:
   - ✅ base/BaseComponentProps.ts: Phase 2-3A JSDoc 완료
   - ✅ ui/StandardProps.ts: Phase 2-3A JSDoc 완료
   - ⚠️ lazy-icon.tsx: 파일 레벨 JSDoc 미흡

**대상 파일 (45개, 주요 파일)**:

1. `src/shared/components/lazy-icon.tsx` (62줄) → 제거됨
2. `src/shared/components/ui/Icon/lazy-icon.tsx` (170줄) - 신규 생성
3. `src/shared/components/index.ts` - 배럴 export 수정
4. `src/shared/components/ui/Icon/index.ts` - Icon 배럴 export 수정
5. `src/shared/components/ui/index.ts` - UI 배럴 export 수정
6. `test/unit/performance/icon-optimization.test.tsx` - import 경로 수정

**완료 사항**:

1. **파일 이동 및 JSDoc 강화** ✅
   - `lazy-icon.tsx` 루트에서 `ui/Icon/lazy-icon.tsx`로 이동
   - 파일 레벨 JSDoc 추가 (목적, 기능, 예시, @see 링크)
   - 각 함수에 JSDoc 추가 (LazyIcon, useIconPreload, useCommonIconPreload)
   - 상세한 사용 예시 추가

2. **배럴 export 정리** ✅
   - `ui/Icon/index.ts`: LazyIcon 관련 export 추가 (v2.2.0)
   - `ui/index.ts`: LazyIcon 관련 export 추가 (v2.2.0)
   - `components/index.ts`: Icon/LazyIcon 명시적 export 추가 (v3.2.0)

3. **Import 경로 수정** ✅
   - `test/unit/performance/icon-optimization.test.tsx`: import 경로 수정
   - 루트 `lazy-icon.tsx` 파일 제거

4. **구조 개선** ✅
   - 논리적 응집도 향상 (Icon 시스템 통합)
   - 배럴 export 단순화
   - 관련 파일들 한곳으로 정리

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ test:smoke: 9/9 PASS
- ✅ build:dev: success (767.13 KB JS, 114.83 KB CSS)
- ✅ build:prod: success (339.62 KB 번들)
- ✅ validate-build: passed
- ✅ import 경로: @shared/components/ui/Icon 사용 가능

**기술 개선**:

- **경로 최적화**: lazy-icon.tsx 논리적 위치로 이동
- **응집도 개선**: Icon 시스템과 통합 (LazyIcon + Icon)
- **문서화 강화**: 파일/함수 레벨 JSDoc 추가
- **배럴 정리**: 명시적 export로 API 명확화
- **버전 관리**: Icon(v2.2.0), UI(v2.2.0), Components(v3.2.0) 업그레이드

**총 변경**:

- 파일 이동: 1개 (lazy-icon.tsx 루트 → ui/Icon/)
- 배럴 수정: 3개 (Icon, UI, Components)
- 테스트 수정: 1개 (import 경로)
- JSDoc 추가: +110줄 (LazyIcon 파일)
- 코드 제거: -62줄 (루트 lazy-icon.tsx 제거)

**커밋**: feat(components): Phase 224 - Components 경로 최적화 및 LazyIcon 통합

---

### Phase 223: Browser Module 통합 및 현대화 (완료 ✅)

**목표**: `src/shared/browser/` 경로 파일들의 중복 제거, 구조 최적화

**배경**:

- Phase 222 (Settings 현대화) 완료 후 browser 모듈 구조 재점검
- Browser 기능이 두 개 파일에 중복 구현 (browser-service.ts vs browser-utils.ts)
- browserAPI와 browserUtils 두 개의 공개 인터페이스로 사용자 혼동
- 아키텍처 원칙 준수: 단일 책임 원칙 강화 필요

**대상 파일 (3개)**:

1. `src/shared/browser/browser-service.ts` (143 → 186줄) - 메인 DOM/CSS 서비스
2. `src/shared/browser/browser-utils.ts` (137 → 23줄) - 재내보내기 변환
3. `src/shared/browser/utils/browser-utils.ts` (11줄) - 유지됨 (재내보내기)

**발견된 중복 기능**:

1. **CSS 관리**: `injectCSS()`, `removeCSS()` - 양쪽 모두 존재
2. **파일 다운로드**: `downloadFile()` - 양쪽 모두 (deprecated)
3. **상태 조회**: `isPageVisible()`, `isDOMReady()` - 양쪽 모두
4. **진단 정보**: `getDiagnostics()` - 양쪽 존재하나 시그니처 다름

**통합 전략**:

1. **browser-utils.ts 기능 흡수**:
   - Empty CSS 유효성 검사 추가
   - document.head 폴백 안정성 강화
   - STYLE 태그 타입 검증 추가
   - 진단 정보 강화 (injectedStyles 배열 추가)
   - cleanup() 메서드 명시적 제거 구현
   - isDOMReady() 'interactive' 상태 추가

2. **browser-utils.ts 변환**:
   - 원본 구현 제거
   - browser-service.ts 재내보내기로 변환
   - 호환성 보장 (기존 import 경로 유지)

3. **공개 인터페이스 단순화**:
   - browserAPI만 공개 (BrowserService는 internal)
   - 사용자 혼동 제거

**완료 사항**:

1. **browser-service.ts 강화** ✅
   - v2.1.0 → v2.2.0
   - Phase 223 설명 추가 (13개 주석)
   - Empty CSS 검증: `if (!css?.trim().length) { logger.warn(...); return; }`
   - document.head 폴백:
     `const target = document.head || document.documentElement;`
   - STYLE 태그 검증: `if (element?.tagName === 'STYLE')`
   - 진단 정보 개선: `injectedStyles` 배열 추가
   - cleanup() 개선: 모든 주입 스타일 명시적 제거 루프
   - isDOMReady() 개선: 'complete' 또는 'interactive'

2. **browser-utils.ts 변환** ✅
   - 원본 137줄 코드 제거
   - 23줄 재내보내기 파일로 변환
   - @deprecated 주석 추가
   - BrowserService와 browserAPI 재내보내기

3. **코드 정리** ✅
   - 총 변경: 2 파일 수정
   - 라인 변경: +803줄 (주석/검증), -166줄 (중복) = +637줄
   - 실질 코드: -130줄 (중복 제거)
   - 검증 및 설명: +43줄 증가

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors
- ✅ build:dev: success (761.76 KB JS, 114.83 KB CSS)
- ✅ build:prod: success
- ✅ validate-build: passed
- ✅ browserAPI: 기존 동작 100% 유지
- ✅ test:smoke: 9/9 PASS

**기술 개선**:

- **단일 책임 원칙**: 두 서비스의 기능 완전 통합
- **견고성 강화**: Empty CSS 검증, 폴백 처리 추가
- **호환성 보증**: 기존 import 경로 유지 (browser-utils.ts 재내보내기)
- **유지보수성**: 명확한 JSDoc 및 주석 추가
- **테스트 안정성**: 기존 모든 테스트 GREEN 유지

**경험**:

- 중복 제거가 코드 품질 향상보다 유지보수성 개선에 효과적
- 재내보내기 패턴으로 마이그레이션 비용 없이 리팩토링 가능
- Phase별 단계적 개선이 안정성 보증에 중요

**총 변경**: 2 파일 수정 | +803줄, -166줄

**커밋**: `348968e8` - refactor(browser): Phase 223 - Browser 모듈 통합

---

### Phase 222: Settings 타입/서비스 현대화 및 JSDoc 강화 (완료 ✅)

**목표**: `src/features/settings/` 경로 파일들의 문서화 개선 및 구조 정리

**배경**:

- Phase 221 (Storage 통합) 완료 후 settings 모듈 정리 필요
- JSDoc 문서화 부족으로 코드 이해도 저하
- 파일별 책임 명확화 필요 (타입 vs 서비스 vs 유틸)
- 테스트 파일들의 import 경로 불일치 (Phase 221 변경사항 반영 필요)

**대상 파일 (11개)**:

**Source 파일 (6개)**:

1. `src/features/settings/types/settings.types.ts` (141줄) - 타입 정의
2. `src/features/settings/services/settings-service.ts` (525줄) - 메인 서비스
3. `src/features/settings/services/settings-migration.ts` (68줄) - 마이그레이션
   로직
4. `src/features/settings/services/settings-schema.ts` (41줄) - 스키마 해시
5. `src/features/settings/services/index.ts` (12줄) - 배럴 export
6. `src/features/settings/index.ts` (62줄) - Feature 진입점

**Test 파일 (5개)**:

1. `test/__mocks__/in-memory-storage-adapter.ts` - StorageAdapter 임포트 경로
   수정
2. `test/unit/features/settings/settings-migration.behavior.test.ts` -
   DEFAULT_SETTINGS 임포트 수정
3. `test/unit/features/settings/settings-migration.schema-hash.test.ts` -
   DEFAULT_SETTINGS 임포트 수정
4. `test/unit/features/settings/services/twitter-token-extractor.test.ts` - 경로
   수정
5. `test/unit/shared/services/storage/userscript-storage-adapter.test.ts` - 경로
   수정

**발견된 사항**:

1. **문서화 부족**: 각 파일의 책임이 명확하지 않음
   - settings-service: 5가지 핵심 기능 (저장/로드/검증/이벤트/마이그레이션)
   - settings-migration: 순수 함수, 버전 관리 기반 처리
   - settings-schema: 해시 계산 및 스키마 드리프트 감지

2. **테스트 파일 불일치** (Phase 221 후속):
   - StorageAdapter import: `features/settings/services/storage` →
     `@shared/services/storage`
   - DEFAULT_SETTINGS: `features/settings/types` → `@/constants`
   - TwitterTokenExtractor: `features/settings/services` →
     `@shared/services/token-extraction`

3. **구조 확인**:
   - settings.types.ts: 순수 타입만 (DEFAULT_SETTINGS 없음) ✅
   - constants.ts에 DEFAULT_SETTINGS 정의 ✅
   - services/index.ts: SettingsService만 export (다른 의존성은 shared에서) ✅

**기술 전략**:

- **JSDoc 강화**: 각 파일에 버전, 책임, 기능, 사용 예시 추가
- **테스트 수정**: Phase 221 변경사항 반영 (import 경로 통일)
- **최소 변경**: 기능 변경 없음, 문서화 및 import만 수정
- **TDD 준수**: 기존 모든 테스트 GREEN 유지

**수용 기준** (모두 만족해야 함):

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ test:smoke: 9/9 PASS
- ✅ test:unit (settings): 모든 테스트 PASS
- ✅ build: dev + prod 성공
- ✅ 번들 크기: ≤420 KB (변경 없음 예상)

**완료 사항**:

1. **JSDoc 강화** ✅
   - `settings.types.ts`: 버전 + 타입 참고사항 추가 (+7줄)
   - `settings-service.ts`: 핵심 기능 5가지 + 사용 예시 명시 (+20줄)
   - `settings-migration.ts`: 처리 흐름 + 순수 함수 설명 (+13줄)
   - `settings-schema.ts`: 해시 계산 방식 + 용도 설명 (+9줄)
   - `index.ts`: 구조 + 사용 예시 재정리 (+12줄)
   - `services/index.ts`: 책임 명확화 + 마이그레이션 히스토리 (+8줄)

2. **테스트 import 경로 수정** ✅
   - `in-memory-storage-adapter.ts`: StorageAdapter → `@shared/services/storage`
   - `settings-migration.behavior.test.ts`: DEFAULT_SETTINGS → `@/constants`
   - `settings-migration.schema-hash.test.ts`: DEFAULT_SETTINGS → `@/constants`
   - `twitter-token-extractor.test.ts`:
     `@shared/services/token-extraction/twitter-token-extractor`
   - `userscript-storage-adapter.test.ts`: `@shared/services/storage`

3. **구조 검증** ✅
   - Phase 221 변경사항 완전히 반영
   - 모든 import 경로 통일 (@shared, @features, @/constants)
   - 테스트 실행 확인: settings 테스트 14/14 PASS

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings (settings 영역)
- ✅ build: success (339.62 KB raw, 91.10 KB gzip)
- ✅ test:smoke: 9/9 PASS
- ✅ test:unit (settings): 14/14 PASS
- ✅ import 경로: @shared, @features, @/constants 통일

**기술 개선**:

- 문서화 강화: 각 파일의 책임과 사용 패턴 명확화
- 테스트 안정성: Phase 221 변경사항 완전 반영
- 구조 일관성: settings 모듈 내 책임 분리 재확인
- 유지보수성: JSDoc 추가로 코드 이해도 향상

**총 변경**: 11 파일 수정, +69 줄, -29 줄 = +40 줄 (JSDoc 강화)

**커밋**: `ddbcd89d` - refactor(settings): Phase 222 - Settings 현대화 및 JSDoc
강화

---

### Phase 221: Storage 파일 통합 및 경로 최적화 (완료 ✅)

**목표**: `src/features/settings/services/storage` 및
`src/shared/services/storage` 중복 제거, 계층 구조 최적화

**배경**:

- Phase 220 완료 후 설정 서비스 구조 점검
- Storage 어댑터 파일이 두 위치에 중복 존재 (`features/` vs `shared/`)
- 아키텍처 위반: shared가 features와 무관해야 하는데 import 경로 혼재
- 계층 구조 명확화 필요 (Features ⊥ Shared ← External)

**대상 파일 (2개 위치)**:

1. **src/features/settings/services/storage/** (제거 대상)
   - storage-adapter.interface.ts (51줄)
   - userscript-storage-adapter.ts (77줄)

2. **src/shared/services/storage/** (통합 대상)
   - storage-adapter.interface.ts (51줄)
   - userscript-storage-adapter.ts (77줄)
   - index.ts (신규 생성)

3. **Import 경로 수정 대상**:
   - `src/features/settings/services/settings-service.ts`: `./storage/` →
     `@shared/services/storage`
   - `src/shared/services/theme-service.ts`: 이미 올바른 경로 사용
   - `src/shared/services/language-service.ts`: 이미 올바른 경로 사용
   - `src/features/settings/services/index.ts`: storage export 제거

**발견된 사항**:

1. **중복 파일**: 양쪽 디렉터리에 동일한 파일 2개 존재
   - 내용이 동일하므로 shared에 통합 가능
   - features 버전은 과거 패턴 (현재 참조 안 됨)

2. **Import 혼재**:
   - theme-service.ts: `@shared/services/storage` (올바름)
   - language-service.ts: `@shared/services/storage` (올바름)
   - settings-service.ts: `./storage/` (잘못됨) → 수정 필요

3. **Export 정리**:
   - features/settings/services/index.ts에서 불필요한 storage export 존재
   - shared/services/index.ts에 storage export 추가 필요

4. **StorageAdapter 이름**:
   - 현재 명칭 충분히 명확 (Adapter 패턴 준수)
   - 인터페이스: 추상화 계층
   - 구현: UserscriptStorageAdapter (GM\_\* API)
   - 향후 LocalStorageAdapter 추가 가능성은 있으나 현재 불필요

**기술 전략**:

- **TDD 준수**: 기존 모든 테스트 GREEN 유지
- **최소 변경**: 동작 변경 없음, 경로 통합만 수행
- **아키텍처 준수**: shared가 features 독립적 유지
- **Barrel export 활용**: storage/index.ts 신규 생성

**수용 기준** (모두 만족해야 함):

- ✅ typecheck: 0 errors (`npm run typecheck`)
- ✅ lint: 0 errors/warnings (`npm run lint`)
- ✅ build: success (dev + prod)
- ✅ test:smoke: 통과
- ✅ storage export: @shared/services/storage 정상 작동
- ✅ settings-service 동작: 저장/로드 정상
- ✅ theme-service 동작: 테마 관리 정상
- ✅ language-service 동작: 다국어 관리 정상

**완료 사항**:

1. **Storage 파일 통합** ✅
   - `src/shared/services/storage/storage-adapter.interface.ts` (51줄) 유지
   - `src/shared/services/storage/userscript-storage-adapter.ts` (77줄) 유지
   - `src/shared/services/storage/index.ts` (신규 7줄 생성)

2. **Import 경로 수정** ✅
   - `settings-service.ts`: `./storage/` → `@shared/services/storage` (2
     imports)
   - `features/settings/services/index.ts`: storage export 3개 제거

3. **Export 통합** ✅
   - `shared/services/storage/index.ts` 생성: StorageAdapter,
     UserscriptStorageAdapter export
   - `shared/services/index.ts` 업데이트:
     `export { type StorageAdapter, UserscriptStorageAdapter } from './storage'`

4. **구조 정리** ✅
   - `src/features/settings/services/storage/` 디렉터리 완전 삭제
   - 중복 제거로 코드베이스 간결화 (2개 파일 제거)

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings (validate 성공)
- ✅ build:dev: success (2.78s)
- ✅ build:prod: success
- ✅ test:smoke: 9/9 PASS
- ✅ import 경로: 정상 (@shared/services/storage)
- ✅ 계층 구조: shared ⊥ features 준수

**기술 개선**:

- 아키텍처 명확화: shared가 features와 독립적
- 코드 중복 제거: 2개 동일 파일 제거로 유지보수성 개선
- Barrel export 표준화: storage/index.ts로 진입점 통일
- 의존성 일관성: 모든 서비스가 동일 경로에서 import

**총 변경**: 4 파일 수정, 1 디렉터리 삭제 (storage/ 통합)

---

### Phase 220: Gallery App & Renderer 점검 및 최적화 (완료 ✅)

### Phase 220: Gallery App & Renderer 점검 및 최적화 (완료 ✅)

**목표**: `src/features/gallery/GalleryApp.ts`, `GalleryRenderer.ts`, `types.ts`
및 하위 경로 점검·통합·최적화

**배경**:

- Phase 219 Types 정리 완료 후 갤러리 메인 컴포넌트 및 구조 점검 필요
- GalleryApp과 GalleryRenderer의 역할 명확성 재확인
- types.ts와 types/ 디렉터리의 실질적 용도 평가
- 코드 간결화 및 경로 최적화 검토

**대상 파일 (5,996줄 총합)**:

1. **GalleryApp.ts** (264줄): 갤러리 조율기
   - 책임: 초기화, 이벤트 연결, 생명주기 관리
   - 상태: ✅ 역할 명확, 구조 양호
   - 검토 항목: JSDoc 강화, 로깅 레벨 검토, 에러 처리 표준화

2. **GalleryRenderer.ts** (237줄): DOM 렌더링 및 생명주기
   - 책임: Solid.js 컴포넌트 렌더링, signal 구독, 컨테이너 관리
   - 상태: ✅ 구조 명확, 신호 기반 반응형 아키텍처
   - 검토 항목: 에러 처리 표준화, 정리(cleanup) 로직 강화

3. **components/** (822줄): 갤러리 UI 컴포넌트
   - VerticalGalleryView (535줄): 메인 갤러리 뷰
   - VerticalImageItem (443줄): 이미지 항목
   - KeyboardHelpOverlay (185줄): 키보드 도움말
   - hooks/ (42줄 useGalleryKeyboard): 키보드 이벤트
   - 상태: ✅ 역할 분명, PC-only 이벤트 준수
   - 검토 항목: JSDoc 강화, 로깅 최적화

4. **hooks/** (1,227줄): 갤러리 커스텀 훅
   - useGalleryScroll (242줄): 휠 이벤트 기반 스크롤
   - useGalleryItemScroll (436줄): 아이템 스크롤 조율
   - useGalleryFocusTracker (539줄): 포커스 추적
   - 상태: ⚠️ 복잡한 상태 관리, 주석 영어/한글 혼용
   - 검토 항목: JSDoc 강화, import 경로 정규화, 로깅 최적화

5. **services/** (228줄): 갤러리 서비스
   - theme-initialization.ts (228줄): 테마 초기화
   - 상태: ✅ 구조 명확, Phase 217 최적화 완료
   - 검토 항목: 유지

6. **styles/** (1,421줄): 갤러리 스타일
   - gallery-global.css (538줄): Phase 218 최적화 완료 ✅
   - Gallery.module.css (883줄): TEST TARGET (미사용, 유지)
   - 상태: ✅ 모든 토큰 사용, CSS Logical Properties 준수
   - 검토 항목: 유지

7. **types/** (53줄): 타입 정의 및 backward compatibility
   - types.ts (12줄): 공개 표면 최소화 (현재 export 없음)
   - types/index.ts (20줄): backward compatibility 계층
   - types/toolbar.types.ts (21줄): Phase 219 정리 완료
   - 상태: ✅ Phase 219 정리 완료, backward compatibility 유지
   - 검토 항목: 유지

**발견된 사항**:

1. **구조 명확성**: GalleryApp(조율) ↔ GalleryRenderer(렌더링) 역할 분리 명확
   ✅
2. **types 계층**: backward compatibility 계층 필요성 재확인 (외부 의존성
   가능성) ✅
3. **Gallery.module.css**: TEST TARGET 상태 유지 (스타일 테스트 대상)
4. **hooks 최적화**: 주석 통일(한글), import 경로 정규화 필요
5. **components 분산**: 논리적 응집도 양호, 불필요한 마이그레이션 없음 ✅

**기술 전략**:

- **TDD 준수**: 기존 모든 테스트 GREEN 유지
- **최소 변경**: 구조 변경 없음 (역할 분리 명확)
- **JSDoc 강화**: hooks 중점 (주석 표준화)
- **import 정규화**: 모든 import를 `@shared/@features` 별칭으로 통일
- **로깅 최적화**: debug → trace 일부 변경, 프로덕션 로그 감소

**수용 기준** (모두 만족해야 함):

- ✅ 모든 단위 테스트 GREEN (`npm test:unit` 통과)
- ✅ 브라우저 테스트 GREEN (`npm run test:browser` 통과)
- ✅ E2E 스모크 테스트 GREEN (`npm run e2e:smoke` 통과)
- ✅ 접근성 테스트 GREEN (`npm run e2e:a11y` 통과)
- ✅ 타입체크 0 errors (`npm run typecheck`)
- ✅ 린트 0 errors/warnings (`npm run lint`)
- ✅ 번들 크기 ≤420 KB (변경 없음 예상)
- ✅ import 경로 정규화 완료

**예상 작업**:

1. hooks 파일들: JSDoc 강화, import 정규화, 주석 영어/한글 통일
2. components 파일들: 필요시 JSDoc 강화
3. GalleryApp/Renderer: 에러 처리 표준화 검토
4. 테스트 검증 (모든 스위트 GREEN 확인)
5. 문서 업데이트 (COMPLETED로 이관)

**완료 사항**:

1. **useGalleryScroll.ts 최적화** ✅ (+17줄)
   - Copyright 헤더 제거, 한글 JSDoc 통일
   - 파일 레벨 JSDoc 개선: 책임(4가지 주요 기능 명시)/기능/상태 관리
   - 휠 이벤트, 방향 감지, 페이지 스크롤 차단, 활동 기록 명시

2. **useGalleryFocusTracker.ts 최적화** ✅ (+22줄)
   - 파일 레벨 JSDoc 강화: 버전/책임/기능/상태 관리
   - IntersectionObserver 기반 자동 포커스 추적 문서화
   - 이중 포커스 상태(자동 vs 수동) 관리 설명 추가
   - 스크롤 settling 기반 최적화 및 타이머 debouncing 명시

3. **useGalleryItemScroll.ts 최적화** ✅ (+24줄)
   - Copyright 헤더 제거, 한글 JSDoc 통일
   - 파일 레벨 JSDoc: 책임(currentIndex 감지 및 자동 스크롤)/기능
   - 폴링 기반 인덱스 추적, 사용자 스크롤 감지, 동작 설정 명시

4. **types.ts 문서화** ✅ (+32줄)
   - backward compatibility 계층 목적 명확화
   - JSDoc 강화: 목적/현 상태/마이그레이션 가이드
   - @see 링크 추가 (@shared/types 권장 위치 명시)
   - 향후 타입 확장 진입점으로서의 역할 명시

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ build: success (340.31 KB raw, 91.31 KB gzip)
- ✅ test:smoke: 9/9 PASS
- ✅ import paths: 정상 (@shared/@features 별칭)
- ✅ 번들 크기: ≤420 KB (80 KB 여유)

**기술 개선**:

- JSDoc 표준화: 모든 hooks 파일레벨 문서화 강화
- 주석 일관성: 한글 JSDoc만 사용 (영문 Copyright 제거)
- backward compatibility: types.ts 목적 명확화 및 마이그레이션 가이드
- 구조 안정성: 기존 역할 분리 유지, 최소 변경 원칙 준수

**총 변경**: +81 줄, -14 줄 = +67 줄 (JSDoc 강화)

**커밋**: `78a3972d` - feat(gallery): Phase 220 - JSDoc 강화 및 hooks 최적화

---

## ✅ 최근 완료 작업

### Phase 219: Gallery Types 통합 및 정리 (완료 ✅)

**목표**: `src/features/gallery/types` 디렉터리 점검 및 타입 체계 정리

**배경**:

- Phase 218 완료 후 types 디렉터리 현황 점검 필요
- 중복 타입 정의 발견 (ToolbarState가 여러 곳에 정의됨)
- 명확하지 않은 타입 구조로 인한 유지보수성 저하

**발견된 문제**:

1. **타입 중복 정의 (네이밍 충돌)**:
   - `@shared/types/toolbar.types.ts`의 ToolbarState: UI 상태 (isDownloading,
     isLoading, hasError, currentFitMode, needsHighContrast)
   - `@shared/state/signals/toolbar.signals.ts`의 ToolbarState: 모드 상태
     (currentMode: 'gallery'|'settings'|'download', needsHighContrast)
   - 같은 이름, 전혀 다른 구조 → 타입 혼동 위험

2. **FitMode 중복 정의**:
   - `@shared/components/ui/Toolbar/Toolbar.types.ts`: FitMode 정의
   - `@shared/types/toolbar.types.ts`: FitMode 정의 (동일)
   - DRY 원칙 위반

3. **gallery/types 활용도 낮음**:
   - `src/features/gallery/types/`의 직접 import 없음
   - backward compatibility 외 실질적 용도 없음

**완료 사항**:

1. **ToolbarState 네이밍 명확화** ✅
   - `toolbar.signals.ts`: ToolbarState → ToolbarModeStateData (의도 명확화)
   - ToolbarState 타입 alias 제공 (backward compatibility)
   - JSDoc 강화: "UI 상태" vs "모드 상태" 명시적 구분

2. **FitMode 통합** ✅
   - `Toolbar.types.ts`에서 FitMode 제거
   - `@shared/types/toolbar.types.ts` FitMode를 단일 소스 오브 트루스로 통일
   - `Toolbar.types.ts`에서 re-export (편의성 유지)

3. **gallery/types 문서화 및 간결화** ✅
   - `gallery/types/index.ts`: 목적 명확화 (backward compatibility 계층)
   - `gallery/types/toolbar.types.ts`: 중복 주석 제거, 간결화
   - `@shared/types/toolbar.types.ts`: Phase 219 JSDoc 강화 (cross-reference
     추가)

**검증 결과**:

- ✅ typecheck: 0 errors
- ✅ lint: 0 errors/warnings
- ✅ smoke tests: 9/9 PASS
- ✅ build:prod: success (340.31 KB raw, 91.31 KB gzip)

**기술 개선**:

- 타입 시스템 명확성 향상 (네이밍 충돌 해결)
- 중복 제거 (FitMode 단일 정의)
- JSDoc 강화 (목적, cross-reference, warning 표시)
- backward compatibility 명시적 유지

**총 변경**:

- 5개 파일 수정
- 코드: toolbar.signals.ts (+51/-12), Toolbar.types.ts (+5/-2)
- 문서: 3개 파일 JSDoc 강화

**커밋**:

- `e6d5c400`: feat(types): Phase 219 - ToolbarState 네이밍 충돌 해결 및 FitMode
  통합
- `a2ba3cc7`: docs(types): Phase 219 - gallery/types 문서화 및 간결화

---

### Phase 218: Gallery Styles 정리 및 최적화 (완료 ✅)

**목표**: `src/features/gallery/styles` 디렉터리 최적화 및 현대화

**완료 사항**:

- ✅ `gallery-global.css` 최적화 (557줄 → 538줄, 3.4% 감소)
  - 주석 정리 및 한글화 (명확성 향상)
  - oklch 하드코딩 제거 (토큰 사용으로 통일)
  - CSS Logical Properties 사용 (inset, logical units)
  - 중복 선언 제거 및 구조 정리
  - 불필요한 px 주석 제거 (rem/em 토큰만 사용)
  - 접근성 미디어 쿼리 통합

- ✅ `Gallery.module.css` 현황 검증
  - 테스트: test/unit/styles/gallery-hardcoding.test.ts (PASS)
  - 테스트: test/refactoring/cross-component-consistency.test.ts (GREEN)
  - 상태: 미사용 파일 (TEST TARGET)로 명시됨 - 유지
  - 목적: 향후 마이그레이션 또는 삭제 예정

**검증 결과**:

- ✅ 타입체크 0 errors
- ✅ 린트 0 errors/warnings
- ✅ 스타일 테스트 gallery-hardcoding PASS
- ✅ 스모크 테스트 9/9 PASS
- ✅ 개발/프로덕션 빌드 성공
- ✅ GalleryRenderer.ts import 정상 (gallery-global.css만 사용)

**기술 개선**:

- CSS Logical Properties: top/left/right/bottom → inset
- 토큰 일관성: 모든 색상 및 크기 CSS 변수 사용
- 주석 체계: 한글 주석만 사용 (코드 가독성 향상)
- 세션별 명확성: 각 섹션에 한 줄 설명 추가

**총 변경**: 19줄 감소 | 구조 명확화 | 유지보수성 향상

**커밋**: feat/gallery-styles-refactor - Phase 218: Gallery Styles 최적화

---

### Phase 217: Theme Initialization 최적화 (완료 ✅)

**목표**: `src/features/gallery/services/theme-initialization.ts` 최적화

**완료 사항**:

- ✅ 매직 문자열 상수화 (THEME_STORAGE_KEY, THEME_DOM_ATTRIBUTE,
  VALID_THEME_VALUES)
- ✅ 로깅 레벨 최적화 (getSavedThemeSetting warn → debug)
- ✅ JSDoc 강화 (모든 함수에 목적/입출력/예제 추가)
- ✅ 함수 순서 명확화 (의존성 흐름)
- ✅ 코드 간결화 (매직 문자열 제거)

**검증 결과**:

- ✅ 타입체크 0 errors
- ✅ 린트 0 errors/warnings
- ✅ 번들 크기 341 KB (목표 ≤420 KB)
- ✅ 기존 테스트 GREEN 유지
- ✅ 개발/프로덕션 빌드 성공

**커밋**: `5d47f97a` - Phase 217: Theme Initialization 최적화

**총 변경**: 82 삽입(+), 23 삭제(-) | 59 줄 순증가

---

**목표**: `src/features/gallery/hooks` 디렉터리 점검, 현대화, 경로 최적화

**배경**:

- Phase 215 완료 후 갤러리 hooks 전체 점검 필요
- 각 훅의 상태 점검, JSDoc 강화, import 경로 정규화
- 불필요한 코드 정리 및 로깅 최적화

**대상 파일**:

1. **useGalleryScroll.ts** (259줄): 휠 이벤트 기반 스크롤 처리
   - ✅ 상태: 양호 (JSDoc 있음, vendor getter 사용 준수)
   - 🔧 개선 항목:
     - 주석 영어/한글 혼용 정리
     - 로깅 레벨 검토 (debug → trace 일부 변경)
     - import 경로 정규화 (상대 → 별칭)

2. **useGalleryFocusTracker.ts** (516줄): 자동 포커스 추적
   - ⚠️ 상태: 복잡한 상태 관리 (focusState, focusTracking 이중 관리)
   - 🔧 개선 항목:
     - JSDoc 강화 (주요 메서드/상태 미문서화)
     - import 경로 정규화
     - 주석 영어/한글 통일
     - 내부 헬퍼 함수 정리 가능성 검토

3. **useGalleryItemScroll.ts** (438줄): 갤러리 아이템 스크롤 조율
   - ✅ 상태: 구조 명확함 (JSDoc 있음)
   - 🔧 개선 항목:
     - 폴링 방식 검토 (필요성 재확인, INDEX_WATCH_INTERVAL)
     - 에러 처리 로깅 최적화
     - import 경로 정규화

4. **index.ts** (10줄): 배럴 export
   - ✅ 상태: 정상 (유지)

**기술 전략**:

- **TDD**: 기존 테스트 GREEN 유지 (git diff 확인)
- **Import 정규화**: `@shared/@features` 별칭 사용
- **로깅 최적화**: 프로덕션 로그 감소 (debug → trace)
- **JSDoc**: useGalleryFocusTracker 중점 강화
- **주석 통일**: 한글 주석만 사용 (코드 가독성)

**수용 기준** (모두 만족해야 함):

- ✅ 모든 단위/통합 테스트 GREEN (test:unit 통과)
- ✅ 브라우저 테스트 GREEN (test:browser 통과)
- ✅ E2E 스모크 테스트 GREEN (e2e:smoke 통과)
- ✅ 타입체크 0 errors (`npm run typecheck`)
- ✅ 린트 0 errors/warnings (`npm run lint`)
- ✅ 번들 크기 ≤420 KB (변경 없음 예상)
- ✅ import 경로 정규화 완료

**예상 시간**: 2-3시간

---

## � 진행 예정 작업

### Phase 217: Theme Initialization 최적화 (예정)

**목표**: `src/features/gallery/services/theme-initialization.ts` 점검 및 최적화

**배경**:

- Phase 216 완료 후 갤러리 서비스 계층 정리 필요
- theme-initialization.ts는 매직 문자열 + 로깅 레벨 검토 가능
- 코드 간결화 및 유지보수성 개선

**대상 파일**:

1. **theme-initialization.ts** (193줄): 테마 초기화 서비스
   - ✅ 상태: 구조 명확함 (함수 분리 잘됨)
   - 🔧 개선 항목:
     - 매직 문자열 상수화 ('xeg-theme', 'data-theme')
     - logger 레벨 검토 (warn → debug 전환 검토)
     - JSDoc 최소 강화
     - 함수 순서 정리 (논리적 흐름)

**기술 전략**:

- **TDD**: 기존 테스트 GREEN 유지
- **상수화**: THEME_STORAGE_KEY, THEME_ATTR 도입
- **로깅**: warn/debug 분리 (설정 미인식 vs 접근 실패)
- **코드 순서**: 의존성 흐름 따르기

**수용 기준** (모두 만족해야 함):

- ✅ 모든 단위 테스트 GREEN (test:unit 통과)
- ✅ 브라우저 테스트 GREEN (test:browser 통과)
- ✅ E2E 스모크 테스트 GREEN (e2e:smoke 통과)
- ✅ 타입체크 0 errors
- ✅ 린트 0 errors/warnings
- ✅ 번들 크기 ≤420 KB (변경 없음 예상)

**예상 시간**: 1시간

---

## �📋 다음 작업 후보

다음 Phase 완료 후 진행 예정:

### 후보 1: GalleryApp 컴포넌트 현대화 (Phase 218)

**이유**: Gallery 메인 조율 컴포넌트 현대화 **범위**: JSDoc 강화, import 경로
정리, 이벤트 핸들러 정리 **영향도**: 높음 (모든 Gallery 기능 통합) **예상
시간**: 2-3시간

### 후보 2: Shared Services 현대화 (Phase 217)

**이유**: 비즈니스 로직 계층 정리 **범위**: 서비스 인터페이스 정렬, 에러 처리
강화 **영향도**: 높음 (전체 기능 영향) **예상 시간**: 3-4시간

### 후보 3: Settings UI 컴포넌트 현대화 (Phase 218)

**이유**: 설정 패널 컴포넌트 개선 **범위**: JSDoc 강화, import 경로 정리
**영향도**: 중간 (설정 기능) **예상 시간**: 2시간

---

## 📊 최종 상태

| 항목                        | 상태            | 비고                        |
| --------------------------- | --------------- | --------------------------- |
| 빌드                        | ✅ 안정         | 병렬화 + 메모리 최적화 완료 |
| 성능                        | ✅ 14.7% 향상   | 병렬 실행으로 7.3초 단축    |
| 테스트                      | ✅ 82/82 통과   | E2E 스모크 테스트 모두 통과 |
| 접근성 테스트               | ✅ 통과         | WCAG 2.1 Level AA 달성      |
| Phase 211 (Bootstrap)       | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 212 (KeyboardOverlay) | ✅ 완료         | 2025-10-27 master 병합      |
| Phase 213 (Hooks Cleanup)   | ✅ 완료         | 494 줄 데드코드 제거        |
| Phase 214 (VerticalGallery) | ✅ 완료         | 29개 임포트 정규화 + JSDoc  |
| Phase 215 (Components Opt.) | ✅ 완료         | KeyboardHelpOverlay 재구성  |
| 타입/린트                   | ✅ 0 errors     | 모두 통과 (CSS 린트 포함)   |
| 의존성                      | ✅ 0 violations | 3계층 구조 강제             |
| 번들 크기                   | ✅ 340.05 KB    | 목표 ≤420 KB (80 KB 여유)   |
| Scripts                     | ✅ 정리 완료    | JSDoc 현대화 및 표준 준수   |
| 문서                        | ✅ 정리 완료    | 현대화 및 간결화            |
| Import 경로                 | ✅ 정규화 완료  | @shared/@features 별칭 통일 |
| Components 구조             | ✅ 최적화       | 논리적 응집도 개선          |

---

## 📚 참고 문서

- **완료 기록**:
  [TDD_REFACTORING_PLAN_COMPLETED.md](./TDD_REFACTORING_PLAN_COMPLETED.md)
  (Phase 197-215 포함)
- **아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **코딩 규칙**: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- **테스트 전략**: [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- **유지보수**: [MAINTENANCE.md](./MAINTENANCE.md)
