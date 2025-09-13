# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-13 — 활성 Phase: (없음)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

현재 활성화된 Phase는 없습니다. 신규 항목은 백로그에서 선별하여 필요 시 다시
활성화합니다.

### [완료 이관됨] SETTINGS-MODAL-CLICK-HARDENING (간헐 미동작 수정)

- 목표: 툴바 설정 버튼 클릭 시 SettingsModal이 안정적으로 열리도록 신뢰성 향상.
- 선택지(요약):
  - 메모 비교(onOpenSettings 포함) — stale 핸들러 방지
  - onMouseDown 조기 트리거 — hover 경계 click 소실 완화
  - pointer 정책 변경/상위 캡처 — 영향 범위 큼(채택 안 함)
- 채택: 메모 비교 + onMouseDown. Button이 onMouseDown/Up을 타입/가드 포함해
  위임.
- DoD: 타입/린트/테스트 GREEN, PC 전용 이벤트 정책/접근성/토큰 가드 위반 없음,
  빌드 산출물 검증 PASS.
- 상태: 구현 완료 — 상세는 COMPLETED 문서 SETTINGS-MODAL-CLICK-HARDENING 항목
  참조.

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

-- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
