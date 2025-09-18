# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-18 — 활성 Epic: (없음 — TBAR-R 종결, 다음 Epic 대기)

---

## 1. 불변 운영 원칙

| 영역        | 규칙 요약                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| TypeScript  | strict 100%, 공개 API 명시적 반환 타입                                      |
| 외부 의존성 | preact / signals / fflate / GM\_\* 모두 전용 getter 경유 (직접 import 금지) |
| 입력 이벤트 | PC 전용(click, keydown, keyup, wheel, contextmenu) — 터치/포인터 금지       |
| 스타일      | 색/치수/모션/층(z-index) 모두 토큰 기반 (raw hex/px/ms 직접값 금지)         |
| Result 모델 | 'success' · 'partial' · 'error' · 'cancelled' 고정                          |

테스트 스위트는 위 규칙 위반 시 RED 가드를 유지합니다.

---

## 2. 활성 Epic 현황

### TBAR-R — Toolbar Button/Indicator Refinement & Consolidation (종결)

상태: 모든 Phase(P1–P7) Completed — 세부 이력 및 메트릭은
`TDD_REFACTORING_PLAN_COMPLETED.md` 참조. 결과 요약: ToolbarButton Primitive
단일화, 2.5em 하드코딩 제거 100%, MediaCounter 스타일 포워딩 제거,
그룹/포커스/키보드(a11y) 가드 확립, legacy `.toolbarButton` 변형 및 중복 CSS
제거 완료. 다음 단계: 새 Epic 제안 필요 시 백로그 초안 후 승격.

위험 & 완화:

- 위험: 테스트 스냅샷 대량 변경 → 완화: 구조적 테스트(쿼리/role 기반)로 전환,
  snapshot 최소화
- 위험: 다국어/문자열 회귀 (aria-label) → 완화: role/label 정규화 테스트 추가
- 위험: 외부 의존 배포 중 스타일 누락 → 완화: build 산출물 validate-build.js
  확장 (선택자 존재 검증 추가 가능)

Roll-back 전략:

- 새 Primitive 도입 커밋 revert 시 기존 IconButton 기반 구조로 즉시 복구 가능
  (CSS 중복 복원)
- 테스트는 revert 후에도 GREEN (단, RED 가드는 제거 필요하므로 revert 시 RED
  테스트 동반 삭제)

Notes:

- Epic 코드: TBAR-R (Toolbar Refinement) — TBAR-O 후속 유지보수
- Feature flag 불필요 (구조/스타일 단순화로 기능 토글 가치 낮음)

---

---

## 3. 제안 / 대기 Epic

현재 제안/대기 Epic 없음. 새 Epic은 백로그에 초안 후 승격.

---

## 4. Epic 실행 템플릿 (복사하여 사용)

```markdown
### <EPIC-CODE> — <Epic 간단 설명>

Baseline: commit `<hash>` (YYYY-MM-DD)

문제 요약:

1. <항목>
2. <항목>

목표 (Outcomes):

- <정량/정성 목표>
- <정량/정성 목표>

측정 지표 (Metrics):

- (예) 번들 gzip ≤ +5% vs baseline
- (예) a11y ARIA missing rate 0

Phase (TDD RED → GREEN → REFACTOR): | Phase | 코드 | 목적 | 상태 | | ----- |
---- | ---- | ---- | | P1 | ... | ... | (RED/GREEN/REF) |

Acceptance Criteria:

- <AC1>
- <AC2>

위험 & 완화:

- 위험: <내용> / 완화: <전략>

Roll-back 전략:

- Feature flag `<flag>` 제거 시 이전 동작 복원 (분리 커밋 보존)
```

---

## 5. TDD 워크플로 (Reminder)

1. RED: 실패 테스트(또는 TODO) 추가 — 최소 명세만 표현
2. GREEN: 가장 작은 변경으로 통과 (과도한 범위 확대 금지)
3. REFACTOR: 중복 제거 / 구조 개선 (동일 테스트 GREEN 유지)
4. Rename: `.red.` 파일명 제거 → 가드 전환
5. 이동: 완료 항목 본 문서에서 제거 & Completed 로그에 1줄 요약

Gate 체크리스트 (병합 전):

- `npm run typecheck`
- `npm run lint`
- `npm test` (selective RED 허용)
- `npm run build:prod` + 산출물 validator

---

## 6. 참고 문서

| 문서                   | 위치                                     |
| ---------------------- | ---------------------------------------- |
| 완료 로그              | `docs/TDD_REFACTORING_PLAN_COMPLETED.md` |
| 백로그                 | `docs/TDD_REFACTORING_BACKLOG.md`        |
| 코딩 규칙              | `docs/CODING_GUIDELINES.md`              |
| 계획 아카이브(축약 전) | `docs/archive/`                          |

필요 시 새 Epic 제안은 백로그에 초안(Problem/Outcome/Metrics) 형태로 먼저 추가
후 합의되면 본 문서 Epic 템플릿 섹션에 승격합니다.
