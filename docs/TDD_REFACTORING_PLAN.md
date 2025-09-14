# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-14 — 활성 Phase: 3건

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

1. UI-SHELL-DEDUP — Toolbar/Settings 단일 소스 정리

- 배경: `ToolbarWithSettings`(실사용) 외에 `UnifiedToolbar`/`ToolbarShell`
  스텁과 `SettingsModal`(실사용) 외에 `UnifiedSettingsModal` 스텁,
  `RefactoredSettingsModal` 잔존으로 개념이 분산됨.
- 목표: 런타임 소비 지점은 Toolbar/SettingsModal만 남기고, 나머지는 테스트 전용
  스텁 또는 제거.
- 장단점:
  - 장점: 공용 진입점 축소(번들/정신적 부하 감소), 테스트 안정성↑.
  - 단점: 레거시 스냅샷/테스트가 스텁에 의존 시 경로 교정 필요.
- 계획(TDD):
  - RED: grep 기반 유닛(정적 스캔) -
    `UnifiedToolbar|ToolbarShell|RefactoredSettingsModal` 사용처가 0이어야 함.
  - GREEN: 사용처 이관(필요 시 `UnifiedSettingsModal`은 tests-only export로
    이동), 미사용 파일 제거.
  - REFACTOR: `shared/components/ui/index.ts` 배럴 축약(두 진입점만 노출).
- DoD:
  - VerticalGalleryView가 `ToolbarWithSettings`만, 모든 소비처가
    `SettingsModal`만 사용.
  - 위 3개 심볼의 import 사용 0건(grep), 빌드/테스트/가드 GREEN.

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

3. SERVICE-DIAG-UNIFY — ServiceManager 진단 API 단일화

- 배경: `ServiceManager.ts`와 `core-services.ts`에 유사 진단 함수가 중복.
- 목표: 진단 엔트리(정적 메서드) 단일 소스로 통합하고, 나머지는 리다이렉트 또는
  제거.
- 장단점:
  - 장점: API 표면 축소, 문서화 단순화.
  - 단점: 드물게 사용되는 내부 스크립트 경로 교정 필요.
- 계획(TDD):
  - RED: 공개 진단 엔트리 1개만 노출됨을 스캔/유닛으로 보장.
  - GREEN: `core-services`의 진단 메서드를 thin-redirect 또는 제거.
  - REFACTOR: 사용처 업데이트 및 주석 정리.
- DoD: 진단 엔트리 1개, 타입/테스트/빌드 GREEN.

4. UNUSED-CODE-SWEEP — 미사용 파일/심볼 제거

- 대상(예시): `RefactoredSettingsModal.tsx`, 미사용 ToolbarShell CSS/Index 등.
- 계획(TDD):
  - RED: 정적 사용 스캔 + “존재하면 안 됨” 스냅샷 테스트 추가.
  - GREEN: 파일 제거.
  - REFACTOR: 배럴 export/문서 정리.
- DoD: 스캔 0건, 빌드/테스트 GREEN.

5. VENDOR-USAGE-SIMPLIFY — 와일드카드 import 축소

상태: 완료됨 → 완료 로그로 이관됨

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 본 문서에서 제거하고 완료 로그에 1줄 요약 추가.

-- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
