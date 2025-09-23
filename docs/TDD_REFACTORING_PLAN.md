# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-23 — 문서 정리: USH-v4 관련 추가 게이트(수용 기준) 블록을
Completed 로그로 일원화하고, 활성 계획서에서는 제거했습니다. “EPIC-SM — Settings
Modal Implementation Audit”은 Completed로 이관되었으며, “EPIC-FIX — Gallery
Image Fit Mode Persistence” 또한 완료되어 본 문서에서 제거되었습니다(Completed
참조).

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

현재 활성 Epic 없음.

메모: 직전 사이클의 EPIC-REF(코드 경량화 v1) 하위 작업(REF-04..07)은 모두
완료되어 완료 로그로 이관되었습니다(Completed 참조).

---

## 3. 다음 사이클 준비 메모(Placeholder)

- 신규 Epic 제안 시 백로그에 초안 등록(Problem/Outcome/Metrics) 후 합의되면 본
  문서로 승격합니다.

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트(요지):

- 타입/린트/테스트/빌드 검증은 `AGENTS.md`와 `CODING_GUIDELINES.md`의 품질
  게이트를 따릅니다.

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 설계                   | `docs/ARCHITECTURE.md`                   |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.

---

## 7. 품질 게이트 및 검증 방법

모든 Epic/Task는 다음 게이트를 통과해야 합니다.

- 타입: `npm run typecheck` — strict 오류 0
- 린트/포맷: `npm run lint` / `npm run format` — 수정 사항 없거나 자동 수정 적용
- 테스트: `npm test` — 신규/갱신 테스트 GREEN, 리팩터링 임시 RED만 허용 주석
  필수
- 빌드: `npm run build:dev`/`prod` — 산출물 검증 스크립트 통과

추가로, 접근성 전용 스모크:

- Tab/Shift+Tab 네비게이션 스모크, Escape 복귀 스모크, aria-live 공지 스냅샷

메모리 전용 스모크:

- 타이머/리스너 카운트 0, revoke 큐 0, 대량 로딩 후 회복 확인(모킹)

---

## Change Notes (Active Session)

2025-09-23 — Toolbar 초기 핏 모드 동기화 (bugfix)

- 증상: 갤러리 초기 진입 시 툴바의 핏 모드가 저장된 설정과 무관하게 "가로
  맞춤(fitWidth)"으로 표시됨.
- 원인: `Toolbar`가 내부 훅 상태(`useToolbarState().currentFitMode`의 기본값:
  fitWidth)만 참조하고, 실제 화면 로직(`VerticalGalleryView`)은 설정에서 복원한
  모드로 동작하여 UI와 상태가 분리됨.
- 조치: `Toolbar`에 제어 프로퍼티 `currentFitMode?: ImageFitMode` 추가. 제공 시
  해당 값을 선택 상태로 사용. `VerticalGalleryView`는 복원된 `imageFitMode`를
  `ToolbarWithSettings`로 전달(`currentFitMode={imageFitMode}`).
- 테스트: `test/unit/shared/components/ui/Toolbar.fit-mode.test.tsx` 추가
  - prop 미제공 시 내부 기본값(fitWidth) 선택이 유지됨
  - `currentFitMode="fitContainer"` 전달 시 해당 버튼 선택
- 비고: 벤더 getter, PC 전용 이벤트, strict TS 준수. 공개 API 변경은 선택적 prop
  추가로 후방 호환을 유지하며 onFit\* 콜백 흐름은 동일.
