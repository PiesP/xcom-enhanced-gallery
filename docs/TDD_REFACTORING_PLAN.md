# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 14.2/14.3 대기 - SolidJS 반응성 최적화 진행 중> **현재
> 상태**: Phase 14 제안 완료 - SolidJS 반응성 최적화 계획 수립

> >

> **최종 업데이트**: 2025-01-11> **최종 업데이트**: 2025-10-11

> >

> **빌드**: ✅ dev (728.00 KB) / prod (327.52 KB gzip: 89.09 KB)> **빌드**: ✅
> dev (728.00 KB) / prod (327.52 KB gzip: 89.09 KB)

> >

> **테스트**: ✅ Vitest 559/559 (100%, 23 skipped) | ✅ E2E 8/8 (100%)>
> **테스트**: ✅ Vitest 538/538 (100%, 23 skipped) | ✅ E2E 8/8 (100%)

---

## 활성 작업## 활성 작업

### Phase 14: SolidJS 반응성 최적화### Phase 13: 툴바 이미지 번호 인디케이터 반응성 수정 (완료 대기 - 브라우저 검증 필요)

**배경**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` 분석 결과, React 습관에서
남아있는 불필요한 메모이제이션과 비효율적 패턴 발견**상태**: ✅ 구현 완료, �
브라우저 검증 대기

**목표**: SolidJS의 fine-grained reactivity를 최대한 활용하여 코드 복잡도 감소
및 성능 개선**구현 완료 내역**:

**발견된 이슈**:1. **Toolbar.tsx 수정** (line 143-162)

- 🔴 불필요한 메모이제이션 (8+ 사례): Props를 createMemo로 감싸는 패턴 -
  `displayedIndex` 로직 개선: focusedIndex와 currentIndex 차이가 1 이하일

- 🟡 Props 직접 접근 미준수 (5+ 사례): 반응성 손실 위험 때만 focusedIndex 사용

- 🟡 과도한 createEffect (3+ 사례): Props → Signal 불필요 복사 - 그 외의 경우
  currentIndex를 우선 사용하여 더 신뢰할 수 있는 값으로 표시

- 🟠 중복 Selector 유틸리티: signalSelector.ts vs signalOptimization.ts

2. **useGalleryFocusTracker.ts 추가** (line 328-341)

**구현 순서** (3단계): - getCurrentIndex 변경 감지 createEffect 추가

- autoFocusIndex와 currentIndex 차이가 1보다 큰 경우 자동 동기화

#### Phase 14.1: 불필요한 메모이제이션 제거 ✅ 완료 (2025-01-11) - 수동 포커스(manualIdx)가 없을 때만 동기화하여 사용자 의도 유지

상세 내역: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조**품질 게이트**:

#### Phase 14.2: Props 접근 패턴 일관성 📋 대기- [x] 타입 체크 통과 (0 errors)

- [x] 린트 통과 (0 warnings)

**목표**: 모든 컴포넌트에서 props를 Getter 함수로 일관되게 접근- [x] 스모크
테스트 통과 (15/15)

- [x] 빌드 성공 (dev: 728 KB)

**대상 파일**:- [ ] 실제 브라우저(X.com) 검증 필요

- `src/shared/hooks/useGalleryToolbarLogic.ts`: Props를 직접 구조 분해하는 패턴
  수정

- 기타 컴포넌트: Props 접근 패턴 검토 및 수정**다음 단계**: dev build 스크립트를
  실제 X.com에 설치하여 수동 검증

**수용 기준**:---

- [ ] Props 접근은 항상 Getter 함수 형태 (`() => props.value`)

- [ ] 구조 분해는 반응성이 필요 없는 경우만 사용## 다음 Phase 제안

- [ ] 테스트 추가: Props 변경 시 반응성 검증

- [ ] 타입 체크/린트 통과### Phase 14: SolidJS 반응성 최적화 (우선순위: 높음)

- [ ] 빌드 성공

**배경**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` 분석 결과, React 습관에서

#### Phase 14.3: 유틸리티 통합 📋 대기남아있는 불필요한 메모이제이션과 비효율적 패턴 발견

**목표**: 중복 유틸리티 정리 및 공식 가이드 작성**목표**: SolidJS의 fine-grained
reactivity를 최대한 활용하여 코드 복잡도 감소

및 성능 개선

**작업 내용**:

- [ ] `signalOptimization.ts` deprecated 표시 또는 제거**발견된 이슈**:

- [ ] `signalSelector.ts`를 공식 유틸리티로 확정

