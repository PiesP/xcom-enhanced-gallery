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

### SCROLL-ISOLATION — 전역 차단 → 경계 기반 정밀 제어 전환

Baseline: feat/scroll-isolation (2025-09-18)

문제 재정의:

현재 구현은 갤러리 open 시 문서 capture wheel 리스너가 (경계 여부와 무관하게)
preventDefault 를 수행하는 과도 차단 형태. 목표는 "내부 스크롤 여유가 있을 땐
전파 허용, 경계(top/bottom)에서만 차단" 으로 정책을 정밀화하고 keyboard(PageDown
등) 도 동일 기준으로 일관화.

주요 개선 목표 (Outcomes):

- Wheel: 경계(top에서 위, bottom에서 아래)일 때만 소비(true) → 나머지 경우
  pass-through
- Keyboard: Space/PageDown/Home/End 등은 갤러리 open + boundary 상황에서만 body
  스크롤 차단 (향후 focus trap 시 Tab 흐름 유지)
- Feature Flag `xeg_scrollIsolationV1` OFF 시 기존(과도 차단) 경로 유지 (안전
  롤백)
- 번들 gzip Δ ≤ +0.5%

측정 지표 (Metrics):

- 순수 유틸 단위 테스트 (경계 판단) RED→GREEN 4 케이스
- 통합(FLAG ON) 시 mid-scroll pass-through / boundary consume 시나리오 2 케이스
- keyboard guard (후속) 4 케이스
- 번들 사이즈 스크립트 결과 유지

Phase (TDD):

| Phase | 코드/작업                         | 목적                                     | 상태 |
| ----- | --------------------------------- | ---------------------------------------- | ---- |
| P1    | characterization + boundary RED   | 현 상태 기록 & 경계 판단 순수 로직 RED   | 진행 |
| P2    | boundary guard 구현 (GREEN1)      | shouldConsumeWheelAtBoundary 안정화      | 예정 |
| P3    | useGalleryScroll flag 통합        | FLAG ON 시 경계 기반 preventDefault 적용 | 예정 |
| P4    | keyboard guard (+선택 focus trap) | 키 입력도 동일 정책 / a11y 유지          | 예정 |
| P5    | disableBodyScroll 경로 정리       | dead code 제거 & 문서/테스트 갱신        | 예정 |

비고: `scroll-isolation.characterization.test.ts` 는 기존 전역 차단(또는 jsdom
환경 상 no-op) 상태를 기록하는 문서화 테스트로 유지. 경계 유틸 RED → GREEN 진행
후 필요 시 정책 테스트로 전환.

Acceptance Criteria:

- [AC1] 갤러리 open 시 wheel/keyboard로 X.com 메인 피드 scrollTop 변화
  없음(mock)
- [AC2] 갤러리 close 시 기존 문서 스크롤 정상 복원
- [AC3] 내부 컨텐츠 스크롤(필요한 경우) 자연스러움 & 버벅임 없음
- [AC4] focus trap 도입 시 Shift+Tab/Tab 순환 가능, ESC 닫기 기능 유지
- [AC5] 번들 사이즈 증가 허용 오차 이내

위험 & 완화:

- 위험: 지나친 전역 preventDefault 로 단축키/보조기능 영향 → 완화: 조건(
  isGalleryOpen && !modifierKeys ) 체크
- 위험: passive=false 남용으로 성능 저하 → 완화: 필요한 capture 2개 이내 유지,
  delta threshold 적용
- 위험: focus trap 사이드이펙트 (모달 중첩) → 완화: 단일 갤러리 활성 플래그 확인
  후 trap 적용
- 위험: body scroll lock 스타일 충돌 → 완화: class 토글 기반 (overflow:hidden) +
  cleanup 보장 테스트

Roll-back 전략:

- feature flag `xeg_scrollIsolationV1` (signals/state) 도입 → 비활성 시 새
  boundary/keyboard 가드 미사용
- revert commit 로 빠른 복구, 기존 wheel 경로 유지

솔루션 옵션 비교 (요약):

