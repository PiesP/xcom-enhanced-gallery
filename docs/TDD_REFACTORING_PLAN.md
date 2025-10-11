# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

> **현재 상태**: Phase 14 완료 - 다음 Phase 제안 검토 중> **현재 상태**: Phase
> 14 완료 - 다음 Phase 제안 검토 중> **현재 상태**: Phase

> > 14.3 대기 - SolidJS 반응성 최적화 진행 중> **현재 상태**:

> **최종 업데이트**: 2025-01-11

> > > Phase 14.3 대기 - SolidJS 반응성 최적화 진행 중

> **빌드**: ✅ dev (727.65 KB) / prod (327.42 KB gzip: 89.04 KB)

> > **최종 업데이트**: 2025-01-11

> **테스트**: ✅ Vitest 569/573 (99.3%, 23 skipped, 4 POC failures) | ✅ E2E 8/8
> (100%)

> > >

---

> **빌드**: ✅ dev (727.65 KB) / prod (327.42 KB gzip: 89.04 KB)

## 활성 작업

> > **최종 업데이트**: 2025-01-11> **최종 업데이트**: 2025-01-11

현재 진행 중인 Phase가 없습니다. 다음 Phase 제안 검토 중입니다.

> **테스트**: ✅ Vitest 569/573 (99.3%, 23 skipped, 4 POC failures) | ✅ E2E 8/8

---> (100%)

## 완료된 Phase> >

모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어
있습니다:---

- **Phase 14**: SolidJS 반응성 최적화 ✅ - 2025-01-11> **빌드**: ✅ dev (727.65
  KB) / prod (327.42 KB gzip: 89.04 KB)> **빌드**: ✅
  - Phase 14.1: 불필요한 메모이제이션 제거

  - Phase 14.2: Props 접근 패턴 일관성## 활성 작업> dev (727.65 KB) / prod
    (327.42 KB gzip: 89.04 KB)

  - Phase 14.3: 유틸리티 통합 (signalSelector.ts 공식화)

현재 진행 중인 Phase가 없습니다. 다음 Phase 제안 검토 중입니다.> >

- **Phase 13**: 툴바 인디케이터 반응성 수정 ✅ - 2025-01-11

---> **테스트**: ✅ Vitest 569/573 (99.3%, 23 skipped, 4 POC failures)>

- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-01-10**테스트**:

- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-01-10> ✅ Vitest
  569/573 (99.3%, 23 skipped, 4 POC failures)

- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ - 2025-01-10##
  완료된 Phase

- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅---

- 이전 Phase들... (COMPLETED 문서 참조)모든 완료된 Phase는
  `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어

있습니다:

---

## 활성 작업## 활성 작업

## 다음 Phase 제안

- **Phase 14**: SolidJS 반응성 최적화 ✅ - 2025-01-11

### Phase 15: Vitest Skipped 테스트 정리 (우선순위: 중간) - Phase 14.1: 불필요한 메모이제이션 제거### Phase 14: SolidJS 반응성 최적화###

    Phase 14: SolidJS 반응성 최적화

**배경**: 현재 23개의 테스트가 skip 상태이며, 대부분은 E2E로 대체되었거나 레거시
POC 테스트입니다.

- Phase 14.2: Props 접근 패턴 일관성

**목표**: 테스트 스위트 정리 및 유지보수성 향상

- Phase 14.3: 유틸리티 통합 (signalSelector.ts 공식화)**배경**:

**작업 내용**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` 분석 결과, React 습관에서

- E2E로 대체 완료한 8개 skip 테스트 제거 또는 참고 주석 추가남아있는 불필요한
  메모이제이션과 비효율적 패턴 발견**배경**:

- 나머지 15개 skipped 테스트 검토 및 정리

- POC 실패 4개는 의도적 실패이므로 별도 표시 유지- **Phase 13**: 툴바 인디케이터
  반응성 수정 ✅ -

  2025-01-11`docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` 분석 결과, React 습관에서

**수용 기준**: 남아있는

- [ ] 불필요한 skip 제거불필요한 메모이제이션과 비효율적 패턴 발견

