# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-21 — 활성 Epic 3건(A11y, 스타일·테마, 메모리)

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

아래 3개 Epic을 즉시 진행합니다. 모든 작업은 TDD(RED→GREEN→REFACTOR)와 엄격한
벤더 getter/디자인 토큰/PC 전용 입력 원칙을 준수합니다.

### Epic A: 접근성 강건화 (A11y)

목표

- 포커스 트랩의 일관 적용, 라이브 리전 고도화, 주요 위젯의 ARIA 속성 검증 자동화

선행 맥락

- 가용 컴포넌트/유틸: `shared/hooks/useFocusTrap.ts`,
  `shared/utils/focusTrap.ts`, `shared/utils/accessibility/*`,
  `shared/components/ui/Toast/*`, `shared/components/ui/MediaCounter/*`

옵션 비교(요약)

- 단일 훅 표준화 vs 유틸+훅 혼용
  - 단일 훅 표준화: 장점 — 일관성/테스트 집중. 단점 — 특수 케이스 유연성 감소
  - 혼용 유지: 장점 — 세밀 제어. 단점 — 테스트/사용 기준이 분산

선택안

- 훅 표준화를 기본으로 하고, 유틸은 `accessibility-utils` 경유 생성만 허용(직접
  import 금지)

단계별 TDD 과제

1. GREEN: `useFocusTrap`로 통합 적용, 특수 케이스는
   `accessibility-utils.createFocusTrap()`로 주입
2. REFACTOR: `useAccessibility.ts` 내 중복 API 축소 및 문서화 업데이트

수용 기준(샘플)

- 키보드만으로 모든 활성 레이어 진입/탈출 가능(Escape 복귀, Tab 순환 검증)
- 주요 실시간 위젯은 적절한 aria-live 채널로 공지됨(중복 억제)
- 컬러 대비 검사는 `accessibility-utils`의 계산 유틸 기준 PASS

리스크/완화

- 이중 트랩 활성화: 훅/유틸 동시 사용 방지 가드와 테스트 추가

### Epic B: 스타일/테마 정합성

목표

- Shadow DOM 스코프 유지, 루트 토큰 일원화, Toolbar 버튼 스타일 단순화, 테마
  자동/수동 전환 신뢰성 향상

선행 맥락

- 가용 서비스: `shared/services/ThemeService.ts`(prefers-color-scheme,
  data-theme), 디자인 토큰 주입(`XEG_CSS_TEXT`)

옵션 비교(요약)

- 토큰 루트 주입 vs 컴포넌트 분산
  - 루트 주입: 장점 — 일관성/성능. 단점 — 일부 컴포넌트 독자 토큰 필요 시
    오버라이드 필요

선택안

- 루트 토큰만 소스 오브 트루스로 유지. 컴포넌트는 변수 참조만 허용

단계별 TDD 과제

1. (완료) RED: 토큰 위반 탐지 테스트 강화 — CSS Modules에서 raw 명명 색상 사용
   금지
2. (완료) GREEN: Toolbar/Button/Gallery/Toast CSS의 명명 색상 값을 토큰으로 전환
   및 잔존 치환
3. (완료) RED: ThemeService 전환/FOUC/중복 적용 가드 테스트 추가
4. (완료) GREEN: `ThemeService` 이벤트/리스너 누락 케이스 보강 및 데이터 속성
   적용 지연 로직 개선(FOUC 최소화)

수용 기준(샘플)

- dev/prod 번들에서 raw 색상/치수 직접값 0건
- 데이터 테마 전환 시 1 프레임 내 토큰 적용(테스트는 타임아웃 여유 50ms)

리스크/완화

- 서드파티 스타일 교차 영향: Shadow DOM 캡슐화 유지 검증 추가

### Epic C: 메모리/리소스 누수 방지

목표

- 타이머/리스너/미디어 리소스의 생성-해제 매핑을 보장하고, 진단 도구로 사후 검증
  가능하게 함

선행 맥락

- 가용 도구: `shared/utils/timer-management.ts`,
  `features/gallery/.../useGalleryCleanup.ts`

옵션 비교(요약)

- 전역 매니저 단일화 vs 각 서비스 독립 트래킹
  - 전역: 장점 — 진단 용이, 단점 — 지역 책임이 흐려질 수 있음

선택안

- 전역 타이머 매니저를 표준으로, 각 서비스는 스코프 태그로 자신 소유 리소스 명시

단계별 TDD 과제

1. (진행) RED: 페이지 전환/언마운트 시 살아있는 타이머/리스너가 0이어야 함 —
   진단 훅 테스트 추가
2. (진행) GREEN: `useGalleryCleanup` 호출 누락 지점 보완, 전역 매니저에 스코프
   태그 부여 — TimerManager에 context 스코프(문자열) 도입, 갤러리 이벤트 루프에
   컨텍스트 적용 및 정리 경로 연동
3. RED: 대량 썸네일 로딩 시 GC 후 잔존 객체 수가 한도 이하(모킹) — smoke
   수준으로 유지
4. GREEN: 미디어 URL revoke/DOM 파기 순서 보정

수용 기준(샘플)

- 언마운트 직후 타이머/리스너 잔존 0, revoke 대기열 비움
- 프로파일링 모킹 기준 메모리 스파이크 회복

리스크/완화

- 테스트 flakiness: 타이밍 여유/재시도 도우미 적용

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
