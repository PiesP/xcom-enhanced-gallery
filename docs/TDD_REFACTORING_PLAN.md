# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-20 — 활성 Epic: VDOM-HOOKS-HARDENING

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

### VDOM-HOOKS-HARDENING — vDOM/훅 안정화 및 누수 가드 강화

Baseline: commit `9a93e5db` (2025-09-20)

문제 요약:

1. 장시간 실행/대규모 갤러리에서 리스너·타이머·관찰자 누수 가능성
2. useEffect 의존성 배열 누락/불안정 참조로 인한 리렌더/사이드이펙트 중복 위험
3. X.com SPA와의 DOM 교체 타이밍에 따른 마운트 포인트 상실/재마운트 누락 가능성
4. Signals 구독 과다로 인한 리렌더 비용 증가(대형 리스트 시)

목표 (Outcomes):

- 장시간 실행(100+ 미디어 스크롤/탐색) 후에도 살아있는 리스너/타이머/관찰자 누수
  0
- 효과 의존성 규칙 위반 0(ESLint/테스트 가드)
- SPA DOM 교체 시 자동 재바인드/복구 지연 ≤ 250ms
- 대형 갤러리 렌더 프레임 드롭(>16ms) 빈도 기존 대비 ≤ -20%

측정 지표 (Metrics):

- 누수 테스트: afterAll 리소스 카운트 0(assert)
- 키보드/휠 네비 테스트: 중복 핸들러 미등록(카운팅 훅)
- MutationObserver 재바인드 테스트: 컨테이너 분실 → 250ms 내 재마운트 여부
- 렌더 성능 샘플: 스로틀/배치 업데이트 적용 후 rerender 횟수 감소

Phase (TDD RED → GREEN → REFACTOR):

| Phase | 코드                                                       | 목적                                 | 상태 |
| ----- | ---------------------------------------------------------- | ------------------------------------ | ---- |
| P1    | `test/integration/hooks-lifecycle.leak-guard.red.test.tsx` | 리스너/타이머/관찰자 누수 RED        | RED  |
| P2    | `src/shared/utils/lifecycle/*`, 훅 클린업 정비             | 최소 구현으로 GREEN                  | TODO |
| P3    | `test/integration/mutation-observer.rebind.red.test.ts`    | SPA 교체 시 재마운트 RED             | RED  |
| P4    | `src/features/gallery/*` 스케줄/배치/selector 확대         | 리렌더 감소/성능 GREEN               | TODO |
| P5    | REFACTOR                                                   | 중복 제거/문서 보강/규칙 ESLint 강화 | TODO |

Acceptance Criteria:

- 임의 탐색/스크롤/오버레이 열고 닫기 20회 반복에도 누수 0
- 의존성 배열 규칙 위반 ESLint 0, 테스트 내 카운터 0
- ShadowRoot 컨테이너 분실 시 자동 재바인드, 사용자 인지 불가 수준(≤250ms)

위험 & 완화:

- 위험: X.com DOM 구조 변경으로 관찰 경로 변화 / 완화: 선택자 추상화 + 다중 앵커
  fallback
- 위험: 성능 개선 중 동작 변경 / 완화: 계약 테스트 우선, 플래그로 점진적 활성화

Roll-back 전략:

- `xeg_feature.vdomRebind` 플래그로 신속 비활성화, 기존 동작 복원. 분리 커밋
  보존

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
