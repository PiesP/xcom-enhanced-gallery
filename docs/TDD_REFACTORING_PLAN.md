# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.본 문서는 복잡한 구현/구조를 간결하고 현대적으로
재구축하기 위한 리팩토링

Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로

**최근 업데이트**: 2025-10-06 — Epic BUNDLE-SIZE-DEEP-OPTIMIZATION Phase 4
시작이관하여 히스토리를 분리합니다.본 문서는 복잡한 구현/구조를 간결하고
현대적으로

재구축하기 위한 리팩토링본

---

문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링

## 1. 운영 원칙

**최근 업데이트**: 2025-10-06 — Epic BUNDLE-SIZE-DEEP-OPTIMIZATION 계획 수립

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`

- 실행/CI/빌드 파이프라인: `AGENTS.md`Epic들을 관리합니다. 완료된 내용은
  `TDD_REFACTORING_PLAN_COMPLETED.md`로Epic들을

- 아키텍처 설계: `docs/ARCHITECTURE.md`

- 본 문서: 활성 Epic/작업과 Acceptance 중심---관리합니다. 완료된 내용은
  `TDD_REFACTORING_PLAN_COMPLETED.md`로

- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
  진행

## 1. 운영 원칙이관하여 히스토리를 분리합니다.이관하여 히스토리를 분리합니다.

---

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,

## 2. 활성 Epic 현황 `docs/vendors-safe-api.md`**최근 업데이트**: 2025-10-06 — Sub-Epic 3

TOOLBAR-HOVER-ZONE-EXPANSION

### Epic BUNDLE-SIZE-DEEP-OPTIMIZATION (2025-10-06) 🔄 **IN PROGRESS**

- 실행/CI/빌드 파이프라인: `AGENTS.md`완료**최근 업데이트**: 2025-10-06 —

**식별자**: `BUNDLE-SIZE-DEEP-OPTIMIZATION` Sub-Epic 3
TOOLBAR-HOVER-ZONE-EXPANSION 완료

**목표**: 번들 크기 심층 최적화를 통한 로딩 시간 단축 및 사용자 경험 개선-
아키텍처 설계: `docs/ARCHITECTURE.md`

#### 현재 상황 분석- 본 문서: 활성 Epic/작업과 Acceptance 중심---

**번들 크기**:- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로
분할하여 단계적

- Raw: 495.19 KB (목표: ≤473 KB, **22 KB 초과** ⚠️) 진행

- Gzip: 123.73 KB (목표: ≤118 KB, **5.73 KB 초과** ⚠️)

- 이상적 목표: Raw 420 KB (75 KB 감축), Gzip 105 KB (18.73 KB 감축)## 1. 운영
  원칙## 1. 운영 원칙

**완료된 최적화** (2025-10-05):---

- ✅ Tree-shaking 개선 (`package.json` sideEffects, Rollup treeshake 옵션)

- ✅ 중복 코드 제거 (`core-utils.ts` 3개 중복 → `utils.ts` 통합)-
  코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,-

- ✅ Terser 압축 강화 (pure_funcs, unsafe opts, mangleProps)

- ✅ 15개 계약 테스트 GREEN (회귀 방지)## 2. 활성 Epic 현황
  코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,

**남은 과제**:### Epic BUNDLE-SIZE-DEEP-OPTIMIZATION (2025-10-06)
`docs/vendors-safe-api.md` `docs/vendors-safe-api.md`

1. **Orphan 파일**: 37개 파일 (대부분 의도적 분리 모듈이나 일부 실제 미사용 파일
   존재)

2. **Pure annotations**: 0개 (목표: 50+ annotations로 Terser 최적화
   강화)**식별자**: `BUNDLE-SIZE-DEEP-OPTIMIZATION`- 실행/CI/빌드 파이프라인:

3. **Re-export 체인**: 과도한 barrel exports로 tree-shaking 비효율`AGENTS.md`-
   실행/CI/빌드 파이프라인: `AGENTS.md`

4. **Dead code**: 미사용 export 및 함수 잔존

**목표**: 번들 크기 심층 최적화를 통한 로딩 시간 단축 및 사용자 경험 개선-

#### 최적 솔루션: 옵션 A (점진적 최적화 4-Phase 접근)아키텍처 설계: `docs/ARCHITECTURE.md`- 아키텍처 설계: `docs/ARCHITECTURE.md`

**선정 이유**:#### 현재 상황 분석- 본 문서: 활성 Epic/작업과 Acceptance 중심- 본
문서: 활성 Epic/작업과

1. **낮은 리스크**: 각 Phase마다 독립적 검증 가능, 15개 계약 테스트로 회귀 방지

2. **측정 가능한 성과**: 각 Phase마다 번들 크기 변화 추적Acceptance 중심

3. **프로젝트 안정성**: 기존 BUNDLE-SIZE-OPTIMIZATION (2025-10-05) 성공 경험
   활용

4. **TDD 친화적**: RED → GREEN → REFACTOR 패턴 적용 용이**번들 크기**:

**타임라인**:- Raw: 495.19 KB (목표: ≤473 KB, **22 KB 초과** ⚠️)- **Epic 분할
원칙**: 복잡한

- Phase 4: 2-3일 (Deep code audit) Epic은 독립적이고 작은 Sub-Epic으로 분할하여

- Phase 5: 1-2일 (Pure annotations)

- Phase 6: 2-3일 (Advanced tree-shaking)- Gzip: 123.73 KB (목표: ≤118 KB, **5.73
  KB 초과** ⚠️) 단계적- \*\*Epic 분할

- Phase 7: 1-2일 (Orphan 정리) 원칙\*\*: 복잡한 Epic은 독립적이고 작은
  Sub-Epic으로

- **총 예상**: 6-10일

- 이상적 목표: Raw 420 KB (75 KB 감축), Gzip 105 KB (18.73 KB 감축) 분할하여

**Acceptance Criteria**: 단계적

- ✅ Raw 번들: ≤450 KB (현재 495 KB 대비 -45 KB, -9%)

- ✅ Gzip 번들: ≤112 KB (현재 124 KB 대비 -12 KB, -10%)**완료된 최적화**
  (2025-10-05): 진행 진행

- ✅ 기존 15개 계약 테스트 모두 GREEN

- ✅ 새 테스트 10개 추가 (Pure annotations, Orphan 검증)- ✅ Tree-shaking 개선
  (`package.json` sideEffects, Rollup treeshake 옵션)

- ✅ 품질 게이트 통과 (typecheck, lint, test, build)

- ✅ 기능 회귀 없음 (전체 테스트 스위트 GREEN)- ✅ 중복 코드 제거
  (`core-utils.ts` 3개 중복 → `utils.ts` 통합)---

---- ✅ Terser 압축 강화 (pure_funcs, unsafe opts, mangleProps)

#### Phase 4: Deep Code Audit (심층 코드 감사) 🔄 **IN PROGRESS**- ✅ 15개 계약 테스트 GREEN (회귀 방지)## 2. 활성 Epic 현황## 2. 활성 Epic 현황

**목표**: 미사용 코드 탐지 및 제거**남은 과제**:### 현재 활성 Epic 없음**현재
활성 Epic 없음**

**Task 1: 미사용 Export 탐지** ⏳ **PENDING**1. **Orphan 파일**: 37개 파일
(대부분 의도적 분리 모듈이나 일부 실제 미사용 파일

- 정적 분석: `ts-unused-exports` 또는 `knip` 사용 존재)

- 런타임 추적: 빌드 결과에서 실제 사용 여부 확인

- 목표: 50+ 미사용 export 제거2. **Pure annotations**: 0개 (목표: 50+
  annotations로 Terser 최적화 강화)모든

  Epic이 완료되었습니다. 완료된 Epic들은모든 Epic이 완료되었습니다. 완료된

**Task 2: Re-export 체인 단순화** ⏳ **PENDING**

- 현재: `src/utils/index.ts` → `src/shared/index.ts` → 최종 사용처 (3+ depth)3.
  **Re-export 체인**: 과도한 barrel exports로 tree-shaking 비효율Epic들은

- 목표: Direct import 권장, barrel export ≤2 depth

- 예상 효과: 10-15 KB 감축4. **Dead code**: 미사용 export 및 함수 잔존

**Task 3: Dead Code 제거** ⏳
**PENDING**[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서

- 미사용 함수/변수 제거

- 주석 처리된 코드 정리#### 솔루션 비교 분석

- 예상 효과: 5-10 KB 감축

확인하실 수 있습니다.확인하실 수 있습니다.

**테스트**:

```typescript##### 옵션 A: 점진적 최적화 (4-Phase 접근)

