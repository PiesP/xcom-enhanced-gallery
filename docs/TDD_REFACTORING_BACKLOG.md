# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> **최근 업데이트**: 2025-01-04 — UI-TEXT-ICON-OPTIMIZATION 활성 계획으로 승격
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

## 우선순위별 후보 목록

### HIGH Priority

(현재 없음)

### MEDIUM Priority

(현재 없음)

### LOW Priority

**IDEA | CUSTOM-TOOLTIP-COMPONENT | 커스텀 툴팁 컴포넌트 구현** | 브랜드
일관성 + 키보드 단축키 강조 + 스타일 통일 | M | Epic UI-TEXT-ICON-OPTIMIZATION
완료 후 고려

- **현황**: 네이티브 `title` 속성 사용 (브라우저 기본 툴팁)
- **제안**: 커스텀 툴팁 컴포넌트로 키보드 단축키 강조 표시 (`<kbd>←</kbd>`)
- **이점**: 스타일 통일, 다국어 지원 개선, 브랜드 일관성
- **주의**: PC 전용 정책 유지 (터치 이벤트 배제)
- **의존성**: Epic UI-TEXT-ICON-OPTIMIZATION Phase 3 완료 후

**IDEA | ICON-USAGE-AUDIT-TOOL | 아이콘 사용 분석 자동화** | 중복 사용 자동
감지 + 회귀 방지 | S | 장기 품질 개선

- **현황**: 수동으로 아이콘 중복 사용 확인
- **제안**: 프로젝트 전체 아이콘 사용 분석 스크립트
  (`scripts/icon-usage-audit.mjs`)
- **기능**: 중복 사용 감지, 미사용 아이콘 감지, 사용 빈도 리포트
- **출력**: Markdown 테이블 또는 JSON 리포트
- **예**: "Settings" 아이콘이 3곳에서 다른 의미로 사용됨 → 경고

---

## 최근 승격 히스토리

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
