# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-19 — 활성 Epic: XEG-CORE-REG-DEDUPE(P3),
XEG-TOOLBAR-VIS-CLEANUP(P3)

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

### XEG-CORE-REG-DEDUPE — Core 서비스 중복 등록 제거

Baseline: master (2025-09-19)

문제 요약:

1. `service-initialization.ts`에서 THEME가 중복 등록됨(동일 키 2회) →
   `ServiceManager.register` 경고/덮어쓰기/cleanup 호출 가능
2. 호환성을 위해 다중 키를 동일 인스턴스로 제공해야 하지만 “같은 키”의 중복
   등록은 제거해야 함

목표 (Outcomes):

- 동일 서비스 키의 중복 register 0회, 경고 0회
- 호환 alias 키는 별도 매핑 또는 다중 키 등록 시에도 “동일 키 중복”을 회피

측정 지표 (Metrics):

- 단위 테스트에서 register 호출 카운트 검증, warn 로깅 0

Phase:

| Phase | 코드   | 목적                                                            | 상태     |
| ----- | ------ | --------------------------------------------------------------- | -------- |
| P1    | 테스트 | `registerCoreServices()` 호출 시 THEME 키 단일 등록 보장 테스트 | GREEN    |
| P2    | 구현   | 중복 코드 제거, alias 키만 유지(이미 동일 객체 공유)            | GREEN    |
| P3    | 리팩터 | 경고/cleanup 경로 제거로 초기화 간소화, 주석 정리               | REFACTOR |

Acceptance Criteria:

- 콘솔 warn 없음, ServiceManager 진단에서 중복 키 0

Implementation Notes:

- 플러그인에서 window.XEG_CSS_TEXT 전역 노출 추가 및 문서 head 주입 유지(테스트
  안정성/회귀 리스크 최소화). head 주입 gating은 P4에서 처리
- GalleryContainer: Shadow DOM 경로의 `@import '/src/...css'` 제거, 전역 CSS
  텍스트로 주입
- Core: THEME 중복 register 제거, alias 키('theme.service') 유지

위험 & 완화:

- 위험: 레거시 테스트가 중복 등록 가정 → 완화: 테스트 업데이트 시 주석으로 변경
  의도 명시

Roll-back 전략:

- 변경 라인 최소화, 이전 버전의 register 블록을 되돌리는 단일 커밋 롤백

### XEG-TOOLBAR-VIS-CLEANUP — 툴바 가시성/애니메이션 로직 단순화

Baseline: master (2025-09-19)

문제 요약:

1. 툴바 가시성은 CSS 호버 기반으로 통일되었으나, `css-animations.ts`에 toolbar
   관련 키프레임/클래스가 남아 잠재적 중복/혼란 원인
2. 타이머 기반 처리 흔적(전역 타이머 매니저)과 CSS-기반 처리가 혼재할 위험

목표 (Outcomes):

- 툴바 가시성은 순수 CSS 변수/호버 기반으로 단일화, 불필요한 키프레임/클래스
  제거 또는 deprecated 표기

측정 지표 (Metrics):

- 툴바 관련 애니메이션 상수/키프레임 사용처 0 또는 명시적 deprecated 커버리지
  100%

Phase:

| Phase | 코드   | 목적                                                         | 상태     |
| ----- | ------ | ------------------------------------------------------------ | -------- |
| P1    | 테스트 | 툴바 가시성 E2E 성격의 경량 DOM 테스트(hover 시 변수 반영)   | GREEN    |
| P2    | 구현   | 미사용 툴바 애니메이션 제거 또는 deprecated 주석/플래그 처리 | GREEN    |
| P3    | 리팩터 | 문서화(코멘트, CODING_GUIDELINES 링크)                       | REFACTOR |

#### 즉시 액션 (Next 2 steps)

- XEG-CORE-REG-DEDUPE P3: 경고/cleanup 경로 제거 및 주석 정리(리팩터) — 테스트
  유지
- XEG-TOOLBAR-VIS-CLEANUP P3: CODING_GUIDELINES에 가시성 정책(hover/CSS 변수,
  타이머/애니메이션 금지) 명시 — 테스트 참고 링크 포함

Acceptance Criteria:

- 툴바 표시/숨김은 CSS 변수만으로 제어되고, 잔여 JS 타이머 의존 없음

위험 & 완화:

- 위험: 접근성 관련 포커스/키보드 상호작용 퇴화 → 완화: 포커스시 가시성 보장
  규칙 유지 테스트 포함

Roll-back 전략:

- 제거 대신 deprecated로 유지하는 단계적 접근을 선택, 필요 시 즉시 복구 가능

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
