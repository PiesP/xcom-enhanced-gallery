# 🗂️ TDD 리팩토링 백로그

> 활성화되지 않은 향후 후보 아이디어 저장소 (선정 전까지 여기서만 유지)
>
> **최근 업데이트**: 2025-10-03 — CONTEXT-MENU-UI 활성 계획으로 승격
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

READY | CONTEXT-MENU-UI-PHASE-3 | 컨텍스트 메뉴 접근성 & 키보드 네비게이션 완성
| 접근성 완전 준수, Epic 완전 종료 | S | Phase 2에서 남은 6개 테스트 완료

- **배경**: Epic CONTEXT-MENU-UI Phase 2에서 기능적 베이스라인 달성 (12/18
  tests), Phase 3 접근성 완전성 남음
- **목표**:
  - 각 액션 항목에 `role="menuitem"` 추가
  - 동적 `aria-label` 설정 (액션별 레이블)
  - Arrow Up/Down 키로 항목 간 포커스 이동
  - Enter 키로 포커스된 항목 실행
  - 포커스 순환 (첫 항목 ↔ 마지막 항목)
- **가치**:
  - WCAG 2.1 Level AA 완전 준수
  - 키보드 전용 사용자 완전 접근 가능
  - 스크린 리더 완전 지원
  - Epic CONTEXT-MENU-UI 완전 종료
- **난이도**: S (구조 완성, 속성/핸들러 추가만)
- **예상 영향**:
  - 변경 파일: 1개 (`ContextMenu.solid.tsx`)
  - 번들 크기: +0.5KB 미만 (포커스 관리 로직)
  - 회귀 리스크: 매우 낮음 (기존 12 tests 유지)
- **Acceptance Criteria**:
  - [x] 18/18 tests GREEN (남은 6개 완료)
  - [x] ARIA 속성 완전성 (role="menuitem", aria-label)
  - [x] Arrow Up/Down 키 네비게이션
  - [x] Enter 키 실행
  - [x] 포커스 순환 (Tab 트래핑)
  - [x] 스크린 리더 테스트 통과
  - [x] 타입/린트 오류 0
  - [x] 번들 크기 < +1KB
  - [x] 빌드 성공 (dev + prod)

### MEDIUM Priority

(현재 없음)

### LOW Priority

(현재 없음)

---

## 최근 승격 히스토리

**2025-01-03**: `CONTEXT-MENU-UI-PHASE-3` 승격 → `TDD_REFACTORING_PLAN.md` 활성
Epic으로 이동

- 선정 이유: 빠른 완료 가능 (S 난이도), Epic 완전 종료, 접근성 완전 준수
- 남은 작업: 6개 테스트 완료 (role="menuitem", aria-label, Arrow 키 네비게이션)
- 예상 소요: 1-2일 (구조 완성, 속성/핸들러 추가만)

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
