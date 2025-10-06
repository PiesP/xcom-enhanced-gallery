# TDD 리팩토링 활성 계획 (2025-10-06 최종 갱신)

> 목표: 충돌/중복/분산·레거시 코드를 줄이고, 아키텍처·토큰·입력 정책 위반을
> 테스트로 고정하며, UI/UX 일관성과 안정성을 높인다. 모든 변경은 실패 테스트 →
> 최소 구현 → 리팩토링 순으로 진행한다.

- 근거 문서: `docs/ARCHITECTURE.md`, `docs/CODING_GUIDELINES.md`,
  `docs/DEPENDENCY-GOVERNANCE.md`
- 환경: Vitest + JSDOM, 기본 URL `https://x.com`, vendors/userscript는
  getter/adapter로 모킹
- 공통 원칙: 최소 diff, 3계층 단방향(Features → Shared → External), PC 전용
  입력, CSS Modules + 디자인 토큰만

---

## 📊 현재 상태 점검 (2025-10-06)

### 품질 게이트 상태

- ✅ typecheck: PASS (TypeScript strict 모드)
- ✅ lint: PASS (ESLint 0 warnings)
- ✅ test: 2984 passed, 110 skipped, 19 failed (기존 프로젝트 이슈)
- ✅ build: PASS (dev + prod 빌드 정상)
- ✅ postbuild validator: PASS

### 번들 현황

- **Raw**: 502.45 KB (목표: 496 KB, **6.45 KB 초과** ⚠️)
- **Gzip**: 125.49 KB (목표: 125 KB, **0.49 KB 초과** ⚠️)
- **의존성**: 2개 (preact, @preact/signals)

### 아키텍처 준수

- ✅ Vendors: `StaticVendorManager` 경유 정책 준수
- ✅ Userscript: adapter 패턴 적용 (`getUserscript()`)
- ✅ 3계층: Features → Shared → External 단방향 의존성
- ✅ PC 전용 입력: Touch/Pointer 이벤트 미사용
- ✅ 디자인 토큰: CSS Modules + `--xeg-*` 토큰만 사용

---

## 🎯 완료된 주요 작업 (2025년)

### ~~Epic: FFLATE-REMOVAL~~ ✅ (2025-10-06)

**목표**: fflate 외부 의존성 제거 및 Store-only ZIP 자체 구현

**최종 결과**:

- ✅ 의존성: 3개 → 2개 (fflate 제거 완료)
- ✅ 번들 크기: 502.28 KB raw, 125.44 KB gzip (안정적 유지)
- ✅ 테스트: 2978 passed (모두 GREEN)
- ✅ 구현 라인: +869 줄 (순증가)

**상세 내역**: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조

### ~~Feature: X.com Lazy Loading Trigger~~ ✅ (2025-10-06)

**목표**: 갤러리 닫을 때 X.com lazy loading 자동 트리거

**구현 내용**:

- `bodyScrollManager.restoreBodyState()` 개선
- `setTimeout(100ms)` + `scrollBy(0, ±1)` + `dispatchEvent('scroll'/'resize')`
  패턴
- 환경 가드 추가 (`typeof window === 'undefined'`)

**최종 결과**:

- ✅ 테스트: 6/6 passed (TDD RED → GREEN 완료)
- ✅ 기존 테스트 회귀: 0건
- ✅ Uncaught Exception: 4개 → 0개 (환경 가드로 해결)
- ✅ 빌드: dev + prod 정상

**구현 파일**:

- `src/shared/utils/scroll/body-scroll-manager.ts` (191 줄)
- `test/unit/utils/scroll/body-scroll-lazy-loading-trigger.test.ts` (210 줄, 6
  tests)

---

## 📋 활성 작업 (2025-10-06 현재)

### 상태: 모든 계획된 작업 완료 ✅

현재 TDD_REFACTORING_PLAN에 등록된 활성 작업이 없습니다.

#### 향후 권장 작업 (별도 Epic 필요)

1. **번들 크기 최적화** (Epic: BUNDLE-SIZE-REDUCTION)
   - 현재: Raw 502.45 KB, Gzip 125.49 KB
   - 목표: Raw 496 KB, Gzip 125 KB (단기), Raw 420 KB, Gzip 105 KB (장기)
   - 전략: Tree-shaking 강화, 코드 중복 제거, Pure 함수 annotate

2. **CodeQL 로컬 실행** (선택적 보안 검증)
   - 현재: 11개 테스트 실패 (SARIF 파일 미생성)
   - 해결: `npm run codeql:scan` 실행 후 commit

---

## 품질 게이트 (작업 전후 필수 확인)

## 참고/정책 고지

---

## 부록 — SOURCE PATH RENAME / CLEANUP PLAN (정리됨)

> 목적: 레거시/혼동 가능 경로를 식별하고, 안전한 단계별 리네임/정리를 통해

- 근거/제약: 3계층 단방향(Features → Shared → External), vendors/userscript
  getter 규칙, PC-only, CSS Tokens, 테스트 우선(TDD)

### 스코프(1차)

- (해결) B/C/F 항목은 TEST-ONLY/LEGACY 표면 유지 정책으로 확정되었습니다. 활성
  계획에서는 제외되었으며, 완료 로그에서 가드/수용 기준과 함께 추적합니다.

### 후보와 제안

- 해당 없음(완료 로그 참조). 필요 시 후속 스캔/가드 강화만 수행.

### 단계별 실행 순서(요약 현행화)

- 현재 없음 — 신규 관찰 대상이 생기면 추가.

### 리스크/롤백

- 리스크: 테스트 경로 의존(특히 vendor-manager.ts) 및 스캔 규칙 민감도
- 롤백: re-export 유지, 배럴 되돌림, 문서/테스트만 수정으로 복구 가능

### 수용 기준(전역)

- deps-cruiser 순환/금지 위반 0
- src/\*\*에서 TEST-ONLY/LEGACY 대상의 런타임 import 0
- 번들 문자열 가드 PASS(VendorManager 등 금지 키워드 0)
- 전체 테스트/빌드/포스트빌드 GREEN
