# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-05 — Epic BUNDLE-SIZE-OPTIMIZATION 활성화

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

### 🎯 Epic THEME-ICON-UNIFY-002 Phase B/C - 아이콘 통합 완료 (디자인 일관성 + 성능/접근성)

**활성화 날짜**: 2025-10-05

#### 목표

Epic UI-TEXT-ICON-OPTIMIZATION 완료 후 남은 아이콘 개선 작업(Phase B/C) 완료:

- **Phase B**: 아이콘 디자인 일관성 검증 (viewBox 표준화, path 속성, 시각적
  균형)
- **Phase C**: 성능 및 접근성 검증 (테마 전환 성능, WCAG AA 대비율, 고대비 모드)

#### 배경

- Epic UI-TEXT-ICON-OPTIMIZATION에서 Phase A(아이콘 통합 기반) 완료 (2025-01-08)
- Phase B/C는 26개 .red 테스트로 분리되어 백로그에 대기 중
- 현재 프로젝트 상태: 테스트 안정(2679 통과), 번들 안정(471.67 KB), 보안 강화
  완료
- 타이밍: 보안/번들 최적화 후 사용자 경험 개선 단계 진입

#### Acceptance Criteria

**Phase 1 (RED)** — 이미 완료 ✅:

- ✅ 26개 .red 테스트 작성 완료
  - Phase B: 아이콘 디자인 일관성 (9개 테스트)
  - Phase C: 성능 및 접근성 (17개 테스트)

**Phase 2 (GREEN)**:

- [ ] **디자인 일관성 구현**:
  - [ ] 모든 아이콘 24x24 viewBox 표준화
  - [ ] Path 속성 일관성 (fill: currentColor)
  - [ ] ChevronLeft/Right 대칭성 보장
  - [ ] 디자인 토큰 통합 (stroke-width, color)
- [ ] **성능 개선**:
  - [ ] 테마 전환 시 CSS 변수 업데이트 <50ms
  - [ ] 아이콘 색상 CSS 변수 제어 확인
- [ ] **접근성 강화**:
  - [ ] WCAG AA 대비율 3:1 이상 (라이트/다크/고대비 모드)
  - [ ] 고대비 모드 지원 (forced-colors 미디어 쿼리 + System Color 폴백)
  - [ ] 아이콘 ARIA 속성 적절히 설정
- [ ] **품질 게이트**:
  - [ ] 26/26 tests GREEN
  - [ ] 번들 크기 회귀 없음 (≤473 KB raw, ≤118 KB gzip)
  - [ ] typecheck/lint/format 통과
  - [ ] 전체 테스트 통과 (2679+ tests)

**Phase 3 (REFACTOR)**:

- [ ] `.red` 파일명 제거 → 일반 테스트로 전환
- [ ] 문서 업데이트 (ARCHITECTURE.md, CODING_GUIDELINES.md)
- [ ] TDD_REFACTORING_PLAN_COMPLETED.md로 이관
- [ ] 백로그에서 제거

#### 솔루션 비교 분석

**Option A: JSDOM 환경에서 구조적 검증** (선택됨 ✅):

- 장점:
  - 기존 테스트 환경 활용 (JSDOM)
  - CSS 변수 존재 여부, 구조 검증 가능
  - CI에서 자동 실행 가능
- 단점:
  - 실제 렌더링/성능 측정 제한적
  - getComputedStyle 완전하지 않음
- 완화 전략:
  - 구조적 검증에 집중 (CSS 변수 정의, 토큰 사용 확인)
  - 실제 성능은 수동 테스트로 보완

**Option B: Playwright E2E 테스트 추가** (보류):

- 장점: 실제 브라우저 렌더링, 정확한 성능 측정
- 단점: 설정 복잡도, CI 시간 증가
- 결론: Phase 2 완료 후 필요 시 검토

**Option C: 수동 테스트 가이드만 작성** (보류):