// test/architecture/deep-code-audit.contract.test.ts

describe('Phase 4: Deep Code Audit', () => {**최근 완료**:**최근 완료**:

  it('[GREEN] should have no unused exports', () => {

    // ts-unused-exports 결과 검증**Phase 4: Deep Code Audit**

  });

- 미사용 export 탐지 (정적 분석 + 런타임 추적)- ✅ Sub-Epic 3:

  it('[GREEN] should have re-export chains ≤2 depth', () => {  TOOLBAR-HOVER-ZONE-EXPANSION (2025-10-06): 툴바 호버 영역- ✅

    // barrel export depth 검증

  });- 과도한 re-export 체인 단순화 (≤3 depth) Sub-Epic 3:

  TOOLBAR-HOVER-ZONE-EXPANSION (2025-10-06): 툴바 호버 영역

  it('[GREEN] should have no commented-out code blocks', () => {

    // 주석 처리된 코드 탐지- Dead code 제거 (미사용 함수/변수)

  });

});  확장 및 시각적 힌트 추가 확장 및 시각적 힌트 추가

```

**Phase 5: Pure Annotations 추가**

**예상 효과**: Raw -20 KB, Gzip -5 KB

- 부작용 없는 함수에 `/*#__PURE__*/` 주석 추가- ✅ Epic TIMELINE-VIDEO-CLICK-FIX

--- (2025-10-05, a54c3957): 타임라인 비디오 클릭-

#### Phase 5: Pure Annotations 추가 ⏳ **PENDING**- 목표: 50+ annotations (서비스 팩토리, 유틸리티 함수 중심) ✅ Epic

TIMELINE-VIDEO-CLICK-FIX (2025-10-05, a54c3957): 타임라인 비디오 클릭

**목표**: Terser 최적화 강화를 위한 Pure annotations 추가

- Terser가 안전하게 제거 가능하도록 표시

**Task 1: 서비스 팩토리 함수**

````typescript 감지 개선 + body-scroll-manager 통합 감지 개선 + body-scroll-manager 통합

// ✅ Before

export function createMediaService() {**Phase 6: Advanced Tree-shaking**

  return new MediaService();

}- Barrel export 최소화 (direct import 권장)- ✅ Epic MEDIA-TYPE-ENHANCEMENT

  (2025-10-05): 미디어 타입 지원 강화 (비디오,-

// ✅ After

export const createMediaService = /*#__PURE__*/ () => {- Side-effect 정밀 추적 (세분화된 sideEffects 설정) ✅ Epic

  return new MediaService();  MEDIA-TYPE-ENHANCEMENT (2025-10-05): 미디어 타입 지원 강화 (비디오,

};

```- Dynamic import 검토 (코드 분할 가능성, Userscript 제약 고려)



**Task 2: 유틸리티 함수**  GIF 컴포넌트) GIF 컴포넌트)

```typescript

// ✅ After**Phase 7: Orphan 파일 정리**

export const isValidUrl = /*#__PURE__*/ (url: string): boolean => {

  try {- 37개 orphan 파일 분석 (의도적 vs 실제 미사용)---

    new URL(url);

    return true;- 실제 미사용 파일만 선별 제거

  } catch {

    return false;- 의도적 분리 모듈은 문서화## 3. 향후 Epic 후보## 3. 향후 Epic 후보

  }

};**장점**:### Epic GALLERY-UX-ENHANCEMENT### Epic GALLERY-UX-ENHANCEMENT

````

- ✅ 낮은 리스크 (단계별 검증 가능)

**Task 3: 자동화 스크립트**

````pwsh- ✅ 점진적 개선 (각 Phase마다 측정 가능한 성과)**목표**: 갤러리 사용자 경험

# scripts/add-pure-annotations.mjs  개선**목표**: 갤러리 사용자 경험 개선

npm run optimize:pure-annotations

```- ✅ 회귀 방지 (15개 계약 테스트로 자동 검증)



**예상 효과**: Raw -10 KB, Gzip -3 KB- ✅ 기존 아키텍처 유지 (레이어 경계 변경 없음)**우선순위**: Medium**우선순위**:

  Medium

---

**단점**:**완료 현황**:**완료 현황**:

#### Phase 6: Advanced Tree-shaking ⏳ **PENDING**

- ⚠️ 시간 소요 (4-Phase, 각 2-3일 예상)

**목표**: Tree-shaking 효율성 극대화

- ⚠️ 점진적 개선 (혁신적 변화 아님)- ✅ Sub-Epic 1: SCROLL-POSITION-RESTORATION

**Task 1: Barrel Export 최소화**  (2025-10-05, 커밋: 4743bed2)- ✅

- 현재: 30+ re-export 파일

- 목표: Direct import 권장, barrel export ≤10 files  Sub-Epic 1: SCROLL-POSITION-RESTORATION (2025-10-05, 커밋: 4743bed2)



**Task 2: Side-effect 세분화****예상 효과**:

```json

{- Raw: 495 KB → 450 KB (-45 KB, -9%)- ✅ Sub-Epic 2: CONTAINER-SIZE-OPTIMIZATION

  "sideEffects": [  (2025-10-05, 커밋: fd20abfc)- ✅

    "*.css",

    "src/main.ts",- Gzip: 124 KB → 112 KB (-12 KB, -10%) Sub-Epic 2: CONTAINER-SIZE-OPTIMIZATION

    "src/bootstrap/**/*.ts"  (2025-10-05, 커밋: fd20abfc)

  ]

}---- ✅ Sub-Epic 3: TOOLBAR-HOVER-ZONE-EXPANSION (2025-10-06): 구현 검증 완료-

```✅



**Task 3: Dynamic Import 검토**Sub-Epic 3: TOOLBAR-HOVER-ZONE-EXPANSION (2025-10-06): 구현 검증 완료

- Lazy loading 기회 파악 (Settings Modal, Keyboard Help)

