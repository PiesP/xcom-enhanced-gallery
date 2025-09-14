# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-14 — 활성 Phase: 2건

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

아래 Phase들은 “Userscript에 적합한 복잡성 유지(중복·분산·미사용 최소화)”를 목적
으로 합니다. 각 Phase는 짧은 RED → GREEN → REFACTOR 사이클을 전제합니다.

2. VENDOR-LEGACY-SUNSET — 동적 Vendor API 축소

- 배경: 정적(TDZ-safe) `vendor-api-safe`와 동적 `vendor-api`가 공존. 현재 기본
  export는 safe 경로이나 일부 유틸은 와일드카드 import를 사용.
- 목표: 런타임 경로에서 동적 API 사용 제거, 레거시 alias(`*Legacy`)는 테스트
  전용 유지 후 제거 예고.
- 장단점:
  - 장점: 코드 경로 단순화/트리셰이킹 향상, TDZ 이슈 원천 차단.
  - 단점: 극소수 레거시 테스트 교정 비용.
- 계획(TDD):
  - RED: 정적 스캔 테스트 —
    `getPreactLegacy|initializeVendorsLegacy|vendor-api.ts` 직접 사용 0건.
  - GREEN: `Toast.tsx` 등 `* as Vendors` 사용부를 필요 심볼 직접 import로 치환
    (`getPreact`, `getPreactHooks`).
  - REFACTOR: 레거시 export JSDoc에 제거 시점 명시, 사용량 메트릭 훅 추가(선택).
- DoD: 코드베이스에서 레거시 심볼 사용 0건, dev/prod 빌드/가드 GREEN.

3. UNUSED-CODE-SWEEP — 미사용 파일/심볼 제거

상태: 진행 — 테스트/스캔을 통해 남은 잔재를 제거합니다.

5. VENDOR-USAGE-SIMPLIFY — 와일드카드 import 축소

상태: 완료됨 → 완료 로그로 이관됨

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 본 문서에서 제거하고 완료 로그에 1줄 요약 추가.

-- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
