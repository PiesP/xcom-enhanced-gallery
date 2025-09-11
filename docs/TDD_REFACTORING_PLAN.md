# TDD 리팩토링 활성 계획 (경량)

본 문서는 "아직 완료되지 않은" 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`에 1줄 요약으로 이동합니다.

## 공통 가드 (불변)

- TypeScript strict 100%, 모든 공개 함수/서비스 명시적 반환 타입
- 외부 의존성: 전용 getter (preact / signals / fflate / GM\_\*) — 직접 import
  금지
- PC 전용 이벤트만 사용 (click | keydown | wheel | contextmenu)
- 디자인/모션/spacing/z-index는 토큰만 사용 (raw number/hex/ms 금지)
- Result status 모델 `success | partial | error | cancelled` 유지 (회귀 금지)

## 활성 목표 (요약)

현재 활성 Phase 없음. (직전 사이클 변경 사항 반영 완료)

## Phase 개요 (활성)

현재 활성 Phase 없음 (완료 항목은 완료 로그로 이관됨).

---

현재 옵션 Phase 명시 항목 없음 (모든 완료 또는 백로그로 이동).

## 브랜치 & TDD 규칙

향후 신규 Phase 착수 시:

1. feature branch: `phase/<n>-<slug>`
2. 커밋 순서: RED (실패 테스트) → GREEN (최소 구현) → REFACTOR (정리/최적화)
3. 병합 전 품질 게이트: 타입/린트/전체 테스트/사이즈 가드 PASS

## Definition of Done

DONE 판정 시 아래를 충족해야 합니다:

- RED → GREEN → REFACTOR 커밋 히스토리
- 전체 테스트 / 타입 / 린트 / 빌드 / 사이즈 예산 PASS
- 문서: 가이드라인/계획 동기화, 완료 로그 기록
- 계획 문서에서 해당 Phase 제거

## 추적 & 백로그

- 추가 성능/메모리/보안 심화 항목은 `TDD_REFACTORING_BACKLOG.md` 유지
- 선택 Phase(8,9)는 핵심 1–7 완료 후 우선순위 재평가

## 참고

- 완료 로그: `docs/TDD_REFACTORING_PLAN_COMPLETED.md`
- 백로그: `docs/TDD_REFACTORING_BACKLOG.md`

업데이트 일시: 2025-09-12 (활성 Phase 없음 상태)