- 장점: 구현 간단
- 단점: 회귀 방지 약함, 자동화 없음
- 결론: 자동화 우선, 수동 가이드는 보조

#### 구현 계획

**Phase 2 (GREEN)** — 예상 기간: 2-3일:

**Task 1**: 디자인 일관성 구현 (Phase B) — 0.5-1일

- 아이콘 정의 검증 (viewBox, fill 속성)
- ChevronLeft/Right 대칭성 확인
- 디자인 토큰 통합 검증

**Task 2**: 성능 개선 (Phase C-1) — 0.5일

- CSS 변수 기반 테마 전환 구조 검증
- JSDOM 환경 제약 완화 전략 적용

**Task 3**: 접근성 강화 (Phase C-2) — 1-1.5일

- WCAG AA 대비율 계산 로직 구현
- 고대비 모드 CSS 추가 (forced-colors 미디어 쿼리)
- ARIA 속성 검증

**Task 4**: 품질 게이트 — 0.5일

- 26/26 tests GREEN 확인
- 번들 크기 회귀 테스트
- 전체 테스트 통과 검증

**Phase 3 (REFACTOR)** — 예상 기간: 0.5일:

- `.red` 제거, 문서 업데이트, Epic 이관

#### 위험 요소 및 완화

**위험 1**: JSDOM 환경 제약 (CSS 변수, getComputedStyle 불완전)

- **완화**: 구조적 검증에 집중, 실제 성능은 수동 테스트로 보완
- **대안**: Playwright E2E (Phase 2 완료 후 검토)

**위험 2**: 대비율 계산 복잡도 (색상 변환 로직)

- **완화**: 기존 라이브러리 활용 또는 간소화된 계산식 사용
- **검증**: 대표 색상 샘플로 테스트

**위험 3**: 고대비 모드 테스트 어려움 (브라우저 전용 기능)

- **완화**: CSS 구조 검증으로 대체, 수동 테스트 가이드 작성
- **문서화**: CODING_GUIDELINES.md에 고대비 모드 정책 추가

#### 성공 지표

- ✅ 26/26 tests GREEN
- ✅ 번들 크기 회귀 없음 (≤473 KB raw, ≤118 KB gzip)
- ✅ WCAG 2.1 Level AA 준수 (대비율 3:1 이상)
- ✅ 모든 아이콘 디자인 일관성 확보 (24x24 viewBox, currentColor)
- ✅ 전체 테스트 통과 (2679+ tests)

---

---

**최근 완료**:

- 2025-10-05: **Epic BUNDLE-SIZE-OPTIMIZATION** ✅
  - 번들 크기 최적화 및 회귀 방지 (Phase 1-3 완료)
  - 15개 계약 테스트 GREEN (473 KB raw, 118 KB gzip 상한선)
  - 빌드 최적화: sideEffects, Terser 강화, treeshake 강화
  - 문서화: 3개 파일 업데이트 (ARCHITECTURE, CODING_GUIDELINES, AGENTS)
  - 번들: 472.49 KB → 471.67 KB (0.17% 감소)
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 2025-10-05: **Epic CODEQL-LOCAL-ENHANCEMENT** ✅
  - 로컬 CodeQL 워크플로 개선 (Phase 2-3 완료)
  - 스크립트 로깅 강화 + 1,010줄 가이드 문서 작성
  - 15개 테스트 GREEN, 번들 영향 없음
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조
- 2025-10-05: **Epic CODEQL-SECURITY-HARDENING** ✅
  - CodeQL 보안 경고 5건 해결 (URL Sanitization 4건, Prototype Pollution 1건)
  - 3-Phase TDD 완료 (RED → GREEN → REFACTOR)
  - 18개 보안 계약 테스트 + 2664개 전체 테스트 GREEN
  - 번들 크기 변화 없음 (472.49 KB)
  - 상세: `TDD_REFACTORING_PLAN_COMPLETED.md` 참조

**활성 Epic**: THEME-ICON-UNIFY-002 Phase B/C (2025-10-05 승격) ⚙️

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
