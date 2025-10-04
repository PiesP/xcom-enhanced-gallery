# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-09 — Epic TEST-FAILURE-ALIGNMENT-PHASE2 완료 (29/29
tests GREEN)

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

### Epic CODEQL-STANDARD-QUERY-PACKS (시작: 2025-10-04)

**목적**: CodeQL 표준 보안 쿼리 팩으로 전환하여 실제 보안 분석 활성화

**현재 문제**:

- ❌ 테스트 쿼리만 실행 중 (`javascript/example/hello-world` - 949건)
- ❌ 실제 보안/품질 쿼리 누락 (`codeql/javascript-security-and-quality` 미실행)
- ✅ 프로젝트 정책 가드는 이미 Vitest로 커버 (console, Touch/Pointer, 디자인
  토큰, 벤더 접근)

**솔루션 선택**: 옵션 A (표준 CodeQL 쿼리 팩)

- 이유: 검증된 400+ 규칙, 낮은 유지보수, CI 통합 간편, 역할 분리 (Vitest=정책,
  CodeQL=보안)
- 대안 비교: 옵션 B (커스텀 쿼리 작성, 난이도 H, 높은 유지보수 부담), 옵션 C
  (혼합 접근, 복잡도 증가)

**Acceptance Criteria**:

- ✅ `codeql/javascript-security-and-quality` 쿼리 팩 실행
- ✅ SARIF 결과에 XSS/SQL Injection/Path Traversal 등 실제 보안 규칙 포함
- ✅ CI 파이프라인 GREEN 유지 (보안 취약점 0건 또는 false positive 억제)
- ✅ `codeql-results.sarif` 파일 크기 >100 KB (실제 분석 수행 확인)
- ✅ `codeql-improvement-plan.md`에 의미 있는 보안 권고 생성

**Phase 구성**:

- **Phase 1 (RED)**: 표준 쿼리 팩 미실행 감지 테스트 작성
- **Phase 2 (GREEN)**: `example.ql` 제거, 표준 팩 적용, CI 통과
- **Phase 3 (REFACTOR)**: 문서 업데이트, false positive 억제 규칙 추가

**예상 영향**:

- CI 시간: +3-5분 (CodeQL 분석 시간 증가)
- 보안 커버리지: 0 → 400+ 규칙
- 유지보수: 자동 업데이트 (GitHub Security Lab 관리)

---

#### Phase 1: RED (실패하는 테스트 작성)

**목표**: 현재 CodeQL이 표준 보안 쿼리를 실행하지 않음을 증명하는 테스트 작성

**Task 1.1**: SARIF 결과 검증 테스트 작성

- 파일: `test/architecture/codeql-standard-packs.contract.test.ts` (신규)
- 내용:
  - `codeql-results.sarif` 파일 존재 확인
  - SARIF에서 `javascript/example/hello-world` 제외한 실제 보안 규칙 ID 존재
    확인
  - 예: `js/xss`, `js/sql-injection`, `js/path-injection` 등
  - 파일 크기 >100 KB (최소 실제 분석 수행 확인)
- 예상 결과: ❌ FAIL (현재 테스트 쿼리만 존재)

**Task 1.2**: 개선 계획 검증 테스트 작성

- 파일: `test/architecture/codeql-standard-packs.contract.test.ts` (동일 파일)
- 내용:
  - `codeql-improvement-plan.md`에 "Hello, world!" 메시지만 있는지 확인
  - 실제 보안 권고 항목 (ruleId에 `js/`로 시작하는 보안 규칙) 부재 확인
- 예상 결과: ❌ FAIL (현재 의미 없는 테스트 결과만 포함)

**Task 1.3**: CI 워크플로 검증

- 파일: `.github/workflows/security.yml` 검증 로직 추가 (선택적)
- 내용: CodeQL 스캔 후 SARIF 파일에 실제 보안 규칙이 포함되었는지 확인
- 예상 결과: ❌ FAIL (현재 테스트 쿼리만 실행)

**Acceptance (Phase 1)**:

- [x] `test/architecture/codeql-standard-packs.contract.test.ts` 작성 완료
- [x] `npm test -- codeql-standard-packs` 실행 시 RED (3/7 tests FAIL, 4 PASS)
- [x] 실패 메시지가 명확히 현재 문제 설명 ("표준 보안 쿼리 미실행")

**Phase 1 완료 상태** (2025-10-04):

