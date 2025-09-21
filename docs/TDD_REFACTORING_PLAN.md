# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-21 — 활성 Epic 1건(정리)

- EPIC-B: Userscript 폴백 하드닝 v2(테스트 강화)

직전 사이클 Epic(유저스크립트 하드닝 v1) Phases 1–4 전체 완료(Completed 로그
이관)

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

- EPIC-B: Userscript 폴백 하드닝 v2(테스트 강화)
  - 목표: `getUserscript()` 폴백 경로의 오류 매핑/타임아웃/중단 처리에 대한 단위
    테스트 보강 및 회귀 가드
  - 상태: In Progress (RED 테스트 추가 → 어댑터 보강 예정)

---

## 3. 활성 Epic 상세

<!-- EPIC-A(스타일 하드닝 v1)는 완료되어 Completed 로그로 이관되었습니다. -->

### EPIC-B — Userscript 폴백 하드닝 v2 (테스트 강화)

- Problem
  - `getUserscript()`의 GM\_\* 미지원 환경 폴백은 구현되어 있으나, 오류
    매핑/타임아웃/abort 등 세부 동작의 테스트 커버리지가 부족할 수 있음
- Outcome (DoD)
  - 폴백 다운로드/xhr에 대해 다음 시나리오 테스트 GREEN: 성공, 비-2xx, 네트워크
    오류, 타임아웃, abort, 큰 응답 스트림 취소
  - 오류 메시지/토스트 정책 일관화(사용자 피드백 표준화)
- Success Metrics
  - 해당 유닛/통합 테스트 100% GREEN, 결함 재현 케이스 회귀 0
  - 커버리지 목표: 어댑터 모듈 분기 커버리지 ≥ 90%
- Scope
  - `shared/external/userscript/adapter.ts` 폴백 경로 & GM\_\* 존재 감지 분기
  - 노이즈 회피를 위해 네트워크 모킹/가짜 타이머 활용
- Tasks (TDD 순서)
  1. RED: xhr/download 폴백 테스트 케이스 작성(성공/실패/timeout/abort)
  2. GREEN: 어댑터 오류 매핑/AbortSignal 연동 보강(필요 시)
  3. REFACTOR: 에러 타입/메시지 표준화, 로깅 상관관계 보강
- Risks/Mitigations
  - 타이밍 이슈/flaky → 가짜 타이머 및 고립된 테스트 환경 사용
  - 환경별 GM\_\* 차이 → 존재 감지 분기 테스트로 커버
- Gates
  - `npm test`(JSDOM 격리) · `npm run typecheck` · `npm run build:prod`

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
