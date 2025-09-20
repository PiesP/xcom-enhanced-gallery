# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-20 — 현재 활성 Epic 없음

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

현재 활성 Epic 없음. 신규 Epic은 백로그에 제안 후 승격합니다.

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

## 7. 활성 리팩토링 계획 — 카테고리별 리뷰 결과(2025-09-20)

본 섹션은 최신 코드 리뷰 결과를 바탕으로 즉시 실행 가능한 리팩토링 계획을
정리합니다. 모든 변경은 TDD(RED → GREEN → REFACTOR)로 진행합니다.

### 7.1 아키텍처/의존성 경계

- 진단: `src/` 하위에서 preact/signals/fflate 직접 import 없음(OK). 예외로
  `src/shared/external/vendors/vendor-manager-static.ts`에서만 직접 import(벤더
  래퍼 내부, 정책상 허용). `test/unit/lint/direct-imports-source-scan.test.js`가
  가드 수행 중.
- 계획/액션: 추가 조치 불필요. 린트/테스트 가드 유지.

### 7.2 타입스크립트/타입 안전성

- 진단: strict 설정 유지. 공개 API 반환 타입 명시 상태 전반 양호.
- 계획/액션: 신규/변경 API는 반환 타입 명시 원칙 유지. 별도 액션 없음.

### 7.3 이벤트 입력 정책(PC 전용)

- 진단: `src/` 내 onTouch*/onPointer* 및 touch/pointer 이벤트 사용 없음(OK).
  ESLint/빌드 검증 스크립트에서 가드 유지.
- 계획/액션: 별도 액션 없음.

### 7.4 외부 통합(Vendors/Userscript/ZIP)

- 진단: Userscript 접근은 `getUserscript()` 경유. `src` 내 직접 `GM_*` 호출
  없음(타입 선언만 존재). Vendors getter 사용 확인.
- 계획/액션: 별도 액션 없음.

### 7.5 상태 관리(Signals)와 파생값

- 진단: `@shared/utils/signalSelector.ts`를 중심으로 사용. 문제 없음.
- 계획/액션: 별도 액션 없음.

### 7.6 UI 계층/컴포넌트 경계

- 진단: 주요 갤러리 컴포넌트는 서비스/유틸 경계 준수. 이슈 없음.
- 계획/액션: 별도 액션 없음.

### 7.7 스타일 시스템(디자인 토큰/CSS Modules)

- 진단: 토큰 기반 사용 정책 및 테스트 가드 유지. 샘플 위반 없음.
- 계획/액션: 별도 액션 없음.

### 7.8 테스트 전략(TDD/JSDOM/모킹)

- 진단: GM\_\* 모킹/벤더 모킹/정책 가드 테스트 존재. GREEN 유지.
- 계획/액션: 별도 액션 없음.

### 7.9 빌드/배포(Userscript 번들/소스맵)

- 진단: 단일 파일 번들, 산출물 validator 동작. 문제 없음.
- 계획/액션: 별도 액션 없음.

### 7.10 성능/메모리/수명주기

- 진단: 스케줄러/idle/raf 유틸 사용. 대규모 변경 필요 없음.
- 계획/액션: 별도 액션 없음.

### 7.11 접근성(A11y)

- 진단: 포커스/라이브 리전 유틸 존재. 추가 이슈 미발견.
- 계획/액션: 별도 액션 없음.

### 7.12 서비스 계층/다운로드 흐름

- 진단: Userscript/native download 경유 흐름 일관. Result 모델 표준 유지.
- 계획/액션: 별도 액션 없음.

---

<!-- EPIC XEG-SEL-01 — Completed and moved to TDD_REFACTORING_PLAN_COMPLETED.md -->