- ✅ 계약 테스트 작성 완료 (7 tests)
- ✅ RED 확인: 3 tests FAIL
  - FAIL 1: SARIF에 js/ 보안 규칙 0개 (테스트 쿼리만 1개)
  - FAIL 2: 테스트 쿼리(javascript/example/hello-world)만 존재
  - FAIL 3: 개선 계획에 "Hello, world!" 949회, js/ 규칙 0회
- ✅ PASS 확인: 4 tests (파일 존재, 크기, 기본 구조)
- ✅ 명확한 실패 메시지: 해결 방법 3단계 제시

**다음 단계**: Phase 2 (GREEN) 진행

- Task 2.1: `codeql-custom-queries-javascript/example.ql` 삭제
- Task 2.2: `npm run codeql:scan` 재실행
- Task 2.3: 테스트 GREEN 확인 (7/7 PASS)

---

#### Phase 2: GREEN (최소 구현으로 통과)

**목표**: 표준 CodeQL 쿼리 팩 적용하여 테스트 GREEN

**Task 2.1**: 커스텀 쿼리 팩 제거

- 파일: `codeql-custom-queries-javascript/example.ql` 삭제
- 파일: `codeql-custom-queries-javascript/codeql-pack.yml` 수정
  - 현재: `library: false`, `warnOnImplicitThis: false`,
    `name: getting-started/codeql-extra-queries-javascript`
  - 수정 후: 의존성만 유지 (`codeql/javascript-all: ^2.6.11`), 쿼리 파일 제거로
    표준 팩 사용 강제

**Task 2.2**: 스크립트 검증

- 파일: `scripts/run-codeql.mjs` 검토
- 확인 사항:
  - `DEFAULT_QUERY_PACKS = ['codeql/javascript-security-and-quality']` (Line
    55-58)
  - `customQueryPackPath` 존재 시 추가 (Line 597-599)
  - Fallback: `FALLBACK_QUERY_PACKS = ['codeql/javascript-queries']` (Line
    59-60)
- 조치: 커스텀 팩 제거로 표준 팩 자동 사용 (변경 불필요)

**Task 2.3**: 로컬 CodeQL 스캔 실행

- 명령어: `npm run codeql:scan`
- 예상 결과:
  - `codeql-results.sarif` 생성 (>100 KB)
  - `codeql-improvement-plan.md`에 실제 보안 규칙 포함 (예:
    `js/unused-local-variable`, `js/useless-assignment`)
  - "Hello, world!" 메시지 제거

**Task 2.4**: 테스트 실행

- 명령어: `npm test -- codeql-standard-packs`
- 예상 결과: ✅ GREEN (2/2 tests PASS)

**Task 2.5**: CI 검증

- GitHub Actions에서 `security.yml` 워크플로 실행
- 예상 결과: ✅ CodeQL 분석 완료, SARIF 업로드 성공, false positive 없음

**Acceptance (Phase 2)**:

- [ ] `example.ql` 제거 완료
- [ ] `npm run codeql:scan` 실행 시 표준 쿼리 팩 사용 확인
- [ ] `test/architecture/codeql-standard-packs.contract.test.ts` GREEN (2/2
      PASS)
- [ ] CI 워크플로 GREEN (보안 취약점 0건 또는 억제 규칙 적용)

---

#### Phase 3: REFACTOR (개선 및 문서화)

**목표**: 코드 품질, 문서, CI 최적화

**Task 3.1**: False Positive 억제 규칙 추가 (필요 시)

- 파일: `.github/codeql/codeql-config.yml` (신규, 선택적)
- 내용: 프로젝트 특성상 false positive로 판단되는 규칙 억제
  - 예: Userscript 환경에서 `GM_*` 글로벌 사용은 안전함
  - 예: 번들 크기 제한으로 일부 안전하지 않은 패턴 허용 (명시적 주석)
- 조건: Phase 2에서 false positive 발견 시에만 적용

**Task 3.2**: 문서 업데이트

- 파일: `AGENTS.md` - CodeQL 섹션 업데이트
  - 표준 쿼리 팩 사용 명시
  - 로컬 스캔 명령어 예시 추가
- 파일: `docs/ARCHITECTURE.md` - 보안 섹션 추가 (선택적)
  - CodeQL 역할: 보안 취약점 감지
  - Vitest 역할: 프로젝트 정책 강제 (PC 전용, 디자인 토큰 등)
- 파일: `.github/copilot-instructions.md` - CodeQL 섹션 업데이트
  - 표준 쿼리 팩 기본 사용 명시

**Task 3.3**: CI 최적화

