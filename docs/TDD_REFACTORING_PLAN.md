# TDD 리팩토링 활성 계획 (경량)

본 문서는 진행 중인 활성 Phase만 유지합니다. 완료된 항목은
`TDD_REFACTORING_PLAN_COMPLETED.md`로 즉시 이관합니다.

업데이트: 2025-09-12 — 활성 Phase: 없음 (MEM_PROFILE 완료 이관)

## 운영 원칙(불변)

- TypeScript strict 100%, 공개 API 명시적 반환 타입
- 외부 의존성은 전용 getter 경유(preact/signals/fflate/GM\_\*) — 직접 import
  금지
- PC 전용 입력만 사용(click/keydown/wheel/contextmenu)
- 디자인/모션/spacing/z-index 모두 토큰 기반만 사용(raw 숫자/hex/ms 금지)
- Result status 모델: 'success' | 'partial' | 'error' | 'cancelled'

## 활성 Phase

현재 활성 Phase는 없습니다. 다음 사이클 시작 시 본 문서에 활성 항목만 간결히
유지합니다.

## TDD 규칙과 브랜치

1. RED → GREEN → REFACTOR 순으로 커밋을 구성합니다.
2. 병합 전 필수 게이트: 타입/린트/전체 테스트/빌드/사이즈 가드 PASS.
3. 완료 시: 계획 문서에서 제거하고 완료 로그에 1줄 요약 추가.

## 참고 링크

- 완료 로그: docs/TDD_REFACTORING_PLAN_COMPLETED.md
- 백로그: docs/TDD_REFACTORING_BACKLOG.md
- 코딩 규칙: docs/CODING_GUIDELINES.md