| 옵션 | 설명                                                         | 장점                    | 단점                                                  | 선택 |
| ---- | ------------------------------------------------------------ | ----------------------- | ----------------------------------------------------- | ---- |
| A    | overscroll-behavior 강화(root/body 포함)                     | CSS 한 줄, 간단         | 일부 브라우저 체인 완전 차단 불가, keyboard 영향 없음 | 보조 |
| B    | boundary-aware wheel lock (ensureWheelLock + scrollTop 계산) | 정확한 전파 차단        | 로직/측정 필요                                        | 주도 |
| C    | 전역 capture wheel guard (현재 개선)                         | 구현 단순               | 모든 wheel 가로채 성능 우려                           | 부분 |
| D    | body overflow hidden lock                                    | 확실한 body 스크롤 차단 | 레이아웃 shift 위험                                   | 예비 |
| E    | focus trap + keyboard prevent                                | 키 입력 누수 차단       | 추가 포커스 관리 필요                                 | 보조 |
| F    | PointerEvents layering                                       | CSS 로 간단             | 키/휠 모두 해결 불완전                                | 보류 |

선택된 접근(조합): B + E + (A 보조) + 최소한의 C 유지

Implementation Sketch:

1. boundaryWheelGuard(element): wheel 이벤트에서 현재 스크롤 가능 여부 판단 →
   불가능(경계) 시 true 반환하여 preventDefault
2. keyboardScrollGuard(document): 갤러리 open && key in [Space, PageDown,
   PageUp, Home, End] → preventDefault + 내부 네비게이션 위임
3. focusTrap: 갤러리 root 내 tabbable 수집 → 첫/마지막 순환, ESC close 유지
4. 기존 useGalleryScroll 개선: blockTwitterScroll 조건 분리 + boundary guard
   통합
5. disableBodyScroll 플래그 제거/대체 (feature flag 도입)
6. 테스트 후 리팩터: wheel util 경량화/주석 정리

TDD 단계 상세:

- RED1: test/features/scroll/scroll-isolation.red.test.ts → wheel 이벤트 두 번
  (deltaY±120) 발생 시 document scrollTop 변하지 않아야 (현재 실패)
- RED2: keyboard Space/PageDown/Home/End 전파 테스트 추가
- GREEN1: boundaryWheelGuard 구현 + useGalleryScroll 내 ensureWheelLock 적용
  (passive=false)
- GREEN2: keyboard guard & focus trap 조건 추가 (flag on)
- REF1: disableBodyScroll 제거 및 dead code 정리
- REF2: metrics 테스트 (bundle size diff snapshot)

테스트 목록 (초안):

1. Wheel - 갤러리 open, 내부 스크롤 가능: 이벤트 내부 소비 안함, onScroll 호출
2. Wheel - 갤러리 open, 내부 경계(top/bottom) 도달: preventDefault 호출,
   document scrollTop 유지
3. Wheel - 갤러리 close: document 기본 스크롤 정상
4. Keyboard - Space/PageDown: 갤러리 open 시 preventDefault, 내부 onScroll 혹은
   next item 전환
5. Keyboard - Home/End: 내부 인덱스 이동, 문서 스크롤 변화 없음
6. Focus Trap - Tab 순환: 마지막 → 첫, 첫 → 마지막 역방향
7. Feature Flag Off - 기존 동작 회귀 (테스트 보증)
8. Cleanup - 언마운트 후 wheel/keydown 리스너 제거(assert spy 호출)

비기능 요구 (Non-Functional):

- 성능: wheel handler 경계 계산 O(1) (scrollTop, scrollHeight, clientHeight 참조
  1회)
- 유지보수: 신규 util 1파일, 훅 수정 1곳, 테스트 1 폴더 내 1~2파일
- 가시성: logger.debug 경계 차단 시 1줄 (과다 로깅 금지)

추가 노트:

- 실제 X.com 구조 변화 시 `findTwitterScrollContainer` fallback 필요 → 실패 시
  body 대상으로 처리
- delta threshold(현재 0) 유지, 필요 시 사용자 설정화 가능 (범위 외 scope)

다음 액션: P1 잔여 - boundary guard 순수 RED 테스트 작성 후 GREEN 구현 착수

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
