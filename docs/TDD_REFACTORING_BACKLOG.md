# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 저장소 (선정 전까지 여기서만 유지)

> **최근 업데이트**: 2025-10-04 — TEST-FAILURE-FIX-REMAINING Epic 완료
>
> 사용 방법:
>
> - 새 사이클 시작 시 이 목록에서 1~3개를 선택하여 `TDD_REFACTORING_PLAN.md`의
>   "활성 스코프"로 승격
> - 선택 기준: 가치(Impact) / 구현 난이도(Effort) / 가드 필요성(Risk of
>   Regression)
> - 승격 후 RED 테스트부터 작성, 완료되면 COMPLETED 로그로 이관
>
> 코멘트 규칙: `상태 | 식별자 | 요약 | 기대 효과 | 난이도(S/M/H) | 비고`
>
> 상태 태그: `IDEA`(순수 아이디어), `READY`(바로 착수 가능), `HOLD`(외부 의존),
> `REVIEW`(설계 검토 필요)

---

## 최근 승격 히스토리

**2025-10-04**: `TEST-FAILURE-FIX-REMAINING` 완료 →
`TDD_REFACTORING_PLAN_COMPLETED.md` 이관 완료 ✅

- 완료 내용: Phase 1-4 완료, 테스트 실패 38→29개 개선
- 성과: Bundle budget, Tooltip, Hardcoded values, LanguageService 싱글톤 전환
- 남은 작업: 29개 테스트 실패 → 백로그에 REMAINING-TEST-FAILURES로 등록

---

## 우선순위별 후보 목록

### MEDIUM Priority

**READY | REMAINING-TEST-FAILURES | 남은 29개 테스트 실패 해결 | CI 완전 통과
달성 | M | Epic TEST-FAILURE-FIX-REMAINING에서 이관**

**배경**: Epic TEST-FAILURE-FIX-REMAINING 완료 후 남은 29개 테스트 실패

**테스트 분류**:

1. **Signal Native 패턴** (8개):
   - `test/shared/state/gallery-signals-native.test.ts` (4 failed)
   - `test/shared/state/toolbar-signals-native.test.ts` (4 failed)
   - 레거시 `.value` 패턴을 사용하지 않는지 검증

2. **Toolbar Hover** (2개):
   - `test/features/toolbar/toolbar-hover-consistency.test.ts` (1 failed)
   - `test/features/toolbar/toolbar-hover-consistency-completion.test.ts` (1
     failed)
   - `toolbarButton` 복잡한 transform 효과 제거 검증

3. **Settings Modal Accessibility** (2개):
   - `test/unit/shared/components/ui/settings-modal-accessibility.test.tsx` (1
     failed)
   - `test/unit/shared/components/ui/settings-modal-accessibility.solid.test.tsx`
     (1 failed)

4. **Language Icons Integration** (3개):
   - `test/features/settings/settings-modal-language-icons.integration.test.tsx`
     (3 failed)

5. **Full Workflow** (7개):
   - `test/integration/full-workflow.test.ts` (7 failed)
   - 통합 워크플로 검증

6. **User Interactions** (3개):
   - `test/behavioral/user-interactions-fixed.test.ts` (3 failed)

7. **Userscript Allowlist** (2개):
   - `test/security/userscript-allowlist.test.ts` (2 failed)
   - GM_xmlhttpRequest, GM_notification mock 이슈

**접근 방향**:

- Sub-Epic으로 분할 (Signal Native, Toolbar, Settings, Integration 등)
- 각 Sub-Epic을 독립적으로 진행
- 우선순위: Signal Native → Toolbar → 나머지

**예상 난이도**: Medium (구조적 개선 필요)

---

### LOW Priority

(현재 없음)

---

## 과거 승격 히스토리 (아카이브)

**2025-01-08**: `CUSTOM-TOOLTIP-COMPONENT` 승격 → `TDD_REFACTORING_PLAN.md` 활성
Epic으로 이동

- 선정 이유: Epic UI-TEXT-ICON-OPTIMIZATION 완료로 의존성 충족, 사용자 경험
  개선, 브랜드 일관성 강화
- 솔루션: Option A (커스텀 Tooltip 컴포넌트) 선택
  - 키보드 단축키 `<kbd>` 마크업 지원
  - 디자인 토큰 기반 스타일
  - PC 전용 이벤트 (`mouseenter`, `focus` / `mouseleave`, `blur`)
  - WCAG 2.1 Level AA 준수
- 예상 영향: 번들 +2.5 KB raw (+0.5%), +0.8 KB gzip (+0.7%)
- TDD Phase: Phase 1 (RED, 12-15 tests) → Phase 2 (GREEN) → Phase 3 (REFACTOR)

**2025-01-07**: `ICON-USAGE-AUDIT-TOOL` 구현 완료 →
`TDD_REFACTORING_PLAN_COMPLETED.md`로 이동

**2025-01-04**: `UI-TEXT-ICON-OPTIMIZATION` 승격 → `TDD_REFACTORING_PLAN.md`
활성 Epic으로 이동

- 선정 이유: 높은 가치 (모든 언어 사용자), 낮은 리스크 (기존 패턴 재사용), TDD
  적용 용이
- 4가지 개선 영역 통합: I18N-COMPLETION, TOOLTIP-SEMANTICS,
  ICON-SEMANTIC-CLARITY, CONTEXTMENU-A11Y
- 예상 영향: 완전한 다국어 지원, 접근성 WCAG AA 준수, 키보드 단축키 가시성 향상

**2025-01-03**: `CONTEXT-MENU-UI-PHASE-3` 완료 ✅

- 결과: 18/18 tests GREEN, WCAG 2.1 Level AA 완전 준수, Epic 완전 종료
- 상세: `docs/TDD_REFACTORING_PLAN_COMPLETED.md` (2025-01-03 섹션)

**2025-10-03**: `CONTEXT-MENU-UI` 승격 → `TDD_REFACTORING_PLAN.md` 활성 Epic으로
이동 (Phase 2 완료)

- 선정 이유: 브랜드 일관성 향상, 접근성 개선, 확장성 확보
- 솔루션: Option A (커스텀 컨텍스트 메뉴 컴포넌트, PC 전용) - Epic 목적 충족, UX
  통일성, PC 전용 정책 준수
- PC 전용 정책 충돌 해결: "터치 디바이스 대응 가능" 문구 제거, contextmenu
  이벤트만 사용

**2025-10-03**: `DOWNLOAD-TOGGLE-TOOLBAR` 승격 → `TDD_REFACTORING_PLAN.md` 활성
Epic으로 이동 (완료됨)

- 선정 이유: 명확한 가치 (다운로드 워크플로 중심화), 낮은 리스크 (S 난이도),
  빠른 완료 가능
- 솔루션: 옵션 A (독립 토글 버튼) - PC 전용 입력 정책 준수, UX 개선 최적화

---

## Parking Lot (보류 중)

(현재 없음)

---

## 참고 문서

| 문서        | 위치                                     |
| ----------- | ---------------------------------------- |
| 활성 계획   | `docs/TDD_REFACTORING_PLAN.md`           |
| 완료 로그   | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 설계        | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙   | `docs/CODING_GUIDELINES.md`              |
| 실행 가이드 | `AGENTS.md`                              |

---

## Template

```text
READY | IDENTIFIER | 간단 요약 | 기대 효과 | 난이도(S/M/H) | 비고
```

새 항목 추가 시 우선순위에 맞게 HIGH/MEDIUM/LOW 섹션에 배치하며, 제거는 commit
메시지에 사유 명시.