- Userscript 단일 파일 제약 고려##### 옵션 B: 공격적 리팩토링 (1-Phase 통합)



**예상 효과**: Raw -10 KB, Gzip -3 KB- ⏸️ Sub-Epic 2-B: Gallery Integration (REFACTOR 단계, 별도 작업 권장)- ⏸️



---**단일 Phase: All-in-One Optimization** Sub-Epic 2-B: Gallery Integration

(REFACTOR 단계, 별도 작업 권장)

#### Phase 7: Orphan 파일 정리 ⏳ **PENDING**

- 모든 최적화 기법 동시 적용

**목표**: 실제 미사용 orphan 파일만 선별 제거

- 아키텍처 재구성 포함 (모듈 병합, 레이어 재설계)- 🔄 Sub-Epic 4:

**현황**: 37개 orphan 파일 (의존성 그래프 분석 결과)  TWITTER-NATIVE-INTEGRATION (보류 - 리스크 높음)- 🔄 Sub-Epic 4:



**Task 1: Orphan 파일 분류**- 대규모 코드 이동 및 삭제 TWITTER-NATIVE-INTEGRATION (보류 - 리스크 높음)



의도적 분리 모듈 (유지 필요):**장점**:**참조**: 완료된 Sub-Epic들은**참조**: 완료된 Sub-Epic들은

- `src/assets/icons/xeg-icons.ts` - Icon 정의

- `src/bootstrap/*.ts` - 초기화 순서 명시적 제어- ✅ 빠른 결과 (1-2주)

- `src/shared/polyfills/solid-jsx-dev-runtime.ts` - Polyfill