- [ ] 필요한 skip은 명확한 이유 주석 추가

- [ ] 타입 체크/린트/빌드 통과- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ -
      2025-01-10

### Phase 16: 문서 정리 (우선순위: 낮음)**목표**: SolidJS의 fine-grained reactivity를 최대한 활용하여 코드 복잡도 감소

**목표**: 프로젝트 문서 구조 정리 및 최신화- **Phase 11**: E2E 회귀 커버리지
구축 (Playwright) ✅ - 2025-01-10및 성능

개선**목표**: SolidJS의 fine-grained reactivity를 최대한 활용하여 코드

**작업 내용**:

복잡도 감소 및 성능 개선

- [ ] SOLIDJS_OPTIMIZATION_ANALYSIS.md를 COMPLETED.md와 통합하여 간결화

- [ ] 백업 파일 최종 정리 (.backup 파일들)- **Phase 10**: 테스트 안정화
      (Solid.js 마이그레이션 대응) ✅ - 2025-01-10

- [ ] 아키텍처 다이어그램 최신화 (필요 시)

**완료 현황**:**완료 현황**:

### Phase 17: 성능 최적화 (우선순위: 낮음)

- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅

**목표**: 번들 크기 및 런타임 성능 개선

- ✅ Phase 14.1: 불필요한 메모이제이션 제거 (2025-01-11)

**작업 내용**:

- 이전 Phase들... (COMPLETED 문서 참조)

- 번들 크기 분석 및 최적화

- 런타임 성능 프로파일링- ✅ Phase 14.1: 불필요한 메모이제이션 제거
  (2025-01-11)- ✅ Phase 14.2: Props

- 메모리 사용량 모니터링

--- 접근 패턴 일관성 확보 (2025-01-11)

---

## 다음 Phase 제안- ✅ Phase 14.2: Props 접근 패턴 일관성 확보 (2025-01-11)- � Phase 14.3:

## 개발 가이드라인

유틸리티 통합 및 문서화

### TDD 접근

### Phase 15: Vitest Skipped 테스트 정리 (우선순위: 중간)

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서

- RED → GREEN → REFACTOR 사이클 준수- 📋 Phase 14.3: 유틸리티 통합 및 문서화

- 테스트 우선 작성으로 명확한 수용 기준 설정

**배경**: 현재 23개의 테스트가 skip 상태이며, 대부분은 E2E로 대체되었거나 레거시

### 코딩 규칙 준수POC 테스트입니다.

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히
  활용**구현 순서** (3단계):#### Phase 14.1: 불필요한 메모이제이션 제거 ✅ 완료

- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import 금지

- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만
  사용**목표**: 테스트 스위트 정리 및 유지보수성 향상(2025-01-11) - 수동

- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만
  사용포커스(manualIdx)가 없을 때만 동기화하여 사용자 의도 유지

- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`

**작업 내용**:**구현 순서** (3단계):

### 검증 절차

- E2E로 대체 완료한 8개 skip 테스트 제거 또는 참고 주석 추가상세 내역:

각 작업 완료 후: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조**품질 게이트**:

```````powershell- 나머지 15개 skipped 테스트 검토 및 정리

npm run typecheck  # TypeScript 타입 체크

npm run lint:fix   # ESLint 자동 수정- POC 실패 4개는 의도적 실패이므로 별도 표시 유지#### Phase 14.1: 불필요한

npm test:smoke     # 핵심 기능 스모크 테스트  메모이제이션 제거 ✅ 완료 (2025-01-11)

npm test:fast      # 빠른 단위 테스트

npm run build      # dev/prod 빌드 검증**수용 기준**:#### Phase 14.2: Props 접근 패턴 일관성 📋 대기- [x] 타입 체크