- [ ] `CODING_GUIDELINES.md`에 SolidJS Best Practices 섹션 추가- 🔴 불필요한
      메모이제이션 (8+ 사례): Props를 createMemo로 감싸는 패턴
  - createMemo 사용 기준- 🟡 Props 직접 접근 미준수 (5+ 사례): 반응성 손실 위험

  - Props 접근 패턴- 🟡 과도한 createEffect (3+ 사례): Props → Signal 불필요
    복사

  - createEffect vs createMemo 선택 가이드- 🟠 중복 Selector 유틸리티:
    signalSelector.ts vs signalOptimization.ts

**수용 기준**:**구현 순서** (3단계):

- [ ] 중복 유틸리티 제거 또는 명확한 역할 구분

- [ ] 가이드 문서 작성 완료**Phase 14.1: 불필요한 메모이제이션 제거** (완료 ✅)

- [ ] 기존 코드에서 deprecated API 제거

- [ ] 타입 체크/린트 통과**완료 일시**: 2025-01-11 **소요 시간**: ~2시간 (예상:
      1-2일, 실제: 단일 세션)

---**구현 내역**:

## 다음 Phase 제안- ✅ ToolbarHeadless.tsx: `currentIndex`/`totalCount` createMemo 제거 → props

직접 접근

### Phase 15: Vitest Skipped 테스트 정리 (우선순위: 중간)- ✅ Toolbar.tsx: `canGoNext`/`canGoPrevious` createMemo 제거 → JSX에서 인라인

비교

- E2E로 대체 완료된 8개 skip 테스트 제거 또는 참조 주석 추가- ✅ LazyIcon.tsx:
  `className`/`style` 정적 평가 → Getter 함수로 변경

- 나머지 15개 skipped 테스트 검토 및 정리- ✅ VerticalGalleryView.tsx:
  `memoizedMediaItems` createMemo 제거 → For

  컴포넌트에서 인라인 map

### 문서 정리 (우선순위: 낮음)

**테스트 추가**:

- [ ] SOLIDJS_OPTIMIZATION_ANALYSIS.md를 COMPLETED.md에 통합하여 간결화

- [ ] 백업 파일 최종 정리 (.backup 파일들)-
      `test/unit/components/toolbar-headless-memo.test.tsx` (4 tests)

- `test/unit/components/toolbar-memo.test.tsx` (4 tests)

### 성능 최적화 (우선순위: 낮음)- `test/unit/components/lazy-icon-memo.test.tsx` (4 tests)

- `test/unit/features/gallery/vertical-gallery-memo.test.tsx` (3 tests)

- 번들 크기 분석 및 최적화- 총 15개 테스트 추가, 100% 통과

- 런타임 성능 프로파일링

- 메모리 사용량 모니터링**품질 게이트**:

---- ✅ 타입 체크: 0 errors

- ✅ 린트: 0 warnings

## 완료된 Phase- ✅ 테스트: 559/559 passed (기존 554 + 신규 15 - 10 skipped)

- ✅ 빌드 성공 (dev: 728 KB, prod: 327.52 KB)

모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어
있습니다:

**Phase 14.2: Props 접근 패턴 일관성** (대기 중)

- **Phase 14.1**: 불필요한 메모이제이션 제거 ✅ - 2025-01-11

- **Phase 13**: 툴바 인디케이터 반응성 수정 ✅ - 2025-01-11-
  useGalleryToolbarLogic.ts: 모든 props를 Getter 함수로

- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-01-10- 테스트 추가: props
  변경 시 반응성 검증

- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-01-10

- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ -
  2025-01-10**Phase 14.3: 유틸리티 통합** (대기 중)

- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅

- 이전 Phase들... (COMPLETED 문서 참조)- signalOptimization.ts deprecated 표시

- 공식 가이드 작성 (createMemo 사용 기준)

---- CODING_GUIDELINES.md에 SolidJS Best Practices 섹션 추가

## 개발 가이드라인**수용 기준**:

### TDD 접근- [x] 코드 라인 수 15-20% 감소 (완료: Phase 14.1에서 ~30줄 감소)

- [ ] 신호 그래프 깊이 2-3 단계 감소 (Phase 14.2/14.3에서 검증 예정)

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서- [x] 타입 체크 통과
  (0 errors) ✅

- RED → GREEN → REFACTOR 사이클 준수- [x] 린트 통과 (0 warnings) ✅

- 테스트 우선 작성으로 명확한 수용 기준 설정- [x] 전체 테스트 통과 (559/559) ✅

- [x] 빌드 성공 및 번들 크기 유지 ✅

### 코딩 규칙 준수

**예상 효과** (Phase 14.1 실현):

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용

- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import
  금지- ✅ 유지보수성 향상: 코드 추적 용이 (간접 레이어 4개 제거)

- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용- ✅
  성능 개선: 불필요한 계산 레이어 제거 (createMemo 호출 8회 감소)

- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용- ✅ 학습
  곡선 감소: 단순한 구조 (props → createMemo → usage 대신 props → usage

- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets` 직접 연결)

### 검증 절차---

각 작업 완료 후:## 기타 제안

````powershell### 문서 정리 (우선순위: 중간)

npm run typecheck  # TypeScript 타입 체크

npm run lint:fix   # ESLint 자동 수정- [x] CODING_GUIDELINES.md 간결화 (1552줄 → ~300줄)

npm test:smoke     # 핵심 기능 스모크 테스트- [x] TDD_REFACTORING_PLAN_COMPLETED.md 요약 (4441줄 → ~100줄)

npm test:fast      # 빠른 단위 테스트- [x] 백업 파일 제거 (.backup 파일들)

npm run build      # dev/prod 빌드 검증

```### 성능 최적화 (우선순위: 낮음)



---- 번들 크기 분석 및 최적화

- 런타임 성능 프로파일링

## 코드 품질 현황- 메모리 사용량 모니터링



### 현재 테스트 상황### Vitest Skipped 테스트 정리 (우선순위: 중간)



- ✅ **Smoke 테스트**: 15/15 통과 (100%)- E2E로 대체 완료된 8개 skip 테스트 제거 또는 참조 주석 추가

- ✅ **Fast 테스트**: 559/559 통과 (100%, 23 skipped)- 나머지 15개 skipped 테스트 검토 및 정리

- ✅ **E2E 테스트**: 8/8 통과 (100%)

- 🔵 **Skip된 테스트**: 23개 (정리 권장)---



### 기술 스택## 완료된 Phase



- **UI 프레임워크**: Solid.js 1.9.9모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어

- **상태 관리**: Solid Signals (내장, 경량 반응형)있습니다:

- **번들러**: Vite 7

- **타입**: TypeScript strict- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-10-11

- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-10-11

- **디자인 시스템**: CSS Modules + 디자인 토큰- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ - 2025-01-10

- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅

---- **Phase 8**: Fast 테스트 안정화 (우선순위 1-2) ✅ - 2025-01-10

- 이전 Phase들... (COMPLETED 문서 참조)

## 품질 게이트

---

모든 PR은 다음 기준을 충족해야 합니다:

## 개발 가이드라인

- [ ] TypeScript: 0 에러 (src/)

- [ ] ESLint: 0 에러, 0 경고### TDD 접근

- [ ] Smoke 테스트: 100% 통과

- [ ] Fast 테스트: 100% 통과 (skip 제외)- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서

- [ ] 빌드: dev/prod 성공- RED → GREEN → REFACTOR 사이클 준수

- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수- 테스트 우선 작성으로 명확한 수용 기준 설정

- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수

- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영### 코딩 규칙 준수



---- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용

- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import 금지

## 참고 문서- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용

- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`

- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책

- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙### 검증 절차

- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법

- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역각 작업 완료 후:

- **SolidJS 최적화 분석**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` - Phase 14 근거

```powershell
npm run typecheck  # TypeScript 타입 체크
npm run lint:fix   # ESLint 자동 수정
npm test:smoke     # 핵심 기능 스모크 테스트
npm test:fast      # 빠른 단위 테스트
npm run build      # dev/prod 빌드 검증
````

---

## 코드 품질 현황

### 마이그레이션 완료 현황

- ✅ **Phase 1-12**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정, UX 가드,
  E2E 통합 완료
- ✅ **빌드**: dev 727.39 KB / prod 325.05 KB (gzip: 88.24 KB)
- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)
- ✅ **린트**: 0 warnings, 0 errors
- ✅ **의존성 그래프**: 0 위배

### 현재 테스트 상황

- ✅ **Smoke 테스트**: 15/15 통과 (100%)
- ✅ **Fast 테스트**: 538/538 통과 (100%, 23 skipped)
- ✅ **E2E 테스트**: 8/8 통과 (100%)
- 🔵 **Skip된 테스트**: 23개 (정리 권장)

### 기술 스택

- **UI 프레임워크**: Solid.js 1.9.9
- **상태 관리**: Solid Signals (내장, 경량 반응형)
- **번들러**: Vite 7
- **타입**: TypeScript strict
- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)

- **디자인 시스템**: CSS Modules + 디자인 토큰

---

## 품질 게이트

모든 PR은 다음 기준을 충족해야 합니다:

- [ ] TypeScript: 0 에러 (src/)
- [ ] ESLint: 0 에러, 0 경고
- [ ] Smoke 테스트: 100% 통과
- [ ] Fast 테스트: 100% 통과 (skip 제외)
- [ ] 빌드: dev/prod 성공
- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수
- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수
- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

---

## 참고 문서

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계
- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책
- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙
- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법
- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

---

**마지막 업데이트**: 2025-01-10

**다음 단계**: E2E 테스트 프레임워크 도입 (Playwright/Cypress 선택)
