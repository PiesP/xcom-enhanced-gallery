# TDD 리팩토링 활성 계획 (경량)

본 문서는 “유저스크립트에 적합한 복잡성”을 유지하기 위한 현재 활성 계획만
담습니다. 완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

업데이트: 2025-09-14 — 활성 Phase: 3건 (E1–E3)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API는 명시적 타입
- 외부 의존성은 안전 getter 경유만 사용(preact/@preact/signals/fflate/GM\_\*)
- PC 전용 입력만 사용, 터치/포인터 금지(테스트 가드 유지)
- 디자인/모션/spacing/z-index는 전부 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델 통일: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase (2025-09)

E1 — Event Surface Consolidation (단일 진입점 정리)

- 배경: 이벤트 계층에 중복 표면이 혼재함. `utils/events.ts` 내
  `GalleryEventManager`/`TwitterEventManager(=GalleryEventManager 별칭)`와
  `services/EventManager.ts` 내
  `EventManager`/`TwitterEventManager(=EventManager 별칭)`가 동시에 존재하여
  소비 계층에서 혼란을 유발할 수 있음.
- 목표: 외부 소비자는 오직 `EventManager`(service)만 사용하도록 일원화.
  `utils/events.ts`의 별칭/클래스는 내부 전용으로 강등(@deprecated)하고 배럴
  재노출을 차단.
- 옵션 비교:
  - A 유지: 두 경로 병존 — 장점: 변경 최소. 단점: 중복/혼란 지속, 정책 위반
    위험.
  - B 단계적 축소: utils 별칭에 @deprecated + 배럴 비노출, 금지 import 스캔 강화
    — 장점: 안전한 이행, 영향 범위 통제. 단점: 짧은 기간 표면 중복 허용.
  - C 일괄 통합: utils 클래스/별칭 제거, 서비스만 남김 — 장점: 가장 깔끔. 단점:
    리스크/범위 커서 회귀 가능.
- 결정: B (단계적 축소) — 다음 사이클에서 C 검토.
- TDD 진행:
  1.  RED: 금지 import 스캔 테스트 추가 —
      `@shared/utils/events`/`@shared/dom/DOMEventManager` 직접 import를 소스
      전역에서 금지(services 내부 예외만 허용).
  2.  GREEN: 배럴에서 utils/events의 TwitterEventManager 재노출 제거, JSDoc
      @deprecated 추가, 소비처를 `EventManager`로 스왑.
  3.  REFACTOR: `services/event-managers.ts` 등 배럴 정리, 문서 업데이트.
- DoD: 정적 스캔 가드 GREEN, 외부 소비 경로에서 EventManager만 노출, 전체
  테스트/빌드 PASS.

  상태: 문서/가이드라인 보강 및 utils @deprecated 표기 완료(코드/테스트는 다음
  단계).

E2 — Event Guard Hardening (정책 가드 보강)

- 배경: 이벤트 정책 가드가 존재하나, `TwitterEventManager` 명칭/별칭 경유 사용을
  명시적으로 차단하는 스캔이 없음.
- 목표: PC 전용 입력/휠 패시브 정책 가드 유지 + `TwitterEventManager` 명칭 직접
  사용 금지 스캔 추가(서비스 별칭 제외).
- 옵션 비교:
  - A 상태 유지 — 장점: 즉시 비용 0. 단점: 회귀 감지 누락 가능성.
  - B 스캔 강화 — 장점: 명명/경로 회귀 조기 감지. 단점: 테스트 유지 비용 소폭
    증가.
- 결정: B.
- TDD 진행: RED 스캐너 추가 → GREEN(소스 정리 후) → REFACTOR(테스트 주석/문서
  보강).
- DoD: 새 스캔 테스트 GREEN, 기존 이벤트 정책 가드와 충돌 없음.

  상태: 가이드라인에 금지 명칭/경로 명문화 완료(테스트 스캐너는 다음 단계).

E3 — Naming/Alias Prune (별칭 축소 및 용어 정리)

- 배경: 동일 명칭(`TwitterEventManager`)이 서로 다른 타입을 가리키는 중복 별칭이
  존재(utils vs services).
- 목표: 외부 공개 표면에서는 `TwitterEventManager` 명칭을 제거하고,
  `EventManager`만 사용. 내부 마이그레이션 기간에는 @deprecated 주석으로 가이드.
- 옵션 비교: Soft deprecate(문서/주석) vs Hard remove(즉시 제거)
- 결정: Soft deprecate → 다음 사이클에서 하드 제거 검토.
- TDD 진행: 타입 테스트(호환 alias 제거 시 오류 경계), 배럴 export 계약 테스트
  추가.
- DoD: 배럴에 `TwitterEventManager` 미노출, 컴파일/테스트/빌드 GREEN.

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 본 문서에서 제거하고 완료 로그에 1줄 요약 추가.

— 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