```통과 (0 errors)



---- [ ] 불필요한 skip 제거상세 내역: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조



## 코드 품질 현황- [ ] 필요한 skip은 명확한 이유 주석 추가



### 마이그레이션 완료 현황- [ ] 타입 체크/린트/빌드 통과- [x] 린트 통과 (0 warnings)



- ✅ **Phase 1-14**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정, UX 가드, E2E 통합, SolidJS 최적화 완료### Phase 16: 문서 정리 (우선순위: 낮음)#### Phase 14.2: Props 접근 패턴 일관성 ✅ 완료 (2025-01-11)

- ✅ **빌드**: dev 727.65 KB / prod 327.42 KB (gzip: 89.04 KB)

- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)**목표**: 프로젝트 문서 구조 정리 및 최신화**목표**: 모든 컴포넌트에서 props를

- ✅ **린트**: 0 warnings, 0 errorsGetter 함수로 일관되게 접근- [x] 스모크

- ✅ **의존성 그래프**: 0 위배

**작업 내용**:상세 내역: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조테스트

### 현재 테스트 상황통과 (15/15)



- ✅ **Smoke 테스트**: 15/15 통과 (100%)- [ ] SOLIDJS_OPTIMIZATION_ANALYSIS.md를 COMPLETED.md와 통합하여 간결화####

- ✅ **Fast 테스트**: 554/554 통과 (100%, 23 skipped)      Phase 14.3: 유틸리티 통합 📋 대기- [x] 빌드 성공 (dev: 728 KB)

- ✅ **Unit 테스트**: 569/573 통과 (99.3%, 23 skipped, 4 POC failures)

- ✅ **E2E 테스트**: 8/8 통과 (100%)- [ ] 백업 파일 최종 정리 (.backup 파일들)

- 🔵 **Skip된 테스트**: 23개 (정리 권장)

- 🟡 **POC 실패**: 4개 (의도적 실패, 참고용)- [ ] 아키텍처 다이어그램 최신화 (필요 시)**목표**: 중복 유틸리티 정리 및 공식

      가이드 작성**대상 파일**:- [ ] 실제

### 기술 스택

브라우저(X.com) 검증 필요

- **UI 프레임워크**: Solid.js 1.9.9

- **상태 관리**: Solid Signals (내장, 경량 반응형)### Phase 17: 성능 최적화 (우선순위: 낮음)

- **번들러**: Vite 7

- **타입**: TypeScript strict**작업 내용**:- `src/shared/hooks/useGalleryToolbarLogic.ts`: Props를 직접 구조

- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)

- **디자인 시스템**: CSS Modules + 디자인 토큰**목표**: 번들 크기 및 런타임 성능 개선분해하는 패턴



---**작업 내용**:수정



## 품질 게이트- 번들 크기 분석 및 최적화- [ ] `signalOptimization.ts` deprecated 표시 또는

  제거

모든 PR은 다음 기준을 충족해야 합니다:

- 런타임 성능 프로파일링

- [ ] TypeScript: 0 에러 (src/)

- [ ] ESLint: 0 에러, 0 경고- 메모리 사용량 모니터링- [ ] `signalSelector.ts`를 공식 유틸리티로 확정- 기타

- [ ] Smoke 테스트: 100% 통과  컴포넌트: Props 접근 패턴

- [ ] Fast 테스트: 100% 통과 (skip 제외)

- [ ] 빌드: dev/prod 성공      검토 및 수정**다음 단계**: dev build 스크립트를

- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수

- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수---

- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

- [ ] `CODING_GUIDELINES.md`에 SolidJS Best Practices 섹션 추가 실제 X.com에

---

## 개발 가이드라인 설치하여 수동 검증

## 참고 문서

- createMemo 사용 기준

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계

- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책### TDD 접근

- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙

- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법- Props 접근 패턴**수용 기준**:---

- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

- **SolidJS 최적화 분석**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` - Phase 14 근거- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서



---- RED → GREEN → REFACTOR 사이클 준수 - createEffect vs createMemo 선택 가이드



**마지막 업데이트**: 2025-01-11- 테스트 우선 작성으로 명확한 수용 기준 설정



**다음 단계**: Phase 15-17 제안 검토 또는 새로운 개선 사항 발굴- [ ] Props 접근은 항상 Getter 함수 형태 (`() => props.value`)


### 코딩 규칙 준수

**수용 기준**:

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용

- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import
  금지- [ ] 구조 분해는 반응성이 필요 없는 경우만 사용## 다음 Phase 제안

- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용

- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용- [ ] 중복
  유틸리티 제거 또는 명확한 역할 구분

- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`

- [ ] 가이드 문서 작성 완료- [ ] 테스트 추가: Props 변경 시 반응성 검증

### 검증 절차

- [ ] 기존 코드에서 deprecated API 제거

각 작업 완료 후:

- [ ] 타입 체크/린트 통과- [ ] 타입 체크/린트 통과### Phase 14: SolidJS 반응성

``````powershell 최적화 (우선순위: 높음)

npm run typecheck  # TypeScript 타입 체크

npm run lint:fix   # ESLint 자동 수정---- [ ] 빌드 성공

npm test:smoke     # 핵심 기능 스모크 테스트

npm test:fast      # 빠른 단위 테스트## 다음 Phase 제안**배경**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` 분석 결과, React 습관에서

npm run build      # dev/prod 빌드 검증

```### Phase 15: Vitest Skipped 테스트 정리 (우선순위: 중간)#### Phase 14.3: 유틸리티 통합 📋 대기남아있는 불필요한 메모이제이션과 비효율적 패턴 발견



---- E2E로 대체 완료된 8개 skip 테스트 제거 또는 참조 주석 추가**목표**: 중복

  유틸리티 정리 및 공식 가이드 작성**목표**: SolidJS의 fine-grained

## 코드 품질 현황

- 나머지 15개 skipped 테스트 검토 및 정리reactivity를 최대한 활용하여 코드

### 마이그레이션 완료 현황  복잡도 감소



- ✅ **Phase 1-14**: Solid.js 전환, 테스트 인프라, Import/ARIA 수정, UX 가드, E2E 통합, SolidJS 최적화 완료### 문서 정리 (우선순위: 낮음)및 성능 개선

- ✅ **빌드**: dev 727.65 KB / prod 327.42 KB (gzip: 89.04 KB)

- ✅ **소스 코드**: 0 타입 오류 (TypeScript strict)- [ ] SOLIDJS_OPTIMIZATION_ANALYSIS.md를 COMPLETED.md에 통합하여 간결화**작업

- ✅ **린트**: 0 warnings, 0 errors      내용**:

- ✅ **의존성 그래프**: 0 위배

- [ ] 백업 파일 최종 정리 (.backup 파일들)

### 현재 테스트 상황

- [ ] `signalOptimization.ts` deprecated 표시 또는 제거**발견된 이슈**:

- ✅ **Smoke 테스트**: 15/15 통과 (100%)

- ✅ **Fast 테스트**: 554/554 통과 (100%, 23 skipped)### 성능 최적화 (우선순위: 낮음)

- ✅ **Unit 테스트**: 569/573 통과 (99.3%, 23 skipped, 4 POC failures)

- ✅ **E2E 테스트**: 8/8 통과 (100%)- [ ] `signalSelector.ts`를 공식 유틸리티로 확정

- 🔵 **Skip된 테스트**: 23개 (정리 권장)

- 🟡 **POC 실패**: 4개 (의도적 실패, 참고용)- 번들 크기 분석 및 최적화



### 기술 스택- 런타임 성능 프로파일링- [ ] `CODING_GUIDELINES.md`에 SolidJS Best Practices

  섹션 추가- 🔴 불필요한

- **UI 프레임워크**: Solid.js 1.9.9

- **상태 관리**: Solid Signals (내장, 경량 반응형)- 메모리 사용량 모니터링 메모이제이션 (8+ 사례): Props를 createMemo로 감싸는

- **번들러**: Vite 7  패턴

- **타입**: TypeScript strict  - createMemo 사용 기준- 🟡 Props 직접 접근 미준수 (5+ 사례): 반응성 손실 위험

- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)

- **디자인 시스템**: CSS Modules + 디자인 토큰---



---- Props 접근 패턴- 🟡 과도한 createEffect (3+ 사례): Props → Signal 불필요



## 품질 게이트## 완료된 Phase 복사



모든 PR은 다음 기준을 충족해야 합니다:모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어

있습니다: - createEffect vs createMemo 선택 가이드- 🟠 중복 Selector 유틸리티:

- [ ] TypeScript: 0 에러 (src/)

- [ ] ESLint: 0 에러, 0 경고    signalSelector.ts vs signalOptimization.ts

- [ ] Smoke 테스트: 100% 통과

- [ ] Fast 테스트: 100% 통과 (skip 제외)- **Phase 14.2**: Props 접근 패턴 일관성 ✅ - 2025-01-11

- [ ] 빌드: dev/prod 성공

- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수- **Phase 14.1**: 불필요한 메모이제이션 제거 ✅ - 2025-01-11**수용 기준**:**구현

- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수  순서** (3단계):

- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영

- **Phase 13**: 툴바 인디케이터 반응성 수정 ✅ - 2025-01-11

---

- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-01-10- [ ] 중복 유틸리티

## 참고 문서  제거 또는 명확한 역할 구분



- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-01-10

- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책

- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ - 2025-01-10- [ ]

- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법  가이드 문서 작성 완료**Phase 14.1: 불필요한 메모이제이션 제거** (완료 ✅)

- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

- **SolidJS 최적화 분석**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` - Phase 14 근거- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅



---- 이전 Phase들... (COMPLETED 문서 참조)- [ ] 기존 코드에서 deprecated API 제거



**마지막 업데이트**: 2025-01-11---- [ ] 타입 체크/린트 통과**완료 일시**: 2025-01-11 **소요 시간**: ~2시간

(예상:

**다음 단계**: Phase 15-17 제안 검토 또는 새로운 개선 사항 발굴

      1-2일, 실제: 단일 세션)

## 개발 가이드라인

---**구현 내역**:

### TDD 접근

## 다음 Phase 제안- ✅ ToolbarHeadless.tsx: `currentIndex`/`totalCount` createMemo 제거 → props

- 각 작업은 실패하는 테스트 작성 → 최소 구현 → 리팩토링 순서

- RED → GREEN → REFACTOR 사이클 준수직접 접근

- 테스트 우선 작성으로 명확한 수용 기준 설정

### Phase 15: Vitest Skipped 테스트 정리 (우선순위: 중간)- ✅ Toolbar.tsx: `canGoNext`/`canGoPrevious` createMemo 제거 → JSX에서 인라인

### 코딩 규칙 준수

비교

- **SolidJS 반응성**: `createSignal`, `createMemo`, `createEffect` 적절히 활용

- **Vendor getter 경유**: `getSolid()`, `getSolidStore()` 사용, 직접 import
  금지- E2E로 대체 완료된 8개 skip 테스트 제거 또는 참조 주석 추가- ✅
  LazyIcon.tsx:

- **PC 전용 이벤트**: click, keydown/up, wheel, contextmenu, mouse\* 만 사용
  `className`/`style` 정적 평가 → Getter 함수로 변경

- **CSS Modules + 디자인 토큰**: 하드코딩 금지, `--xeg-*` 토큰만 사용

- **경로 별칭 사용**: `@`, `@features`, `@shared`, `@assets`- 나머지 15개
  skipped 테스트 검토 및 정리- ✅ VerticalGalleryView.tsx:

  `memoizedMediaItems` createMemo 제거 → For

### 검증 절차

컴포넌트에서 인라인 map

각 작업 완료 후:

### 문서 정리 (우선순위: 낮음)

`````powershell

npm run typecheck  # TypeScript 타입 체크**테스트 추가**:

npm run lint:fix   # ESLint 자동 수정

npm test:smoke     # 핵심 기능 스모크 테스트- [ ] SOLIDJS_OPTIMIZATION_ANALYSIS.md를 COMPLETED.md에 통합하여 간결화

npm test:fast      # 빠른 단위 테스트

npm run build      # dev/prod 빌드 검증- [ ] 백업 파일 최종 정리 (.backup 파일들)-

```      `test/unit/components/toolbar-headless-memo.test.tsx` (4 tests)



---- `test/unit/components/toolbar-memo.test.tsx` (4 tests)