- ✅ 최대 효과 (목표 420 KB 달성

실제 미사용 파일 (제거 후보):  가능)[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서

- Legacy 코드

- 미완성 실험 기능**단점**:확인 가능확인 가능



**Task 2: 제거 전 검증**- ❌ 높은 리스크 (대규모 변경으로 회귀 가능성)

```pwsh

# 각 파일에 대해:- ❌ 디버깅 어려움 (변경 범위 너무 광범위)---

1. grep 검색으로 참조 확인

2. 테스트 실행 (제거 후 GREEN 유지 확인)- ❌ 롤백 곤란 (all-or-nothing)

3. 빌드 크기 변화 측정

```- ❌ 테스트 부담 증가 (전체 재검증 필요)## 4. TDD 워크플로## 4. TDD

  워크플로## 4. TDD 워크플로

**Task 3: 문서화**

```markdown---1. **RED**: 실패 테스트 추가 (최소 명세)1. **RED**: 실패 테스트 추가 (최소

<!-- docs/ARCHITECTURE.md 업데이트 -->

## Orphan Files (의도적 분리 모듈)명세)1. **RED**: 실패 테스트 추가 (최소 명세)

- `src/assets/icons/xeg-icons.ts`: Icon 정의 중앙 관리

- `src/bootstrap/*.ts`: 초기화 순서 명시적 제어##### 옵션 C: 하이브리드 접근 (선택적 최적화)

````

2. **GREEN**: 최소 변경으로 통과

**예상 효과**: Raw -5 KB, Gzip -1 KB

**선별적 Phase 실행**

---

- Phase 5 (Pure annotations) + Phase 7 (Orphan 정리)만 우선 실행3. **REFACTOR**:

#### 종합 예상 효과 중복 제거/구조 개선2. **GREEN**: 최소 변경으로 통과2.

| Phase | Raw 감축 | Gzip 감축 | 누적 Raw | 누적 Gzip |- Phase 4/6은 효과 검증
후 결정 **GREEN**: 최소 변경으로 통과

|-------|----------|-----------|----------|-----------|

| 현재 | - | - | 495 KB | 124 KB |**장점**:4. **Document**: Completed 로그에
이관

| Phase 4 | -20 KB | -5 KB | 475 KB | 119 KB |

| Phase 5 | -10 KB | -3 KB | 465 KB | 116 KB |- ✅ 중간 리스크 (검증된 기법만
적용)

| Phase 6 | -10 KB | -3 KB | 455 KB | 113 KB |

| Phase 7 | -5 KB | -1 KB | 450 KB | 112 KB |- ✅ 빠른 성과 (2-Phase, 1주
예상)5. **REFACTOR**: 중복 제거/구조 개선3.

**REFACTOR**: 중복 제거/구조 개선

**최종 목표**:

- ✅ Raw: 450 KB (≤473 KB 달성, 이상적 목표 420 KB 근접)**단점**:### 품질 게이트

- ✅ Gzip: 112 KB (≤118 KB 달성, 이상적 목표 105 KB 근접)

- ⚠️ 제한적 효과 (20-30 KB 감축 예상)

---

- ⚠️ 근본 해결 부족 (re-export, dead code 미해결)4. **Document**: Completed

## 3. TDD 워크플로 로그에 이관4. **Document**: Completed 로그에 이관

1. **RED**: 실패 테스트 추가 (최소 명세)---- ✅ `npm run typecheck` (strict
   오류 0)

2. **GREEN**: 최소 변경으로 통과

3. **REFACTOR**: 중복 제거/구조 개선#### 최적 솔루션: 옵션 A (점진적 최적화)- ✅
   `npm run lint:fix` (자동 수정 적용)### 품질 게이트**품질 게이트**:

4. **Document**: Completed 로그에 이관

**선정 이유**:- ✅ `npm test` (해당 Phase GREEN)

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)1. **낮은 리스크**: 각 Phase마다 독립적
  검증 가능, 15개 계약 테스트로 회귀 방지

- ✅ `npm run lint:fix` (자동 수정 적용)

- ✅ `npm test` (해당 Phase GREEN)2. **측정 가능한 성과**: 각 Phase마다 번들
  크기 변화 추적- ✅ `npm run build`

- ✅ `npm run build` (산출물 검증 통과) (산출물 검증 통과)- ✅
  `npm run typecheck` (strict 오류 0)-

---3. **프로젝트 안정성**: 기존 BUNDLE-SIZE-OPTIMIZATION (2025-10-05) 성공 경험

활용 ✅ `npm run typecheck` (strict 오류 0)

## 4. 참조 문서

4. **TDD 친화적**: RED → GREEN → REFACTOR 패턴 적용 용이

- **아키텍처**: [`ARCHITECTURE.md`](ARCHITECTURE.md)

- **코딩 가이드**: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)---- ✅
  `npm run lint:fix` (자동 수정 적용)- ✅ `npm run lint:fix` (자동 수정

- **벤더 API**: [`vendors-safe-api.md`](vendors-safe-api.md)

- **실행/CI**: [`../AGENTS.md`](../AGENTS.md)**타임라인**:적용)

- **완료된 Epic**:
  [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

- Phase 4: 2-3일 (Deep code audit)

---

- Phase 5: 1-2일 (Pure annotations)## 5. 참조 문서- ✅ `npm test` (해당 Phase

본 문서는 활성 Epic만 관리합니다. 완료된 Epic은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 자동 이관됩니다. GREEN)- ✅ `npm test`
(해당 Phase GREEN)

- Phase 6: 2-3일 (Advanced tree-shaking)

- Phase 7: 1-2일 (Orphan 정리)- **아키텍처**:
  [`ARCHITECTURE.md`](ARCHITECTURE.md)- ✅ `npm run build` (산출물

- **총 예상**: 6-10일 검증 통과)- ✅ `npm run build` (산출물 검증 통과)

**Acceptance Criteria**:- **코딩 가이드**:
[`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)

- ✅ Raw 번들: ≤450 KB (현재 495 KB 대비 -45 KB, -9%)

- ✅ Gzip 번들: ≤112 KB (현재 124 KB 대비 -12 KB, -10%)- **벤더 API**:
  [`vendors-safe-api.md`](vendors-safe-api.md)

- ✅ 기존 15개 계약 테스트 모두 GREEN

- ✅ 새 테스트 10개 추가 (Pure annotations, Orphan 검증)- **실행/CI**:
  [`../AGENTS.md`](../AGENTS.md)---

- ✅ 품질 게이트 통과 (typecheck, lint, test, build)

- ✅ 기능 회귀 없음 (전체 테스트 스위트 GREEN)- **완료된 Epic**:

---

[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)## 5.

참조 문서

#### Phase 4: Deep Code Audit (심층 코드 감사)

---- **아키텍처**: [`ARCHITECTURE.md`](ARCHITECTURE.md)

**목표**: 미사용 코드 탐지 및 제거

- **코딩 가이드**: [`CODING_GUIDELINES.md`](CODING_GUIDELINES.md)

**Task 1: 미사용 Export 탐지**

- 정적 분석: `ts-unused-exports` 또는 `knip` 사용본 문서는 활성 Epic만
  관리합니다. 완료된 Epic은- **벤더 API**:

- 런타임 추적: 빌드 결과에서 실제 사용 여부
  확인[`vendors-safe-api.md`](vendors-safe-api.md)

- 목표: 50+ 미사용 export 제거

`TDD_REFACTORING_PLAN_COMPLETED.md`로 자동 이관됩니다.- **실행/CI**:

**Task 2: Re-export 체인 단순화**[`../AGENTS.md`](../AGENTS.md)

- 현재: `src/utils/index.ts` → `src/shared/index.ts` → 최종 사용처 (3+ depth)

- 목표: Direct import 권장, barrel export ≤2 depth- **완료된 Epic**:

- 예상 효과: 10-15 KB 감축
  [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

**Task 3: Dead Code 제거**---

- 미사용 함수/변수 제거

- 주석 처리된 코드 정리본 문서는 활성 Epic만 관리합니다. 완료된 Epic은

- 예상 효과: 5-10 KB 감축`TDD_REFACTORING_PLAN_COMPLETED.md`로 자동 이관됩니다.

**테스트**:- 기존 코드 변경 최소화

````typescript- 타임라인 특화 로직 명확히 분리

// test/architecture/deep-code-audit.contract.test.ts- 트윗 상세 페이지 동작에 영향 없음

describe('Phase 4: Deep Code Audit', () => {

  it('[GREEN] should have no unused exports', () => {**단점**:

    // ts-unused-exports 결과 검증

  });- 코드 복잡도 증가 (새 전략 추가)

- 유지보수 포인트 추가 (타임라인 DOM 변경 시 별도 업데이트)

  it('[GREEN] should have re-export chains ≤2 depth', () => {- 근본 원인(이벤트 차단) 해결하지 못함

    // barrel export depth 검증

  });**난이도**: M **예상 파일 수정**: 5개 (전략 추가, 테스트)



  it('[GREEN] should have no commented-out code blocks', () => {---

    // 주석 처리된 코드 탐지

  });#### 옵션 B: 미디어 감지 로직 강화 (이벤트 차단 완화) ⭐ **권장**

});

```**접근**: `shouldBlockGalleryTrigger()`의 비디오 제어 선택자 정밀화 +

`isProcessableMedia()` 비디오 감지 로직 강화

**예상 효과**: Raw -20 KB, Gzip -5 KB

**장점**:

---

- 전체적인 감지 정확도 향상 (타임라인 + 트윗 상세 모두 개선)

#### Phase 5: Pure Annotations 추가- 단순한 구조 (기존 로직 개선)

- 근본 원인(과도한 차단) 직접 해결

**목표**: Terser 최적화 강화를 위한 Pure annotations 추가- TDD 적용 용이



**Task 1: 서비스 팩토리 함수****단점**:

```typescript

// ✅ Before- 기존 동작에 미세한 영향 가능성 (회귀 테스트 필요)

export function createMediaService() {- 트위터 UI 변경 시 재조정 필요할 수 있음

  return new MediaService();

}**난이도**: S **예상 파일 수정**: 3개 (MediaClickDetector, 테스트)



// ✅ After**구체적 개선 사항**:

export const createMediaService = /*#__PURE__*/ () => {

  return new MediaService();1. `shouldBlockGalleryTrigger()` 비디오 제어 선택자 정밀화

};   - 현재: `[data-testid="videoComponent"] button` (너무 포괄적)

```   - 개선: 실제 컨트롤 버튼만 선택 (재생/일시정지, 음소거, 볼륨)

2. `isProcessableMedia()` 타임라인 비디오 감지 추가

**Task 2: 유틸리티 함수**   - `video` 태그 직접 감지

```typescript   - `[data-testid="videoPlayer"]` 컨테이너 우선 순위 상향

// ✅ Before3. 미디어 컨테이너 범위 확대

export function isValidUrl(url: string): boolean {   - `div[role="button"]` 등 타임라인 특화 선택자 추가

  try {

    new URL(url);---

    return true;

  } catch {#### 옵션 C: 하이브리드 전략 (URL 기반 + DOM 구조 분석)

    return false;

  }**접근**: 페이지 URL 패턴 감지 (`/status/` vs 홈 타임라인) + 각 컨텍스트에 맞는

}DOM 전략 자동 선택



// ✅ After**장점**:

export const isValidUrl = /*#__PURE__*/ (url: string): boolean => {

  try {- 가장 정확한 감지 (컨텍스트 인지)

    new URL(url);- 타임라인/상세 페이지 모두 최적화

    return true;

  } catch {**단점**:

    return false;

  }- 구현 복잡도 높음

};- URL 패턴 의존성 (트위터 URL 구조 변경 시 취약)

```- 유지보수 부담 증가



**Task 3: 자동화 스크립트****난이도**: H **예상 파일 수정**: 8개 (URL 감지, 컨텍스트 관리, 전략 분기)

```pwsh

# scripts/add-pure-annotations.mjs---

# 부작용 없는 함수 자동 탐지 및 annotation 추가

npm run optimize:pure-annotations#### 옵션 D: 로깅 강화 후 실제 DOM 구조 분석 (진단 우선)

````

**접근**: Phase 1에서 타임라인 DOM 구조 로깅 → Phase 2에서 targeted fix

**테스트**:

```typescript**장점**:

// test/architecture/pure-annotations.contract.test.ts

describe('Phase 5: Pure Annotations', () => {- 정확한 원인 파악 (추측 아닌 데이터 기반)

  it('[GREEN] should have at least 50 pure annotations', () => {- 위험도 낮음 (진단만 먼저 수행)

    const srcFiles = glob('src/**/*.{ts,tsx}');- 실제 문제에 맞는 최적 솔루션 선택 가능

    const pureCount = countPureAnnotations(srcFiles);

    expect(pureCount).toBeGreaterThanOrEqual(50);**단점**:

  });

- 2단계 작업 필요 (진단 + 수정)

  it('[GREEN] should have pure annotations on all factory functions', () => {- 즉시 수정 불가 (사용자 로그 수집 필요)

    const factories = findFactoryFunctions('src/**/*.ts');

    factories.forEach(fn => {**난이도**: S (진단) + M (수정) **예상 파일 수정**: Phase 1 (2개), Phase 2 (TBD)

      expect(fn.hasPureAnnotation).toBe(true);

    });---

  });

});**선택된 솔루션**: **옵션 B** (미디어 감지 로직 강화)

```

**선택 이유**:

**예상 효과**: Raw -10 KB, Gzip -3 KB

1. **직접적 해결**: 근본 원인(과도한 이벤트 차단)을 직접 해결

---2. **낮은 리스크**: 단순한 로직 개선, 회귀 테스트로 안전성 보장

3. **TDD 친화적**: RED(실패 테스트) → GREEN(구현) → REFACTOR 적용 용이

#### Phase 6: Advanced Tree-shaking4. **유지보수성**: 기존 구조 유지, 복잡도 증가 없음

5. **범용성**: 타임라인뿐 아니라 전체 미디어 감지 정확도 향상

**목표**: Tree-shaking 효율성 극대화

**백업 계획**: 옵션 B로 개선 후에도 특정 타임라인 케이스에서 실패 시 → 옵션 D

**Task 1: Barrel Export 최소화**(로깅) 추가 진단

- 현재: 30+ re-export 파일 (`index.ts`)

- 목표: Direct import 권장, 필요시에만 barrel export---

- 예시:

````typescript### Epic: MEDIA-TYPE-ENHANCEMENT (미디어 타입 지원 강화) ✅ **100% COMPLETE**

// ❌ Before (barrel export)

// src/shared/utils/index.ts**목표**: 이미지 외 미디어(비디오, GIF)를 갤러리에서 완전히 지원하도록 개선

export * from './core-utils';

export * from './media';**최종 상태** (2025-10-05):



// 사용처- ✅ Phase 1-1: VerticalVideoItem 개발 완료 (2025-10-05)

import { imageFilter } from '@shared/utils';- ✅ Phase 1-2: VerticalGifItem 개발 완료 (2025-10-05)

- ✅ Phase 1-3: MediaItemFactory 패턴 적용 (2025-01-05)

// ✅ After (direct import)- ✅ Phase 1-4: SolidGalleryShell 통합 완료 (2025-10-05)

import { imageFilter } from '@shared/utils/media';

```**달성 내용**:



**Task 2: Side-effect 세분화**- ✅ MediaInfo 타입은 'image' | 'video' | 'gif' 지원

```json- ✅ 비디오 전용 컴포넌트 (재생 컨트롤, 진행바, 볼륨)

// package.json- ✅ GIF 전용 컴포넌트 (Canvas 기반 재생/일시정지, 반복 제어)

{- ✅ Factory 패턴으로 타입별 자동 라우팅

  "sideEffects": [- ✅ 미디어 타입별 최적화된 UX

    "*.css",

    "src/main.ts",---

    "src/bootstrap/**/*.ts"

  ]## 4. Phase별 구현 계획

}

```### Phase 1: MEDIA-TYPE-ENHANCEMENT ✅ **100% COMPLETE**



**Task 3: Dynamic Import 검토**모든 Phase 완료. 상세 내용:

- 코드 분할 가능성 검토 (Userscript 제약 고려)[`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)

