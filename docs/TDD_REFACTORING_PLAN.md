# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-18 — 활성 Epic: (없음 — 최신 상태, 신규 Epic 필요 시 백로그
승격)

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

현재 활성 Epic 없음. 새 Epic 필요 시 백로그 초안(Problem / Outcomes / Metrics)
작성 후 본 문서로 승격.

### SCROLL-ISOLATION — Phase 2 이후 잔여 (keyboard & cleanup)

Baseline(갱신): feat/scroll-isolation @ boundary guard + flag merged
(2025-09-18)

현재 상태 요약: 경계 기반 wheel 소비 로직(P1–P3) 및 feature flag 통합 완료. 남은
범위는 키보드 네비게이션 차단을 boundary 정책과 정렬하고, dead code
(`disableBodyScroll`) 제거 및 rollout 측정(옵션) 수행.

Remaining Outcomes:

- Keyboard: Space/PageDown/PageUp/Home/End - boundary 상황에서만 body scroll
  차단 & 내부 이동 (상/하/처음/끝)
- Focus Trap (선택): ESC 동작 유지 + Tab 순환 회귀 여부 결정 (도입 시 a11y
  테스트 추가)
- Cleanup: disableBodyScroll / 미사용 분기 제거 (기존 전역 차단 경로 완전 정리는
  FLAG ON 기본화 이후)
- Metrics: 번들 사이즈/핸들러 등록 수 변화 0 또는 감소

| Updated Phases:                                | Phase                                          | 코드/작업 | 목적 | 상태           |                        | ----- |
| ---------------------------------------------- | ---------------------------------------------- | --------- | ---- | -------------- | ---------------------- | ----- |
| ---------------------------------------------- | ----                                           |           | K1   | keyboard guard |
| RED                                            | boundary 동일 조건의 keydown prevent 스펙 도출 | 예정      |      | K2             | keyboard               |
| guard 구현 (GREEN)                             | 방향/페이지 키 내부 이동 & body 차단           | 예정      |      | F1             | (옵션)                 |
| focus trap RED                                 | Tab 순환/ESC 유지 명세                         | 보류      |      | F2             | (옵션) focus trap 구현 |
| (GREEN)                                        | tabbable 순환/escape 안정화                    | 보류      |      | C1             | disableBodyScroll dead |
| code 식별 RED                                  | 존재/경로 가드 (삭제 전)                       | 예정      |      | C2             | dead code 제거 + 회귀  |
| 테스트 업데이트                                | wheel 경로 단순화                              | 예정      |      | M1             | rollout metrics        |
| (bundle/handler count)                         | 전환 영향 수치화                               | 보류      |

Revised Acceptance (남은 부분):

- [AC-K] 경계 외 keyboard 입력 시 문서 스크롤 허용 & 내부 상태 정상
- [AC-F] (선택) focus trap 도입 시 Tab 순환 & ESC close 유지
- [AC-C] dead code 제거 후 전체 테스트 GREEN & bundle size Δ ≤ +0.5%

Risk (잔여):

- Keyboard guard로 단축키 충돌 → modifier(key.alt||key.meta) 무시 조건 적용
- Focus trap 도입 시 다른 모달과 충돌 → 단일 갤러리 활성 조건 + attribute opt-in

Next Action 후보: K1 RED 설계 (우선순위), 이후 K2 GREEN.

## 3. 제안 / 대기 Epic

현재 제안/대기 Epic 없음. 새 Epic은 백로그(`TDD_REFACTORING_BACKLOG.md`)에 초안
후 승격.

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