- 파일: `.github/workflows/security.yml` 검토
- 최적화 옵션:
  - CodeQL 스캔을 별도 job으로 분리하여 병렬 실행 (이미 분리됨 ✅)
  - 캐싱: CodeQL CLI 다운로드 캐시 (선택적)
  - 타임아웃: 현재 25분 → 필요 시 조정

**Task 3.4**: 스크립트 개선

- 파일: `scripts/run-codeql.mjs` 검토
- 개선 항목:
  - 표준 쿼리 팩 다운로드 실패 시 더 명확한 에러 메시지
  - Fallback 로직 로그 개선 (Line 724-733)
- 조건: Phase 2에서 문제 발견 시에만 적용

**Acceptance (Phase 3)**:

- [ ] False positive 억제 규칙 추가 (필요 시)
- [ ] `AGENTS.md`, `ARCHITECTURE.md`, `copilot-instructions.md` 문서 업데이트
- [ ] CI 최적화 검토 완료
- [ ] 스크립트 개선 검토 완료
- [ ] 전체 테스트 GREEN 유지 (`npm test`)
- [ ] CI 파이프라인 GREEN 유지

---

#### 완료 조건 (Epic 종료)

- [x] Phase 1: RED 테스트 작성 완료 (2025-10-04)
- [ ] Phase 2: 표준 쿼리 팩 적용, 테스트 GREEN
- [ ] Phase 3: 문서/CI 최적화 완료
- [ ] 전체 Acceptance Criteria 충족
- [ ] `docs/TDD_REFACTORING_PLAN_COMPLETED.md`에 Epic 요약 이관

---

## 3. 최근 완료 Epic

### Epic TEST-FAILURE-ALIGNMENT-PHASE2 (완료: 2025-01-09)

**목적**: 프로젝트 최신 개발 방향에 맞춰 남은 29개 실패 테스트 정리 및 개선

**결과**: ✅ Phase 1-5 완료, 전체 29/29 tests GREEN (1 skipped)

**성과**:

- Phase 1: Signal Native pattern initialization (8 tests)
- Phase 2: Toolbar hover CSS regex (2 tests)
- Phase 3: Settings/Language defaults (6 tests, 1 skipped)
- Phase 4: Integration/User Interactions (10 tests, 자동 해결)
- Phase 5: Userscript/Bootstrap (3 tests)

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-09 섹션 참조)

---

### Epic TEST-FAILURE-FIX-REMAINING (완료: 2025-10-04)

**목적**: 남은 테스트 실패 수정으로 CI 안정성 향상

**결과**: ✅ Phase 1-4 완료, 테스트 실패 38→29개 개선, LanguageService 싱글톤
전환

**성과**:

- Phase 1: Bundle budget 메트릭 업데이트 (484,020 bytes)
- Phase 2: Tooltip 타임아웃 수정 (99.2% 성능 개선)
- Phase 3: Hardcoded values 제거, 디자인 토큰 완전 준수
- Phase 4: LanguageService 싱글톤 전환 (-9개 테스트 실패)

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-04 섹션 참조)

---

**목적**: 프로젝트 최신 개발 방향에 맞춰 실패하는 테스트 정렬 및 개선

**결과**: Phase 1-3 부분 완료 - 구현되지 않은 기능의 RED Phase 테스트 제거 및
CSS 예산 조정

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-10-04 섹션 참조)

---

### 이전 완료 Epic (요약)

전체 히스토리는 `docs/TDD_REFACTORING_PLAN_COMPLETED.md` 참조:

- SOLIDJS-REACTIVE-ROOT-CONTEXT (2025-01-XX): 메모리 누수 방지 ✅
- CUSTOM-TOOLTIP-COMPONENT (2025-01-08): 키보드 단축키 툴팁 구현 ✅
- UI-TEXT-ICON-OPTIMIZATION (2025-01-08): 다국어 지원 + 접근성 개선 ✅
- JSX-PRAGMA-CLEANUP (2025-01-04): esbuild 경고 제거 ✅
- GALLERY-NAV-ENHANCEMENT (2025-01-04): 네비게이션 버튼 구현 ✅

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-04 섹션 참조)

---

## 4. 다음 사이클 준비

새로운 Epic을 시작하려면:

1. `docs/TDD_REFACTORING_BACKLOG.md`에서 후보 검토
2. 우선순위/가치/난이도 고려하여 1-3개 선택
3. 본 문서 "활성 Epic 현황" 섹션에 추가
4. Phase 1 (RED) 테스트부터 시작

---

## 5. TDD 워크플로

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