## 코드 품질 현황### 성능 최적화 (우선순위: 낮음)- `test/unit/components/lazy-icon-memo.test.tsx` (4 tests)



### 현재 테스트 상황- `test/unit/features/gallery/vertical-gallery-memo.test.tsx` (3 tests)



- ✅ **Smoke 테스트**: 15/15 통과 (100%)- 번들 크기 분석 및 최적화- 총 15개 테스트 추가, 100% 통과

- ✅ **Fast 테스트**: 569/573 통과 (99.3%, 23 skipped, 4 POC failures)

- ✅ **E2E 테스트**: 8/8 통과 (100%)- 런타임 성능 프로파일링

- 🔵 **Skip된 테스트**: 23개 (정리 권장)

- 메모리 사용량 모니터링**품질 게이트**:

### 기술 스택

---- ✅ 타입 체크: 0 errors

- **UI 프레임워크**: Solid.js 1.9.9

- **상태 관리**: Solid Signals (내장, 경량 반응형)- ✅ 린트: 0 warnings

- **번들러**: Vite 7

- **타입**: TypeScript strict## 완료된 Phase- ✅ 테스트: 559/559 passed (기존 554 + 신규 15 - 10 skipped)

- **테스트**: Vitest 3 + JSDOM, Playwright (E2E)

- **디자인 시스템**: CSS Modules + 디자인 토큰- ✅ 빌드 성공 (dev: 728 KB, prod: 327.52 KB)



---모든 완료된 Phase는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 기록되어

있습니다:

## 품질 게이트

**Phase 14.2: Props 접근 패턴 일관성** (대기 중)

모든 PR은 다음 기준을 충족해야 합니다:

- **Phase 14.1**: 불필요한 메모이제이션 제거 ✅ - 2025-01-11

- [ ] TypeScript: 0 에러 (src/)

- [ ] ESLint: 0 에러, 0 경고- **Phase 13**: 툴바 인디케이터 반응성 수정 ✅ - 2025-01-11-

- [ ] Smoke 테스트: 100% 통과  useGalleryToolbarLogic.ts: 모든 props를 Getter 함수로

- [ ] Fast 테스트: 100% 통과 (skip 제외)

- [ ] 빌드: dev/prod 성공- **Phase 12**: E2E 테스트 안정화 및 CI 통합 ✅ - 2025-01-10- 테스트 추가: props

- [ ] TDD: RED → GREEN → REFACTOR 사이클 준수  변경 시 반응성 검증

- [ ] 코딩 규칙: `docs/CODING_GUIDELINES.md` 준수

- [ ] 문서화: 변경 사항을 이 계획 또는 완료 로그에 반영- **Phase 11**: E2E 회귀 커버리지 구축 (Playwright) ✅ - 2025-01-10



---- **Phase 10**: 테스트 안정화 (Solid.js 마이그레이션 대응) ✅ -

  2025-01-10**Phase 14.3: 유틸리티 통합** (대기 중)

## 참고 문서

- **Phase 9**: UX 개선 - 스크롤 포커스 동기화 · 툴바 가드 · 휠 튜닝 ✅

- **아키텍처**: `docs/ARCHITECTURE.md` - 3계층 구조, 의존성 경계

- **코딩 가이드**: `docs/CODING_GUIDELINES.md` - 스타일, 토큰, 테스트 정책- 이전 Phase들... (COMPLETED 문서 참조)- signalOptimization.ts deprecated 표시

- **의존성 거버넌스**: `docs/DEPENDENCY-GOVERNANCE.md` - 의존성 가드 규칙

- **에이전트 가이드**: `AGENTS.md` - 로컬/CI 워크플로, 스크립트 사용법- 공식 가이드 작성 (createMemo 사용 기준)

- **완료 로그**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` - 이전 Phase 상세 내역

- **SolidJS 최적화 분석**: `docs/SOLIDJS_OPTIMIZATION_ANALYSIS.md` - Phase 14 근거---- CODING_GUIDELINES.md에 SolidJS Best Practices 섹션 추가


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
```````

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
