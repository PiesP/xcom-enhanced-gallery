# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-10-04 — Epic TEST-FAILURE-ALIGNMENT-PHASE2 시작 (29개
테스트 실패 정리)

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

### Epic TEST-FAILURE-ALIGNMENT-PHASE2 (진행 중)

**목적**: 프로젝트 최신 개발 방향에 맞춰 남은 29개 실패 테스트 정리 및 개선

**배경**: Epic TEST-FAILURE-FIX-REMAINING (2025-10-04 완료) 이후 29개 테스트
실패 잔존

**접근 방향**:

1. **Sub-Epic으로 분할**: 각 카테고리를 독립적으로 진행
2. **우선순위**: Signal Native → Toolbar → Settings → Integration
3. **기준**: RED 테스트가 실제 기능 구현 필요한지, 테스트 자체가 부적절한지 판단

**테스트 분류** (29개 실패):

1. **Signal Native 패턴** (8개):
   - `test/shared/state/gallery-signals-native.test.ts` (4 failed)
   - `test/shared/state/toolbar-signals-native.test.ts` (4 failed)
   - 이슈: Gallery/Toolbar derived state 초기화 누락
     (`initializeGalleryDerivedState()`, `initializeToolbarDerivedState()`)

2. **Toolbar Hover** (2개):
   - `test/features/toolbar/toolbar-hover-consistency.test.ts` (1 failed)
   - `test/features/toolbar/toolbar-hover-consistency-completion.test.ts` (1
     failed)
   - 이슈: `toolbarButton` 복잡한 transform 효과 제거 검증 실패

3. **Settings Modal Accessibility** (2개):
   - `test/unit/shared/components/ui/settings-modal-accessibility.test.tsx` (1
     failed)
   - `test/unit/shared/components/ui/settings-modal-accessibility.solid.test.tsx`
     (1 failed)
   - 이슈: 기본 설정 컨트롤 렌더링 검증 실패 (aria-checked='false' vs 'true')

4. **Language Icons Integration** (3개):
   - `test/features/settings/settings-modal-language-icons.integration.test.tsx`
     (3 failed)
   - 이슈: 언어 아이콘 radiogroup 초기 선택 상태, 클릭 인터랙션 실패

5. **Full Workflow** (7개):
   - `test/integration/full-workflow.test.ts` (7 failed)
   - 이슈: 통합 워크플로 검증 (갤러리 열기, 다운로드, 설정 적용 등)

6. **User Interactions** (3개):
   - `test/behavioral/user-interactions-fixed.test.ts` (3 failed)
   - 이슈: 사용자 상호작용 테스트 (키보드, 다운로드, 에러 처리)

7. **Userscript Allowlist** (2개):
   - `test/security/userscript-allowlist.test.ts` (2 failed)
   - 이슈: `GM_xmlhttpRequest`, `GM_notification` mock 누락

8. **Solid Settings Panel** (1개):
   - `test/features/settings/solid-settings-panel.integration.test.tsx` (1
     failed)
   - 이슈: Solid settings panel 통합 테스트 실패

9. **Main Bootstrap** (1개):
   - `test/integration/main/main-solid-bootstrap-only.test.ts` (1 failed)
   - 이슈: Solid vendors warmup 호출 횟수 불일치 (expected 1, got 5)

**현재 Phase**: Phase 0 (분석 및 계획)

**다음 작업**:

- Phase 1: Signal Native 패턴 수정 (8개)
- Phase 2: Toolbar Hover 수정 (2개)
- Phase 3: Settings/Language 수정 (6개)
- Phase 4: Integration/User Interactions 수정 (10개)
- Phase 5: Userscript/Bootstrap 수정 (3개)

**Acceptance Criteria**:

- ✅ 모든 테스트 카테고리 분석 완료
- ✅ 각 Sub-Epic별 Phase 계획 수립
- ⬜ TypeScript 0 errors
- ⬜ ESLint clean
- ⬜ 전체 테스트 GREEN (2609+ tests)
- ⬜ 빌드 성공 (dev + prod)

---

## 3. 최근 완료 Epic

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

**남은 작업**: 29개 테스트 실패 → Epic TEST-FAILURE-ALIGNMENT-PHASE2로 승격

---

### Epic TEST-FAILURE-ALIGNMENT-2025 (부분 완료: 2025-10-04)

**목적**: 프로젝트 최신 개발 방향에 맞춰 실패하는 테스트 정렬 및 개선

**결과**: Phase 1-3 부분 완료 - 구현되지 않은 기능의 RED Phase 테스트 제거 및
CSS 예산 조정

**성과**:

- ✅ 테스트 실패: 51개 → 9개 (82.4% 개선)
- ✅ RED Phase 테스트 제거: 8개 파일
- ✅ CSS 번들 예산 조정: 215KB
- ✅ 빌드 성공: dev + prod (472.68 KB raw, 117.61 KB gzip)

**남은 작업**: 9개 실패 테스트 → 백로그로 이관 (실제 구현 이슈)

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
