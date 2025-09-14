# TDD 리팩토링 활성 계획 (경량)

본 문서는 “유저스크립트에 적합한 복잡성”을 유지하기 위한 현재 활성 계획만
담습니다. 완료된 항목은 즉시 `TDD_REFACTORING_PLAN_COMPLETED.md`로 이관합니다.

업데이트: 2025-09-14 — 활성 Phase: 4건

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API는 명시적 타입
- 외부 의존성은 안전 getter 경유만 사용(preact/@preact/signals/fflate/GM\_\*)
- PC 전용 입력만 사용, 터치/포인터 금지(테스트 가드 유지)
- 디자인/모션/spacing/z-index는 전부 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델 통일: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase (2025-09)

1. TOAST-LEGACY-BRIDGE-REMOVAL

- 목적: `UnifiedToastManager` ↔ 레거시 `Toast.tsx` 간 동기화(legacyToasts)
  제거. 단일 소스(ToastManager)로 단순화.
- 접근: UI가 ToastManager를 직접 구독하도록 전환 → 레거시 bridge 삭제.
  마이그레이션 기간 동안 호환 어댑터를 선택적으로 제공.
- 장점: 중복 상태 제거, 번들/런타임 복잡도 감소. 단점: UI 연결부 변경 범위 존재.
- DoD: UI에서 legacyToasts 미사용, 테스트(a11y/live-region/토스트 라우팅) GREEN,
  번들 사이즈 ≤ 기존 ±0.3KB.

<!-- 2. SIGNALS-SAFE-FACTORY: 완료되어 완료 로그로 이동 -->

3. VENDOR-GUARD-02

- 목적: 외부 라이브러리 직접 import/require 잔존 여부 최종 정리(벤더 getter
  강제).
- 접근: 정적 스캔 테스트 강화 + 1건이라도 발견 시 실패. 필요 시 안전 getter
  확장.
- 장점: 모킹/TDZ 안전성 향상. 단점: 벤더 내부 어댑터 보완 필요 가능.
- DoD: src/\* 에서 preact/@preact/signals/preact/compat 직접 참조 0건, 테스트
  GREEN.

4. TOKEN-LEGACY-PRUNE-P1

- 목적: CSS 토큰의 Legacy alias를 1차 정리(문서/테스트와 동기화).
- 접근: 사용 실적 0인 alias 제거 → 영향 영역 테스트 보강 → 후속 P2에서 잔여
  alias 일괄 제거.
- 장점: 토큰 표면 축소, 유지보수성 향상. 단점: 회귀 위험 → TDD로 완화.
- DoD: “미사용 토큰 스캔” 테스트 0건 보고, 스타일 스위트 GREEN.

5. PHYS-REMOVE-LEGACY-ICON-DIR

- 목적: 역사적 호환을 위해 남겨둔 `src/shared/components/ui/Icon/icons/` 물리
  디렉터리 제거.
- 접근: 제거 전 레거시 경로 참조 스캔 테스트를 강화하고, 릴리즈 노트에 변경
  고지.
- 장점: 불필요 자산 제거, 혼란 감소. 단점: 사용자 정의 import가 있었다면 깨짐 →
  가드로 완화.
- DoD: 경로 스캔 0건, 빌드/테스트/포스트빌드 GREEN.

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 본 문서에서 제거하고 완료 로그에 1줄 요약 추가.

— 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
