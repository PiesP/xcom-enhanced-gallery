# TDD 리팩토링 활성 계획

아래 항목들은 저장소 현황 점검 결과 도출된 고가치 리팩토링 과제입니다. 모든
항목은 TDD(RED→GREEN)로 진행하며, 완료 즉시
`docs/TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

## 활성 계획(2025-09-15 갱신)

1. TOAST-UNIFY-02 — 토스트 상태/API 단일화(중복 제거)

- 배경/문제: UI 계층 `shared/components/ui/Toast/Toast.tsx`가
  `addToast/removeToast/toasts` 상태를 노출하고 있으며, 서비스 계층
  `shared/services/UnifiedToastManager.ts`도 동일 API/상태를 제공합니다. 현재 UI
  배럴(`shared/components/ui/index.ts`)에서 함수/상태를 재노출하고 있어,
  “토스트는 통합 매니저만 사용한다” 정책과 상충합니다. 또한 `ToastItem` 타입이
  UI/서비스에 이중 정의되어 타입 드리프트 위험이 있습니다.
- 목표: 단일 소스(서비스: UnifiedToastManager)로 상태/함수를 통일하고, UI는 순수
  표현 컴포넌트만 유지합니다.
- 방식(TDD):
  - RED: 정적 스캔 테스트 추가 — 소스에서 `shared/components/ui/Toast/Toast`의
    `addToast|removeToast|toasts` 런타임 import를 금지. UI 배럴에서 해당 심볼
    재노출도 금지.
  - GREEN(최소 구현):
    - UI `Toast.tsx`의 `addToast/removeToast/toasts` export 제거, `ToastItem`은
      서비스 타입을 type-only import하여 사용.
    - UI 배럴(`shared/components/ui/index.ts`)에서 관련 함수/상태 재노출 제거.
      컴포넌트(`Toast`, `ToastContainer`)와 타입만 유지.
    - 필요한 소비처가 있다면 서비스의 동등
      API(`@shared/services/UnifiedToastManager`)로 대체.
  - 리팩터링: `StandardProps` 내 `toasts?: unknown[]` 잔존 속성 제거(의미
    없음·혼동 유발). 문서(CODING_GUIDELINES) 내 토스트 시스템 단일 소스 문구
    교차 확인.
- 수용 기준(DoD):
  - 단위/스캔 테스트 GREEN: UI 경로 함수/상태 import 0건, 배럴 금지 스캔 통과.
  - 타입/린트/빌드/포스트빌드 모두 PASS(기능 회귀 없음). 외부 소비자는 서비스
    경유 API만 사용.
- 장단점:
  - 장점: 중복 제거로 유지보수성↑, 상태 단일화로 버그/드리프트↓, 배럴 표면
    슬림화.
  - 단점: 기존(만약 존재) 소비처 마이그레이션 필요. 단기적으로 작은 변경량 발생.

2. TOAST-TYPE-CONSOLIDATE — `ToastItem` 타입 단일화 가드

- 배경/문제: `ToastItem`이 UI/서비스에 이중 정의되어 드리프트 위험.
- 방식(TDD):
  - RED: 계약 테스트 — UI가 서비스의 `ToastItem`을 type-only import하고, 로컬
    선언이 없는지 스캔.
  - GREEN: UI에서 서비스 타입만 사용하도록 변경(TOAST-UNIFY-02 구현 중 병합
    가능).
- 수용 기준: 타입/계약 테스트 GREEN, 서비스 타입 변경 시 UI가 자동 추종.
- 장단점: 타입 단일화로 안전성↑ / 로컬 독립성↓(하지만 정책과 합치).

3. UI-BARREL-HARDEN-02 — UI 배럴에서 상태성 함수 재노출 금지 가드

- 배경/문제: UI 배럴이 상태성 함수(토스트 API)를 재노출해 서비스 경계를
  흐립니다.
- 방식(TDD):
  - RED: 스캔 테스트 — `src/shared/components/ui/index.ts`에서
    `addToast|removeToast|toasts|clearAllToasts` 런타임 export를 금지.
  - GREEN: 배럴에서 해당 export 제거(TOAST-UNIFY-02와 동시 처리).
- 수용 기준: 스캔 GREEN, 공개 표면이 컴포넌트/타입 위주로 유지.

Note:

- 신규 이슈/개선 사항 발견 시 TDD(RED→GREEN) 원칙으로 활성 계획에 등록하고, 완료
  즉시 COMPLETED.md로 이관합니다.
