# TDD 리팩토링 활성 계획 (경량)

본 문서는 "현재 진행 중이거나 즉시 착수 예정" 작업만 간결하게 유지합니다. 완료된
내용은 항상 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관하여 히스토리를
분리합니다.

업데이트: 2025-09-23 — 문서 정리: USH-v4 관련 추가 게이트(수용 기준) 블록을
Completed 로그로 일원화하고, 활성 계획서에서는 제거했습니다. “EPIC-SM — Settings
Modal Implementation Audit”의 스코프(메뉴 연동/접근성 스모크)는 GREEN으로
확인되어 Completed 로그에 반영되어 있습니다.

---

## 1. 운영 원칙(요약/링크)

- 코딩/스타일/입력/벤더 접근/테스트 등의 일반 규칙은
  `docs/CODING_GUIDELINES.md`와 `docs/vendors-safe-api.md`를 단일 소스로
  사용합니다.
- 실행/CI/빌드 파이프라인과 스크립트는 루트 `AGENTS.md`를 참조합니다.
  - 본 문서는 “활성 Epic/작업”과 해당 Acceptance에만 집중합니다.

---

## 2. 활성 Epic 현황

EPIC-REF — 코드 경량화 v1(중복/충돌/불필요 코드 제거)

- 목적: 이미 통합된 경로(Selector/Timer/LiveRegion/ZIP/Scheduler 등)와 정책(벤더
  getter, PC 전용 입력, 디자인 토큰)에 맞춰 잔존 중복/래퍼/브릿지/죽은 코드를
  제거하고, 스크립트/테스트 중복을 정리하여 번들/유지비를 낮춥니다.
- 제약: 기능/공개 API 동등 유지, Features → Shared → External 단방향 의존, 벤더
  접근은 getter만 사용, PC 전용 이벤트만 사용.
- 수용 기준(각 항목 공통):
  - 타입/린트/테스트/빌드 모두 GREEN, `scripts/validate-build.js` PASS
  - 번들 사이즈(gzip) 비악화(±1% 이내), dist/assets 부재, 소스맵 무결성 유지
  - 새/변경 테스트가 회귀 가드를 제공(RED→GREEN→REFACTOR 순서)

작업 목록(스프린트 단위, 우선순위 상→하):

1. REF-03 Vendor getter 일원화 잔여 스캔/정리

- 현황: preact/compat 직접 import 스캔 보강 완료(Completed 참조). 향후 회귀는
  테스트로 가드됨.
- 남은 조치: 주기적 스캔 유지 및 신규 모듈 추가 시 getter 정책 검증 반영
- 테스트: dependency-cruiser + 단위 스캔 GREEN, 위반 0 유지

2. REF-04 Dead/Unused 코드 제거(배럴/유틸/컴포넌트)
   - 조치: unused-exports.scan 테스트 재활성/범위 확대, noUnusedLocals 확인
   - 테스트: 스캔 GREEN, 제거 후 타입/린트/테스트/빌드 GREEN

3. REF-05 스냅샷/중복 테스트 통합(기능 가드 유지)
   - 조치: 겹치는 스냅샷/구조 가드를 통합 테스트로 축소, 의미 중복 제거
   - 테스트: 통합 후 커버리지/행동 동등성 스모크 GREEN

4. REF-06 CSS 잔재/주석/레거시 토큰 제거
   - 조치: 레거시 클래스/주석 블록 삭제, 디자인 토큰 위반 스캐너로 회귀 가드
   - 테스트: design-token-violations, no-transition-all, theme coverage GREEN

5. REF-07 브릿지 에러 메시지/토스트 정책 잔재 제거
   - 전제: http\_<status> 포맷/라우팅 정책 표준화 완료(Completed 참조)
   - 조치: 구 정책 호환 브릿지/분기 제거, 메시지 상수 표준화만 유지
   - 테스트: 서비스 계약/토스트 라우팅 가드 GREEN

메트릭/검증

- 빌드: dev/prod + postbuild validator GREEN, dist 단일 파일(.user.js)·소스맵
  무결성
- 사이즈: gzip Δ ≤ +1%, 스크립트/테스트 중복 제거에 따라 유지/감소 기대
- 스캔: direct vendor import 0, touch/pointer 이벤트 0, Hex 0, transition: all 0

진행 규칙

- 각 작업 단위로 실패 테스트(스캔/계약)를 먼저 추가(RED) → 최소 변경으로 GREEN →
  래퍼/중복 제거(REFACTOR) → 문서에 완료 로그 1줄 요약 추가 및 본 계획서에서
  제거

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
