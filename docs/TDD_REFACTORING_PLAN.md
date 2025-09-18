# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-18 — 현재 활성 Epic 없음 (직전: ICN-R 완료)

---

## 1. 불변 운영 원칙

| 영역        | 규칙 요약                                                                   |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------------------- | ------- | ---------------- |
| TypeScript  | strict 100%, 공개 API 명시적 반환 타입                                      |
| 외부 의존성 | preact / signals / fflate / GM\_\* 모두 전용 getter 경유 (직접 import 금지) |
| 입력 이벤트 | PC 한정(click / keydown                                                     | keyup / wheel / contextmenu) — 터치/포인터 금지 |
| 스타일      | 모든 색/치수/모션/층(z-index) 토큰 기반 (raw hex/px/ms 직접값 금지)         |
| Result 모델 | 'success'                                                                   | 'partial'                                       | 'error' | 'cancelled' 고정 |

테스트 스위트는 위 규칙 위반 시 RED 가드를 유지합니다.

---

## 2. 활성 Epic 현황

현재 진행 중인 Epic 없음. (직전 Epic ICN-R 아이콘 일관성 R4~R6까지 완료)

새 Epic 착수 시 아래 "Epic 템플릿" 섹션을 복사하여 채웁니다.

---

## 3. 제안 / 대기 Epic

### TBAR-O — 툴바 아이콘 & 인디케이터 최적화 (제안 상태)

핵심 문제 요약:

1. 아이콘 사이즈 토큰 다중 선언 → 드리프트 위험
2. `IconButton size="toolbar"`와 실제 아이콘 렌더 크기 분리 관리
3. 진행 카운터(현재/전체 + progress) 인라인 구조 → 재사용/테스트 한계
4. legacy `.controls` vs 신규 Toolbar 공존 → 중복 및 회귀 위험
5. icon-only 버튼 ARIA 가드 부족 / progressbar 속성 검증 미흡

목표 요약:

- 아이콘 사이즈 단일 선언 (component layer) + alias deprecation
- `--xeg-size-toolbar-button` 도입 (버튼 높이/내부 아이콘 크기 관계 명시)
- `<MediaCounter>` 추출 (stacked / inline, aria-live polite)
- legacy `.controls` 제거 및 회귀 테스트 가드
- a11y 테스트: icon-only aria-label 전수 / progressbar role & value 일치
- 번들 gzip 영향 +1% 이내 (제거 코드로 상쇄)

현재 상태: P1–P6 수행 / P7(주석/alias 최종 정리) 이후 종료 예정 → 세부 진행 및
중간 산출물은 완료 로그 참조.

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
