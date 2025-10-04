# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-04 — Epic CODEQL-LOCAL-ENHANCEMENT 완료

---

## 1. 운영 원칙

- 코딩/스타일/입력/벤더 접근/테스트 규칙: `docs/CODING_GUIDELINES.md`,
  `docs/vendors-safe-api.md`
- 실행/CI/빌드 파이프라인: `AGENTS.md`
- 아키텍처 설계: `docs/ARCHITECTURE.md`
- 본 문서: 활성 Epic/작업과 Acceptance 중심
- **Epic 분할 원칙**: 복잡한 Epic은 독립적이고 작은 Sub-Epic으로 분할하여 단계적
  진행

---

## 2. 활성 Epic 현황

### Epic CODEQL-SECURITY-HARDENING (신규 승격)

**목적**: CodeQL 분석에서 발견된 보안 취약점 (URL Sanitization, Prototype
Pollution) 수정

**선정 이유**:

- CodeQL 경고 5건 (모두 WARNING 수준)
- 보안 취약점 2가지 (URL 위조 공격, Prototype Pollution)
- 최소 변경으로 해결 가능 (난이도 S)
- 번들 영향 최소 (+150 bytes raw, +75 bytes gzip)

**접근 방향**:

- URL 검증: 기존 `isTrustedTwitterMediaHostname()` 활용 강화
- Prototype Pollution: `sanitizeSettingsTree()` 가드 강화 (재귀 깊이 제한)
- TDD: RED (엣지 케이스 테스트) → GREEN (최소 수정) → REFACTOR

---

#### Phase 1: RED — 보안 테스트 작성 (엣지 케이스)

**작업 내용**:

1. **URL Sanitization 테스트**
   (`test/unit/shared/utils/media-url-security.red.test.ts`)
   - 악의적 URL 패턴 검증 (`evil.com/twimg.com`, `twimg.com.evil.com`)
   - 정상 Twitter 미디어 URL 통과 (`https://pbs.twimg.com/media/xxx`)
   - 기존 `isTrustedTwitterMediaHostname()` 동작 유지 검증
2. **Prototype Pollution 테스트**
   (`test/unit/features/settings/settings-security.red.test.ts`)
   - `__proto__` 주입 시도 차단
   - `constructor` 조작 시도 차단
   - 재귀 깊이 제한 (MAX_DEPTH=10) 검증
   - 정상 설정 객체 통과

**Acceptance**:

- 7~9개 테스트 실패 (RED)
- 타입 체크 통과
- 기존 테스트 GREEN 유지

---

#### Phase 2: GREEN — 최소 수정으로 통과

**작업 내용**:

1. **URL 검증 강화** (`src/shared/utils/media/media-url.util.ts`)
   - L159, L163: `.includes('twimg.com')` 제거 (중복 검사)
   - `isTrustedTwitterMediaHostname()` 호출만 유지
2. **Prototype Pollution 가드 강화**
   (`src/features/settings/services/SettingsService.ts`)
   - `sanitizeSettingsTree()`: 재귀 깊이 제한 추가 (MAX_DEPTH=10)
   - `UNSAFE_SETTING_KEY_SEGMENTS` 재검증 로직 추가
   - 위험 키 스킵 처리

**파일 변경**:

- 수정: 2 files (`media-url.util.ts`, `SettingsService.ts`)
- 테스트: 2 files (신규 추가)

**Acceptance**:

- 모든 테스트 GREEN (7~9개 신규 + 기존 2646개)
- 타입 체크 통과
- 린트 오류 0

---

#### Phase 3: REFACTOR — CodeQL 재검증 및 문서화

**작업 내용**:

1. **CodeQL 재스캔**: `npm run codeql:scan`
   - 5건 경고 → 0건 목표
   - SARIF 결과 비교 (before/after)
2. **테스트 파일명 정규화**: `.red.` 제거
3. **문서 업데이트**:
   - `docs/CODING_GUIDELINES.md`: URL 검증 가이드 추가
   - `docs/ARCHITECTURE.md`: 보안 계약 섹션 갱신
   - `codeql-improvement-plan.md`: 완료 체크

**Acceptance**:

- CodeQL 경고 0건
- 전체 테스트 GREEN
- 빌드 산출물 검증 통과
- 문서 정합성 확인

---

#### 예상 영향

| 항목        | 변경 전 | 변경 후   | 증감      |
| ----------- | ------- | --------- | --------- |
| 번들 크기   | ~120 KB | ~120 KB   | +0.01%    |
| 테스트 수   | 2646    | 2653~2655 | +7~9      |
| CodeQL 경고 | 5       | 0         | -5 (100%) |
| 보안 등급   | B+      | A         | 개선      |

**리스크**:

- 낮음: 기존 패턴 유지, 테스트로 회귀 방지
- URL 검증 로직 단순화로 오히려 안정성 향상

---

#### 일정

- **Phase 1 (RED)**: 1일 (테스트 작성)
- **Phase 2 (GREEN)**: 1일 (최소 수정)
- **Phase 3 (REFACTOR)**: 1일 (CodeQL 재검증, 문서화)
- **총 소요**: 3일

---

---

**현재 테스트 상태** (2025-10-04):

- Test Files: 423 passed | 18 skipped (441)
- Tests: 2646 passed | 107 skipped | 1 todo (2754)
- 모든 테스트 GREEN ✅

---

## 3. 최근 완료 Epic (요약)

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