- Lazy loading 기회 파악 (Settings Modal, Keyboard Help)

- 예상: Userscript 단일 파일 제약으로 적용 제한적#### Phase 1-1: 비디오 컴포넌트 개발 ✅ COMPLETED (2025-10-05, dc651200)



**테스트**:- 13/13 tests passing

```typescript- VerticalVideoItem.solid.tsx (215 lines)

// test/architecture/advanced-tree-shaking.contract.test.ts- 번들: 472.60 KB raw, 117.34 KB gzip

describe('Phase 6: Advanced Tree-shaking', () => {

  it('[GREEN] should have barrel exports ≤10 files', () => {#### Phase 1-2: GIF 컴포넌트 개발 ✅ COMPLETED (2025-10-05, 80648630)

    const barrelFiles = findBarrelExports('src/**/*.ts');

    expect(barrelFiles.length).toBeLessThanOrEqual(10);- 24/24 tests passing (17 GIF + 7 Factory)

  });- VerticalGifItem.solid.tsx (367 lines)

- Canvas 기반 재생 제어, 반복 모드

  it('[GREEN] should have precise sideEffects configuration', () => {

    const pkg = readPackageJson();#### Phase 1-3: MediaItemFactory ✅ COMPLETED (2025-01-05)

    expect(pkg.sideEffects).toBeInstanceOf(Array);

    expect(pkg.sideEffects.length).toBeGreaterThan(0);- 7/7 tests passing

  });- 타입 기반 컴포넌트 라우팅

});

```#### Phase 1-4: SolidGalleryShell 통합 ✅ COMPLETED (2025-10-05, c19c0263, 24ad2ef0)



**예상 효과**: Raw -10 KB, Gzip -3 KB- 8/8 tests passing

- 번들: 483.37 KB raw, 120.38 KB gzip

---

---

#### Phase 7: Orphan 파일 정리

### Phase 3: TIMELINE-VIDEO-CLICK-FIX 🔄 **IN PROGRESS**

**목표**: 실제 미사용 orphan 파일만 선별 제거

#### Phase 3-1: 미디어 감지 로직 진단 및 강화 (RED)

**현황**: 37개 orphan 파일 (의존성 그래프 분석 결과)

**목표**: 타임라인 비디오 클릭 시 갤러리 열림 보장

**Task 1: Orphan 파일 분류**

**예상 작업량**: S **예상 기간**: 2-3일

**의도적 분리 모듈** (유지 필요):

```typescript**Acceptance Criteria**:

// src/assets/icons/xeg-icons.ts - Icon 정의

// src/bootstrap/*.ts - 초기화 순서 명시적 제어1. **타임라인 비디오 감지**: ✅ 타임라인에서 비디오 클릭 시

// src/features/gallery/utils/visible-navigation.ts - 독립 유틸리티   `isProcessableMedia()`가 `true` 반환

// src/shared/polyfills/solid-jsx-dev-runtime.ts - Polyfill2. **트윗 상세 페이지 호환성**: ✅ 기존 트윗 상세 페이지 동작 유지 (회귀 없음)

```3. **이벤트 차단 정밀화**: ✅ 실제 비디오 컨트롤만 차단, 비디오 영역 클릭은 허용

4. **테스트 커버리지**: ✅ 타임라인/트윗 상세 시나리오 모두 테스트

**실제 미사용 파일** (제거 후보):

```typescript**RED 단계**: 🔄 **IN PROGRESS**

// 예: src/legacy/*.ts (주석 처리된 레거시 코드)

// 예: src/experimental/*.ts (미완성 실험 기능)1. ✅ Contract 테스트 작성

```   - 테스트 파일:

     `test/shared/utils/media/timeline-video-click.contract.test.ts`

**Task 2: 제거 전 검증**   - 예상 테스트:

```pwsh     - `타임라인 비디오 컨테이너 클릭 시 isProcessableMedia 성공`

# 각 파일에 대해:     - `타임라인 비디오 영역 클릭 시 갤러리 트리거`

1. grep 검색으로 참조 확인     - `트윗 상세 페이지 비디오 클릭 정상 동작 (회귀 없음)`

2. 테스트 실행 (제거 후 GREEN 유지 확인)     - `비디오 재생 버튼 클릭 시 갤러리 차단`

3. 빌드 크기 변화 측정     - `shouldBlockGalleryTrigger 정밀 차단 (볼륨, 진행바만)`

````

2. ⏳ 테스트 실행 및 RED 확인

**Task 3: 문서화** -
`npx vitest run test/shared/utils/media/timeline-video-click.contract.test.ts`

`````markdown - 예상: 5개 중 3-4개 실패 (타임라인 감지 미구현)
<!-- docs/ARCHITECTURE.md 업데이트 -->

## Orphan Files (의도적 분리 모듈)**GREEN 단계**: ⏳ **PENDING**

- `src/assets/icons/xeg-icons.ts`: Icon 정의 중앙 관리

- `src/bootstrap/*.ts`: 초기화 순서 명시적 제어1.
  `MediaClickDetector.shouldBlockGalleryTrigger()` 수정

````- 비디오 제어 선택자 정밀화

   - 현재: `[data-testid="videoComponent"] button`,

**테스트**:     `[data-testid="videoPlayer"] button`

