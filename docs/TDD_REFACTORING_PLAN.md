# TDD 리팩토링 활성 계획

본 문서는 복잡한 구현/구조를 간결하고 현대적으로 재구축하기 위한 리팩토링
Epic들을 관리합니다. 완료된 내용은 `TDD_REFACTORING_PLAN_COMPLETED.md`로
이관하여 히스토리를 분리합니다.

**최근 업데이트**: 2025-01-XX — Epic SOLIDJS-REACTIVE-ROOT-CONTEXT 완료 ✅, 현재
활성 Epic 없음

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

### 현재 활성 Epic

현재 활성 Epic이 없습니다. 새로운 Epic을 시작하려면
`docs/TDD_REFACTORING_BACKLOG.md`에서 후보를 검토하세요.

---

## 3. 최근 완료 Epic

### Epic SOLIDJS-REACTIVE-ROOT-CONTEXT (완료: 2025-01-XX)

**목적**: SolidJS `createMemo` 메모리 누수 방지 — 전역 상태 파생값을
`createRoot`로 래핑하여 dispose 가능하도록 개선

**결과**: ✅ 7/7 tests GREEN, 메모리 누수 방지 완료, 빌드/린트/타입 체크 통과

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-XX 섹션 참조)

---

### Epic CUSTOM-TOOLTIP-COMPONENT (완료: 2025-01-08)

**목적**: 커스텀 툴팁 컴포넌트 구현 — 키보드 단축키 시각적 강조 (`<kbd>`) +
브랜드 일관성 + 완전한 다국어 지원

**결과**: ✅ Phase 1-4 완료, 24/24 tests GREEN, WCAG 2.1 Level AA 준수, 번들
+1.06%

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-08 섹션 참조)

---

### Epic UI-TEXT-ICON-OPTIMIZATION (완료: 2025-01-08)

**목적**: Toolbar 및 UI 컴포넌트의 텍스트/아이콘 최적화 — 완전한 다국어 지원 +
접근성 개선 + 아이콘 의미론적 명확성

**결과**: ✅ 33 tests GREEN, i18n 커버리지 100%, ARIA 강화 완료, 번들 +0.70%

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-08 섹션 참조)

---

### Epic JSX-PRAGMA-CLEANUP (완료: 2025-01-04)

**목적**: esbuild JSX pragma 경고 제거 및 SolidJS 설정 표준화

**결과**: ✅ 6/6 tests GREEN, 빌드 경고 0개, TypeScript 0 errors, 번들 크기 동일

상세 내용: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-04 섹션 참조)

---

### Epic GALLERY-NAV-ENHANCEMENT (완료: 2025-01-04)

**목적**: 갤러리 네비게이션 UX 개선 - 좌우 네비게이션 버튼 구현

**결과**: ✅ 17/17 tests GREEN, 번들 +3.15 KB (+0.68%), NavigationButton
컴포넌트 구현 완료

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