```typescript   - 개선:

// test/architecture/orphan-files.contract.test.ts

describe('Phase 7: Orphan Files', () => {     ```typescript

  it('[GREEN] should have orphan files ≤20 (intentional modules)', () => {     const videoControlSelectors = [

    const orphans = findOrphanFiles();       'button[aria-label*="재생"]',

    expect(orphans.length).toBeLessThanOrEqual(20);       'button[aria-label*="일시정지"]',

  });       'button[aria-label*="Play"]',

       'button[aria-label*="Pause"]',

  it('[GREEN] should document all remaining orphan files', () => {       '[role="slider"][aria-label*="진행"]', // 진행바

    const orphans = findOrphanFiles();       '[role="slider"][aria-label*="볼륨"]', // 볼륨

    const documented = getDocumentedOrphans();       'button[aria-label*="음소거"]',

    orphans.forEach(file => {       'button[aria-label*="Mute"]',

      expect(documented).toContain(file);     ];

    });     ```

  });

});2. `MediaClickDetector.isProcessableMedia()` 강화

```   - 타임라인 비디오 선택자 추가

   - 우선순위 조정: `video` 태그 직접 감지 상향

**예상 효과**: Raw -5 KB, Gzip -1 KB   - 코드 예시:



---     ```typescript

     // 타임라인 비디오 직접 감지

#### 종합 예상 효과     if (target.tagName === 'VIDEO') {

       logger.info('✅ MediaClickDetector: 비디오 요소 직접 클릭 (타임라인)');

| Phase | Raw 감축 | Gzip 감축 | 누적 Raw | 누적 Gzip |       return true;

|-------|----------|-----------|----------|-----------|     }

| 현재  | -        | -         | 495 KB   | 124 KB    |     // 비디오 컨테이너 확장

| Phase 4 | -20 KB | -5 KB   | 475 KB   | 119 KB    |     const videoSelectors = [

| Phase 5 | -10 KB | -3 KB   | 465 KB   | 116 KB    |       SELECTORS.VIDEO_PLAYER,

| Phase 6 | -10 KB | -3 KB   | 455 KB   | 113 KB    |       'video',

| Phase 7 | -5 KB  | -1 KB   | 450 KB   | 112 KB    |       '[data-testid="videoPlayer"]',

       '[data-testid="videoComponent"]',

**최종 목표**:       'div[aria-label*="동영상"]',

- ✅ Raw: 450 KB (≤473 KB 달성, 이상적 목표 420 KB 근접)       'div[role="button"]', // 타임라인 비디오 래퍼

- ✅ Gzip: 112 KB (≤118 KB 달성, 이상적 목표 105 KB 근접)     ];

     ```

---

3. 테스트 실행 및 GREEN 확인

#### 실행 계획   - 모든 테스트 통과

   - 번들 크기 변화 확인 (±0.5 KB 이내 목표)

**Phase 4 (3일)**:

1. Day 1: 미사용 export 탐지 + 제거**REFACTOR 단계**: ⏳ **PENDING**

2. Day 2: Re-export 체인 단순화

3. Day 3: Dead code 제거 + 테스트 검증1. 중복 선택자 통합

2. 로깅 메시지 정리

**Phase 5 (2일)**:3. 타입 안전성 강화 (필요 시)

1. Day 1: 서비스 팩토리 + 유틸리티 함수 annotation4. 성능 최적화 (선택자 평가 순서)

2. Day 2: 자동화 스크립트 + 테스트 검증

**검증**:

**Phase 6 (3일)**:

1. Day 1: Barrel export 최소화- `npm run typecheck` ✅

2. Day 2: Side-effect 세분화- `npm run lint:fix` ✅

3. Day 3: Dynamic import 검토 + 테스트 검증- `npm test` (전체) ✅

- `npm run build` ✅

**Phase 7 (2일)**:- 수동 테스트: 타임라인 비디오 클릭 → 갤러리 열림 ✅

1. Day 1: Orphan 파일 분류 + 제거

2. Day 2: 문서화 + 테스트 검증**예상 파일 수정**:



**총 예상**: 10일 (2주)1. `src/shared/utils/media/MediaClickDetector.ts` (수정)

2. `test/shared/utils/media/timeline-video-click.contract.test.ts` (신규)

---3. `docs/TDD_REFACTORING_PLAN.md` (업데이트)



#### 위험 관리**예상 번들 영향**: ±0.3 KB raw, ±0.1 KB gzip (미미함)



**리스크 1: 기능 회귀**---

- 완화: 각 Phase마다 전체 테스트 스위트 실행

- 완화: 15개 번들 크기 계약 테스트 자동 검증### Phase 2: AUTO-FOCUS-UPDATE (Soft Focus)

- 완화: 단계별 커밋 (롤백 용이)

#### Phase 2-1: 시각적 강조 스타일 추가 ✅ [COMPLETED]

**리스크 2: 번들 크기 목표 미달**

- 완화: Phase별 측정 가능한 목표 설정**목표**: VerticalImageItem, VerticalVideoItem에 `isVisible` prop 추가

- 완화: 효과 부족 시 다음 Phase로 즉시 이동

- 완화: 최악의 경우 옵션 B (공격적 리팩토링) 검토**완료 날짜**: 2025-01-10 **커밋**: 515acffb **브랜치**:

feat/auto-focus-soft-phase2-1

**리스크 3: 개발 시간 초과**

- 완화: Phase 우선순위 조정 (Phase 4-5 우선, 6-7 후순위)**RED 단계**: ✅ **COMPLETE** (2025-01-09)

- 완화: 각 Phase 독립 실행 가능 (부분 성공 허용)

1. Contract 테스트 작성: ✅

---   - 테스트 파일:

     `test/features/gallery/auto-focus-soft-visual.contract.test.tsx` (253

#### 참조 문서     lines)

   - 테스트 결과: **11개 중 8개 실패, 3개 통과** (예상된 RED)

- **아키텍처**: [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) (§8. 성능/메모리 - 번들 최적화)   - 실패 이유:

- **코딩 규칙**: [`docs/CODING_GUIDELINES.md`](CODING_GUIDELINES.md) (번들 최적화 가이드라인)     - `.container` 요소 null → `isVisible` prop 미구현

- **실행 가이드**: [`AGENTS.md`](../AGENTS.md) (번들 크기 검증 명령어)     - CSS `.visible` 클래스 미정의

- **백로그**: [`docs/TDD_REFACTORING_BACKLOG.md`](TDD_REFACTORING_BACKLOG.md)     - ARIA `aria-current` 로직 미구현

- **완료 로그**: [`docs/TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)   - 통과 테스트: 타입 안전성 검증 (TypeScript 레벨)

   - 커밋: d364b6a3

---

**GREEN 단계**: ✅ **COMPLETE** (2025-01-10)

## 3. 향후 Epic 후보

1. VerticalImageItem 수정: ✅

### Epic GALLERY-UX-ENHANCEMENT   - `isVisible?: boolean` prop 추가

   - CSS 클래스 바인딩: ComponentStandards.createClassName() 사용

**목표**: 갤러리 사용자 경험 개선   - ARIA 속성: `aria-current={isVisible ? 'true' : undefined}`

   - 파일: VerticalImageItem.solid.tsx (270 lines)

**우선순위**: Medium

2. VerticalVideoItem 수정: ✅

**완료 현황**:   - `isVisible?: boolean` prop 추가

- ✅ Sub-Epic 1: SCROLL-POSITION-RESTORATION (2025-10-05, 커밋: 4743bed2)   - CSS 클래스 바인딩: createMemo() 사용

- ✅ Sub-Epic 2: CONTAINER-SIZE-OPTIMIZATION (2025-10-05, 커밋: fd20abfc)   - ARIA 속성: `aria-current={isVisible ? 'true' : undefined}`

- ✅ Sub-Epic 3: TOOLBAR-HOVER-ZONE-EXPANSION (2025-10-06): 구현 검증 완료   - 파일: VerticalVideoItem.solid.tsx (229 lines)

- ⏸️ Sub-Epic 2-B: Gallery Integration (REFACTOR 단계, 별도 작업 권장)

- 🔄 Sub-Epic 4: TWITTER-NATIVE-INTEGRATION (보류 - 리스크 높음)3. Infrastructure 지원: ✅

   - BaseComponentProps: `'aria-current'?: string;` 타입 추가

**참조**: 완료된 Sub-Epic들은 [`TDD_REFACTORING_PLAN_COMPLETED.md`](TDD_REFACTORING_PLAN_COMPLETED.md)에서 확인 가능   - StandardProps: aria-current 핸들링 추가

   - 파일: BaseComponentProps.ts, StandardProps.ts

---

4. 디자인 토큰 정의: ✅

## 4. TDD 워크플로

   ```css

### RED → GREEN → REFACTOR   /* src/shared/styles/design-tokens.component.css */

   --xeg-item-visible-border: 2px solid var(--color-primary);

**RED (실패하는 테스트 작성)**:   --xeg-item-visible-shadow: 0 0 12px

- Acceptance Criteria를 테스트로 작성     oklch(from var(--color-primary) l c h / 0.3);

- 현재 구현은 반드시 FAIL   --xeg-item-visible-bg: var(--color-bg-elevated);

- 예시: `test/architecture/bundle-size-deep-optimization.contract.test.ts`   ```



**GREEN (최소 구현)**:5. CSS 스타일 추가: ✅

- 테스트를 통과시키는 최소 코드 작성

- 번들 크기 목표 달성   ```css

- 품질 게이트 통과 (typecheck, lint, test, build)   /* VerticalImageItem.module.css, VerticalVideoItem.module.css */

   .container.visible {

**REFACTOR (개선)**:     border: var(--xeg-item-visible-border);

- 코드 정리 및 최적화     box-shadow: var(--xeg-item-visible-shadow);

- 문서 업데이트     background: var(--xeg-item-visible-bg);

- 추가 테스트 보강   }
````
`````

`````

---

6. 테스트 수정: ✅

## 5. 품질 게이트 - CSS Modules 해시 문제 해결 (data-xeg-component selector 사용)

- aria-current 테스트 수정 (BaseComponentProps 타입 추가)

모든 작업은 다음 검증을 통과해야 합니다: - CSS 파일 직접 읽기 (fs.readFileSync
사용)

````pwsh**REFACTOR 단계**: ✅ **COMPLETE** (2025-01-10)

npm run typecheck         # 타입 체크

npm run lint:fix          # 린트 + 자동 수정1. 코드 품질: ✅

npm test                  # 전체 테스트   - JSDoc 문서화 완료 (특히 `isVisible` 동작)

npm run build             # dev + prod 빌드   - CSS 클래스 적용 일관성 검토 완료

```   - 접근성 검증 완료 (aria-current 적용)



**번들 크기 검증**:2. 테스트 검증: ✅

```pwsh   - **11/11 tests GREEN** (100% 통과)

# 빌드 후 크기 확인   - Coverage: isVisible prop, 디자인 토큰, ARIA, 독립성, 타입 안전성

Get-ChildItem dist -File | Select-Object Name, @{Name="SizeKB";Expression={[math]::Round($_.Length/1KB, 2)}}

**최종 결과**:

# 계약 테스트 실행

npx vitest run test/architecture/bundle-size-optimization.contract.test.ts- 파일 수정: 8개 (2 components, 2 CSS, 2 infrastructure, 1 tokens, 1 test)

```- 번들 크기: 473.34 KB raw (+0.06 KB), 117.52 KB gzip (+0.01 KB)

- 예산 준수: ✅ (473 KB raw / 118 KB gzip 이내)

---

**다음 단계**: Phase 2-2 (visibleIndex 통합) 또는 Phase 1-4 (Factory 패턴)

## 6. 참조 문서

```bash

| 문서        | 위치                                     |npm test -- auto-focus-soft-visual.contract

| ----------- | ---------------------------------------- |```

| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`       |

| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |**Acceptance Criteria**:

| 설계        | `docs/ARCHITECTURE.md`                   |

| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |- [x] Contract 테스트 작성 완료 (11 tests)

| 실행 가이드 | `AGENTS.md`                              |- [x] RED 상태 달성 (8 failed, 3 passed)

- [ ] `isVisible` prop이 모든 미디어 아이템에 추가됨
- [ ] `.visible` CSS 클래스가 디자인 토큰만 사용
- [ ] ARIA 속성 정확히 설정됨
- [ ] 타입 안전성 유지 (선택적 prop, 기본값 `false`)
- [ ] 11/11 테스트 통과
- [x] 접근성 검증 완료

**예상 번들 크기 영향**: +0.5 KB (CSS + 로직 추가) ✅ **실제**: +3.04 KB raw,
+0.43 KB gzip

---

## 5. TDD 워크플로

각 Phase별 진행:

1. **RED**: 실패 테스트 추가 (최소 명세)
   - Contract 테스트 작성
   - 예상 동작 정의
   - 실패 확인

2. **GREEN**: 최소 변경으로 통과
   - 컴포넌트/훅 구현
   - 테스트 통과 확인
   - 타입 체크

3. **REFACTOR**: 중복 제거/구조 개선
   - 디자인 토큰 적용
   - PC 전용 입력 검증
   - 접근성 개선
   - 코드 정리

4. **Document**: 완료 로그 작성
   - `TDD_REFACTORING_PLAN_COMPLETED.md`에 이관
   - 1줄 요약 + 주요 변경사항

---

## 6. 품질 게이트

각 Phase 완료 후:

```pwsh
# 1. 타입 체크
npm run typecheck

# 2. 린트 + 자동 수정
npm run lint:fix

# 3. 포맷팅
npm run format

# 4. 전체 테스트
npm test

# 5. 특정 Phase 테스트
npm test -- vertical-video-item.contract
npm test -- auto-focus-soft.contract

# 6. 빌드 검증
npm run build:dev
npm run build:prod

# 7. 종합 검증
npm run validate
`````

**필수 통과 기준**:

- ✅ 타입 오류 0
- ✅ 린트 오류 0
- ✅ 해당 Phase 테스트 GREEN
- ✅ 회귀 테스트 GREEN (기존 기능 유지)
- ✅ 빌드 성공 (소스맵 포함)
- ✅ 번들 크기 상한선 준수 (473 KB raw, 118 KB gzip)

---

## 7. 리스크 관리

### MEDIA-TYPE-ENHANCEMENT 리스크

| 리스크                      | 완화 방안                              |
| --------------------------- | -------------------------------------- |
| 비디오 재생 브라우저 호환성 | VideoControlService 활용, 폴백 UI 제공 |
| 비디오 로딩 성능            | Lazy loading, 프리로드 전략 최적화     |
| 테스트 환경 제약 (JSDOM)    | Mock video 요소, 재생 상태만 검증      |
| 번들 크기 증가              | Code splitting 검토, 조건부 import     |

### AUTO-FOCUS-UPDATE 리스크

| 리스크                      | 완화 방안                          |
| --------------------------- | ---------------------------------- |
| UX 혼란 (시각적 구분)       | 명확한 디자인 토큰, 사용자 테스트  |
| IntersectionObserver 미지원 | 기존 폴백(rect 기반) 활용          |
| 성능 오버헤드               | rAF 코얼레싱, 디바운스 적용        |
| 접근성 문제                 | ARIA live region, 키보드 지원 강화 |

---

## 8. 롤백 계획

각 Phase는 독립적으로 롤백 가능:

**Phase 1 롤백**:

```typescript
// MediaItemFactory를 제거하고 기존 방식으로 복원
const renderItems = createMemo(() =>
  mediaItems().map((media, index) => (
    <SolidVerticalImageItem {...props} />
  ))
);
```

**Phase 2 롤백**:

```typescript
// isVisible prop 제거, visibleIndex 통합 제거
// 기존 useVisibleIndex는 인디케이터 전용으로 유지
```

---

## 9. 완료 기준

### MEDIA-TYPE-ENHANCEMENT 완료

- [ ] VerticalVideoItem 컴포넌트 구현 및 테스트 GREEN
- [ ] MediaItemFactory 패턴 적용
- [ ] SolidGalleryShell 통합 완료
- [ ] 비디오 재생 컨트롤 동작 검증
- [ ] 접근성 검증 통과
- [ ] 디자인 토큰 준수
- [ ] PC 전용 입력 검증
- [ ] 회귀 테스트 GREEN
- [ ] 번들 크기 상한선 준수
- [ ] 문서 업데이트 (ARCHITECTURE.md, CODING_GUIDELINES.md)

### AUTO-FOCUS-UPDATE 완료

- [ ] isVisible prop 및 시각적 스타일 적용
- [ ] visibleIndex 기반 힌트 동작 검증
- [ ] 자동 스크롤 미발생 검증
- [ ] currentIndex/visibleIndex 독립성 검증
- [ ] 접근성 검증 (ARIA, 스크린 리더)
- [ ] 디자인 토큰 준수
- [ ] 회귀 테스트 GREEN
- [ ] 사용자 테스트 통과 (내부)
- [ ] 문서 업데이트

최근 완료된 Epic들은 모두 `docs/TDD_REFACTORING_PLAN_COMPLETED.md`로
이관되었습니다.

**주요 Epic (2025-01-09 ~ 2025-10-04)**:

- **FFLATE-DEPRECATED-API-REMOVAL** (2025-10-04): deprecated fflate API 완전
  제거 ✅
  - Breaking Change: `getFflate()` API 제거
  - Phase 1-3 완료, 16/16 contract tests PASS
  - 15 files changed (1 deleted, 14 modified)
- **TEST-FAILURE-ALIGNMENT-PHASE2** (2025-01-09): 29/29 tests GREEN ✅
  - Signal Native pattern, Toolbar CSS, Settings/Language, Integration 테스트
    정렬
- **TEST-FAILURE-FIX-REMAINING** (2025-10-04): 테스트 실패 38→29개 개선 ✅
  - Bundle budget, Tooltip 타임아웃, Hardcoded values, LanguageService 싱글톤
- **CODEQL-STANDARD-QUERY-PACKS** (2025-10-04): 부분 완료 ⚠️
  - 로컬/CI CodeQL 권한 제약으로 Backlog HOLD 상태

**이전 Epic (2025-01-04 ~ 2025-01-08)**:

- CUSTOM-TOOLTIP-COMPONENT, UI-TEXT-ICON-OPTIMIZATION, JSX-PRAGMA-CLEANUP,
  GALLERY-NAV-ENHANCEMENT, SOLIDJS-REACTIVE-ROOT-CONTEXT 등

전체 상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

---

---

## 4. TDD 워크플로

1. **RED**: 실패 테스트 추가 (최소 명세)
2. **GREEN**: 최소 변경으로 통과
3. **REFACTOR**: 중복 제거/구조 개선
4. **Rename**: `.red.` 파일명 제거 → 가드 전환
5. **Document**: Completed 로그에 1줄 요약

**품질 게이트**:

- ✅ `npm run typecheck` (strict 오류 0)
- ✅ `npm run lint:fix` (자동 수정 적용)
- ✅ `npm test` (해당 Phase GREEN)
- ✅ `npm run build:dev` (산출물 검증 통과)

---

## 5. 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |

---

## 10. 추가 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그      | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |
| 벤더 API    | `docs/vendors-safe-api.md`               |

---

## 11. 다음 단계

1. **Phase 1-1 시작**: VerticalVideoItem RED 테스트 작성
2. **디자인 리뷰**: 비디오 컨트롤 UI 디자인 확정
3. **접근성 검토**: WCAG 2.1 Level AA 준수 계획
4. **성능 프로파일링**: 비디오 렌더링 성능 기준 설정

---

**업데이트 이력**:

- 2025-10-05: Epic MEDIA-TYPE-ENHANCEMENT & AUTO-FOCUS-UPDATE 계획 수립
- 솔루션 분석 및 최적 옵션 선정 완료 (비교 매트릭스 기반)
- Phase별 구현 계획 및 Acceptance Criteria 정의 완료
- 리스크 관리, 롤백 계획, 품질 게이트 명시
